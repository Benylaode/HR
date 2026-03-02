# Buat file baru di Backend/app/routes/manpower.py

from flask import Blueprint, request, jsonify
from app import db
from app.models import Manpower

manpower_bp = Blueprint('manpower', __name__)

# Ambil HANYA slot Manpower yang masih kosong
@manpower_bp.route('/manpower/vacant', methods=['GET'])
def get_vacant_manpower():
    slots = Manpower.query.filter_by(is_filled=False).all()
    return jsonify([slot.to_dict() for slot in slots]), 200

# Tambah Data Manpower Baru
@manpower_bp.route('/manpower', methods=['POST'])
def create_manpower():
    data = request.json
    new_slot = Manpower(
        position_title=data.get('position_title'),
        level=data.get('level'),
        grade=data.get('grade'),
        department=data.get('department'),
        is_filled=False
    )
    db.session.add(new_slot)
    db.session.commit()
    return jsonify({"message": "Manpower slot created!", "data": new_slot.to_dict()}), 201