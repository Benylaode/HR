"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Trash2, CheckCircle2, Loader2, Info } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

type JobPosition = { id: string; title: string; available: boolean };

export default function ManualRegistrationPage() {
  const [submissionType, setSubmissionType] = useState<"candidate" | "employee">("candidate");
  const [isLoading, setIsLoading] = useState(false);
  const [jobs, setJobs] = useState<JobPosition[]>([]);
  const [cvFile, setCvFile] = useState<File | null>(null);

  // === STATE UTAMA FORM ===
  const [form, setForm] = useState({
    job_id: "",
    
    // 1. Biodata
    fullName: "", email: "", whatsapp: "", gender: "", birthDate: "", 
    domicileProvince: "", domicileCity: "", totalExperience: "",
    
    // 2. Pendidikan
    degree: "", major: "", studyProgram: "", university: "", eduCity: "", 
    gpa: "", startYear: "", gradYear: "",
    
    // 3. Keahlian & Organisasi (Array Maks 3)
    trainings: [] as any[],
    organizations: [] as any[],
    
    // 4. Pengalaman & Minat Kerja (Array Maks 3)
    workExperiences: [] as any[],
    internships: [] as any[],
    appliedPosition1: "", appliedPosition2: "",
    expectedSalary: "", noticePeriod: "<1 Bulan",
    
    // 5. Lain-Lain
    references: [] as any[],
    relatives: [] as any[],
    socialMedia: { instagram: "", linkedin: "", twitter: "", facebook: "", tiktok: "" },
  });

  // Fetch Lowongan Pekerjaan saat halaman dimuat
  useEffect(() => {
    fetch(`${API_BASE_URL}/job-positions?available=true`)
      .then((res) => res.json())
      .then((data) => setJobs(data))
      .catch((err) => console.error(err));
  }, []);

  // === HANDLERS ===
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSocialMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, socialMedia: { ...form.socialMedia, [e.target.name]: e.target.value } });
  };

  const addArrayItem = (key: 'trainings' | 'organizations' | 'workExperiences' | 'internships' | 'references' | 'relatives', template: any) => {
    if (form[key].length < 3) {
      setForm({ ...form, [key]: [...form[key], template] });
    } else {
      toast.error(`Maksimal 3 data untuk bagian ini.`);
    }
  };

  const removeArrayItem = (key: string, index: number) => {
    const newArr = [...(form as any)[key]];
    newArr.splice(index, 1);
    setForm({ ...form, [key]: newArr });
  };

  const updateArrayItem = (key: string, index: number, field: string, value: any) => {
    const newArr = [...(form as any)[key]];
    newArr[index] = { ...newArr[index], [field]: value };
    setForm({ ...form, [key]: newArr });
  };

  // ✅ SOLUSI KRITIS: Menggunakan FormData untuk mengirim JSON + File CV fisik
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submissionType === "candidate" && !form.job_id) {
      return toast.error("Silakan pilih posisi yang dilamar terlebih dahulu.");
    }
    if (submissionType === "candidate" && !cvFile) {
      return toast.error("File CV wajib diunggah.");
    }

    setIsLoading(true);
    const apiUrl = submissionType === "candidate" ? `${API_BASE_URL}/candidates` : `${API_BASE_URL}/karyawan`;

    try {
      const formDataToSend = new FormData();
      
      // 1. Append File CV Fisik
      if (cvFile) {
        formDataToSend.append("cv_file", cvFile);
      }
      
      // 2. Append data Form sebagai JSON String
      formDataToSend.append("data", JSON.stringify(form));

      const response = await fetch(apiUrl, {
        method: "POST",
        // HAPUS headers Content-Type agar browser set boundary multipart/form-data otomatis
        body: formDataToSend,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Gagal menyimpan data");
      
      toast.success(`Data ${submissionType === "candidate" ? "Kandidat" : "Karyawan"} berhasil dikirim!`);
      window.scrollTo({ top: 0, behavior: "smooth" });
      
    } catch (error: any) {
      toast.error(`Gagal mengirim: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = "w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-all bg-white";
  const labelClass = "block text-sm font-semibold text-gray-700 mb-1.5";
  const sectionHeaderClass = "text-xl font-bold mb-4 text-gray-800 border-b pb-3 flex items-center gap-2";

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto bg-white shadow-2xl rounded-3xl overflow-hidden border border-slate-100">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white">
          <h1 className="text-3xl font-bold mb-2">Formulir Pendaftaran Rekrutmen</h1>
          <p className="text-blue-100 text-sm">PT Sulawesi Cahaya Mineral - Harap lengkapi data profil, pendidikan, dan pengalaman Anda dengan sebenar-benarnya.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-10">
          
          {/* TIPE PELAMAR & POSISI */}
          <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 shadow-sm">
             <div className="grid md:grid-cols-2 gap-6">
               <div>
                  <label className={labelClass}>Tipe Pendaftaran *</label>
                  <select value={submissionType} onChange={(e) => setSubmissionType(e.target.value as any)} className={inputClass}>
                    <option value="candidate">Kandidat Baru (Pelamar Eksternal)</option>
                    <option value="employee">Karyawan Internal / Mutasi</option>
                  </select>
               </div>
               <div>
                  <label className={labelClass}>Posisi Utama yang Dilamar *</label>
                  <select name="job_id" required value={form.job_id} onChange={handleTextChange} className={`${inputClass} font-semibold text-blue-700 border-blue-300`}>
                    <option value="">-- Pilih Lowongan Tersedia --</option>
                    {jobs.map((job) => (<option key={job.id} value={job.id}>{job.title}</option>))}
                  </select>
               </div>
             </div>
          </div>

          {/* 1. BIODATA */}
          <section>
            <h2 className={sectionHeaderClass}><span className="bg-blue-100 text-blue-700 w-8 h-8 rounded-full flex items-center justify-center text-sm mr-2">1</span> Biodata Diri</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2"><label className={labelClass}>Nama Lengkap Sesuai KTP *</label><input name="fullName" required className={inputClass} onChange={handleTextChange} /></div>
              <div><label className={labelClass}>Email Aktif *</label><input type="email" name="email" required className={inputClass} onChange={handleTextChange} /></div>
              <div><label className={labelClass}>Jenis Kelamin *</label><select name="gender" required className={inputClass} onChange={handleTextChange}><option value="">Pilih</option><option value="Laki-laki">Laki-laki</option><option value="Perempuan">Perempuan</option></select></div>
              <div><label className={labelClass}>Nomor HP / WhatsApp *</label><input name="whatsapp" required className={inputClass} onChange={handleTextChange} /></div>
              <div><label className={labelClass}>Tanggal Lahir *</label><input type="date" name="birthDate" required className={inputClass} onChange={handleTextChange} /></div>
              <div><label className={labelClass}>Provinsi Domisili (KTP) *</label><input name="domicileProvince" required className={inputClass} onChange={handleTextChange} /></div>
              <div><label className={labelClass}>Kota/Kabupaten Domisili *</label><input name="domicileCity" required className={inputClass} onChange={handleTextChange} /></div>
              <div><label className={labelClass}>Total Pengalaman Kerja *</label><input name="totalExperience" placeholder="Cth: 2 Tahun 5 Bulan" required className={inputClass} onChange={handleTextChange} /></div>
              
              <div className="lg:col-span-3">
                <label className={labelClass}>Upload Curriculum Vitae (CV) *</label>
                <input type="file" accept=".pdf" required onChange={(e) => setCvFile(e.target.files ? e.target.files[0] : null)} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-gray-300 rounded-xl" />
                <p className="text-xs text-gray-400 mt-1">Format PDF, Maksimal 5MB.</p>
              </div>
            </div>
          </section>

          {/* 2. PENDIDIKAN */}
          <section>
            <h2 className={sectionHeaderClass}><span className="bg-blue-100 text-blue-700 w-8 h-8 rounded-full flex items-center justify-center text-sm mr-2">2</span> Pendidikan</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div><label className={labelClass}>Gelar Pendidikan *</label><select name="degree" required className={inputClass} onChange={handleTextChange}><option value="">Pilih Gelar</option><option value="SMA/SMK">SMA / SMK / Sederajat</option><option value="D1/D2/D3">D1 / D2 / D3</option><option value="D4/S1">D4 / S1 Sarjana</option><option value="S2/S3">S2 Magister / S3 Doktoral</option></select></div>
              <div><label className={labelClass}>Jurusan *</label><input name="major" required className={inputClass} onChange={handleTextChange} /></div>
              <div><label className={labelClass}>Program Studi *</label><input name="studyProgram" required className={inputClass} onChange={handleTextChange} /></div>
              <div className="md:col-span-2"><label className={labelClass}>Nama Institusi / Universitas *</label><input name="university" required className={inputClass} onChange={handleTextChange} /></div>
              <div><label className={labelClass}>Kota Institusi *</label><input name="eduCity" required className={inputClass} onChange={handleTextChange} /></div>
              <div><label className={labelClass}>IPK / Nilai Akhir *</label><input name="gpa" placeholder="Cth: 3.50 dari 4.00" required className={inputClass} onChange={handleTextChange} /></div>
              <div><label className={labelClass}>Tahun Mulai *</label><input type="number" name="startYear" required className={inputClass} onChange={handleTextChange} /></div>
              <div><label className={labelClass}>Tahun Lulus *</label><input type="number" name="gradYear" required className={inputClass} onChange={handleTextChange} /></div>
            </div>
          </section>

          {/* 3. KEAHLIAN & ORGANISASI */}
          <section>
            <h2 className={sectionHeaderClass}><span className="bg-blue-100 text-blue-700 w-8 h-8 rounded-full flex items-center justify-center text-sm mr-2">3</span> Keahlian & Organisasi (Opsional)</h2>
            
            {/* Pelatihan */}
            <div className="mb-8 border border-gray-200 rounded-2xl p-5 bg-gray-50/50">
               <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="font-bold text-gray-800">Riwayat Pelatihan / Sertifikasi</h3>
                    <p className="text-xs text-gray-500">Maksimal 3 sertifikasi, bootcamp, atau seminar relevan.</p>
                  </div>
                  <button type="button" onClick={() => addArrayItem('trainings', { name: '', organizer: '', year: '', note: '' })} className="flex items-center gap-1 text-sm bg-white border border-blue-200 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-50 font-semibold transition-colors"><Plus size={16}/> Tambah</button>
               </div>
               {form.trainings.length === 0 && <p className="text-sm text-center py-4 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">Belum ada pelatihan ditambahkan.</p>}
               <div className="space-y-4">
                 {form.trainings.map((item, i) => (
                    <div key={i} className="p-4 bg-white border border-gray-200 rounded-xl relative">
                       <button type="button" onClick={() => removeArrayItem('trainings', i)} className="absolute top-3 right-3 text-red-400 hover:text-red-600 p-1 bg-red-50 rounded-md"><Trash2 size={16}/></button>
                       <div className="grid md:grid-cols-3 gap-3 pr-8">
                          <div><label className="text-xs font-semibold text-gray-500">Nama Program *</label><input required className={inputClass} value={item.name} onChange={e => updateArrayItem('trainings', i, 'name', e.target.value)} /></div>
                          <div><label className="text-xs font-semibold text-gray-500">Penyelenggara *</label><input required className={inputClass} value={item.organizer} onChange={e => updateArrayItem('trainings', i, 'organizer', e.target.value)} /></div>
                          <div><label className="text-xs font-semibold text-gray-500">Tahun *</label><input required className={inputClass} value={item.year} onChange={e => updateArrayItem('trainings', i, 'year', e.target.value)} /></div>
                          <div className="md:col-span-3"><label className="text-xs font-semibold text-gray-500">Keterangan *</label><input required className={inputClass} value={item.note} onChange={e => updateArrayItem('trainings', i, 'note', e.target.value)} /></div>
                       </div>
                    </div>
                 ))}
               </div>
            </div>

            {/* Organisasi */}
            <div className="border border-gray-200 rounded-2xl p-5 bg-gray-50/50">
               <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="font-bold text-gray-800">Riwayat Organisasi</h3>
                    <p className="text-xs text-gray-500">Aktif dalam 3 tahun terakhir. Maksimal 3 data.</p>
                  </div>
                  <button type="button" onClick={() => addArrayItem('organizations', { name: '', scope: '', start: '', end: '', position: '' })} className="flex items-center gap-1 text-sm bg-white border border-blue-200 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-50 font-semibold transition-colors"><Plus size={16}/> Tambah</button>
               </div>
               {form.organizations.length === 0 && <p className="text-sm text-center py-4 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">Belum ada organisasi ditambahkan.</p>}
               <div className="space-y-4">
                 {form.organizations.map((item, i) => (
                    <div key={i} className="p-4 bg-white border border-gray-200 rounded-xl relative">
                       <button type="button" onClick={() => removeArrayItem('organizations', i)} className="absolute top-3 right-3 text-red-400 hover:text-red-600 p-1 bg-red-50 rounded-md"><Trash2 size={16}/></button>
                       <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-3 pr-8">
                          <div className="lg:col-span-2"><label className="text-xs font-semibold text-gray-500">Nama Organisasi *</label><input required className={inputClass} value={item.name} onChange={e => updateArrayItem('organizations', i, 'name', e.target.value)} /></div>
                          <div><label className="text-xs font-semibold text-gray-500">Lingkup *</label><select required className={inputClass} value={item.scope} onChange={e => updateArrayItem('organizations', i, 'scope', e.target.value)}><option value="">Pilih</option><option value="Universitas">Universitas</option><option value="Nasional">Nasional</option><option value="Internasional">Internasional</option></select></div>
                          <div><label className="text-xs font-semibold text-gray-500">Mulai Pada *</label><input type="month" required className={inputClass} value={item.start} onChange={e => updateArrayItem('organizations', i, 'start', e.target.value)} /></div>
                          <div><label className="text-xs font-semibold text-gray-500">Berakhir Pada</label><input type="month" className={inputClass} value={item.end} onChange={e => updateArrayItem('organizations', i, 'end', e.target.value)} /></div>
                          <div className="lg:col-span-5"><label className="text-xs font-semibold text-gray-500">Jabatan *</label><select required className={inputClass} value={item.position} onChange={e => updateArrayItem('organizations', i, 'position', e.target.value)}><option value="">Pilih</option><option value="Anggota">Anggota</option><option value="Koordinator">Koordinator Divisi</option><option value="Ketua">Ketua / Inti</option></select></div>
                       </div>
                    </div>
                 ))}
               </div>
            </div>
          </section>

          {/* 4. PENGALAMAN KERJA */}
          <section>
            <h2 className={sectionHeaderClass}><span className="bg-blue-100 text-blue-700 w-8 h-8 rounded-full flex items-center justify-center text-sm mr-2">4</span> Pengalaman & Minat Kerja</h2>
            
            {/* Pengalaman Kerja Utama */}
            <div className="mb-8">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-800">Riwayat Pekerjaan * <span className="text-sm font-normal text-gray-500">(Maks 3 Perusahaan Terakhir)</span></h3>
                  <button type="button" onClick={() => addArrayItem('workExperiences', { position: '', level: '', company: '', industry: '', start: '', end: '', status: '', salary: '', reason: '', desc: '' })} className="flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 font-semibold transition-colors shadow-sm"><Plus size={16}/> Tambah Pekerjaan</button>
               </div>
               {form.workExperiences.length === 0 && <div className="text-sm text-center py-6 text-amber-600 bg-amber-50 rounded-xl border border-amber-200 font-medium flex flex-col items-center justify-center gap-2"><Info size={24}/> Anda wajib mengisi minimal 1 riwayat pekerjaan (Kosongkan jika Fresh Graduate).</div>}
               <div className="space-y-5">
                 {form.workExperiences.map((item, i) => (
                    <div key={i} className="p-5 bg-white border-2 border-slate-100 shadow-sm rounded-2xl relative">
                       <button type="button" onClick={() => removeArrayItem('workExperiences', i)} className="absolute top-4 right-4 text-red-500 hover:text-red-700 font-bold bg-red-50 p-2 rounded-lg transition-colors flex items-center gap-1 text-xs"><Trash2 size={14}/> Hapus</button>
                       <div className="grid md:grid-cols-2 gap-4 mt-2 pr-20">
                          <div><label className={labelClass}>Nama Perusahaan *</label><input required className={inputClass} value={item.company} onChange={e => updateArrayItem('workExperiences', i, 'company', e.target.value)} /></div>
                          <div><label className={labelClass}>Industri Perusahaan *</label><input required className={inputClass} value={item.industry} onChange={e => updateArrayItem('workExperiences', i, 'industry', e.target.value)} /></div>
                          <div><label className={labelClass}>Posisi / Jabatan *</label><input required className={inputClass} value={item.position} onChange={e => updateArrayItem('workExperiences', i, 'position', e.target.value)} /></div>
                          <div><label className={labelClass}>Level Jabatan *</label><select required className={inputClass} value={item.level} onChange={e => updateArrayItem('workExperiences', i, 'level', e.target.value)}><option value="">Pilih Level</option><option value="Staff/Officer">Staff / Officer</option><option value="Supervisor/Coordinator">Supervisor / Coordinator</option><option value="Manager">Manager</option></select></div>
                          <div><label className={labelClass}>Bulan & Tahun Mulai *</label><input type="month" required className={inputClass} value={item.start} onChange={e => updateArrayItem('workExperiences', i, 'start', e.target.value)} /></div>
                          <div><label className={labelClass}>Bulan & Tahun Berakhir</label><input type="month" className={inputClass} value={item.end} onChange={e => updateArrayItem('workExperiences', i, 'end', e.target.value)} /> <span className="text-xs text-gray-400 mt-1 block">Kosongkan jika masih bekerja.</span></div>
                          <div><label className={labelClass}>Status Kekaryawanan *</label><select required className={inputClass} value={item.status} onChange={e => updateArrayItem('workExperiences', i, 'status', e.target.value)}><option value="">Pilih Status</option><option value="Tetap">Karyawan Tetap</option><option value="Kontrak">Kontrak (PKWT)</option><option value="Outsource">Outsource</option></select></div>
                          <div><label className={labelClass}>Gaji Bersih / Take Home Pay (Rp) *</label><input type="number" required className={inputClass} value={item.salary} onChange={e => updateArrayItem('workExperiences', i, 'salary', e.target.value)} /></div>
                       </div>
                       <div className="mt-4 grid md:grid-cols-2 gap-4">
                          <div><label className={labelClass}>Alasan Mengundurkan Diri *</label><input required className={inputClass} value={item.reason} onChange={e => updateArrayItem('workExperiences', i, 'reason', e.target.value)} /></div>
                          <div><label className={labelClass}>Deskripsi Pekerjaan (Singkat) *</label><textarea required rows={2} className={inputClass} value={item.desc} onChange={e => updateArrayItem('workExperiences', i, 'desc', e.target.value)} /></div>
                       </div>
                    </div>
                 ))}
               </div>
            </div>

            {/* ✅ TAMBAHAN: Riwayat Magang */}
            <div className="mb-8">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-800">Riwayat Magang (Opsional) <span className="text-sm font-normal text-gray-500">(Maks 3)</span></h3>
                  <button type="button" onClick={() => addArrayItem('internships', { company: '', position: '', start: '', end: '', desc: '' })} className="flex items-center gap-1 text-sm bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-200 font-semibold transition-colors"><Plus size={16}/> Tambah Magang</button>
               </div>
               {form.internships.length === 0 && <p className="text-sm text-center py-4 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">Belum ada magang ditambahkan.</p>}
               <div className="space-y-4">
                 {form.internships.map((item, i) => (
                    <div key={i} className="p-4 bg-white border border-gray-200 rounded-xl relative">
                       <button type="button" onClick={() => removeArrayItem('internships', i)} className="absolute top-3 right-3 text-red-400 hover:text-red-600 p-1 bg-red-50 rounded-md"><Trash2 size={16}/></button>
                       <div className="grid md:grid-cols-2 gap-3 pr-8">
                          <div><label className="text-xs font-semibold text-gray-500">Nama Perusahaan / Instansi *</label><input required className={inputClass} value={item.company} onChange={e => updateArrayItem('internships', i, 'company', e.target.value)} /></div>
                          <div><label className="text-xs font-semibold text-gray-500">Posisi / Departemen *</label><input required className={inputClass} value={item.position} onChange={e => updateArrayItem('internships', i, 'position', e.target.value)} /></div>
                          <div><label className="text-xs font-semibold text-gray-500">Mulai (Bulan/Tahun) *</label><input type="month" required className={inputClass} value={item.start} onChange={e => updateArrayItem('internships', i, 'start', e.target.value)} /></div>
                          <div><label className="text-xs font-semibold text-gray-500">Berakhir (Bulan/Tahun) *</label><input type="month" required className={inputClass} value={item.end} onChange={e => updateArrayItem('internships', i, 'end', e.target.value)} /></div>
                          <div className="md:col-span-2"><label className="text-xs font-semibold text-gray-500">Deskripsi Tugas Singkat *</label><input required className={inputClass} value={item.desc} onChange={e => updateArrayItem('internships', i, 'desc', e.target.value)} /></div>
                       </div>
                    </div>
                 ))}
               </div>
            </div>

            {/* Minat Kerja */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6">
               <h3 className="font-bold text-indigo-900 mb-4 border-b border-indigo-200 pb-2">Minat & Ekspektasi Kerja</h3>
               <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>Alternatif Posisi Dilamar 1 *</label>
                    <input name="appliedPosition1" required placeholder="Cth: QA Engineer" className={inputClass} onChange={handleTextChange} />
                  </div>
                  <div>
                    <label className={labelClass}>Alternatif Posisi Dilamar 2 *</label>
                    <input name="appliedPosition2" required placeholder="Cth: System Analyst" className={inputClass} onChange={handleTextChange} />
                  </div>
                  <div>
                    <label className={labelClass}>Ketersediaan Bekerja (Notice Period) *</label>
                    <select name="noticePeriod" required className={inputClass} onChange={handleTextChange}>
                      <option value="<1 Bulan">Segera / &lt; 1 Bulan</option>
                      <option value="1 Bulan">1 Bulan</option>
                      <option value=">1 Bulan">&gt; 1 Bulan</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Harapan Gaji Bulanan (Rp) *</label>
                    <input type="number" name="expectedSalary" required placeholder="Cth: 10000000" className={inputClass} onChange={handleTextChange} />
                  </div>
               </div>
            </div>
          </section>

          {/* 5. LAIN-LAIN */}
          <section>
            <h2 className={sectionHeaderClass}><span className="bg-blue-100 text-blue-700 w-8 h-8 rounded-full flex items-center justify-center text-sm mr-2">5</span> Informasi Lain-Lain</h2>
            
            {/* ✅ TAMBAHAN: Data Susunan Keluarga / Kerabat */}
            <div className="mb-6">
               <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-gray-700 text-sm">Susunan Keluarga / Kontak Darurat (Opsional)</h3>
                  <button type="button" onClick={() => addArrayItem('relatives', { name: '', relation: '', age: '', occupation: '' })} className="text-xs font-semibold text-blue-600 hover:text-blue-800">+ Tambah Kerabat</button>
               </div>
               <div className="space-y-3">
                 {form.relatives.map((item, i) => (
                    <div key={i} className="flex gap-3 bg-white p-3 border border-gray-200 rounded-xl items-end">
                       <div className="flex-1 grid grid-cols-4 gap-2">
                          <input placeholder="Nama Lengkap" className="col-span-1 border rounded px-2 py-1.5 text-xs outline-none focus:border-blue-400" value={item.name} onChange={e => updateArrayItem('relatives', i, 'name', e.target.value)} />
                          <select className="col-span-1 border rounded px-2 py-1.5 text-xs outline-none focus:border-blue-400" value={item.relation} onChange={e => updateArrayItem('relatives', i, 'relation', e.target.value)}><option value="">Hubungan</option><option value="Ayah">Ayah</option><option value="Ibu">Ibu</option><option value="Saudara">Saudara</option><option value="Pasangan">Pasangan</option></select>
                          <input placeholder="Usia" type="number" className="col-span-1 border rounded px-2 py-1.5 text-xs outline-none focus:border-blue-400" value={item.age} onChange={e => updateArrayItem('relatives', i, 'age', e.target.value)} />
                          <input placeholder="Pekerjaan / Instansi" className="col-span-1 border rounded px-2 py-1.5 text-xs outline-none focus:border-blue-400" value={item.occupation} onChange={e => updateArrayItem('relatives', i, 'occupation', e.target.value)} />
                       </div>
                       <button type="button" onClick={() => removeArrayItem('relatives', i)} className="text-red-400 hover:text-red-600 mb-1"><Trash2 size={16}/></button>
                    </div>
                 ))}
               </div>
            </div>

            {/* Referensi */}
            <div className="mb-6">
               <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-gray-700 text-sm">Kontak Referensi Profesional (Opsional)</h3>
                  <button type="button" onClick={() => addArrayItem('references', { name: '', phone: '', company: '', position: '', relation: '' })} className="text-xs font-semibold text-blue-600 hover:text-blue-800">+ Tambah Referensi</button>
               </div>
               <div className="space-y-3">
                 {form.references.map((item, i) => (
                    <div key={i} className="flex gap-3 bg-white p-3 border border-gray-200 rounded-xl items-end">
                       <div className="flex-1 grid grid-cols-5 gap-2">
                          <input placeholder="Nama Lengkap" className="col-span-1 border rounded px-2 py-1.5 text-xs outline-none focus:border-blue-400" value={item.name} onChange={e => updateArrayItem('references', i, 'name', e.target.value)} />
                          <input placeholder="No HP" className="col-span-1 border rounded px-2 py-1.5 text-xs outline-none focus:border-blue-400" value={item.phone} onChange={e => updateArrayItem('references', i, 'phone', e.target.value)} />
                          <input placeholder="Perusahaan" className="col-span-1 border rounded px-2 py-1.5 text-xs outline-none focus:border-blue-400" value={item.company} onChange={e => updateArrayItem('references', i, 'company', e.target.value)} />
                          <input placeholder="Jabatan" className="col-span-1 border rounded px-2 py-1.5 text-xs outline-none focus:border-blue-400" value={item.position} onChange={e => updateArrayItem('references', i, 'position', e.target.value)} />
                          <select className="col-span-1 border rounded px-2 py-1.5 text-xs outline-none focus:border-blue-400" value={item.relation} onChange={e => updateArrayItem('references', i, 'relation', e.target.value)}><option value="">Relasi</option><option value="Atasan">Atasan</option><option value="Rekan Kerja">Rekan Kerja</option></select>
                       </div>
                       <button type="button" onClick={() => removeArrayItem('references', i)} className="text-red-400 hover:text-red-600 mb-1"><Trash2 size={16}/></button>
                    </div>
                 ))}
               </div>
            </div>

            {/* Media Sosial */}
            <div className="bg-gray-50 border border-gray-200 p-5 rounded-2xl">
               <h3 className="font-bold text-gray-700 mb-4">Tautan Media Sosial (Opsional)</h3>
               <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center"><span className="bg-white border border-r-0 border-gray-300 rounded-l-xl px-3 py-3 text-sm text-gray-500 font-medium">LinkedIn</span><input name="linkedin" placeholder="URL Profil" className="flex-1 border border-gray-300 rounded-r-xl p-3 outline-none focus:border-blue-500 text-sm" onChange={handleSocialMediaChange} /></div>
                  <div className="flex items-center"><span className="bg-white border border-r-0 border-gray-300 rounded-l-xl px-3 py-3 text-sm text-gray-500 font-medium">Instagram</span><input name="instagram" placeholder="Username" className="flex-1 border border-gray-300 rounded-r-xl p-3 outline-none focus:border-blue-500 text-sm" onChange={handleSocialMediaChange} /></div>
                  <div className="flex items-center"><span className="bg-white border border-r-0 border-gray-300 rounded-l-xl px-3 py-3 text-sm text-gray-500 font-medium">TikTok</span><input name="tiktok" placeholder="Username" className="flex-1 border border-gray-300 rounded-r-xl p-3 outline-none focus:border-blue-500 text-sm" onChange={handleSocialMediaChange} /></div>
                  <div className="flex items-center"><span className="bg-white border border-r-0 border-gray-300 rounded-l-xl px-3 py-3 text-sm text-gray-500 font-medium">Facebook</span><input name="facebook" placeholder="URL Profil" className="flex-1 border border-gray-300 rounded-r-xl p-3 outline-none focus:border-blue-500 text-sm" onChange={handleSocialMediaChange} /></div>
               </div>
            </div>
          </section>

          {/* SUBMIT AREA */}
          <div className="pt-8 mt-8 border-t border-gray-200">
             <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm mb-6 flex items-start gap-3 border border-blue-100">
                <CheckCircle2 className="shrink-0 mt-0.5" size={18} />
                <p>Dengan menekan tombol submit, saya menyatakan bahwa seluruh data yang saya isikan dalam formulir ini adalah benar, akurat, dan dapat dipertanggungjawabkan.</p>
             </div>
             <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-lg p-5 rounded-2xl shadow-xl shadow-blue-600/20 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                {isLoading ? <><Loader2 className="animate-spin" size={24}/> Memproses Data...</> : "Kirim Formulir Pendaftaran"}
             </button>
          </div>

        </form>
      </div>
    </div>
  );
}