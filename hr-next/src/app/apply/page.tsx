"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner"; // Pastikan Anda sudah menginstall sonner

type JobPosition = { id: string; title: string; available: boolean; };

export default function ManualRegistrationPage() {
  const [submissionType, setSubmissionType] = useState<"candidate" | "employee">("candidate");
  const [isLoading, setIsLoading] = useState(false);
  const [jobs, setJobs] = useState<JobPosition[]>([]);
  
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

  // State Form Utama yang mendukung Array
  const [form, setForm] = useState({
    job_id: "",
    fullName: "", email: "", whatsapp: "", gender: "", birthDate: "", 
    domicileProvince: "", domicileCity: "", totalExperience: "",
    degree: "", major: "", studyProgram: "", university: "", eduCity: "", 
    gpa: "", startYear: "", gradYear: "",
    expectedSalary: "", noticePeriod: "<1 Bulan",
    
    // Arrays
    trainings: [] as any[],
    organizations: [] as any[],
    workExperiences: [] as any[],
  });

  useEffect(() => {
    fetch(`${API_BASE_URL}/job-positions?available=true`)
      .then((res) => res.json())
      .then((data) => setJobs(data))
      .catch((err) => console.error(err));
  }, [API_BASE_URL]);

  const handleTextChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Helper Array Dynamics
  const addArrayItem = (key: 'trainings' | 'organizations' | 'workExperiences', template: any) => {
    if (form[key].length < 3) {
      setForm({ ...form, [key]: [...form[key], template] });
    } else {
      toast.error("Maksimal 3 data yang dapat ditambahkan.");
    }
  };

  const removeArrayItem = (key: 'trainings' | 'organizations' | 'workExperiences', index: number) => {
    const newArr = [...form[key]];
    newArr.splice(index, 1);
    setForm({ ...form, [key]: newArr });
  };

  const updateArrayItem = (key: 'trainings' | 'organizations' | 'workExperiences', index: number, field: string, value: any) => {
    const newArr = [...form[key]];
    newArr[index] = { ...newArr[index], [field]: value };
    setForm({ ...form, [key]: newArr });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const apiUrl = submissionType === "candidate" ? `${API_BASE_URL}/candidates` : `${API_BASE_URL}/karyawan`;

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Gagal menyimpan data");
      
      toast.success(`Data ${submissionType === "candidate" ? "Kandidat" : "Karyawan"} berhasil disubmit!`);
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = "w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm";

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-2xl p-6 md:p-8">
        
        <div className="mb-8 border-b pb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Formulir Pendaftaran</h1>
          <p className="text-gray-500">Silakan lengkapi data profil, pendidikan, dan pengalaman Anda.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Posisi & Tipe */}
          <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
             <div className="grid md:grid-cols-2 gap-4">
               <div>
                  <label className="block font-semibold mb-2">Tipe Pelamar</label>
                  <select value={submissionType} onChange={(e) => setSubmissionType(e.target.value as any)} className={inputClass}>
                    <option value="candidate">Kandidat Baru (Eksternal)</option>
                    <option value="employee">Karyawan Internal</option>
                  </select>
               </div>
               <div>
                  <label className="block font-semibold mb-2">Posisi yang Dilamar *</label>
                  <select name="job_id" required value={form.job_id} onChange={handleTextChange} className={inputClass}>
                    <option value="">-- Pilih Lowongan --</option>
                    {jobs.map((job) => (<option key={job.id} value={job.id}>{job.title}</option>))}
                  </select>
               </div>
             </div>
          </div>

          {/* 1. BIODATA */}
          <div>
            <h2 className="text-xl font-bold mb-4 text-gray-700 border-b pb-2">1. Biodata</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input name="fullName" placeholder="Nama Lengkap *" required className={inputClass} onChange={handleTextChange} />
              <input name="email" type="email" placeholder="Email Aktif *" required className={inputClass} onChange={handleTextChange} />
              <input name="whatsapp" placeholder="Nomor WhatsApp *" required className={inputClass} onChange={handleTextChange} />
              <select name="gender" required className={inputClass} onChange={handleTextChange}>
                <option value="">-- Jenis Kelamin -- *</option>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
              <input name="domicileProvince" placeholder="Provinsi Domisili *" required className={inputClass} onChange={handleTextChange} />
              <input name="domicileCity" placeholder="Kota Domisili *" required className={inputClass} onChange={handleTextChange} />
              <input type="date" name="birthDate" required className={inputClass} onChange={handleTextChange} />
              <input name="totalExperience" placeholder="Total Pengalaman (Misal: 2 Tahun 5 Bulan) *" required className={inputClass} onChange={handleTextChange} />
            </div>
          </div>

          {/* 2. PENDIDIKAN */}
          <div>
            <h2 className="text-xl font-bold mb-4 text-gray-700 border-b pb-2">2. Pendidikan Terakhir</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select name="degree" required className={inputClass} onChange={handleTextChange}>
                <option value="">-- Gelar -- *</option>
                <option value="SMA">SMA/SMK</option>
                <option value="D3">D3</option>
                <option value="S1">S1 / Sarjana</option>
                <option value="S2">S2 / Magister</option>
              </select>
              <input name="major" placeholder="Jurusan *" required className={inputClass} onChange={handleTextChange} />
              <input name="university" placeholder="Nama Universitas *" required className={inputClass} onChange={handleTextChange} />
              <input name="gpa" placeholder="IPK (Misal: 3.5 dari 4) *" required className={inputClass} onChange={handleTextChange} />
              <input name="startYear" placeholder="Tahun Mulai" className={inputClass} onChange={handleTextChange} />
              <input name="gradYear" placeholder="Tahun Lulus" className={inputClass} onChange={handleTextChange} />
            </div>
          </div>

          {/* 3. PENGALAMAN KERJA (DINAMIS ARRAY) */}
          <div>
            <div className="flex justify-between items-center border-b pb-2 mb-4">
               <h2 className="text-xl font-bold text-gray-700">3. Riwayat Pekerjaan</h2>
               <button type="button" onClick={() => addArrayItem('workExperiences', { company: '', position: '', start: '', end: '', salary: '' })} 
                  className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded font-bold hover:bg-blue-200">
                  + Tambah Pengalaman (Maks 3)
               </button>
            </div>
            
            {form.workExperiences.length === 0 && <p className="text-sm text-gray-400 italic">Belum ada pengalaman ditambahkan (Fresh Graduate).</p>}
            
            <div className="space-y-4">
               {form.workExperiences.map((exp, idx) => (
                  <div key={idx} className="p-4 border border-gray-200 rounded-lg bg-gray-50 relative">
                     <button type="button" onClick={() => removeArrayItem('workExperiences', idx)} className="absolute top-2 right-2 text-red-500 hover:text-red-700 font-bold">X</button>
                     <div className="grid md:grid-cols-2 gap-3 mb-3 pr-6">
                        <input placeholder="Nama Perusahaan *" required className={inputClass} value={exp.company} onChange={(e) => updateArrayItem('workExperiences', idx, 'company', e.target.value)} />
                        <input placeholder="Jabatan / Posisi *" required className={inputClass} value={exp.position} onChange={(e) => updateArrayItem('workExperiences', idx, 'position', e.target.value)} />
                        <input placeholder="Mulai (Bulan Tahun) *" required className={inputClass} value={exp.start} onChange={(e) => updateArrayItem('workExperiences', idx, 'start', e.target.value)} />
                        <input placeholder="Berakhir (Bulan Tahun / Saat ini) *" required className={inputClass} value={exp.end} onChange={(e) => updateArrayItem('workExperiences', idx, 'end', e.target.value)} />
                        <input type="number" placeholder="Gaji Bersih (Rupiah) *" required className={inputClass} value={exp.salary} onChange={(e) => updateArrayItem('workExperiences', idx, 'salary', e.target.value)} />
                     </div>
                  </div>
               ))}
            </div>
          </div>

          {/* 4. EKSPEKTASI */}
          <div>
            <h2 className="text-xl font-bold mb-4 text-gray-700 border-b pb-2">4. Ekspektasi & Lainnya</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="number" name="expectedSalary" placeholder="Harapan Gaji (Rupiah) *" required className={inputClass} onChange={handleTextChange} />
              <select name="noticePeriod" required className={inputClass} onChange={handleTextChange}>
                <option value="<1 Bulan">&lt; 1 Bulan</option>
                <option value="1 Bulan">1 Bulan</option>
                <option value=">1 Bulan">&gt; 1 Bulan</option>
              </select>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-6 border-t">
            <button type="submit" disabled={isLoading} className="w-full text-white text-lg p-4 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 transition-all disabled:opacity-50">
              {isLoading ? "Memproses Data..." : "🚀 Kirim Pendaftaran"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}