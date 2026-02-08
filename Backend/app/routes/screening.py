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

# Konfigurasi Client
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENAI_API_KEY"),
    default_headers={
        "HTTP-Referer": "https://caturcomputer.com/",
        "X-Title": "CV Scanner App",
    }
)

screening_bp = Blueprint("screening", __name__)

# --- AUTH DECORATOR ---
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
        if role != "SUPER_USER" and role != "HR":
            return jsonify({"status": 403, "message": "Access denied"}), 403
    except:
        return jsonify({"status": 401, "message": "Unauthorized"}), 401

# --- HELPER FUNCTIONS ---

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXT

def normalize_score(score):
    return int(round(max(0.0, min(1.0, score)) * 100))

def extract_candidate_name(filename):
    base = os.path.splitext(filename)[0]
    if "_" in base:
        parts = base.split("_", 1)
        if len(parts) > 1 and len(parts[0]) > 20: 
            base = parts[1]
    return base.replace("-", " ").title()

def job_to_text(job: JobPosition) -> str:
    requirements = ", ".join(job.requirements or [])
    skills = ", ".join(job.required_skills or [])
    salary = f"Range Gaji: {job.salary_min} - {job.salary_max} {job.salary_currency}" if job.salary_min else ""

    return f"""
    Judul Posisi: {job.title}
    Level: {job.level}
    Deskripsi: {job.job_description}
    Persyaratan: {requirements}
    Skill Wajib: {skills}
    {salary}
    """

# --- CORE AI LOGIC (DIPERBAIKI) ---

def generate_verdict(cv_text, job_description):
    """
    Prompt diperbaiki untuk fokus ekstraksi entitas Education & Experience.
    """
    
    system_instruction = """
    You are an expert HR Resume Parser. Your GOAL is to extract structured data from the resume text with extreme accuracy, especially for EDUCATION and WORK EXPERIENCE.

    ### INSTRUCTIONS:
    1. **EDUCATION IS CRITICAL**: You MUST search for keywords: "Education", "Pendidikan", "Academic", "University", "Universitas", "School", "Sekolah", "Degree", "Gelar", "GPA", "IPK".
       - Even if the section is at the very bottom or poorly formatted, extract it.
       - If multiple degrees exist, list them all (e.g., Bachelor, Master).
    
    2. **WORK EXPERIENCE**: Look for sections with dates (e.g., "Jan 2020 - Present") and Company names.
    
    3. **OUTPUT FORMAT**: Return ONLY valid JSON. No conversational text.
    
    ### JSON STRUCTURE:
    {
        "name": "Candidate Name (Title Case)",
        "email": "email@address.com (or null)",
        "phone": "Phone number (or null)",
        "city": "Current City/Domicile (or null)",
        "current_role": "Most recent job title (or null)",
        "education": [
            { 
                "institution": "University/School Name", 
                "degree": "Degree (e.g., S1 Computer Science, SMA IPA)", 
                "major": "Major/Field of Study", 
                "year": "Graduation Year/Period (e.g., 2018 - 2022)" 
            }
        ],
        "experience": [
            { 
                "company": "Company Name", 
                "role": "Job Title", 
                "duration": "Start - End Date", 
                "details": "Key responsibility summary (max 20 words)" 
            }
        ],
        "skills": ["Skill 1", "Skill 2", "Skill 3", "Skill 4", "Skill 5"],
        "summary": "Professional summary (1 sentence).",
        "verdict": "Evaluation in INDONESIAN (Bahasa Indonesia). Explain why they match/mismatch the job. Be objective."
    }

    ### RULES:
    - If a field is missing in the text, use null (or empty array [] for lists).
    - Do NOT hallucinatory data.
    - For 'verdict', compare the candidate strictly against the provided Job Description.
    """

    user_prompt = f"""
    === JOB DESCRIPTION ===
    {job_description}

    === FULL CANDIDATE RESUME ===
    {cv_text}
    """

    try:
        response = client.chat.completions.create(
            model="tngtech/deepseek-r1t-chimera:free", # Pastikan model ID benar
            messages=[
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.1, # Keep strict
            max_tokens=3000  # Cukup besar untuk JSON output
        )

        content = response.choices[0].message.content.strip()
        print("LLM RAW RESPONSE:", content)
        
        # --- JSON CLEANUP & PARSING ---
        # 1. Remove <think> tags (Common in DeepSeek R1)
        content = re.sub(r'<think>.*?</think>', '', content, flags=re.DOTALL)
        
        # 2. Remove Markdown code blocks if present
        content = content.replace("```json", "").replace("```", "")
        
        # 3. Find the JSON object
        json_match = re.search(r'\{.*\}', content, re.DOTALL)
        
        if json_match:
            json_str = json_match.group(0)
            return json.loads(json_str)
        else:
            print("RAW CONTENT ERROR:", content)
            return {}

    except Exception as e:
        print(f"LLM Error: {e}")
        return {}

def save_candidate_result_structured(resume_id, job_id, meta, extracted_data, match_score):
    try:
        candidate = Candidate.query.filter_by(resume_id=resume_id).first()
        
        # Fallback values
        name = extracted_data.get("name") or extract_candidate_name(meta["filename"])
        email = extracted_data.get("email") or "Not provided"
        
        if not candidate:
            candidate = Candidate(
                resume_id=resume_id,
                name=name,
                email=email,
                phone=extracted_data.get("phone"),
                education=extracted_data.get("education", []),
                experience=extracted_data.get("experience", []),
                skills=extracted_data.get("skills", []),
                summary=extracted_data.get("summary", ""),
                city=extracted_data.get("city"),
                current_role=extracted_data.get("current_role"),
            )
            db.session.add(candidate)
            db.session.flush()
        else:
            candidate.name = name
            candidate.email = email
            candidate.phone = extracted_data.get("phone")
            candidate.education = extracted_data.get("education", [])
            candidate.experience = extracted_data.get("experience", [])
            candidate.skills = extracted_data.get("skills", [])
            candidate.summary = extracted_data.get("summary", "")
            candidate.city = extracted_data.get("city")
            candidate.current_role = extracted_data.get("current_role")

        application = JobApplication.query.filter_by(candidate_id=candidate.id, job_id=job_id).first()
        verdict = extracted_data.get("verdict", "Evaluasi selesai.")

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

    unique_id = str(uuid.uuid4())
    secure_name = secure_filename(f.filename)
    saved_filename = f"{unique_id}_{secure_name}"
    
    pdf_path = os.path.join(UPLOAD_FOLDER, saved_filename)
    f.save(pdf_path)

    try:
        from extractor import extract_text_from_pdf, chunk_text, embed_chunks
        
        text = extract_text_from_pdf(pdf_path)
        # Clean text basic
        text = re.sub(r'[^\x00-\x7F]+', ' ', text) # Remove non-ascii noise
        text = re.sub(r'\s+', ' ', text).strip()
        
        chunks = chunk_text(text, chunk_size=800, overlap=100)
        embeddings = embed_chunks(chunks)

        dimension = embeddings.shape[1]
        index = faiss.IndexFlatIP(dimension)
        index.add(embeddings)

        index_path = os.path.join(INDEX_FOLDER, f"{unique_id}.faiss")
        chunks_path = os.path.join(CHUNKS_FOLDER, f"{unique_id}.json")

        faiss.write_index(index, index_path)
        with open(chunks_path, "w", encoding="utf-8") as json_file:
            json.dump(chunks, json_file, ensure_ascii=False)
        
        resume = Resume(
            id=unique_id,
            filename=secure_name,
            index_path=index_path,
            chunks_path=chunks_path,
            raw_text=text # PENTING: Kita menyimpan full text di sini
        )
        db.session.add(resume)
        db.session.commit()

        return jsonify({"id": unique_id, "filename": secure_name, "status": "uploaded"})
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

        # 1. Load Resume
        resume = db.session.get(Resume, resume_id)
        if not resume:
            return jsonify({"error": "resume not found"}), 404
        
        meta = {
            "id": resume.id,
            "filename": resume.filename,
            "raw_text": resume.raw_text # Kita butuh ini
        }

        # 2. Load Job Context
        job = None
        if job_id:
            job = JobPosition.query.get(job_id)
        
        if job:
            job_context = job_to_text(job)
            job_title = job.title
        elif job_desc_fallback:
            job_context = job_desc_fallback
            job_title = "Custom Position"
            return jsonify({"error": "Job ID required for persistence"}), 400
        else:
            return jsonify({"error": "Job context missing"}), 400

        # 3. Hitung Skor (Tetap menggunakan Vector Search untuk Skor)
        # Kita pisahkan logic: Skor pakai FAISS, Ekstraksi Data pakai Full Text
        from extractor import embed_query
        
        index = faiss.read_index(resume.index_path)
        q_emb = embed_query(job_context)
        
        # Ambil chunks untuk scoring saja
        D, I = index.search(q_emb, 5) 
        avg_score = float(np.mean(D[0])) if len(D[0]) > 0 else 0.0
        score_percent = normalize_score(avg_score)

        # 4. LLM Extraction (PERBAIKAN UTAMA DISINI)
        # Daripada mengirim 'relevant_context' yang mungkin memotong bagian Education,
        # kita kirim 'meta["raw_text"]' (Full Resume).
        # Context window DeepSeek cukup besar untuk menampung seluruh teks CV (rata-rata CV < 2000 tokens).
        
        extracted_data = generate_verdict(meta["raw_text"], job_context)

        # 5. Save & Return
        candidate, application = save_candidate_result_structured(
            resume_id=meta["id"],
            job_id=job.id,
            meta=meta,
            extracted_data=extracted_data,
            match_score=score_percent
        )

        return jsonify({
            "id": candidate.id,
            "resume_id": candidate.resume_id,
            "name": candidate.name,
            "email": candidate.email,
            "phone": candidate.phone,
            "city": candidate.city,
            "current_role": candidate.current_role,
            "education": candidate.education,
            "experience": candidate.experience,
            "skills": candidate.skills,
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
            "city": getattr(cand, 'city', None),
            "current_role": getattr(cand, 'current_role', None),
            "education": cand.education,
            "experience": cand.experience,
            "skills": cand.skills,
            "summary": cand.summary,
            "top_position": job.title,
            "match_score": app.match_score,
            "verdict": app.ai_verdict,
            "application_status": app.status,
            "created_at": app.applied_at.isoformat()
        })
        
    return jsonify(output)