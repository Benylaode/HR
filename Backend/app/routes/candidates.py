from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt, verify_jwt_in_request
from sqlalchemy.exc import IntegrityError
from app import db
from app.models import Candidate
from datetime import datetime
from app.models import  JobApplication, RecruitmentJourney, RecruitmentStage

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
    # Logika status aplikasi (Tetap sama seperti sebelumnya)
    best_app = None
    if candidate.applications:
        best_app = sorted(candidate.applications, key=lambda x: x.match_score or 0, reverse=True)[0]

    match_score = best_app.match_score if best_app else 0
    top_position = best_app.job.title if (best_app and best_app.job) else (candidate.applied_position_1 or "Unknown")
    status = best_app.status if best_app else "New Candidate"
    test_status = candidate.test_link.status.capitalize() if candidate.test_link else "Pending"

    return {
        "id": candidate.id,
        "resume_id": candidate.resume_id,
        
        # 1. Biodata
        "fullName": candidate.full_name,
        "email": candidate.email,
        "whatsapp": candidate.whatsapp,
        "gender": candidate.gender,
        "birthDate": candidate.birth_date.isoformat() if candidate.birth_date else None,
        "domicileProvince": candidate.domicile_province,
        "domicileCity": candidate.domicile_city,
        "totalExperience": candidate.total_experience,
        
        # 2. Pendidikan
        "degree": candidate.degree,
        "major": candidate.major,
        "studyProgram": candidate.study_program,
        "university": candidate.university,
        "eduCity": candidate.edu_city,
        "gpa": candidate.gpa,
        "startYear": candidate.start_year,
        "gradYear": candidate.grad_year,
        
        # 3. Keahlian & Organisasi
        "trainings": candidate.trainings,
        "organizations": candidate.organizations,
        
        # 4. Pengalaman & Minat Kerja
        "workExperiences": candidate.work_experiences,
        "internships": candidate.internships,
        "appliedPosition1": candidate.applied_position_1,
        "appliedPosition2": candidate.applied_position_2,
        "noticePeriod": candidate.notice_period,
        "expectedSalary": candidate.expected_salary,
        
        # 5. Lain-Lain
        "references": candidate.references,
        "relatives": candidate.relatives,
        "socialMedia": candidate.social_media,

        # Status & Relasi
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

        # 1. Simpan Kandidat dengan form baru
        candidate = Candidate(
            resume_id=data.get("resume_id"), 
            
            # Biodata
            full_name=data.get("fullName"),
            email=data.get("email"),
            gender=data.get("gender"),
            whatsapp=data.get("whatsapp"),
            birth_date=birth_date,
            domicile_province=data.get("domicileProvince"),
            domicile_city=data.get("domicileCity"),
            total_experience=data.get("totalExperience"),
            
            # Pendidikan
            degree=data.get("degree"),
            major=data.get("major"),
            study_program=data.get("studyProgram"),
            university=data.get("university"),
            edu_city=data.get("eduCity"),
            gpa=data.get("gpa"),
            start_year=data.get("startYear"),
            grad_year=data.get("gradYear"),
            
            # JSON Data
            trainings=data.get("trainings", []),
            organizations=data.get("organizations", []),
            work_experiences=data.get("workExperiences", []),
            internships=data.get("internships", []),
            
            # Minat Kerja
            applied_position_1=data.get("appliedPosition1"),
            applied_position_2=data.get("appliedPosition2"),
            notice_period=data.get("noticePeriod"),
            expected_salary=data.get("expectedSalary"),
            
            # Lain-lain
            references=data.get("references", []),
            relatives=data.get("relatives", []),
            social_media=data.get("socialMedia", {})
        )

        db.session.add(candidate)
        db.session.flush() # Dapatkan candidate.id tanpa commit dulu

        # 2. Assign kandidat ke Job Position jika ada job_id di payload
        job_id = data.get("job_id")
        if job_id:
            application = JobApplication(
                candidate_id=candidate.id,
                job_id=job_id,
                status="Applied"
            )
            db.session.add(application)
            db.session.flush()

            # Buat recruitment journey pertama (Masuk ke sistem tracking HR)
            journey = RecruitmentJourney(
                application_id=application.id,
                current_stage=RecruitmentStage.CV_SCREENING
            )
            db.session.add(journey)

        db.session.commit()

        return jsonify({
            "message": "Candidate created and applied successfully",
            "data": candidate_to_dict(candidate) # Pastikan helper to_dict Anda sudah di update jika perlu
        }), 201

    except IntegrityError as e:
        db.session.rollback()
        return jsonify({"error": "Database integrity error (possibly duplicate email)"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Invalid data or internal error: {str(e)}"}), 400


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