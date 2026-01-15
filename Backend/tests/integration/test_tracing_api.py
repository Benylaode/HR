import pytest
from app import db
from app.models import (
    JobApplication,
    RecruitmentJourney,
    JourneyLog,
    RecruitmentStage,
    Candidate,
    JobPosition,
    Resume
)

# ==========================================
# FIXTURE (PENYEBAB UTAMA ERROR)
# ==========================================
@pytest.fixture(scope="module")
def seed_application(app):
    """
    Membuat data dummy dengan 3 perbaikan utama:
    1. Idempotent: Cek data dulu sebelum insert (agar tidak error Duplicate Key).
    2. Deep Cleanup: Hapus data log -> journey -> app (agar tidak error Foreign Key).
    3. Return ID: Mengembalikan string ID, bukan object (agar tidak error Detached Instance).
    """
    with app.app_context():
        # ----------------------------------------
        # 1. SETUP MASTER DATA (Resume, Job, Candidate)
        # ----------------------------------------
        
        # Cek & Buat Resume
        resume = db.session.get(Resume, "RESUME-TRACE-001")
        if not resume:
            resume = Resume(
                id="RESUME-TRACE-001",
                filename="dummy_cv.pdf",
                raw_text="Dummy CV Text"
            )
            db.session.add(resume)

        # Cek & Buat Job Position
        job = db.session.get(JobPosition, "JOB-TRACE-001")
        if not job:
            job = JobPosition(
                id="JOB-TRACE-001",
                title="Backend Developer",
                department="IT",
                level="Mid",
                location="Remote",
                employment_type="Fulltime",
                job_description="Coding Python",
                requirements=[]
            )
            db.session.add(job)

        # Cek & Buat Candidate
        candidate = db.session.get(Candidate, "CAND-TRACE-001")
        if not candidate:
            candidate = Candidate(
                id="CAND-TRACE-001",
                resume_id="RESUME-TRACE-001",
                name="Test Tracing Candidate",
                phone="08123456789",
                email="tracing@test.com"
            )
            db.session.add(candidate)
        
        db.session.commit() # Simpan master data

        # ----------------------------------------
        # 2. CLEANUP DATA LAMA (FIX FOREIGN KEY ERROR)
        # ----------------------------------------
        existing_app = db.session.get(JobApplication, "APP-TRACE-001")
        
        if existing_app:
            # Cari Journey yang terhubung
            journey = RecruitmentJourney.query.filter_by(application_id="APP-TRACE-001").first()
            if journey:
                # [PENTING] Hapus LOGS dulu (Data Anak)
                JourneyLog.query.filter_by(journey_id=journey.id).delete()
                # Baru Hapus JOURNEY (Data Induk)
                db.session.delete(journey)
            
            # Terakhir Hapus APLIKASI
            db.session.delete(existing_app)
            db.session.commit()

        # ----------------------------------------
        # 3. BUAT DATA BARU
        # ----------------------------------------
        job_app = JobApplication(
            id="APP-TRACE-001",
            candidate_id="CAND-TRACE-001",
            job_id="JOB-TRACE-001",
            status="Screening"
        )
        db.session.add(job_app)
        db.session.commit()

        # [FIX UTAMA] Return ID (String), JANGAN Object SQLAlchemy
        return job_app.id 


# =========================
# TESTS (DIPERBAIKI)
# =========================

def test_get_timeline_create_journey(client, seed_application):
    """
    GET /tracing/<app_id> -> Auto create journey
    """
    # seed_application sekarang adalah string "APP-TRACE-001"
    app_id = seed_application 
    
    res = client.get(f"/tracing/{app_id}")
    assert res.status_code == 200
    
    data = res.get_json()
    assert data["current_stage"] == RecruitmentStage.CV_SCREENING.value


def test_valid_stage_transition(client, app, seed_application):
    """
    CV_SCREENING -> AI_SCREENING (Valid)
    """
    app_id = seed_application
    
    payload = {
        "application_id": app_id,
        "new_stage": RecruitmentStage.AI_SCREENING.value,
        "notes": "CV passed",
        "actor_name": "HR Test"
    }

    res = client.post("/tracing/update-stage", json=payload)
    assert res.status_code == 200

    # Verifikasi ke Database (Wajib pakai app_context karena kita akses DB langsung)
    with app.app_context():
        journey = RecruitmentJourney.query.filter_by(application_id=app_id).first()
        assert journey is not None
        assert journey.current_stage == RecruitmentStage.AI_SCREENING


def test_invalid_transition_rejected(client, seed_application):
    """
    AI_SCREENING -> ONBOARDING (Loncat Jauh -> Error 400)
    """
    app_id = seed_application
    
    payload = {
        "application_id": app_id,
        "new_stage": RecruitmentStage.ONBOARDING.value,
        "notes": "Skip flow"
    }

    res = client.post("/tracing/update-stage", json=payload)
    assert res.status_code == 400
    
    data = res.get_json()
    # Pastikan pesan error sesuai logic backend Anda
    # Bisa jadi "tidak diizinkan" atau "tidak valid" tergantung string di tracing.py
    msg = str(data.get("error", "")) + str(data.get("message", ""))
    assert "tidak" in msg


def test_rejection_requires_notes(client, seed_application):
    """
    Reject tanpa notes -> Error 400
    """
    app_id = seed_application
    
    payload = {
        "application_id": app_id,
        "new_stage": RecruitmentStage.REJECTED.value
    }

    res = client.post("/tracing/update-stage", json=payload)
    assert res.status_code == 400
    
    data = res.get_json()
    assert "Catatan Wajib Diisi" in data["error"]


def test_rejection_with_notes_success(client, app, seed_application):
    """
    Reject dengan notes -> Sukses 200
    """
    app_id = seed_application
    
    payload = {
        "application_id": app_id,
        "new_stage": RecruitmentStage.REJECTED.value,
        "notes": "Failed screening criteria"
    }

    res = client.post("/tracing/update-stage", json=payload)
    assert res.status_code == 200

    # Verifikasi Database
    with app.app_context():
        journey = RecruitmentJourney.query.filter_by(application_id=app_id).first()
        assert journey.current_stage == RecruitmentStage.REJECTED