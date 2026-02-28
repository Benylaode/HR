import re
import urllib.parse

def format_phone_number(phone):
    """Ubah 08xx jadi 628xx"""
    if not phone: return ""
    clean = re.sub(r'\D', '', phone)
    if clean.startswith("0"): return "62" + clean[1:]
    if clean.startswith("62"): return clean
    return ""

def generate_wa_link(candidate_phone, candidate_name, stage, additional_info=""):
    """
    Mengembalikan URL wa.me yang siap diklik/dibuka oleh Frontend.
    """
    target = format_phone_number(candidate_phone)
    if not target: return None

    # --- TEMPLATE PESAN ---
    msg = ""
    if stage == "Psychotest":
        msg = f"Halo *{candidate_name}*,\n\nSelamat! Anda lanjut ke tahap *Psikotes*.\nLink Tes: {additional_info}\n\nMohon dikerjakan segera. Terima kasih."
    elif "Interview" in stage:
        msg = f"Halo *{candidate_name}*,\n\nKami mengundang Anda untuk *{stage}*.\nMohon cek email untuk jadwal detailnya.\n\nCatatan: {additional_info}"
    elif stage in ["Offering", "Negotiation"]:
        msg = f"Selamat *{candidate_name}*!\n\nKami mengirimkan *Offering Letter*.\nDownload: {additional_info}\n\nMohon konfirmasinya."
    elif stage in ["Medical Check Up", "Flight Ticket"]:
        doc_type = "Jadwal MCU" if stage == "Medical Check Up" else "Tiket Pesawat"
        msg = f"Halo *{candidate_name}*,\n\nBerikut dokumen *{doc_type}* Anda.\nDownload: {additional_info}"
    elif stage == "SCM Clinic Team Review":
        msg = f"Halo *{candidate_name}*,\n\nTerima kasih telah menjalani Medical Check Up.\nSaat ini hasil MCU Anda sudah kami terima dan sedang dalam proses *Review oleh Tim SCM Clinic*."
    elif stage == "MCU Failed":
        msg = f"Halo *{candidate_name}*,\n\nTerima kasih telah mengikuti rangkaian seleksi.\nBerdasarkan hasil review tim medis, mohon maaf kami belum bisa melanjutkan ke tahap berikutnya."
    elif stage == "Onboarding":
        msg = f"Selamat *{candidate_name}*! 🎉\n\nAnda dinyatakan LOLOS MCU dan tahap seleksi akhir.\nSelamat bergabung! Informasi *Onboarding* akan dikirim via email."
    elif stage == "Hired":
        msg = f"Selamat Bergabung, *{candidate_name}*! 🎉\nInfo onboarding akan segera dikirim."
    elif stage == "Rejected":
        msg = f"Halo *{candidate_name}*,\nTerima kasih atas waktunya. Saat ini kami belum bisa melanjutkan proses lamaran Anda."
    else:
        msg = f"Halo *{candidate_name}*,\nStatus lamaran Anda diupdate ke tahap: *{stage}*."

    # Encode pesan agar format spasi dan enter aman di URL
    encoded_msg = urllib.parse.quote(msg)
    
    # Kembalikan link wa.me
    return f"https://wa.me/{target}?text={encoded_msg}"