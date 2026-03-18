"use client";

import { useEffect, useState, useCallback, memo, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { toast } from "sonner";
import TestReportPDF from '@/components/test/TestReportPDF';
import { 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  Eye, 
  Edit, 
  Trash2, 
  Loader2, 
  AlertCircle,
  Briefcase,
  Filter,
  X,
  MapPin,
  Save,
  User,
  TrendingUp,
  GraduationCap,
  Award,
  Users,
  Activity,    // Icon Kraepelin
  BrainCircuit,// Icon CFIT
  PieChart,    // Icon PAPI
  FileText,    // Icon Header Modal & CV
  Download     // Icon Download PDF
} from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

interface Candidate {
  id: string;
  fullName: string;
  email: string;
  whatsapp: string; 
  top_position: string;
  status: string;
  test_status: string;
  created_at: string;
  match_score: number;
}

// Interface disesuaikan dengan struktur JSONB dari Backend baru
interface CandidateDetail extends Candidate {
  resume_id?: string;
  has_cv?: boolean; // <-- DITAMBAHKAN: Untuk mengecek ketersediaan CV
  gender?: string;
  birthDate?: string;
  domicileProvince?: string;
  domicileCity?: string;
  totalExperience?: string;
  appliedPosition2?:string;
  appliedPosition1?:string;
  
  // Pendidikan (Flat dari backend)
  degree?: string;
  major?: string;
  studyProgram?: string;
  university?: string;
  eduCity?: string;
  gpa?: string;
  startYear?: string;
  gradYear?: string;

  // Arrays (JSONB)
  workExperiences?: Array<{ position: string; company: string; start: string; end: string; desc?: string }>;
  internships?: Array<{ position: string; company: string; start: string; end: string }>;
  trainings?: Array<{ name: string; organizer: string; year: string }>;
  organizations?: Array<{ name: string; position: string; start: string; end: string }>;
  
  // Ekspektasi
  expectedSalary?: number;
  noticePeriod?: string;
}

interface JobPosition {
  id: string;
  title: string;
}

const DetailModal = memo(({ 
  candidate, 
  onClose 
}: { 
  candidate: CandidateDetail | null; 
  onClose: () => void;
}) => {
  // <-- DITAMBAHKAN: State untuk loading saat fetch file CV
  const [loadingCV, setLoadingCV] = useState(false);

  if (!candidate) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "Screening": return "bg-blue-100 text-blue-700 border-blue-200";
      case "Interview": return "bg-indigo-100 text-indigo-700 border-indigo-200";
      case "Hired": return "bg-green-100 text-green-700 border-green-200";
      case "Rejected": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return "-";
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
  };

  // <-- DITAMBAHKAN: Fungsi untuk hit API CV dan membuka PDF di tab baru
  const handleViewCV = async () => {
    if (!candidate?.id) return;
    
    setLoadingCV(true);
    const token = localStorage.getItem("hr_token");
    
    try {
      const res = await fetch(`${API_BASE_URL}/candidates/${candidate.id}/cv`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error("Gagal mengambil file CV. File mungkin tidak ditemukan di server.");
      }

      const blob = await res.blob();
      const fileUrl = window.URL.createObjectURL(blob);
      window.open(fileUrl, '_blank');
      
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoadingCV(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden shadow-xl border border-[var(--secondary-100)] transform transition-all animate-in zoom-in-95 duration-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER MODAL */}
        <div className="px-6 py-5 border-b border-[var(--secondary-100)] flex justify-between items-center bg-[var(--background)] flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[var(--primary-100)] flex items-center justify-center text-lg font-bold text-[var(--primary)] shrink-0">
              {(candidate.fullName || "?").charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-[var(--primary-900)]">{candidate.fullName || "Nama Tidak Ada"}</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(candidate.status || "Pending")}`}>
                  {candidate.status || "Pending"}
                </span>
              </div>
              <p className="text-sm text-[var(--secondary)]">{candidate.top_position || "Posisi Belum Ditentukan"}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            {/* <-- DITAMBAHKAN: Tombol Lihat CV (Hanya muncul jika has_cv bernilai true) */}
            {candidate.has_cv && (
              <button 
                onClick={handleViewCV}
                disabled={loadingCV}
                className="flex items-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 shadow-sm"
              >
                {loadingCV ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                {loadingCV ? "Membuka..." : "Lihat CV"}
              </button>
            )}

            <button onClick={onClose} className="p-2 hover:bg-[var(--secondary-100)] rounded-full transition-colors shrink-0">
              <X size={20} className="text-[var(--secondary-400)]" />
            </button>
          </div>
        </div>

        {/* BODY MODAL */}
        <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50 space-y-6">
          
          {/* 1. INFO UTAMA & KONTAK */}
          <div className="bg-white p-4 rounded-xl border border-[var(--secondary-200)] shadow-sm">
            <h3 className="text-sm font-bold text-[var(--primary)] mb-4 border-b pb-2 flex items-center gap-2">
              <User size={16} /> Data Pribadi & Kontak
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 text-sm">
              <div className="flex items-center gap-3 text-[var(--secondary-700)] col-span-2 md:col-span-1">
                <Mail size={16} className="text-[var(--primary)] shrink-0" />
                <span className="truncate">{candidate.email || "-"}</span>
              </div>
              <div className="flex items-center gap-3 text-[var(--secondary-700)] col-span-2 md:col-span-2">
                <Phone size={16} className="text-[var(--primary)] shrink-0" />
                <span>{candidate.whatsapp || "-"}</span>
              </div>
              <div>
                <p className="text-xs text-[var(--secondary-500)] mb-1">Jenis Kelamin</p>
                <p className="font-semibold text-[var(--primary-900)]">{candidate.gender || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--secondary-500)] mb-1">Tanggal Lahir</p>
                <p className="font-semibold text-[var(--primary-900)]">
                  {candidate.birthDate ? new Date(candidate.birthDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--secondary-500)] mb-1">Domisili</p>
                <p className="font-semibold text-[var(--primary-900)]">{candidate.domicileCity || "-"}</p>
                <p className="text-xs text-[var(--secondary-600)]">{candidate.domicileProvince || ""}</p>
              </div>
            </div>
          </div>

          {/* 2. EKSPEKTASI & POSISI */}
          <div className="bg-white p-4 rounded-xl border border-[var(--secondary-200)] shadow-sm">
            <h3 className="text-sm font-bold text-[var(--primary)] mb-4 border-b pb-2 flex items-center gap-2">
              <TrendingUp size={16} /> Ekspektasi & Lamaran
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="col-span-2">
                <p className="text-xs text-[var(--secondary-500)] mb-1">Pilihan Posisi</p>
                <p className="font-semibold text-[var(--primary-900)]">1. {candidate.appliedPosition1 || "-"}</p>
                <p className="font-semibold text-[var(--primary-900)]">2. {candidate.appliedPosition2 || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--secondary-500)] mb-1">Ekspektasi Gaji</p>
                <p className="font-semibold text-[var(--primary-900)]">{formatCurrency(candidate.expectedSalary)}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--secondary-500)] mb-1">Notice Period</p>
                <p className="font-semibold text-[var(--primary-900)]">{candidate.noticePeriod || "-"}</p>
              </div>
            </div>
          </div>

          {/* 3. PENDIDIKAN */}
          <div className="bg-white p-4 rounded-xl border border-[var(--secondary-200)] shadow-sm">
            <h3 className="text-sm font-bold text-[var(--primary)] mb-4 border-b pb-2 flex items-center gap-2">
              <GraduationCap size={16} /> Pendidikan Terakhir
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="col-span-2">
                <p className="text-xs text-[var(--secondary-500)] mb-1">Universitas / Institusi</p>
                <p className="font-bold text-[var(--primary-900)]">{candidate.university || "-"}</p>
                <p className="text-xs text-[var(--secondary-600)] mt-0.5">{candidate.degree} - {candidate.major}</p>
                {candidate.studyProgram && <p className="text-xs text-[var(--secondary-600)]">Program Studi: {candidate.studyProgram}</p>}
              </div>
              <div>
                <p className="text-xs text-[var(--secondary-500)] mb-1">Tahun Tempuh</p>
                <p className="font-semibold text-[var(--primary-900)]">{candidate.startYear || "?"} - {candidate.gradYear || "?"}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--secondary-500)] mb-1">IPK</p>
                <p className="font-semibold text-[var(--primary-900)]">{candidate.gpa || "-"}</p>
              </div>
            </div>
          </div>

          {/* 4. PENGALAMAN KERJA */}
          <div className="bg-white p-4 rounded-xl border border-[var(--secondary-200)] shadow-sm">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="text-sm font-bold text-[var(--primary)] flex items-center gap-2">
                <Briefcase size={16} /> Pengalaman Kerja
              </h3>
              <span className="text-xs font-semibold bg-[var(--primary-50)] text-[var(--primary-700)] px-2.5 py-1 rounded-full">
                Total: {candidate.totalExperience || "Fresh Graduate"}
              </span>
            </div>
            
            {candidate.workExperiences && candidate.workExperiences.length > 0 ? (
              <div className="space-y-4 border-l-2 border-[var(--primary-200)] ml-2 pl-4 mt-2">
                {candidate.workExperiences.map((exp, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-[var(--primary)] ring-4 ring-white"></div>
                    <p className="text-sm font-bold text-[var(--primary-900)]">{exp.position}</p>
                    <p className="text-xs font-medium text-[var(--primary)]">{exp.company}</p>
                    <p className="text-xs text-[var(--secondary-400)] mt-0.5">{exp.start} - {exp.end || "Sekarang"}</p>
                    {exp.desc && <p className="text-xs text-[var(--secondary-600)] mt-1 italic line-clamp-2">"{exp.desc}"</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--secondary-500)] italic">Belum ada rincian pengalaman kerja dicatat.</p>
            )}
          </div>

          {/* 5. ORGANISASI & PELATIHAN (JSONB) */}
          {(candidate.organizations?.length || candidate.trainings?.length) ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {candidate.organizations && candidate.organizations.length > 0 && (
                 <div>
                   <h3 className="text-xs font-bold text-[var(--secondary-500)] uppercase tracking-wide mb-3 flex items-center gap-2">
                     <Users size={16} className="text-[var(--primary)]"/> Organisasi
                   </h3>
                   <div className="space-y-2">
                     {candidate.organizations.map((org, idx) => (
                       <div key={idx} className="text-sm p-3 bg-gray-50 border border-gray-100 rounded-lg">
                         <p className="font-semibold text-[var(--primary-900)]">{org.position}</p>
                         <p className="text-xs text-[var(--secondary-600)]">{org.name} ({org.start} - {org.end || "Sekarang"})</p>
                       </div>
                     ))}
                   </div>
                 </div>
               )}

               {candidate.trainings && candidate.trainings.length > 0 && (
                 <div>
                   <h3 className="text-xs font-bold text-[var(--secondary-500)] uppercase tracking-wide mb-3 flex items-center gap-2">
                     <Award size={16} className="text-[var(--primary)]"/> Sertifikasi / Pelatihan
                   </h3>
                   <div className="space-y-2">
                     {candidate.trainings.map((tr, idx) => (
                       <div key={idx} className="text-sm p-3 bg-gray-50 border border-gray-100 rounded-lg">
                         <p className="font-semibold text-[var(--primary-900)]">{tr.name}</p>
                         <p className="text-xs text-[var(--secondary-600)]">{tr.organizer} ({tr.year})</p>
                       </div>
                     ))}
                   </div>
                 </div>
               )}
            </div>
          ) : null}

        </div>

        {/* FOOTER MODAL */}
        <div className="px-6 py-4 border-t border-[var(--secondary-100)] flex justify-between items-center bg-[var(--background)] flex-shrink-0">
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--secondary-500)]">Match Score AI</span>
              <span className={`text-sm font-bold px-2 py-0.5 rounded ${candidate.match_score >= 80 ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>
                {candidate.match_score || 0}%
              </span>
            </div>
          </div>
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-[var(--secondary-600)] hover:text-[var(--primary-700)] hover:bg-[var(--secondary-100)] rounded-lg transition-colors">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
});
DetailModal.displayName = 'DetailModal';

const EditModal = memo(({ 
  candidate, 
  onClose,
  onSave 
}: { 
  candidate: CandidateDetail | null; 
  onClose: () => void;
  onSave: (data: Partial<CandidateDetail>) => Promise<void>;
}) => {
  const [formData, setFormData] = useState({
    fullName: "", email: "", whatsapp: "", gender: "", birthDate: "",
    domicileCity: "", domicileProvince: "",
    degree: "", major: "", studyProgram: "", university: "", gpa: "", startYear: "", gradYear: "",
    totalExperience: "", appliedPosition1: "", appliedPosition2: "", expectedSalary: "", noticePeriod: ""
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (candidate) {
      setFormData({
        fullName: candidate.fullName || "",
        email: candidate.email || "",
        whatsapp: candidate.whatsapp || "",
        gender: candidate.gender || "",
        birthDate: candidate.birthDate ? candidate.birthDate.split('T')[0] : "",
        domicileCity: candidate.domicileCity || "",
        domicileProvince: candidate.domicileProvince || "",
        degree: candidate.degree || "",
        major: candidate.major || "",
        studyProgram: candidate.studyProgram || "",
        university: candidate.university || "",
        gpa: candidate.gpa || "",
        startYear: candidate.startYear || "",
        gradYear: candidate.gradYear || "",
        totalExperience: candidate.totalExperience || "",
        appliedPosition1: candidate.appliedPosition1 || "",
        appliedPosition2: candidate.appliedPosition2 || "",
        expectedSalary: candidate.expectedSalary ? candidate.expectedSalary.toString() : "",
        noticePeriod: candidate.noticePeriod || ""
      });
    }
  }, [candidate]);

  if (!candidate) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const submissionData = {
      ...formData,
      expectedSalary: formData.expectedSalary ? parseInt(formData.expectedSalary, 10) : undefined
    };
    await onSave(submissionData);
    setSaving(false);
  };

  const inputClass = "w-full px-3 py-2.5 bg-white border border-[var(--secondary-200)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] focus:outline-none transition-colors text-[var(--primary-900)] placeholder-[var(--secondary-300)]";
  const labelClass = "text-xs font-semibold text-[var(--secondary-500)] uppercase tracking-wide mb-1.5 block";
  const sectionTitleClass = "text-sm font-bold text-[var(--primary)] border-b border-[var(--secondary-100)] pb-2 mb-4 mt-6";

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl border border-[var(--secondary-100)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-[var(--secondary-100)] flex justify-between items-center bg-[var(--background)] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--primary-50)] flex items-center justify-center">
              <Edit size={18} className="text-[var(--primary)]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--primary-900)]">Edit Profil Kandidat</h2>
              <p className="text-xs text-[var(--secondary)]">{candidate.fullName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--secondary-100)] rounded-full transition-colors">
            <X size={20} className="text-[var(--secondary-400)]" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-gray-50/30">
          <form id="editCandidateForm" onSubmit={handleSubmit} className="space-y-2">
            
            {/* 1. DATA UTAMA & KONTAK */}
            <h3 className="text-sm font-bold text-[var(--primary)] border-b border-[var(--secondary-100)] pb-2 mb-4 mt-0">Info Utama & Kontak</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Nama Lengkap *</label>
                <input type="text" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} className={inputClass} required />
              </div>
              <div>
                <label className={labelClass}>Email *</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={inputClass} required />
              </div>
              <div>
                <label className={labelClass}>WhatsApp</label>
                <input type="text" value={formData.whatsapp} onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Jenis Kelamin</label>
                  <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} className={inputClass}>
                    <option value="">Pilih...</option>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Tanggal Lahir</label>
                  <input type="date" value={formData.birthDate} onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })} className={inputClass} />
                </div>
              </div>
            </div>

            {/* 2. DOMISILI */}
            <h3 className={sectionTitleClass}>Lokasi & Domisili</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Kota / Kabupaten Domisili</label>
                <input type="text" value={formData.domicileCity} onChange={(e) => setFormData({ ...formData, domicileCity: e.target.value })} className={inputClass} placeholder="Cth: Jakarta Selatan" />
              </div>
              <div>
                <label className={labelClass}>Provinsi Domisili</label>
                <input type="text" value={formData.domicileProvince} onChange={(e) => setFormData({ ...formData, domicileProvince: e.target.value })} className={inputClass} placeholder="Cth: DKI Jakarta" />
              </div>
            </div>

            {/* 3. PENDIDIKAN */}
            <h3 className={sectionTitleClass}>Pendidikan Terakhir</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Tingkat</label>
                  <input type="text" value={formData.degree} onChange={(e) => setFormData({ ...formData, degree: e.target.value })} className={inputClass} placeholder="Cth: S1, D3" />
                </div>
                <div>
                  <label className={labelClass}>Fakultas / Peminatan</label>
                  <input type="text" value={formData.major} onChange={(e) => setFormData({ ...formData, major: e.target.value })} className={inputClass} placeholder="Cth: Teknik" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Program Studi (Jurusan)</label>
                <input type="text" value={formData.studyProgram} onChange={(e) => setFormData({ ...formData, studyProgram: e.target.value })} className={inputClass} placeholder="Cth: Teknik Informatika" />
              </div>
              <div>
                <label className={labelClass}>Universitas / Institusi</label>
                <input type="text" value={formData.university} onChange={(e) => setFormData({ ...formData, university: e.target.value })} className={inputClass} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>IPK</label>
                  <input type="text" value={formData.gpa} onChange={(e) => setFormData({ ...formData, gpa: e.target.value })} className={inputClass} placeholder="Cth: 3.80" />
                </div>
                <div>
                  <label className={labelClass}>Tahun Masuk</label>
                  <input type="text" value={formData.startYear} onChange={(e) => setFormData({ ...formData, startYear: e.target.value })} className={inputClass} placeholder="YYYY" />
                </div>
                <div>
                  <label className={labelClass}>Tahun Lulus</label>
                  <input type="text" value={formData.gradYear} onChange={(e) => setFormData({ ...formData, gradYear: e.target.value })} className={inputClass} placeholder="YYYY" />
                </div>
              </div>
            </div>

            {/* 4. PENGALAMAN & EKSPEKTASI */}
            <h3 className={sectionTitleClass}>Pengalaman & Ekspektasi Pekerjaan</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Posisi Dilamar (Pilihan 1)</label>
                <input type="text" value={formData.appliedPosition1} onChange={(e) => setFormData({ ...formData, appliedPosition1: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Posisi Dilamar (Pilihan 2)</label>
                <input type="text" value={formData.appliedPosition2} onChange={(e) => setFormData({ ...formData, appliedPosition2: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Total Pengalaman Kerja</label>
                <input type="text" value={formData.totalExperience} onChange={(e) => setFormData({ ...formData, totalExperience: e.target.value })} className={inputClass} placeholder="Cth: 2 Tahun" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Ekspektasi Gaji (IDR)</label>
                  <input type="number" value={formData.expectedSalary} onChange={(e) => setFormData({ ...formData, expectedSalary: e.target.value })} className={inputClass} placeholder="Angka saja..." />
                </div>
                <div>
                  <label className={labelClass}>Notice Period</label>
                  <input type="text" value={formData.noticePeriod} onChange={(e) => setFormData({ ...formData, noticePeriod: e.target.value })} className={inputClass} placeholder="Cth: 1 Bulan, Segera" />
                </div>
              </div>
            </div>

          </form>
        </div>

        <div className="px-6 py-4 border-t border-[var(--secondary-100)] flex justify-between items-center bg-[var(--background)] flex-shrink-0">
          <p className="text-[10px] text-[var(--secondary-500)] font-medium">Data kandidat akan langsung disinkronkan ke server.</p>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-[var(--secondary-600)] hover:text-[var(--primary-900)] hover:bg-[var(--secondary-100)] rounded-lg transition-colors">
              Batal
            </button>
            <button type="submit" form="editCandidateForm" disabled={saving} className="px-4 py-2.5 bg-[var(--primary)] text-white text-sm font-bold rounded-lg hover:bg-[var(--primary-700)] transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm">
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
EditModal.displayName = 'EditModal';
// ==========================================
// MODAL HASIL TES UNTUK KANDIDAT
// ==========================================
const TestResultModal = memo(({ 
  candidate, 
  submissions,
  onClose 
}: { 
  candidate: Candidate | null; 
  submissions: any[];
  onClose: () => void;
}) => {
  const pdfRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  if (!candidate) return null;

  const candSubs = submissions.filter(s => s.candidate_id === candidate.id && s.participant_type === "Candidate");
  const cfit = candSubs.find(s => s.test_type === "cfit");
  const kraepelin = candSubs.find(s => s.test_type === "kraepelin");
  const papi = candSubs.find(s => s.test_type === "papi");

  // Hitung Total Errors Kraepelin
  const totalErrors = kraepelin?.scores?.totalErrors ?? "-";

  const handleDownloadPDF = async () => {
    if (!pdfRef.current) return;
    setIsGeneratingPDF(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const opt = {
        margin: 0,
        filename: `Hasil_Psikotes_Kandidat_${candidate.fullName.replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
      };
      await html2pdf().set(opt).from(pdfRef.current).save();
    } catch (error) {
      console.error("Gagal mencetak PDF:", error);
      alert("Terjadi kesalahan saat mengunduh PDF.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const pdfData = {
    candidate_name: candidate.fullName,
    participant_type: 'Candidate',
    id: candidate.id,
    scores: { cfit: cfit?.scores, kraepelin: kraepelin?.scores, papi: papi?.scores }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl border border-[var(--secondary-100)] flex flex-col" onClick={(e) => e.stopPropagation()}>
        
        {/* Header Modal */}
        <div className="px-6 py-5 border-b border-[var(--secondary-100)] flex justify-between items-center bg-[var(--background)] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
              <FileText size={20} className="text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--primary-900)]">Hasil Tes Asesmen Lengkap</h2>
              <p className="text-xs text-[var(--secondary)]">{candidate.fullName} - {candidate.top_position}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--secondary-100)] rounded-full transition-colors">
            <X size={20} className="text-[var(--secondary-400)]" />
          </button>
        </div>

        {/* Body Modal */}
        <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50 space-y-8">
          
          {/* SEKSI: CFIT */}
          <div className="bg-white p-6 rounded-2xl border border-[var(--secondary-200)] shadow-sm">
            <h3 className="text-base font-bold text-gray-800 mb-5 border-b pb-3 flex items-center gap-2">
                <BrainCircuit className="text-blue-500" size={20}/> Tes Kecerdasan (CFIT)
            </h3>
            {cfit ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-blue-50 p-5 rounded-xl text-center border border-blue-100">
                        <p className="text-xs text-blue-600 font-extrabold uppercase tracking-wider">Skor IQ</p>
                        <p className="text-3xl font-black text-blue-900 mt-2">{cfit.scores?.iq || 0}</p>
                    </div>
                    <div className="bg-green-50 p-5 rounded-xl text-center border border-green-100">
                        <p className="text-xs text-green-600 font-extrabold uppercase tracking-wider">Klasifikasi</p>
                        <p className="text-lg font-black text-green-900 mt-4">{cfit.scores?.classification || "-"}</p>
                    </div>
                    <div className="bg-slate-50 p-5 rounded-xl text-center border border-slate-200">
                        <p className="text-xs text-slate-500 font-extrabold uppercase tracking-wider">Jawaban Benar</p>
                        <p className="text-3xl font-black text-slate-800 mt-2">{cfit.scores?.raw_score || 0}</p>
                    </div>
                </div>
            ) : <p className="text-sm text-gray-500 italic">Belum ada data atau Kandidat belum menyelesaikan tes CFIT.</p>}
          </div>

          {/* SEKSI: KRAEPELIN (Diperbarui jadi 3 Kotak) */}
          <div className="bg-white p-6 rounded-2xl border border-[var(--secondary-200)] shadow-sm">
            <h3 className="text-base font-bold text-gray-800 mb-5 border-b pb-3 flex items-center gap-2">
                <Activity className="text-orange-500" size={20}/> Tes Kraepelin (Koran)
            </h3>
            {kraepelin ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                    <div className="bg-amber-50 border border-amber-100 p-5 rounded-xl">
                        <p className="text-xs text-amber-600 font-extrabold uppercase tracking-wider">Kecepatan</p>
                        <p className="font-black text-3xl text-amber-900 mt-2">{kraepelin.scores?.panker || "-"}</p>
                    </div>
                    <div className="bg-teal-50 border border-teal-100 p-5 rounded-xl">
                        <p className="text-xs text-teal-600 font-extrabold uppercase tracking-wider">Ketelitian</p>
                        <p className="font-black text-3xl text-teal-900 mt-2">{kraepelin.scores?.janker || "-"}</p>
                    </div>
                    <div className="bg-red-50 border border-red-100 p-5 rounded-xl">
                        <p className="text-xs text-red-600 font-extrabold uppercase tracking-wider">Total Errors</p>
                        <p className="font-black text-3xl text-red-900 mt-2">{totalErrors}</p>
                    </div>
                </div>
            ) : <p className="text-sm text-gray-500 italic">Belum ada data atau Kandidat belum menyelesaikan tes Kraepelin.</p>}
          </div>

          {/* SEKSI: PAPI KOSTICK */}
          <div className="bg-white p-6 rounded-2xl border border-[var(--secondary-200)] shadow-sm">
            <h3 className="text-base font-bold text-gray-800 mb-5 border-b pb-3 flex items-center gap-2">
                <PieChart className="text-purple-500" size={20}/> Tes Kepribadian (PAPI Kostick)
            </h3>
            {papi ? (
                <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-3">
                    {Object.entries(papi.scores || {}).map(([key, value]) => (
                        <div key={key} className="bg-purple-50 p-3 rounded-xl text-center border border-purple-100 shadow-sm">
                            <p className="text-xs font-black text-purple-900">{key}</p>
                            <p className="text-lg font-bold text-purple-700 mt-1">{String(value)}</p>
                        </div>
                    ))}
                </div>
            ) : <p className="text-sm text-gray-500 italic">Belum ada data atau Kandidat belum menyelesaikan tes PAPI.</p>}
          </div>

        </div>
        
        {/* Footer Modal */}
        <div className="px-6 py-4 border-t border-[var(--secondary-100)] flex justify-end gap-3 bg-[var(--background)] flex-shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
            Tutup
          </button>
          <button onClick={handleDownloadPDF} disabled={isGeneratingPDF} className={`px-5 py-2.5 text-sm font-bold text-white rounded-lg flex items-center gap-2 transition-colors shadow-sm ${isGeneratingPDF ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
            <Download size={16} /> {isGeneratingPDF ? 'Memproses PDF...' : 'Download Sertifikat'}
          </button>
        </div>
      </div>
      <TestReportPDF ref={pdfRef} data={pdfData as any} />
    </div>
  );
});
TestResultModal.displayName = 'TestResultModal';


export default function CandidatesPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<JobPosition[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]); // Menyimpan hasil tes
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [jobFilter, setJobFilter] = useState("all"); // Filter Job dipertahankan

  const [detailModal, setDetailModal] = useState<CandidateDetail | null>(null);
  const [editModal, setEditModal] = useState<CandidateDetail | null>(null);
  const [testResultModal, setTestResultModal] = useState<Candidate | null>(null); // State Modal Tes
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem("hr_user");
    if (!userData) {
      router.push("/");
      return;
    }
    setUser(JSON.parse(userData));
    fetchCandidates();
    fetchJobs();
    fetchSubmissions(); // Fetch hasil tes
  }, [router]);

  const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem("hr_token");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/candidates`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Gagal mengambil data kandidat");
      setCandidates(await res.json());
      setError(null);
    } catch (err) {
      setError("Gagal menghubungkan ke server.");
      toast.error("Gagal memuat daftar kandidat.");
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/job-positions?status=active`, { headers: getAuthHeaders() });
      if (res.ok) setJobs(await res.json());
    } catch (err) {
      console.error("Gagal mengambil data pekerjaan:", err);
    }
  };

  // Mengambil data hasil tes untuk semua kandidat
  const fetchSubmissions = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/management/submissions`, { headers: getAuthHeaders() });
      if (res.ok) setSubmissions(await res.json());
    } catch (err) {
      console.error("Gagal mengambil data hasil tes:", err);
    }
  };

  const fetchCandidateDetail = async (id: string) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`${API_BASE_URL}/candidates/${id}`, { headers: getAuthHeaders() });
      if (res.ok) {
        return await res.json();
      }
      toast.error("Gagal memuat detail kandidat.");
      return null;
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan jaringan.");
      return null;
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleViewDetail = async (id: string) => {
    const detail = await fetchCandidateDetail(id);
    if (detail) setDetailModal(detail);
  };

  const handleEdit = async (id: string) => {
    const detail = await fetchCandidateDetail(id);
    if (detail) setEditModal(detail);
  };

  const handleSaveEdit = async (data: Partial<CandidateDetail>) => {
    if (!editModal) return;
    
    const updateTask = async () => {
      const res = await fetch(`${API_BASE_URL}/candidates/${editModal.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Gagal memperbarui data dari server.");
      
      setEditModal(null);
      fetchCandidates();
      return "Data kandidat berhasil diperbarui!";
    };

    await toast.promise(updateTask(), {
      loading: 'Menyimpan perubahan...',
      success: (message) => message,
      error: (err) => err.message || 'Terjadi kesalahan sistem.',
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus kandidat ini? Data tidak dapat dikembalikan.")) return;

    const deleteTask = async () => {
      const res = await fetch(`${API_BASE_URL}/candidates/${id}`, { 
        method: "DELETE", 
        headers: getAuthHeaders() 
      });
      
      if (!res.ok) throw new Error("Gagal menghapus data dari server.");
      
      setCandidates(prev => prev.filter(c => c.id !== id));
      return "Kandidat berhasil dihapus!";
    };

    toast.promise(deleteTask(), {
      loading: 'Menghapus data kandidat...',
      success: (message) => message,
      error: (err) => err.message || 'Terjadi kesalahan sistem.',
    });
  };

  const filteredCandidates = candidates.filter((c) => {
    const searchLower = (searchQuery || "").toLowerCase();
    const matchesSearch = 
      (c.fullName || "").toLowerCase().includes(searchLower) || 
      (c.email || "").toLowerCase().includes(searchLower);
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    const matchesJob = jobFilter === "all" || c.top_position === jobFilter; // Job filter dipertahankan
    return matchesSearch && matchesStatus && matchesJob;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending": return "badge badge-warning";
      case "Screening": return "badge badge-primary";
      case "Interview": return "badge badge-primary";
      case "Hired": return "badge badge-success";
      case "Rejected": return "badge badge-danger";
      default: return "badge badge-secondary";
    }
  };

  const getTestBadge = (status: string) => {
    if (status === "Completed") return "badge badge-success";
    if (status === "Active") return "badge badge-primary";
    return "badge badge-secondary text-[var(--secondary-400)]";
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar />
      <div className="lg:ml-64 min-h-screen flex flex-col">
        <Header 
          title="Candidates" 
          subtitle="Manage job applicants and their test results"
        />
        <main className="p-4 md:p-8 flex-1">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div className="w-full md:w-auto">
              <h2 className="text-xl md:text-2xl font-bold text-[var(--primary-900)]">Database Kandidat</h2>
              <p className="text-xs md:text-sm text-[var(--secondary)] mt-1">Total {candidates.length} kandidat terdaftar</p>
            </div>
            
            <button 
              onClick={() => router.push('/apply')} 
              className="w-full md:w-auto bg-[var(--primary)] text-white px-5 py-3 md:py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-[var(--primary-700)] hover:shadow-lg hover:shadow-teal-500/20 transition-all active:scale-95 text-sm"
            >
              <Plus size={18} /> Add Candidate
            </button>
          </div>

          <div className="card-static bg-white p-4 rounded-xl border border-[var(--secondary-200)] mb-6 shadow-sm">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
              <div className="relative flex-1 w-full">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--secondary-400)]" />
                <input
                  type="text"
                  placeholder="Cari nama atau email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-[var(--secondary-200)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all text-sm"
                />
              </div>

              <div className="flex flex-col sm:flex-row md:items-center gap-3 w-full md:w-auto">
                <div className="w-full md:w-auto flex items-center gap-2">
                  <Briefcase size={18} className="text-[var(--secondary-400)] hidden md:block" />
                  <select
                    value={jobFilter}
                    onChange={(e) => setJobFilter(e.target.value)}
                    className="w-full md:w-56 px-4 py-2.5 border border-[var(--secondary-200)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white cursor-pointer text-sm text-[var(--secondary-700)] appearance-none"
                  >
                    <option value="all">Semua Posisi</option>
                    {jobs.map((job) => (
                      <option key={job.id} value={job.title}>{job.title}</option>
                    ))}
                  </select>
                </div>

                <div className="w-full md:w-auto flex items-center gap-2">
                  <Filter size={18} className="text-[var(--secondary-400)] hidden md:block" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full md:w-48 px-4 py-2.5 border border-[var(--secondary-200)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white cursor-pointer text-sm text-[var(--secondary-700)] appearance-none"
                  >
                    <option value="all">Semua Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Screening">Screening</option>
                    <option value="Interview">Interview</option>
                    <option value="Hired">Hired</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3 mb-6 text-red-700 animation-shake">
              <AlertCircle size={20} />
              <p>{error}</p>
            </div>
          )}

          {loadingDetail && (
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
              <Loader2 className="w-10 h-10 animate-spin text-white" />
            </div>
          )}

          <div className="bg-transparent md:bg-white md:rounded-2xl md:border md:border-[var(--secondary-200)] md:overflow-hidden md:shadow-sm">
            {loading ? (
              <div className="p-20 text-center text-[var(--secondary)]">
                <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-[var(--primary)]" />
                <p className="font-medium">Memuat data kandidat...</p>
              </div>
            ) : (
              <>
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[var(--secondary-50)] border-b border-[var(--secondary-100)]">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-[var(--secondary)] uppercase tracking-wider">Kandidat</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-[var(--secondary)] uppercase tracking-wider">Posisi / Skor</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-[var(--secondary)] uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-[var(--secondary)] uppercase tracking-wider">Test Status</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-[var(--secondary)] uppercase tracking-wider">Tanggal Apply</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-[var(--secondary)] uppercase tracking-wider">Hasil Tes</th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-[var(--secondary)] uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--secondary-50)]">
                      {filteredCandidates.map((candidate) => (
                        <tr key={candidate.id} className="hover:bg-[var(--primary-50)]/30 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-[var(--primary-100)] flex items-center justify-center text-[var(--primary-700)] font-bold text-sm">
                                {(candidate.fullName || "?").charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-[var(--primary-900)] group-hover:text-[var(--primary)] transition-colors">{candidate.fullName || "Unknown"}</p>
                                <div className="flex items-center gap-2 text-xs text-[var(--secondary)] mt-0.5">
                                  <Mail size={12} />
                                  <span className="truncate max-w-[150px]">{candidate.email || "-"}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-[var(--primary-900)] flex items-center gap-1">
                                <Briefcase size={14} className="text-[var(--secondary-400)]"/> {candidate.top_position || "Unassigned"}
                              </span>
                              <span className={`text-xs mt-1 ${candidate.match_score >= 80 ? 'text-[var(--primary)] font-bold' : 'text-[var(--secondary)]'}`}>
                                Match: {candidate.match_score || 0}%
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`${getStatusBadge(candidate.status)} rounded-full px-2.5 py-1 text-xs font-semibold`}>
                              {candidate.status || "-"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getTestBadge(candidate.test_status)}`}>
                              {candidate.test_status || "-"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-[var(--secondary)]">
                            {candidate.created_at ? new Date(candidate.created_at).toLocaleDateString("id-ID", {
                              day: 'numeric', month: 'short', year: 'numeric'
                            }) : "-"}
                          </td>
                          
                          {/* Tombol Lihat Hasil Tes Desktop */}
                          <td className="px-6 py-4 text-center">
                             <button 
                               onClick={() => setTestResultModal(candidate)}
                               className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                             >
                               <Award size={14}/> Lihat Hasil
                             </button>
                          </td>

                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => router.push(`/candidates/${candidate.id}/journey`)}
                                className="p-2 text-[var(--secondary-400)] hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
                                title="View Journey"
                              >
                                <TrendingUp size={18} />
                              </button>
                              <button 
                                onClick={() => handleViewDetail(candidate.id)}
                                className="p-2 text-[var(--secondary-400)] hover:text-[var(--primary)] hover:bg-[var(--primary-50)] rounded-lg transition-colors" 
                                title="Lihat Detail"
                              >
                                <Eye size={18} />
                              </button>
                              <button 
                                onClick={() => handleEdit(candidate.id)}
                                className="p-2 text-[var(--secondary-400)] hover:text-[var(--success)] hover:bg-green-50 rounded-lg transition-colors" 
                                title="Edit"
                              >
                                <Edit size={18} />
                              </button>
                              <button 
                                onClick={() => handleDelete(candidate.id)}
                                className="p-2 text-[var(--secondary-400)] hover:text-[var(--danger)] hover:bg-red-50 rounded-lg transition-colors" 
                                title="Hapus"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="md:hidden space-y-4">
                  {filteredCandidates.map((candidate) => (
                    <div key={candidate.id} className="bg-white p-4 rounded-xl border border-[var(--secondary-200)] shadow-sm flex flex-col gap-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-[var(--primary-100)] flex items-center justify-center text-[var(--primary-700)] font-bold text-lg">
                             {(candidate.fullName || "?").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-bold text-[var(--primary-900)] text-base">{candidate.fullName || "Unknown"}</h3>
                            <p className="text-xs text-[var(--secondary)] mt-0.5">{candidate.email || "-"}</p>
                          </div>
                        </div>
                        <div className="text-right">
                           <span className={`text-sm font-bold block ${candidate.match_score >= 80 ? 'text-[var(--primary)]' : 'text-[var(--secondary)]'}`}>
                              {candidate.match_score || 0}%
                           </span>
                           <span className="text-[10px] text-[var(--secondary-400)] uppercase tracking-wider">Match</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm border-y border-[var(--secondary-100)] py-3">
                         <div>
                            <p className="text-[10px] text-[var(--secondary-400)] uppercase">Posisi</p>
                            <p className="font-medium text-[var(--primary-900)] truncate">{candidate.top_position || "Unassigned"}</p>
                         </div>
                         <div>
                            <p className="text-[10px] text-[var(--secondary-400)] uppercase">Joined</p>
                            <p className="font-medium text-[var(--secondary)]">
                               {candidate.created_at ? new Date(candidate.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' }) : "-"}
                            </p>
                         </div>
                      </div>

                      <div className="flex gap-2">
                          <span className={`${getStatusBadge(candidate.status)} rounded-lg px-3 py-1 text-xs font-semibold flex-1 text-center`}>
                              {candidate.status || "-"}
                          </span>
                          <span className={`rounded-lg px-3 py-1 text-xs font-semibold flex-1 text-center border border-[var(--secondary-200)] bg-[var(--secondary-50)] text-[var(--secondary-600)]`}>
                              {candidate.test_status || "-"} Test
                          </span>
                      </div>

                      {/* Tombol Lihat Hasil Tes Mobile */}
                      <button 
                         onClick={() => setTestResultModal(candidate)} 
                         className="w-full py-2.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-colors"
                      >
                          <Award size={16} /> Lihat Hasil Asesmen Lengkap
                      </button>

                      <div className="pt-3 border-t border-[var(--secondary-50)] flex justify-between gap-2 overflow-x-auto">
                          <button 
                            onClick={() => router.push(`/candidates/${candidate.id}/journey`)}
                            className="flex-1 py-2 px-3 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:bg-blue-100"
                          >
                             <TrendingUp size={14} /> Journey
                          </button>
                          <button 
                            onClick={() => handleViewDetail(candidate.id)}
                            className="flex-1 py-2 px-3 bg-[var(--primary-50)] text-[var(--primary)] rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:bg-[var(--primary-100)]"
                          >
                             <Eye size={14} /> Detail
                          </button>
                          <button 
                                onClick={() => handleEdit(candidate.id)}
                                className="p-2 text-[var(--secondary-400)] hover:text-[var(--success)] bg-gray-50 rounded-lg" 
                              >
                                <Edit size={16} />
                          </button>
                          <button 
                                onClick={() => handleDelete(candidate.id)}
                                className="p-2 text-[var(--secondary-400)] hover:text-[var(--danger)] bg-gray-50 rounded-lg" 
                              >
                                <Trash2 size={16} />
                          </button>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredCandidates.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-[var(--secondary)]">
                    <div className="w-16 h-16 bg-[var(--secondary-50)] rounded-full flex items-center justify-center mb-4">
                       <Search size={32} className="text-[var(--secondary-400)]" />
                    </div>
                    <p className="font-bold text-[var(--primary-900)]">Tidak ada kandidat yang ditemukan</p>
                    <p className="text-sm">Coba ubah filter pencarian Anda atau tambahkan kandidat baru.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
        <Footer />
      </div>

      {detailModal && <DetailModal candidate={detailModal} onClose={() => setDetailModal(null)} />}
      {editModal && <EditModal candidate={editModal} onClose={() => setEditModal(null)} onSave={handleSaveEdit} />}
      
      {/* Panggil Modal Hasil Tes */}
      {testResultModal && <TestResultModal candidate={testResultModal} submissions={submissions} onClose={() => setTestResultModal(null)} />}
    </div>
  );
}