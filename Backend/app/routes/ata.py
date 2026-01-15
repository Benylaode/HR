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

@ata_bp.route("", methods=["GET", "POST"])
def handle_ata_requests():
    # GET: List all ATA requests
    if request.method == "GET":
        try:
            requests = ATARequest.query.order_by(ATARequest.created_at.desc()).all()
            return jsonify([req.to_dict() for req in requests])
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    # POST: Create new ATA request
    if request.method == "POST":
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


# GET SINGLE ATA REQUEST DETAIL
@ata_bp.route("/<req_id>", methods=["GET"])
def get_request_detail(req_id):
    try:
        req = db.session.get(ATARequest, req_id)
        if not req:
            return jsonify({"error": "Request not found"}), 404
        
        return jsonify({
            "id": req.id,
            "requester_name": req.requester_name,
            "title": req.title,
            "department": req.department,
            "level": req.level,
            "location": req.location,
            "employment_type": req.employment_type,
            "salary_min": req.salary_min,
            "salary_max": req.salary_max,
            "justification": req.justification,
            "attachment_url": req.attachment_url,
            "status": req.status,
            "hr_status": req.hr_status,
            "hr_notes": req.hr_notes,
            "hr_date": req.hr_date.isoformat() if req.hr_date else None,
            "ktt_status": req.ktt_status,
            "ktt_notes": req.ktt_notes,
            "ktt_date": req.ktt_date.isoformat() if req.ktt_date else None,
            "ho_status": req.ho_status,
            "ho_notes": req.ho_notes,
            "ho_date": req.ho_date.isoformat() if req.ho_date else None,
            "created_at": req.created_at.isoformat() if req.created_at else None,
            "job_id": req.job_id,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

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
        return jsonify({
            "message": f"ATA Request DITOLAK oleh {role}", 
            "status": "Rejected",
            "rejected_by": role,
            "rejected_reason": notes,
            "job_title": req.title,
            "requester": req.requester_name
        })

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