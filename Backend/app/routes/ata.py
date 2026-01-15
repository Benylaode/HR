from flask import Blueprint, request, jsonify
from app import db
from app.models import ATARequest, JobPosition
from datetime import datetime, timezone
import os
from werkzeug.utils import secure_filename

ata_bp = Blueprint("ata", __name__, url_prefix="/ata")

UPLOAD_ATA_FOLDER = 'app/static/uploads/ata_docs'
if not os.path.exists(UPLOAD_ATA_FOLDER):
    os.makedirs(UPLOAD_ATA_FOLDER)

ALLOWED_ATA_EXTENSIONS = {'pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_ATA_EXTENSIONS

def generate_request_id():
    year = datetime.now().year
    count = ATARequest.query.filter(ATARequest.id.like(f"REQ-{year}-%")).count()
    sequence = count + 1
    return f"REQ-{year}-{sequence:03d}"

@ata_bp.route("", methods=["POST"])
def create_ata_request():
    # PERBAIKAN UTAMA: Gunakan request.form, bukan request.get_json()
    # karena client mengirim Multipart Form Data
    data = request.form
    
    # Validasi field wajib sederhana
    if not data.get("title"):
        return jsonify({"error": "Title is required"}), 400

    req_id = generate_request_id()
    
    # Handle File Upload
    attachment_path = None
    if 'file' in request.files:
        f = request.files['file']
        if f and f.filename != '' and allowed_file(f.filename):
            filename = secure_filename(f"{req_id}_{f.filename}")
            save_path = os.path.join(UPLOAD_ATA_FOLDER, filename)
            f.save(save_path)
            attachment_path = f"/static/uploads/ata_docs/{filename}"

    try:
        # Konversi salary aman (handle string kosong)
        s_min = data.get("salary_min")
        s_max = data.get("salary_max")
        
        salary_min = int(s_min) if s_min and s_min.isdigit() else 0
        salary_max = int(s_max) if s_max and s_max.isdigit() else 0

        new_req = ATARequest(
            id=req_id,
            requester_name=data.get("requester_name", "User"),
            title=data.get("title"),
            department=data.get("department"),
            level=data.get("level"),
            location=data.get("location"),
            employment_type=data.get("employment_type"),
            salary_min=salary_min,
            salary_max=salary_max,
            justification=data.get("justification", ""),
            attachment_url=attachment_path # Simpan URL file
        )
        
        db.session.add(new_req)
        db.session.commit()
        
        return jsonify({
            "message": "ATA Request submitted successfully",
            "id": req_id,
            "attachment": attachment_path,
            "next_step": "Waiting for HR Approval"
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400

# 2. APPROVAL ENDPOINT (Tetap JSON)
@ata_bp.route("/<req_id>/approve", methods=["POST"])
def approve_ata(req_id):
    # Approval tidak butuh file, jadi tetap pakai JSON
    data = request.get_json()
    role = data.get("role") 
    decision = data.get("decision") 
    notes = data.get("notes", "")
    
    # Ganti query.get dengan db.session.get (Modern SQLAlchemy)
    req = db.session.get(ATARequest, req_id)
    if not req:
        return jsonify({"error": "Request not found"}), 404

    now = datetime.now(timezone.utc)

    if decision == "Rejected":
        req.status = "Rejected"
        if role == "HR":
            req.hr_status, req.hr_notes, req.hr_date = "Rejected", notes, now
        elif role == "KTT":
            req.ktt_status, req.ktt_notes, req.ktt_date = "Rejected", notes, now
        elif role == "HO":
            req.ho_status, req.ho_notes, req.ho_date = "Rejected", notes, now
            
        db.session.commit()
        return jsonify({"message": f"ATA Rejected by {role}", "status": "Rejected"})

    # Logic Approve
    if role == "HR":
        req.hr_status, req.hr_notes, req.hr_date = "Approved", notes, now
        
    elif role == "KTT":
        if req.hr_status != "Approved": return jsonify({"error": "HR must approve first"}), 400
        req.ktt_status, req.ktt_notes, req.ktt_date = "Approved", notes, now
        
    elif role == "HO":
        if req.ktt_status != "Approved": return jsonify({"error": "KTT must approve first"}), 400
        req.ho_status, req.ho_notes, req.ho_date = "Approved", notes, now
        
        req.status = "Approved"
        
        # Auto-Create Job Position
        new_job = JobPosition(
            title=req.title,
            department=req.department,
            level=req.level,
            location=req.location,
            employment_type=req.employment_type,
            salary_min=req.salary_min,
            salary_max=req.salary_max,
            job_description=req.justification or "Job created from ATA",
            status="active",
            available=True
        )
        db.session.add(new_job)
        db.session.commit()
        
        return jsonify({
            "message": "ATA Fully Approved. Job Position Created.",
            "job_id": new_job.id,
            "status": "Approved"
        })

    db.session.commit()
    return jsonify({
        "message": f"Approved by {role}",
        "request_status": req.status
    })