"use client";

import React, { useState } from "react";

type FormData = {
  email: string;
  fullName: string;
  whatsapp: string;
  gender: string;
  religion: string;
  birthPlace: string;
  birthDate: string;
  driverLicense: string;
  address: string;
  city: string;
  province: string;
  education: string;
  university: string;
  major: string;
  gpa: string;
  socialMedia: string;
  positionApplied: string;
  lastCompany: string;
  lastPosition: string;
  lastPositionLevel: string;
  lastCompanyField: string;
  totalExperience: string;
  experienceDescription: string;
};

export default function ManualRegistrationPage() {
  const [form, setForm] = useState<FormData>({} as FormData);
  const [submissionType, setSubmissionType] = useState<"candidate" | "employee">("candidate");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    // Endpoint mengarah ke backend Flask yang baru kita buat
    const apiUrl =
      submissionType === "candidate"
        ? "http://localhost:5000/candidates"
        : "http://localhost:5000/karyawan";

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Terjadi kesalahan saat menyimpan data");
      }

      setMessage({
        type: "success",
        text: `✅ Data ${submissionType === "candidate" ? "Kandidat" : "Karyawan"} berhasil disimpan!`,
      });
      
      // Opsional: Kosongkan form setelah sukses
      // setForm({} as FormData);
      
    } catch (error: any) {
      console.error("Submit Error:", error);
      setMessage({ type: "error", text: `❌ Gagal: ${error.message}` });
    } finally {
      setIsLoading(false);
      // Auto-hide pesan setelah 5 detik
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const inputClass =
    "w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-700 bg-white";

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="max-w-5xl mx-auto bg-white shadow-xl rounded-2xl p-6 md:p-8 border border-gray-100">
        
        <div className="mb-8 border-b pb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Input Data Pelamar & Karyawan</h1>
          <p className="text-gray-500">Silakan isi formulir di bawah ini untuk mendaftarkan kandidat baru atau menginput data karyawan internal.</p>
        </div>

        {message && (
          <div className={`p-4 mb-6 rounded-lg ${message.type === "success" ? "bg-green-100 text-green-800 border border-green-200" : "bg-red-100 text-red-800 border border-red-200"}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* TIPE PENDAFTARAN */}
          <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
            <h2 className="text-lg font-semibold mb-3 text-blue-800">1. Tipe Pendaftaran</h2>
            <select
              value={submissionType}
              onChange={(e) => setSubmissionType(e.target.value as "candidate" | "employee")}
              className={`${inputClass} border-blue-200 max-w-md`}
              required
            >
              <option value="candidate">Kandidat Baru (Pelamar Eksternal)</option>
              <option value="employee">Karyawan Internal</option>
            </select>
          </div>

          {/* PERSONAL INFO */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">2. Informasi Pribadi</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <input name="fullName" placeholder="Nama Lengkap *" required className={inputClass} onChange={handleChange} />
              <input name="email" type="email" placeholder="Email Aktif *" required className={inputClass} onChange={handleChange} />
              <input name="whatsapp" placeholder="Nomor WhatsApp *" required className={inputClass} onChange={handleChange} />
              <select name="gender" required className={inputClass} onChange={handleChange}>
                <option value="">-- Pilih Jenis Kelamin -- *</option>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
              <input name="religion" placeholder="Agama" className={inputClass} onChange={handleChange} />
              <input name="driverLicense" placeholder="SIM yang dimiliki (Misal: A, C)" className={inputClass} onChange={handleChange} />
            </div>
          </div>

          {/* BIRTH */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">3. Tempat & Tanggal Lahir</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <input name="birthPlace" placeholder="Tempat Lahir *" required className={inputClass} onChange={handleChange} />
              <div className="flex flex-col">
                <input type="date" name="birthDate" required className={inputClass} onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* ADDRESS */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">4. Alamat & Kontak</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <input name="address" placeholder="Alamat Lengkap (Jalan, RT/RW)" className={`${inputClass} md:col-span-2`} onChange={handleChange} />
              <input name="city" placeholder="Kota / Kabupaten" className={inputClass} onChange={handleChange} />
              <input name="province" placeholder="Provinsi" className={inputClass} onChange={handleChange} />
              <input name="socialMedia" placeholder="URL LinkedIn / Portofolio" className={`${inputClass} md:col-span-2`} onChange={handleChange} />
            </div>
          </div>

          {/* EDUCATION */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">5. Riwayat Pendidikan Terakhir</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <input name="education" placeholder="Gelar (Misal: S1, D3, SMA)" className={inputClass} onChange={handleChange} />
              <input name="university" placeholder="Nama Institusi / Universitas" className={inputClass} onChange={handleChange} />
              <input name="major" placeholder="Jurusan / Program Studi" className={inputClass} onChange={handleChange} />
              <input name="gpa" placeholder="IPK / Nilai Akhir" className={inputClass} onChange={handleChange} />
            </div>
          </div>

          {/* WORK EXPERIENCE */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">6. Pengalaman Kerja Terakhir</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <input name="positionApplied" placeholder="Posisi yang Dilamar (Saat Ini) *" required className={`${inputClass} border-blue-300 bg-blue-50`} onChange={handleChange} />
              <input name="totalExperience" placeholder="Total Lama Pengalaman (Misal: 3 Tahun)" className={inputClass} onChange={handleChange} />
              
              <input name="lastCompany" placeholder="Nama Perusahaan Terakhir" className={inputClass} onChange={handleChange} />
              <input name="lastCompanyField" placeholder="Bidang Industri (Misal: IT, Pertambangan)" className={inputClass} onChange={handleChange} />
              
              <input name="lastPosition" placeholder="Jabatan / Posisi Terakhir" className={inputClass} onChange={handleChange} />
              <input name="lastPositionLevel" placeholder="Level Jabatan (Misal: Staff, Supervisor)" className={inputClass} onChange={handleChange} />
            </div>
            <textarea
              name="experienceDescription"
              placeholder="Ceritakan secara singkat tugas dan tanggung jawab di pekerjaan terakhir..."
              rows={4}
              className={`${inputClass} mt-5`}
              onChange={handleChange}
            />
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-6 border-t">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full text-white text-lg p-4 rounded-xl font-bold tracking-wide shadow-md transition-all ${
                isLoading 
                  ? "bg-blue-400 cursor-not-allowed" 
                  : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg active:scale-[0.99]"
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Menyimpan Data...
                </span>
              ) : (
                "Simpan Data Pendaftaran"
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}