"""
Skrip Seed Murni & Pintar (Standalone)
Menyisipkan Formasi Manpower, lalu mencari Karyawan yang sudah ada di Database 
untuk di-Update (dihubungkan). Jika belum ada, baru di-Insert.
"""
import psycopg2
import uuid
from datetime import datetime, timezone

# ==========================================
# 1. KONFIGURASI KONEKSI DATABASE
# ==========================================
# Sesuaikan dengan connection string Anda
DB_HOST = "localhost"
DB_PORT = "5432"
DB_NAME = "hrrs"
DB_USER = "postgres"
DB_PASS = "password"

# ==========================================
# 2. DATA SAMPEL (PETA FORMASI & PENGHUNI)
# ==========================================
SEED_DATA = [
    {
        "position": {"position_title": "DRIVER", "level": "Staff", "grade": "G6", "section": "Transport", "department": "General Affairs", "division": "Operations", "local_non_local": "Local", "work_location": "Site Area"},
        "employees": [
            "C256540 - HARUN TAYASHAR BUDI",
            "C220008 - VALENTINO KRISTIAN RUMAJAR",
            "C220004 - M.JAMAL L",
            "C233445 - JAMIL"
        ]
    },
    {
        "position": {"position_title": "Production Geology Data Analyst", "level": "Analyst", "grade": "G4", "section": "Data", "department": "Geology", "division": "Operations", "local_non_local": "Local", "work_location": "Site Area"},
        "employees": ["SCM0276 - Arman, S.Mat"]
    },
    {
        "position": {"position_title": "Production & Reconciliation Officer", "level": "Officer", "grade": "G4", "section": "Production", "department": "Mining", "division": "Operations", "local_non_local": "Local", "work_location": "Site Area"},
        "employees": ["SCM0793 - Eko Yuli Kurniawan", "SCM0674 - Nur Hamzah"]
    },
    {
        "position": {"position_title": "Safety Hauling Patrol", "level": "Staff", "grade": "G5", "section": "Patrol", "department": "HSE", "division": "Operations", "local_non_local": "Local", "work_location": "Site Area"},
        "employees": ["SCM0761 - Muh Mirdhad Prayudi"]
    },
    {
        "position": {"position_title": "Production Engineer", "level": "Engineer", "grade": "G3", "section": "Engineering", "department": "Mining", "division": "Operations", "local_non_local": "Non-Local", "work_location": "Site Area"},
        "employees": ["SCM0758 - Fauzan Irfansyah"]
    },
    {
        "position": {"position_title": "IT Network & Infrastructure Assistant", "level": "Assistant", "grade": "G5", "section": "Infrastructure", "department": "IT", "division": "Technology", "local_non_local": "Local", "work_location": "Site Area"},
        "employees": ["SCM0681 - Agit Pratama L.B"]
    },
    {
        "position": {"position_title": "IT Project Assistant", "level": "Assistant", "grade": "G5", "section": "Projects", "department": "IT", "division": "Technology", "local_non_local": "Local", "work_location": "Site Area"},
        "employees": ["SCM0680 - Andika Ramadhan"]
    },
    {
        "position": {"position_title": "Simper Admin", "level": "Admin", "grade": "G5", "section": "Administration", "department": "General Affairs", "division": "Operations", "local_non_local": "Local", "work_location": "Site Area"},
        "employees": ["SCM0639 - Endang"]
    },
    {
        "position": {"position_title": "Weight Bridge Technician", "level": "Technician", "grade": "G5", "section": "Logistics", "department": "Supply Chain", "division": "Operations", "local_non_local": "Local", "work_location": "Site Area"},
        "employees": ["SCM0636 - Omis Saputra"]
    },
    {
        "position": {"position_title": "Fuelman", "level": "Operator", "grade": "G6", "section": "Fuel", "department": "Logistics", "division": "Operations", "local_non_local": "Local", "work_location": "Site Area"},
        "employees": ["SCM0570 - Azizul Aliym"]
    },
    {
        "position": {"position_title": "Grade Control Foreman", "level": "Foreman", "grade": "G3", "section": "Grade Control", "department": "Mining", "division": "Operations", "local_non_local": "Non-Local", "work_location": "Site Area"},
        "employees": ["SCM0467 - Dimas Murdiman"]
    },
    {
        "position": {"position_title": "Warehouseman", "level": "Operator", "grade": "G6", "section": "Warehouse", "department": "Logistics", "division": "Operations", "local_non_local": "Local", "work_location": "Site Area"},
        "employees": ["SCM0371 - Eko Roly"]
    },
    {
        "position": {"position_title": "Surveyor Mining Leadhand", "level": "Leadhand", "grade": "G4", "section": "Survey", "department": "Mining", "division": "Operations", "local_non_local": "Local", "work_location": "Site Area"},
        "employees": ["SCM0347 - Jasmin"]
    },
    {
        "position": {"position_title": "Geophysicist", "level": "Specialist", "grade": "G3", "section": "Exploration", "department": "Geology", "division": "Operations", "local_non_local": "Non-Local", "work_location": "Site Area"},
        "employees": ["SCM0312 - Firdaus Sigma Rizqi"]
    },
    {
        "position": {"position_title": "Mechanic", "level": "Technician", "grade": "G5", "section": "Heavy Equipment", "department": "Maintenance", "division": "Operations", "local_non_local": "Local", "work_location": "Site Area"},
        "employees": ["SCM0236 - Bobi"]
    },
    {
        "position": {"position_title": "Welder", "level": "Technician", "grade": "G5", "section": "Fabrication", "department": "Maintenance", "division": "Operations", "local_non_local": "Local", "work_location": "Site Area"},
        "employees": ["SCM0224 - Hasanuddin"]
    },
    {
        "position": {"position_title": "HR Staff", "level": "Staff", "grade": "G4", "section": "Personnel", "department": "Human Resources", "division": "Support", "local_non_local": "Local", "work_location": "Site Area"},
        "employees": ["SARAH"]
    }
]

def seed_smart():
    print(f"🔄 Menghubungkan ke database {DB_NAME}...")
    conn = None
    cur = None
    
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASS
        )
        cur = conn.cursor()
        print("✅ Koneksi PostgreSQL berhasil!")

        inserted_manpower = 0
        linked_existing = 0
        inserted_new = 0

        # Query Disiapkan
        insert_manpower_query = """
            INSERT INTO manpower (position_title, level, grade, division, department, section, work_location, local_non_local)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id;
        """
        
        search_emp_query = "SELECT id FROM employees WHERE full_name ILIKE %s LIMIT 1;"
        update_emp_query = "UPDATE employees SET manpower_id = %s WHERE id = %s;"
        insert_emp_query = """
            INSERT INTO employees (id, full_name, email, manpower_id, employee_status, created_at)
            VALUES (%s, %s, %s, %s, %s, %s);
        """

        print("⏳ Memulai Seeding & Proses Linking (Penghubungan Data)...")
        
        for data in SEED_DATA:
            pos = data["position"]
            
            # 1. BUAT MANPOWER / POSISI BARU
            cur.execute(insert_manpower_query, (
                pos["position_title"], pos["level"], pos["grade"], 
                pos["division"], pos["department"], pos["section"], 
                pos["work_location"], pos["local_non_local"]
            ))
            new_manpower_id = cur.fetchone()[0]
            inserted_manpower += 1

            # 2. PROSES KARYAWAN (LINK atau INSERT)
            for emp_full_str in data["employees"]:
                # Pintar memisahkan nama, misal "SCM0639 - Endang" menjadi pencarian "Endang"
                # Hal ini agar cocok jika di database Anda namanya tidak pakai kode SCM
                search_name = emp_full_str.split(" - ")[-1].strip() if " - " in emp_full_str else emp_full_str.strip()
                
                cur.execute(search_emp_query, (f"%{search_name}%",))
                result = cur.fetchone()

                if result:
                    # JIKA KARYAWAN SUDAH ADA DI DB -> UPDATE
                    existing_id = result[0]
                    cur.execute(update_emp_query, (new_manpower_id, existing_id))
                    linked_existing += 1
                else:
                    # JIKA KARYAWAN BELUM ADA DI DB -> INSERT
                    new_emp_id = str(uuid.uuid4())
                    safe_email = f"{search_name.lower().replace(' ', '.')}@scmnickel.com"
                    cur.execute(insert_emp_query, (
                        new_emp_id, emp_full_str, safe_email, 
                        new_manpower_id, "Active", datetime.now(timezone.utc)
                    ))
                    inserted_new += 1

        conn.commit()
        print("-" * 50)
        print("🎉 PROSES SEEDING SELESAI!")
        print(f"🏢 {inserted_manpower} Formasi / Jabatan baru berhasil ditambahkan.")
        print(f"🔗 {linked_existing} Karyawan lama berhasil dihubungkan ke formasi.")
        print(f"➕ {inserted_new} Karyawan baru ditambahkan karena belum ada di sistem.")
        print("-" * 50)

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"❌ GAGAL: Terjadi kesalahan saat seeding:\n{e}")

    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()
        print("🔒 Koneksi database ditutup.")

if __name__ == "__main__":
    seed_smart()