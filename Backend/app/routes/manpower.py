from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt, verify_jwt_in_request
from app import db
from app.models import Manpower

manpower_bp = Blueprint('manpower', __name__)

# ==========================================
# MIDDLEWARE KEAMANAN (CORS & JWT Auth)
# ==========================================
@manpower_bp.before_request
def restrict_access_by_role():
    # 1. Selalu izinkan preflight CORS
    if request.method == "OPTIONS":
        return

    # 2. WAJIB LOGIN untuk semua akses Manpower
    try:
        verify_jwt_in_request()
    except Exception as e:
        return jsonify({"status": 401, "message": "Akses ditolak. Token tidak valid atau tidak ditemukan."}), 401

    claims = get_jwt()
    role = claims.get("role")
    
    # 3. Pengecekan Hak Akses (Role-Based Access Control)
    # Sesuaikan dengan role di sistem Anda (misal: hanya HR dan SUPER_USER yang bisa membuat/melihat Manpower)
    allowed_roles = ["HR", "SUPER_USER", "HO"] 
    if role not in allowed_roles:
        return jsonify({"status": 403, "message": f"Akses ditolak untuk role: {role}"}), 403


# ==========================================
# ENDPOINTS MANPOWER
# ==========================================

# Ambil HANYA slot Manpower yang masih kosong
@manpower_bp.route('/vacant', methods=['GET'])
def get_vacant_manpower():
    try:
        slots = Manpower.query.filter_by(is_filled=False).all()
        return jsonify([slot.to_dict() for slot in slots]), 200
    except Exception as e:
        return jsonify({"error": f"Terjadi kesalahan sistem: {str(e)}"}), 500


# Tambah Data Manpower Baru
@manpower_bp.route('/', methods=['POST'])
def create_manpower():
    data = request.json
    
    # 1. Validasi Input (Menghindari data kosong masuk ke DB)
    position_title = data.get('position_title')
    department = data.get('department')
    
    if not position_title or not department:
        return jsonify({"error": "Position Title dan Department wajib diisi"}), 400

    # 2. Proses Insert ke Database
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
        
        return jsonify({
            "message": "Manpower slot created!", 
            "data": new_slot.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback() # Batalkan transaksi jika terjadi error
        return jsonify({"error": f"Gagal menyimpan data: {str(e)}"}), 500


# (Opsional) Ambil SEMUA slot Manpower (Kosong + Terisi) untuk halaman Report
@manpower_bp.route('/all', methods=['GET'])
def get_all_manpower():
    try:
        slots = Manpower.query.order_by(Manpower.created_at.desc()).all()
        return jsonify([slot.to_dict() for slot in slots]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500