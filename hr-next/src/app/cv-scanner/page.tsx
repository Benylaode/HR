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
} from "lucide-react";

// Backend API URL - pastikan Flask backend berjalan di port 5000
const API_BASE_URL = "http://localhost:5000";

// Posisi yang tersedia untuk matching
const availablePositions = [
  {
    id: 1,
    title: "Frontend Developer",
    department: "Engineering",
    requirements: ["React", "JavaScript", "TypeScript", "CSS", "HTML"],
    skills: ["Frontend", "UI/UX", "Web Development"],
    experience: "2+ years",
    salary: "8-15M",
    level: "Mid-Senior",
    description: "Membangun antarmuka pengguna yang responsif dan interaktif menggunakan React, TypeScript, dan teknologi frontend modern.",
  },
  {
    id: 2,
    title: "Backend Developer",
    department: "Engineering",
    requirements: ["Node.js", "Python", "Database", "API", "REST"],
    skills: ["Backend", "Database", "API Development"],
    experience: "3+ years",
    salary: "10-20M",
    level: "Mid-Senior",
    description: "Mengembangkan server-side logic, database, dan API untuk aplikasi skala enterprise.",
  },
  {
    id: 3,
    title: "Full Stack Developer",
    department: "Engineering",
    requirements: ["JavaScript", "React", "Node.js", "Database", "API"],
    skills: ["Full Stack", "Frontend", "Backend"],
    experience: "4+ years",
    salary: "12-25M",
    level: "Senior",
    description: "Mengembangkan aplikasi end-to-end dari frontend hingga backend.",
  },
  {
    id: 4,
    title: "Data Scientist",
    department: "Data",
    requirements: ["Python", "Machine Learning", "Statistics", "SQL", "Data Analysis"],
    skills: ["Data Science", "ML", "Analytics"],
    experience: "3+ years",
    salary: "15-30M",
    level: "Senior",
    description: "Menganalisis data besar dan membangun model machine learning untuk insights bisnis.",
  },
  {
    id: 5,
    title: "Product Manager",
    department: "Product",
    requirements: ["Product Strategy", "Agile", "Analytics", "Leadership", "Communication"],
    skills: ["Product Management", "Strategy", "Leadership"],
    experience: "5+ years",
    salary: "20-35M",
    level: "Senior",
    description: "Memimpin pengembangan produk dari ideasi hingga peluncuran.",
  },
  {
    id: 6,
    title: "UI/UX Designer",
    department: "Design",
    requirements: ["Figma", "Adobe XD", "Design Thinking", "Prototyping", "User Research"],
    skills: ["UI Design", "UX Design", "Prototyping"],
    experience: "2+ years",
    salary: "7-12M",
    level: "Mid",
    description: "Merancang pengalaman pengguna yang intuitif dan estetis.",
  },
  {
    id: 7,
    title: "DevOps Engineer",
    department: "Engineering",
    requirements: ["Docker", "Kubernetes", "AWS", "CI/CD", "Linux"],
    skills: ["DevOps", "Cloud", "Infrastructure"],
    experience: "3+ years",
    salary: "12-22M",
    level: "Senior",
    description: "Mengelola infrastruktur cloud dan pipeline CI/CD.",
  },
  {
    id: 8,
    title: "Business Analyst",
    department: "Business",
    requirements: ["SQL", "Excel", "Business Analysis", "Communication", "Problem Solving"],
    skills: ["Business Analysis", "Data Analysis", "Requirements Gathering"],
    experience: "2+ years",
    salary: "8-15M",
    level: "Mid",
    description: "Menganalisis kebutuhan bisnis dan menerjemahkannya menjadi solusi teknis.",
  },
];

interface PositionMatch {
  position: { title: string; department: string; salary: string; level: string };
  matchScore: number;
  skillMatch: number;
  experienceMatch: number;
  reasons: string[];
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
  const [currentStep, setCurrentStep] = useState<Step>("select-job");
  const [selectedPosition, setSelectedPosition] = useState<(typeof availablePositions)[0] | null>(null);
  const [candidates, setCandidates] = useState<CVCandidate[]>([]);
  const [processing, setProcessing] = useState(false);
  const [processingText, setProcessingText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<CVCandidate | null>(null);
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking");

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

  useEffect(() => {
    const userData = localStorage.getItem("hr_user");
    if (!userData) {
      router.push("/");
      return;
    }
    setUser(JSON.parse(userData));
    checkBackendStatus();
    loadCandidatesFromDB();
  }, [router, checkBackendStatus]);

  // Load candidates dari database backend
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

  // Upload CV ke backend dan proses dengan LLM
  const handleFileUpload = async (files: File[]) => {
    if (!selectedPosition) return;
    
    if (backendStatus === "offline") {
      setError("Backend tidak tersedia. Pastikan Flask server berjalan di port 5000.");
      return;
    }

    setProcessing(true);
    setError(null);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProcessingText(`Mengupload ${file.name} (${i + 1}/${files.length})...`);

      try {
        // Step 1: Upload CV ke backend
        const formData = new FormData();
        formData.append("file", file);

        const uploadRes = await fetch(`${API_BASE_URL}/screening/upload_resume`, {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          throw new Error(`Gagal upload file: ${file.name}`);
        }

        const uploadData = await uploadRes.json();
        const resumeId = uploadData.id;

        setProcessingText(`Menganalisis ${file.name} dengan AI... (${i + 1}/${files.length})`);

        // Step 2: Match CV dengan posisi menggunakan LLM
        const matchRes = await fetch(`${API_BASE_URL}/screening/match_resume`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            resume_id: resumeId,
            job_description: `${selectedPosition.title} - ${selectedPosition.description} Requirements: ${selectedPosition.requirements.join(", ")}`,
          }),
        });

        if (!matchRes.ok) {
          throw new Error(`Gagal match CV: ${file.name}`);
        }

        const matchData = await matchRes.json();
        console.log("Match result:", matchData);

        // Refresh candidates list
        await loadCandidatesFromDB();

      } catch (err) {
        console.error("Error processing file:", err);
        setError(`Gagal memproses ${file.name}: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    }

    setProcessing(false);
    setProcessingText("");
    setCurrentStep("results");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type === "application/pdf");
    if (files.length > 0) handleFileUpload(files);
  };

  // Filter candidates by selected position
  const filteredCandidates = candidates
    .filter((c) => {
      if (!selectedPosition) return true;
      return c.top_position === selectedPosition.title;
    })
    .filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => (b.match_score || 0) - (a.match_score || 0));

  // Leaderboard - top 5
  const leaderboard = filteredCandidates.slice(0, 5);

  const stats = {
    total: filteredCandidates.length,
    highMatch: filteredCandidates.filter((c) => c.match_score >= 80).length,
    avgScore: filteredCandidates.length > 0
      ? Math.round(filteredCandidates.reduce((sum, c) => sum + (c.match_score || 0), 0) / filteredCandidates.length)
      : 0,
  };

  // Delete candidate
  const deleteCandidate = async (id: string) => {
    // For now, just remove from local state
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
          onRefresh={loadCandidatesFromDB}
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

          {backendStatus === "online" && (
            <div className="bg-green-50 border border-green-200 p-3 mb-6 flex items-center gap-2">
              <CheckCircle className="text-green-600 w-5 h-5" />
              <span className="text-green-700 text-sm">Backend terhubung - LLM siap menganalisis CV</span>
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

          {/* Header */}
          <div className="bg-white shadow border border-gray-200 p-6 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">CV Scanner</h2>
                <p className="text-gray-600">Upload CV pelamar dan sistem AI akan menemukan kandidat terbaik</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setCurrentStep("select-job");
                    setSelectedPosition(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center"
                >
                  <Trash2 size={18} className="mr-2" /> Reset
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 flex items-center">
                  <Download size={18} className="mr-2" /> Export
                </button>
              </div>
            </div>

            {/* Steps Indicator */}
            <div className="flex items-center gap-4 mt-6">
              <div className={`flex items-center gap-2 ${currentStep === "select-job" ? "text-blue-600 font-medium" : "text-gray-400"}`}>
                <div className={`w-8 h-8 flex items-center justify-center ${currentStep === "select-job" ? "bg-blue-600 text-white" : "bg-gray-200"}`}>
                  1
                </div>
                <span>Pilih Posisi</span>
              </div>
              <ChevronRight className="text-gray-300" />
              <div className={`flex items-center gap-2 ${currentStep === "upload" ? "text-blue-600 font-medium" : "text-gray-400"}`}>
                <div className={`w-8 h-8 flex items-center justify-center ${currentStep === "upload" ? "bg-blue-600 text-white" : "bg-gray-200"}`}>
                  2
                </div>
                <span>Upload CV</span>
              </div>
              <ChevronRight className="text-gray-300" />
              <div className={`flex items-center gap-2 ${currentStep === "results" ? "text-blue-600 font-medium" : "text-gray-400"}`}>
                <div className={`w-8 h-8 flex items-center justify-center ${currentStep === "results" ? "bg-blue-600 text-white" : "bg-gray-200"}`}>
                  3
                </div>
                <span>Hasil & Leaderboard</span>
              </div>
            </div>
          </div>

          {/* Step 1: Select Job Position */}
          {currentStep === "select-job" && (
            <div className="bg-white shadow border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Pilih Posisi yang Dicari</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {availablePositions.map((pos) => (
                  <div
                    key={pos.id}
                    onClick={() => {
                      setSelectedPosition(pos);
                      setCurrentStep("upload");
                    }}
                    className={`p-4 border-2 cursor-pointer transition-all hover:border-blue-500 hover:bg-blue-50 ${
                      selectedPosition?.id === pos.id ? "border-blue-600 bg-blue-50" : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <Briefcase className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{pos.title}</h4>
                        <p className="text-sm text-gray-500">{pos.department}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          <span className="text-xs bg-gray-100 px-2 py-0.5">{pos.level}</span>
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5">{pos.salary}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Upload CV */}
          {currentStep === "upload" && selectedPosition && (
            <>
              {/* Selected Position Info */}
              <div className="bg-blue-50 border border-blue-200 p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Briefcase className="text-blue-600" />
                    <div>
                      <p className="text-sm text-blue-600">Mencari kandidat untuk:</p>
                      <p className="font-semibold text-blue-900">{selectedPosition.title}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setCurrentStep("select-job")}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Ganti Posisi
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-xs text-blue-700">Requirements:</span>
                  {selectedPosition.requirements.map((req, i) => (
                    <span key={i} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5">{req}</span>
                  ))}
                </div>
              </div>

              {/* Upload Area */}
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
                  <p className="text-gray-500 mb-4">Drag & drop PDF files atau klik untuk browse</p>
                  <p className="text-sm text-gray-400">Support: PDF (Max 10MB per file)</p>
                  <p className="text-sm text-blue-600 mt-2">CV akan dianalisis oleh AI Llama 3.3 70B</p>
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

              {/* Processing Status */}
              {processing && (
                <div className="bg-blue-50 border border-blue-200 p-4 mt-6 flex items-center gap-3">
                  <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                  <div>
                    <p className="text-blue-800 font-medium">Memproses CV dengan AI...</p>
                    <p className="text-blue-600 text-sm">{processingText}</p>
                  </div>
                </div>
              )}

              {/* Skip to results if data exists */}
              {candidates.filter((c) => c.top_position === selectedPosition.title).length > 0 && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => setCurrentStep("results")}
                    className="text-blue-600 hover:underline"
                  >
                    Lihat {candidates.filter((c) => c.top_position === selectedPosition.title).length} kandidat yang sudah ada →
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
                  <div>
                    <p className="text-gray-500 text-sm">Total Kandidat</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <div className="bg-white shadow border border-gray-200 p-6 flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">High Match (≥80%)</p>
                    <p className="text-2xl font-bold text-green-600">{stats.highMatch}</p>
                  </div>
                  <Star className="w-8 h-8 text-green-600" />
                </div>
                <div className="bg-white shadow border border-gray-200 p-6 flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Rata-rata Score</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.avgScore}%</p>
                  </div>
                  <Target className="w-8 h-8 text-purple-600" />
                </div>
                <div className="bg-white shadow border border-gray-200 p-6 flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Posisi</p>
                    <p className="text-lg font-bold text-orange-600">{selectedPosition.title}</p>
                  </div>
                  <Briefcase className="w-8 h-8 text-orange-600" />
                </div>
              </div>

              {/* Leaderboard */}
              <div className="bg-white shadow border border-gray-200 p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                  <h3 className="text-lg font-semibold text-gray-900">🏆 Leaderboard - Top 5 Kandidat</h3>
                </div>
                <div className="space-y-3">
                  {leaderboard.map((candidate, index) => (
                    <div
                      key={candidate.id}
                      className={`flex items-center justify-between p-4 cursor-pointer hover:shadow-md transition-shadow ${
                        index === 0 ? "bg-yellow-50 border border-yellow-200" :
                        index === 1 ? "bg-gray-50 border border-gray-200" :
                        index === 2 ? "bg-orange-50 border border-orange-200" :
                        "bg-gray-50 border border-gray-100"
                      }`}
                      onClick={() => setSelectedCandidate(candidate)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 flex items-center justify-center font-bold text-lg ${
                          index === 0 ? "bg-yellow-400 text-yellow-900" :
                          index === 1 ? "bg-gray-400 text-white" :
                          index === 2 ? "bg-orange-400 text-white" :
                          "bg-gray-200 text-gray-600"
                        }`}>
                          {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{candidate.name}</p>
                          <p className="text-sm text-gray-500">{candidate.education} • {candidate.experience}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${
                            candidate.match_score >= 90 ? "text-green-600" :
                            candidate.match_score >= 80 ? "text-blue-600" :
                            "text-gray-600"
                          }`}>
                            {candidate.match_score}%
                          </div>
                          <p className="text-xs text-gray-500">Match Score</p>
                        </div>
                        <Eye className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  ))}
                  {leaderboard.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      Belum ada kandidat untuk posisi ini. Upload CV untuk memulai.
                    </div>
                  )}
                </div>
              </div>

              {/* All Candidates Table */}
              <div className="bg-white shadow border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Semua Kandidat</h3>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Cari nama..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 w-64 focus:outline-none focus:border-blue-500"
                      />
                    </div>
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kandidat</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pendidikan</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pengalaman</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredCandidates.map((candidate, index) => (
                        <tr key={candidate.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`font-bold ${
                              index < 3 ? "text-yellow-600" : "text-gray-500"
                            }`}>#{index + 1}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">{candidate.name}</div>
                            <div className="text-sm text-gray-500">{candidate.email}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{candidate.education || "-"}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{candidate.experience || "-"}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-lg font-bold ${
                              candidate.match_score >= 80 ? "text-green-600" : "text-gray-600"
                            }`}>
                              {candidate.match_score}%
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button 
                              onClick={() => setSelectedCandidate(candidate)}
                              className="text-blue-600 hover:underline text-sm mr-3"
                            >
                              Detail
                            </button>
                            <button 
                              onClick={() => deleteCandidate(candidate.id)}
                              className="text-red-600 hover:underline text-sm"
                            >
                              Hapus
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredCandidates.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      Tidak ada kandidat yang ditemukan.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Candidate Detail Modal */}
          {selectedCandidate && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-700 p-6 text-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold">{selectedCandidate.name}</h2>
                      <p className="text-blue-100 mt-1">Kandidat untuk {selectedCandidate.top_position}</p>
                    </div>
                    <button
                      onClick={() => setSelectedCandidate(null)}
                      className="text-white/80 hover:text-white"
                    >
                      <X size={24} />
                    </button>
                  </div>
                  <div className="mt-4 flex items-center gap-4">
                    <div className="bg-white/20 px-4 py-2">
                      <span className="text-3xl font-bold">{selectedCandidate.match_score}%</span>
                      <span className="text-sm ml-2">Match Score</span>
                    </div>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-6">
                  {/* Contact Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 border">
                      <Mail className="text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="text-sm font-medium">{selectedCandidate.email || "Tidak tersedia"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 border">
                      <Phone className="text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Telepon</p>
                        <p className="text-sm font-medium">{selectedCandidate.phone || "Tidak tersedia"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Education & Experience */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border">
                      <div className="flex items-center gap-2 mb-2">
                        <GraduationCap className="text-blue-600" />
                        <h4 className="font-semibold text-gray-900">Pendidikan</h4>
                      </div>
                      <p className="text-gray-700">{selectedCandidate.education || "Tidak tersedia"}</p>
                    </div>
                    <div className="p-4 border">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="text-green-600" />
                        <h4 className="font-semibold text-gray-900">Pengalaman</h4>
                      </div>
                      <p className="text-gray-700">{selectedCandidate.experience || "Tidak tersedia"}</p>
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="p-4 border">
                    <div className="flex items-center gap-2 mb-3">
                      <Award className="text-purple-600" />
                      <h4 className="font-semibold text-gray-900">Skills</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(selectedCandidate.skills || []).map((skill, i) => (
                        <span key={i} className="bg-blue-50 text-blue-700 px-3 py-1 text-sm">
                          {skill}
                        </span>
                      ))}
                      {(!selectedCandidate.skills || selectedCandidate.skills.length === 0) && (
                        <span className="text-gray-500">Tidak ada data skills</span>
                      )}
                    </div>
                  </div>

                  {/* AI Verdict */}
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="text-blue-600" />
                      <h4 className="font-semibold text-gray-900">Analisis AI</h4>
                    </div>
                    <p className="text-gray-700 leading-relaxed">
                      {selectedCandidate.verdict || "Belum ada analisis dari AI."}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button className="flex-1 bg-green-600 text-white py-3 hover:bg-green-700 flex items-center justify-center gap-2">
                      <CheckCircle size={20} /> Jadwalkan Interview
                    </button>
                    <button className="flex-1 border border-gray-300 py-3 hover:bg-gray-50 flex items-center justify-center gap-2">
                      <Download size={20} /> Download CV
                    </button>
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
