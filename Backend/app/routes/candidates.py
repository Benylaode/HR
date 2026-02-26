import json
import os
from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt, verify_jwt_in_request
from sqlalchemy.exc import IntegrityError
from werkzeug.utils import secure_filename
from app import db
from app.models import Candidate, JobApplication, RecruitmentJourney, RecruitmentStage
from datetime import datetime

candidates_bp = Blueprint("candidates", __name__, url_prefix="/candidates")

# Konfigurasi Folder Upload CV
UPLOAD_CV_FOLDER = 'app/static/uploads/cv'
if not os.path.exists(UPLOAD_CV_FOLDER):
    os.makedirs(UPLOAD_CV_FOLDER)

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
    top_position = best_app.job.title if (best_app and best_app.job) else (candidate.applied_position_1 or "Unknown")
    status = best_app.status if best_app else "New Candidate"
    test_status = candidate.test_link.status.capitalize() if candidate.test_link else "Pending"

    return {
        "id": candidate.id,
        "resume_id": candidate.resume_id, # Berisi Path File CV
        
        # 1. Biodata (Sesuai Skema Baru)
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
        
        # 3. Data JSONB (List Array)
        "trainings": candidate.trainings or [],
        "organizations": candidate.organizations or [],
        "workExperiences": candidate.work_experiences or [],
        "internships": candidate.internships or [],
        "references": candidate.references or [],
        "relatives": candidate.relatives or [],
        "socialMedia": candidate.social_media or {},
        
        # 4. Ekspektasi & Jabatan
        "appliedPosition1": candidate.applied_position_1,
        "appliedPosition2": candidate.applied_position_2,
        "noticePeriod": candidate.notice_period,
        "expectedSalary": candidate.expected_salary,

        # Metadata Table View
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
    # Karena Frontend sekarang menggunakan FormData (ada file CV), kita harus parsing dari form
    if request.content_type and request.content_type.startswith('multipart/form-data'):
        data_str = request.form.get('data')
        try:
            data = json.loads(data_str) if data_str else {}
        except Exception:
            return jsonify({"error": "Invalid JSON format in 'data' field"}), 400
    else:
        # Fallback jika dikirim murni via JSON (meski akan gagal mengunggah CV fisik)
        data = request.get_json(force=True, silent=True) or {}

    # Handle Upload CV Fisik
    cv_path = None
    if 'cv_file' in request.files:
        file = request.files['cv_file']
        if file and file.filename:
            filename = secure_filename(f"CV_{datetime.now().strftime('%Y%m%d%H%M%S')}_{file.filename}")
            save_path = os.path.join(UPLOAD_CV_FOLDER, filename)
            file.save(save_path)
            cv_path = f"/static/uploads/cv/{filename}"

    try:
        birth_date = None
        if data.get("birthDate"):
            birth_date = datetime.strptime(data["birthDate"], "%Y-%m-%d").date()

        candidate = Candidate(
            resume_id=cv_path, # Simpan path URL file CV ke resume_id
            
            # Biodata
            full_name=data.get("fullName"),
            email=data.get("email"),
            whatsapp=data.get("whatsapp"),
            gender=data.get("gender"),
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
            
            # Arrays (JSONB)
            trainings=data.get("trainings", []),
            organizations=data.get("organizations", []),
            work_experiences=data.get("workExperiences", []),
            internships=data.get("internships", []),
            references=data.get("references", []),
            relatives=data.get("relatives", []),
            social_media=data.get("socialMedia", {}),
            
            # Ekspektasi
            applied_position_1=data.get("appliedPosition1"),
            applied_position_2=data.get("appliedPosition2"),
            notice_period=data.get("noticePeriod"),
            expected_salary=data.get("expectedSalary")
        )

        db.session.add(candidate)
        db.session.flush() # Ambil ID kandidat sebelum full commit

        # 🚀 AUTO ASSIGN JOB POSITION & PIPELINE 🚀
        job_id = data.get("job_id")
        if job_id:
            application = JobApplication(
                candidate_id=candidate.id,
                job_id=job_id,
                status="Applied"
            )
            db.session.add(application)
            db.session.flush()

            # Buat recruitment journey (Tracking pertama kali: Masuk tahapan CV Screening)
            journey = RecruitmentJourney(
                application_id=application.id,
                current_stage=RecruitmentStage.CV_SCREENING,
                stage_data={}
            )
            db.session.add(journey)

        db.session.commit()

        return jsonify({
            "message": "Candidate created successfully",
            "data": candidate_to_dict(candidate)
        }), 201

    except IntegrityError as e:
        db.session.rollback()
        return jsonify({"error": "Pendaftaran gagal. Email kemungkinan sudah digunakan sebelumnya."}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500


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


@candidates_bp.route("/<candidate_id>", methods=["PUT"])
def update_candidate(candidate_id):
    candidate = Candidate.query.get(candidate_id)
    if not candidate:
        return jsonify({"error": "Candidate not found"}), 404

    data = request.get_json()
    
    if "fullName" in data: candidate.full_name = data["fullName"]
    if "email" in data: candidate.email = data["email"]
    if "whatsapp" in data: candidate.whatsapp = data["whatsapp"]
    if "domicileCity" in data: candidate.domicile_city = data["domicileCity"]
    if "totalExperience" in data: candidate.total_experience = data["totalExperience"]

    try:
        db.session.commit()
        return jsonify({"message": "Kandidat berhasil diperbarui", "data": candidate_to_dict(candidate)})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400


@candidates_bp.route("/<candidate_id>", methods=["DELETE"])
def delete_candidate(candidate_id):
    candidate = Candidate.query.get(candidate_id)
    if not candidate:
        return jsonify({"error": "Candidate not found"}), 404

    db.session.delete(candidate)
    db.session.commit()
    return jsonify({"message": "Candidate deleted successfully"})