"""
Skrip Seed - Direct Database Connection (Murni SQLAlchemy, Skip Flask)
Cara laksana: python seed_direct.py
"""
import sys
import os

# Memastikan direktori saat ini bisa dibaca
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# KITA HANYA IMPORT STRUKTUR TABEL (MODEL), TIDAK IMPORT FLASK/APP
from app.models import Manpower, Employee

# ==========================================
# 1. KONEKSI LANGSUNG KE POSTGRESQL
# ==========================================
DATABASE_URI = "postgresql://postgres:pas@localhost:5432/hrrs"

# Membuat 'mesin' yang langsung terhubung ke database
engine = create_engine(DATABASE_URI)

# Membuat 'sesi' manual (pengganti db.session milik Flask)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
session = SessionLocal()


# ==========================================
# 2. DATA SAMPEL
# ==========================================
POSITIONS = [
    {"position_title": "VP of Engineering", "level": "VP", "grade": "G1", "section": "-", "department": "Engineering", "division": "Technology", "local_non_local": "Local", "work_location": "Jakarta HQ"},
    {"position_title": "Senior Software Engineer", "level": "Senior", "grade": "G3", "section": "Backend", "department": "Engineering", "division": "Technology", "local_non_local": "Local", "work_location": "Jakarta HQ"},
    {"position_title": "Frontend Developer", "level": "Mid", "grade": "G4", "section": "Frontend", "department": "Engineering", "division": "Technology", "local_non_local": "Local", "work_location": "Bandung Office"},
    {"position_title": "DevOps Engineer", "level": "Mid", "grade": "G4", "section": "Infrastructure", "department": "Engineering", "division": "Technology", "local_non_local": "Non-Local", "work_location": "Remote"},
    {"position_title": "Data Scientist", "level": "Senior", "grade": "G3", "section": "Data", "department": "Analytics", "division": "Technology", "local_non_local": "Local", "work_location": "Jakarta HQ"},
    {"position_title": "Product Manager", "level": "Manager", "grade": "G2", "section": "-", "department": "Product", "division": "Business", "local_non_local": "Local", "work_location": "Jakarta HQ"},
    {"position_title": "UX Designer", "level": "Mid", "grade": "G4", "section": "Design", "department": "Product", "division": "Business", "local_non_local": "Local", "work_location": "Jakarta HQ"},
    {"position_title": "HR Business Partner", "level": "Senior", "grade": "G3", "section": "-", "department": "Human Resources", "division": "Operations", "local_non_local": "Local", "work_location": "Jakarta HQ"},
    {"position_title": "Talent Acquisition", "level": "Mid", "grade": "G4", "section": "Recruitment", "department": "Human Resources", "division": "Operations", "local_non_local": "Local", "work_location": "Surabaya Office"},
]

EMPLOYEES = [
    (1, [{"nama_lengkap": "Ahmad Rizki Pratama"}]),
    (2, [{"nama_lengkap": "Siti Nurhaliza"}, {"nama_lengkap": "Budi Santoso"}]),
    (3, [{"nama_lengkap": "Dewi Rahayu"}]),
    (4, [{"nama_lengkap": "Michael Chen"}]),
    (5, [{"nama_lengkap": "Indah Permatasari"}, {"nama_lengkap": "Reza Firmansyah"}]),
    (6, [{"nama_lengkap": "Citra Wahyuni"}]),
    (7, [{"nama_lengkap": "Andi Wijaya"}]),
    (8, [{"nama_lengkap": "Nuraini Hidayat"}]),
    # Index 9 sengaja dikosongkan agar UI menampilkan label "Slot Formasi Kosong"
]


# ==========================================
# 3. PROSES EKSEKUSI (EKSTRAK CEPAT)
# ==========================================
def seed():
    try:
        # Cek pakai session buatan kita sendiri
        if session.query(Manpower).count() > 0:
            print("Peringatan: Tabel Manpower sudah ada isinya. Seeding dibatalkan untuk mencegah duplikat.")
            return

        print("Menghubungkan ke PostgreSQL dan memulai injeksi data...")

        # 1. Simpan Posisi
        for pos_data in POSITIONS:
            pos = Manpower(**pos_data)
            session.add(pos)
        
        session.commit()

        # Tarik semua ID Manpower yang baru saja dibuat
        id_list = [m.id for m in session.query(Manpower).order_by(Manpower.id.asc()).all()]

        # 2. Simpan Employee
        total_employees = 0
        for idx, emp_list in EMPLOYEES:
            if idx <= len(id_list):
                position_id = id_list[idx - 1]
                for emp_data in emp_list:
                    emp = Employee(manpower_id=position_id, **emp_data)
                    session.add(emp)
                    total_employees += 1
        
        session.commit()
        print(f"✅ Selesai! {len(POSITIONS)} posisi dan {total_employees} Employee berhasil disuntikkan murni ke PostgreSQL.")

    except Exception as e:
        session.rollback()
        print(f"❌ Terjadi kesalahan fatal: {e}")
    
    finally:
        session.close() # Wajib tutup jalur koneksi setelah selesai

if __name__ == "__main__":
    seed()