"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Briefcase,
  MapPin,
  Building,
  Clock,
  DollarSign,
  Filter,
  Loader2,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

interface JobPosition {
  id: string;
  title: string;
  department: string;
  level: string;
  location: string;
  employment_type: string;
  priority: string;
  status: string;
  salary: { min: number; max: number; currency: string };
  job_description: string;
  requirements: string[];
  required_skills: string[];
  available: boolean;
  created_at: string;
  updated_at: string;
}

interface JobFormData {
  title: string;
  department: string;
  level: string;
  location: string;
  employment_type: string;
  priority: string;
  status: string;
  salary: { min: number; max: number; currency: string };
  job_description: string;
  requirements: string[];
  required_skills: string[];
  available: boolean;
}

const initialFormData: JobFormData = {
  title: "",
  department: "",
  level: "Junior",
  location: "",
  employment_type: "Full-time",
  priority: "medium",
  status: "draft",
  salary: { min: 0, max: 0, currency: "IDR" },
  job_description: "",
  requirements: [],
  required_skills: [],
  available: true,
};

// Extracted Modal Component
interface FieldErrors {
  title?: string;
  department?: string;
  location?: string;
  salary?: string;
}

interface JobFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  title: string;
  formData: JobFormData;
  setFormData: React.Dispatch<React.SetStateAction<JobFormData>>;
  fieldErrors: FieldErrors;
  formLoading: boolean;
  requirementInput: string;
  setRequirementInput: React.Dispatch<React.SetStateAction<string>>;
  skillInput: string;
  setSkillInput: React.Dispatch<React.SetStateAction<string>>;
  addRequirement: () => void;
  removeRequirement: (index: number) => void;
  addSkill: () => void;
  removeSkill: (index: number) => void;
}

const JobFormModal = memo(function JobFormModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  formData,
  setFormData,
  fieldErrors,
  formLoading,
  requirementInput,
  setRequirementInput,
  skillInput,
  setSkillInput,
  addRequirement,
  removeRequirement,
  addSkill,
  removeSkill,
}: JobFormModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-[var(--secondary-100)]">
        <div className="sticky top-0 bg-white border-b border-[var(--secondary-100)] px-6 py-4 flex justify-between items-center z-10">
          <h2 className="text-xl font-bold text-[var(--primary-900)]">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-[var(--secondary-50)] rounded-full transition-colors text-[var(--secondary-400)]">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {/* Form fields using updated styling */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[var(--secondary-600)] mb-1">Judul Posisi *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] focus:outline-none transition-colors ${fieldErrors.title ? 'border-red-500 bg-red-50' : 'border-[var(--secondary-200)]'}`}
                placeholder="Software Engineer"
              />
              {fieldErrors.title && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle size={14} /> {fieldErrors.title}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-[var(--secondary-600)] mb-1">Departemen *</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData((prev) => ({ ...prev, department: e.target.value }))}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] focus:outline-none transition-colors ${fieldErrors.department ? 'border-red-500 bg-red-50' : 'border-[var(--secondary-200)]'}`}
                placeholder="Engineering"
              />
              {fieldErrors.department && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle size={14} /> {fieldErrors.department}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[var(--secondary-600)] mb-1">Level</label>
              <select
                value={formData.level}
                onChange={(e) => setFormData((prev) => ({ ...prev, level: e.target.value }))}
                className="w-full px-4 py-2.5 border border-[var(--secondary-200)] rounded-lg focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] focus:outline-none bg-white"
              >
                 {["Intern", "Junior", "Mid", "Senior", "Lead", "Manager"].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[var(--secondary-600)] mb-1">Lokasi *</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] focus:outline-none transition-colors ${fieldErrors.location ? 'border-red-500 bg-red-50' : 'border-[var(--secondary-200)]'}`}
                placeholder="Jakarta"
              />
              {fieldErrors.location && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1"><AlertTriangle size={14} /> {fieldErrors.location}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[var(--secondary-600)] mb-1">Tipe Kerja</label>
              <select value={formData.employment_type} onChange={(e) => setFormData((prev) => ({ ...prev, employment_type: e.target.value }))} className="w-full px-4 py-2.5 border border-[var(--secondary-200)] rounded-lg focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] focus:outline-none bg-white">
                {["Full-time", "Part-time", "Contract", "Internship"].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[var(--secondary-600)] mb-1">Priority</label>
              <select value={formData.priority} onChange={(e) => setFormData((prev) => ({ ...prev, priority: e.target.value }))} className="w-full px-4 py-2.5 border border-[var(--secondary-200)] rounded-lg focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] focus:outline-none bg-white">
                {["low", "medium", "high"].map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[var(--secondary-600)] mb-1">Status</label>
              <select value={formData.status} onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))} className="w-full px-4 py-2.5 border border-[var(--secondary-200)] rounded-lg focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] focus:outline-none bg-white">
                {["draft", "active", "closed"].map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
              </select>
            </div>
          </div>

          {/* Salary */}
          <div>
            <label className="block text-sm font-semibold text-[var(--secondary-600)] mb-1">Range Gaji</label>
            <div className={`grid grid-cols-3 gap-2 p-1 rounded-lg ${fieldErrors.salary ? 'bg-red-50 border border-red-300' : ''}`}>
              <input type="number" min="0" value={formData.salary.min || ""} onChange={(e) => setFormData((prev) => ({ ...prev, salary: { ...prev.salary, min: parseInt(e.target.value) || 0 } }))} className="px-4 py-2.5 border border-[var(--secondary-200)] rounded-lg focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] focus:outline-none" placeholder="Min" />
              <input type="number" min="0" value={formData.salary.max || ""} onChange={(e) => setFormData((prev) => ({ ...prev, salary: { ...prev.salary, max: parseInt(e.target.value) || 0 } }))} className="px-4 py-2.5 border border-[var(--secondary-200)] rounded-lg focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] focus:outline-none" placeholder="Max" />
              <select value={formData.salary.currency} onChange={(e) => setFormData((prev) => ({ ...prev, salary: { ...prev.salary, currency: e.target.value } }))} className="px-4 py-2.5 border border-[var(--secondary-200)] rounded-lg focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] focus:outline-none bg-white">
                <option value="IDR">IDR</option>
                <option value="USD">USD</option>
              </select>
            </div>
            {fieldErrors.salary && <p className="mt-1 text-sm text-red-600 flex items-center gap-1"><AlertTriangle size={14} /> {fieldErrors.salary}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-[var(--secondary-600)] mb-1">Deskripsi Pekerjaan</label>
            <textarea value={formData.job_description} onChange={(e) => setFormData((prev) => ({ ...prev, job_description: e.target.value }))} rows={4} className="w-full px-4 py-2.5 border border-[var(--secondary-200)] rounded-lg focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] focus:outline-none resize-none" placeholder="Jelaskan tanggung jawab dan tugas posisi ini..." />
          </div>

          {/* Requirements & Skills */}
          <div className="space-y-4">
             <div>
                <label className="block text-sm font-semibold text-[var(--secondary-600)] mb-1">Requirements</label>
                <div className="flex gap-2 mb-2">
                  <input type="text" value={requirementInput} onChange={(e) => setRequirementInput(e.target.value)} onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addRequirement())} className="flex-1 px-4 py-2.5 border border-[var(--secondary-200)] rounded-lg focus:outline-none focus:border-[var(--primary)]" placeholder="Tambah requirement..." />
                  <button onClick={addRequirement} className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-700)]"><Plus size={18} /></button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.requirements.map((req, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-[var(--secondary-50)] text-[var(--secondary-700)] rounded-full text-sm border border-[var(--secondary-200)]">
                      {req} <button onClick={() => removeRequirement(i)} className="hover:text-red-500"><X size={14} /></button>
                    </span>
                  ))}
                </div>
             </div>
             <div>
                <label className="block text-sm font-semibold text-[var(--secondary-600)] mb-1">Required Skills</label>
                <div className="flex gap-2 mb-2">
                  <input type="text" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())} className="flex-1 px-4 py-2.5 border border-[var(--secondary-200)] rounded-lg focus:outline-none focus:border-[var(--primary)]" placeholder="Tambah skill..." />
                  <button onClick={addSkill} className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-700)]"><Plus size={18} /></button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.required_skills.map((skill, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-[var(--primary-50)] text-[var(--primary-700)] rounded-full text-sm border border-[var(--primary-100)]">
                      {skill} <button onClick={() => removeSkill(i)} className="hover:text-red-500"><X size={14} /></button>
                    </span>
                  ))}
                </div>
             </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-[var(--background)] border-t border-[var(--secondary-200)] px-6 py-4">
          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="px-5 py-2.5 border border-[var(--secondary-200)] rounded-xl hover:bg-[var(--secondary-50)] font-semibold text-[var(--secondary-600)] transition-colors">
              Batal
            </button>
            <button onClick={onSubmit} disabled={formLoading} className="px-5 py-2.5 bg-[var(--primary)] text-white rounded-xl hover:bg-[var(--primary-700)] font-bold flex items-center gap-2 disabled:opacity-50 transition-all shadow-sm">
              {formLoading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
              Simpan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default function JobPositionsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string; role?: string } | null>(null);
  const [jobs, setJobs] = useState<JobPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDepartment, setFilterDepartment] = useState("all");

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobPosition | null>(null);
  const [formData, setFormData] = useState<JobFormData>(initialFormData);
  const [formLoading, setFormLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Temp inputs for arrays
  const [requirementInput, setRequirementInput] = useState("");
  const [skillInput, setSkillInput] = useState("");

  useEffect(() => {
    const userData = localStorage.getItem("hr_user");
    if (!userData) {
      router.push("/");
      return;
    }
    setUser(JSON.parse(userData));
    fetchJobs();
  }, [router]);

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/job-positions`);
      if (res.ok) {
        setJobs(await res.json());
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter jobs
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) || job.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || job.status === filterStatus;
    const matchesDepartment = filterDepartment === "all" || job.department === filterDepartment;
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const departments = [...new Set(jobs.map((j) => j.department))];

  const validateForm = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (!formData.title.trim()) errors.title = "Wajib diisi";
    if (!formData.department.trim()) errors.department = "Wajib diisi";
    if (!formData.location.trim()) errors.location = "Wajib diisi";
    
    const minSalary = formData.salary.min || 0;
    const maxSalary = formData.salary.max || 0;
    if (minSalary < 0 || maxSalary < 0) errors.salary = "Tidak boleh negatif";
    else if (minSalary > 0 && maxSalary > 0 && minSalary > maxSalary) errors.salary = "Min > Max";
    
    return errors;
  };

  const handleCreate = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFormLoading(true);
    setFieldErrors({});
    
    try {
      // DIRECT CREATE: Job position without approval
      const res = await fetch(`${API_BASE_URL}/job-positions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      if (res.ok) {
        setIsCreateModalOpen(false);
        setFormData(initialFormData);
        alert('✅ Job Position berhasil dibuat!');
        fetchJobs();
      } else {
        const err = await res.json();
        setFieldErrors({ title: err.error || "Gagal membuat posisi" });
      }
    } catch (error) {
      setFieldErrors({ title: "Koneksi ke server gagal" });
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedJob) return;
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    
    setFormLoading(true);
    setFieldErrors({});
    try {
      const res = await fetch(`${API_BASE_URL}/job-positions/${selectedJob.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setIsEditModalOpen(false);
        setSelectedJob(null);
        setFormData(initialFormData);
        fetchJobs();
      } else {
        const err = await res.json();
        setFieldErrors({ title: err.error || "Gagal memperbarui posisi" });
      }
    } catch (error) {
      setFieldErrors({ title: "Koneksi ke server gagal" });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedJob) return;
    setFormLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/job-positions/${selectedJob.id}`, { method: "DELETE" });
      if (res.ok) {
        setIsDeleteModalOpen(false);
        setSelectedJob(null);
        fetchJobs();
      }
    } catch (error) {
      console.error("Error deleting job:", error);
    } finally {
      setFormLoading(false);
    }
  };

  const openEditModal = (job: JobPosition) => {
    setSelectedJob(job);
    setFormData({
      title: job.title,
      department: job.department,
      level: job.level,
      location: job.location,
      employment_type: job.employment_type,
      priority: job.priority,
      status: job.status,
      salary: job.salary,
      job_description: job.job_description,
      requirements: job.requirements || [],
      required_skills: job.required_skills || [],
      available: job.available,
    });
    setIsEditModalOpen(true);
  };

  const addRequirement = () => {
    if (requirementInput.trim()) {
      setFormData((prev) => ({ ...prev, requirements: [...prev.requirements, requirementInput.trim()] }));
      setRequirementInput("");
    }
  };
  const removeRequirement = (index: number) => {
    setFormData((prev) => ({ ...prev, requirements: prev.requirements.filter((_, i) => i !== index) }));
  };

  const addSkill = () => {
    if (skillInput.trim()) {
      setFormData((prev) => ({ ...prev, required_skills: [...prev.required_skills, skillInput.trim()] }));
      setSkillInput("");
    }
  };
  const removeSkill = (index: number) => {
    setFormData((prev) => ({ ...prev, required_skills: prev.required_skills.filter((_, i) => i !== index) }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "badge badge-success";
      case "draft": return "badge badge-primary";
      case "closed": return "badge badge-danger";
      default: return "badge badge-secondary";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-50 text-red-600";
      case "medium": return "bg-yellow-50 text-yellow-600";
      case "low": return "bg-blue-50 text-blue-600";
      default: return "bg-gray-50 text-gray-600";
    }
  };

  const formatSalary = (salary: { min: number; max: number; currency: string }) => {
    if (!salary.min && !salary.max) return "-";
    const format = (num: number) => new Intl.NumberFormat("id-ID").format(num);
    return `${salary.currency} ${format(salary.min)} - ${format(salary.max)}`;
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar />
      <div className="lg:ml-64 min-h-screen flex flex-col">
        <Header
          title="Job Positions"
          subtitle="Kelola lowongan pekerjaan yang tersedia"
        />

        <main className="p-4 md:p-8 flex-1">
          {/* Toolbar */}
          <div className="card-static bg-white p-4 rounded-xl border border-[var(--secondary-200)] mb-8">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex flex-1 gap-3 w-full md:w-auto">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--secondary-400)]" size={18} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-[var(--secondary-200)] rounded-lg focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] focus:outline-none transition-colors text-sm"
                    placeholder="Cari posisi..."
                  />
                </div>

                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-2.5 border border-[var(--secondary-200)] rounded-lg focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] text-sm focus:outline-none bg-white">
                  <option value="all">Semua Status</option>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="closed">Closed</option>
                </select>

                <select value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)} className="px-4 py-2.5 border border-[var(--secondary-200)] rounded-lg focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] text-sm focus:outline-none bg-white">
                  <option value="all">Semua Departemen</option>
                  {departments.map((dept) => <option key={dept} value={dept}>{dept}</option>)}
                </select>
              </div>

              <button
                onClick={() => { setFormData(initialFormData); setFieldErrors({}); setIsCreateModalOpen(true); }}
                className="flex items-center gap-2 px-5 py-2.5 bg-[var(--primary)] text-white rounded-xl hover:bg-[var(--primary-700)] font-bold shadow-sm transition-all hover:translate-y-[-1px]"
              >
                <Plus size={18} />
                Tambah Posisi
              </button>
            </div>
          </div>

          {/* Job Cards Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-[var(--primary)]" size={40} />
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-[var(--secondary-200)] p-16 text-center">
              <div className="w-16 h-16 bg-[var(--secondary-50)] rounded-full flex items-center justify-center mx-auto mb-4">
                 <Briefcase className="text-[var(--secondary-400)]" size={32} />
              </div>
              <h3 className="font-bold text-[var(--primary-900)] text-lg">Tidak ada posisi ditemukan</h3>
              <p className="text-[var(--secondary)]">Coba sesuaikan filter pencarian.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredJobs.map((job) => (
                <div key={job.id} className="card-static bg-white rounded-2xl border border-[var(--secondary-200)] overflow-hidden hover:border-[var(--primary-200)] hover:shadow-lg transition-all group">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-[var(--primary-900)] text-lg group-hover:text-[var(--primary)] transition-colors">{job.title}</h3>
                        <p className="text-sm text-[var(--secondary)] flex items-center gap-1.5 mt-1 font-medium">
                          <Building size={14} className="text-[var(--secondary-400)]" />
                          {job.department}
                        </p>
                      </div>
                      <span className={`${getStatusColor(job.status)} px-2.5 py-1 text-xs font-bold rounded-full`}>
                        {job.status}
                      </span>
                    </div>

                    <div className="space-y-2.5 mb-5 pt-3 border-t border-dashed border-[var(--secondary-100)]">
                      <p className="text-sm text-[var(--secondary-700)] flex items-center gap-2">
                        <MapPin size={16} className="text-[var(--secondary-400)]" />
                        {job.location}
                      </p>
                      <p className="text-sm text-[var(--secondary-700)] flex items-center gap-2">
                        <Clock size={16} className="text-[var(--secondary-400)]" />
                        {job.employment_type} • {job.level}
                      </p>
                      <p className="text-sm text-[var(--secondary-700)] flex items-center gap-2">
                        <DollarSign size={16} className="text-[var(--secondary-400)]" />
                        {formatSalary(job.salary)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {job.required_skills?.slice(0, 3).map((skill, i) => (
                        <span key={i} className="px-2 py-1 text-xs bg-[var(--secondary-50)] text-[var(--secondary-600)] border border-[var(--secondary-100)] rounded-md font-medium">{skill}</span>
                      ))}
                      {job.required_skills?.length > 3 && (
                        <span className="px-2 py-1 text-xs bg-[var(--secondary-50)] text-[var(--secondary-400)] border border-[var(--secondary-100)] rounded-md font-medium">+{job.required_skills.length - 3}</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-[var(--secondary-100)]">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-lg uppercase tracking-wide ${getPriorityColor(job.priority)}`}>
                        {job.priority} priority
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(job)}
                          className="p-2 text-[var(--secondary-400)] hover:text-[var(--primary)] hover:bg-[var(--primary-50)] rounded-lg transition-colors border border-transparent hover:border-[var(--primary-100)]"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => { setSelectedJob(job); setIsDeleteModalOpen(true); }}
                          className="p-2 text-[var(--secondary-400)] hover:text-[var(--danger)] hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                          title="Hapus"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
        <Footer />
      </div>

      {/* Modals */}
      <JobFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreate}
        title="Tambah Posisi Baru"
        formData={formData}
        setFormData={setFormData}
        fieldErrors={fieldErrors}
        formLoading={formLoading}
        requirementInput={requirementInput}
        setRequirementInput={setRequirementInput}
        skillInput={skillInput}
        setSkillInput={setSkillInput}
        addRequirement={addRequirement}
        removeRequirement={removeRequirement}
        addSkill={addSkill}
        removeSkill={removeSkill}
      />
      <JobFormModal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setSelectedJob(null); }}
        onSubmit={handleUpdate}
        title="Edit Posisi"
        formData={formData}
        setFormData={setFormData}
        fieldErrors={fieldErrors}
        formLoading={formLoading}
        requirementInput={requirementInput}
        setRequirementInput={setRequirementInput}
        skillInput={skillInput}
        setSkillInput={setSkillInput}
        addRequirement={addRequirement}
        removeRequirement={removeRequirement}
        addSkill={addSkill}
        removeSkill={removeSkill}
      />
      
      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
           <div className="bg-white p-6 rounded-2xl max-w-sm w-full shadow-xl border border-[var(--secondary-100)]">
              <h3 className="text-lg font-bold text-[var(--primary-900)] mb-2">Hapus Posisi?</h3>
              <p className="text-[var(--secondary)] mb-6 text-sm">Apakah Anda yakin ingin menghapus posisi <strong className="text-[var(--primary-900)]">{selectedJob?.title}</strong>? Tindakan ini tidak dapat dibatalkan.</p>
              <div className="flex justify-end gap-3">
                 <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-[var(--secondary-600)] hover:bg-[var(--secondary-50)] rounded-lg transition-colors">Batal</button>
                 <button onClick={handleDelete} disabled={formLoading} className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm flex items-center gap-2">
                    {formLoading && <Loader2 className="animate-spin" size={14} />}
                    Hapus
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
