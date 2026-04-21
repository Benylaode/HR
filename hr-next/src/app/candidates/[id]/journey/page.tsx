'use client'

import { useState, useEffect, useRef, memo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import JourneyTimeline from '@/components/recruitment/JourneyTimeline'
import TestReportPDF from '@/components/test/TestReportPDF'
import { healKraepelinSubmission, healAllSubmissions } from "@/utils/kraepelinHealer";
import CandidateFinalReport from '@/components/recruitment/CandidateFinalReport'

import { getPapiInterpretation, getPapiTraitName, extractPapiLetter } from '@/utils/papiScoring'
import { toast } from 'sonner'
import { 
  Loader2, ChevronLeft, Upload, Download, Send, User as UserIcon,
  Briefcase, TrendingUp, BrainCircuit, CreditCard,
  MapPin, Phone, Mail, GraduationCap, Users, Award, 
  FileText, Activity, PieChart, ClipboardList, X, Eye, Edit, Trash2,
  Zap, AlertCircle, Shield
} from 'lucide-react'
import { 
  getJourneyTimeline, updateStage, uploadDocument, getCandidateApplications,
  type JourneyTimeline as JourneyData
} from '@/lib/api/tracking'
import { 
  getAllowedNextStages, isRejectionStage, isTerminalStage,
  getProgressPercentage, getStageColor, RecruitmentStages
} from '@/lib/recruitment-stages'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

interface Candidate {
  id: string;
  nik_ktp?: string;
  fullName: string;
  email: string;
  whatsapp: string; 
  top_position: string;
  status: string;
  test_status: string;
  created_at: string;
  match_score: number;
  evaluations?: any[]; 
  submissions?: any[]; 
}

interface CandidateDetail extends Candidate {
  resume_id?: string;
  has_cv?: boolean; 
  gender?: string;
  birthDate?: string;
  domicileProvince?: string;
  domicileCity?: string;
  totalExperience?: string;
  appliedPosition2?:string;
  appliedPosition1?:string;
  
  degree?: string;
  major?: string;
  studyProgram?: string;
  university?: string;
  eduCity?: string;
  gpa?: string;
  startYear?: string;
  gradYear?: string;

  workExperiences?: Array<{ position: string; company: string; start: string; end: string; desc?: string }>;
  internships?: Array<{ position: string; company: string; start: string; end: string }>;
  trainings?: Array<{ name: string; organizer: string; year: string }>;
  organizations?: Array<{ name: string; position: string; start: string; end: string }>;
  
  expectedSalary?: number;
  noticePeriod?: string;
}

interface JobPosition {
  id: string;
  title: string;
}

// ==========================================
// MODAL DETAIL KANDIDAT
// ==========================================
const DetailModal = memo(({ candidate, onClose }: { candidate: CandidateDetail | null; onClose: () => void; }) => {
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

  const handleViewCV = async () => {
    if (!candidate?.id) return;
    setLoadingCV(true);
    const token = localStorage.getItem("hr_token");
    
    try {
      const res = await fetch(`${API_BASE_URL}/candidates/${candidate.id}/cv`, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("Gagal mengambil file CV. File mungkin tidak ditemukan di server.");

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
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden shadow-xl border border-[var(--secondary-100)] flex flex-col" onClick={(e) => e.stopPropagation()}>
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
            {candidate.has_cv && (
              <button onClick={handleViewCV} disabled={loadingCV} className="flex items-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 shadow-sm">
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
          <div className="bg-white p-4 rounded-xl border border-[var(--secondary-200)] shadow-sm">
            <h3 className="text-sm font-bold text-[var(--primary)] mb-4 border-b pb-2 flex items-center gap-2">
              <UserIcon size={16} /> Data Pribadi & Kontak
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 text-sm">
              <div className="flex items-center gap-3 text-[var(--secondary-700)] col-span-2 md:col-span-1">
                <CreditCard size={16} className="text-[var(--primary)] shrink-0" />
                <span className="truncate">{candidate.nik_ktp || "-"}</span>
              </div>
              <div className="flex items-center gap-3 text-[var(--secondary-700)] col-span-2 md:col-span-1">
                <Mail size={16} className="text-[var(--primary)] shrink-0" />
                <span className="truncate">{candidate.email || "-"}</span>
              </div>
              <div className="flex items-center gap-3 text-[var(--secondary-700)] col-span-2 md:col-span-1">
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

// ==========================================
// MODAL HASIL TES
// ==========================================
const [submissions, setSubmissions] = useState<any[]>([])
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
  const finalReportRef = useRef<HTMLDivElement>(null); 
  
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [evaluations, setEvaluations] = useState<any[]>(candidate?.evaluations || []); 

  useEffect(() => {
    if (candidate?.id && (!candidate.evaluations || candidate.evaluations.length === 0)) {
      const token = localStorage.getItem("hr_token");
      fetch(`${API_BASE_URL}/management/evaluations/${candidate.id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
        .then(res => res.ok ? res.json() : [])
        .then(data => setEvaluations(Array.isArray(data) ? data : []))
        .catch(err => console.error("Gagal mengambil data evaluasi:", err));
    }
  }, [candidate]);

  if (!candidate) return null;

  const candSubs = submissions.filter(s => s.candidate_id === candidate.id && s.participant_type === "Candidate");
  const cfit = candSubs.find(s => s.test_type === "cfit");
  const kraepelin = candSubs.find(s => s.test_type === "kraepelin");
  const papi = candSubs.find(s => s.test_type === "papi");

  // Logika pewarnaan otomatis 
  const getBadgeClass = (grade: string | undefined) => {
    if (!grade) return "";
    return grade.toLowerCase().includes('kurang') 
        ? "bg-red-50 text-red-700 border-red-100" 
        : "text-teal-700 bg-teal-50 border-teal-100";
  };

  const handleDownloadPDF = async () => {
    if (!pdfRef.current) return;
    setIsGeneratingPDF(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const opt = {
        margin: 0,
        filename: `Sertifikat_Psikotes_${candidate.fullName.replace(/\s+/g, '_')}.pdf`,
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

  const handleDownloadFinalReport = async () => {
    if (!finalReportRef.current) return;
    setIsGeneratingPDF(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const opt = {
        margin: 0,
        filename: `Final_Report_Assesment_${candidate.fullName.replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true, scrollY: 0 },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };
      await html2pdf().set(opt).from(finalReportRef.current).save();
    } catch (error) {
      console.error("Gagal mencetak PDF:", error);
      alert("Terjadi kesalahan saat mengunduh Final Report.");
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
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl border border-gray-200 flex flex-col" onClick={(e) => e.stopPropagation()}>
        
        {/* Header Modal */}
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
              <FileText size={20} className="text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Hasil Tes Asesmen Lengkap</h2>
              <p className="text-xs text-gray-500">{candidate.fullName} - {candidate.top_position}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Body Modal */}
        <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50 space-y-8">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
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

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-base font-bold text-gray-800 mb-5 border-b pb-3 flex items-center gap-2">
                <Activity className="text-orange-500" size={20}/> Tes Kraepelin (Koran)
            </h3>
            {kraepelin ? (
              <div className="space-y-4">
                {/* Interpretasi Umum */}
                {kraepelin.scores?.interpretation && (
                  <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-center">
                    <p className="text-xs text-blue-600 font-extrabold uppercase tracking-wider mb-1">Interpretasi Umum</p>
                    <p className="text-sm text-blue-900 italic">"{kraepelin.scores.interpretation}"</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                  {/* 1. CEPAT (Produktivitas / Panker) */}
                  <div className="bg-amber-50 border border-amber-100 p-5 rounded-xl relative overflow-hidden">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-amber-600" />
                      <span className="text-[11px] font-bold uppercase text-gray-500">CEPAT (Produktivitas)</span>
                    </div>
                    {/* Menggunakan panker dengan fallback kecepatan agar data lama tetap muncul */}
                    <p className="font-black text-3xl text-amber-900 mt-2">
                      {kraepelin.scores?.panker ?? kraepelin.scores?.kecepatan ?? "-"}
                    </p>
                    {kraepelin.scores?.gradeSpeed && (
                      <div className={`mt-2 text-[10px] font-bold px-2 py-1 rounded w-fit mx-auto border ${getBadgeClass(kraepelin.scores.gradeSpeed)}`}>
                        {kraepelin.scores.gradeSpeed}
                      </div>
                    )}
                  </div>

                  {/* 2. TELITI (Ketelitian / totalErrors) */}
                  <div className="bg-red-50 border border-red-100 p-5 rounded-xl relative overflow-hidden">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span className="text-[11px] font-bold uppercase text-gray-500">TELITI (Ketelitian)</span>
                    </div>
                    {/* Menggunakan totalErrors dengan fallback salah */}
                    <p className="font-black text-3xl text-red-900 mt-2">
                      {kraepelin.scores?.totalErrors ?? kraepelin.scores?.salah ?? "-"}
                    </p>
                    {kraepelin.scores?.gradeAccuracy && (
                      <div className={`mt-2 text-[10px] font-bold px-2 py-1 rounded w-fit mx-auto border ${getBadgeClass(kraepelin.scores.gradeAccuracy)}`}>
                        {kraepelin.scores.gradeAccuracy}
                      </div>
                    )}
                  </div>

                  {/* 3. TAHAN (Ketahanan / Hanker - Hasil Auto-Healing) */}
                  <div className="bg-purple-50 border border-purple-100 p-5 rounded-xl relative overflow-hidden">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-purple-600" />
                      <span className="text-[11px] font-bold uppercase text-gray-500">TAHAN (Ketahanan)</span>
                    </div>
                    {/* Hanker sekarang sudah diisi oleh utility kraepelinHealer */}
                    <p className="font-black text-3xl text-purple-900 mt-2">
                      {kraepelin.scores?.hanker ?? "-"}
                    </p>
                    {kraepelin.scores?.gradeEndurance && (
                      <div className={`mt-2 text-[10px] font-bold px-2 py-1 rounded w-fit mx-auto border ${getBadgeClass(kraepelin.scores.gradeEndurance)}`}>
                        {kraepelin.scores.gradeEndurance}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">Belum ada data atau Kandidat belum menyelesaikan tes Kraepelin.</p>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
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
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-white shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
            Tutup
          </button>
          <button onClick={handleDownloadPDF} disabled={isGeneratingPDF} className={`px-4 py-2.5 text-sm font-bold text-white rounded-lg flex items-center gap-2 transition-colors shadow-sm ${isGeneratingPDF ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
            <Download size={16} /> Sertifikat Psikotes
          </button>
          <button onClick={handleDownloadFinalReport} disabled={isGeneratingPDF} className={`px-4 py-2.5 text-sm font-bold text-white rounded-lg flex items-center gap-2 transition-colors shadow-sm ${isGeneratingPDF ? 'bg-teal-400 cursor-not-allowed' : 'bg-teal-700 hover:bg-teal-800'}`}>
            <Download size={16} /> Final Report (Wawancara)
          </button>
        </div>
      </div>
      
      <div style={{ position: 'absolute', left: '-9999px', top: 0, width: '210mm' }}>
        <TestReportPDF ref={pdfRef} data={pdfData as any} />
      </div>

      <div style={{ position: 'absolute', left: '-9999px', top: 0, width: '210mm' }}>
        <div ref={finalReportRef}>
          <CandidateFinalReport 
              candidateId={candidate.id} 
              candidateName={candidate.fullName}
              candidateNik={candidate.nik_ktp || candidate.id}
              jobPosition={candidate.top_position}
              evaluations={evaluations}  
              submissions={candSubs} 
          />
        </div>
      </div>
    </div>
  );
});
TestResultModal.displayName = 'TestResultModal';


// ==========================================
// MAIN PAGE COMPONENT
// ==========================================
export default function CandidateJourneyPage() {
  const params = useParams()
  const router = useRouter()
  const candidateId = params.id as string
  
  const [journey, setJourney] = useState<JourneyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  
  const [selectedStage, setSelectedStage] = useState('')
  const [notes, setNotes] = useState('')
  const [actorName, setActorName] = useState('HR Admin')

  const [manpowerList, setManpowerList] = useState<any[]>([])
  const [selectedManpower, setSelectedManpower] = useState('')
  
  const [docType, setDocType] = useState<'offering' | 'ticket' | 'mcu'>('offering')
  const [docFile, setDocFile] = useState<File | null>(null)
  const [uploadNotes, setUploadNotes] = useState('')
  const [uploadLoading, setUploadLoading] = useState(false)
  
  const [whatsappLink, setWhatsappLink] = useState<string | null>(null)
  
  useEffect(() => {
    fetchJourney()
  }, [candidateId])

  useEffect(() => {
    const isHired = selectedStage.toLowerCase() === 'hired' || selectedStage === 'Offer Accepted';
    if (isHired) {
      fetchVacantManpower()
    } else {
      setSelectedManpower('') 
    }
  }, [selectedStage])

  const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem("hr_token");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const fetchVacantManpower = async () => {
    try {
      const headers = getAuthHeaders();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/manpower/vacant`, { headers });
      
      if (res.ok) {
        const data = await res.json();
        setManpowerList(data);
      }
    } catch (error) {
      toast.error("Gagal memuat formasi Manpower yang kosong.");
    }
  }
  
  const fetchJourney = async () => {
    try {
      const candidateData = await getCandidateApplications(candidateId);
      if (!candidateData.applications || candidateData.applications.length === 0) {
        setJourney(null);
        return;
      }
      const applicationId = candidateData.applications[0].id;
      const data = await getJourneyTimeline(applicationId);

      // =====================================================================
      // LOGIKA AUTO-HEALING YANG SUDAH DISIMPLIFIKASI (MENGGUNAKAN UTILS)
      // =====================================================================
      if (data.history) {
        data.history = data.history.map((item: any) => {
          // Gunakan utility untuk menghitung Hanker dan mapping key secara otomatis
          return healKraepelinSubmission(item);
        });
      }

      setJourney(data);
      
      // Pastikan state submissions juga terisi data yang sudah di-heal untuk Modal
      if (data.history) {
        setSubmissions(data.history.filter((h: any) => h.test_type));
      }

    } catch (error: any) {
      console.error('Error fetching journey:', error);
      setJourney(null);
    } finally {
      setLoading(false);
    }
  };
  
  const handleStageUpdate = async () => {
    if (!journey || !selectedStage) {
      toast.warning('Peringatan', { description: 'Silakan pilih tahap (stage) terlebih dahulu' })
      return
    }
    
    if (isRejectionStage(selectedStage) && !notes.trim()) {
      toast.warning('Peringatan', { description: 'Catatan/alasan wajib diisi untuk tahap penolakan' })
      return
    }

    const isHired = selectedStage.toLowerCase() === 'hired' || selectedStage === 'Offer Accepted';
    if (isHired && !selectedManpower) {
      toast.warning('Peringatan', { description: 'Silakan pilih Slot Manpower untuk kandidat yang diterima!' })
      return
    }
    
    setActionLoading(true)
    
    const updateTask = async () => {
      try {
        if (!journey?.application_id) throw new Error('ID Aplikasi tidak ditemukan')
        
        const result = await updateStage({
          application_id: journey.application_id,
          new_stage: selectedStage,
          notes: notes.trim(),
          actor_name: actorName,
          ...(isHired && selectedManpower ? { manpower_id: selectedManpower } : {})
        })
        
        if (result.whatsapp_link) {
          setWhatsappLink(result.whatsapp_link)
          window.open(result.whatsapp_link, '_blank')
        }
        
        setSelectedStage('')
        setNotes('')
        setSelectedManpower('')
        await fetchJourney()

        return result.message || 'Tahap kandidat berhasil diperbarui!'
      } finally {
        setActionLoading(false)
      }
    }

    toast.promise(updateTask(), {
      loading: 'Memperbarui tahap...',
      success: (msg) => msg,
      error: (err) => err.message || 'Gagal memperbarui tahap.',
    })
  }
  
  const handleDocumentUpload = async () => {
    if (!docFile) {
      toast.warning('Peringatan', { description: 'Silakan pilih file dokumen terlebih dahulu' })
      return
    }
    
    setUploadLoading(true)

    const uploadTask = async () => {
      try {
        if (!journey?.application_id) throw new Error('ID Aplikasi tidak ditemukan')
        
        const result = await uploadDocument(journey.application_id, docType, docFile, uploadNotes)
        
        if (result.whatsapp_link) {
          setWhatsappLink(result.whatsapp_link)
          window.open(result.whatsapp_link, '_blank')
        }
        
        setDocFile(null)
        setUploadNotes('')
        await fetchJourney()

        return result.message || 'Dokumen berhasil diunggah!'
      } finally {
        setUploadLoading(false)
      }
    }

    toast.promise(uploadTask(), {
      loading: 'Mengunggah dokumen...',
      success: (msg) => msg,
      error: (err) => err.message || 'Gagal mengunggah dokumen.',
    })
  }
  
  const copyWhatsAppLink = () => {
    if (whatsappLink) {
      navigator.clipboard.writeText(whatsappLink)
      toast.success('Disalin!', { description: 'Link WhatsApp berhasil disalin ke clipboard.' })
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <Sidebar />
        <div className="lg:ml-64 min-h-screen flex flex-col">
          <Header title="Journey Loading..." subtitle="" />
          <main className="flex-1 flex items-center justify-center p-8">
            <Loader2 className="animate-spin text-[var(--primary)]" size={48} />
          </main>
          <Footer />
        </div>
      </div>
    )
  }
  
  if (!journey) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <Sidebar />
        <div className="lg:ml-64 min-h-screen flex flex-col">
          <Header title="Journey Not Available" subtitle="" />
          <main className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="text-orange-600" size={48} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">No Recruitment Journey Yet</h2>
              <p className="text-slate-600 mb-6">
                Kandidat ini belum memiliki <strong>job application</strong> aktif. 
                Recruitment journey hanya tersedia setelah kandidat di-assign ke job position.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-bold text-blue-900 mb-2">📋 Langkah selanjutnya:</h3>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Buka halaman Candidates</li>
                  <li>Assign kandidat ke job position yang sesuai</li>
                  <li>Journey tracking akan otomatis tersedia</li>
                </ol>
              </div>
              
              <button 
                onClick={() => router.push('/candidates')} 
                className="mt-4 px-6 py-3 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-700)] font-semibold shadow-md transition-all"
              >
                Back to Candidates
              </button>
            </div>
          </main>
          <Footer />
        </div>
      </div>
    )
  }
  
  const allowedNext = getAllowedNextStages(journey.current_stage)
  const isTerminal = isTerminalStage(journey.current_stage)
  const progress = getProgressPercentage(journey.current_stage)
  const papiScores = (journey as any)?.papi_scores || (journey as any)?.metadata?.papi_scores || null;
  
  return (
    <div className="min-h-screen bg-[var(--background)] flex">
      <Sidebar />
      <div className="lg:ml-64 flex-1 flex flex-col min-h-screen min-w-0">
        <Header 
          title="Recruitment Journey"
          subtitle={`${journey.candidate_name} - ${journey.job_title}`}
        />
        
        <main className="p-4 md:p-8 flex-1">
          <button
            onClick={() => router.push('/candidates')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 font-medium"
          >
            <ChevronLeft size={20} />
            Back to Candidates
          </button>
          
          <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-[var(--primary-100)] flex items-center justify-center text-[var(--primary-700)] text-2xl font-bold">
                {journey.candidate_name.charAt(0)}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">{journey.candidate_name}</h2>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 mt-1">
                  <p className="text-gray-600 flex items-center gap-2 text-sm font-medium">
                    <Briefcase size={16} className="text-gray-400" />
                    {journey.job_title}
                  </p>
                  <p className="text-gray-600 flex items-center gap-2 text-sm font-medium">
                    <CreditCard size={16} className="text-gray-400" />
                    NIK: {(journey as any).nik_ktp || (journey as any).candidate_nik || 'Tidak ada data'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mb-2 mt-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-semibold text-gray-700">Overall Progress</span>
                <span className="text-sm font-bold text-[var(--primary)]">{progress}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div 
                  className="bg-[var(--primary)] h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            
            <div className="mt-4">
              <span className={`inline-block px-4 py-2 rounded-lg font-bold text-sm border-2 ${getStageColor(journey.current_stage)}`}>
                Current: {RecruitmentStages[journey.current_stage as keyof typeof RecruitmentStages]}
              </span>
            </div>
          </div>
          
          <div className="flex flex-col xl:flex-row gap-6">
            <div className="flex-1 flex flex-col gap-6">
              
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                    <TrendingUp className="text-[var(--primary)]" size={22} />
                    Journey Timeline
                  </h2>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 font-medium">Current Stage</p>
                    <p className="text-sm font-bold text-[var(--primary)]">
                      {RecruitmentStages[journey.current_stage as keyof typeof RecruitmentStages]}
                    </p>
                  </div>
                </div>
                
                <JourneyTimeline 
                  currentStage={journey.current_stage}
                  history={journey.history}
                />
              </div>

              {papiScores && Object.keys(papiScores).length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                  <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                    <BrainCircuit className="text-purple-600" size={22} />
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Hasil PAPI Kostick</h2>
                      <p className="text-xs text-gray-500 font-medium">Profil Kepribadian & Gaya Kerja Kandidat</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-4">
                    {Object.entries(papiScores)
                      .sort((a, b) => (b[1] as number) - (a[1] as number))
                      .map(([trait, score], i) => {
                        const numericScore = Number(score);
                        return (
                          <div key={i} className="flex flex-col border-b border-dashed border-gray-200 pb-3">
                            <div className="flex justify-between items-center mb-1.5">
                              <div className="text-sm font-bold text-gray-800">
                                <span className="text-purple-700 mr-1.5">[{trait}]</span> 
                                {getPapiTraitName(trait)}
                              </div>
                              <div className="text-xs font-bold text-purple-800 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded shadow-sm">
                                Skor: {numericScore}
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 italic">
                              Interpretasi: "{getPapiInterpretation(trait, numericScore)}"
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>
              )}

            </div>
            
            <div className="w-full xl:w-[400px] space-y-4 flex-shrink-0">
              {!isTerminal && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-3">
                    <TrendingUp className="text-blue-600" size={20} />
                    <div>
                      <h3 className="font-bold text-gray-900">Next Stage</h3>
                      <p className="text-xs text-gray-500">Move candidate forward</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Select Stage</label>
                      <select
                        value={selectedStage}
                        onChange={(e) => setSelectedStage(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] font-medium text-sm transition-all"
                      >
                        <option value="">Choose stage...</option>
                        {allowedNext.map(stage => (
                          <option key={stage} value={stage}>
                            {RecruitmentStages[stage as keyof typeof RecruitmentStages]}
                          </option>
                        ))}
                      </select>
                    </div>

                    {(selectedStage.toLowerCase() === 'hired' || selectedStage === 'Offer Accepted') && (
                      <div className="animate-in fade-in slide-in-from-top-2 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                        <label className="block text-xs font-bold text-emerald-700 mb-2 uppercase tracking-wide">
                          Slot Manpower (Wajib) <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={selectedManpower}
                          onChange={(e) => setSelectedManpower(e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-medium text-sm transition-all"
                        >
                          <option value="">-- Pilih Formasi Kosong --</option>
                          {manpowerList.map(slot => (
                            <option key={slot.id} value={slot.id}>
                              {slot.position_title} ({slot.level}) - Dept: {slot.department}
                            </option>
                          ))}
                        </select>
                        {manpowerList.length === 0 ? (
                          <p className="text-xs text-red-500 mt-2 font-medium">⚠️ Tidak ada slot kosong.</p>
                        ) : (
                          <p className="text-xs text-emerald-600 mt-2 font-medium">✓ {manpowerList.length} formasi tersedia</p>
                        )}
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">
                        Notes {isRejectionStage(selectedStage) && <span className="text-red-500">*</span>}
                      </label>
                      <textarea
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] text-sm resize-none transition-all"
                        placeholder={isRejectionStage(selectedStage) ? 'Reason required for rejection' : 'Optional notes...'}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Actor</label>
                      <input
                        type="text"
                        value={actorName}
                        onChange={(e) => setActorName(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] text-sm transition-all"
                        placeholder="e.g. Sarah (HR)"
                      />
                    </div>
                    
                    <button
                      onClick={handleStageUpdate}
                      disabled={actionLoading || !selectedStage}
                      className="w-full bg-[var(--primary)] text-white rounded-xl py-3.5 font-bold hover:bg-[var(--primary-700)] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2"
                    >
                      {actionLoading && <Loader2 className="animate-spin" size={18} />}
                      {actionLoading ? 'Updating...' : 'Update Stage'}
                    </button>
                  </div>
                </div>
              )}
              
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4 border-b border-gray-100 pb-3">
                  <Upload size={16} className="text-orange-600" />
                  <h3 className="font-bold text-gray-900 text-sm">Upload Document</h3>
                </div>
                
                <div className="space-y-3">
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm transition-all"
                  >
                    <option value="offering">Offering Letter</option>
                    <option value="ticket">Flight Ticket</option>
                    <option value="mcu">MCU Results</option>
                  </select>
                  
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm transition-all"
                  />
                  {docFile && <p className="text-xs text-gray-500 truncate">📎 {docFile.name}</p>}
                  
                  <input
                    type="text"
                    value={uploadNotes}
                    onChange={(e) => setUploadNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm transition-all"
                    placeholder="Optional notes..."
                  />
                  
                  <button
                    onClick={handleDocumentUpload}
                    disabled={uploadLoading || !docFile}
                    className="w-full bg-orange-500 text-white rounded-lg py-2.5 font-bold hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                  >
                    {uploadLoading && <Loader2 className="animate-spin" size={16} />}
                    {uploadLoading ? 'Uploading...' : 'Upload File'}
                  </button>
                </div>
                
                {journey.metadata && Object.keys(journey.metadata).some(k => k.endsWith('_url')) && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                    <p className="text-xs font-bold text-gray-500 uppercase">Uploaded Files:</p>
                    {Object.entries(journey.metadata).filter(([k]) => k.endsWith('_url')).map(([key, url]) => (
                      <a
                        key={key}
                        href={`${process.env.NEXT_PUBLIC_API_BASE_URL}${url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <Download size={12} />
                        {key.replace('_url', '').toUpperCase()}
                      </a>
                    ))}
                  </div>
                )}
              </div>
              
              {whatsappLink && (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Send size={16} className="text-green-700" />
                    <h4 className="font-bold text-green-900 text-sm">WhatsApp Ready</h4>
                  </div>
                  <button
                    onClick={copyWhatsAppLink}
                    className="w-full bg-green-600 text-white rounded-lg py-2 font-bold hover:bg-green-700 text-sm mb-2 transition-colors shadow-sm"
                  >
                    Copy Link
                  </button>
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-white text-green-700 border border-green-200 rounded-lg py-2 font-bold hover:bg-green-100 text-sm text-center transition-colors"
                  >
                    Open WhatsApp
                  </a>
                </div>
              )}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  )
}