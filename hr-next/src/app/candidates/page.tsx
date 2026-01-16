"use client";

import { useEffect, useState, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
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
} from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

// Interfaces
interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  top_position: string;
  status: string;
  test_status: string;
  created_at: string;
  match_score: number;
}

interface CandidateDetail extends Candidate {
  resume_id?: string;
  dob?: string;
  gender?: string;
  address?: string;
  city?: string;
  summary?: string;
  total_experience_years?: number;
  current_role?: string;
  education?: Array<{ degree: string; institution: string; year?: string }>;
  experience?: Array<{ title: string; company: string; duration?: string }>;
  skills?: string[];
  certifications?: string[];
  languages?: string[];
  social_links?: Record<string, string>;
}

interface JobPosition {
  id: string;
  title: string;
}

// Detail Modal Component - Clean Design
const DetailModal = memo(({ 
  candidate, 
  onClose 
}: { 
  candidate: CandidateDetail | null; 
  onClose: () => void;
}) => {
  if (!candidate) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-xl border border-[var(--secondary-100)] transform transition-all animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[var(--secondary-100)] flex justify-between items-center bg-[var(--background)]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[var(--primary-100)] flex items-center justify-center text-lg font-bold text-[var(--primary)]">
              {candidate.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--primary-900)]">{candidate.name}</h2>
              <p className="text-sm text-[var(--secondary)]">{candidate.current_role || candidate.top_position || "Kandidat"}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--secondary-100)] rounded-full transition-colors">
            <X size={20} className="text-[var(--secondary-400)]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-160px)] space-y-6">
          {/* Contact Grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-[var(--secondary)]">
              <Mail size={16} className="text-[var(--secondary-400)]" />
              <span>{candidate.email}</span>
            </div>
            <div className="flex items-center gap-2 text-[var(--secondary)]">
              <Phone size={16} className="text-[var(--secondary-400)]" />
              <span>{candidate.phone || "-"}</span>
            </div>
            <div className="flex items-center gap-2 text-[var(--secondary)]">
              <MapPin size={16} className="text-[var(--secondary-400)]" />
              <span>{candidate.city || candidate.address || "-"}</span>
            </div>
            <div className="flex items-center gap-2 text-[var(--secondary)]">
              <Briefcase size={16} className="text-[var(--secondary-400)]" />
              <span>{candidate.total_experience_years || 0} tahun pengalaman</span>
            </div>
          </div>

          {/* Summary */}
          {candidate.summary && (
            <div className="bg-[var(--primary-50)]/50 p-4 rounded-xl border border-[var(--primary-100)]">
              <h3 className="text-xs font-bold text-[var(--primary)] uppercase tracking-wide mb-2">Summary</h3>
              <p className="text-sm text-[var(--secondary-700)] leading-relaxed">{candidate.summary}</p>
            </div>
          )}

          {/* Experience */}
          {candidate.experience && candidate.experience.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-[var(--secondary-500)] uppercase tracking-wide mb-3 pl-1 border-l-2 border-[var(--primary)]">Pengalaman Kerja</h3>
              <div className="space-y-3">
                {candidate.experience.map((exp, idx) => (
                  <div key={idx} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div>
                      <p className="text-sm font-bold text-[var(--primary-900)]">{exp.title}</p>
                      <p className="text-xs text-[var(--secondary)]">{exp.company}</p>
                    </div>
                    {exp.duration && <span className="text-xs font-medium text-[var(--secondary-400)] bg-white px-2 py-1 rounded border border-gray-100">{exp.duration}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills & Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Education */}
             {candidate.education && candidate.education.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-[var(--secondary-500)] uppercase tracking-wide mb-3">Pendidikan</h3>
                  <div className="space-y-2">
                    {candidate.education.map((edu, idx) => (
                      <div key={idx} className="text-sm">
                        <p className="font-semibold text-[var(--primary-900)]">{edu.degree}</p>
                        <p className="text-xs text-[var(--secondary)]">{edu.institution} {edu.year && `(${edu.year})`}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

             {/* Skills */}
             {candidate.skills && candidate.skills.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-[var(--secondary-500)] uppercase tracking-wide mb-3">Keahlian</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {candidate.skills.slice(0, 8).map((skill, idx) => (
                      <span key={idx} className="px-2 py-1 bg-white border border-[var(--secondary-200)] text-[var(--secondary-600)] rounded-md text-xs font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--secondary-100)] flex justify-between items-center bg-[var(--background)]">
           <div className="flex gap-4">
               <div className="flex items-center gap-2">
                 <span className="text-xs text-[var(--secondary-500)]">Match Score</span>
                 <span className={`text-sm font-bold px-2 py-0.5 rounded ${candidate.match_score >= 80 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                   {candidate.match_score}%
                 </span>
               </div>
           </div>
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-[var(--secondary-600)] hover:text-[var(--primary-700)] hover:bg-[var(--secondary-100)] rounded-lg transition-colors">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
});
DetailModal.displayName = 'DetailModal';

// Edit Modal Component
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
    name: "",
    email: "",
    phone: "",
    city: "",
    summary: "",
    current_role: "",
    total_experience_years: 0,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (candidate) {
      setFormData({
        name: candidate.name || "",
        email: candidate.email || "",
        phone: candidate.phone || "",
        city: candidate.city || "",
        summary: candidate.summary || "",
        current_role: candidate.current_role || "",
        total_experience_years: candidate.total_experience_years || 0,
      });
    }
  }, [candidate]);

  if (!candidate) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave(formData);
    setSaving(false);
  };

  const inputClass = "w-full px-3 py-2.5 bg-white border border-[var(--secondary-200)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] focus:outline-none transition-colors text-[var(--primary-900)] placeholder-[var(--secondary-300)]";
  const labelClass = "text-xs font-semibold text-[var(--secondary-500)] uppercase tracking-wide mb-1.5 block";

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden shadow-xl border border-[var(--secondary-100)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-[var(--secondary-100)] flex justify-between items-center bg-[var(--background)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--primary-50)] flex items-center justify-center">
              <Edit size={18} className="text-[var(--primary)]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--primary-900)]">Edit Kandidat</h2>
              <p className="text-xs text-[var(--secondary)]">{candidate.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--secondary-100)] rounded-full transition-colors">
            <X size={20} className="text-[var(--secondary-400)]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(85vh-160px)] space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Nama</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Telepon</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Kota</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Posisi</label>
              <input
                type="text"
                value={formData.current_role}
                onChange={(e) => setFormData({ ...formData, current_role: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Pengalaman (Tahun)</label>
              <input
                type="number"
                value={formData.total_experience_years}
                onChange={(e) => setFormData({ ...formData, total_experience_years: parseInt(e.target.value) || 0 })}
                className={inputClass}
                min="0"
              />
            </div>
          </div>
          
          <div>
            <label className={labelClass}>Ringkasan</label>
            <textarea
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              rows={3}
              className={`${inputClass} resize-none`}
              placeholder="Deskripsi singkat..."
            />
          </div>
        </form>

        <div className="px-6 py-4 border-t border-[var(--secondary-100)] flex justify-end gap-3 bg-[var(--background)]">
          <button 
            type="button"
            onClick={onClose} 
            className="px-4 py-2 text-sm font-medium text-[var(--secondary-600)] hover:text-[var(--primary-900)] hover:bg-[var(--secondary-100)] rounded-lg transition-colors"
          >
            Batal
          </button>
          <button 
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2.5 bg-[var(--primary)] text-white text-sm font-bold rounded-lg hover:bg-[var(--primary-700)] transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm"
          >
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
});
EditModal.displayName = 'EditModal';

export default function CandidatesPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  
  // State Data
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<JobPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [jobFilter, setJobFilter] = useState("all");

  // Modal States
  const [detailModal, setDetailModal] = useState<CandidateDetail | null>(null);
  const [editModal, setEditModal] = useState<CandidateDetail | null>(null);
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
  }, [router]);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/candidates`);
      if (!res.ok) throw new Error("Gagal mengambil data kandidat");
      setCandidates(await res.json());
    } catch (err) {
      setError("Gagal menghubungkan ke server.");
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/job-positions?status=active`);
      if (res.ok) setJobs(await res.json());
    } catch (err) {
      console.error("Gagal mengambil data pekerjaan:", err);
    }
  };

  // Fetch Detail Candidate
  const fetchCandidateDetail = async (id: string) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`${API_BASE_URL}/candidates/${id}`);
      if (res.ok) {
        return await res.json();
      }
      return null;
    } catch (err) {
      console.error(err);
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
    
    try {
      const res = await fetch(`${API_BASE_URL}/candidates/${editModal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setEditModal(null);
        fetchCandidates(); // Refresh list
        alert("Data kandidat berhasil diperbarui!");
      } else {
        alert("Gagal memperbarui data.");
      }
    } catch (err) {
      alert("Terjadi kesalahan.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus kandidat ini?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/candidates/${id}`, { method: "DELETE" });
      if (res.ok) {
        setCandidates(prev => prev.filter(c => c.id !== id));
      } else {
        alert("Gagal menghapus data.");
      }
    } catch (err) {
      alert("Terjadi kesalahan saat menghapus.");
    }
  };

  // Filter Logic
  const filteredCandidates = candidates.filter((c) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = c.name.toLowerCase().includes(searchLower) || c.email.toLowerCase().includes(searchLower);
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    const matchesJob = jobFilter === "all" || c.top_position === jobFilter;
    return matchesSearch && matchesStatus && matchesJob;
  });

  // Badge Helpers
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
          
          {/* Header Actions */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-[var(--primary-900)]">Database Kandidat</h2>
              <p className="text-sm text-[var(--secondary)] mt-1">Total {candidates.length} kandidat terdaftar</p>
            </div>
            <button 
              onClick={() => router.push('/cv-scanner')} 
              className="bg-[var(--primary)] text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-[var(--primary-700)] hover:shadow-lg hover:shadow-teal-500/20 transition-all active:scale-95"
            >
              <Plus size={18} /> Add Candidate
            </button>
          </div>

          {/* Filters Section */}
          <div className="card-static bg-white p-4 rounded-xl border border-[var(--secondary-200)] mb-8">
            <div className="flex flex-col md:flex-row gap-4 items-center">
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

              <div className="w-full md:w-auto flex items-center gap-2">
                <Briefcase size={18} className="text-[var(--secondary-400)] hidden md:block" />
                <select
                  value={jobFilter}
                  onChange={(e) => setJobFilter(e.target.value)}
                  className="w-full md:w-56 px-4 py-2.5 border border-[var(--secondary-200)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white cursor-pointer text-sm text-[var(--secondary-700)]"
                >
                  <option value="all">Semua Posisi Pekerjaan</option>
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
                  className="w-full md:w-48 px-4 py-2.5 border border-[var(--secondary-200)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white cursor-pointer text-sm text-[var(--secondary-700)]"
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
            <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3 mb-6 text-red-700">
              <AlertCircle size={20} />
              <p>{error}</p>
            </div>
          )}

          {/* Loading Indicator for Detail */}
          {loadingDetail && (
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
              <Loader2 className="w-10 h-10 animate-spin text-white" />
            </div>
          )}

          {/* Table */}
          <div className="card-static bg-white rounded-2xl border border-[var(--secondary-200)] overflow-hidden shadow-sm">
            {loading ? (
              <div className="p-20 text-center text-[var(--secondary)]">
                <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-[var(--primary)]" />
                <p className="font-medium">Memuat data kandidat...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[var(--secondary-50)] border-b border-[var(--secondary-100)]">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-[var(--secondary)] uppercase tracking-wider">Kandidat</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-[var(--secondary)] uppercase tracking-wider">Posisi / Skor</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-[var(--secondary)] uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-[var(--secondary)] uppercase tracking-wider">Test Status</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-[var(--secondary)] uppercase tracking-wider">Tanggal Apply</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-[var(--secondary)] uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--secondary-50)]">
                    {filteredCandidates.map((candidate) => (
                      <tr key={candidate.id} className="hover:bg-[var(--primary-50)]/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[var(--primary-100)] flex items-center justify-center text-[var(--primary-700)] font-bold text-sm">
                              {candidate.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-[var(--primary-900)] group-hover:text-[var(--primary)] transition-colors">{candidate.name}</p>
                              <div className="flex items-center gap-2 text-xs text-[var(--secondary)]">
                                <Mail size={12} />
                                <span className="truncate max-w-[150px]">{candidate.email}</span>
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
                              Match: {candidate.match_score}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`${getStatusBadge(candidate.status)} rounded-full px-2.5 py-1 text-xs font-semibold`}>
                            {candidate.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getTestBadge(candidate.test_status)}`}>
                            {candidate.test_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-[var(--secondary)]">
                          {new Date(candidate.created_at).toLocaleDateString("id-ID", {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
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

                {filteredCandidates.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-[var(--secondary)]">
                    <div className="w-16 h-16 bg-[var(--secondary-50)] rounded-full flex items-center justify-center mb-4">
                       <Search size={32} className="text-[var(--secondary-400)]" />
                    </div>
                    <p className="font-bold text-[var(--primary-900)]">Tidak ada kandidat yang ditemukan</p>
                    <p className="text-sm">Coba ubah filter pencarian Anda atau tambahkan kandidat baru.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>

      {/* Modals */}
      {detailModal && <DetailModal candidate={detailModal} onClose={() => setDetailModal(null)} />}
      {editModal && <EditModal candidate={editModal} onClose={() => setEditModal(null)} onSave={handleSaveEdit} />}
    </div>
  );
}