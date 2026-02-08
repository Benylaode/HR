import os
import uuid
import json
import re
from datetime import datetime
from typing import List, Dict, Any, Union

import numpy as np
import faiss
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
from openai import OpenAI
from sqlalchemy.exc import IntegrityError
from flask_jwt_extended import get_jwt, verify_jwt_in_request

# --- Pydantic & Validation Imports ---
from pydantic import BaseModel, Field, ValidationError, field_validator

# --- App Imports ---
# Pastikan path import ini sesuai dengan struktur project Anda
from app import db
from app.models import Resume, Candidate, JobPosition, JobApplication, RecruitmentStage, JourneyLog

# Import utilitas extractor lokal
# Jika file ini belum ada, pastikan Anda membuatnya atau sesuaikan importnya
from extractor import extract_text_from_pdf, chunk_text, embed_chunks, embed_query

load_dotenv()

# --- Configuration ---
BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../"))
UPLOAD_FOLDER = os.path.join(BASE, "uploads")
INDEX_FOLDER = os.path.join(BASE, "indexes")
CHUNKS_FOLDER = os.path.join(BASE, "chunks")
ALLOWED_EXT = {"pdf"}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(INDEX_FOLDER, exist_ok=True)
os.makedirs(CHUNKS_FOLDER, exist_ok=True)

# Konfigurasi Client AI
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENAI_API_KEY")
)

screening_bp = Blueprint("screening", __name__)

# --- 1. AUTHORIZATION DECORATOR ---
@screening_bp.before_request
def restrict_access_by_role():
    if request.method == "OPTIONS":
        return
    
    try:
        verify_jwt_in_request()
        claims = get_jwt()
        role = claims.get("role")
        
        # HR & Super User boleh GET
        if request.method == "GET":
            if role in ["HR", "SUPER_USER"]:
                return
        
        # Hanya Super User / HR yang boleh melakukan aksi POST (Upload/Match)
        if role not in ["SUPER_USER", "HR"]:
            return jsonify({"status": 403, "message": "Access denied"}), 403
            
    except Exception as e:
        return jsonify({"status": 401, "message": "Unauthorized"}), 401

# --- 2. HELPER FUNCTIONS ---
def job_to_text(job: JobPosition) -> str:
    """Mengubah JobPosition menjadi teks untuk embedding & LLM"""
    requirements = ", ".join(job.requirements or [])
    skills = ", ".join(job.required_skills or [])
    salary = f"Gaji {job.salary_min}-{job.salary_max} {job.salary_currency}" if job.salary_min else ""

    return f"""
    Posisi: {job.title}
    Departemen: {job.department}
    Level: {job.level}
    Lokasi: {job.location}
    Tipe Kerja: {job.employment_type}
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

# --- 3. ROBUST PYDANTIC MODELS ---

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

class FlexibleCandidateAnalysis(BaseModel):
    city: Union[str, None] = Field(default=None)
    current_role: Union[str, None] = Field(default="Unknown")
    
    # Toleransi tinggi: terima List of objects, List of strings, atau String
    education: Union[List[EducationItem], List[Dict], str, List[str]] = Field(default_factory=list)
    experience: Union[List[ExperienceItem], List[Dict], str, List[str]] = Field(default_factory=list)
    
    skills: List[str] = Field(default_factory=list)
    verdict: str = Field(default="Analisis tersedia.")
    summary: str = Field(default="-")
    match_score_estimate: int = Field(default=0)

    # Validator: Mengubah sampah string menjadi List kosong
    @field_validator('education', 'experience', mode='before')
    def sanitize_list_fields(cls, v):
        if isinstance(v, str):
            return [] # Ubah string "Tidak ada" menjadi []
        if isinstance(v, list):
            # Cek jika list berisi string sampah ["Data tidak ditemukan"]
            if len(v) > 0 and isinstance(v[0], str) and len(v[0]) < 30 and "tidak" in v[0].lower():
                return []
        return v

# --- 4. LLM CLEANING & GENERATION ---

def clean_llm_response(raw_text: str) -> str:
    """Membersihkan output Llama-3/DeepSeek dari teks intro/outro"""
    try:
        # 1. Hapus <think> (DeepSeek)
        text = re.sub(r'<think>.*?</think>', '', raw_text, flags=re.DOTALL)
        
        # 2. Hapus Markdown Code Blocks
        text = re.sub(r'```json', '', text, flags=re.IGNORECASE)
        text = re.sub(r'```', '', text)
        
        # 3. Cari { pertama dan } terakhir
        start_idx = text.find('{')
        end_idx = text.rfind('}')
        
        if start_idx == -1 or end_idx == -1:
            return text.strip()
            
        return text[start_idx : end_idx + 1]
    except Exception:
        return raw_text

def _fallback_result(reason: str):
    return {
        "city": None,
        "current_role": "Unknown",
        "education": [],
        "experience": [],
        "skills": [],
        "verdict": f"Gagal parsing otomatis: {reason}",
        "summary": "Data gagal diekstrak.",
        "match_score_estimate": 0
    }

def generate_verdict(context: str, job_description: str) -> Dict[str, Any]:
    """Fungsi utama pemanggil AI dengan proteksi anti-crash"""
    
    system_prompt = """
    You are a strict JSON Resume Parser. 
    Extract data from the Candidate CV based on the Job Description.

    CRITICAL RULES:
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
            {{"company": "Company Name", "role": "Role Name", "duration": "Duration", "details": "Summary"}}
        ],
        "skills": ["Skill1", "Skill2"],
        "verdict": "Reasoning why candidate fits/fails (Bahasa Indonesia, max 2 sentences).",
        "summary": "Professional summary (Bahasa Indonesia, max 1 sentence).",
        "match_score_estimate": 85
    }}
    """

    try:
        response = client.chat.completions.create(
        # model="meta-llama/llama-3.3-70b-instruct:free", 
            model = "deepseek/deepseek-r1-0528:free",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.1,
            max_tokens=2000
        )
        
        raw_content = response.choices[0].message.content
        json_str = clean_llm_response(raw_content)

        try:
            parsed_dict = json.loads(json_str)
            # Validasi Pydantic (akan auto-correct tipe data)
            validated_data = FlexibleCandidateAnalysis(**parsed_dict)
            return validated_data.model_dump()

        except json.JSONDecodeError:
            print(f"JSON Error. Raw: {json_str[:100]}...")
            return _fallback_result("Format JSON rusak.")
        except ValidationError as e:
            print(f"Validation Error: {e}")
            return _fallback_result("Struktur data tidak valid.")

    except Exception as e:
        print(f"API Error: {str(e)}")
        return _fallback_result(f"Error sistem: {str(e)}")

# --- 5. DATABASE HANDLERS ---

def load_resume_meta(resume_id):
    r = db.session.get(Resume, resume_id)
    if not r: return None
    return {
        "id": r.id, "filename": r.filename,
        "index_path": r.index_path, "chunks_path": r.chunks_path,
        "raw_text": r.raw_text
    }

def save_candidate_result_structured(resume_id, job_id, meta, extracted_data, match_score):
    """Menyimpan hasil ke DB dan update Journey Tracking"""
    try:
        # 1. Update/Create Candidate
        candidate = Candidate.query.filter_by(resume_id=resume_id).first()
        raw_text = meta["raw_text"]
        
        # Gunakan get dengan default untuk keamanan
        cand_data = {
            "city": extracted_data.get("city"),
            "current_role": extracted_data.get("current_role"),
            "education": extracted_data.get("education", []),
            "experience": extracted_data.get("experience", []),
            "skills": extracted_data.get("skills", []),
            "summary": extracted_data.get("summary", "")
        }

        if not candidate:
            candidate = Candidate(
                resume_id=resume_id,
                name=extract_candidate_name(meta["filename"]),
                email=extract_email(raw_text) or "Not found",
                phone=extract_phone(raw_text) or "Not found",
                **cand_data,
                certifications=[],
                languages=[],
                social_links={}
            )
            db.session.add(candidate)
            db.session.flush()
        else:
            # Update field yang baru
            for key, val in cand_data.items():
                setattr(candidate, key, val)

        # 2. Update/Create Job Application
        application = JobApplication.query.filter_by(
            candidate_id=candidate.id, job_id=job_id
        ).first()

        verdict_text = extracted_data.get("verdict", "")

        if not application:
            application = JobApplication(
                candidate_id=candidate.id,
                job_id=job_id,
                match_score=match_score,
                ai_verdict=verdict_text,
                status="Applied",
                applied_at=datetime.utcnow()
            )
            db.session.add(application)
            db.session.flush()

            # 3. Update Journey (Auto-move to AI Screening)
            from app.routes.tracking import get_or_create_journey
            
            journey = get_or_create_journey(application.id)
            journey.current_stage = RecruitmentStage.AI_SCREENING
            
            ai_log = JourneyLog(
                journey_id=journey.id,
                previous_stage=RecruitmentStage.CV_SCREENING.value,
                new_stage=RecruitmentStage.AI_SCREENING.value,
                action="AI Screening Completed",
                notes=f"Score: {match_score}%. {verdict_text}",
                actor_name="AI System"
            )
            db.session.add(ai_log)
        else:
            application.match_score = match_score
            application.ai_verdict = verdict_text
            application.applied_at = datetime.utcnow()

        db.session.commit()
        return candidate, application

    except Exception as e:
        db.session.rollback()
        print(f"DB Error: {e}")
        raise e

# --- 6. ROUTES ---

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

    # Proses Ekstraksi & Embedding
    try:
        text = extract_text_from_pdf(pdf_path)
        chunks = chunk_text(text, 800, 100)
        embeddings = embed_chunks(chunks)

        index = faiss.IndexFlatIP(embeddings.shape[1])
        index.add(embeddings)

        index_path = os.path.join(INDEX_FOLDER, f"{resume_id}.faiss")
        chunks_path = os.path.join(CHUNKS_FOLDER, f"{resume_id}.json")

        faiss.write_index(index, index_path)
        json.dump(chunks, open(chunks_path, "w", encoding="utf-8"), ensure_ascii=False)
        
        r = Resume(
            id=resume_id,
            filename=filename,
            index_path=index_path,
            chunks_path=chunks_path,
            raw_text=text
        )
        db.session.add(r)
        db.session.commit()

        return jsonify({"id": resume_id, "status": "uploaded"})
        
    except Exception as e:
        print(f"Error processing PDF: {e}")
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

        meta = load_resume_meta(resume_id)
        if not meta:
            return jsonify({"error": "resume not found"}), 404

        # Cari Job
        job = None
        if job_id:
            job = JobPosition.query.get(job_id)
        
        if not job and job_desc_fallback:
            # Fallback cari berdasarkan nama dari text
            job_title = job_desc_fallback.split("-")[0].strip()
            job = JobPosition.query.filter(
                JobPosition.title.ilike(f"%{job_title}%"),
                JobPosition.status == "active"
            ).first()

        if not job:
            return jsonify({"error": "Job position not found"}), 404

        # Vector Search untuk Match Score
        index = faiss.read_index(meta["index_path"])
        chunks = json.load(open(meta["chunks_path"], encoding="utf-8"))
        
        job_text = job_to_text(job)
        q_emb = embed_query(job_text)
        
        D, I = index.search(q_emb, min(5, len(chunks)))
        avg_score = float(np.mean(D[0])) if len(D[0]) else 0.0
        score = normalize_score(avg_score)
        
        # Ambil context terbaik untuk LLM
        context = "\n\n".join(chunks[i] for i in I[0][:3])

        # LLM Extraction (Robust)
        extracted_data = generate_verdict(context, job_text)

        # Save to DB
        candidate, application = save_candidate_result_structured(
            resume_id=meta["id"],
            job_id=job.id,
            meta=meta,
            extracted_data=extracted_data,
            match_score=score
        )
        
        # Return formatted JSON for Frontend
        return jsonify({
            "id": candidate.id,
            "name": candidate.name,
            "email": candidate.email,
            "phone": candidate.phone,
            
            # Kirim Full List object
            "education": candidate.education, 
            "experience": candidate.experience, 
            "skills": candidate.skills,
            
            "city": candidate.city,
            "current_role": candidate.current_role,
            "verdict": application.ai_verdict,
            "match_score": application.match_score,
            "top_position": job.title,
            "application_status": application.status
        })
        
    except Exception as e:
        print(f"Match Error: {e}")
        return jsonify({"error": str(e)}), 500


@screening_bp.route("/candidates", methods=["GET"])
def list_candidates():
    """List candidates dengan support data terstruktur"""
    job_id = request.args.get('job_id')
    
    query = db.session.query(Candidate, JobApplication, JobPosition)\
        .join(JobApplication, Candidate.id == JobApplication.candidate_id)\
        .join(JobPosition, JobApplication.job_id == JobPosition.id)
        
    if job_id:
        query = query.filter(JobApplication.job_id == job_id)
        
    results = query.order_by(JobApplication.match_score.desc()).all()

    output = []
    for cand, app, job in results:
        # PENTING: Pydantic & SQLAlchemy JSONB akan otomatis handle serialize
        # Kita kirim list of dicts apa adanya ke Frontend
        output.append({
            "id": cand.id,
            "resume_id": cand.resume_id,
            "name": cand.name,
            "email": cand.email,
            "phone": cand.phone,
            "city": cand.city,
            "current_role": cand.current_role,
            "summary": cand.summary,
            
            "education": cand.education, 
            "experience": cand.experience, 
            "skills": cand.skills,
            
            "top_position": job.title,
            "match_score": app.match_score,
            "verdict": app.ai_verdict,
            "application_status": app.status,
            "created_at": app.applied_at.isoformat()
        })
        
    return jsonify(output)