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
    Fungsi ini TIDAK mengirim pesan, tapi mengembalikan URL wa.me
    yang siap diklik oleh Frontend.
    """
    target = format_phone_number(candidate_phone)
    if not target: return None

    # --- TEMPLATE PESAN (Sama seperti sebelumnya) ---
    msg = ""
    
    if stage == "Psychotest":
        msg = (
            f"Halo *{candidate_name}*,\n\n"
            f"Selamat! Anda lanjut ke tahap *Psikotes*.\n"
            f"Link Tes: {additional_info}\n\n"
            f"Mohon dikerjakan segera. Terima kasih."
        )
    elif "Interview" in stage:
        msg = (
            f"Halo *{candidate_name}*,\n\n"
            f"Kami mengundang Anda untuk *{stage}*.\n"
            f"Mohon cek email untuk jadwal detailnya.\n\n"
            f"Catatan: {additional_info}"
        )
    elif stage in ["Offering", "Negotiation"]:
        msg = (
            f"Selamat *{candidate_name}*!\n\n"
            f"Kami mengirimkan *Offering Letter*.\n"
            f"Download: {additional_info}\n\n"
            f"Mohon konfirmasinya."
        )
    elif stage in ["Medical Check Up", "Flight Ticket"]:
        doc_type = "Jadwal MCU" if stage == "Medical Check Up" else "Tiket Pesawat"
        msg = (
            f"Halo *{candidate_name}*,\n\n"
            f"Berikut dokumen *{doc_type}* Anda.\n"
            f"Download: {additional_info}"
        )

    elif stage == "SCM Clinic Team Review":
        msg = (
            f"Halo *{candidate_name}*,\n\n"
            f"Terima kasih telah menjalani Medical Check Up.\n"
            f"Saat ini hasil MCU Anda sudah kami terima dan sedang dalam proses *Review oleh Tim SCM Clinic*.\n\n"
            f"Mohon kesediaannya menunggu, kami akan segera mengabari hasilnya (Lolos/Tidak) dalam 1x24 jam."
        )

    elif stage == "MCU Failed":
        msg = (
            f"Halo *{candidate_name}*,\n\n"
            f"Terima kasih telah mengikuti rangkaian seleksi.\n"
            f"Berdasarkan hasil review tim medis, mohon maaf kami belum bisa melanjutkan ke tahap berikutnya.\n\n"
            f"Tetap semangat dan sukses untuk karir Anda ke depan."
        )

    elif stage == "Onboarding":
        msg = (
            f"Selamat *{candidate_name}*! 🎉\n\n"
            f"Anda dinyatakan LOLOS MCU dan tahap seleksi akhir.\n"
            f"Selamat bergabung! Informasi *Onboarding (Hari Pertama)* akan kami kirimkan via email.\n\n"
            f"Sampai jumpa!"
        )
        
    elif stage == "Hired":
        msg = f"Selamat Bergabung, *{candidate_name}*! 🎉\nInfo onboarding akan segera dikirim."
    elif stage == "Rejected":
        msg = f"Halo *{candidate_name}*,\nTerima kasih atas waktunya. Saat ini kami belum bisa melanjutkan proses Anda."
    else:
        msg = f"Halo *{candidate_name}*,\nStatus lamaran update ke: *{stage}*."

    # Encode pesan agar aman di URL (spasi jadi %20, dst)
    encoded_msg = urllib.parse.quote(msg)
    
    # Return Link wa.me
    return f"https://wa.me/{target}?text={encoded_msg}"