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

    user = User(
        name=data["name"],
        email=data["email"],
        password_hash=data["password"],
        role=data.get("role", "SUPER_USER")
    )
    print(user.password_hash)

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
