from flask import Blueprint, request, jsonify, make_response
from flask_jwt_extended import get_jwt, verify_jwt_in_request
from sqlalchemy import or_, asc, desc
from app import db
from app.models import Manpower, Employee, Candidate, JobApplication

manpower_bp = Blueprint('manpower', __name__)

# ==========================================
# FUNGSI HELPER: Mencegah Error String Kosong ("") dari Frontend
# ==========================================
def parse_int_or_none(value, default=None):
    if value in [None, "", "null", "None"]:
        return default
    try:
        return int(value)
    except ValueError:
        return default


@manpower_bp.before_request
def restrict_access_by_role():
    # --- PERBAIKAN CORS PREFLIGHT ---
    # Kembalikan HTTP Status 200 OK secara eksplisit untuk request OPTIONS
    if request.method == "OPTIONS":
            response = make_response()
            # Berikan izin ke domain yang me-request (contoh: localhost:3000)
            origin = request.headers.get("Origin", "*")
            response.headers.add("Access-Control-Allow-Origin", origin)
            response.headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, X-Title")
            response.headers.add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
            return response, 200
    try:
        verify_jwt_in_request()
    except Exception as e:
        return jsonify({"status": 401, "message": "Akses ditolak. Token tidak valid."}), 401

    claims = get_jwt()
    role = claims.get("role")
    if role not in ["HR", "SUPER_USER", "HO", "USER"]:
        return jsonify({"status": 403, "message": f"Akses ditolak untuk role: {role}"}), 403

# --- 1. GET ALL (Tanpa Paginasi - Untuk Org Chart & Dropdown) ---
@manpower_bp.route('/all', methods=['GET'])
def get_all_manpower():
    try:
        claims = get_jwt()
        role = claims.get("role")
        user_department = claims.get("department") 
        query = Manpower.query
        
        if role not in ["SUPER_USER", "HR", "HO"]:
            if user_department:
                query = query.filter(or_(
                    Manpower.department == user_department,
                    Manpower.pointer_divisi == user_department 
                ))
            else:
                return jsonify([]), 200
                
        slots = query.order_by(desc(Manpower.id)).all()
        return jsonify([slot.to_dict() for slot in slots]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# --- 2. GET PAGINATED (Tabel Data - Menampilkan Semua Slot) ---
@manpower_bp.route('/paginated', methods=['GET'])
def get_paginated_manpower():
    try:
        claims = get_jwt()
        role = claims.get("role")
        user_department = claims.get("department")

        page = request.args.get('page', 1, type=int)
        page_size = request.args.get('page_size', 10, type=int)
        search = request.args.get('search', '', type=str)
        department = request.args.get('department', '', type=str)
        sort_by = request.args.get('sort_by', 'id', type=str)
        sort_dir = request.args.get('sort_dir', 'desc', type=str)

        query = Manpower.query

        if role not in ["SUPER_USER", "HR", "HO"]:
            if user_department:
                query = query.filter(or_(
                    Manpower.department == user_department,
                    Manpower.pointer_divisi == user_department
                ))
            else:
                return jsonify({"items": [], "total": 0}), 200

        if search:
            search_term = f"%{search}%"
            query = query.filter(or_(
                Manpower.position_title.ilike(search_term),
                Manpower.department.ilike(search_term),
                Manpower.division.ilike(search_term) 
            ))

        if department:
            query = query.filter(Manpower.department == department)

        if hasattr(Manpower, sort_by):
            sort_column = getattr(Manpower, sort_by)
            query = query.order_by(asc(sort_column)) if sort_dir == 'asc' else query.order_by(desc(sort_column))
        else:
            query = query.order_by(desc(Manpower.id))

        paginated_data = query.paginate(page=page, per_page=page_size, error_out=False)

        return jsonify({
            "items": [slot.to_dict() for slot in paginated_data.items],
            "total": paginated_data.total,
            "page": paginated_data.page,
            "total_pages": paginated_data.pages,
            "page_size": paginated_data.per_page
        }), 200

    except Exception as e:
        return jsonify({"error": f"Terjadi kesalahan sistem: {str(e)}"}), 500


# --- 3. CREATE (Tambah Formasi) ---
@manpower_bp.route('/', methods=['POST'])
def create_manpower():
    data = request.json
    position_title = data.get('position_title')
    department = data.get('department')
    
    if not position_title or not department:
        return jsonify({"error": "Position Title dan Department wajib diisi"}), 400

    # Gunakan fungsi parse aman untuk menghindari ValueError saat string kosong ""
    reports_to_id = parse_int_or_none(data.get('reports_to_id'))
    tingkat_bawahan = parse_int_or_none(data.get('tingkat'), 99)
    tingkat_managerial = parse_int_or_none(data.get('tingkat_managerial'))
    tingkat_divisi = parse_int_or_none(data.get('tingkat_divisi'))
    pointer_divisi = data.get('pointer_divisi') if data.get('pointer_divisi') != "" else None
    
    if reports_to_id:
        boss = Manpower.query.get(reports_to_id)
        if boss:
            tingkat_bos = boss.tingkat_divisi if boss.tingkat_divisi is not None else boss.tingkat
            if tingkat_bawahan <= tingkat_bos:
                return jsonify({"error": f"Tingkat bawahan ({tingkat_bawahan}) tidak boleh lebih tinggi atau sama dengan Bosnya ({tingkat_bos})!"}), 400

    try:
        new_slot = Manpower(
            position_title=position_title,
            level=data.get('level', '-'),
            tingkat=tingkat_bawahan,
            grade=data.get('grade', '-'),
            division=data.get('division') if data.get('division') != "" else None, 
            department=department,
            section=data.get('section', ''), 
            work_location=data.get('work_location', 'Kantor Pusat - Makassar'),
            reports_to_id=reports_to_id,
            tingkat_managerial=tingkat_managerial,
            tingkat_divisi=tingkat_divisi,
            pointer_divisi=pointer_divisi
        )
        db.session.add(new_slot)
        db.session.commit()
        return jsonify({"message": "Formasi berhasil ditambahkan!", "data": new_slot.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Gagal menyimpan data: {str(e)}"}), 500


# --- 4. UPDATE (Edit Formasi) ---
@manpower_bp.route('/<int:id>', methods=['PUT'])
def update_manpower(id):
    slot = Manpower.query.get(id)
    if not slot:
        return jsonify({"error": "Formasi tidak ditemukan"}), 404

    data = request.json
    
    # Parse aman
    reports_to_id = parse_int_or_none(data.get('reports_to_id'))
    tingkat_bawahan = parse_int_or_none(data.get('tingkat'), slot.tingkat)
    tingkat_managerial = parse_int_or_none(data.get('tingkat_managerial'))
    tingkat_divisi = parse_int_or_none(data.get('tingkat_divisi'))
    pointer_divisi = data.get('pointer_divisi') if data.get('pointer_divisi') != "" else None
    
    if reports_to_id and reports_to_id != slot.reports_to_id:
        boss = Manpower.query.get(reports_to_id)
        if boss:
            tingkat_bos = boss.tingkat_divisi if boss.tingkat_divisi is not None else boss.tingkat
            if tingkat_bawahan <= tingkat_bos:
                return jsonify({"error": f"Tingkat bawahan ({tingkat_bawahan}) tidak boleh lebih tinggi/sama dengan Bosnya ({tingkat_bos})!"}), 400

    try:
        slot.position_title = data.get('position_title', slot.position_title)
        slot.level = data.get('level', slot.level)
        slot.tingkat = tingkat_bawahan
        slot.grade = data.get('grade', slot.grade)
        slot.division = data.get('division', slot.division)
        slot.department = data.get('department', slot.department)
        slot.work_location = data.get('work_location', slot.work_location)
        slot.reports_to_id = reports_to_id
        slot.tingkat_managerial = tingkat_managerial
        slot.tingkat_divisi = tingkat_divisi
        slot.pointer_divisi = pointer_divisi

        db.session.commit()
        return jsonify({"message": "Formasi berhasil diperbarui!"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Gagal memperbarui data: {str(e)}"}), 500


# --- 5. DELETE (Hapus Formasi) ---
@manpower_bp.route('/<int:id>', methods=['DELETE'])
def delete_manpower(id):
    slot = Manpower.query.get(id)
    if not slot:
        return jsonify({"error": "Formasi tidak ditemukan"}), 404

    if len(slot.karyawan_list) > 0:
        return jsonify({"error": "Tidak bisa menghapus formasi karena masih ada karyawan yang mengisinya. Kosongkan slot terlebih dahulu."}), 400

    try:
        db.session.delete(slot)
        db.session.commit()
        return jsonify({"message": "Formasi berhasil dihapus!"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Gagal menghapus formasi: {str(e)}"}), 500


# --- 6. Ambil Daftar Orang (Karyawan Kosong & Kandidat) ---
@manpower_bp.route('/available-persons', methods=['GET'])
def get_available_persons():
    try:
        # Karyawan aktif yang belum punya jabatan
        unassigned_emps = Employee.query.filter(
            Employee.manpower_id.is_(None), 
            Employee.employee_status == 'Active'
        ).order_by(Employee.full_name.asc()).all()
        emps_data = [{"id": e.id, "name": e.full_name, "type": "employee"} for e in unassigned_emps]
        
        # PERBAIKAN: Filter Kandidat agar yang sudah 'Hired' tidak muncul lagi
        hired_candidate_ids = [app.candidate_id for app in JobApplication.query.filter_by(status="Hired").all()]
        
        candidate_query = Candidate.query
        if hired_candidate_ids:
            candidate_query = candidate_query.filter(~Candidate.id.in_(hired_candidate_ids))
            
        cands = candidate_query.order_by(Candidate.full_name.asc()).all()
        cands_data = [{"id": c.id, "name": c.full_name, "type": "candidate"} for c in cands]
        
        return jsonify({"employees": emps_data, "candidates": cands_data}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# --- 7. ASSIGN KARYAWAN (Isi Slot) ---
@manpower_bp.route('/<int:manpower_id>/assign', methods=['POST'])
def assign_manpower(manpower_id):
    data = request.json
    person_type = data.get("type") 
    person_id = data.get("id")
    
    manpower = Manpower.query.get(manpower_id)
    if not manpower: 
        return jsonify({"error": "Formasi tidak ditemukan"}), 404
        
    try:
        if person_type == "employee":
            emp = Employee.query.get(person_id)
            if not emp: return jsonify({"error": "Karyawan tidak ditemukan"}), 404
            emp.manpower_id = manpower_id
            
        elif person_type == "candidate":
            cand = Candidate.query.get(person_id)
            if not cand: return jsonify({"error": "Kandidat tidak ditemukan"}), 404
            
            new_emp = Employee(
                full_name=cand.full_name, email=cand.email, whatsapp=cand.whatsapp,
                gender=cand.gender, birth_date=cand.birth_date, birth_place=cand.birth_place,
                religion=cand.religion, address=cand.address, city=cand.city, province=cand.province,
                education=cand.education, university=cand.university, major=cand.major, gpa=cand.gpa,
                manpower_id=manpower_id, employee_status="Active"
            )
            db.session.add(new_emp)
            
            for app in JobApplication.query.filter_by(candidate_id=cand.id).all():
                app.status = "Hired"
        else:
            return jsonify({"error": "Tipe person tidak valid"}), 400
            
        db.session.commit()
        return jsonify({"message": "Berhasil mengisi slot formasi!"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Gagal assign: {str(e)}"}), 500
    

# --- 8. UNASSIGN KARYAWAN (Keluarkan dari Formasi) ---
@manpower_bp.route('/<int:manpower_id>/unassign/<int:employee_id>', methods=['POST'])
def unassign_manpower(manpower_id, employee_id):
    try:
        emp = Employee.query.get(employee_id)
        if not emp or emp.manpower_id != manpower_id:
            return jsonify({"error": "Karyawan tidak ditemukan atau tidak berada di formasi ini"}), 404
        
        # Hapus assign (kembalikan karyawan menjadi "tanpa jabatan")
        emp.manpower_id = None
        db.session.commit()
        return jsonify({"message": "Karyawan berhasil dikeluarkan dari formasi!"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Gagal melepas karyawan: {str(e)}"}), 500