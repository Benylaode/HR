import os
import uuid
import json
import sqlite3
import re
from datetime import datetime

import numpy as np
import faiss
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../"))

UPLOAD_FOLDER = os.path.join(BASE, "uploads")
INDEX_FOLDER = os.path.join(BASE, "indexes")
CHUNKS_FOLDER = os.path.join(BASE, "chunks")
DB_PATH = os.path.join(BASE, "storage.db")

ALLOWED_EXT = {"pdf"}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(INDEX_FOLDER, exist_ok=True)
os.makedirs(CHUNKS_FOLDER, exist_ok=True)

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENAI_API_KEY")
)

screening_bp = Blueprint("screening", __name__, url_prefix="/screening")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    c.execute("""
        CREATE TABLE IF NOT EXISTS resumes (
            id TEXT PRIMARY KEY,
            filename TEXT,
            uploaded_at TEXT,
            index_path TEXT,
            chunks_path TEXT,
            raw_text TEXT
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS candidates (
            id TEXT PRIMARY KEY,
            resume_id TEXT,
            name TEXT,
            email TEXT,
            phone TEXT,
            education TEXT,
            experience TEXT,
            skills TEXT,
            top_position TEXT,
            match_score INTEGER,
            verdict TEXT,
            created_at TEXT,
            FOREIGN KEY (resume_id) REFERENCES resumes(id)
        )
    """)

    conn.commit()
    conn.close()

init_db()


def load_resume_meta(resume_id):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        SELECT id, filename, uploaded_at, index_path, chunks_path, raw_text
        FROM resumes WHERE id = ?
    """, (resume_id,))
    row = c.fetchone()
    conn.close()
    if not row:
        return None
    return {
        "id": row[0],
        "filename": row[1],
        "uploaded_at": row[2],
        "index_path": row[3],
        "chunks_path": row[4],
        "raw_text": row[5]
    }

def get_leaderboard_by_position(limit_per_position=10):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    leaderboard = {}

    for pos in AVAILABLE_POSITIONS:
        title = pos["title"]

        c.execute("""
            SELECT
                id,
                resume_id,
                name,
                email,
                phone,
                education,
                experience,
                skills,
                top_position,
                match_score,
                verdict,
                created_at
            FROM candidates
            WHERE top_position = ?
            ORDER BY match_score DESC, created_at ASC
            LIMIT ?
        """, (title, limit_per_position))

        rows = c.fetchall()

        leaderboard[title] = [
            {
                "candidate_id": row["id"],
                "name": row["name"],
                "email": row["email"],
                "phone": row["phone"],
                "education": row["education"],
                "experience": row["experience"],
                "match_score": row["match_score"],
                "verdict": row["verdict"],
                "created_at": row["created_at"]
            }
            for row in rows
        ]

    conn.close()
    return leaderboard


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXT


def normalize_score(score):
    return int(round(max(0.0, min(1.0, score)) * 100))


def extract_candidate_name(filename):
    return os.path.splitext(filename)[0].replace("_", " ").replace("-", " ").title()


def extract_email(text):
    match = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text)
    return match.group(0) if match else None


def extract_phone(text):
    match = re.search(r'(\+62|62|0)8[1-9][0-9]{6,10}', text)
    return match.group(0) if match else None


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
   - Fokus pada kesesuaian kompetensi, pengalaman, dan latar belakang
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

AVAILABLE_POSITIONS = [
    {"title": "Frontend Developer", "department": "Engineering"},
    {"title": "Backend Developer", "department": "Engineering"},
    {"title": "Data Scientist", "department": "Data"},
]


def build_match(position, avg_score, reason=None):
    score = normalize_score(avg_score)
    return {
        "position": position,
        "matchScore": score,
        "skillMatch": min(100, score + 5),
        "experienceMatch": max(40, score - 10),
        "reasons": [reason] if reason else []
    }

def save_candidate_result(
    resume_id,
    name,
    email,
    phone,
    education,
    experience,
    skills,
    top_match,
    verdict
):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    c.execute("""
        INSERT OR REPLACE INTO candidates (
            id,
            resume_id,
            name,
            email,
            phone,
            education,
            experience,
            skills,
            top_position,
            match_score,
            verdict,
            created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        str(uuid.uuid4()),
        resume_id,
        name,
        email,
        phone,
        education,
        experience,
        json.dumps(skills, ensure_ascii=False),
        top_match["position"]["title"],
        top_match["matchScore"],
        verdict,
        datetime.utcnow().isoformat()
    ))

    conn.commit()
    conn.close()

@screening_bp.route("/leaderboard", methods=["GET"])
def leaderboard():
    """
    HR Leaderboard:
    - Grouped by job title
    - Sorted by match_score DESC
    """
    limit = int(request.args.get("limit", 10))
    data = get_leaderboard_by_position(limit)

    return jsonify({
        "generated_at": datetime.utcnow().isoformat(),
        "leaderboard": data
    })


@screening_bp.route("/candidates", methods=["GET"])
def list_candidates():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("""
        SELECT
            id,
            resume_id,
            name,
            email,
            phone,
            education,
            experience,
            skills,
            top_position,
            match_score,
            verdict,
            created_at
        FROM candidates
        ORDER BY created_at DESC
    """)

    rows = c.fetchall()
    conn.close()

    candidates = []
    for row in rows:
        candidates.append({
            "id": row["id"],
            "resume_id": row["resume_id"],
            "name": row["name"],
            "email": row["email"],
            "phone": row["phone"],
            "education": row["education"],
            "experience": row["experience"],
            "skills": json.loads(row["skills"]) if row["skills"] else [],
            "top_position": row["top_position"],
            "match_score": row["match_score"],
            "verdict": row["verdict"],
            "created_at": row["created_at"]
        })

    return jsonify(candidates)

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

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute(
        "INSERT INTO resumes VALUES (?, ?, ?, ?, ?, ?)",
        (resume_id, filename, datetime.utcnow().isoformat(), index_path, chunks_path, text)
    )
    conn.commit()
    conn.close()

    return jsonify({"id": resume_id})


@screening_bp.route("/match_resume", methods=["POST"])
def match_resume():
    data = request.get_json(force=True)
    meta = load_resume_meta(data.get("resume_id"))

    if not meta:
        return jsonify({"error": "resume not found"}), 404

    from extractor import embed_query

    index = faiss.read_index(meta["index_path"])
    chunks = json.load(open(meta["chunks_path"], encoding="utf-8"))

    q_emb = embed_query(data.get("job_description", ""))
    D, I = index.search(q_emb, min(5, len(chunks)))

    avg_score = float(np.mean(D[0])) if len(D[0]) else 0.0
    context = "\n\n".join(chunks[i] for i in I[0][:3])

    llm = generate_verdict(context, data.get("job_description", ""))
    print(llm)

    matches = [
        build_match(pos, avg_score, llm["verdict"] if i == 0 else None)
        for i, pos in enumerate(AVAILABLE_POSITIONS)
    ]

    raw_text = meta["raw_text"]

    save_candidate_result(
    resume_id=meta["id"],
    name=extract_candidate_name(meta["filename"]),
    email=extract_email(raw_text) or "Not found",
    phone=extract_phone(raw_text) or "Not found",
    education=llm["education"] or "Not found",
    experience=llm["experience"] or "Not found",
    skills=data.get("job_description", "").split()[:8],
    top_match=matches[0],
    verdict=llm["verdict"]
    )


    return jsonify({
        "id": meta["id"],
        "name": extract_candidate_name(meta["filename"]),
        "email": extract_email(raw_text) or "Not found",
        "phone": extract_phone(raw_text) or "Not found",
        "education": llm["education"] or "Not found",
        "experience": llm["experience"] or "Not found",
        "skills": data.get("job_description", "").split()[:8],
        "matches": matches,
        "topMatch": matches[0]
    })
