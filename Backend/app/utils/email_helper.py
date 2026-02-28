import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_email_auto(candidate_email, candidate_name, stage, job_title, notes=""):
    """
    Fungsi untuk mengirim email otomatis via SMTP.
    """
    if not candidate_email:
        print("Email kandidat tidak ditemukan.")
        return False

    # Ambil kredensial dari .env (atau gunakan default jika tidak ada, tapi disarankan pakai .env)
    sender_email = os.getenv("SMTP_EMAIL", "bayubulan659@gmail.com") 
    sender_password = os.getenv("SMTP_PASSWORD", "vtvc diru lfzj ldkn")
    
    # 1. Tentukan Subjek Email
    subject = f"Update Status Lamaran: {job_title}"
    
    # 2. Tentukan Isi (Body) Email berdasarkan stage
    body = f"Halo {candidate_name},\n\n"
    
    if stage == "Psychotest":
        body += f"Selamat! Anda dinyatakan lolos ke tahap Psikotes.\nLink Psikotes: {notes}\nMohon segera dikerjakan."
    elif "Interview" in stage:
        body += f"Kami mengundang Anda untuk mengikuti tahap {stage}.\nJadwal dan detail: {notes}"
    elif stage in ["Offering", "Negotiation"]:
        body += f"Selamat! Kami bermaksud memberikan Offering Letter kepada Anda.\nSilakan unduh/cek dokumen terkait: {notes}"
    elif stage == "Rejected":
        body += "Terima kasih atas antusiasme Anda. Sayangnya, untuk saat ini kami belum bisa melanjutkan proses lamaran Anda ke tahap selanjutnya.\nTetap semangat!"
    else:
        body += f"Kami menginformasikan bahwa status lamaran Anda telah diperbarui ke tahap: {stage}."
        if notes:
            body += f"\n\nCatatan dari tim HR: {notes}"
            
    body += "\n\nSalam Hangat,\nTim HRD"

    # 3. Setup Struktur Email
    msg = MIMEMultipart()
    msg['From'] = f"HR Department <{sender_email}>"
    msg['To'] = candidate_email
    msg['Subject'] = subject
    
    msg.attach(MIMEText(body, 'plain'))

    # 4. Kirim Email melalui Server SMTP (Contoh menggunakan Gmail)
    try:
        # Gunakan smtp.gmail.com untuk Gmail, smtp-mail.outlook.com untuk Outlook/Hotmail
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls() # Keamanan enkripsi TLS
        server.login(sender_email, sender_password)
        
        server.send_message(msg)
        server.quit()
        
        print(f"Email otomatis berhasil dikirim ke {candidate_email}")
        return True
    except Exception as e:
        print(f"Gagal mengirim email: {str(e)}")
        return False