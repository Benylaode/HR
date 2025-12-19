##  Import `hrrs.sql` ke database (INI YANG PALING PENTING)

### 🔥 Cara paling aman & direkomendasikan (CLI)

Pastikan kamu berada di folder yang sama dengan `hrrs.sql`:

```bash
psql -U postgres -d hrrs -f hrrs.sql
```

Jika **tidak ada error**, berarti:

* tabel dibuat
* data terisi
* database **siap jalan**

---

### Jika PostgreSQL pakai port / host custom

```bash
psql -h localhost -p 5432 -U postgres -d hrrs -f hrrs.sql
```

---

## 4️⃣ Verifikasi database sudah masuk

Masuk ke database:

```bash
psql -U postgres -d hrrs
```

Cek tabel:

```sql
\dt
```

Cek isi tabel:

```sql
SELECT * FROM nama_tabel;
```

Jika data muncul → ✅ **BERHASIL**

---

## 5️⃣ Agar “langsung siap jalan” untuk aplikasi (Flask / Django)

### Contoh `.env`

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/hrrs
```

### Contoh SQLAlchemy

```python
SQLALCHEMY_DATABASE_URI = "postgresql://postgres:password@localhost:5432/hrrs"
```

---

## 6️⃣ (OPSIONAL) Jika `hrrs.sql` ingin benar-benar portable

Tambahkan di **baris paling atas** `hrrs.sql`:

```sql
CREATE DATABASE hrrs;
\c hrrs;
```

⚠️ **Catatan**
Baris `\c` hanya bekerja jika dijalankan via `psql`, bukan pgAdmin Query Tool.

---

## 7️⃣ Backup ulang database (biar bisa dipindahkan ke server lain)

Kalau nanti database sudah terisi dan ingin **menyimpan ulang**:

```bash
pg_dump -U postgres hrrs > hrrs.sql
```

File ini:

* berisi struktur
* berisi data
* bisa langsung di-restore

---


---

Kalau kamu mau, Gatsby bisa:

* 🔧 cek isi `hrrs.sql` kamu (aman / error / konflik)
* 🔁 menyesuaikan agar **cocok dengan SQLAlchemy models**
* 🚀 menyiapkan **script auto-setup sekali jalan**

Tinggal kirim isi atau struktur `hrrs.sql`-nya saja.
