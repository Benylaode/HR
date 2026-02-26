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

class ProfileMixin(object):
    # 1) Biodata [cite: 39-47]
    full_name = db.Column(db.String, nullable=False)
    email = db.Column(db.String, index=True, nullable=False)
    gender = db.Column(db.String(20))
    whatsapp = db.Column(db.String(50))
    birth_date = db.Column(db.Date)
    domicile_province = db.Column(db.String(100))
    domicile_city = db.Column(db.String(100))
    total_experience = db.Column(db.String(50)) # Format: X Tahun X Bulan
    
    # 2) Pendidikan [cite: 48-57]
    degree = db.Column(db.String(50)) # Gelar
    major = db.Column(db.String(150)) # Jurusan
    study_program = db.Column(db.String(150)) # Program Studi
    university = db.Column(db.String(150)) # Nama Institusi
    edu_city = db.Column(db.String(100))
    gpa = db.Column(db.String(20)) # Format: X dari 4
    start_year = db.Column(db.String(4))
    grad_year = db.Column(db.String(4))
    
    # 3) Keahlian & Organisasi (Opsional) [cite: 58-74]
    trainings = db.Column(JSONB, default=list) # Array of objects
    organizations = db.Column(JSONB, default=list) # Array of objects
    
    # 4) Pengalaman & Minat Kerja [cite: 75-99]
    work_experiences = db.Column(JSONB, default=list) # Array of objects
    internships = db.Column(JSONB, default=list) # Array of objects
    applied_position_1 = db.Column(db.String(150))
    applied_position_2 = db.Column(db.String(150))
    notice_period = db.Column(db.String(50))
    expected_salary = db.Column(db.BigInteger)
    
    # 5) Lain-Lain [cite: 100-124]
    references = db.Column(JSONB, default=list)
    relatives = db.Column(JSONB, default=list)
    social_media = db.Column(JSONB, default=dict) # Object berisi IG, LinkedIn, dll.

    created_at = db.Column(db.DateTime, default=now_utc)

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

# ==========================================
# MIXIN UNTUK DATA DIRI (KANDIDAT & KARYAWAN)
# ==========================================
class ProfileMixin(object):
    """
    Mixin ini berisi field form yang sama persis antara Kandidat dan Karyawan,
    mengacu pada EmployeeCVForm.tsx.
    """
    full_name = db.Column(db.String, nullable=False)
    email = db.Column(db.String, index=True, nullable=False)
    whatsapp = db.Column(db.String(50))
    gender = db.Column(db.String(20))
    religion = db.Column(db.String(50))
    birth_place = db.Column(db.String(100))
    birth_date = db.Column(db.Date)
    driver_license = db.Column(db.String(50))
    address = db.Column(db.Text)
    city = db.Column(db.String(100))
    province = db.Column(db.String(100))
    
    # Riwayat Pendidikan
    education = db.Column(db.Text)
    university = db.Column(db.String(150))
    major = db.Column(db.String(150))
    gpa = db.Column(db.String(10))
    social_media = db.Column(db.Text)
    
    # Pengalaman Kerja Terakhir
    position_applied = db.Column(db.String(100))
    last_company = db.Column(db.String(150))
    last_position = db.Column(db.String(150))
    last_position_level = db.Column(db.String(100))
    last_company_field = db.Column(db.String(100))
    total_experience_years = db.Column(db.String(50)) # Sesuai form (string input)
    experience_description = db.Column(db.Text)

    created_at = db.Column(db.DateTime, default=now_utc)

# ==========================================
# 4. CANDIDATE, EMPLOYEE & RESUME
# ==========================================
class Candidate(db.Model, ProfileMixin):
    __tablename__ = "candidates"

    id = db.Column(db.String, primary_key=True, default=uuid_str)
    
    # Resume ID sekarang nullable=True karena kita tidak mewajibkan CV Scanner lagi
    resume_id = db.Column(db.String, db.ForeignKey("resumes.id", ondelete="SET NULL"), nullable=True)
    
    # Relasi khusus Kandidat (Ada tracking/aplikasi)
    resume = db.relationship("Resume", back_populates="candidate")
    test_link = db.relationship("TestLink", back_populates="candidate", uselist=False, cascade="all, delete-orphan")
    applications = db.relationship("JobApplication", back_populates="candidate", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.full_name,
            "email": self.email,
            "whatsapp": self.whatsapp,
            "position_applied": self.position_applied,
            "created_at": format_date(self.created_at)
        }

class Employee(db.Model, ProfileMixin):
    __tablename__ = "employees"

    id = db.Column(db.String, primary_key=True, default=uuid_str)
    
    # Karyawan bisa punya NIK, Department, dll di masa depan
    employee_status = db.Column(db.String(50), default="Active")
    
    # Relasi Karyawan ke Tes (TIDAK ADA relasi ke JobApplication / Tracking)
    test_link = db.relationship("TestLink", back_populates="employee", uselist=False, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.full_name,
            "email": self.email,
            "whatsapp": self.whatsapp,
            "department": self.last_company_field, # Contoh mapping
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
    
    # UPDATE: Keduanya jadi nullable=True. Sebuah token milik Kandidat ATAU Karyawan
    candidate_id = db.Column(db.String, db.ForeignKey('candidates.id'), unique=True, nullable=True)
    employee_id = db.Column(db.String, db.ForeignKey('employees.id'), unique=True, nullable=True)
    
    status = db.Column(db.String(20), default="active")
    expires_at = db.Column(db.DateTime)
    
    created_at = db.Column(db.DateTime, default=now_utc)
    
    candidate = db.relationship("Candidate", back_populates="test_link")
    employee = db.relationship("Employee", back_populates="test_link")
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

    id = db.Column(db.String, primary_key=True, default=uuid_str)
    
    # Form ATA Baru 
    candidate_name = db.Column(db.String) # Nama Karyawan / Kandidat
    employee_no = db.Column(db.String) # Nomor Karyawan (jika internal)
    company = db.Column(db.String)
    position = db.Column(db.String) # Jabatan yang diajukan
    grade = db.Column(db.String)
    report_to = db.Column(db.String) # Position Title dari atasan langsung
    department = db.Column(db.String)
    division = db.Column(db.String) # Opsional
    budget_type = db.Column(db.String(50)) # Replacement / Additional
    employment_agreement = db.Column(db.String(100))
    staff_status = db.Column(db.String(50)) # Staff / Non Staff
    point_of_hire = db.Column(db.String(100))
    hired_type = db.Column(db.String(50)) # Local / Non Local Hired
    requirements_note = db.Column(db.Text) # Requirements / Note / Justification
    scan_ata_url = db.Column(db.String(255)) # URL untuk Scan ATA
    
    # (Opsional) Jika tetap ingin menyimpan relasi ke user/pembuat
    requester_name = db.Column(db.String)

    # --- APPROVAL COLUMNS ---
    status = db.Column(db.String(20), default="Pending")
    
    hr_status = db.Column(db.String(20), default="Pending")
    hr_notes = db.Column(db.String)
    hr_date = db.Column(db.DateTime)
    
    ktt_status = db.Column(db.String(20), default="Pending")
    ktt_notes = db.Column(db.String)
    ktt_date = db.Column(db.DateTime)
    
    ho_status = db.Column(db.String(20), default="Pending")
    ho_notes = db.Column(db.String)
    ho_date = db.Column(db.DateTime)
    
    job_id = db.Column(db.String, db.ForeignKey("job_positions.id"), nullable=True)

    created_at = db.Column(db.DateTime, default=now_utc)
    updated_at = db.Column(db.DateTime, default=now_utc, onupdate=now_utc)

    def to_dict(self):
        return {
            "id": self.id,
            "candidate_name": self.candidate_name,
            "position": self.position,
            "department": self.department,
            "budget_type": self.budget_type,
            "status": self.status,
            "approvals": {
                "HR": self.hr_status,
                "KTT": self.ktt_status,
                "HO": self.ho_status
            },
            "created_at": format_date(self.created_at)
        }