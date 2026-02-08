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
from pydantic import BaseModel, Field, ValidationError
from typing import List, Dict, Any
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


class EducationItem(BaseModel):
    institution: str = Field(default="Unknown Institution")
    degree: str = Field(default="-")
    major: str = Field(default="-")
    year: str = Field(default="-")

class ExperienceItem(BaseModel):
    company: str = Field(default="Unknown Company")
    role: str = Field(default="Unknown Role")
    duration: str = Field(default="-")
    details: str = Field(default="-")

class CandidateAnalysis(BaseModel):
    city: str = Field(default=None)
    current_role: str = Field(default=None)
    education: List[EducationItem] = Field(default_factory=list)
    experience: List[ExperienceItem] = Field(default_factory=list)
    skills: List[str] = Field(default_factory=list)
    verdict: str = Field(default="Analisis tidak tersedia.")
    summary: str = Field(default="Ringkasan tidak tersedia.")
    # Match score biasanya dihitung via Vector DB, tapi jika LLM diminta estimasi:
    match_score_estimate: int = Field(default=0) 

# --- 2. FUNGSI PEMBERSIH OUTPUT LLM (CRITICAL) ---
def clean_llm_response(raw_content: str) -> str:
    """
    Membersihkan output dari DeepSeek/LLM agar menjadi JSON murni.
    """
    # 1. Hapus tag <think>...</think> (Khusus DeepSeek R1)
    cleaned = re.sub(r'<think>.*?</think>', '', raw_content, flags=re.DOTALL)
    
    # 2. Hapus Markdown code blocks (```json ... ```)
    cleaned = re.sub(r'```json', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'```', '', cleaned)
    
    # 3. Trim whitespace
    cleaned = cleaned.strip()
    
    # 4. Ambil hanya bagian yang diawali '{' dan diakhiri '}'
    # Ini menjaga jika ada teks intro/outro yang lolos
    json_match = re.search(r'\{.*\}', cleaned, re.DOTALL)
    if json_match:
        return json_match.group(0)
    
    return cleaned

# --- 3. GENERATOR UTAMA ---
def generate_verdict(context: str, job_description: str) -> Dict[str, Any]:
    
    # Prompt yang memaksa struktur JSON
    system_prompt = """
    You are a strict JSON Resume Parser. 
    Extract data from the Candidate CV based on the Job Description.
    
    RULES:
    1. Output ONLY valid JSON.
    2. NO introductory text, NO markdown, NO <think> tags.
    3. If education/experience is missing, return empty arrays [].
    4. Use "Bahasa Indonesia" for 'verdict' and 'summary'.
    """
    
    user_prompt = f"""
    ### JOB DESCRIPTION:
    {job_description}

    ### CANDIDATE CV:
    {context}

    ### REQUIRED JSON STRUCTURE:
    {{
        "city": "City name or null",
        "current_role": "Current job title or null",
        "education": [
            {{"institution": "Univ Name", "degree": "Bachelor/Master", "major": "Major", "year": "2020-2024"}}
        ],
        "experience": [
            {{"company": "Company Name", "role": "Role Name", "duration": "2 Years", "details": "Key achievement..."}}
        ],
        "skills": ["Skill1", "Skill2"],
        "verdict": "Reasoning why candidate fits/fails (Bahasa Indonesia, max 2 sentences).",
        "summary": "Professional summary (Bahasa Indonesia, max 1 sentence).",
        "match_score_estimate": 85 (Integer 0-100 based on fit)
    }}
    """

    try:
        # Panggil API LLM (Sesuaikan client Anda)
        # Contoh menggunakan format OpenAI / DeepSeek
        response = client.chat.completions.create(
            model="tngtech/deepseek-r1t-chimera:free", # Atau model pilihan Anda
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.1, # Rendah agar deterministik
            max_tokens=2000
        )
        
        raw_content = response.choices[0].message.content

        # --- STEP KRUSIAL: CLEANING ---
        json_str = clean_llm_response(raw_content)

        # --- STEP KRUSIAL: VALIDASI PYDANTIC ---
        try:
            parsed_dict = json.loads(json_str)
            
            # Validasi & Auto-fix tipe data menggunakan Pydantic
            # Jika LLM mengembalikan string di field list, Pydantic akan error/mencoba fix
            validated_data = CandidateAnalysis(**parsed_dict)
            
            # Kembalikan sebagai Dictionary murni untuk Flask
            return validated_data.model_dump()

        except (json.JSONDecodeError, ValidationError) as e:
            print(f"Parsing Error: {str(e)}")
            print(f"Raw Content causing error: {raw_content}")
            # Fallback agar Frontend tidak crash (White Screen)
            return _get_fallback_data("Gagal memproses format CV.")

    except Exception as e:
        print(f"API Error: {str(e)}")
        return _get_fallback_data(f"Error sistem: {str(e)}")

def _get_fallback_data(reason: str) -> Dict[str, Any]:
    """Data dummy aman agar Frontend tetap jalan meski AI gagal"""
    return {
        "city": None,
        "current_role": "Unknown",
        "education": [],
        "experience": [],
        "skills": [],
        "verdict": reason,
        "summary": "Gagal mengambil data otomatis.",
        "match_score_estimate": 0
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
                city=extracted_data.get("city"),
                current_role=extracted_data.get("current_role"),
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
            candidate.city = extracted_data.get("city", candidate.city)
            candidate.current_role = extracted_data.get("current_role", candidate.current_role)
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