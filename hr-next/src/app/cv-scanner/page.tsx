"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import {
  CloudUpload,
  FileText,
  CheckCircle,
  Star,
  Briefcase,
  Search,
  Trash2,
  Download,
  Trophy,
  Users,
  Target,
  ChevronRight,
  X,
  Mail,
  Phone,
  GraduationCap,
  Clock,
  Award,
  Loader2,
  AlertCircle,
  Eye,
  RefreshCw,
  Zap,
  Check
} from "lucide-react";

// Backend API URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const MAX_FILES_BATCH = 5; // Batas upload bersamaan

interface JobPosition {
  id: string;
  title: string;
  department: string;
  requirements: string[];
  required_skills?: string[];
  job_description: string;
  level: string;
  salary: {
    min: number;
    max: number;
    currency: string;
  };
  formattedSalary?: string; 
}

interface CVCandidate {
  id: string;
  resume_id: string;
  name: string;
  email: string;
  phone: string;
  education: string;
  experience: string;
  skills: string[];
  top_position: string;
  match_score: number;
  verdict: string;
  created_at: string;
  fileName?: string;
}

type Step = "select-job" | "upload" | "results";

export default function CVScannerPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  
  // State Data
  const [availablePositions, setAvailablePositions] = useState<JobPosition[]>([]);
  const [candidates, setCandidates] = useState<CVCandidate[]>([]);
  
  // UI State
  const [currentStep, setCurrentStep] = useState<Step>("select-job");
  const [selectedPosition, setSelectedPosition] = useState<JobPosition | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processingText, setProcessingText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<CVCandidate | null>(null);
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking");
  const [loadingJobs, setLoadingJobs] = useState(false);

    const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem("hr_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};
  const checkBackendStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/screening/candidates`, { headers: getAuthHeaders() });
      if (res.ok) {
        setBackendStatus("online");
        return true;
      }
    } catch {
      setBackendStatus("offline");
    }
    return false;
  }, []);

  // Fetch Job Positions
  const loadJobPositions = useCallback(async () => {
    setLoadingJobs(true);
    try {
      const res = await fetch(`${API_BASE_URL}/job-positions?status=active&available=true`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Gagal mengambil data posisi pekerjaan");
      
      const data = await res.json();
      const formattedData = data.map((job: JobPosition) => ({
        ...job,
        formattedSalary: job.salary.min && job.salary.max 
          ? `${(job.salary.min / 1000000).toFixed(0)}-${(job.salary.max / 1000000).toFixed(0)}M`
          : "Negotiable"
      }));

      setAvailablePositions(formattedData);
    } catch (err) {
      console.error("Error loading jobs:", err);
      setError("Gagal memuat daftar pekerjaan. Pastikan backend berjalan.");
    } finally {
      setLoadingJobs(false);
    }
  }, []);

  useEffect(() => {
    const userData = localStorage.getItem("hr_user");
    if (!userData) {
      router.push("/");
      return;
    }
    setUser(JSON.parse(userData));
    checkBackendStatus();
    loadJobPositions();
    loadCandidatesFromDB();
  }, [router, checkBackendStatus, loadJobPositions]);

  // Load candidates
  const loadCandidatesFromDB = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/screening/candidates`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch candidates");
      const data = await res.json();
      setCandidates(data);
      setBackendStatus("online");
    } catch (err) {
      console.error("Backend tidak tersedia:", err);
      setBackendStatus("offline");
      setCandidates([]);
    }
  };

  // --- LOGIKA UTAMA: PROSES PARALEL UNTUK 5 FILE ---
  const processSingleFile = async (file: File, index: number, total: number) => {
    try {
      // 1. Upload
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch(`${API_BASE_URL}/screening/upload_resume`, {
        method: "POST",
        body: formData,
        headers: getAuthHeaders(),
      });

      if (!uploadRes.ok) throw new Error(`Gagal upload: ${file.name}`);
      const uploadData = await uploadRes.json();
      const resumeId = uploadData.id;

      // 2. Match
      const matchRes = await fetch(`${API_BASE_URL}/screening/match_resume`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          resume_id: resumeId,
          job_id: selectedPosition?.id,
          job_description: selectedPosition?.job_description, // Fallback context
        }),
      });

      if (!matchRes.ok) throw new Error(`Gagal analisis: ${file.name}`);
      return { success: true, file: file.name };

    } catch (err) {
      console.error(err);
      return { success: false, file: file.name, error: err instanceof Error ? err.message : "Unknown error" };
    }
  };

  const handleFileUpload = async (files: File[]) => {
    if (!selectedPosition) return;

    if (backendStatus === "offline") {
      setError("Backend tidak tersedia. Pastikan Flask server berjalan di port 5000.");
      return;
    }

    // Validasi maksimal 5 file
    if (files.length > MAX_FILES_BATCH) {
      setError(`Maksimal ${MAX_FILES_BATCH} file yang dapat diupload sekaligus.`);
      return;
    }

    setProcessing(true);
    setError(null);
    setProcessingText(`Memproses ${files.length} CV secara bersamaan...`);

    try {
      // Jalankan semua proses upload & match secara PARALEL (Bersamaan)
      const results = await Promise.all(files.map((file, i) => processSingleFile(file, i, files.length)));

      // Cek hasil
      const failed = results.filter(r => !r.success);
      const succeeded = results.filter(r => r.success);

      await loadCandidatesFromDB(); // Refresh data

      if (failed.length > 0) {
        setError(`Selesai dengan catatan: ${failed.length} file gagal diproses (${failed.map(f => f.file).join(", ")}).`);
      } else {
        setProcessingText(`Sukses! ${succeeded.length} CV berhasil diproses.`);
        // Beri jeda sedikit agar user bisa membaca status sukses sebelum pindah halaman
        setTimeout(() => {
            setCurrentStep("results");
        }, 1000);
        return; // Jangan langsung setProcessing false agar loading state tetap ada sebentar
      }

    } catch (err) {
      console.error("Batch processing error:", err);
      setError("Terjadi kesalahan saat memproses batch file.");
    }

    setProcessing(false);
    if (!error) setCurrentStep("results");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type === "application/pdf");
    if (files.length > 0) handleFileUpload(files);
  };

  const filteredCandidates = candidates
    .filter((c) => {
      if (!selectedPosition) return true;
      return c.top_position === selectedPosition.title;
    })
    .filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => (b.match_score || 0) - (a.match_score || 0));

  const leaderboard = filteredCandidates.slice(0, 5);

  const stats = {
    total: filteredCandidates.length,
    highMatch: filteredCandidates.filter((c) => c.match_score >= 80).length,
    avgScore: filteredCandidates.length > 0
      ? Math.round(filteredCandidates.reduce((sum, c) => sum + (c.match_score || 0), 0) / filteredCandidates.length)
      : 0,
  };

  const deleteCandidate = async (id: string) => {
    setCandidates((prev) => prev.filter((c) => c.id !== id));
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar />
      <div className="lg:ml-64 min-h-screen flex flex-col">
        <Header 
          title="CV Scanner" 
          subtitle="AI-powered resume screening and matching"
          onRefresh={() => { loadJobPositions(); loadCandidatesFromDB(); }}
        />
        <main className="p-4 md:p-8 flex-1">
          {/* Backend Status */}
          {backendStatus === "offline" && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
              <AlertCircle className="text-red-600" />
              <div>
                <p className="text-red-800 font-bold">Backend Tidak Tersedia</p>
                <p className="text-red-600 text-sm">
                  Pastikan Flask server berjalan: <code className="bg-red-100 px-2 py-0.5 rounded">cd Backend && python run.py</code>
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="text-red-600" />
                <p className="text-red-700 font-medium">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
                <X size={20} />
              </button>
            </div>
          )}

          {/* Header & Steps */}
          <div className="card-static bg-white border border-[var(--secondary-200)] p-6 mb-8 rounded-2xl">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h2 className="text-xl font-bold text-[var(--primary-900)] flex items-center gap-2">
                   <Zap className="text-[var(--primary)]" size={24}/> AI CV Scanner
                </h2>
                <p className="text-[var(--secondary)] mt-1">Upload CV pelamar dan biarkan AI menemukan kandidat terbaik.</p>
              </div>
              <button
                onClick={() => { setCurrentStep("select-job"); setSelectedPosition(null); }}
                className="px-4 py-2 border border-[var(--secondary-200)] text-[var(--secondary-600)] hover:bg-[var(--secondary-50)] rounded-lg flex items-center transition-colors text-sm font-medium"
              >
                <Trash2 size={16} className="mr-2" /> Reset Process
              </button>
            </div>

            <div className="flex items-center gap-2 md:gap-4 mt-8 overflow-x-auto pb-2">
              <div className={`flex items-center gap-3 ${currentStep === "select-job" ? "text-[var(--primary)] font-bold" : "text-[var(--secondary)]"}`}>
                <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm ${currentStep === "select-job" ? "bg-[var(--primary)] text-white" : "bg-[var(--secondary-100)] text-[var(--secondary-500)]"}`}>1</div>
                <span className="whitespace-nowrap">Pilih Posisi</span>
              </div>
              <ChevronRight className="text-[var(--secondary-200)]" size={16} />
              <div className={`flex items-center gap-3 ${currentStep === "upload" ? "text-[var(--primary)] font-bold" : "text-[var(--secondary)]"}`}>
                <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm ${currentStep === "upload" ? "bg-[var(--primary)] text-white" : "bg-[var(--secondary-100)] text-[var(--secondary-500)]"}`}>2</div>
                <span className="whitespace-nowrap">Upload CV</span>
              </div>
              <ChevronRight className="text-[var(--secondary-200)]" size={16} />
              <div className={`flex items-center gap-3 ${currentStep === "results" ? "text-[var(--primary)] font-bold" : "text-[var(--secondary)]"}`}>
                <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm ${currentStep === "results" ? "bg-[var(--primary)] text-white" : "bg-[var(--secondary-100)] text-[var(--secondary-500)]"}`}>3</div>
                <span className="whitespace-nowrap">Hasil Analisis</span>
              </div>
            </div>
          </div>

          {/* Step 1: Select Job Position */}
          {currentStep === "select-job" && (
            <div className="card-static bg-white border border-[var(--secondary-200)] p-4 md:p-6 rounded-2xl">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <h3 className="text-lg font-bold text-[var(--primary-900)]">Pilih Posisi yang Dicari</h3>
                <button onClick={loadJobPositions} className="text-[var(--primary)] hover:bg-[var(--primary-50)] p-2 rounded-full transition-colors self-end md:self-auto">
                  <RefreshCw size={20} className={loadingJobs ? "animate-spin" : ""} />
                </button>
              </div>

              {loadingJobs ? (
                 <div className="text-center py-16 text-[var(--secondary)]">
                    <Loader2 className="w-8 h-8 mx-auto animate-spin mb-3 text-[var(--primary)]" />
                    Memuat daftar pekerjaan...
                 </div>
              ) : availablePositions.length === 0 ? (
                <div className="text-center py-16 bg-[var(--secondary-50)] border border-dashed border-[var(--secondary-200)] rounded-xl">
                  <Briefcase className="w-12 h-12 text-[var(--secondary-300)] mx-auto mb-3" />
                  <p className="text-[var(--primary-900)] font-bold">Belum ada posisi pekerjaan yang aktif.</p>
                  <p className="text-sm text-[var(--secondary)] mt-1">Buat posisi baru di menu Job Positions.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {availablePositions.map((pos) => (
                    <div
                      key={pos.id}
                      onClick={() => { setSelectedPosition(pos); setCurrentStep("upload"); }}
                      className={`p-5 border rounded-xl cursor-pointer transition-all hover:shadow-md group ${
                        selectedPosition?.id === pos.id 
                        ? "border-[var(--primary)] bg-[var(--primary-50)] ring-1 ring-[var(--primary)]" 
                        : "border-[var(--secondary-200)] hover:border-[var(--primary-300)] hover:bg-white"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-[var(--primary-100)] rounded-lg flex items-center justify-center flex-shrink-0 text-[var(--primary)]">
                          <Briefcase className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-[var(--primary-900)] truncate pr-2 group-hover:text-[var(--primary)] transition-colors">{pos.title}</h4>
                          <p className="text-xs text-[var(--secondary)] mt-0.5">{pos.department}</p>
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            <span className="text-[10px] uppercase font-bold bg-white border border-[var(--secondary-200)] text-[var(--secondary-600)] px-2 py-0.5 rounded">{pos.level}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Upload CV */}
          {currentStep === "upload" && selectedPosition && (
            <>
              <div className="bg-[var(--primary-50)] border border-[var(--primary-100)] p-5 rounded-xl mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[var(--primary)] rounded-lg flex items-center justify-center text-white shadow-sm flex-shrink-0">
                     <Briefcase size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[var(--primary-600)] uppercase tracking-wide">Selected Position</p>
                    <p className="font-bold text-[var(--primary-900)] text-lg">{selectedPosition.title}</p>
                  </div>
                </div>
                <button onClick={() => setCurrentStep("select-job")} className="text-[var(--primary)] hover:text-[var(--primary-800)] text-sm font-medium hover:underline w-full sm:w-auto text-left sm:text-right">
                  Ganti Posisi
                </button>
              </div>

              <div className="card-static bg-white border border-[var(--secondary-200)] p-4 md:p-8 rounded-2xl">
                <div
                  className={`border-2 border-dashed rounded-2xl p-8 md:p-16 text-center cursor-pointer transition-all ${
                    dragOver 
                    ? "border-[var(--primary)] bg-[var(--primary-50)] scale-[0.99]" 
                    : "border-[var(--secondary-200)] hover:border-[var(--primary-300)] hover:bg-[var(--secondary-50)]"
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById("fileInput")?.click()}
                >
                  <div className="w-20 h-20 bg-[var(--primary-50)] rounded-full flex items-center justify-center mx-auto mb-6 text-[var(--primary)]">
                    <CloudUpload className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-[var(--primary-900)] mb-3">Upload CV Pelamar</h3>
                  <p className="text-[var(--secondary)] mb-6 max-w-md mx-auto text-sm md:text-base">Drag & drop files here or click to browse. Supported format: PDF.</p>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--secondary-100)] rounded-full text-xs font-medium text-[var(--secondary-600)]">
                    <CheckCircle size={12} /> Max {MAX_FILES_BATCH} files concurrent
                  </div>
                  
                  <input
                    type="file"
                    id="fileInput"
                    multiple
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) handleFileUpload(Array.from(e.target.files));
                    }}
                  />
                </div>
              </div>

              {processing && (
                <div className="bg-white border border-[var(--primary-200)] p-6 mt-6 rounded-xl shadow-lg flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4">
                  <div className="relative">
                    <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
                  </div>
                  <div>
                    <p className="text-[var(--primary-900)] font-bold mb-1">Sedang Menganalisis...</p>
                    <p className="text-[var(--secondary)] text-sm">{processingText}</p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Step 3: Results & Leaderboard */}
          {currentStep === "results" && selectedPosition && (
            <>
              {/* Stats - Responsive Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white border border-[var(--secondary-200)] p-5 rounded-xl shadow-sm">
                   <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[var(--secondary)] text-xs font-bold uppercase tracking-wide mb-1">Total Kandidat</p>
                        <p className="text-3xl font-bold text-[var(--primary-900)]">{stats.total}</p>
                      </div>
                      <Users className="w-8 h-8 text-[var(--primary-200)]" />
                   </div>
                </div>
                <div className="bg-white border border-[var(--secondary-200)] p-5 rounded-xl shadow-sm">
                   <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[var(--secondary)] text-xs font-bold uppercase tracking-wide mb-1">High Match (&gt;80%)</p>
                        <p className="text-3xl font-bold text-green-600">{stats.highMatch}</p>
                      </div>
                      <Star className="w-8 h-8 text-green-100 text-green-600" />
                   </div>
                </div>
                <div className="bg-white border border-[var(--secondary-200)] p-5 rounded-xl shadow-sm">
                   <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[var(--secondary)] text-xs font-bold uppercase tracking-wide mb-1">Rata-rata Skor</p>
                        <p className="text-3xl font-bold text-[var(--primary)]">{stats.avgScore}%</p>
                      </div>
                      <Target className="w-8 h-8 text-[var(--primary-200)]" />
                   </div>
                </div>
                <div className="bg-[var(--primary-900)] text-white p-5 rounded-xl shadow-sm relative overflow-hidden">
                   <div className="flex justify-between items-start relative z-10">
                      <div>
                        <p className="text-[var(--primary-200)] text-xs font-bold uppercase tracking-wide mb-1">Posisi Aktif</p>
                        <p className="text-xl font-bold text-white line-clamp-1">{selectedPosition.title}</p>
                      </div>
                      <Briefcase className="w-8 h-8 text-[var(--primary-400)]" />
                   </div>
                   <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-[var(--primary-700)] rounded-full opacity-50 blur-xl"></div>
                </div>
              </div>

              {/* Leaderboard - Responsive List */}
              <div className="bg-white border border-[var(--secondary-200)] rounded-2xl p-4 md:p-6 mb-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[var(--secondary-100)]">
                  <div className="p-2 bg-yellow-100 rounded-lg text-yellow-600">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-[var(--primary-900)]">Top 5 Candidates Leaderboard</h3>
                </div>
                
                <div className="space-y-3">
                  {leaderboard.map((candidate, index) => (
                    <div
                      key={candidate.id}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl cursor-pointer transition-all border gap-4 ${
                        index === 0 
                        ? "bg-gradient-to-r from-yellow-50 to-white border-yellow-200 shadow-sm" 
                        : "bg-white border-[var(--secondary-200)] hover:border-[var(--primary-200)] hover:shadow-md"
                      }`}
                      onClick={() => setSelectedCandidate(candidate)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 flex items-center justify-center font-bold text-sm rounded-full flex-shrink-0 ${
                          index === 0 ? "bg-yellow-400 text-yellow-900 shadow-yellow-200" : 
                          index === 1 ? "bg-gray-300 text-gray-800" :
                          index === 2 ? "bg-orange-300 text-orange-900" :
                          "bg-[var(--secondary-100)] text-[var(--secondary-600)]"
                        }`}>
                          #{index + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-[var(--primary-900)] text-lg truncate">{candidate.name}</p>
                          <p className="text-sm text-[var(--secondary)] flex flex-wrap gap-2">
                             <span className="flex items-center gap-1"><GraduationCap size={12}/> {candidate.education || "-"}</span>
                             <span className="hidden sm:inline text-[var(--secondary-300)]">•</span>
                             <span className="flex items-center gap-1"><Clock size={12}/> {candidate.experience || "-"}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:block sm:text-right border-t sm:border-0 border-[var(--secondary-100)] pt-3 sm:pt-0">
                         <span className="text-sm font-bold text-[var(--secondary-500)] sm:hidden">Score:</span>
                         <div>
                            <span className={`text-2xl font-bold ${candidate.match_score >= 80 ? "text-green-600" : "text-[var(--primary)]"}`}>
                              {candidate.match_score}%
                            </span>
                            <p className="hidden sm:block text-[10px] uppercase font-bold text-[var(--secondary-400)]">Match Score</p>
                         </div>
                      </div>
                    </div>
                  ))}
                  {leaderboard.length === 0 && (
                    <div className="text-center py-8 text-[var(--secondary)]">Belum ada kandidat yang dianalisis.</div>
                  )}
                </div>
              </div>

              {/* All Candidates Table / Card View */}
              <div className="bg-white border border-[var(--secondary-200)] rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 md:p-6 border-b border-[var(--secondary-100)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[var(--background)]">
                  <h3 className="text-lg font-bold text-[var(--primary-900)]">Semua Kandidat</h3>
                  <div className="w-full md:w-auto flex flex-col md:flex-row items-stretch md:items-center gap-3">
                    <div className="relative">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--secondary-400)]" size={16} />
                       <input
                         type="text"
                         placeholder="Cari nama..."
                         value={searchQuery}
                         onChange={(e) => setSearchQuery(e.target.value)}
                         className="pl-9 pr-4 py-2 border border-[var(--secondary-200)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)] w-full md:w-56 transition-all"
                       />
                    </div>
                    <button
                      onClick={() => setCurrentStep("upload")}
                      className="px-4 py-2 bg-[var(--primary)] text-white hover:bg-[var(--primary-700)] rounded-lg text-sm font-bold flex items-center justify-center shadow-sm"
                    >
                      <CloudUpload size={16} className="mr-2" /> Upload Lagi
                    </button>
                  </div>
                </div>
                
                {/* Desktop View (Table) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[var(--secondary-50)] border-b border-[var(--secondary-100)]">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-[var(--secondary-500)] uppercase tracking-wide">Kandidat</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-[var(--secondary-500)] uppercase tracking-wide">Match Score</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-[var(--secondary-500)] uppercase tracking-wide">Status AI</th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-[var(--secondary-500)] uppercase tracking-wide">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--secondary-5)]">
                      {filteredCandidates.map((candidate) => (
                        <tr key={candidate.id} className="hover:bg-[var(--primary-50)]/30 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="font-bold text-[var(--primary-900)] group-hover:text-[var(--primary)] transition-colors">{candidate.name}</div>
                            <div className="text-xs text-[var(--secondary)] flex items-center gap-1 mt-0.5"><Mail size={12}/> {candidate.email}</div>
                          </td>
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-2">
                                <div className="w-full max-w-[80px] h-2 bg-[var(--secondary-100)] rounded-full overflow-hidden">
                                   <div className={`h-full rounded-full ${candidate.match_score >= 80 ? 'bg-green-500' : 'bg-[var(--primary)]'}`} style={{ width: `${candidate.match_score}%` }}></div>
                                </div>
                                <span className={`text-sm font-bold ${candidate.match_score >= 80 ? "text-green-600" : "text-[var(--primary-700)]"}`}>{candidate.match_score}%</span>
                             </div>
                          </td>
                           <td className="px-6 py-4">
                              <span className="text-xs text-[var(--secondary)] line-clamp-1 max-w-[200px]">{candidate.verdict?.substring(0, 50)}...</span>
                           </td>
                          <td className="px-6 py-4 text-right">
                            <button onClick={() => setSelectedCandidate(candidate)} className="text-[var(--primary)] hover:text-[var(--primary-700)] text-sm font-medium mr-4 hover:underline">Detail</button>
                            <button onClick={() => deleteCandidate(candidate.id)} className="text-[var(--secondary-400)] hover:text-red-600 text-sm font-medium hover:underline">Hapus</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View (Cards) */}
                <div className="md:hidden divide-y divide-[var(--secondary-100)]">
                    {filteredCandidates.map(candidate => (
                        <div key={candidate.id} className="p-4" onClick={() => setSelectedCandidate(candidate)}>
                           <div className="flex justify-between mb-2">
                               <div className="font-bold text-[var(--primary-900)]">{candidate.name}</div>
                               <span className={`text-sm font-bold ${candidate.match_score >= 80 ? "text-green-600" : "text-[var(--primary)]"}`}>{candidate.match_score}%</span>
                           </div>
                           <div className="text-xs text-[var(--secondary)] mb-3 flex items-center gap-2">
                              <Mail size={10} /> {candidate.email}
                           </div>
                           <div className="bg-[var(--secondary-50)] p-2 rounded-lg text-xs text-[var(--secondary-600)] mb-3 line-clamp-2 italic">
                              "{candidate.verdict}"
                           </div>
                           <div className="flex gap-2">
                              <button onClick={(e) => { e.stopPropagation(); setSelectedCandidate(candidate); }} className="flex-1 py-2 bg-[var(--primary-50)] text-[var(--primary)] text-xs font-bold rounded-lg">Detail</button>
                              <button onClick={(e) => { e.stopPropagation(); deleteCandidate(candidate.id); }} className="flex-1 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-lg">Hapus</button>
                           </div>
                        </div>
                    ))}
                </div>

                {filteredCandidates.length === 0 && (
                   <div className="p-8 text-center text-[var(--secondary)]">Tidak ada kandidat ditemukan dengan filter ini.</div>
                )}
              </div>
            </>
          )}

          {/* Candidate Detail Modal */}
          {selectedCandidate && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setSelectedCandidate(null)}>
              <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl rounded-2xl border border-[var(--secondary-200)] relative animate-in zoom-in-95 duration-200 flex flex-col" onClick={e => e.stopPropagation()}>
                
                {/* Modal Header */}
                <div className="bg-[var(--primary-900)] p-4 md:p-6 text-white relative overflow-hidden flex-shrink-0">
                  <div className="relative z-10 flex justify-between items-start">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 md:w-16 md:h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center text-xl md:text-2xl font-bold border border-white/20">
                         {selectedCandidate.name.charAt(0)}
                      </div>
                      <div>
                        <h2 className="text-xl md:text-2xl font-bold line-clamp-1">{selectedCandidate.name}</h2>
                        <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 mt-1 text-[var(--primary-100)] text-xs md:text-sm">
                           <span className="flex items-center gap-1"><Briefcase size={14}/> {selectedCandidate.top_position}</span>
                           <span className="hidden md:inline">•</span>
                           <span className="px-2 py-0.5 bg-white/20 rounded text-white font-bold w-fit">{selectedCandidate.match_score}% Match</span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setSelectedCandidate(null)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white">
                       <X size={20} />
                    </button>
                  </div>
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--primary-600)] rounded-full mix-blend-multiply filter blur-3xl opacity-20 -mr-16 -mt-16"></div>
                </div>

                <div className="p-4 md:p-6 space-y-6 flex-1 overflow-y-auto">
                  {/* AI Verdict */}
                  <div className="p-5 bg-[var(--primary-50)] border border-[var(--primary-100)] rounded-xl relative">
                     <div className="absolute top-4 right-4 text-[var(--primary-300)] opacity-20"><Zap size={48} /></div>
                     <h4 className="font-bold text-[var(--primary-900)] mb-2 flex items-center gap-2">
                        <Zap size={18} className="text-[var(--primary)]" /> Analisis AI
                     </h4>
                     <p className="text-[var(--secondary-700)] text-sm leading-relaxed">{selectedCandidate.verdict}</p>
                  </div>

                  {/* Contact Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border border-[var(--secondary-200)] rounded-xl bg-gray-50/50">
                       <p className="text-xs font-bold text-[var(--secondary-500)] uppercase tracking-wide mb-1 flex items-center gap-1"><Mail size={12}/> Email</p>
                       <p className="font-medium text-[var(--primary-900)] text-sm break-all">{selectedCandidate.email}</p>
                    </div>
                    <div className="p-4 border border-[var(--secondary-200)] rounded-xl bg-gray-50/50">
                       <p className="text-xs font-bold text-[var(--secondary-500)] uppercase tracking-wide mb-1 flex items-center gap-1"><Phone size={12}/> Phone</p>
                       <p className="font-medium text-[var(--primary-900)] text-sm">{selectedCandidate.phone || "-"}</p>
                    </div>
                  </div>

                  {/* Skills */}
                  <div>
                    <h4 className="font-bold text-[var(--primary-900)] mb-3 text-sm uppercase tracking-wide">Detected Skills</h4>
                    <div className="flex flex-wrap gap-2">
                       {(selectedCandidate.skills || []).map((s, i) => (
                          <span key={i} className="bg-white border border-[var(--secondary-200)] px-3 py-1.5 text-sm rounded-lg text-[var(--secondary-700)] font-medium shadow-sm">
                             {s}
                          </span>
                       ))}
                       {(!selectedCandidate.skills || selectedCandidate.skills.length === 0) && (
                          <p className="text-[var(--secondary-400)] text-sm italic">Tidak ada skill khusus terdeteksi.</p>
                       )}
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border-t border-[var(--secondary-100)] bg-gray-50 rounded-b-2xl flex justify-end flex-shrink-0">
                   <button onClick={() => setSelectedCandidate(null)} className="w-full md:w-auto px-5 py-2.5 bg-white border border-[var(--secondary-200)] hover:bg-[var(--secondary-50)] text-[var(--secondary-700)] font-medium rounded-xl shadow-sm transition-colors">
                      Tutup Detail
                   </button>
                </div>
              </div>
            </div>
          )}
        </main>
        <Footer />
      </div>
    </div>
  );
}