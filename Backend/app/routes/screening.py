import os
import uuid
import json
import re
from datetime import datetime
import numpy as np
import faiss
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
from openai import OpenAI

from app import db
from app.models import Resume, Candidate, JobPosition

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


def job_to_text(job: JobPosition) -> str:
    """
    Mengubah JobPosition menjadi teks untuk embedding & LLM
    """
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
    prompt = f"""
Anda adalah sistem ATS profesional.

Tugas Anda adalah menganalisis CV kandidat dan deskripsi pekerjaan secara objektif.

Lakukan hal berikut:
1. Identifikasi pendidikan formal tertinggi kandidat jika tersedia.
   - Bisa berupa jenjang (misalnya SMA, Diploma, Sarjana, Magister, Doktor)
   - Bisa berupa nama institusi/Universitas yang disebutkan yang biasanya dibaregi dengan nama jurusannya atau program studi jika relevan dan fokus pada kata kunci pendidikan formal tertinggi atau terbaru
2. Identifikasi pengalaman kerja kandidat secara ringkas.
   - Bisa berupa durasi (misalnya jumlah tahun/bulan)
   - Atau status seperti Fresh Graduate jika belum memiliki pengalaman kerja
3. Berikan verdict kecocokan kandidat terhadap pekerjaan.
   - 2–3 kalimat singkat
   - Fokus pada kesesuaian kompetensi, pengalaman, dan latar belakang dengan konsep 100 poin skala yang mana poin nya di jelaskan dalam daftar job desc
   - Gunakan Bahasa Indonesia formal dan profesional

WAJIB kembalikan dalam format JSON murni berikut (tanpa teks tambahan):

{{
  "education": string | null,
  "experience": string | null,
  "verdict": string
}}

Gunakan null jika informasi tidak tersedia secara eksplisit di CV.

=== CV ===
{context}

=== DESKRIPSI PEKERJAAN ===
{job_description}
"""

    try:
        res = client.chat.completions.create(
            model="meta-llama/llama-3.3-70b-instruct:free",
            messages=[
                {"role": "system", "content": "Anda adalah AI ATS yang akurat, netral, dan berbasis data."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,
            max_tokens=300
        )

        return json.loads(res.choices[0].message.content.strip())

    except Exception:
        return {
            "education": None,
            "experience": None,
            "verdict": "Kecocokan kandidat dievaluasi berdasarkan kesesuaian umum antara profil CV dan kebutuhan posisi."
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


def save_candidate_result(**data):
    c = Candidate(
        resume_id=data["resume_id"],
        name=data["name"],
        email=data["email"],
        phone=data["phone"],
        education=data["education"],
        experience=data["experience"],
        skills=json.dumps(data["skills"], ensure_ascii=False),
        top_position=data["top_match"]["position"]["title"],
        match_score=data["top_match"]["matchScore"],
        verdict=data["verdict"]
    )
    db.session.add(c)
    db.session.commit()


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

    r = Resume(
        id=resume_id,
        filename=filename,
        index_path=index_path,
        chunks_path=chunks_path,
        raw_text=text
    )
    db.session.add(r)
    db.session.commit()

    return jsonify({"id": resume_id})

@screening_bp.route("/match_resume", methods=["POST"])
def match_resume():
    data = request.get_json(force=True)
    resume_id = data.get("resume_id")
    job_description = data.get("job_description")

    if not resume_id or not job_description:
        return jsonify({"error": "resume_id & job_description required"}), 400

    meta = load_resume_meta(resume_id)
    if not meta:
        return jsonify({"error": "resume not found"}), 404

    job_title = job_description.split("-")[0].strip()

    job = JobPosition.query.filter(
        JobPosition.title.ilike(f"%{job_title}%"),
        JobPosition.available.is_(True),
        JobPosition.status == "active"
    ).first()

    if not job:
        return jsonify({"error": "job not found"}), 404

    from extractor import embed_query

    index = faiss.read_index(meta["index_path"])
    chunks = json.load(open(meta["chunks_path"], encoding="utf-8"))

    job_text = job_to_text(job)
    q_emb = embed_query(job_text)

    D, I = index.search(q_emb, min(5, len(chunks)))
    avg_score = float(np.mean(D[0])) if len(D[0]) else 0.0
    score = normalize_score(avg_score)

    context = "\n\n".join(chunks[i] for i in I[0][:3])

    llm = generate_verdict(context, job_text)

    match = build_position_match(
        job=job,
        base_score=score,
        verdict=llm["verdict"]
    )

    raw_text = meta["raw_text"]

    save_candidate_result(
        resume_id=meta["id"],
        name=extract_candidate_name(meta["filename"]),
        email=extract_email(raw_text) or "Not found",
        phone=extract_phone(raw_text) or "Not found",
        education=llm["education"] or "Not found",
        experience=llm["experience"] or "Not found",
        skills=(job.required_skills or [])[:8],
        top_match=match,
        verdict=llm["verdict"]
    )

    return jsonify({
        "id": meta["id"],
        "name": extract_candidate_name(meta["filename"]),
        "email": extract_email(raw_text) or "Not found",
        "phone": extract_phone(raw_text) or "Not found",
        "education": llm["education"] or "Not found",
        "experience": llm["experience"] or "Not found",
        "skills": (job.required_skills or [])[:8],
        "matches": [match],          
        "topMatch": match
    })


@screening_bp.route("/candidates", methods=["GET"])
def list_candidates():
    rows = Candidate.query.order_by(Candidate.created_at.desc()).all()
    return jsonify([
        {
            "id": c.id,
            "resume_id": c.resume_id,  
            "name": c.name,
            "email": c.email,
            "phone": c.phone,
            "education": c.education,
            "experience": c.experience,
            "skills": json.loads(c.skills),
            "top_position": c.top_position,
            "match_score": c.match_score,
            "verdict": c.verdict,
            "created_at": c.created_at.isoformat()
        } for c in rows
    ])


def build_position_match(job: JobPosition, base_score: int, verdict: str):
    """
    Bangun struktur match per JobPosition
    """
    return {
        "position": {
            "id": job.id,
            "title": job.title,
            "department": job.department,
            "level": job.level,
            "employment_type": job.employment_type,
            "location": job.location
        },
        "matchScore": base_score,
        "skillMatch": min(100, base_score + 5),
        "experienceMatch": max(40, base_score - 10),
        "reasons": [verdict]
    }
