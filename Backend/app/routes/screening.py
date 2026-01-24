import os
import uuid
import json
import re
from datetime import datetime
from flask_jwt_extended import get_jwt, get_jwt_identity, verify_jwt_in_request
import numpy as np
import faiss
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
from openai import OpenAI
from sqlalchemy.exc import IntegrityError
import re 

from app import db
from app.models import Resume, Candidate, JobPosition, JobApplication

load_dotenv()

BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../"))

UPLOAD_FOLDER = os.path.join(BASE, "uploads")
INDEX_FOLDER = os.path.join(BASE, "indexes")
CHUNKS_FOLDER = os.path.join(BASE, "chunks")

ALLOWED_EXT = {"pdf"}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(INDEX_FOLDER, exist_ok=True)
os.makedirs(CHUNKS_FOLDER, exist_ok=True)

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENAI_API_KEY")
)

screening_bp = Blueprint("screening", __name__)
@screening_bp.before_request
def restrict_access_by_role():
    if request.method == "OPTIONS":
        return

    verify_jwt_in_request()

    claims = get_jwt()
    role = claims.get("role")

    # GET boleh HR & SUPER_USER
    if request.method == "GET":
        if role in ["HR", "SUPER_USER"]:
            return

    # Selain GET hanya SUPER_USER
    if role != "SUPER_USER":
        return jsonify({
            "status": 403,
            "message": "Access denied"
        }), 403




def job_to_text(job: JobPosition) -> str:
    """Mengubah JobPosition menjadi teks untuk embedding & LLM"""
    requirements = ", ".join(job.requirements or [])
    skills = ", ".join(job.required_skills or [])

    salary = ""
    if job.salary_min and job.salary_max:
        salary = f"Gaji {job.salary_min}-{job.salary_max} {job.salary_currency}"

    return f"""
    Posisi: {job.title}
    Departemen: {job.department}
    Level: {job.level}
    Lokasi: {job.location}
    Tipe Kerja: {job.employment_type}
    Prioritas: {job.priority}
    {salary}

    Deskripsi Pekerjaan:
    {job.job_description}

    Persyaratan:
    {requirements}

    Keahlian Wajib:
    {skills}
    """

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXT

def normalize_score(score):
    return int(round(max(0.0, min(1.0, score)) * 100))

def extract_candidate_name(filename):
    return os.path.splitext(filename)[0].replace("_", " ").replace("-", " ").title()

def extract_email(text):
    m = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text)
    return m.group(0) if m else None

def extract_phone(text):
    m = re.search(r'(\+62|62|0)8[1-9][0-9]{6,10}', text)
    return m.group(0) if m else None


def generate_verdict(context, job_description):
    """
    Prompt LLM yang diperbarui untuk menghasilkan struktur JSONB 
    yang sesuai dengan tabel Candidate.
    """
    prompt = f"""
    Anda adalah parser data CV otomatis. 
    Tugas: Ekstrak data dari teks CV di bawah dan cocokkan dengan Job Description.
    
    Output WAJIB berupa JSON valid dengan format persis seperti ini:
    {{
        "education": [{{"institution": "Nama Univ", "degree": "Gelar", "major": "Jurusan", "year": "Tahun"}}],
        "experience": [{{"company": "Nama Perusahaan", "role": "Posisi", "duration": "Lama kerja", "details": "Deskripsi singkat"}}],
        "skills": ["Skill 1", "Skill 2"],
        "verdict": "Alasan singkat (Bahasa Indonesia) mengapa kandidat ini cocok/tidak (maks 2 kalimat).",
        "summary": "Ringkasan profil profesional 1 kalimat."
    }}

    Aturan:
    1. Jika data tidak ada, isi dengan null atau [].
    2. JANGAN ada teks pengantar. Langsung kurung kurawal {{...}}.
    3. Pastikan JSON valid.

    === CV TEXT ===
    {context}

    === JOB DESCRIPTION ===
    {job_description}
    """

    try:
        res = client.chat.completions.create(
            model="meta-llama/llama-3.3-70b-instruct:free",
            messages=[
                {"role": "system", "content": "You are a strict JSON extractor. Output ONLY valid JSON. Do not use Markdown blocks."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,
            max_tokens=1000
        )

        content = res.choices[0].message.content.strip()

        json_match = re.search(r'\{.*\}', content, re.DOTALL)
        
        if json_match:
            json_str = json_match.group(0)
            return json.loads(json_str)
        else:
            # Jika regex gagal, coba parse langsung (mungkin raw json)
            return json.loads(content)

    except Exception as e:
        return {
            "education": [{"institution": "Unknown", "degree": "-", "major": "-", "year": "-"}],
            "experience": [{"company": "-", "role": "-", "duration": "-", "details": "-"}],
            "skills": [],
            "summary": "Gagal menganalisis profil secara otomatis.",
            "verdict": "Terjadi kesalahan saat parsing respons AI."
        }


def load_resume_meta(resume_id):
    r = db.session.get(Resume, resume_id)
    if not r:
        return None
    return {
        "id": r.id,
        "filename": r.filename,
        "index_path": r.index_path,
        "chunks_path": r.chunks_path,
        "raw_text": r.raw_text
    }


def save_candidate_result_structured(resume_id, job_id, meta, extracted_data, match_score):
    """
    Menyimpan data ke tabel Candidate (Master) dan JobApplication (Relasi Job).
    """
    try:
        # 1. Cek apakah Candidate sudah ada berdasarkan resume_id
        candidate = Candidate.query.filter_by(resume_id=resume_id).first()

        raw_text = meta["raw_text"]
        
        if not candidate:
            candidate = Candidate(
                resume_id=resume_id,
                name=extract_candidate_name(meta["filename"]),
                email=extract_email(raw_text) or "Not found",
                phone=extract_phone(raw_text) or "Not found",
                # Isi data terstruktur dari LLM
                education=extracted_data.get("education", []),
                experience=extracted_data.get("experience", []),
                skills=extracted_data.get("skills", []),
                summary=extracted_data.get("summary", ""),
                # Default empty
                certifications=[],
                languages=[],
                social_links={}
            )
            db.session.add(candidate)
            db.session.flush() # Agar kita dapat ID candidate
        else:
            # Update data candidate jika sudah ada (opsional, tergantung kebutuhan)
            candidate.education = extracted_data.get("education", [])
            candidate.experience = extracted_data.get("experience", [])
            candidate.skills = extracted_data.get("skills", [])
            candidate.summary = extracted_data.get("summary", "")

        # 2. Simpan/Update JobApplication (Many-to-Many)
        # Cek apakah sudah pernah apply ke job ini
        application = JobApplication.query.filter_by(
            candidate_id=candidate.id, 
            job_id=job_id
        ).first()

        if not application:
            application = JobApplication(
                candidate_id=candidate.id,
                job_id=job_id,
                match_score=match_score,
                ai_verdict=extracted_data.get("verdict", ""),
                status="Applied",  # Changed from 'Screening' to 'Applied' for consistency
                applied_at=datetime.utcnow()
            )
            db.session.add(application)
            db.session.flush()  # Get application ID
            
            # 3. Auto-progress journey to AI_SCREENING (since AI analysis is done)
            from app.routes.tracking import get_or_create_journey
            from app.models import RecruitmentStage, JourneyLog
            
            journey = get_or_create_journey(application.id)
            
            # Move to AI_SCREENING stage (AI analysis completed)
            journey.current_stage = RecruitmentStage.AI_SCREENING
            
            # Create log for AI_SCREENING completion
            ai_log = JourneyLog(
                journey_id=journey.id,
                previous_stage=RecruitmentStage.CV_SCREENING.value,
                new_stage=RecruitmentStage.AI_SCREENING.value,
                action="AI Screening completed",
                notes=f"AI Match Score: {match_score}%. {extracted_data.get('verdict', '')}",
                actor_name="AI System"
            )
            db.session.add(ai_log)
        else:
            # Jika sudah apply, update score dan verdict terbaru
            application.match_score = match_score
            application.ai_verdict = extracted_data.get("verdict", "")
            application.applied_at = datetime.utcnow()

        db.session.commit()
        return candidate, application

    except Exception as e:
        db.session.rollback()
        print(f"Database Error: {e}")
        raise e


@screening_bp.route("/upload_resume", methods=["POST"])
def upload_resume():
    if "file" not in request.files:
        return jsonify({"error": "file missing"}), 400

    f = request.files["file"]
    if not allowed_file(f.filename):
        return jsonify({"error": "invalid file"}), 400

    resume_id = str(uuid.uuid4())
    filename = secure_filename(f.filename)
    pdf_path = os.path.join(UPLOAD_FOLDER, f"{resume_id}_{filename}")
    f.save(pdf_path)

    from extractor import extract_text_from_pdf, chunk_text, embed_chunks

    text = extract_text_from_pdf(pdf_path)
    chunks = chunk_text(text, 800, 100)
    embeddings = embed_chunks(chunks)

    index = faiss.IndexFlatIP(embeddings.shape[1])
    index.add(embeddings)

    index_path = os.path.join(INDEX_FOLDER, f"{resume_id}.faiss")
    chunks_path = os.path.join(CHUNKS_FOLDER, f"{resume_id}.json")

    faiss.write_index(index, index_path)
    json.dump(chunks, open(chunks_path, "w", encoding="utf-8"), ensure_ascii=False)
    
    # Simpan Resume saja dulu
    r = Resume(
        id=resume_id,
        filename=filename,
        index_path=index_path,
        chunks_path=chunks_path,
        raw_text=text
    )
    db.session.add(r)
    db.session.commit()

    return jsonify({
        "id": resume_id,
        "status": "uploaded"
    })


@screening_bp.route("/match_resume", methods=["POST"])
def match_resume():
    data = request.get_json(force=True)
    resume_id = data.get("resume_id")
    job_id = data.get("job_id")  # <-- Prioritas
    job_description = data.get("job_description") # <-- Fallback

    if not resume_id:
        return jsonify({"error": "resume_id required"}), 400

    meta = load_resume_meta(resume_id)
    if not meta:
        return jsonify({"error": "resume not found"}), 404

    job = None

    # 1. Cari Job by ID
    if job_id:
        job = JobPosition.query.get(job_id)
    
    # 2. Fallback by Title (hanya jika ID tidak ada)
    if not job and job_description:
        job_title = job_description.split("-")[0].strip()
        job = JobPosition.query.filter(
            JobPosition.title.ilike(f"%{job_title}%"),
            JobPosition.available.is_(True),
            JobPosition.status == "active"
        ).first()

    if not job:
        return jsonify({"error": "Job position not found"}), 404

    from extractor import embed_query

    index = faiss.read_index(meta["index_path"])
    chunks = json.load(open(meta["chunks_path"], encoding="utf-8"))

    job_text = job_to_text(job)
    q_emb = embed_query(job_text)

    D, I = index.search(q_emb, min(5, len(chunks)))
    avg_score = float(np.mean(D[0])) if len(D[0]) else 0.0
    score = normalize_score(avg_score)

    context = "\n\n".join(chunks[i] for i in I[0][:3])

    # Extract Structured Data via LLM
    extracted_data = generate_verdict(context, job_text)

    # Simpan ke Database (Candidate & JobApplication)
    candidate, application = save_candidate_result_structured(
        resume_id=meta["id"],
        job_id=job.id,
        meta=meta,
        extracted_data=extracted_data,
        match_score=score
    )
    
    # Format Skills untuk response (flat list)
    skills_list = extracted_data.get("skills", [])
    
    # Format Education string untuk response cepat di tabel UI
    edu_list = extracted_data.get("education", [])
    edu_str = f"{edu_list[0]['degree']} {edu_list[0]['major']}" if edu_list else "Not found"
    
    # Format Experience string
    exp_list = extracted_data.get("experience", [])
    exp_str = f"{exp_list[0]['role']} at {exp_list[0]['company']}" if exp_list else "Not found"

    # Response JSON
    return jsonify({
        "id": candidate.id,
        "name": candidate.name,
        "email": candidate.email,
        "phone": candidate.phone,
        "education": edu_str, # String ringkas untuk tabel UI
        "experience": exp_str, # String ringkas untuk tabel UI
        "skills": skills_list,
        "verdict": application.ai_verdict,
        "match_score": application.match_score,
        "top_position": job.title, # Helper frontend
        "application_status": application.status
    })


@screening_bp.route("/candidates", methods=["GET"])
def list_candidates():
    """
    Mengambil daftar kandidat. 
    Karena relasi sekarang Many-to-Many, kita idealnya perlu filter by job_id.
    Namun untuk tampilan 'Semua Kandidat', kita bisa join tabel.
    """
    # Opsional: Filter by job_id jika dikirim param
    job_id = request.args.get('job_id')
    
    query = db.session.query(Candidate, JobApplication, JobPosition)\
        .join(JobApplication, Candidate.id == JobApplication.candidate_id)\
        .join(JobPosition, JobApplication.job_id == JobPosition.id)
        
    if job_id:
        query = query.filter(JobApplication.job_id == job_id)
        
    results = query.order_by(JobApplication.match_score.desc()).all()

    output = []
    for cand, app, job in results:
        # Helper string formatting
        edu = cand.education[0] if cand.education else {}
        edu_str = f"{edu.get('degree', '')} {edu.get('major', '')}" if edu else "-"
        
        exp = cand.experience[0] if cand.experience else {}
        exp_str = f"{exp.get('role', '')}" if exp else "-"

        output.append({
            "id": cand.id,
            "resume_id": cand.resume_id,
            "name": cand.name,
            "email": cand.email,
            "phone": cand.phone,
            "education": edu_str,
            "experience": exp_str,
            "skills": cand.skills, # JSONB List
            "top_position": job.title,
            "match_score": app.match_score,
            "verdict": app.ai_verdict,
            "application_status": app.status,
            "created_at": app.applied_at.isoformat()
        })
        
    return jsonify(output)