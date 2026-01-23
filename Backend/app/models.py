from app import db
from datetime import datetime, timezone # <--- UPDATE IMPORT
import uuid
import enum
from sqlalchemy.dialects.postgresql import JSONB

# --- HELPER FUNCTIONS ---
def uuid_str():
    return str(uuid.uuid4())

def format_date(dt):
    """Helper untuk format tanggal ke ISO string agar aman buat Frontend"""
    return dt.isoformat() if dt else None

# Helper untuk waktu sekarang (Timezone Aware) - PENGGANTI UTCNOW
def now_utc():
    return datetime.now(timezone.utc)

class RecruitmentStage(enum.Enum):
    CV_SCREENING    = "CV Screening"
    AI_SCREENING    = "AI Screening"
    RANKING         = "Ranking"
    PSYCHOTEST      = "Psychotest"
    INTERVIEW_HR    = "Interview HR"
    INTERVIEW_USER  = "Interview User"
    OFFERING        = "Offering"
    NEGOTIATION     = "Negotiation"
    TICKET          = "Flight Ticket"
    HIRED           = "Hired"
    REJECTED        = "Rejected"
    MCU_PROCESS     = "Medical Check Up"         
    MCU_REVIEW      = "SCM Clinic Team Review"   
    MCU_FAILED      = "MCU Failed"
    OFFERING_DECLINED = "Offering Declined"
    ONBOARDING      = "Onboarding"
    HR_REVIEW      = "HR Review"
    FINAL_SELECTION = "Final Selection"
    OFFERING_ACCEPTED = "Offer Accepted"

# ==========================================
# 1. EXTENSION TABLES (TRACING & FLOW)
# ==========================================
class RecruitmentJourney(db.Model):
    __tablename__ = "recruitment_journeys"

    id = db.Column(db.String, primary_key=True, default=uuid_str)
    application_id = db.Column(db.String, db.ForeignKey("job_applications.id"), unique=True, nullable=False)
    current_stage = db.Column(db.Enum(RecruitmentStage, name="recruitment_stage_enum"), default=RecruitmentStage.CV_SCREENING, nullable=False)
    stage_data = db.Column(JSONB, default=dict)
    
    # UPDATE: Menggunakan now_utc
    created_at = db.Column(db.DateTime, default=now_utc)
    updated_at = db.Column(db.DateTime, default=now_utc, onupdate=now_utc)

    application = db.relationship("JobApplication", backref=db.backref("journey", uselist=False, cascade="all, delete-orphan"))
    logs = db.relationship("JourneyLog", back_populates="journey", cascade="all, delete-orphan", order_by="desc(JourneyLog.created_at)")

    def to_dict(self):
        return {
            "current_stage": self.current_stage.value if self.current_stage else None,
            "stage_data": self.stage_data,
            "updated_at": format_date(self.updated_at),
            "logs": [log.to_dict() for log in self.logs]
        }

class JourneyLog(db.Model):
    __tablename__ = "journey_logs"

    id = db.Column(db.Integer, primary_key=True)
    journey_id = db.Column(db.String, db.ForeignKey("recruitment_journeys.id"), nullable=False)
    previous_stage = db.Column(db.String(50), nullable=True)
    new_stage = db.Column(db.String(50), nullable=False)
    action = db.Column(db.String(100), nullable=False)
    notes = db.Column(db.Text, nullable=True)
    actor_name = db.Column(db.String, nullable=True)
    
    # UPDATE
    created_at = db.Column(db.DateTime, default=now_utc)

    journey = db.relationship("RecruitmentJourney", back_populates="logs")

    def to_dict(self):
        return {
            "action": self.action,
            "previous_stage": self.previous_stage,
            "new_stage": self.new_stage,
            "notes": self.notes,
            "actor": self.actor_name,
            "timestamp": format_date(self.created_at)
        }

# ==========================================
# 2. USER MANAGEMENT
# ==========================================
class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.String, primary_key=True, default=uuid_str)
    name = db.Column(db.String, nullable=False)
    email = db.Column(db.String, unique=True, nullable=False)
    password_hash = db.Column(db.String, nullable=False)
    role = db.Column(db.Enum("SUPER_USER", "HR", name="user_roles"), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    
    # UPDATE
    created_at = db.Column(db.DateTime, default=now_utc)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role
        }

# ==========================================
# 3. JOB POSITION
# ==========================================
class JobPosition(db.Model):
    __tablename__ = "job_positions"

    id = db.Column(db.String(36), primary_key=True, default=uuid_str)
    title = db.Column(db.String(100), nullable=False)
    department = db.Column(db.String(50), nullable=False)
    level = db.Column(db.String(50), nullable=False)
    location = db.Column(db.String(100), nullable=False)
    employment_type = db.Column(db.String(50), nullable=False)
    priority = db.Column(db.Enum('low', 'medium', 'high', name='job_priority_types'), default='medium', nullable=False)
    status = db.Column(db.Enum('draft', 'active', 'paused', 'closed', name='job_status_types'), default='draft', nullable=False)
    salary_min = db.Column(db.BigInteger, nullable=True)
    salary_max = db.Column(db.BigInteger, nullable=True)
    salary_currency = db.Column(db.String(3), default="IDR")
    job_description = db.Column(db.Text, nullable=False)
    requirements = db.Column(JSONB, default=list)
    required_skills = db.Column(JSONB, default=list)
    available = db.Column(db.Boolean, default=True)
    
    # UPDATE
    created_at = db.Column(db.DateTime, default=now_utc)
    updated_at = db.Column(db.DateTime, default=now_utc, onupdate=now_utc)

    applications = db.relationship("JobApplication", back_populates="job", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "department": self.department,
            "location": self.location,
            "status": self.status,
            "priority": self.priority,
            "salary": f"{self.salary_min or 0} - {self.salary_max or 0} {self.salary_currency}",
            "created_at": format_date(self.created_at)
        }

# ==========================================
# 4. CANDIDATE & RESUME
# ==========================================
class Resume(db.Model):
    __tablename__ = "resumes"
    id = db.Column(db.String, primary_key=True, default=uuid_str)
    filename = db.Column(db.String, nullable=False)
    
    # UPDATE
    uploaded_at = db.Column(db.DateTime, default=now_utc)
    
    index_path = db.Column(db.Text)
    chunks_path = db.Column(db.Text)
    raw_text = db.Column(db.Text)

    candidate = db.relationship("Candidate", back_populates="resume", uselist=False, cascade="all, delete-orphan")

class Candidate(db.Model):
    __tablename__ = "candidates"

    id = db.Column(db.String, primary_key=True, default=uuid_str)
    resume_id = db.Column(db.String, db.ForeignKey("resumes.id", ondelete="CASCADE"), unique=True, nullable=False)
    name = db.Column(db.String, nullable=False)
    email = db.Column(db.String, index=True)
    phone = db.Column(db.String)
    dob = db.Column(db.Date, nullable=True)
    gender = db.Column(db.String(20), nullable=True)
    address = db.Column(db.Text, nullable=True)
    city = db.Column(db.String(100), nullable=True)
    summary = db.Column(db.Text)
    total_experience_years = db.Column(db.Float, default=0.0)
    current_role = db.Column(db.String(100))
    education = db.Column(JSONB, default=list) 
    experience = db.Column(JSONB, default=list)
    skills = db.Column(JSONB, default=list)
    certifications = db.Column(JSONB, default=list)
    languages = db.Column(JSONB, default=list)
    social_links = db.Column(JSONB, default=dict)

    # UPDATE
    created_at = db.Column(db.DateTime, default=now_utc)

    resume = db.relationship("Resume", back_populates="candidate")
    test_link = db.relationship("TestLink", back_populates="candidate", uselist=False, cascade="all, delete-orphan")
    applications = db.relationship("JobApplication", back_populates="candidate", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "city": self.city,
            "current_role": self.current_role,
            "experience_years": self.total_experience_years,
            "education": self.education,
            "skills": self.skills,
            "created_at": format_date(self.created_at)
        }

# ==========================================
# 5. JOB APPLICATION (PIVOT)
# ==========================================
class JobApplication(db.Model):
    __tablename__ = "job_applications"

    id = db.Column(db.String, primary_key=True, default=uuid_str)
    candidate_id = db.Column(db.String, db.ForeignKey("candidates.id"), nullable=False)
    job_id = db.Column(db.String, db.ForeignKey("job_positions.id"), nullable=False)
    match_score = db.Column(db.Integer, default=0)
    ai_verdict = db.Column(db.Text)
    missing_skills = db.Column(JSONB, default=list)
    status = db.Column(
        db.Enum("Applied", "Screening", "Psychotest", "Interview", "Offer", "Hired", "Rejected", name="app_status"),
        default="Applied"
    )

    # UPDATE
    applied_at = db.Column(db.DateTime, default=now_utc)

    candidate = db.relationship("Candidate", back_populates="applications")
    job = db.relationship("JobPosition", back_populates="applications")

    __table_args__ = (db.UniqueConstraint('candidate_id', 'job_id', name='_candidate_job_uc'),)

    def to_dict(self):
        journey_data = self.journey.to_dict() if self.journey else None
        return {
            "id": self.id,
            "job_title": self.job.title,
            "candidate_name": self.candidate.name,
            "match_score": self.match_score,
            "ai_verdict": self.ai_verdict,
            "status": self.status,
            "journey": journey_data,
            "applied_at": format_date(self.applied_at)
        }

class TestLink(db.Model):
    __tablename__ = 'test_links'
    
    id = db.Column(db.Integer, primary_key=True)
    token = db.Column(db.String(100), unique=True, default=uuid_str)
    candidate_id = db.Column(db.String, db.ForeignKey('candidates.id'), unique=True, nullable=False)
    status = db.Column(db.String(20), default="active")
    expires_at = db.Column(db.DateTime)
    
    # UPDATE
    created_at = db.Column(db.DateTime, default=now_utc)
    
    candidate = db.relationship("Candidate", back_populates="test_link")
    submissions = db.relationship('TestSubmission', backref='link', lazy=True)

class TestSubmission(db.Model):
    __tablename__ = 'test_submissions'
    
    id = db.Column(db.Integer, primary_key=True)
    link_id = db.Column(db.Integer, db.ForeignKey('test_links.id'))
    test_type = db.Column(db.String(20))
    raw_answers = db.Column(JSONB)       
    scores = db.Column(JSONB)            
    
    # UPDATE
    submitted_at = db.Column(db.DateTime, default=now_utc)

# Model Soal lainnya tetap sama, tidak ada field DateTime
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

# Tambahkan di app/models.py

class ATARequest(db.Model):
    __tablename__ = "ata_requests"

    id = db.Column(db.String, primary_key=True) 
    requester_name = db.Column(db.String, nullable=False)
    
    title = db.Column(db.String, nullable=False)
    department = db.Column(db.String, nullable=False)
    level = db.Column(db.String, nullable=False) 
    location = db.Column(db.String, nullable=False)
    employment_type = db.Column(db.String, nullable=False) 
    
    salary_min = db.Column(db.BigInteger)
    salary_max = db.Column(db.BigInteger)
    attachment_url = db.Column(db.String(255), nullable=True)
    
    justification = db.Column(db.Text) 

    # --- APPROVAL COLUMNS (Sesuai Flowchart) ---
    # Status Global: Pending, Approved, Rejected
    status = db.Column(db.String(20), default="Pending")
    
    # 1. HR Approval
    hr_status = db.Column(db.String(20), default="Pending") # Pending/Approved/Rejected
    hr_notes = db.Column(db.String)
    hr_date = db.Column(db.DateTime)
    
    # 2. KTT Approval
    ktt_status = db.Column(db.String(20), default="Pending")
    ktt_notes = db.Column(db.String)
    ktt_date = db.Column(db.DateTime)
    
    # 3. HO Jakarta Approval
    ho_status = db.Column(db.String(20), default="Pending")
    ho_notes = db.Column(db.String)
    ho_date = db.Column(db.DateTime)
    job_id = db.Column(db.String, db.ForeignKey("job_positions.id"), nullable=True)

    created_at = db.Column(db.DateTime, default=now_utc)
    updated_at = db.Column(db.DateTime, default=now_utc, onupdate=now_utc)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "requester": self.requester_name,
            "status": self.status,
            "approvals": {
                "HR": self.hr_status,
                "KTT": self.ktt_status,
                "HO": self.ho_status
            },
            "created_at": format_date(self.created_at)
        }