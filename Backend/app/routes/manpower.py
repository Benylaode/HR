from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt, verify_jwt_in_request
from sqlalchemy import or_, asc, desc
from app import db
from app.models import Manpower, Employee, Candidate, JobApplication

manpower_bp = Blueprint('manpower', __name__)

# ==========================================
# MIDDLEWARE KEAMANAN
# ==========================================
@manpower_bp.before_request
def restrict_access_by_role():
    if request.method == "OPTIONS":
        return

    try:
        verify_jwt_in_request()
    except Exception as e:
        return jsonify({"status": 401, "message": "Akses ditolak. Token tidak valid atau tidak ditemukan."}), 401

    claims = get_jwt()
    role = claims.get("role")
    
    allowed_roles = ["HR", "SUPER_USER", "HO", "USER"] # Sesuaikan "USER" jika manager biasa boleh akses
    if role not in allowed_roles:
        return jsonify({"status": 403, "message": f"Akses ditolak untuk role: {role}"}), 403


# ==========================================
# 1. Ambil SEMUA slot Manpower (Org Chart & Dropdown) - DENGAN RLS
# ==========================================
@manpower_bp.route('/all', methods=['GET'])
def get_all_manpower():
    try:
        claims = get_jwt()
        role = claims.get("role")
        user_department = claims.get("department") # Pastikan payload JWT Anda menyimpan data department
        
        query = Manpower.query
        
        # RLS (Row-Level Security): Isolasi Departemen
        # Jika bukan Super User / HR / HO, mereka hanya boleh melihat departemen mereka sendiri
        if role not in ["SUPER_USER", "HR", "HO"]:
            if user_department:
                query = query.filter(
                    or_(
                        Manpower.department == user_department,
                        Manpower.pointer_divisi == user_department # Jika dia manajer yang menunjuk ke divisi/dept ini
                    )
                )
            else:
                return jsonify([]), 200 # Kembalikan kosong jika tidak punya departemen
                
        slots = query.order_by(desc(Manpower.id)).all()
        return jsonify([slot.to_dict() for slot in slots]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==========================================
# 2. Tambah Data Manpower Baru (Validasi Atasan & Bawahan)
# ==========================================
@manpower_bp.route('/', methods=['POST'])
def create_manpower():
    data = request.json
    position_title = data.get('position_title')
    department = data.get('department')
    
    if not position_title or not department:
        return jsonify({"error": "Position Title dan Department wajib diisi"}), 400

    # VALIDASI TINGKAT: Bawahan tidak boleh lebih tinggi / sejajar dengan Bos
    reports_to_id = data.get('reports_to_id')
    tingkat_bawahan = int(data.get('tingkat', 99))
    
    if reports_to_id:
        boss = Manpower.query.get(reports_to_id)
        if boss:
            tingkat_bos = boss.tingkat
            
            # Jika bos adalah manajer dan dia sedang berada di ranah divisi, pakai tingkat divisinya
            if boss.tingkat_divisi is not None:
                tingkat_bos = boss.tingkat_divisi
                
            # Semakin kecil angka tingkat, semakin tinggi posisinya (0 = Top, 1 = Bawahnya)
            if tingkat_bawahan <= tingkat_bos:
                return jsonify({
                    "error": f"Tingkat bawahan ({tingkat_bawahan}) tidak boleh lebih tinggi atau sama dengan Bosnya ({tingkat_bos})!"
                }), 400

    try:
        new_slot = Manpower(
            position_title=position_title,
            level=data.get('level', '-'),
            tingkat=tingkat_bawahan,
            grade=data.get('grade', '-'),
            division=data.get('division', 'General'), 
            department=department,
            section=data.get('section', ''), 
            work_location=data.get('work_location', 'Kantor Pusat - Makassar'),
            local_non_local=data.get('local_non_local', 'Local'),
            
            # Relasi Atasan (Skip-Level Line)
            reports_to_id=reports_to_id,
            
            # 3 Kolom Khusus Managerial
            tingkat_managerial=data.get('tingkat_managerial'),
            tingkat_divisi=data.get('tingkat_divisi'),
            pointer_divisi=data.get('pointer_divisi')
        )
        db.session.add(new_slot)
        db.session.commit()
        return jsonify({"message": "Formasi berhasil ditambahkan!", "data": new_slot.to_dict()}), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Gagal menyimpan data: {str(e)}"}), 500


# ==========================================
# 3. Ambil slot Manpower dengan Paginasi & Search (Untuk Tabel HR)
# ==========================================
@manpower_bp.route('/vacant', methods=['GET'])
def get_vacant_manpower():
    try:
        page = request.args.get('page', 1, type=int)
        page_size = request.args.get('page_size', 10, type=int)
        search = request.args.get('search', '', type=str)
        department = request.args.get('department', '', type=str)
        sort_by = request.args.get('sort_by', 'id', type=str)
        sort_dir = request.args.get('sort_dir', 'desc', type=str)

        # Query Dasar: Hanya ambil posisi yang KOSONG (tidak terhubung dengan karyawan)
        query = Manpower.query.filter(~Manpower.karyawan_list.any())

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
            if sort_dir == 'asc':
                query = query.order_by(asc(sort_column))
            else:
                query = query.order_by(desc(sort_column))
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


# ==========================================
# 4. Ambil Daftar Karyawan Kosong & Kandidat
# ==========================================
@manpower_bp.route('/available-persons', methods=['GET'])
def get_available_persons():
    try:
        # 1. Ambil Karyawan aktif yang belum punya jabatan
        unassigned_emps = Employee.query.filter(
            Employee.manpower_id.is_(None),
            Employee.employee_status == 'Active'
        ).order_by(Employee.full_name.asc()).all()
        
        emps_data = [{"id": e.id, "name": e.full_name, "type": "employee"} for e in unassigned_emps]
        
        # 2. Ambil Semua Kandidat
        cands = Candidate.query.order_by(Candidate.full_name.asc()).all()
        cands_data = [{"id": c.id, "name": c.full_name, "type": "candidate"} for c in cands]
        
        return jsonify({
            "employees": emps_data,
            "candidates": cands_data
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==========================================
# 5. Assign Karyawan / Ubah Kandidat Jadi Karyawan ke Posisi
# ==========================================
@manpower_bp.route('/<int:manpower_id>/assign', methods=['POST'])
def assign_manpower(manpower_id):
    data = request.json
    person_type = data.get("type") # Isinya: 'employee' atau 'candidate'
    person_id = data.get("id")
    
    manpower = Manpower.query.get(manpower_id)
    if not manpower:
        return jsonify({"error": "Formasi tidak ditemukan"}), 404
        
    try:
        if person_type == "employee":
            # Update karyawan yang sudah ada
            emp = Employee.query.get(person_id)
            if not emp: return jsonify({"error": "Karyawan tidak ditemukan"}), 404
            emp.manpower_id = manpower_id
            
        elif person_type == "candidate":
            # Kandidat dijadikan Karyawan Baru!
            cand = Candidate.query.get(person_id)
            if not cand: return jsonify({"error": "Kandidat tidak ditemukan"}), 404
            
            new_emp = Employee(
                full_name=cand.full_name,
                email=cand.email,
                whatsapp=cand.whatsapp,
                gender=cand.gender,
                birth_date=cand.birth_date,
                birth_place=cand.birth_place,
                religion=cand.religion,
                address=cand.address,
                city=cand.city,
                province=cand.province,
                education=cand.education,
                university=cand.university,
                major=cand.major,
                gpa=cand.gpa,
                manpower_id=manpower_id,
                employee_status="Active"
            )
            db.session.add(new_emp)
            
            # Ubah status lamaran menjadi Hired
            applications = JobApplication.query.filter_by(candidate_id=cand.id).all()
            for app in applications:
                app.status = "Hired"
                
        else:
            return jsonify({"error": "Tipe person tidak valid"}), 400
            
        db.session.commit()
        return jsonify({"message": "Berhasil mengisi slot formasi!"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Gagal assign: {str(e)}"}), 500