from flask import Blueprint, jsonify, request
from app import db
from app.models import Candidate, JobApplication, JobPosition, TestLink, TestSubmission
from sqlalchemy import func

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/dashboard")

# Mapping Nilai Kualitatif Kraepelin ke Angka (0-100)
GRADE_MAP = {
    "Baik Sekali": 100,
    "Baik": 80,
    "Sedang": 60,
    "Kurang": 40,
    "Kurang Sekali": 20
}

def calculate_kraepelin_score(scores):
    """Menghitung rata-rata skor Kraepelin dari Speed, Accuracy, Stability"""
    if not scores:
        return 0
    
    speed = GRADE_MAP.get(scores.get("gradeSpeed"), 0)
    accuracy = GRADE_MAP.get(scores.get("gradeAccuracy"), 0)
    stability = GRADE_MAP.get(scores.get("gradeStability"), 0)
    
    return (speed + accuracy + stability) / 3

def calculate_cfit_score(scores):
    """Konversi IQ ke Skala 0-100 untuk Leaderboard"""
    if not scores:
        return 0
    
    iq = scores.get("iq", 0)
    # Asumsi: IQ 140 = 100 poin, IQ 70 = 0 poin
    # Rumus sederhana: (IQ / 1.4) atau mapping range
    if iq >= 130: return 100
    if iq >= 120: return 90
    if iq >= 110: return 80 # Average High
    if iq >= 100: return 75 # Average
    if iq >= 90: return 60
    return 40

@dashboard_bp.route("/leaderboard", methods=["GET"])
def get_leaderboard():
    job_id = request.args.get("job_id")
    
    # 1. Query Dasar: Join Candidate -> JobApplication -> JobPosition
    query = db.session.query(Candidate, JobApplication, JobPosition)\
        .join(JobApplication, Candidate.id == JobApplication.candidate_id)\
        .join(JobPosition, JobApplication.job_id == JobPosition.id)

    # Filter by Job jika ada
    if job_id and job_id != "all":
        query = query.filter(JobPosition.id == job_id)
        
    results = query.all()
    
    leaderboard_data = []
    
    for cand, app, job in results:
        # 2. Ambil Data Psikotes (TestLink -> TestSubmission)
        # Kita asumsikan relasi One-to-One antara Candidate dan TestLink (Active)
        test_link = TestLink.query.filter_by(candidate_id=cand.id).first()
        
        cfit_val = 0
        kraepelin_val = 0
        has_test = False
        
        if test_link:
            submissions = TestSubmission.query.filter_by(link_id=test_link.id).all()
            for sub in submissions:
                if sub.test_type == 'cfit':
                    cfit_val = calculate_cfit_score(sub.scores)
                    has_test = True
                elif sub.test_type == 'kraepelin':
                    kraepelin_val = calculate_kraepelin_score(sub.scores)
                    has_test = True
        
        # 3. Hitung Final Score
        # Bobot: CV (40%) + CFIT (30%) + Kraepelin (30%)
        # Jika tidak ada tes, Final Score = CV Score
        
        cv_score = app.match_score or 0
        
        if has_test:
            # Rata-rata psikotes (jika salah satu 0, tetap dibagi rata elemen yg ada)
            # Simplifikasi: (CV * 0.4) + (Psiko_Avg * 0.6)
            psiko_score = 0
            if cfit_val > 0 and kraepelin_val > 0:
                psiko_score = (cfit_val + kraepelin_val) / 2
            elif cfit_val > 0:
                psiko_score = cfit_val
            elif kraepelin_val > 0:
                psiko_score = kraepelin_val
                
            final_score = (cv_score * 0.4) + (psiko_score * 0.6)
        else:
            final_score = cv_score # Belum tes, ranking based on CV only
            psiko_score = 0

        leaderboard_data.append({
            "id": cand.id,
            "name": cand.name,
            "position": job.title,
            "positionId": job.id,
            "cvScore": round(cv_score, 1),
            "testScore": round(psiko_score, 1),
            "finalScore": round(final_score, 1),
            "status": app.status, # Applied, Screening, etc
            "avatar": "".join([n[0] for n in cand.name.split()[:2]]).upper() # Inisial
        })
        
    # 4. Sort by Final Score Descending
    leaderboard_data.sort(key=lambda x: x["finalScore"], reverse=True)
    
    return jsonify(leaderboard_data)


@dashboard_bp.route("/stats", methods=["GET"])
def get_dashboard_stats():
    """Mengambil statistik real-time untuk kartu di atas dashboard"""
    
    total_candidates = Candidate.query.count()
    active_jobs = JobPosition.query.filter_by(status='active').count()
    
    # Hitung Test Taken (Unik berdasarkan Link yang sudah submit minimal 1)
    completed_tests = db.session.query(func.count(func.distinct(TestSubmission.link_id))).scalar()
    
    # Hitung Completion Rate (Link aktif vs Link yang ada submission)
    total_links = TestLink.query.count()
    rate = 0
    if total_links > 0:
        rate = int((completed_tests / total_links) * 100)
        
    return jsonify({
        "total_candidates": total_candidates,
        "active_jobs": active_jobs,
        "test_taken": completed_tests,
        "completion_rate": f"{rate}%"
    })