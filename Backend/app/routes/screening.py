import os
import uuid
import json
import re
from datetime import datetime
from flask_jwt_extended import get_jwt, verify_jwt_in_request
import numpy as np
import faiss
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
from openai import OpenAI
from sqlalchemy.exc import IntegrityError

from app import db
from app.models import Resume, Candidate, JobPosition, JobApplication
# Pastikan Anda mengimpor extractor helper Anda
# from extractor import extract_text_from_pdf, chunk_text, embed_chunks, embed_query

load_dotenv()

BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../"))
UPLOAD_FOLDER = os.path.join(BASE, "uploads")
INDEX_FOLDER = os.path.join(BASE, "indexes")
CHUNKS_FOLDER = os.path.join(BASE, "chunks")
ALLOWED_EXT = {"pdf"}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(INDEX_FOLDER, exist_ok=True)
os.makedirs(CHUNKS_FOLDER, exist_ok=True)

# Konfigurasi Client (DeepSeek via OpenRouter / Local)
client = OpenAI(
    base_url="https://openrouter.ai/api/v1", # Atau URL lokal Anda
    api_key=os.getenv("OPENAI_API_KEY")
)

screening_bp = Blueprint("screening", __name__)

@screening_bp.before_request
def restrict_access_by_role():
    if request.method == "OPTIONS":
        return

    try:
        verify_jwt_in_request()
        claims = get_jwt()
        role = claims.get("role")

        if request.method == "GET":
            if role in ["HR", "SUPER_USER"]:
                return

        if role != "SUPER_USER" and role != "HR": # Asumsi HR boleh POST screening
             return jsonify({"status": 403, "message": "Access denied"}), 403
    except:
        return jsonify({"status": 401, "message": "Unauthorized"}), 401

# --- HELPER FUNCTIONS ---

def job_to_text(job: JobPosition) -> str:
    """Mengubah JobPosition menjadi teks string untuk konteks LLM"""
    requirements = ", ".join(job.requirements or [])
    skills = ", ".join(job.required_skills or [])
    
    salary = ""
    if job.salary_min and job.salary_max:
        salary = f"Range Gaji: {job.salary_min} - {job.salary_max} {job.salary_currency}"

    return f"""
    Judul Posisi: {job.title}
    Level: {job.level}
    Deskripsi: {job.job_description}
    Persyaratan: {requirements}
    Skill Wajib: {skills}
    {salary}
    """

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXT

def normalize_score(score):
    """Normalisasi cosine similarity (-1 ke 1) menjadi persentase (0-100)"""
    # FAISS Inner Product biasanya tidak ternormalisasi sempurna jika vektor tidak ternormalisasi
    # Asumsi range aman 0.0 - 1.0
    return int(round(max(0.0, min(1.0, score)) * 100))

def extract_candidate_name(filename):
    # Fallback jika LLM gagal ambil nama, ambil dari nama file
    base = os.path.splitext(filename)[0]
    # Hapus UUID di depan jika ada format (uuid_filename)
    if "_" in base:
        parts = base.split("_", 1)
        if len(parts) > 1 and len(parts[0]) > 20: # Asumsi UUID panjang
            base = parts[1]
    return base.replace("-", " ").title()

# --- CORE AI LOGIC ---

def generate_verdict(cv_text, job_description):
    """
    System Prompt yang disesuaikan agar output JSON valid untuk Frontend React.
    Menggunakan teknik 'Few-Shot' implisit dalam instruksi JSON.
    """
    
    # SYSTEM PROMPT YANG DIPERBAIKI
    system_instruction = """
    Anda adalah HR AI Specialist. Tugas Anda adalah mengekstrak informasi terstruktur dari teks Resume (CV) 
    dan mencocokkannya dengan Job Description.

    OUTPUT WAJIB: Hanya format JSON valid. Jangan berikan teks pembuka/penutup atau markdown ```json.
    
    STRUCTURE JSON TARGET:
    {
        "name": "Nama Lengkap Kandidat (Title Case)",
        "email": "Email kandidat (jika ada, else null)",
        "phone": "Nomor HP (jika ada, else null)",
        "city": "Kota domisili saat ini (jika ada, else null)",
        "current_role": "Jabatan/Posisi pekerjaan terakhir (jika ada, else null)",
        "education": [
            { "institution": "Nama Universitas/Sekolah", "degree": "Gelar (S1/D3/SMA)", "major": "Jurusan", "year": "Tahun Lulus/Periode" }
        ],
        "experience": [
            { "company": "Nama Perusahaan", "role": "Posisi", "duration": "Durasi (cth: Jan 2020 - Present)", "details": "Ringkasan tugas utama (maks 15 kata)" }
        ],
        "skills": ["Skill 1", "Skill 2", "Skill 3 (ambil top 5-7 skill teknis relevan)"],
        "summary": "Ringkasan profil profesional kandidat dalam 1 kalimat padat.",
        "verdict": "Analisis singkat (Bahasa Indonesia) mengapa kandidat ini cocok/tidak dengan Job Description (maks 2-3 kalimat)."
    }

    ATURAN:
    1. Jika informasi (seperti education/experience) tidak ada di teks, kembalikan array kosong [].
    2. Jangan halusinasi data. Jika tidak tertulis, isi null.
    3. Verdict harus kritis namun sopan.
    """

    user_prompt = f"""
    === JOB DESCRIPTION ===
    {job_description}

    === CANDIDATE RESUME TEXT ===
    {cv_text}
    """

    try:
        response = client.chat.completions.create(
            model="deepseek/deepseek-r1-0528:free", # Atau model yang Anda gunakan
            messages=[
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.1, # Rendah agar deterministik
            max_tokens=2000
        )

        content = response.choices[0].message.content.strip()
        
        # DeepSeek sering memberikan <think>...</think>. Kita harus membersihkannya.
        # Dan mengambil JSON object pertama yang ditemukan.
        
        # 1. Hapus tag <think> jika ada
        content = re.sub(r'<think>.*?</think>', '', content, flags=re.DOTALL)
        
        # 2. Cari kurung kurawal terluar
        json_match = re.search(r'\{.*\}', content, re.DOTALL)
        
        if json_match:
            json_str = json_match.group(0)
            return json.loads(json_str)
        else:
            # Fallback jika format rusak
            print("Failed to regex JSON from LLM output:", content)
            return {}

    except Exception as e:
        print(f"LLM Error: {e}")
        return {}


def save_candidate_result_structured(resume_id, job_id, meta, extracted_data, match_score):
    """
    Menyimpan hasil ke database. Memetakan JSON LLM ke Model Database.
    """
    try:
        # 1. Cek atau Buat Candidate
        candidate = Candidate.query.filter_by(resume_id=resume_id).first()
        
        # Ambil data dari LLM, dengan fallback aman
        name = extracted_data.get("name") or extract_candidate_name(meta["filename"])
        email = extracted_data.get("email") or "Not provided"
        phone = extracted_data.get("phone") or "Not provided"
        city = extracted_data.get("city") # Field baru
        current_role = extracted_data.get("current_role") # Field baru
        
        if not candidate:
            candidate = Candidate(
                resume_id=resume_id,
                name=name,
                email=email,
                phone=phone,
                # Pastikan Model Candidate Anda mendukung kolom ini, atau simpan di json field
                education=extracted_data.get("education", []),
                experience=extracted_data.get("experience", []),
                skills=extracted_data.get("skills", []),
                summary=extracted_data.get("summary", ""),
                
                # Mapping field baru (jika DB mendukung, jika tidak hapus baris ini)
                city=city,
                current_role=current_role,
            )
            db.session.add(candidate)
            db.session.flush()
        else:
            # Update data jika parsing baru lebih baik
            candidate.name = name
            candidate.email = email
            candidate.education = extracted_data.get("education", [])
            candidate.experience = extracted_data.get("experience", [])
            candidate.skills = extracted_data.get("skills", [])
            candidate.summary = extracted_data.get("summary", "")
            candidate.city = city
            candidate.current_role = current_role

        # 2. Simpan JobApplication
        application = JobApplication.query.filter_by(
            candidate_id=candidate.id, 
            job_id=job_id
        ).first()

        verdict = extracted_data.get("verdict", "Evaluasi otomatis selesai.")

        if not application:
            application = JobApplication(
                candidate_id=candidate.id,
                job_id=job_id,
                match_score=match_score,
                ai_verdict=verdict,
                status="Applied",
                applied_at=datetime.utcnow()
            )
            db.session.add(application)
        else:
            # Update score & verdict jika re-analyze
            application.match_score = match_score
            application.ai_verdict = verdict
            application.applied_at = datetime.utcnow()

        db.session.commit()
        return candidate, application

    except Exception as e:
        db.session.rollback()
        print(f"Database Save Error: {e}")
        raise e

# --- ROUTES ---

@screening_bp.route("/upload_resume", methods=["POST"])
def upload_resume():
    if "file" not in request.files:
        return jsonify({"error": "file missing"}), 400

    f = request.files["file"]
    if not allowed_file(f.filename):
        return jsonify({"error": "invalid file type"}), 400

    # Gunakan UUID untuk nama file unik
    unique_id = str(uuid.uuid4())
    secure_name = secure_filename(f.filename)
    # Simpan ID di depan nama file agar bisa diparsing balik jika perlu, tapi simpan original name di DB
    saved_filename = f"{unique_id}_{secure_name}"
    
    pdf_path = os.path.join(UPLOAD_FOLDER, saved_filename)
    f.save(pdf_path)

    # Lakukan Ekstraksi Teks dan Embedding (Asumsi fungsi ini ada di project Anda)
    try:
        from extractor import extract_text_from_pdf, chunk_text, embed_chunks
        
        text = extract_text_from_pdf(pdf_path)
        # Bersihkan teks sedikit agar tidak terlalu kotor
        text = re.sub(r'\s+', ' ', text).strip()
        
        chunks = chunk_text(text, chunk_size=800, overlap=100)
        embeddings = embed_chunks(chunks)

        # Buat Index FAISS
        dimension = embeddings.shape[1]
        index = faiss.IndexFlatIP(dimension)
        index.add(embeddings)

        index_path = os.path.join(INDEX_FOLDER, f"{unique_id}.faiss")
        chunks_path = os.path.join(CHUNKS_FOLDER, f"{unique_id}.json")

        faiss.write_index(index, index_path)
        with open(chunks_path, "w", encoding="utf-8") as json_file:
            json.dump(chunks, json_file, ensure_ascii=False)
        
        # Simpan ke DB Resume
        resume = Resume(
            id=unique_id,
            filename=secure_name, # Simpan nama asli agar cantik di UI
            index_path=index_path,
            chunks_path=chunks_path,
            raw_text=text
        )
        db.session.add(resume)
        db.session.commit()

        return jsonify({
            "id": unique_id,
            "filename": secure_name,
            "status": "uploaded"
        })
    except Exception as e:
        print(f"Upload processing error: {e}")
        return jsonify({"error": str(e)}), 500


@screening_bp.route("/match_resume", methods=["POST"])
def match_resume():
    try:
        data = request.get_json(force=True)
        resume_id = data.get("resume_id")
        job_id = data.get("job_id")
        job_desc_fallback = data.get("job_description")

        if not resume_id:
            return jsonify({"error": "resume_id required"}), 400

        # 1. Load Resume Data
        resume = db.session.get(Resume, resume_id)
        if not resume:
            return jsonify({"error": "resume not found"}), 404
        
        meta = {
            "id": resume.id,
            "filename": resume.filename,
            "index_path": resume.index_path,
            "chunks_path": resume.chunks_path,
            "raw_text": resume.raw_text
        }

        # 2. Load Job Data
        job = None
        if job_id:
            job = JobPosition.query.get(job_id)
        
        # Gunakan fallback text jika Job ID tidak valid/tidak ditemukan
        if job:
            job_context = job_to_text(job)
            job_title = job.title
        elif job_desc_fallback:
            job_context = job_desc_fallback
            job_title = "Custom Position"
            # Perlu dummy ID atau handle logic tanpa DB relation (disini kita skip logic kompleks itu)
            return jsonify({"error": "Job ID required for persistence"}), 400
        else:
            return jsonify({"error": "Job context missing"}), 400

        # 3. Vector Search (FAISS)
        from extractor import embed_query # Pastikan import ini ada
        
        index = faiss.read_index(meta["index_path"])
        with open(meta["chunks_path"], "r", encoding="utf-8") as f:
            chunks = json.load(f)

        q_emb = embed_query(job_context)
        
        # Ambil top 3-5 chunks paling relevan untuk dikirim ke LLM
        k = min(5, len(chunks))
        D, I = index.search(q_emb, k)
        
        # Hitung Score
        avg_score = float(np.mean(D[0])) if len(D[0]) > 0 else 0.0
        score_percent = normalize_score(avg_score)

        # Context untuk LLM (Gabungkan chunks relevan + sedikit raw text awal untuk header info)
        relevant_context = "\n...\n".join([chunks[i] for i in I[0] if i >= 0])
        full_context = f"{meta['raw_text'][:1000]}\n\n--- RELEVANT SECTIONS ---\n{relevant_context}"

        # 4. LLM Extraction
        extracted_data = generate_verdict(full_context, job_context)

        # 5. Save to DB
        candidate, application = save_candidate_result_structured(
            resume_id=meta["id"],
            job_id=job.id,
            meta=meta,
            extracted_data=extracted_data,
            match_score=score_percent
        )

        # 6. Response Format (Sesuai Frontend CVCandidate Interface)
        return jsonify({
            "id": candidate.id,
            "resume_id": candidate.resume_id,
            "name": candidate.name,
            "email": candidate.email,
            "phone": candidate.phone,
            "city": candidate.city,                 # New Field
            "current_role": candidate.current_role, # New Field
            "education": candidate.education,       # JSON Array
            "experience": candidate.experience,     # JSON Array
            "skills": candidate.skills,             # String Array
            "summary": candidate.summary,
            "top_position": job_title,
            "match_score": application.match_score,
            "verdict": application.ai_verdict,
            "created_at": application.applied_at.isoformat(),
            "application_status": application.status
        })

    except Exception as e:
        print(f"Match error: {e}")
        return jsonify({"error": "Internal Server Error during matching"}), 500


@screening_bp.route("/candidates", methods=["GET"])
def list_candidates():
    job_id = request.args.get('job_id')
    
    query = db.session.query(Candidate, JobApplication, JobPosition)\
        .join(JobApplication, Candidate.id == JobApplication.candidate_id)\
        .join(JobPosition, JobApplication.job_id == JobPosition.id)
        
    if job_id:
        query = query.filter(JobApplication.job_id == job_id)
        
    results = query.order_by(JobApplication.match_score.desc()).all()

    output = []
    for cand, app, job in results:
        output.append({
            "id": cand.id,
            "resume_id": cand.resume_id,
            "name": cand.name,
            "email": cand.email,
            "phone": cand.phone,
            "city": getattr(cand, 'city', None),                 # Safely get if column exists
            "current_role": getattr(cand, 'current_role', None), # Safely get if column exists
            "education": cand.education,   # Pastikan DB menyimpan JSON, bukan string
            "experience": cand.experience, # Pastikan DB menyimpan JSON, bukan string
            "skills": cand.skills,
            "summary": cand.summary,
            "top_position": job.title,
            "match_score": app.match_score,
            "verdict": app.ai_verdict,
            "application_status": app.status,
            "created_at": app.applied_at.isoformat()
        })
        
    return jsonify(output)