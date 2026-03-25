from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt, verify_jwt_in_request
from sqlalchemy import or_, asc, desc
from app import db
from app.models import Manpower

manpower_bp = Blueprint('manpower', __name__)

# ==========================================
# MIDDLEWARE KEAMANAN (TETAP SAMA PERSIS)
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
    
    allowed_roles = ["HR", "SUPER_USER", "HO"] 
    if role not in allowed_roles:
        return jsonify({"status": 403, "message": f"Akses ditolak untuk role: {role}"}), 403

# ==========================================
# ENDPOINTS MANPOWER
# ==========================================

# [UPDATE]: Ambil slot Manpower dengan Paginasi, Search, Filter & Sort
@manpower_bp.route('/vacant', methods=['GET'])
def get_vacant_manpower():
    try:
        # 1. Tangkap parameter dari URL (Contoh: ?page=1&search=dev&department=IT)
        page = request.args.get('page', 1, type=int)
        page_size = request.args.get('page_size', 10, type=int)
        search = request.args.get('search', '', type=str)
        department = request.args.get('department', '', type=str)
        level = request.args.get('level', '', type=str)
        sort_by = request.args.get('sort_by', 'id', type=str)
        sort_dir = request.args.get('sort_dir', 'desc', type=str)

        # 2. Query Dasar: Hanya ambil posisi yang kosong
        query = Manpower.query.filter_by(is_filled=False)

        # 3. Logika Pencarian (Search di kolom Posisi atau Departemen)
        if search:
            search_term = f"%{search}%"
            query = query.filter(or_(
                Manpower.position_title.ilike(search_term),
                Manpower.department.ilike(search_term)
            ))

        # 4. Logika Filter Dropdown
        if department:
            query = query.filter(Manpower.department == department)
        if level:
            query = query.filter(Manpower.level == level)

        # 5. Logika Pengurutan (Sorting)
        if hasattr(Manpower, sort_by):
            sort_column = getattr(Manpower, sort_by)
            if sort_dir == 'asc':
                query = query.order_by(asc(sort_column))
            else:
                query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(desc(Manpower.id))

        # 6. Eksekusi Paginasi di Database
        paginated_data = query.paginate(page=page, per_page=page_size, error_out=False)

        # 7. Kembalikan data dengan format Terstruktur (Standar Enterprise)
        return jsonify({
            "items": [slot.to_dict() for slot in paginated_data.items],
            "total": paginated_data.total,
            "page": paginated_data.page,
            "total_pages": paginated_data.pages,
            "page_size": paginated_data.per_page
        }), 200

    except Exception as e:
        return jsonify({"error": f"Terjadi kesalahan sistem: {str(e)}"}), 500


# [TETAP SAMA]: Tambah Data Manpower Baru
@manpower_bp.route('/', methods=['POST'])
def create_manpower():
    data = request.json
    position_title = data.get('position_title')
    department = data.get('department')
    
    if not position_title or not department:
        return jsonify({"error": "Position Title dan Department wajib diisi"}), 400

    try:
        new_slot = Manpower(
            position_title=position_title,
            level=data.get('level', '-'),
            grade=data.get('grade', '-'),
            department=department,
            is_filled=False
        )
        db.session.add(new_slot)
        db.session.commit()
        return jsonify({"message": "Manpower slot created!", "data": new_slot.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Gagal menyimpan data: {str(e)}"}), 500


# [TETAP SAMA]: Ambil SEMUA slot Manpower
@manpower_bp.route('/all', methods=['GET'])
def get_all_manpower():
    try:
        slots = Manpower.query.order_by(Manpower.created_at.desc()).all()
        return jsonify([slot.to_dict() for slot in slots]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500