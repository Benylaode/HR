"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
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
  RefreshCw
} from "lucide-react";

// Backend API URL
// const API_BASE_URL = "http://localhost:5000";
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

  // Check backend status
  const checkBackendStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/screening/candidates`);
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
      const res = await fetch(`${API_BASE_URL}/job-positions?status=active&available=true`);
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
      const res = await fetch(`${API_BASE_URL}/screening/candidates`);
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
      });

      if (!uploadRes.ok) throw new Error(`Gagal upload: ${file.name}`);
      const uploadData = await uploadRes.json();
      const resumeId = uploadData.id;

      // 2. Match
      const matchRes = await fetch(`${API_BASE_URL}/screening/match_resume`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:ml-64">
        <Header 
          title="CV Scanner" 
          subtitle="Upload CV dan temukan kandidat terbaik dengan AI"
          userName={user.name}
          userEmail={user.email}
          onRefresh={() => { loadJobPositions(); loadCandidatesFromDB(); }}
        />
        <main className="p-6">
          {/* Backend Status */}
          {backendStatus === "offline" && (
            <div className="bg-red-50 border border-red-200 p-4 mb-6 flex items-center gap-3">
              <AlertCircle className="text-red-600" />
              <div>
                <p className="text-red-800 font-medium">Backend Tidak Tersedia</p>
                <p className="text-red-600 text-sm">
                  Pastikan Flask server berjalan: <code className="bg-red-100 px-2 py-0.5">cd Backend && python run.py</code>
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 p-4 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="text-red-600" />
                <p className="text-red-700">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
                <X size={20} />
              </button>
            </div>
          )}

          {/* Header & Steps */}
          <div className="bg-white shadow border border-gray-200 p-6 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">CV Scanner</h2>
                <p className="text-gray-600">Upload CV pelamar dan sistem AI akan menemukan kandidat terbaik</p>
              </div>
              <button
                onClick={() => { setCurrentStep("select-job"); setSelectedPosition(null); }}
                className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center"
              >
                <Trash2 size={18} className="mr-2" /> Reset
              </button>
            </div>

            <div className="flex items-center gap-4 mt-6">
              <div className={`flex items-center gap-2 ${currentStep === "select-job" ? "text-blue-600 font-medium" : "text-gray-400"}`}>
                <div className={`w-8 h-8 flex items-center justify-center ${currentStep === "select-job" ? "bg-blue-600 text-white" : "bg-gray-200"}`}>1</div>
                <span>Pilih Posisi</span>
              </div>
              <ChevronRight className="text-gray-300" />
              <div className={`flex items-center gap-2 ${currentStep === "upload" ? "text-blue-600 font-medium" : "text-gray-400"}`}>
                <div className={`w-8 h-8 flex items-center justify-center ${currentStep === "upload" ? "bg-blue-600 text-white" : "bg-gray-200"}`}>2</div>
                <span>Upload CV</span>
              </div>
              <ChevronRight className="text-gray-300" />
              <div className={`flex items-center gap-2 ${currentStep === "results" ? "text-blue-600 font-medium" : "text-gray-400"}`}>
                <div className={`w-8 h-8 flex items-center justify-center ${currentStep === "results" ? "bg-blue-600 text-white" : "bg-gray-200"}`}>3</div>
                <span>Hasil</span>
              </div>
            </div>
          </div>

          {/* Step 1: Select Job Position */}
          {currentStep === "select-job" && (
            <div className="bg-white shadow border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Pilih Posisi yang Dicari</h3>
                <button onClick={loadJobPositions} className="text-blue-600 hover:bg-blue-50 p-2 rounded-full">
                  <RefreshCw size={20} className={loadingJobs ? "animate-spin" : ""} />
                </button>
              </div>

              {loadingJobs ? (
                 <div className="text-center py-10 text-gray-500">
                    <Loader2 className="w-8 h-8 mx-auto animate-spin mb-2" />
                    Memuat daftar pekerjaan...
                 </div>
              ) : availablePositions.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 border border-dashed border-gray-300 rounded-lg">
                  <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">Belum ada posisi pekerjaan yang aktif.</p>
                  <p className="text-sm text-gray-500 mt-1">Buat posisi baru di menu Job Positions.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {availablePositions.map((pos) => (
                    <div
                      key={pos.id}
                      onClick={() => { setSelectedPosition(pos); setCurrentStep("upload"); }}
                      className={`p-4 border-2 cursor-pointer transition-all hover:border-blue-500 hover:bg-blue-50 ${
                        selectedPosition?.id === pos.id ? "border-blue-600 bg-blue-50" : "border-gray-200"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                          <Briefcase className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 line-clamp-1">{pos.title}</h4>
                          <p className="text-sm text-gray-500">{pos.department}</p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            <span className="text-xs bg-gray-100 px-2 py-0.5">{pos.level}</span>
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5">{pos.formattedSalary}</span>
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
              <div className="bg-blue-50 border border-blue-200 p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Briefcase className="text-blue-600" />
                    <div>
                      <p className="text-sm text-blue-600">Mencari kandidat untuk:</p>
                      <p className="font-semibold text-blue-900">{selectedPosition.title}</p>
                    </div>
                  </div>
                  <button onClick={() => setCurrentStep("select-job")} className="text-blue-600 hover:underline text-sm">
                    Ganti Posisi
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(selectedPosition.requirements || []).slice(0, 5).map((req, i) => (
                    <span key={i} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5">{req}</span>
                  ))}
                </div>
              </div>

              <div className="bg-white shadow border border-gray-200 p-8">
                <div
                  className={`border-2 border-dashed p-12 text-center cursor-pointer transition-colors ${
                    dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:bg-gray-50"
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById("fileInput")?.click()}
                >
                  <CloudUpload className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Upload CV Pelamar</h3>
                  <p className="text-gray-500 mb-4">Drag & drop hingga 5 PDF files sekaligus</p>
                  <p className="text-sm text-gray-400">Support: PDF (Max {MAX_FILES_BATCH} files concurrent)</p>
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
                <div className="bg-blue-50 border border-blue-200 p-4 mt-6 flex items-center gap-3">
                  <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                  <div>
                    <p className="text-blue-800 font-medium">Sedang Menganalisis...</p>
                    <p className="text-blue-600 text-sm">{processingText}</p>
                  </div>
                </div>
              )}

              {candidates.filter((c) => c.top_position === selectedPosition.title).length > 0 && (
                <div className="mt-6 text-center">
                  <button onClick={() => setCurrentStep("results")} className="text-blue-600 hover:underline">
                    Lihat hasil yang sudah ada →
                  </button>
                </div>
              )}
            </>
          )}

          {/* Step 3: Results & Leaderboard */}
          {currentStep === "results" && selectedPosition && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-white shadow border border-gray-200 p-6 flex items-center justify-between">
                  <div><p className="text-gray-500 text-sm">Total Kandidat</p><p className="text-2xl font-bold">{stats.total}</p></div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <div className="bg-white shadow border border-gray-200 p-6 flex items-center justify-between">
                  <div><p className="text-gray-500 text-sm">High Match</p><p className="text-2xl font-bold text-green-600">{stats.highMatch}</p></div>
                  <Star className="w-8 h-8 text-green-600" />
                </div>
                <div className="bg-white shadow border border-gray-200 p-6 flex items-center justify-between">
                   <div><p className="text-gray-500 text-sm">Avg Score</p><p className="text-2xl font-bold text-purple-600">{stats.avgScore}%</p></div>
                   <Target className="w-8 h-8 text-purple-600" />
                </div>
                <div className="bg-white shadow border border-gray-200 p-6 flex items-center justify-between">
                   <div><p className="text-gray-500 text-sm">Posisi</p><p className="text-lg font-bold text-orange-600 line-clamp-1">{selectedPosition.title}</p></div>
                   <Briefcase className="w-8 h-8 text-orange-600" />
                </div>
              </div>

              {/* Leaderboard */}
              <div className="bg-white shadow border border-gray-200 p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                  <h3 className="text-lg font-semibold text-gray-900">🏆 Leaderboard - Top 5</h3>
                </div>
                <div className="space-y-3">
                  {leaderboard.map((candidate, index) => (
                    <div
                      key={candidate.id}
                      className={`flex items-center justify-between p-4 cursor-pointer hover:shadow-md transition-shadow ${
                        index === 0 ? "bg-yellow-50 border border-yellow-200" : "bg-gray-50 border border-gray-100"
                      }`}
                      onClick={() => setSelectedCandidate(candidate)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 flex items-center justify-center font-bold text-lg ${
                          index === 0 ? "bg-yellow-400 text-yellow-900" : "bg-gray-200 text-gray-600"
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{candidate.name}</p>
                          <p className="text-sm text-gray-500">{candidate.education} • {candidate.experience}</p>
                        </div>
                      </div>
                      <span className={`text-2xl font-bold ${candidate.match_score >= 80 ? "text-green-600" : "text-gray-600"}`}>
                        {candidate.match_score}%
                      </span>
                    </div>
                  ))}
                  {leaderboard.length === 0 && (
                    <div className="text-center py-8 text-gray-500">Belum ada kandidat.</div>
                  )}
                </div>
              </div>

              {/* All Candidates Table */}
              <div className="bg-white shadow border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Semua Kandidat</h3>
                  <div className="flex items-center gap-4">
                    <input
                      type="text"
                      placeholder="Cari nama..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-4 pr-4 py-2 border border-gray-300 w-64 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={() => setCurrentStep("upload")}
                      className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 flex items-center"
                    >
                      <CloudUpload size={18} className="mr-2" /> Upload Lagi
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kandidat</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredCandidates.map((candidate) => (
                        <tr key={candidate.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">{candidate.name}</div>
                            <div className="text-sm text-gray-500">{candidate.email}</div>
                          </td>
                          <td className="px-6 py-4 font-bold text-gray-700">{candidate.match_score}%</td>
                          <td className="px-6 py-4">
                            <button onClick={() => setSelectedCandidate(candidate)} className="text-blue-600 hover:underline mr-3">Detail</button>
                            <button onClick={() => deleteCandidate(candidate.id)} className="text-red-600 hover:underline">Hapus</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Candidate Detail Modal */}
          {selectedCandidate && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl rounded-lg">
                <div className="bg-gradient-to-r from-blue-600 to-purple-700 p-6 text-white flex justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedCandidate.name}</h2>
                    <p className="text-blue-100">{selectedCandidate.top_position} • {selectedCandidate.match_score}% Match</p>
                  </div>
                  <button onClick={() => setSelectedCandidate(null)} className="text-white/80 hover:text-white"><X size={24} /></button>
                </div>
                <div className="p-6 space-y-6">
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded">
                     <h4 className="font-bold text-blue-900 mb-2">Analisis AI</h4>
                     <p className="text-gray-700">{selectedCandidate.verdict}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 border rounded"><p className="text-xs text-gray-500">Email</p><p>{selectedCandidate.email}</p></div>
                    <div className="p-3 border rounded"><p className="text-xs text-gray-500">Phone</p><p>{selectedCandidate.phone}</p></div>
                  </div>
                  <div>
                    <h4 className="font-bold mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                       {(selectedCandidate.skills || []).map((s, i) => <span key={i} className="bg-gray-100 px-3 py-1 text-sm rounded">{s}</span>)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}