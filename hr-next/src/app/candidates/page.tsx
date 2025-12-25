"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
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
  Filter 
} from "lucide-react";

// API Config
// const API_BASE_URL = "http://localhost:5000";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;


// Interface Data
interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  top_position: string;
  status: string;      // e.g. "Interview", "Pending"
  test_status: string; // e.g. "Active", "Completed"
  created_at: string;
  match_score: number;
}

interface JobPosition {
  id: string;
  title: string;
}

export default function CandidatesPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  
  // State Data Real
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<JobPosition[]>([]); // [BARU] List Job
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [jobFilter, setJobFilter] = useState("all"); // [BARU] Job Filter

  // Auth & Load Initial Data
  useEffect(() => {
    const userData = localStorage.getItem("hr_user");
    if (!userData) {
      router.push("/");
      return;
    }
    setUser(JSON.parse(userData));
    
    // Load Data
    fetchCandidates();
    fetchJobs();
  }, [router]);

  // Fetch Data Kandidat
  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/candidates`);
      
      if (!res.ok) throw new Error("Gagal mengambil data kandidat");
      
      const data = await res.json();
      setCandidates(data);
    } catch (err) {
      console.error(err);
      setError("Gagal menghubungkan ke server.");
    } finally {
      setLoading(false);
    }
  };

  // [BARU] Fetch Daftar Pekerjaan untuk Filter
  const fetchJobs = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/job-positions?status=active`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      }
    } catch (err) {
      console.error("Gagal mengambil data pekerjaan:", err);
    }
  };

  // Delete Handler
  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus kandidat ini?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/candidates/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setCandidates(prev => prev.filter(c => c.id !== id));
      } else {
        alert("Gagal menghapus data.");
      }
    } catch (err) {
      alert("Terjadi kesalahan saat menghapus.");
    }
  };

  // Filter Logic (Frontend Side)
  const filteredCandidates = candidates.filter((c) => {
    const searchLower = searchQuery.toLowerCase();
    
    // 1. Filter Search
    const matchesSearch =
      c.name.toLowerCase().includes(searchLower) ||
      c.email.toLowerCase().includes(searchLower);
      
    // 2. Filter Status
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    
    // 3. [BARU] Filter Job Position
    // Karena c.top_position adalah string judul, kita bandingkan dengan job title
    const matchesJob = jobFilter === "all" || c.top_position === jobFilter;
    
    return matchesSearch && matchesStatus && matchesJob;
  });

  // Badge Helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Screening": return "bg-blue-100 text-blue-800 border-blue-200";
      case "Interview": return "bg-purple-100 text-purple-800 border-purple-200";
      case "Hired": return "bg-green-100 text-green-800 border-green-200";
      case "Rejected": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTestBadge = (status: string) => {
    if (status === "Completed") return "text-green-600 bg-green-50 border-green-100";
    if (status === "Active") return "text-blue-600 bg-blue-50 border-blue-100";
    return "text-gray-500 bg-gray-50 border-gray-100";
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:ml-64">
        <Header 
          title="Candidates" 
          subtitle="Manage job applicants and their test results"
          userName={user.name} 
          userEmail={user.email}
        />
        <main className="p-6">
          
          {/* Header Actions */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Database Kandidat</h2>
              <p className="text-sm text-gray-600">Total {candidates.length} kandidat terdaftar</p>
            </div>
            <button 
              onClick={() => router.push('/cv-scanner')} 
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus size={18} /> Add Candidate (CV Scanner)
            </button>
          </div>

          {/* Filters Section */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              
              {/* Search Bar */}
              <div className="relative flex-1 w-full">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari nama atau email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              {/* [BARU] Filter Job Position */}
              <div className="w-full md:w-auto flex items-center gap-2">
                <Briefcase size={18} className="text-gray-400 hidden md:block" />
                <select
                  value={jobFilter}
                  onChange={(e) => setJobFilter(e.target.value)}
                  className="w-full md:w-56 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
                >
                  <option value="all">Semua Posisi Pekerjaan</option>
                  {jobs.map((job) => (
                    <option key={job.id} value={job.title}>
                      {job.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Status */}
              <div className="w-full md:w-auto flex items-center gap-2">
                <Filter size={18} className="text-gray-400 hidden md:block" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
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

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg flex items-center gap-3 mb-6 text-red-700">
              <AlertCircle size={20} />
              <p>{error}</p>
            </div>
          )}

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-gray-500">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
                Memuat data kandidat...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Kandidat</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Posisi / Skor</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Test Status</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tanggal Apply</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredCandidates.map((candidate) => (
                      <tr key={candidate.id} className="hover:bg-blue-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                              {candidate.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{candidate.name}</p>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Mail size={12} />
                                <span className="truncate max-w-[150px]">{candidate.email}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900 flex items-center gap-1">
                              <Briefcase size={14} className="text-gray-400"/> {candidate.top_position || "Unassigned"}
                            </span>
                            <span className={`text-xs mt-1 ${candidate.match_score >= 80 ? 'text-green-600 font-bold' : 'text-gray-500'}`}>
                              Match: {candidate.match_score}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadge(candidate.status)}`}>
                            {candidate.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getTestBadge(candidate.test_status)}`}>
                            {candidate.test_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(candidate.created_at).toLocaleDateString("id-ID", {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="Lihat Detail">
                              <Eye size={18} />
                            </button>
                            <button className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors" title="Edit">
                              <Edit size={18} />
                            </button>
                            <button 
                              onClick={() => handleDelete(candidate.id)}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors" 
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

                {filteredCandidates.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <Search size={48} className="text-gray-300 mb-4" />
                    <p className="font-medium">Tidak ada kandidat yang ditemukan.</p>
                    <p className="text-sm">Coba ubah filter pencarian Anda.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}