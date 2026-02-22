from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt, verify_jwt_in_request
from sqlalchemy.exc import IntegrityError
from app import db
from app.models import Candidate
from datetime import datetime

candidates_bp = Blueprint("candidates", __name__, url_prefix="/candidates")

@candidates_bp.before_request
def restrict_access_by_role():
    # 1. Selalu izinkan preflight CORS
    if request.method == "OPTIONS":
        return

    # 2. BUKA GEMBOK UNTUK PUBLIK: Izinkan siapa saja melakukan POST (Mendaftar)
    if request.method == "POST":
        return

    # 3. SELAIN POST (GET, DELETE, dll), WAJIB LOGIN!
    verify_jwt_in_request()
    claims = get_jwt()
    role = claims.get("role")
    
    # HR dan SUPER_USER boleh melihat data (GET)
    if request.method == "GET" and role in ["HR", "SUPER_USER"]:
        return
        
    # Hanya SUPER_USER yang boleh menghapus atau mengedit
    if role != "SUPER_USER":
        return jsonify({"status": 403, "message": "Access denied"}), 403
    
def candidate_to_dict(candidate: Candidate):
    # Logika untuk mencari status aplikasi terbaru kandidat
    best_app = None
    if candidate.applications:
        best_app = sorted(candidate.applications, key=lambda x: x.match_score or 0, reverse=True)[0]

    match_score = best_app.match_score if best_app else 0
    top_position = best_app.job.title if (best_app and best_app.job) else candidate.position_applied
    status = best_app.status if best_app else "New Candidate"
    test_status = candidate.test_link.status.capitalize() if candidate.test_link else "Pending"

    return {
        "id": candidate.id,
        "resume_id": candidate.resume_id,
        "fullName": candidate.full_name,
        "email": candidate.email,
        "whatsapp": candidate.whatsapp,
        "gender": candidate.gender,
        "religion": candidate.religion,
        "birthPlace": candidate.birth_place,
        "birthDate": candidate.birth_date.isoformat() if candidate.birth_date else None,
        "driverLicense": candidate.driver_license,
        "address": candidate.address,
        "city": candidate.city,
        "province": candidate.province,
        
        "education": candidate.education,
        "university": candidate.university,
        "major": candidate.major,
        "gpa": candidate.gpa,
        "socialMedia": candidate.social_media,
        
        "positionApplied": candidate.position_applied,
        "lastCompany": candidate.last_company,
        "lastPosition": candidate.last_position,
        "lastPositionLevel": candidate.last_position_level,
        "lastCompanyField": candidate.last_company_field,
        "totalExperience": candidate.total_experience_years,
        "experienceDescription": candidate.experience_description,

        "top_position": top_position,
        "match_score": match_score,
        "status": status,
        "test_status": test_status,
        
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

        "created_at": candidate.created_at.isoformat() if candidate.created_at else None
    }


@candidates_bp.route("", methods=["POST"])
def create_candidate():
    data = request.get_json(force=True)

    try:
        birth_date = None
        if data.get("birthDate"):
            birth_date = datetime.strptime(data["birthDate"], "%Y-%m-%d").date()

        candidate = Candidate(
            # Resume ID sekarang opsional
            resume_id=data.get("resume_id"), 
            
            # Mapping dari camelCase Frontend ke snake_case Backend
            full_name=data.get("fullName"),
            email=data.get("email"),
            whatsapp=data.get("whatsapp"),
            gender=data.get("gender"),
            religion=data.get("religion"),
            birth_place=data.get("birthPlace"),
            birth_date=birth_date,
            driver_license=data.get("driverLicense"),
            address=data.get("address"),
            city=data.get("city"),
            province=data.get("province"),
            
            education=data.get("education"),
            university=data.get("university"),
            major=data.get("major"),
            gpa=data.get("gpa"),
            social_media=data.get("socialMedia"),
            
            position_applied=data.get("positionApplied"),
            last_company=data.get("lastCompany"),
            last_position=data.get("lastPosition"),
            last_position_level=data.get("lastPositionLevel"),
            last_company_field=data.get("lastCompanyField"),
            total_experience_years=data.get("totalExperience"),
            experience_description=data.get("experienceDescription")
        )

        db.session.add(candidate)
        db.session.commit()

        return jsonify({
            "message": "Candidate created successfully",
            "data": candidate_to_dict(candidate)
        }), 201

    except IntegrityError as e:
        db.session.rollback()
        return jsonify({"error": "Database integrity error (possibly duplicate email)"}), 400
    except ValueError as e:
        return jsonify({"error": f"Invalid data format: {str(e)}"}), 400


@candidates_bp.route("", methods=["GET"])
def list_candidates():
    name = request.args.get("name")
    email = request.args.get("email")
    
    query = Candidate.query
    if name:
        query = query.filter(Candidate.full_name.ilike(f"%{name}%"))
    if email:
        query = query.filter(Candidate.email.ilike(f"%{email}%"))

    candidates = query.order_by(Candidate.created_at.desc()).all()
    return jsonify([candidate_to_dict(c) for c in candidates])


@candidates_bp.route("/<candidate_id>", methods=["GET"])
def get_candidate(candidate_id):
    candidate = Candidate.query.get(candidate_id)
    if not candidate:
        return jsonify({"error": "Candidate not found"}), 404
    return jsonify(candidate_to_dict(candidate))


@candidates_bp.route("/<candidate_id>", methods=["DELETE"])
def delete_candidate(candidate_id):
    candidate = Candidate.query.get(candidate_id)
    if not candidate:
        return jsonify({"error": "Candidate not found"}), 404

    db.session.delete(candidate)
    db.session.commit()
    return jsonify({"message": "Candidate deleted successfully"})