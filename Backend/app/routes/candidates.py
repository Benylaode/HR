from flask import Blueprint, request, jsonify
from sqlalchemy.exc import IntegrityError
from app import db
from app.models import Candidate, JobApplication
from datetime import datetime

candidates_bp = Blueprint("candidates", __name__, url_prefix="/candidates")


def candidate_to_dict(candidate: Candidate):
    """
    Mengubah object Candidate menjadi dictionary.
    PERBAIKAN: Mengambil match_score dan posisi dari tabel relasi job_applications.
    """
    
    # 1. Cari aplikasi terbaik (Highest Score) untuk ditampilkan sebagai summary
    # Karena relasinya Many-to-Many, satu kandidat bisa melamar banyak job.
    # Kita ambil yang score-nya paling tinggi untuk display utama.
    best_app = None
    if candidate.applications:
        # Sort aplikasi berdasarkan match_score tertinggi
        best_app = sorted(candidate.applications, key=lambda x: x.match_score or 0, reverse=True)[0]

    # 2. Extract Data dari Best App
    match_score = best_app.match_score if best_app else 0
    top_position = best_app.job.title if (best_app and best_app.job) else "-"
    
    # 3. Tentukan Status
    # Jika ada status real di aplikasi, gunakan itu. Jika tidak, hitung manual based on score.
    status = "Pending"
    if best_app:
        status = best_app.status # Mengambil value Enum dari database (Applied, Screening, dll)
    else:
        # Fallback logic jika belum ada aplikasi
        status = "New Candidate"

    # 4. Cek Status Tes (Relasi One-to-One)
    test_status = "Pending"
    if candidate.test_link:
        test_status = candidate.test_link.status.capitalize() # Active / Completed

    return {
        "id": candidate.id,
        "resume_id": candidate.resume_id,
        "name": candidate.name,
        "email": candidate.email,
        "phone": candidate.phone,
        
        # Field yang diperbaiki (Diambil dari relasi)
        "top_position": top_position,
        "match_score": match_score,
        "status": status,
        "test_status": test_status,

        # Detail Profile
        "dob": candidate.dob.isoformat() if candidate.dob else None,
        "gender": candidate.gender,
        "address": candidate.address,
        "city": candidate.city,
        
        # Professional Summary
        "summary": candidate.summary,
        "total_experience_years": candidate.total_experience_years,
        "current_role": candidate.current_role,

        # Structured Data (JSONB fields)
        "education": candidate.education or [],
        "experience": candidate.experience or [],
        "skills": candidate.skills or [],
        "certifications": candidate.certifications or [],
        "languages": candidate.languages or [],
        "social_links": candidate.social_links or {},
        
        # Applications list (for journey tracking)
        "applications": [
            {
                "id": app.id,
                "job_id": app.job_id,
                "job_title": app.job.title if app.job else None,
                "match_score": app.match_score,
                "status": app.status
            } 
            for app in candidate.applications
        ] if candidate.applications else [],

        "created_at": candidate.created_at.isoformat()
    }


@candidates_bp.route("", methods=["POST"])
def create_candidate():
    """
    Endpoint untuk input manual kandidat.
    """
    data = request.get_json(force=True)

    try:
        # Parsing tanggal lahir
        dob = None
        if data.get("dob"):
            dob = datetime.strptime(data["dob"], "%Y-%m-%d").date()

        candidate = Candidate(
            resume_id=data["resume_id"], 
            name=data["name"],
            email=data.get("email"),
            phone=data.get("phone"),
            dob=dob,
            gender=data.get("gender"),
            address=data.get("address"),
            city=data.get("city"),
            
            summary=data.get("summary"),
            total_experience_years=data.get("total_experience_years", 0),
            current_role=data.get("current_role"),

            education=data.get("education", []),
            experience=data.get("experience", []),
            skills=data.get("skills", []),
            certifications=data.get("certifications", []),
            languages=data.get("languages", []),
            social_links=data.get("social_links", {})
        )

        db.session.add(candidate)
        db.session.commit()

        return jsonify({
            "message": "Candidate created successfully",
            "data": candidate_to_dict(candidate)
        }), 201

    except KeyError as e:
        return jsonify({"error": f"Missing field {str(e)}"}), 400

    except IntegrityError as e:
        db.session.rollback()
        if "foreign key constraint" in str(e.orig):
            return jsonify({"error": "Invalid resume_id. Resume must exist first."}), 400
        return jsonify({"error": "Database integrity error (possibly duplicate email or ID)"}), 400
    
    except ValueError as e:
        return jsonify({"error": f"Invalid data format: {str(e)}"}), 400


@candidates_bp.route("", methods=["GET"])
def list_candidates():
    """
    List semua kandidat dengan filter sederhana.
    """
    name = request.args.get("name")
    email = request.args.get("email")
    city = request.args.get("city")
    
    query = Candidate.query

    if name:
        query = query.filter(Candidate.name.ilike(f"%{name}%"))
    if email:
        query = query.filter(Candidate.email.ilike(f"%{email}%"))
    if city:
        query = query.filter(Candidate.city.ilike(f"%{city}%"))

    # Order by terbaru
    candidates = query.order_by(Candidate.created_at.desc()).all()

    # Konversi ke dict (Logic match_score ditangani di dalam candidate_to_dict)
    return jsonify([candidate_to_dict(c) for c in candidates])


@candidates_bp.route("/<candidate_id>", methods=["GET"])
def get_candidate(candidate_id):
    candidate = Candidate.query.get(candidate_id)
    if not candidate:
        return jsonify({"error": "Candidate not found"}), 404

    return jsonify(candidate_to_dict(candidate))


@candidates_bp.route("/<candidate_id>", methods=["PUT"])
def update_candidate(candidate_id):
    candidate = Candidate.query.get(candidate_id)
    if not candidate:
        return jsonify({"error": "Candidate not found"}), 404

    data = request.get_json(force=True)

    try:
        candidate.name = data.get("name", candidate.name)
        candidate.email = data.get("email", candidate.email)
        candidate.phone = data.get("phone", candidate.phone)
        
        if data.get("dob"):
            candidate.dob = datetime.strptime(data["dob"], "%Y-%m-%d").date()
            
        candidate.gender = data.get("gender", candidate.gender)
        candidate.address = data.get("address", candidate.address)
        candidate.city = data.get("city", candidate.city)
        
        candidate.summary = data.get("summary", candidate.summary)
        candidate.total_experience_years = data.get("total_experience_years", candidate.total_experience_years)
        candidate.current_role = data.get("current_role", candidate.current_role)

        # Update JSONB Fields
        if "education" in data:
            candidate.education = data["education"]
        if "experience" in data:
            candidate.experience = data["experience"]
        if "skills" in data:
            candidate.skills = data["skills"]
        if "certifications" in data:
            candidate.certifications = data["certifications"]
        if "languages" in data:
            candidate.languages = data["languages"]
        if "social_links" in data:
            candidate.social_links = data["social_links"]

        db.session.commit()

        return jsonify({
            "message": "Candidate updated successfully",
            "data": candidate_to_dict(candidate)
        })

    except ValueError as e:
        return jsonify({"error": f"Invalid data format: {str(e)}"}), 400
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Update failed due to integrity constraint"}), 400


@candidates_bp.route("/<candidate_id>", methods=["DELETE"])
def delete_candidate(candidate_id):
    candidate = Candidate.query.get(candidate_id)
    if not candidate:
        return jsonify({"error": "Candidate not found"}), 404

    db.session.delete(candidate)
    db.session.commit()

    return jsonify({"message": "Candidate deleted successfully"})