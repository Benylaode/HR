import json
import os
from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt, verify_jwt_in_request
from sqlalchemy.exc import IntegrityError
from werkzeug.utils import secure_filename
from app import db
from app.models import Candidate, JobApplication, RecruitmentJourney, RecruitmentStage, JourneyLog, Resume
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
    top_position = best_app.job.title if (best_app and best_app.job) else "Unknown"
    status = best_app.status if best_app else "New Candidate"
    test_status = candidate.test_link.status.capitalize() if candidate.test_link else "Pending"

    return {
        "id": candidate.id,
        "resume_id": candidate.resume_id, 
        
        # 1. Biodata (Disesuaikan dengan ProfileMixin Gabungan di models.py)
        "fullName": candidate.full_name,
        "email": candidate.email,
        "whatsapp": candidate.whatsapp,
        "gender": candidate.gender,
        "birthDate": candidate.birth_date.isoformat() if candidate.birth_date else None,
        "domicileProvince": candidate.province,  # Sesuai field mixin baru
        "domicileCity": candidate.city,          # Sesuai field mixin baru
        "totalExperience": candidate.total_experience_years, # Sesuai field mixin baru
        
        # 2. Pendidikan
        "degree": candidate.degree,
        "major": candidate.major,
        "studyProgram": candidate.study_program,
        "university": candidate.university,
        "gpa": candidate.gpa,
        
        # 3. Data JSONB (Dikembalikan agar FE bisa render profil lengkap)
        "socialMedia": candidate.social_media or {},
        "workExperiences": candidate.work_experiences or [],
        "trainings": candidate.trainings or [],
        "organizations": candidate.organizations or [],
        "internships": candidate.internships or [],
        
        # 4. Ekspektasi & Jabatan
        "appliedPosition1": candidate.applied_position_1, 
        "appliedPosition2": candidate.applied_position_2,
        
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
    # Parsing dari form data (Mendukung CV fisik dan JSON berbarengan)
    if request.content_type and request.content_type.startswith('multipart/form-data'):
        data_str = request.form.get('data')
        try:
            data = json.loads(data_str) if data_str else {}
        except Exception:
            return jsonify({"error": "Invalid JSON format in 'data' field"}), 400
    else:
        # Fallback via JSON murni
        data = request.get_json(force=True, silent=True) or {}

    # Handle Upload CV Fisik dan Pembuatan Data Resume
    resume_record_id = None
    if 'cv_file' in request.files:
        file = request.files['cv_file']
        if file and file.filename:
            filename = secure_filename(f"CV_{datetime.now().strftime('%Y%m%d%H%M%S')}_{file.filename}")
            save_path = os.path.join(UPLOAD_CV_FOLDER, filename)
            file.save(save_path)
            cv_path = f"/static/uploads/cv/{filename}"
            
            # Buat record di tabel resumes dulu agar dapat ID
            new_resume = Resume(filename=cv_path)
            db.session.add(new_resume)
            db.session.flush() # Eksekusi agar ID-nya di-generate oleh database
            
            resume_record_id = new_resume.id # Ambil ID resume tersebut

    try:
        birth_date = None
        if data.get("birthDate"):
            birth_date = datetime.strptime(data["birthDate"], "%Y-%m-%d").date()

        # Mapping sesuai dengan ProfileMixin Gabungan
        candidate = Candidate(
            resume_id=resume_record_id, # Masukkan ID resume (Foreign Key), bukan String Path
            
            # Biodata
            full_name=data.get("fullName"),
            email=data.get("email"),
            whatsapp=data.get("whatsapp"),
            gender=data.get("gender"),
            birth_date=birth_date,
            province=data.get("domicileProvince"), # Dipetakan ke province
            city=data.get("domicileCity"),         # Dipetakan ke city
            total_experience_years=data.get("totalExperience"), # Dipetakan ke total_experience_years
            
            # Pendidikan
            degree=data.get("degree"),
            major=data.get("major"),
            study_program=data.get("studyProgram"),
            university=data.get("university"),
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
        db.session.flush() # Ambil ID kandidat sebelum commit

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

            # Buat recruitment journey
            journey = RecruitmentJourney(
                application_id=application.id,
                current_stage=RecruitmentStage.CV_SCREENING,
                stage_data={}
            )
            db.session.add(journey)
            db.session.flush() # Flush agar journey.id didapatkan

            # Buat LOG PERTAMA agar timeline FE tidak kosong/error
            initial_log = JourneyLog(
                journey_id=journey.id,
                previous_stage=None,
                new_stage=RecruitmentStage.CV_SCREENING.value,
                action="Journey started - CV Screening",
                notes="Candidate application received.",
                actor_name="System"
            )
            db.session.add(initial_log)

        db.session.commit()

        return jsonify({
            "message": "Candidate created successfully",
            "data": candidate_to_dict(candidate)
        }), 201

    except IntegrityError as e:
        db.session.rollback()
        # Cetak error ke terminal jika ada pelanggaran Constraint lain (opsional, sangat membantu debugging)
        print("====== INTEGRITY ERROR ======")
        print(str(e.orig)) 
        print("=============================")
        return jsonify({"error": "Pendaftaran gagal. Data tidak lengkap atau email sudah digunakan."}), 400
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
    
    # 1. Info Utama & Kontak
    if "fullName" in data: candidate.full_name = data["fullName"]
    if "email" in data: candidate.email = data["email"]
    if "whatsapp" in data: candidate.whatsapp = data["whatsapp"]
    if "gender" in data: candidate.gender = data["gender"]
    
    if "birthDate" in data and data["birthDate"]:
        candidate.birth_date = datetime.strptime(data["birthDate"], "%Y-%m-%d").date()
    elif "birthDate" in data and not data["birthDate"]:
        candidate.birth_date = None

    # 2. Domisili
    if "domicileCity" in data: candidate.city = data["domicileCity"] 
    if "domicileProvince" in data: candidate.province = data["domicileProvince"]

    # 3. Pendidikan
    if "degree" in data: candidate.degree = data["degree"]
    if "major" in data: candidate.major = data["major"]
    if "studyProgram" in data: candidate.study_program = data["studyProgram"]
    if "university" in data: candidate.university = data["university"]
    if "gpa" in data: candidate.gpa = data["gpa"]
    if "startYear" in data: candidate.start_year = data["startYear"]
    if "gradYear" in data: candidate.grad_year = data["gradYear"]

    # 4. Pekerjaan & Ekspektasi
    if "totalExperience" in data: candidate.total_experience_years = data["totalExperience"]
    if "appliedPosition1" in data: candidate.applied_position_1 = data["appliedPosition1"]
    if "appliedPosition2" in data: candidate.applied_position_2 = data["appliedPosition2"]
    if "expectedSalary" in data: candidate.expected_salary = data["expectedSalary"]
    if "noticePeriod" in data: candidate.notice_period = data["noticePeriod"]

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