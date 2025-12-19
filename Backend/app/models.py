from app import db
from datetime import datetime
import uuid
from sqlalchemy.dialects.postgresql import JSON 

def uuid_str():
    return str(uuid.uuid4())

class Resume(db.Model):
    __tablename__ = "resumes"

    id = db.Column(db.String, primary_key=True, default=uuid_str)
    filename = db.Column(db.String, nullable=False)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)
    index_path = db.Column(db.Text)
    chunks_path = db.Column(db.Text)
    raw_text = db.Column(db.Text)

    candidates = db.relationship("Candidate", backref="resume", lazy=True)


class Candidate(db.Model):
    __tablename__ = "candidates"

    id = db.Column(db.String, primary_key=True, default=uuid_str)
    resume_id = db.Column(
        db.String,
        db.ForeignKey("resumes.id", ondelete="CASCADE"),
        nullable=False
    )

    name = db.Column(db.String)
    email = db.Column(db.String)
    phone = db.Column(db.String)
    education = db.Column(db.String)
    experience = db.Column(db.String)

    skills = db.Column(db.Text)  
    top_position = db.Column(db.String)
    match_score = db.Column(db.Integer)
    verdict = db.Column(db.Text)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)



class JobPosition(db.Model):
    __tablename__ = "job_positions"

    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    title = db.Column(db.String(100), nullable=False)
    department = db.Column(db.String(50), nullable=False)
    level = db.Column(db.String(50), nullable=False)
    location = db.Column(db.String(100), nullable=False)

    employment_type = db.Column(db.String(50), nullable=False)

    priority = db.Column(
        db.Enum('low', 'medium', 'high', name='job_priority_types'), 
        default='medium',
        nullable=False
    )

    status = db.Column(
        db.Enum('draft', 'active', 'paused', 'closed', name='job_status_types'), 
        default='draft',
        nullable=False
    )

    salary_min = db.Column(db.BigInteger, nullable=True)
    salary_max = db.Column(db.BigInteger, nullable=True)
    salary_currency = db.Column(db.String(3), default="IDR")

    job_description = db.Column(db.Text, nullable=False)

    requirements = db.Column(db.JSON, default=list)
    required_skills = db.Column(db.JSON, default=list)

    available = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    
class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.String, primary_key=True, default=uuid_str)
    name = db.Column(db.String, nullable=False)
    email = db.Column(db.String, unique=True, nullable=False)
    password_hash = db.Column(db.String, nullable=False)

    role = db.Column(
        db.Enum("SUPER_USER", "HR", name="user_roles"),
        nullable=False
    )

    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class ScreeningResult(db.Model):
    __tablename__ = "screening_results"

    id = db.Column(db.String, primary_key=True, default=uuid_str)

    candidate_id = db.Column(
        db.String,
        db.ForeignKey("candidates.id"),
        nullable=False,
        index=True
    )
    job_id = db.Column(
        db.String,
        db.ForeignKey("job_positions.id"),
        nullable=False,
        index=True
    )

    match_score = db.Column(db.Integer)
    skill_score = db.Column(db.Integer)
    experience_score = db.Column(db.Integer)

    verdict = db.Column(db.Text)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint(
            "candidate_id",
            "job_id",
            name="uq_candidate_job"
        ),
    )


class Psychotest(db.Model):
    __tablename__ = "psychotests"

    id = db.Column(db.String, primary_key=True, default=uuid_str)
    name = db.Column(db.String)
    duration_minutes = db.Column(db.Integer)
    total_score = db.Column(db.Integer)

class PsychotestSession(db.Model):
    __tablename__ = "psychotest_sessions"

    id = db.Column(db.String, primary_key=True, default=uuid_str)

    candidate_id = db.Column(db.String, db.ForeignKey("candidates.id"))
    psychotest_id = db.Column(db.String, db.ForeignKey("psychotests.id"))

    token = db.Column(db.String, unique=True, index=True)
    expires_at = db.Column(db.DateTime)

    started_at = db.Column(db.DateTime)
    finished_at = db.Column(db.DateTime)

    score = db.Column(db.Integer)
    is_submitted = db.Column(db.Boolean, default=False)
    is_locked = db.Column(db.Boolean, default=False)


class Interview(db.Model):
    __tablename__ = "interviews"

    id = db.Column(db.String, primary_key=True, default=uuid_str)
    candidate_id = db.Column(db.String, db.ForeignKey("candidates.id"))

    interview_type = db.Column(
        db.Enum("HR", "USER", name="interview_type")
    )

    interviewer_id = db.Column(db.String, db.ForeignKey("users.id"))
    score = db.Column(db.Integer)
    notes = db.Column(db.Text)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class OfferLetter(db.Model):
    __tablename__ = "offer_letters"

    id = db.Column(db.String, primary_key=True, default=uuid_str)
    candidate_id = db.Column(db.String, db.ForeignKey("candidates.id"))

    status = db.Column(
        db.Enum("Sent", "Accepted", "Rejected", name="offer_status")
    )

    sent_at = db.Column(db.DateTime)
    responded_at = db.Column(db.DateTime)


class MedicalCheckup(db.Model):
    __tablename__ = "medical_checkups"

    id = db.Column(db.String, primary_key=True, default=uuid_str)
    candidate_id = db.Column(db.String, db.ForeignKey("candidates.id"))

    status = db.Column(
        db.Enum("Pending", "Passed", "Failed", name="mcu_status")
    )

    notes = db.Column(db.Text)
    checked_at = db.Column(db.DateTime)
