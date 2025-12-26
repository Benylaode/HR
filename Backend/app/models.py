from app import db
from datetime import datetime
import uuid
from sqlalchemy.dialects.postgresql import JSONB

# --- HELPER FUNCTIONS ---
def uuid_str():
    return str(uuid.uuid4())

# ==========================================
# 1. USER MANAGEMENT (Auth & Roles)
# ==========================================
class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.String, primary_key=True, default=uuid_str)
    name = db.Column(db.String, nullable=False)
    email = db.Column(db.String, unique=True, nullable=False)
    password_hash = db.Column(db.String, nullable=False)
    role = db.Column(db.Enum("SUPER_USER", "HR", name="user_roles"), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


# ==========================================
# 2. JOB POSITION
# ==========================================
class JobPosition(db.Model):
    __tablename__ = "job_positions"

    id = db.Column(db.String(36), primary_key=True, default=uuid_str)
    title = db.Column(db.String(100), nullable=False)
    department = db.Column(db.String(50), nullable=False)
    level = db.Column(db.String(50), nullable=False)
    location = db.Column(db.String(100), nullable=False)
    employment_type = db.Column(db.String(50), nullable=False)
    
    priority = db.Column(
        db.Enum('low', 'medium', 'high', name='job_priority_types'), 
        default='medium', nullable=False
    )
    status = db.Column(
        db.Enum('draft', 'active', 'paused', 'closed', name='job_status_types'), 
        default='draft', nullable=False
    )

    salary_min = db.Column(db.BigInteger, nullable=True)
    salary_max = db.Column(db.BigInteger, nullable=True)
    salary_currency = db.Column(db.String(3), default="IDR")

    job_description = db.Column(db.Text, nullable=False)
    requirements = db.Column(JSONB, default=list)     # List of strings
    required_skills = db.Column(JSONB, default=list)  # List of strings

    available = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relasi ke JobApplication (Many-to-Many via Association Object)
    applications = db.relationship("JobApplication", back_populates="job", cascade="all, delete-orphan")


# ==========================================
# 3. CANDIDATE PROFILE (Deep CV Data)
# ==========================================
class Resume(db.Model):
    __tablename__ = "resumes"
    id = db.Column(db.String, primary_key=True, default=uuid_str)
    filename = db.Column(db.String, nullable=False)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # AI Processing fields (Vector Store paths)
    index_path = db.Column(db.Text)
    chunks_path = db.Column(db.Text)
    raw_text = db.Column(db.Text)

    # One Resume -> One Candidate
    candidate = db.relationship("Candidate", back_populates="resume", uselist=False, cascade="all, delete-orphan")


class Candidate(db.Model):
    __tablename__ = "candidates"

    id = db.Column(db.String, primary_key=True, default=uuid_str)
    resume_id = db.Column(db.String, db.ForeignKey("resumes.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    # --- Basic Info ---
    name = db.Column(db.String, nullable=False)
    email = db.Column(db.String, index=True)
    phone = db.Column(db.String)
    dob = db.Column(db.Date, nullable=True)
    gender = db.Column(db.String(20), nullable=True)
    address = db.Column(db.Text, nullable=True)
    city = db.Column(db.String(100), nullable=True)
    
    # --- Professional Summary ---
    summary = db.Column(db.Text)
    total_experience_years = db.Column(db.Float, default=0.0)
    current_role = db.Column(db.String(100))

    # --- Structured Data (Extracted from CV) ---
    # Education structure: [{ "institution": "ITB", "degree": "S1", "major": "Informatika", "year": "2020" }]
    education = db.Column(JSONB, default=list) 
    
    # Experience structure: [{ "company": "Gojek", "role": "Backend", "duration": "2 years", "details": "..." }]
    experience = db.Column(JSONB, default=list)
    
    # Skills: ["Python", "Flask", "React"]
    skills = db.Column(JSONB, default=list)
    
    # Certifications: [{ "name": "AWS Solutions Architect", "year": "2023" }]
    certifications = db.Column(JSONB, default=list)
    
    # Languages: ["Indonesia (Native)", "English (Professional)"]
    languages = db.Column(JSONB, default=list)
    
    # Socials: { "linkedin": "...", "github": "...", "portfolio": "..." }
    social_links = db.Column(JSONB, default=dict)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    resume = db.relationship("Resume", back_populates="candidate")
    
    # Relasi One-to-One dengan Psikotes
    test_link = db.relationship("TestLink", back_populates="candidate", uselist=False, cascade="all, delete-orphan")
    
    # Relasi Many-to-Many ke JobPosition via JobApplication
    applications = db.relationship("JobApplication", back_populates="candidate", cascade="all, delete-orphan")


# ==========================================
# 4. JOB APPLICATION (Many-to-Many Association)
# ==========================================
class JobApplication(db.Model):
    """
    Tabel Pivot yang menghubungkan Candidate dengan JobPosition.
    Menyimpan skor kecocokan spesifik untuk pekerjaan tersebut.
    """
    __tablename__ = "job_applications"

    id = db.Column(db.String, primary_key=True, default=uuid_str)
    
    candidate_id = db.Column(db.String, db.ForeignKey("candidates.id"), nullable=False)
    job_id = db.Column(db.String, db.ForeignKey("job_positions.id"), nullable=False)

    # AI Match Result untuk Posisi INI
    match_score = db.Column(db.Integer, default=0) # 0 - 100
    ai_verdict = db.Column(db.Text)                # Penjelasan AI kenapa cocok/tidak
    missing_skills = db.Column(JSONB, default=list) # Skill yang kurang
    
    # Status Recruitment Pipeline
    status = db.Column(
        db.Enum("Applied", "Screening", "Psychotest", "Interview", "Offer", "Hired", "Rejected", name="app_status"),
        default="Applied"
    )

    applied_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    candidate = db.relationship("Candidate", back_populates="applications")
    job = db.relationship("JobPosition", back_populates="applications")

    # Constraint: Satu kandidat hanya bisa melamar satu job sekali
    __table_args__ = (db.UniqueConstraint('candidate_id', 'job_id', name='_candidate_job_uc'),)


# ==========================================
# 5. PSYCHOTEST SYSTEM (Updated)
# ==========================================

class TestLink(db.Model):
    """Token unik untuk akses kandidat ke halaman tes - ONE TO ONE dengan Candidate"""
    __tablename__ = 'test_links'
    
    id = db.Column(db.Integer, primary_key=True)
    token = db.Column(db.String(100), unique=True, default=uuid_str)
    
    # Relasi One-to-One: Candidate ID harus unique
    candidate_id = db.Column(db.String, db.ForeignKey('candidates.id'), unique=True, nullable=False)
    
    status = db.Column(db.String(20), default="active") # active, completed, expired
    expires_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    candidate = db.relationship("Candidate", back_populates="test_link")
    submissions = db.relationship('TestSubmission', backref='link', lazy=True)


class TestSubmission(db.Model):
    __tablename__ = 'test_submissions'
    
    id = db.Column(db.Integer, primary_key=True)
    link_id = db.Column(db.Integer, db.ForeignKey('test_links.id'))
    
    test_type = db.Column(db.String(20)) # 'cfit', 'papi', 'kraepelin'
    raw_answers = db.Column(JSONB)       
    scores = db.Column(JSONB)            
    
    submitted_at = db.Column(db.DateTime, default=datetime.now)


# --- DATA REFERENSI PSIKOTES (Tetap sama) ---
class CfitQuestion(db.Model):
    __tablename__ = 'cfit_questions'
    id = db.Column(db.Integer, primary_key=True)
    subtest = db.Column(db.Integer)
    subtest_name = db.Column(db.String(100))
    instruction = db.Column(db.Text)
    image_url = db.Column(db.String(255))
    options = db.Column(db.String(255))
    correct_answer = db.Column(db.Integer)
    order = db.Column(db.Integer)

class CfitNorma(db.Model):
    __tablename__ = 'cfit_norma'
    id = db.Column(db.Integer, primary_key=True)
    raw_score = db.Column(db.Integer, unique=True)
    iq_score = db.Column(db.Integer)
    classification = db.Column(db.String(50))

class PapiQuestion(db.Model):
    __tablename__ = 'papi_questions'
    id = db.Column(db.Integer, primary_key=True)
    statement_a = db.Column(db.Text)
    statement_b = db.Column(db.Text)

class PapiScoringMap(db.Model):
    __tablename__ = 'papi_scoring_map'
    id = db.Column(db.Integer, primary_key=True)
    question_id = db.Column(db.Integer)
    choice = db.Column(db.String(1))
    aspect = db.Column(db.String(1))

class KraepelinConfig(db.Model):
    __tablename__ = 'kraepelin_configs'
    id = db.Column(db.Integer, primary_key=True)
    columns = db.Column(db.Integer, default=50)
    rows = db.Column(db.Integer, default=27)
    duration_per_column = db.Column(db.Integer, default=15)