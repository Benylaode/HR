from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity,
    get_jwt
)
from passlib.hash import bcrypt
from app import db
from app.models import User

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(force=True)

    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"error": "email already registered"}), 400

    # Hash password properly before storing
    hashed_password = bcrypt.hash(data["password"])
    
    # Menambahkan department default jika tidak ada, 
    # karena kita sudah update modelnya
    user = User(
        name=data["name"],
        email=data["email"],
        password_hash=hashed_password,
        role=data.get("role", "HR"),
        department=data.get("department", "General") # Default fallback
    )

    db.session.add(user)
    db.session.commit()

    return jsonify({"message": "user registered"}), 201

# --- ENDPOINT BARU KHUSUS SUPER USER ---
@auth_bp.route("/create-user", methods=["POST"])
@jwt_required()
def create_user():
    """Endpoint untuk SUPER_USER membuat user baru lengkap dengan department"""
    claims = get_jwt()
    if claims.get("role") != "SUPER_USER":
        return jsonify({"error": "Unauthorized. Only SUPER_USER can perform this action."}), 403

    data = request.get_json(force=True)

    if User.query.filter_by(email=data.get("email")).first():
        return jsonify({"error": "Email already registered"}), 400

    if not data.get("password"):
        return jsonify({"error": "Password is required"}), 400

    hashed_password = bcrypt.hash(data["password"])
    
    new_user = User(
        name=data.get("name"),
        email=data.get("email"),
        password_hash=hashed_password,
        role=data.get("role", "HR"),
        department=data.get("department", "General") 
    )

    db.session.add(new_user)
    db.session.commit()

    return jsonify({
        "message": "User created successfully",
        "user": {
            "id": new_user.id,
            "name": new_user.name,
            "email": new_user.email,
            "role": new_user.role,
            "department": new_user.department
        }
    }), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(force=True)
    user = User.query.filter_by(email=data["email"]).first()

    if not user or not bcrypt.verify(data["password"], user.password_hash):
        return jsonify({"error": "invalid credentials"}), 401

    # --- PERBAIKAN DI SINI ---
    # Masukkan data department ke dalam token JWT
    token = create_access_token(
        identity=str(user.id),  
        additional_claims={
            "email": user.email,
            "role": user.role,
            "department": user.department # Ditambahkan
        }
    )
    # -------------------------

    return jsonify({
        "access_token": token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "department": user.department # Ditambahkan
        }
    })


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    # Ambil claims tambahan dari token
    claims = get_jwt()
    
    return jsonify({
        "id": get_jwt_identity(), # Ini string ID
        "email": claims.get("email"),
        "role": claims.get("role"),
        "department": claims.get("department") # Ditambahkan
    })


@auth_bp.route("/seed-admin", methods=["POST"])
def seed_admin():
    """Create default admin account if not exists"""
    admin_email = "admin@hrrs.com"
    
    if User.query.filter_by(email=admin_email).first():
        return jsonify({"message": "Admin already exists", "email": admin_email}), 200
    
    admin = User(
        name="Administrator",
        email=admin_email,
        password_hash=bcrypt.hash("admin123"),
        role="SUPER_USER",
        department="Management" # Admin masuk department khusus
    )
    
    db.session.add(admin)
    db.session.commit()
    
    return jsonify({
        "message": "Admin created successfully",
        "email": admin_email,
        "password": "admin123",
        "role": "SUPER_USER",
        "department": "Management"
    }), 201