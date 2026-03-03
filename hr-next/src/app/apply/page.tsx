"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  Plus, Trash2, CheckCircle2, Loader2, Info, UserCircle, 
  GraduationCap, Award, Briefcase, Heart, Share2, MapPin 
} from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

type JobPosition = { id: string; title: string; available: boolean };

export default function ManualRegistrationPage() {
  const [submissionType, setSubmissionType] = useState<"candidate" | "employee">("candidate");
  const [isLoading, setIsLoading] = useState(false);
  const [jobs, setJobs] = useState<JobPosition[]>([]);
  const [cvFile, setCvFile] = useState<File | null>(null);

  // === STATE LENGKAP (SINKRON DENGAN PROFILEMIXIN & JSONB FIELDS) ===
  const [form, setForm] = useState({
    job_id: "",
    
    // 1. Biodata Utama (ProfileMixin)
    fullName: "", 
    email: "", 
    whatsapp: "", 
    gender: "", 
    religion: "",
    birthPlace: "",
    birthDate: "", 
    driverLicense: "",
    address: "",
    domicileProvince: "", 
    domicileCity: "", 
    totalExperience: "",
    
    // 2. Pendidikan Utama
    degree: "", 
    major: "", 
    studyProgram: "",
    university: "", 
    eduCity: "",
    gpa: "", 
    startYear: "",
    gradYear: "",
    
    // 3. Keahlian & Organisasi (Array JSONB)
    trainings: [] as any[],
    organizations: [] as any[],
    
    // 4. Pengalaman & Minat Kerja
    workExperiences: [] as any[],
    internships: [] as any[],
    appliedPosition1: "", 
    appliedPosition2: "",
    expectedSalary: "", 
    noticePeriod: "<1 Bulan",
    
    // 5. Informasi Kontak & Sosial (JSONB)
    references: [] as any[],
    relatives: [] as any[],
    socialMedia: { instagram: "", linkedin: "", twitter: "", facebook: "", tiktok: "" },
  });

  // Fetch Lowongan Pekerjaan
  useEffect(() => {
    fetch(`${API_BASE_URL}/job-positions?available=true`)
      .then((res) => res.json())
      .then((data) => setJobs(data))
      .catch((err) => console.error(err));
  }, []);

  // === HELPERS UNTUK FORM ===
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
      toast.error(`Maksimal 3 data untuk seksi ini.`);
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

  // === SUBMIT LOGIC ===
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submissionType === "candidate" && !form.job_id) return toast.error("Silakan pilih posisi lowongan.");
    if (submissionType === "candidate" && !cvFile) return toast.error("File CV wajib diunggah.");

    setIsLoading(true);
    const apiUrl = submissionType === "candidate" ? `${API_BASE_URL}/candidates` : `${API_BASE_URL}/employees`;

    try {
      // ✅ LOGIKA MAPPING: Mengubah key FE agar pas dengan kolom Backend (ProfileMixin)
      const mappedData = {
        ...form,
        province: form.domicileProvince,
        city: form.domicileCity,
        total_experience_years: form.totalExperience,
        education: form.degree,
        position_applied: form.appliedPosition1,
        birth_place: form.birthPlace,
        driver_license: form.driverLicense,
        // Mapping pekerjaan terakhir untuk kolom statis mixin
        last_company: form.workExperiences[0]?.company || "",
        last_position: form.workExperiences[0]?.position || "",
        last_position_level: form.workExperiences[0]?.level || "",
        last_company_field: form.workExperiences[0]?.industry || "",
        experience_description: form.workExperiences[0]?.desc || "",
      };

      // --- PERBAIKAN: BEDAKAN CARA KIRIM DATA KANDIDAT VS KARYAWAN ---
      let fetchOptions: RequestInit = {
        method: "POST",
      };

      if (submissionType === "candidate") {
        // Jika Kandidat, kirim pakai FormData karena ada file CV
        const formDataToSend = new FormData();
        if (cvFile) formDataToSend.append("cv_file", cvFile);
        formDataToSend.append("data", JSON.stringify(mappedData));
        fetchOptions.body = formDataToSend;
      } else {
        // Jika Karyawan, kirim pakai Raw JSON karena di backend memakai request.get_json()
        fetchOptions.headers = {
          "Content-Type": "application/json"
        };
        fetchOptions.body = JSON.stringify(mappedData);
      }
      // ---------------------------------------------------------------

      const response = await fetch(apiUrl, fetchOptions);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Pendaftaran gagal");
      
      toast.success(`Data ${submissionType === "candidate" ? "Kandidat" : "Karyawan"} berhasil terdaftar!`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = "w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all bg-white";
  const labelClass = "block text-sm font-semibold text-gray-700 mb-1.5";
  const sectionHeaderClass = "text-xl font-bold mb-6 text-gray-800 border-b pb-3 flex items-center gap-2 mt-4";

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 font-sans text-slate-900">
      <div className="max-w-5xl mx-auto bg-white shadow-2xl rounded-3xl overflow-hidden border border-slate-100">
        
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 p-10 text-white text-center">
          <div className="flex justify-center mb-6 relative z-10">
            <img 
              src="/images/logos/MBM.png" 
              alt="Logo MBM" 
              className="h-20 md:h-24 object-contain drop-shadow-2xl bg-white/10 p-2 rounded-2xl backdrop-blur-sm border border-white/20"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/images/logos/MBMlogo.png";
              }}
            />
          </div>
          <h1 className="text-4xl font-extrabold mb-3">Formulir Curriculum Vitae</h1>
          <p className="text-blue-100 text-sm max-w-2xl mx-auto">Harap lengkapi seluruh data Anda untuk keperluan seleksi administrasi dan manajemen database SDM.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-12">
          
          {/* TIPE & LOWONGAN */}
          <div className="bg-blue-50/50 p-8 rounded-3xl border border-blue-100 shadow-sm grid md:grid-cols-2 gap-8">
            <div>
                <label className={labelClass}>Tipe Pendaftaran *</label>
                <select value={submissionType} onChange={(e) => setSubmissionType(e.target.value as any)} className={inputClass}>
                  <option value="candidate">Kandidat Baru (Pelamar Eksternal)</option>
                  <option value="employee">Karyawan (Data Internal / Mutasi)</option>
                </select>
            </div>
         
           {/* Jika Pelamar Eksternal, tampilkan lowongan aktif */}
           {submissionType === "candidate" ? (
             <div>
                <label className={labelClass}>Posisi Utama Yang Dilamar *</label>
                <select name="job_id" required value={form.job_id} onChange={handleTextChange} className={`${inputClass} font-bold text-blue-800 border-blue-200`}>
                  <option value="">-- Pilih Lowongan Tersedia --</option>
                  {jobs.map((job) => (<option key={job.id} value={job.id}>{job.title}</option>))}
                </select>
             </div>
            ) : (
              <div>
                  <label className={labelClass}>Posisi Anda Saat Ini *</label>
                  <input 
                    type="text" 
                    name="currentPosition" 
                    required 
                    placeholder="Cth: Staff IT / Supervisor HRD" 
                    className={inputClass} 
                    onChange={handleTextChange} 
                  />
              </div>
            )}
          </div>

          {/* 1. BIODATA PRIBADI */}
          <section>
            <h2 className={sectionHeaderClass}><UserCircle className="text-blue-600" /> 1. Biodata Pribadi</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2"><label className={labelClass}>Nama Lengkap (Sesuai KTP) *</label><input name="fullName" required className={inputClass} onChange={handleTextChange} /></div>
              <div><label className={labelClass}>Email Aktif *</label><input type="email" name="email" required className={inputClass} onChange={handleTextChange} /></div>
              
              <div><label className={labelClass}>Agama *</label>
                <select name="religion" required className={inputClass} onChange={handleTextChange}>
                  <option value="">Pilih Agama</option>
                  <option value="Islam">Islam</option><option value="Kristen">Kristen</option>
                  <option value="Katolik">Katolik</option><option value="Hindu">Hindu</option>
                  <option value="Budha">Budha</option><option value="Protestan">Protestan</option>
                </select>
              </div>
              <div><label className={labelClass}>Tempat Lahir *</label><input name="birthPlace" required className={inputClass} onChange={handleTextChange} /></div>
              <div><label className={labelClass}>Tanggal Lahir *</label><input type="date" name="birthDate" required className={inputClass} onChange={handleTextChange} /></div>
              
              <div><label className={labelClass}>Jenis Kelamin *</label><select name="gender" required className={inputClass} onChange={handleTextChange}><option value="">Pilih</option><option value="Laki-laki">Laki-laki</option><option value="Perempuan">Perempuan</option></select></div>
              <div><label className={labelClass}>No. HP / WhatsApp *</label><input name="whatsapp" required className={inputClass} onChange={handleTextChange} /></div>
              <div><label className={labelClass}>SIM (Cth: SIM A, SIM C)</label><input name="driverLicense" className={inputClass} onChange={handleTextChange} /></div>
              
              <div className="lg:col-span-3"><label className={labelClass}>Alamat Lengkap Sesuai KTP *</label><textarea name="address" required rows={2} className={inputClass} onChange={handleTextChange} placeholder="Jalan, RT/RW, Kelurahan, Kecamatan" /></div>
              
              <div><label className={labelClass}>Provinsi Domisili *</label><input name="domicileProvince" required className={inputClass} onChange={handleTextChange} /></div>
              <div><label className={labelClass}>Kota/Kabupaten *</label><input name="domicileCity" required className={inputClass} onChange={handleTextChange} /></div>
              <div><label className={labelClass}>Total Masa Kerja *</label><input name="totalExperience" placeholder="Cth: 2 Tahun 6 Bulan" required className={inputClass} onChange={handleTextChange} /></div>
              
              <div className="lg:col-span-3">
                <label className={labelClass}>Upload CV (Wajib format PDF) {submissionType === "candidate" ? "*" : ""}</label>
                <input type="file" accept=".pdf" required={submissionType === "candidate"} onChange={(e) => setCvFile(e.target.files ? e.target.files[0] : null)} className="block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:bg-blue-700 file:text-white cursor-pointer border border-gray-300 rounded-xl" />
              </div>
            </div>
          </section>

          {/* 2. RIWAYAT PENDIDIKAN */}
          <section>
            <h2 className={sectionHeaderClass}><GraduationCap className="text-blue-600" /> 2. Pendidikan Terakhir</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div><label className={labelClass}>Gelar Pendidikan *</label><select name="degree" required className={inputClass} onChange={handleTextChange}><option value="">Pilih</option><option value="SMA/SMK">SMA / SMK</option><option value="D3">Diploma 3 (D3)</option><option value="S1">Sarjana (S1)</option><option value="S2">Magister (S2)</option></select></div>
              <div><label className={labelClass}>Jurusan *</label><input name="major" required className={inputClass} onChange={handleTextChange} /></div>
              <div className="lg:col-span-2"><label className={labelClass}>Nama Institusi / Universitas *</label><input name="university" required className={inputClass} onChange={handleTextChange} /></div>
              <div><label className={labelClass}>IPK / Nilai Akhir *</label><input name="gpa" required className={inputClass} onChange={handleTextChange} /></div>
              <div><label className={labelClass}>Tahun Lulus *</label><input type="number" name="gradYear" required className={inputClass} onChange={handleTextChange} /></div>
            </div>
          </section>

          {/* 3. KEAHLIAN & ORGANISASI */}
          <section>
            <h2 className={sectionHeaderClass}><Award className="text-blue-600" /> 3. Keahlian & Organisasi</h2>
            <div className="space-y-8">
              {/* Pelatihan */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-800">Riwayat Pelatihan / Sertifikasi</h3>
                  <button type="button" onClick={() => addArrayItem('trainings', { name: '', organizer: '', year: '', note: '' })} className="bg-white border border-blue-200 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-50 text-xs font-bold flex items-center gap-1 transition-all shadow-sm"><Plus size={14}/> TAMBAH PELATIHAN</button>
                </div>
                {form.trainings.length === 0 && <p className="text-xs text-center text-slate-400 py-4">Belum ada data pelatihan yang ditambahkan.</p>}
                {form.trainings.map((item, i) => (
                  <div key={i} className="grid md:grid-cols-4 gap-3 mb-4 p-4 bg-white rounded-xl relative border border-slate-100 shadow-sm">
                    <button type="button" onClick={() => removeArrayItem('trainings', i)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"><Trash2 size={14}/></button>
                    <input placeholder="Nama Program" className={inputClass} value={item.name} onChange={e => updateArrayItem('trainings', i, 'name', e.target.value)} />
                    <input placeholder="Penyelenggara" className={inputClass} value={item.organizer} onChange={e => updateArrayItem('trainings', i, 'organizer', e.target.value)} />
                    <input placeholder="Tahun" className={inputClass} value={item.year} onChange={e => updateArrayItem('trainings', i, 'year', e.target.value)} />
                    <input placeholder="Keterangan" className={inputClass} value={item.note} onChange={e => updateArrayItem('trainings', i, 'note', e.target.value)} />
                  </div>
                ))}
              </div>

              {/* Organisasi */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-800">Pengalaman Organisasi</h3>
                  <button type="button" onClick={() => addArrayItem('organizations', { name: '', scope: '', start: '', end: '', position: '' })} className="bg-white border border-blue-200 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-50 text-xs font-bold flex items-center gap-1 transition-all shadow-sm"><Plus size={14}/> TAMBAH ORGANISASI</button>
                </div>
                {form.organizations.length === 0 && <p className="text-xs text-center text-slate-400 py-4">Belum ada data organisasi yang ditambahkan.</p>}
                {form.organizations.map((item, i) => (
                  <div key={i} className="grid md:grid-cols-5 gap-3 mb-4 p-4 bg-white rounded-xl relative border border-slate-100 shadow-sm">
                    <button type="button" onClick={() => removeArrayItem('organizations', i)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"><Trash2 size={14}/></button>
                    <input placeholder="Nama Organisasi" className={inputClass} value={item.name} onChange={e => updateArrayItem('organizations', i, 'name', e.target.value)} />
                    <select className={inputClass} value={item.scope} onChange={e => updateArrayItem('organizations', i, 'scope', e.target.value)}>
                      <option value="">Lingkup</option><option value="Nasional">Nasional</option><option value="Universitas">Universitas</option>
                    </select>
                    <input type="month" className={inputClass} value={item.start} onChange={e => updateArrayItem('organizations', i, 'start', e.target.value)} />
                    <input type="month" className={inputClass} value={item.end} onChange={e => updateArrayItem('organizations', i, 'end', e.target.value)} />
                    <input placeholder="Jabatan" className={inputClass} value={item.position} onChange={e => updateArrayItem('organizations', i, 'position', e.target.value)} />
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 4. PENGALAMAN KERJA & MAGANG */}
          <section>
            <h2 className={sectionHeaderClass}><Briefcase className="text-blue-600" /> 4. Riwayat Pekerjaan & Magang</h2>
            <div className="space-y-8">
              {/* Pekerjaan */}
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-800">Pengalaman Kerja *</h3>
                <button type="button" onClick={() => addArrayItem('workExperiences', { company: '', industry: '', position: '', level: '', start: '', end: '', salary: '', reason: '', desc: '' })} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 hover:bg-blue-700 transition-all"><Plus size={18}/> TAMBAH PEKERJAAN</button>
              </div>
              {form.workExperiences.length === 0 && <div className="text-center py-10 bg-amber-50 rounded-3xl border border-dashed border-amber-200 text-amber-700 text-sm"><Info className="mx-auto mb-2" /> Harap isi minimal 1 pekerjaan terakhir (Fresh Graduate silakan lewati).</div>}
              {form.workExperiences.map((item, i) => (
                <div key={i} className="p-8 bg-white border border-slate-200 rounded-[2rem] relative shadow-lg">
                   <button type="button" onClick={() => removeArrayItem('workExperiences', i)} className="absolute top-6 right-6 text-red-500 bg-red-50 p-2 rounded-xl hover:bg-red-100"><Trash2 size={20}/></button>
                   <div className="grid md:grid-cols-2 gap-6">
                     <div><label className={labelClass}>Nama Perusahaan *</label><input required className={inputClass} value={item.company} onChange={e => updateArrayItem('workExperiences', i, 'company', e.target.value)} /></div>
                     <div><label className={labelClass}>Industri Perusahaan *</label><input required className={inputClass} value={item.industry} onChange={e => updateArrayItem('workExperiences', i, 'industry', e.target.value)} /></div>
                     <div><label className={labelClass}>Posisi / Jabatan *</label><input required className={inputClass} value={item.position} onChange={e => updateArrayItem('workExperiences', i, 'position', e.target.value)} /></div>
                     <div><label className={labelClass}>Level Jabatan *</label><select required className={inputClass} value={item.level} onChange={e => updateArrayItem('workExperiences', i, 'level', e.target.value)}><option value="">Pilih</option><option value="Staff">Staff / Officer</option><option value="Supervisor">Supervisor</option><option value="Manager">Manager</option></select></div>
                     <div><label className={labelClass}>Bulan & Tahun Mulai *</label><input type="month" required className={inputClass} value={item.start} onChange={e => updateArrayItem('workExperiences', i, 'start', e.target.value)} /></div>
                     <div><label className={labelClass}>Bulan & Tahun Berhenti</label><input type="month" className={inputClass} value={item.end} onChange={e => updateArrayItem('workExperiences', i, 'end', e.target.value)} /></div>
                     <div><label className={labelClass}>Gaji Terakhir (Rp) *</label><input type="number" required className={inputClass} value={item.salary} onChange={e => updateArrayItem('workExperiences', i, 'salary', e.target.value)} /></div>
                     <div className="md:col-span-2"><label className={labelClass}>Alasan Berhenti *</label><input required className={inputClass} value={item.reason} onChange={e => updateArrayItem('workExperiences', i, 'reason', e.target.value)} /></div>
                     <div className="md:col-span-2"><label className={labelClass}>Deskripsi Pekerjaan *</label><textarea required rows={3} className={inputClass} value={item.desc} onChange={e => updateArrayItem('workExperiences', i, 'desc', e.target.value)} /></div>
                   </div>
                </div>
              ))}

              {/* Magang */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-800">Pengalaman Magang (Opsional)</h3>
                  <button type="button" onClick={() => addArrayItem('internships', { company: '', position: '', start: '', end: '', desc: '' })} className="bg-white border border-blue-200 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-50 text-xs font-bold flex items-center gap-1 shadow-sm"><Plus size={14}/> TAMBAH MAGANG</button>
                </div>
                {form.internships.map((item, i) => (
                  <div key={i} className="grid md:grid-cols-2 gap-3 mb-4 p-4 bg-white rounded-xl relative border border-slate-100 shadow-sm">
                    <button type="button" onClick={() => removeArrayItem('internships', i)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"><Trash2 size={14}/></button>
                    <input placeholder="Nama Instansi" className={inputClass} value={item.company} onChange={e => updateArrayItem('internships', i, 'company', e.target.value)} />
                    <input placeholder="Posisi" className={inputClass} value={item.position} onChange={e => updateArrayItem('internships', i, 'position', e.target.value)} />
                    <input type="month" className={inputClass} value={item.start} onChange={e => updateArrayItem('internships', i, 'start', e.target.value)} />
                    <input type="month" className={inputClass} value={item.end} onChange={e => updateArrayItem('internships', i, 'end', e.target.value)} />
                    <div className="md:col-span-2"><input placeholder="Deskripsi Singkat" className={inputClass} value={item.desc} onChange={e => updateArrayItem('internships', i, 'desc', e.target.value)} /></div>
                  </div>
                ))}
              </div>

              {/* Minat & Harapan */}
              <div className="bg-indigo-50/50 p-10 rounded-[2.5rem] border border-indigo-100">
                 <h3 className="font-bold text-indigo-900 mb-8 text-lg">Minat & Harapan Kerja</h3>
                 <div className="grid md:grid-cols-2 gap-8">
                   <div><label className={labelClass}>Alternatif Posisi Dilamar 1 *</label><input name="appliedPosition1" required className={inputClass} onChange={handleTextChange} placeholder="Cth: QA Engineer" /></div>
                   <div><label className={labelClass}>Alternatif Posisi Dilamar 2</label><input name="appliedPosition2" className={inputClass} onChange={handleTextChange} placeholder="Cth: Data Analyst" /></div>
                   <div><label className={labelClass}>Notice Period (Ketersediaan) *</label><select name="noticePeriod" required className={inputClass} onChange={handleTextChange}><option value="<1 Bulan">Segera / &lt; 1 Bulan</option><option value="1 Bulan">1 Bulan</option><option value=">1 Bulan">&gt; 1 Bulan</option></select></div>
                   <div><label className={labelClass}>Harapan Gaji Bersih (IDR) *</label><input type="number" name="expectedSalary" required className={inputClass} onChange={handleTextChange} placeholder="Cth: 10000000" /></div>
                 </div>
              </div>
            </div>
          </section>

          {/* 5. INFORMASI KELUARGA & SOSIAL */}
          <section>
            <h2 className={sectionHeaderClass}><Heart className="text-blue-600" /> 5. Informasi Keluarga & Kontak</h2>
            <div className="space-y-8">
              {/* Keluarga */}
              <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="font-bold text-slate-800">Susunan Keluarga / Kontak Darurat</h3>
                    <p className="text-xs text-slate-500">Harap isi minimal 1 data orang tua atau pasangan.</p>
                  </div>
                  <button type="button" onClick={() => addArrayItem('relatives', { name: '', relation: '', age: '', occupation: '' })} className="bg-white border border-blue-200 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">+ KERABAT</button>
                </div>
                {form.relatives.map((item, i) => (
                  <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3 p-4 bg-white rounded-2xl relative border border-slate-100">
                    <input placeholder="Nama Lengkap" className={inputClass} value={item.name} onChange={e => updateArrayItem('relatives', i, 'name', e.target.value)} />
                    <select className={inputClass} value={item.relation} onChange={e => updateArrayItem('relatives', i, 'relation', e.target.value)}>
                      <option value="">Hubungan</option><option value="Ayah">Ayah</option><option value="Ibu">Ibu</option><option value="Pasangan">Pasangan</option><option value="Saudara">Saudara</option>
                    </select>
                    <input type="number" placeholder="Usia" className={inputClass} value={item.age} onChange={e => updateArrayItem('relatives', i, 'age', e.target.value)} />
                    <div className="flex gap-2">
                      <input placeholder="Pekerjaan" className={inputClass} value={item.occupation} onChange={e => updateArrayItem('relatives', i, 'occupation', e.target.value)} />
                      <button type="button" onClick={() => removeArrayItem('relatives', i)} className="text-red-500"><Trash2/></button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Referensi */}
              <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-slate-800">Referensi Profesional (Atasan/Rekan Kerja)</h3>
                  <button type="button" onClick={() => addArrayItem('references', { name: '', phone: '', company: '', position: '', relation: '' })} className="bg-white border border-blue-200 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">+ REFERENSI</button>
                </div>
                {form.references.map((item, i) => (
                  <div key={i} className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3 p-4 bg-white rounded-2xl relative border border-slate-100">
                    <input placeholder="Nama" className={inputClass} value={item.name} onChange={e => updateArrayItem('references', i, 'name', e.target.value)} />
                    <input placeholder="No HP" className={inputClass} value={item.phone} onChange={e => updateArrayItem('references', i, 'phone', e.target.value)} />
                    <input placeholder="Instansi" className={inputClass} value={item.company} onChange={e => updateArrayItem('references', i, 'company', e.target.value)} />
                    <input placeholder="Jabatan" className={inputClass} value={item.position} onChange={e => updateArrayItem('references', i, 'position', e.target.value)} />
                    <button type="button" onClick={() => removeArrayItem('references', i)} className="text-red-500 text-sm font-bold">Hapus</button>
                  </div>
                ))}
              </div>

              {/* Sosial Media */}
              <div className="bg-slate-100/50 p-10 rounded-[2.5rem] border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-8 flex items-center gap-2"><Share2 size={22} className="text-blue-600"/> Tautan Media Sosial (Opsional)</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex items-center group">
                    <span className="bg-white border-y border-l border-slate-300 rounded-l-2xl px-4 py-4 text-xs font-extrabold text-slate-400 group-focus-within:border-blue-500 transition-all">LINKEDIN</span>
                    <input name="linkedin" className="flex-1 border border-slate-300 rounded-r-2xl p-4 text-sm outline-none focus:border-blue-500 transition-all" onChange={handleSocialMediaChange} placeholder="URL Profil" />
                  </div>
                  <div className="flex items-center group">
                    <span className="bg-white border-y border-l border-slate-300 rounded-l-2xl px-4 py-4 text-xs font-extrabold text-slate-400 group-focus-within:border-blue-500 transition-all">INSTAGRAM</span>
                    <input name="instagram" className="flex-1 border border-slate-300 rounded-r-2xl p-4 text-sm outline-none focus:border-blue-500 transition-all" onChange={handleSocialMediaChange} placeholder="@username" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* AREA KONFIRMASI & SUBMIT */}
          <div className="pt-10 border-t border-slate-200">
             <div className="bg-blue-50 text-blue-900 p-8 rounded-[2rem] text-sm mb-10 flex items-start gap-4 border border-blue-100 shadow-sm leading-relaxed">
                <CheckCircle2 className="shrink-0 mt-1 text-blue-600" size={24} />
                <p className="font-medium">Saya menyatakan bahwa seluruh data yang telah saya isikan dalam formulir ini adalah benar, akurat, dan lengkap sesuai dokumen asli. Saya bersedia menerima sanksi atau pembatalan jika dikemudian hari ditemukan ketidakbenaran data.</p>
             </div>
             <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-blue-700 to-indigo-900 hover:from-blue-800 hover:to-indigo-950 text-white font-extrabold text-2xl p-8 rounded-[2.5rem] transition-all shadow-2xl shadow-blue-500/20 flex justify-center items-center gap-4 disabled:opacity-50 transform hover:-translate-y-1">
                {isLoading ? <><Loader2 className="animate-spin" size={32}/> MENGIRIM DATA KE SERVER...</> : "SUBMIT PENDAFTARAN"}
             </button>
          </div>

        </form>
      </div>
    </div>
  );
}