from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager
import os
from flask_migrate import Migrate

db = SQLAlchemy()
jwt = JWTManager()
migrate = Migrate()

def create_app(testing=False):
    app = Flask(__name__)

    if testing:
        app.config.update({
            "TESTING": True,
            "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
            "WTF_CSRF_ENABLED": False
        })

    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:123@localhost:5432/hrrs"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    app.config["JWT_SECRET_KEY"] = os.getenv(
        "JWT_SECRET_KEY", "super-secret-key"
    )
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = 60 * 60 * 8  # 8 jam

    CORS(app)

    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)

    from app import models
    from .routes.candidates import candidates_bp
    from .routes.auth import auth_bp
    from .routes.screening import screening_bp
    from .routes.jobposition import jobposition_bp
    from .routes.test_management import mgmt_bp
    from .routes.test_management import submit_bp
    from .routes.dashboard import dashboard_bp
    from .routes.tracking import tracing_bp
    from .routes.ata import ata_bp

    app.register_blueprint(mgmt_bp, url_prefix="/management")
    app.register_blueprint(dashboard_bp, url_prefix="/dashboard")
    app.register_blueprint(candidates_bp, url_prefix="/candidates")
    app.register_blueprint(submit_bp, url_prefix="/submission")
    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(screening_bp, url_prefix="/screening")
    app.register_blueprint(jobposition_bp, url_prefix="/job-positions")
    app.register_blueprint(tracing_bp, url_prefix="/tracing")
    app.register_blueprint(ata_bp, url_prefix="/ata")

    return app
