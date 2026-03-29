"""
Skrip Seed - memasukkan data sampel Manpower Planning ke dalam pangkalan data.
Cara laksana: python seed.py
"""
import sys
import os

# Memastikan direktori semasa boleh diakses
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# [UPDATE PENTING]: Import create_app, bukan app
from app import create_app, db
from app.models import Manpower, Karyawan

# Buat instance aplikasi Flask
app = create_app()

# Menetapkan rentetan sambungan pangkalan data (connection string)
app.config['SQLALCHEMY_DATABASE_URI'] = "postgresql://postgres:pas@localhost:5432/hrrs"

# Data Sampel untuk Manpower
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

# Data Sampel untuk Karyawan
EMPLOYEES = [
    (1, [{"nama_lengkap": "Ahmad Rizki Pratama"}]),
    (2, [{"nama_lengkap": "Siti Nurhaliza"}, {"nama_lengkap": "Budi Santoso"}]),
    (3, [{"nama_lengkap": "Dewi Rahayu"}]),
    (4, [{"nama_lengkap": "Michael Chen"}]),
    (5, [{"nama_lengkap": "Indah Permatasari"}, {"nama_lengkap": "Reza Firmansyah"}]),
    (6, [{"nama_lengkap": "Citra Wahyuni"}]),
    (7, [{"nama_lengkap": "Andi Wijaya"}]),
    (8, [{"nama_lengkap": "Nuraini Hidayat"}]),
    # Index 9 sengaja dibiarkan kosong untuk menguji paparan formasi kosong
]

def seed():
    # Menjalankan konteks aplikasi Flask agar boleh berinteraksi dengan SQLAlchemy
    with app.app_context():
        try:
            # Memeriksa sama ada data sudah wujud
            if Manpower.query.count() > 0:
                print("Pangkalan data sudah mempunyai data Manpower. Seeding dibatalkan.")
                return

            print("Memulakan proses seeding data...")

            # 1. Masukkan data Posisi/Manpower
            for pos_data in POSITIONS:
                pos = Manpower(**pos_data)
                db.session.add(pos)
            
            db.session.commit()

            # Dapatkan ID yang baru dibuat untuk dipadankan dengan pekerja
            id_list = [m.id for m in Manpower.query.order_by(Manpower.id.asc()).all()]

            # 2. Masukkan data Pekerja/Karyawan
            total_employees = 0
            for idx, emp_list in EMPLOYEES:
                if idx <= len(id_list):
                    position_id = id_list[idx - 1]
                    for emp_data in emp_list:
                        # Kaitkan Karyawan dengan ID Manpower yang betul
                        emp = Karyawan(manpower_id=position_id, **emp_data)
                        db.session.add(emp)
                        total_employees += 1
            
            db.session.commit()
            print(f"✅ Berjaya menyimpan {len(POSITIONS)} posisi dan {total_employees} pekerja ke dalam pangkalan data hrrs!")

        except Exception as e:
            db.session.rollback()
            print(f"❌ Proses seeding gagal: {e}")

if __name__ == "__main__":
    seed()