import pytest
from app import db
from app.models import (
    JobApplication,
    RecruitmentJourney,
    RecruitmentStage,
    Candidate,
    JobPosition,
    Resume
)

# Fixture app & driver diambil otomatis dari conftest.py

@pytest.fixture(scope="module")
def seed_application_e2e(app):
    """
    Seed Data Khusus E2E Test dengan Cleanup Agresif
    """
    with app.app_context():
        # [PENTING] Reset sesi database jika ada error sebelumnya
        db.session.rollback()

        # ----------------------------------------------------
        # 1. CLEANUP: Hapus data lama yang mungkin nyangkut
        # ----------------------------------------------------
        
        # Hapus Journey terkait App E2E
        RecruitmentJourney.query.filter_by(application_id="APP-E2E").delete()
        
        # Hapus Application
        existing_app = db.session.get(JobApplication, "APP-E2E")
        if existing_app:
            db.session.delete(existing_app)

        # Hapus Candidate
        existing_cand = db.session.get(Candidate, "CAND-E2E")
        if existing_cand:
            db.session.delete(existing_cand)

        # Hapus Job
        existing_job = db.session.get(JobPosition, "JOB-E2E")
        if existing_job:
            db.session.delete(existing_job)

        # Hapus Resume
        existing_resume = db.session.get(Resume, "RESUME-E2E")
        if existing_resume:
            db.session.delete(existing_resume)

        db.session.commit() # Pastikan DB bersih

        # ----------------------------------------------------
        # 2. CREATE: Buat data baru
        # ----------------------------------------------------
        try:
            resume = Resume(id="RESUME-E2E", filename="e2e.pdf", raw_text="E2E")
            db.session.add(resume)

            job = JobPosition(
                id="JOB-E2E", title="E2E Engineer", department="QA", 
                level="Senior", location="Site", employment_type="Contract",
                job_description="Test UI", requirements=[]
            )
            db.session.add(job)

            candidate = Candidate(
                id="CAND-E2E", resume_id="RESUME-E2E",
                name="E2E Candidate Selenium", phone="0811111111", 
                email="e2e@test.com"
            )
            db.session.add(candidate)
            db.session.commit() # Commit entitas induk

            app_data = JobApplication(
                id="APP-E2E",
                candidate_id=candidate.id,
                job_id=job.id
            )
            db.session.add(app_data)
            db.session.commit()

            return app_data.id
            
        except Exception as e:
            db.session.rollback()
            pytest.fail(f"Gagal setup seed data E2E: {e}")


def test_full_recruitment_flow(driver, seed_application_e2e):
    """
    E2E TEST: Menggunakan Selenium Driver
    Pastikan Frontend Next.js berjalan di port 3000
    """
    application_id = seed_application_e2e
    
    # URL Frontend (Sesuaikan port jika beda)
    frontend_url = f"http://localhost:3000/recruitment/{application_id}"
    
    # Buka Halaman
    driver.get(frontend_url)
    
    # --- CONTOH INTERAKSI SELENIUM ---
    # Sesuaikan ID elemen dengan kode React Anda
    
    # 1. Cari Dropdown Stage
    # stage_select = driver.find_element("id", "stage-select")
    # stage_select.send_keys("AI Screening")

    # 2. Cari Input Notes
    # notes = driver.find_element("id", "notes")
    # notes.send_keys("Passed via Selenium")

    # 3. Klik Tombol Submit
    # driver.find_element("id", "submit-stage").click()

    # --- VERIFIKASI DATABASE (BACKEND) ---
    # Cek apakah status di database berubah setelah klik di UI
    # journey = RecruitmentJourney.query.filter_by(application_id=application_id).first()
    # assert journey is not None
    # assert journey.current_stage == RecruitmentStage.AI_SCREENING
    
    # Karena saya tidak melihat kode UI React Anda, bagian interaction di atas 
    # saya comment agar tidak error. Silakan uncomment dan sesuaikan ID HTML-nya.
    pass