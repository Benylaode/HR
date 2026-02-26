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
        # Menggunakan request.form karena client mengirim File (Multipart Form Data)
        data = request.form
        
        # Validasi field wajib (contoh: position adalah jabatan yang diajukan)
        if not data.get("position"):
            return jsonify({"error": "Position is required"}), 400

        req_id = generate_request_id()
        
        # Handle File Upload (Scan ATA)
        attachment_path = None
        if 'file' in request.files:
            f = request.files['file']
            if f and f.filename != '' and allowed_file(f.filename):
                filename = secure_filename(f"{req_id}_{f.filename}")
                save_path = os.path.join(UPLOAD_ATA_FOLDER, filename)
                f.save(save_path)
                attachment_path = f"/static/uploads/ata_docs/{filename}"

        try:
            # Mapping ke struktur ATA Request yang baru
            new_req = ATARequest(
                id=req_id,
                candidate_name=data.get("candidateName"),
                employee_no=data.get("employeeNo"),
                company=data.get("company"),
                position=data.get("position"),
                grade=data.get("grade"),
                report_to=data.get("reportTo"),
                department=data.get("department"),
                division=data.get("division"),
                budget_type=data.get("budgetType"),
                employment_agreement=data.get("employmentAgreement"),
                staff_status=data.get("staffStatus"),
                point_of_hire=data.get("pointOfHire"),
                hired_type=data.get("hiredType"),
                requirements_note=data.get("requirementsNote"),
                scan_ata_url=attachment_path, # Menyimpan path file Scan ATA
                requester_name=data.get("requesterName", "User")
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
        
        # Update response JSON menyesuaikan kolom baru
        return jsonify({
            "id": req.id,
            "requester_name": req.requester_name,
            "candidate_name": req.candidate_name,
            "employee_no": req.employee_no,
            "company": req.company,
            "position": req.position,
            "grade": req.grade,
            "report_to": req.report_to,
            "department": req.department,
            "division": req.division,
            "budget_type": req.budget_type,
            "employment_agreement": req.employment_agreement,
            "staff_status": req.staff_status,
            "point_of_hire": req.point_of_hire,
            "hired_type": req.hired_type,
            "requirements_note": req.requirements_note,
            "scan_ata_url": req.scan_ata_url,
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


# APPROVAL ENDPOINT
@ata_bp.route("/<req_id>/approve", methods=["POST"])
def approve_ata(req_id):
    data = request.get_json()
    role = data.get("role") 
    decision = data.get("decision") 
    notes = data.get("notes", "")
    
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
            "position": req.position,
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
        
        # Auto-Create Job Position berdasar form ATA yang baru
        new_job = JobPosition(
            title=req.position,
            department=req.department,
            level=req.grade or req.staff_status or "Staff",
            location=req.point_of_hire or "Konawe",
            employment_type=req.employment_agreement or "Full-time",
            job_description=req.requirements_note or f"Job position created from ATA for {req.position}.",
            status="active",
            available=True
        )
        db.session.add(new_job)
        db.session.flush() # Mendapatkan ID job position tanpa harus full commit
        
        # Update req.job_id agar terhubung antara ATA dan Job Position
        req.job_id = new_job.id
        
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