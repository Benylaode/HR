import os
import uuid
import json
import sqlite3
from flask import Flask, request, jsonify, send_from_directory, render_template
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
import faiss
import numpy as np
from datetime import datetime
from openai import OpenAI

from extractor import extract_text_from_pdf, chunk_text, embed_chunks, embed_query
from flask import Blueprint

screening_bp = Blueprint("screening", __name__, url_prefix="/screening")

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")  

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key="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", 
)
BASE = "../../"

UPLOAD_FOLDER = BASE + "uploads"
INDEX_FOLDER = BASE + "indexes"
CHUNKS_FOLDER = BASE + "chunks"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(INDEX_FOLDER, exist_ok=True)
os.makedirs(CHUNKS_FOLDER, exist_ok=True)

DB_PATH = "storage.db"

# ---- simple sqlite helper ----
def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
    CREATE TABLE IF NOT EXISTS resumes (
        id TEXT PRIMARY KEY,
        filename TEXT,
        uploaded_at TEXT,
        index_path TEXT,
        chunks_path TEXT
    )
    """)
    c.execute("""
    CREATE TABLE IF NOT EXISTS leaderboard (
        id TEXT PRIMARY KEY,
        resume_id TEXT,
        candidate_name TEXT,
        score REAL,
        created_at TEXT
    )
    """)
    conn.commit()
    conn.close()

init_db()

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
ALLOWED_EXT = {"pdf"}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXT

@screening_bp.route("/")
def home():
    return render_template("index.html")

def extract_candidate_name(filename):
    """
    Ambil nama kandidat dari nama file CV.
    Misal: 'Budi_Santoso_CV.pdf' → 'Budi Santoso'
    """
    base = filename.rsplit(".", 1)[0]
    base = base.replace("_", " ").replace("-", " ").strip()
    return base.title()


@screening_bp.route("/upload_resume", methods=["POST"])
def upload_resume():
    """
    form-data:
      file: file (pdf)
      chunk_size, overlap (optional)
    """
    if 'file' not in request.files:
        return jsonify({"error": "file part missing"}), 400
    f = request.files['file']
    if f.filename == "":
        return jsonify({"error": "no selected file"}), 400
    if not allowed_file(f.filename):
        return jsonify({"error": "file type not allowed (pdf only)"}), 400

    filename = secure_filename(f.filename)
    uid = str(uuid.uuid4())
    saved_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{uid}_{filename}")
    f.save(saved_path)

    text = extract_text_from_pdf(saved_path)
    chunk_size = int(request.form.get("chunk_size", 800))
    overlap = int(request.form.get("overlap", 100))
    chunks = chunk_text(text, chunk_size=chunk_size, overlap=overlap)

    embeddings = embed_chunks(chunks)
    if embeddings.shape[0] == 0:
        return jsonify({"error": "no text found in document"}), 400

    dim = embeddings.shape[1]
    index = faiss.IndexFlatIP(dim)  
    index.add(embeddings)

    index_path = os.path.join(INDEX_FOLDER, f"{uid}.faiss")
    faiss.write_index(index, index_path)

    chunks_path = os.path.join(CHUNKS_FOLDER, f"{uid}.json")
    with open(chunks_path, "w", encoding="utf-8") as fh:
        json.dump(chunks, fh, ensure_ascii=False, indent=2)

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("INSERT INTO resumes (id, filename, uploaded_at, index_path, chunks_path) VALUES (?, ?, ?, ?, ?)",
              (uid, filename, datetime.utcnow().isoformat(), index_path, chunks_path))
    conn.commit()
    conn.close()

    return jsonify({"id": uid, "filename": filename, "message": "resume processed and indexed"}), 201


def load_resume_meta(resume_id):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT id, filename, uploaded_at, index_path, chunks_path FROM resumes WHERE id = ?", (resume_id,))
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
    }

def generate_verdict_via_llm(context, job_description, ask="Buatkan tabel field, dan nilai kecocokan (cocok/kurang cocok) beserta alasan singkat."):
    """
    Generate ringkasan menggunakan model OpenRouter/OpenAI format baru (OpenAI SDK v1).
    """
    try:
        prompt = f"""
        Berikut ini adalah potongan resume:

        {context}

        ---

        Berikut job description:

        {job_description}

        ---

        Instruksi:
        {ask}
        """

        response = client.chat.completions.create(
            model="meta-llama/llama-3.3-70b-instruct:free",   # contoh model gratis OpenRouter
            messages=[
                {"role": "system", "content": "Kamu adalah AI yang merangkum CV untuk dibandingkan dengan job description."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=800,
            temperature=0.2
        )

        return response.choices[0].message.content

    except Exception as e:
        print("LLM call failed:", e)
        return None

@screening_bp.route("/match_resume", methods=["POST"])
def match_resume():
    """
    JSON body:
      resume_id: id returned from /upload_resume
      job_description: string (if empty, app can use stored job template)
      top_k: int (default 5)
    """
    data = request.get_json(force=True)
    resume_id = data.get("resume_id")
    job_description = data.get("job_description", "")
    top_k = int(data.get("top_k", 5))

    meta = load_resume_meta(resume_id)
    if not meta:
        return jsonify({"error": "resume_id not found"}), 404

    if not os.path.exists(meta["index_path"]) or not os.path.exists(meta["chunks_path"]):
        return jsonify({"error": "index or chunks not found on disk"}), 500

    index = faiss.read_index(meta["index_path"])
    with open(meta["chunks_path"], "r", encoding="utf-8") as fh:
        chunks = json.load(fh)

    if not job_description:
        return jsonify({"error": "job_description missing"}), 400

    q_emb = embed_query(job_description) 
    D, I = index.search(q_emb, k=min(top_k, len(chunks)))
    indices = I[0].tolist()
    scores = D[0].tolist()
    retrieved = [{"idx": idx, "score": float(scores[i]), "text": chunks[idx]} for i, idx in enumerate(indices)]

    context = "\n\n---\n\n".join([r["text"] for r in retrieved])

    llm_result = generate_verdict_via_llm(context, job_description)
    if llm_result:
        verdict = {"method": "llm", "result": llm_result}
    else:

        avg_score = float(np.mean(scores)) if scores else 0.0

        if avg_score > 0.75:
            suitability = "Sangat cocok"
        elif avg_score > 0.6:
            suitability = "Cocok"
        elif avg_score > 0.45:
            suitability = "Kurang cocok"
        else:
            suitability = "Tidak cocok"

        table = {
            "suitability": suitability,
            "avg_score": avg_score,
            "top_matches": retrieved
        }
        verdict = {"method": "heuristic", "result": table}
    
    score = 0.0
    if verdict["method"] == "heuristic":
        score = verdict["result"]["avg_score"]
    else:
        # Jika LLM menghasilkan tabel, kita ambil skor rata-rata FAISS saja
        score = float(np.mean(scores)) if scores else 0.0

    candidate_name = extract_candidate_name(meta["filename"])

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    lid = str(uuid.uuid4())
    
    c.execute("""
    INSERT INTO leaderboard (id, resume_id, candidate_name, score, created_at)
    VALUES (?, ?, ?, ?, ?)
    """, (lid, resume_id, candidate_name, score, datetime.utcnow().isoformat()))
    conn.commit()
    conn.close()

    return jsonify({
        "resume_id": resume_id,
        "filename": meta["filename"],
        "verdict": verdict,
        "retrieved_context": context
    })

@screening_bp.route("/resumes", methods=["GET"])
def list_resumes():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT id, filename, uploaded_at FROM resumes ORDER BY uploaded_at DESC")
    rows = c.fetchall()
    conn.close()
    items = [{"id":r[0],"filename":r[1],"uploaded_at":r[2]} for r in rows]
    return jsonify(items)

@screening_bp.route("/download/<resume_id>", methods=["GET"])
def download_resume(resume_id):
    meta = load_resume_meta(resume_id)
    if not meta:
        return jsonify({"error":"not found"}), 404

    for fname in os.listdir(UPLOAD_FOLDER):
        if fname.startswith(resume_id + "_"):
            return send_from_directory(UPLOAD_FOLDER, fname, as_attachment=True)
    return jsonify({"error":"file missing"}), 404

@screening_bp.route("/leaderboard", methods=["GET"])
def leaderboard():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
    SELECT resume_id, candidate_name, score, created_at
    FROM leaderboard
    ORDER BY score DESC
    """)
    rows = c.fetchall()
    conn.close()

    items = [{
        "resume_id": r[0],
        "candidate_name": r[1],
        "score": r[2],
        "created_at": r[3]
    } for r in rows]

    return jsonify(items)

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
