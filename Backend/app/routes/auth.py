from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity
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
    
    user = User(
        name=data["name"],
        email=data["email"],
        password_hash=hashed_password,
        role=data.get("role", "HR")
    )

    db.session.add(user)
    db.session.commit()

    return jsonify({"message": "user registered"}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(force=True)
    user = User.query.filter_by(email=data["email"]).first()

    if not user or not bcrypt.verify(data["password"], user.password_hash):
        return jsonify({"error": "invalid credentials"}), 401

    token = create_access_token(
        identity={
            "id": user.id,
            "email": user.email,
            "role": user.role
        }
    )

    return jsonify({
        "access_token": token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    })


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    return jsonify(get_jwt_identity())


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
        role="SUPER_USER"
    )
    
    db.session.add(admin)
    db.session.commit()
    
    return jsonify({
        "message": "Admin created successfully",
        "email": admin_email,
        "password": "admin123",
        "role": "SUPER_USER"
    }), 201
