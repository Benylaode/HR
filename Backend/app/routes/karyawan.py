from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt, verify_jwt_in_request
from sqlalchemy.exc import IntegrityError
from app import db
from app.models import Employee
from datetime import datetime

employees_bp = Blueprint("employees", __name__, url_prefix="/employees")

@employees_bp.before_request
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

def employee_to_dict(emp: Employee):
    test_status = emp.test_link.status.capitalize() if emp.test_link else "Pending"

    return {
        "id": emp.id,
        "employee_status": emp.employee_status,
        "nik_ktp": emp.nik_ktp, # <--- TAMBAHAN NIK KTP
        "fullName": emp.full_name,
        "email": emp.email,
        "whatsapp": emp.whatsapp,
        "gender": emp.gender,
        "religion": emp.religion,
        "birthPlace": emp.birth_place,
        "birthDate": emp.birth_date.isoformat() if emp.birth_date else None,
        "driverLicense": emp.driver_license,
        "address": emp.address,
        "city": emp.city,
        "province": emp.province,
        
        "education": emp.education,
        "university": emp.university,
        "major": emp.major,
        "gpa": emp.gpa,
        "socialMedia": emp.social_media,
        
        "positionApplied": emp.position_applied, # Bisa diasumsikan sebagai "Current Position" untuk karyawan
        "lastCompany": emp.last_company,
        "lastPosition": emp.last_position,
        "lastPositionLevel": emp.last_position_level,
        "lastCompanyField": emp.last_company_field,
        "totalExperience": emp.total_experience_years,
        "experienceDescription": emp.experience_description,

        "test_status": test_status,
        "created_at": emp.created_at.isoformat() if emp.created_at else None
    }


@employees_bp.route("", methods=["POST"])
def create_employee():
    data = request.get_json(force=True)

    try:
        birth_date = None
        if data.get("birthDate"):
            birth_date = datetime.strptime(data["birthDate"], "%Y-%m-%d").date()

        emp = Employee(
            nik_ktp=data.get("nik_ktp"), # <--- TAMBAHAN NIK KTP
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

        db.session.add(emp)
        db.session.commit()

        return jsonify({
            "message": "Employee created successfully",
            "data": employee_to_dict(emp)
        }), 201

    except IntegrityError as e:
        db.session.rollback()
        return jsonify({"error": "Database integrity error"}), 400
    except ValueError as e:
        return jsonify({"error": f"Invalid data format: {str(e)}"}), 400

@employees_bp.route("", methods=["GET"])
def list_employees():
    employees = Employee.query.order_by(Employee.created_at.desc()).all()
    return jsonify([employee_to_dict(e) for e in employees])

@employees_bp.route("/<employee_id>", methods=["GET"])
def get_employee(employee_id):
    emp = Employee.query.get(employee_id)
    if not emp:
        return jsonify({"error": "Employee not found"}), 404
    return jsonify(employee_to_dict(emp))

@employees_bp.route("/<employee_id>", methods=["DELETE"])
def delete_employee(employee_id):
    emp = Employee.query.get(employee_id)
    if not emp:
        return jsonify({"error": "Employee not found"}), 404

    db.session.delete(emp)
    db.session.commit()
    return jsonify({"message": "Employee deleted successfully"})

@employees_bp.route("/<employee_id>", methods=["PUT"])
def update_employee(employee_id):
    # Cari data karyawan berdasarkan ID
    emp = Employee.query.get(employee_id)
    if not emp:
        return jsonify({"error": "Employee not found"}), 404

    data = request.get_json(force=True)

    try:
        if "nik_ktp" in data: emp.nik_ktp = data["nik_ktp"] # <--- TAMBAHAN NIK KTP
        
        # Update field-field utama yang ada di Modal Edit Frontend
        if "fullName" in data:
            emp.full_name = data["fullName"]
        if "email" in data:
            emp.email = data["email"]
        if "whatsapp" in data:
            emp.whatsapp = data["whatsapp"]
        if "city" in data:
            emp.city = data["city"]
        if "positionApplied" in data:
            emp.position_applied = data["positionApplied"]
        if "employee_status" in data:
            emp.employee_status = data["employee_status"]

        # [OPSIONAL] Update untuk field lainnya jika nantinya form edit diperluas
        if "gender" in data:
            emp.gender = data["gender"]
        if "religion" in data:
            emp.religion = data["religion"]
        if "birthPlace" in data:
            emp.birth_place = data["birthPlace"]
        if "birthDate" in data:
            if data["birthDate"]:
                emp.birth_date = datetime.strptime(data["birthDate"], "%Y-%m-%d").date()
            else:
                emp.birth_date = None
        if "driverLicense" in data:
            emp.driver_license = data["driverLicense"]
        if "address" in data:
            emp.address = data["address"]
        if "province" in data:
            emp.province = data["province"]
        if "education" in data:
            emp.education = data["education"]
        if "university" in data:
            emp.university = data["university"]
        if "major" in data:
            emp.major = data["major"]
        if "gpa" in data:
            emp.gpa = data["gpa"]
        if "socialMedia" in data:
            emp.social_media = data["socialMedia"]
        if "lastCompany" in data:
            emp.last_company = data["lastCompany"]
        if "lastPosition" in data:
            emp.last_position = data["lastPosition"]
        if "lastPositionLevel" in data:
            emp.last_position_level = data["lastPositionLevel"]
        if "lastCompanyField" in data:
            emp.last_company_field = data["lastCompanyField"]
        if "totalExperience" in data:
            emp.total_experience_years = data["totalExperience"]
        if "experienceDescription" in data:
            emp.experience_description = data["experienceDescription"]

        # Simpan perubahan ke database
        db.session.commit()

        return jsonify({
            "message": "Employee updated successfully",
            "data": employee_to_dict(emp)
        }), 200

    except IntegrityError as e:
        db.session.rollback()
        return jsonify({"error": "Database integrity error. Email atau WhatsApp mungkin sudah digunakan."}), 400
    except ValueError as e:
        return jsonify({"error": f"Invalid data format: {str(e)}"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Terjadi kesalahan pada server: {str(e)}"}), 500
    

# ==========================================
# ENDPOINT UNTUK FITUR ASSIGN MANPOWER
# ==========================================

@employees_bp.route("/unassigned", methods=["GET"])
def get_unassigned_employees():
    """Mengambil daftar karyawan yang belum memiliki formasi (manpower_id is NULL)"""
    try:
        # Cari karyawan aktif yang manpower_id-nya masih kosong
        unassigned_emps = Employee.query.filter(
            Employee.manpower_id.is_(None),
            Employee.employee_status == "Active"
        ).order_by(Employee.full_name.asc()).all()
        
        # Format kembalian ke list dictionary
        result = [{"id": emp.id, "full_name": emp.full_name} for emp in unassigned_emps]
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": f"Gagal mengambil data karyawan: {str(e)}"}), 500


@employees_bp.route("/<employee_id>/assign", methods=["PUT"])
def assign_employee_to_manpower(employee_id):
    """Menyambungkan karyawan dengan ID formasi (manpower_id) tertentu"""
    emp = Employee.query.get(employee_id)
    if not emp:
        return jsonify({"error": "Karyawan tidak ditemukan"}), 404

    data = request.get_json(force=True)
    manpower_id = data.get("manpower_id")

    if not manpower_id:
        return jsonify({"error": "manpower_id wajib disertakan"}), 400

    try:
        emp.manpower_id = manpower_id
        db.session.commit()
        return jsonify({
            "message": "Karyawan berhasil ditugaskan ke formasi!",
            "data": {"employee_id": emp.id, "manpower_id": emp.manpower_id}
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Terjadi kesalahan saat assign: {str(e)}"}), 500