# 🚀 Setup Database HRRS (Lengkap + Aman + Siap Produksi)

## 1️⃣ Import `hrrs.sql` ke Database

> **INI YANG PALING PENTING**

### 🔥 Cara paling aman & direkomendasikan (CLI)

Pastikan kamu berada di folder yang sama dengan `hrrs.sql`:

```bash
psql -U postgres -d hrrs -f hrrs.sql
```

Jika **tidak ada error**, berarti:

* ✅ tabel berhasil dibuat
* ✅ data berhasil terisi
* ✅ database **siap digunakan**

---

### Jika PostgreSQL menggunakan host / port custom

```bash
psql -h localhost -p 5432 -U postgres -d hrrs -f hrrs.sql
```

---

## 2️⃣ Verifikasi Database Berhasil Di-import

Masuk ke database:

```bash
psql -U postgres -d hrrs
```

Cek daftar tabel:

```sql
\dt
```

Cek isi tabel:

```sql
SELECT * FROM nama_tabel;
```

Jika data muncul → ✅ **BERHASIL**

---

## 3️⃣ Konfigurasi Koneksi Database untuk Aplikasi

### Contoh `.env`

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/hrrs
```

### Contoh konfigurasi SQLAlchemy (Flask)

```python
SQLALCHEMY_DATABASE_URI = "postgresql://postgres:password@localhost:5432/hrrs"
```

---

## 4️⃣ ⚠️ PENTING — Setup Migrasi Database (Flask-Migrate)

> **WAJIB dilakukan SEBELUM menjalankan aplikasi**
> Terutama jika project menggunakan `Flask-Migrate / Alembic`

### Pastikan dependensi terpasang

```bash
pip install flask-migrate
```

### Inisialisasi migrasi (jika belum ada folder `migrations/`)

```bash
flask db init
```

> ⚠️ **Lewati langkah ini jika folder `migrations/` sudah ada**

---

## 5️⃣ Sinkronisasi Database dengan Model (WAJIB)

### 🔥 Jalankan **upgrade** agar Flask mengenali struktur database

```bash
flask db upgrade
```

✅ Fungsi perintah ini:

* Menyamakan **schema database** dengan **SQLAlchemy models**
* Menghindari error seperti:

  * `relation already exists`
  * `table not found`
  * mismatch kolom

> ❗ **JANGAN** menjalankan `flask db migrate` sebelum `upgrade`
> karena database **sudah berisi tabel dari `hrrs.sql`**

---

## 6️⃣ (OPSIONAL) Membuat Database Benar-Benar Portable

Jika `hrrs.sql` ingin bisa dijalankan di mana saja, tambahkan di **baris paling atas** file:

```sql
CREATE DATABASE hrrs;
\c hrrs;
```

⚠️ **Catatan penting**

* `\c` **hanya bekerja via `psql`**
* Tidak berjalan di pgAdmin Query Tool

---

## 7️⃣ Backup Ulang Database (Untuk Deploy / Server Lain)

Jika database sudah stabil dan ingin disimpan ulang:

```bash
pg_dump -U postgres hrrs > hrrs.sql
```

File hasil backup ini:

* ✅ berisi struktur tabel
* ✅ berisi seluruh data
* ✅ bisa langsung di-restore di server lain

---

## 🧠 Urutan Aman (Ringkasan Cepat)

```text
1. Import hrrs.sql
2. Set DATABASE_URL
3. flask db init   (jika belum ada)
4. flask db upgrade
5. Jalankan aplikasi
```

---
