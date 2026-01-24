from flask import Blueprint, request, jsonify, url_for
from flask_jwt_extended import get_jwt, get_jwt_identity, verify_jwt_in_request
from app import db
from app.models import (
    JobApplication, RecruitmentJourney, JourneyLog, RecruitmentStage, User
)
from datetime import datetime
import os
from werkzeug.utils import secure_filename
from app.utils.whatsapp_helper import generate_wa_link

# Inisialisasi Blueprint
tracing_bp = Blueprint("tracing", __name__, url_prefix="/tracing")

@tracing_bp.before_request
def restrict_access_by_role():
    if request.method == "OPTIONS":
        return

    verify_jwt_in_request()

    claims = get_jwt()
    role = claims.get("role")

    # GET boleh HR & SUPER_USER
    if request.method == "GET":
        if role in ["HR", "SUPER_USER"]:
            return

    # Selain GET hanya SUPER_USER
    if role != "SUPER_USER":
        return jsonify({
            "status": 403,
            "message": "Access denied"
        }), 403

# Konfigurasi Upload
UPLOAD_DOCS_FOLDER = 'app/static/uploads/documents'
ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg', 'doc', 'docx'}

if not os.path.exists(UPLOAD_DOCS_FOLDER):
    os.makedirs(UPLOAD_DOCS_FOLDER)


REJECTION_STAGES = {
    RecruitmentStage.REJECTED,
    RecruitmentStage.MCU_FAILED,
    RecruitmentStage.OFFERING_DECLINED
}

# Daftar status terminal (Akhir perjalanan, tidak bisa pindah lagi kecuali diaktifkan ulang)
TERMINAL_STATES = REJECTION_STAGES | {RecruitmentStage.HIRED}

def allow_fail(stages):
    """Helper: Menambahkan opsi REJECTED pada set transisi"""
    return set(stages) | {RecruitmentStage.REJECTED}

# Definisi Alur Perpindahan Status
# Key: Status Sekarang -> Value: Status yang Diperbolehkan Selanjutnya
ALLOWED_TRANSITIONS = {
    RecruitmentStage.CV_SCREENING:   allow_fail({RecruitmentStage.AI_SCREENING}),
    RecruitmentStage.AI_SCREENING:   allow_fail({RecruitmentStage.RANKING, RecruitmentStage.HR_REVIEW}),
    RecruitmentStage.RANKING:        allow_fail({RecruitmentStage.HR_REVIEW, RecruitmentStage.PSYCHOTEST}),
    
    RecruitmentStage.HR_REVIEW:      allow_fail({RecruitmentStage.PSYCHOTEST}),
    
    RecruitmentStage.PSYCHOTEST:     allow_fail({RecruitmentStage.INTERVIEW_HR}),
    
    RecruitmentStage.INTERVIEW_HR:   allow_fail({RecruitmentStage.INTERVIEW_USER}),
    RecruitmentStage.INTERVIEW_USER: allow_fail({RecruitmentStage.FINAL_SELECTION, RecruitmentStage.OFFERING}),
    
    RecruitmentStage.FINAL_SELECTION: allow_fail({RecruitmentStage.OFFERING}),
    
    RecruitmentStage.OFFERING:       {RecruitmentStage.NEGOTIATION, RecruitmentStage.OFFERING_ACCEPTED, RecruitmentStage.OFFERING_DECLINED},
    RecruitmentStage.NEGOTIATION:    {RecruitmentStage.OFFERING_ACCEPTED, RecruitmentStage.OFFERING_DECLINED},
    
    RecruitmentStage.OFFERING_ACCEPTED: {RecruitmentStage.MCU_PROCESS},
    
    RecruitmentStage.MCU_PROCESS:    {RecruitmentStage.MCU_REVIEW, RecruitmentStage.MCU_FAILED},
    RecruitmentStage.MCU_REVIEW:     {RecruitmentStage.TICKET, RecruitmentStage.ONBOARDING, RecruitmentStage.MCU_FAILED},
    
    RecruitmentStage.TICKET:         {RecruitmentStage.ONBOARDING},
    RecruitmentStage.ONBOARDING:     {RecruitmentStage.HIRED},
}

def is_valid_transition(current_stage, new_stage):
    """Memvalidasi apakah perpindahan status diperbolehkan sesuai flow"""
    # 1. Jika belum ada status (awal), hanya boleh masuk ke CV Screening
    if current_stage is None:
        return new_stage == RecruitmentStage.CV_SCREENING
    
    # 2. Jika status sama, izinkan (untuk update notes/metadata tanpa pindah tahap)
    if current_stage == new_stage:
        return True
        
    # 3. Cek di dictionary allowed transitions
    allowed_next_stages = ALLOWED_TRANSITIONS.get(current_stage, set())
    return new_stage in allowed_next_stages

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_or_create_journey(application_id):
    """Lazy loader untuk RecruitmentJourney"""
    journey = RecruitmentJourney.query.filter_by(application_id=application_id).first()
    if not journey:
        journey = RecruitmentJourney(
            application_id=application_id,
            current_stage=RecruitmentStage.CV_SCREENING,
            stage_data={}
        )
        db.session.add(journey)
        db.session.flush()  # Get journey ID before creating log
        
        # Create initial log entry for CV_SCREENING
        initial_log = JourneyLog(
            journey_id=journey.id,
            previous_stage=None,
            new_stage=RecruitmentStage.CV_SCREENING.value,
            action="Journey started - CV Screening",
            notes="Candidate application received and CV screening initiated",
            actor_name="System"
        )
        db.session.add(initial_log)
        db.session.commit()
    return journey


# ==========================================
# 2. ROUTES
# ==========================================

@tracing_bp.route("/<application_id>", methods=["GET"])
def get_timeline(application_id):
    app = db.session.get(JobApplication, application_id)
    if not app:
        return jsonify({"error": "Aplikasi tidak ditemukan"}), 404

    journey = get_or_create_journey(app.id)

    return jsonify({
        "application_id": app.id,
        "candidate_name": app.candidate.name,
        "job_title": app.job.title,
        "current_stage": journey.current_stage.name,  # Use .name instead of .value
        "metadata": journey.stage_data,
        "history": [log.to_dict() for log in journey.logs]
    })


@tracing_bp.route("/candidate/<candidate_id>", methods=["GET"])
def get_timeline_by_candidate(candidate_id):
    """Alternative endpoint: Get journey using candidate_id instead of application_id"""
    from app.models import Candidate
    
    # Get candidate
    candidate = db.session.get(Candidate, candidate_id)
    if not candidate:
        return jsonify({"error": "Kandidat tidak ditemukan"}), 404
    
    # Find the first (or most recent) job application for this candidate
    if not candidate.applications or len(candidate.applications) == 0:
        return jsonify({
            "error": "No job application found",
            "message": "Kandidat belum melamar pekerjaan apapun"
        }), 404
    
    # Use the most recent application
    app = candidate.applications[0]
    
    journey = get_or_create_journey(app.id)

    return jsonify({
        "application_id": app.id,
        "candidate_name": app.candidate.name,
        "job_title": app.job.title,
        "current_stage": journey.current_stage.name,  # Use .name instead of .value
        "metadata": journey.stage_data,
        "history": [log.to_dict() for log in journey.logs]
    })



@tracing_bp.route("/update-stage", methods=["POST"])
def update_stage():
    """
    Memindahkan status kandidat dengan validasi ketat.
    Wajib menyertakan alasan (notes) jika statusnya REJECTED/FAILED.
    """
    data = request.get_json()
    app_id = data.get("application_id")
    new_stage_str = data.get("new_stage") 
    notes = data.get("notes", "").strip()
    actor_name = data.get("actor_name", "HR Admin") 

    # 1. Validasi Input Dasar
    if not app_id or not new_stage_str:
        return jsonify({"error": "ID Aplikasi dan Status Baru wajib diisi"}), 400

    app = db.session.get(JobApplication, app_id)
    if not app:
        return jsonify({"error": "Aplikasi tidak ditemukan"}), 404

    journey = get_or_create_journey(app_id)

    # 2. Validasi Format Enum - Accept both name and value
    try:
        # Try to get enum by name first (e.g., "AI_SCREENING")
        try:
            new_stage_enum = RecruitmentStage[new_stage_str]
        except KeyError:
            # If not found, try by value (e.g., "AI Screening")
            new_stage_enum = next(
                (s for s in RecruitmentStage if s.value == new_stage_str), None
            )
        
        if not new_stage_enum:
             return jsonify({"error": f"Status '{new_stage_str}' tidak valid dalam sistem"}), 400
    except ValueError:
        return jsonify({"error": "Format status salah"}), 400

    # 3. Validasi Flow (State Machine)
    if not is_valid_transition(journey.current_stage, new_stage_enum):
        return jsonify({
            "error": "Transisi status tidak diizinkan",
            "message": f"Tidak bisa pindah langsung dari '{journey.current_stage.value}' ke '{new_stage_enum.value}'"
        }), 400

    # 4. [PENTING] Validasi Mandatory Notes untuk Rejection
    if new_stage_enum in REJECTION_STAGES and not notes:
        return jsonify({
            "error": "Catatan Wajib Diisi",
            "message": f"Untuk status '{new_stage_enum.value}', Anda wajib menyertakan alasan penolakan di kolom catatan."
        }), 400

    # 5. Proses Update
    old_stage_enum = journey.current_stage
    journey.current_stage = new_stage_enum
    
    # Update juga status di JobApplication utama agar sinkron
    # (Opsional, tergantung desain DB Anda mau double store atau tidak)
    # app.status = new_stage_enum.name 

    # 6. Logging
    action_title = f"Status updated: {new_stage_enum.value}"
    if new_stage_enum in REJECTION_STAGES:
        action_title = f"DECISION: {new_stage_enum.value.upper()}"

    log = JourneyLog(
        journey_id=journey.id,
        previous_stage=old_stage_enum.value if old_stage_enum else None,
        new_stage=new_stage_enum.value,
        action=action_title,
        notes=notes, # Notes berisi alasan penolakan jika rejected
        actor_name=actor_name
    )
    
    db.session.add(log)
    db.session.commit()

    # 7. Generate WhatsApp Link (Kecuali tahap internal seperti HR Review)
    wa_link = None
    if app.candidate:
        # Filter tahap yang perlu notif ke kandidat
        if new_stage_enum not in [RecruitmentStage.HR_REVIEW, RecruitmentStage.RANKING]:
            wa_link = generate_wa_link(
                candidate_phone=app.candidate.phone,
                candidate_name=app.candidate.name,
                stage=new_stage_enum.value,
                additional_info=notes
            )

    return jsonify({
        "message": f"Berhasil memindahkan kandidat ke {new_stage_enum.value}",
        "current_stage": new_stage_enum.value,
        "whatsapp_link": wa_link,
        "timestamp": datetime.now().isoformat()
    })


@tracing_bp.route("/upload-doc", methods=["POST"])
def upload_document():
    if 'file' not in request.files:
        return jsonify({"error": "File tidak ditemukan"}), 400
    
    f = request.files['file']
    app_id = request.form.get("application_id")
    doc_type = request.form.get("doc_type") # 'ticket', 'mcu', 'offering'
    notes = request.form.get("notes", "")
    
    # Validasi App ID
    if not app_id:
        return jsonify({"error": "Application ID required"}), 400

    if f and allowed_file(f.filename):
        # 1. Simpan File
        clean_filename = secure_filename(f"{doc_type}_{app_id}_{f.filename}")
        path = os.path.join(UPLOAD_DOCS_FOLDER, clean_filename)
        f.save(path)
        
        # URL File relative terhadap root static
        file_relative_path = f"/static/uploads/documents/{clean_filename}"
        
        # 2. Update Journey Metadata
        journey = get_or_create_journey(app_id)
        
        current_data = dict(journey.stage_data) if journey.stage_data else {}
        current_data[f"{doc_type}_url"] = file_relative_path
        current_data[f"{doc_type}_uploaded_at"] = datetime.now().isoformat()
        
        journey.stage_data = current_data
        
        # 3. Log Aktivitas
        log = JourneyLog(
            journey_id=journey.id,
            previous_stage=journey.current_stage.value,
            new_stage=journey.current_stage.value,
            action=f"Document Uploaded: {doc_type.upper()}",
            notes=notes or f"File {doc_type} uploaded",
            actor_name="System/HR"
        )
        db.session.add(log)
        db.session.commit()

        # 4. Generate WA Link (Menggunakan Domain Dinamis)
        app = db.session.get(JobApplication, app_id)
        wa_link = None
        
        if app and app.candidate:
            # Membuat Full URL (misal: http://192.168.1.5:5000/static/...)
            # request.host_url sudah menyertakan scheme (http) dan port
            base_url = request.host_url.rstrip('/')
            full_doc_url = f"{base_url}{file_relative_path}"
            
            # Mapping tipe dokumen ke nama stage untuk pesan WA
            doc_map = {
                "ticket": "Flight Ticket", 
                "mcu": "Medical Check Up", 
                "offering": "Offering Letter"
            }
            stage_name_for_wa = doc_map.get(doc_type, "Document Update")
            
            wa_link = generate_wa_link(
                candidate_phone=app.candidate.phone,
                candidate_name=app.candidate.name,
                stage=stage_name_for_wa,
                additional_info=full_doc_url  # Kirim link lengkap
            )
        
        return jsonify({
            "message": "File berhasil diupload",
            "url": file_relative_path,
            "whatsapp_link": wa_link,
            "data": current_data
        })
    
    return jsonify({"error": "Format file tidak diizinkan (Gunakan PDF/JPG/PNG)"}), 400