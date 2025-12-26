"use client";

import { useEffect, useState, useCallback, memo } from "react";
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
  Filter,
  X,
  GraduationCap,
  Building,
  Calendar,
  MapPin,
  Award,
  Globe,
  Save,
  User,
  FileText
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

// Detail Modal Component - Modern Minimalist Corporate Design
const DetailModal = memo(({ 
  candidate, 
  onClose 
}: { 
  candidate: CandidateDetail | null; 
  onClose: () => void;
}) => {
  if (!candidate) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-xl border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-lg font-semibold text-slate-600">
              {candidate.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{candidate.name}</h2>
              <p className="text-sm text-gray-500">{candidate.current_role || candidate.top_position || "Kandidat"}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-160px)] space-y-5">
          {/* Contact Grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Mail size={16} className="text-gray-400" />
              <span>{candidate.email}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Phone size={16} className="text-gray-400" />
              <span>{candidate.phone || "-"}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin size={16} className="text-gray-400" />
              <span>{candidate.city || candidate.address || "-"}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Briefcase size={16} className="text-gray-400" />
              <span>{candidate.total_experience_years || 0} tahun pengalaman</span>
            </div>
          </div>

          {/* Summary */}
          {candidate.summary && (
            <div className="border-l-2 border-blue-400 pl-4">
              <p className="text-sm text-gray-600 leading-relaxed">{candidate.summary}</p>
            </div>
          )}

          {/* Education */}
          {candidate.education && candidate.education.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Pendidikan</h3>
              <div className="space-y-2">
                {candidate.education.map((edu, idx) => (
                  <div key={idx} className="flex justify-between items-baseline">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{edu.degree}</p>
                      <p className="text-xs text-gray-500">{edu.institution}</p>
                    </div>
                    {edu.year && <span className="text-xs text-gray-400">{edu.year}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Experience */}
          {candidate.experience && candidate.experience.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Pengalaman</h3>
              <div className="space-y-2">
                {candidate.experience.map((exp, idx) => (
                  <div key={idx} className="flex justify-between items-baseline">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{exp.title}</p>
                      <p className="text-xs text-gray-500">{exp.company}</p>
                    </div>
                    {exp.duration && <span className="text-xs text-gray-400">{exp.duration}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {candidate.skills && candidate.skills.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Skills</h3>
              <div className="flex flex-wrap gap-1.5">
                {candidate.skills.map((skill, idx) => (
                  <span key={idx} className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {candidate.languages && candidate.languages.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Bahasa</h3>
              <div className="flex flex-wrap gap-1.5">
                {candidate.languages.map((lang, idx) => (
                  <span key={idx} className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium">
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex gap-4 text-xs text-gray-500">
            <span>Status: <strong className="text-gray-700">{candidate.status}</strong></span>
            <span>Test: <strong className="text-gray-700">{candidate.test_status}</strong></span>
            <span>Match: <strong className="text-blue-600">{candidate.match_score}%</strong></span>
          </div>
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
});
DetailModal.displayName = 'DetailModal';

// Edit Modal Component - Modern Minimalist Corporate Design
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

  const inputClass = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-colors";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-xl w-full max-w-lg max-h-[85vh] overflow-hidden shadow-xl border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Edit size={18} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Edit Kandidat</h2>
              <p className="text-xs text-gray-500">{candidate.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(85vh-160px)] space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 block">Nama</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 block">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 block">Telepon</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 block">Kota</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 block">Posisi</label>
              <input
                type="text"
                value={formData.current_role}
                onChange={(e) => setFormData({ ...formData, current_role: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 block">Pengalaman</label>
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
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 block">Ringkasan</label>
            <textarea
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              rows={3}
              className={`${inputClass} resize-none`}
              placeholder="Deskripsi singkat..."
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
          <button 
            type="button"
            onClick={onClose} 
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Batal
          </button>
          <button 
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
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

              <div className="w-full md:w-auto flex items-center gap-2">
                <Briefcase size={18} className="text-gray-400 hidden md:block" />
                <select
                  value={jobFilter}
                  onChange={(e) => setJobFilter(e.target.value)}
                  className="w-full md:w-56 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
                >
                  <option value="all">Semua Posisi Pekerjaan</option>
                  {jobs.map((job) => (
                    <option key={job.id} value={job.title}>{job.title}</option>
                  ))}
                </select>
              </div>

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

          {/* Loading Indicator for Detail */}
          {loadingDetail && (
            <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
              <Loader2 className="w-10 h-10 animate-spin text-white" />
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
                            <button 
                              onClick={() => handleViewDetail(candidate.id)}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" 
                              title="Lihat Detail"
                            >
                              <Eye size={18} />
                            </button>
                            <button 
                              onClick={() => handleEdit(candidate.id)}
                              className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors" 
                              title="Edit"
                            >
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

      {/* Modals */}
      {detailModal && <DetailModal candidate={detailModal} onClose={() => setDetailModal(null)} />}
      {editModal && <EditModal candidate={editModal} onClose={() => setEditModal(null)} onSave={handleSaveEdit} />}
    </div>
  );
}