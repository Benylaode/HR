"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
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

// Extracted Modal Component with memo to prevent re-renders
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Judul Posisi *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${fieldErrors.title ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                placeholder="Software Engineer"
              />
              {fieldErrors.title && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle size={14} />
                  {fieldErrors.title}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Departemen *</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData((prev) => ({ ...prev, department: e.target.value }))}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${fieldErrors.department ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                placeholder="Engineering"
              />
              {fieldErrors.department && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle size={14} />
                  {fieldErrors.department}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
              <select
                value={formData.level}
                onChange={(e) => setFormData((prev) => ({ ...prev, level: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Intern">Intern</option>
                <option value="Junior">Junior</option>
                <option value="Mid">Mid</option>
                <option value="Senior">Senior</option>
                <option value="Lead">Lead</option>
                <option value="Manager">Manager</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi *</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${fieldErrors.location ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                placeholder="Jakarta"
              />
              {fieldErrors.location && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle size={14} />
                  {fieldErrors.location}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Kerja</label>
              <select
                value={formData.employment_type}
                onChange={(e) => setFormData((prev) => ({ ...prev, employment_type: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData((prev) => ({ ...prev, priority: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          {/* Salary */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Range Gaji</label>
            <div className={`grid grid-cols-3 gap-2 p-2 rounded-lg ${fieldErrors.salary ? 'bg-red-50 border border-red-300' : ''}`}>
              <input
                type="number"
                min="0"
                value={formData.salary.min || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, salary: { ...prev.salary, min: parseInt(e.target.value) || 0 } }))}
                className={`px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${fieldErrors.salary ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Min"
              />
              <input
                type="number"
                min="0"
                value={formData.salary.max || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, salary: { ...prev.salary, max: parseInt(e.target.value) || 0 } }))}
                className={`px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${fieldErrors.salary ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Max"
              />
              <select
                value={formData.salary.currency}
                onChange={(e) => setFormData((prev) => ({ ...prev, salary: { ...prev.salary, currency: e.target.value } }))}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="IDR">IDR</option>
                <option value="USD">USD</option>
              </select>
            </div>
            {fieldErrors.salary && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertTriangle size={14} />
                {fieldErrors.salary}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Pekerjaan</label>
            <textarea
              value={formData.job_description}
              onChange={(e) => setFormData((prev) => ({ ...prev, job_description: e.target.value }))}
              rows={4}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Jelaskan tanggung jawab dan tugas posisi ini..."
            />
          </div>

          {/* Requirements */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Requirements</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={requirementInput}
                onChange={(e) => setRequirementInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addRequirement())}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tambah requirement, tekan Enter"
              />
              <button onClick={addRequirement} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Plus size={18} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.requirements.map((req, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm">
                  {req}
                  <button onClick={() => removeRequirement(i)} className="hover:text-red-500">
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Required Skills</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tambah skill, tekan Enter"
              />
              <button onClick={addSkill} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Plus size={18} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.required_skills.map((skill, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                  {skill}
                  <button onClick={() => removeSkill(i)} className="hover:text-red-500">
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4">
          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium">
              Batal
            </button>
            <button
              onClick={onSubmit}
              disabled={formLoading}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 disabled:opacity-50"
            >
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
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
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
        const data = await res.json();
        setJobs(data);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter jobs
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || job.status === filterStatus;
    const matchesDepartment = filterDepartment === "all" || job.department === filterDepartment;
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  // Get unique departments for filter
  const departments = [...new Set(jobs.map((j) => j.department))];

  // Validation function - returns field errors object
  const validateForm = (): FieldErrors => {
    const errors: FieldErrors = {};
    
    if (!formData.title.trim()) {
      errors.title = "Wajib diisi";
    }
    if (!formData.department.trim()) {
      errors.department = "Wajib diisi";
    }
    if (!formData.location.trim()) {
      errors.location = "Wajib diisi";
    }
    
    // Salary validation
    const minSalary = formData.salary.min || 0;
    const maxSalary = formData.salary.max || 0;
    
    if (minSalary < 0 || maxSalary < 0) {
      errors.salary = "Tidak boleh negatif";
    } else if (minSalary > 0 && maxSalary > 0 && minSalary > maxSalary) {
      errors.salary = "Min tidak boleh lebih besar dari Max";
    }
    
    return errors;
  };

  // Create Job
  const handleCreate = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    
    setFormLoading(true);
    setFieldErrors({});
    try {
      const res = await fetch(`${API_BASE_URL}/job-positions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setIsCreateModalOpen(false);
        setFormData(initialFormData);
        fetchJobs();
      } else {
        const err = await res.json();
        // Show general error on title field if server error
        setFieldErrors({ title: err.error || "Gagal membuat posisi" });
      }
    } catch (error) {
      setFieldErrors({ title: "Koneksi ke server gagal" });
    } finally {
      setFormLoading(false);
    }
  };

  // Update Job
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

  // Delete Job
  const handleDelete = async () => {
    if (!selectedJob) return;
    setFormLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/job-positions/${selectedJob.id}`, {
        method: "DELETE",
      });
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

  // Open Edit Modal
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

  // Add requirement
  const addRequirement = () => {
    if (requirementInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        requirements: [...prev.requirements, requirementInput.trim()],
      }));
      setRequirementInput("");
    }
  };

  // Remove requirement
  const removeRequirement = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index),
    }));
  };

  // Add skill
  const addSkill = () => {
    if (skillInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        required_skills: [...prev.required_skills, skillInput.trim()],
      }));
      setSkillInput("");
    }
  };

  // Remove skill
  const removeSkill = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      required_skills: prev.required_skills.filter((_, i) => i !== index),
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-700 border-green-200";
      case "draft": return "bg-gray-100 text-gray-600 border-gray-200";
      case "closed": return "bg-red-100 text-red-600 border-red-200";
      default: return "bg-gray-100 text-gray-600 border-gray-200";
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
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:ml-64">
        <Header
          title="Job Positions"
          subtitle="Kelola lowongan pekerjaan yang tersedia"
          userName={user.name}
          userEmail={user.email}
        />

        <main className="p-6">
          {/* Toolbar */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex flex-1 gap-3 w-full md:w-auto">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Cari posisi..."
                  />
                </div>

                {/* Filters */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Semua Status</option>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="closed">Closed</option>
                </select>

                <select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Semua Departemen</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {/* Create Button */}
              <button
                onClick={() => { setFormData(initialFormData); setFieldErrors({}); setIsCreateModalOpen(true); }}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm"
              >
                <Plus size={18} />
                Tambah Posisi
              </button>
            </div>
          </div>

          {/* Job Cards Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-blue-600" size={40} />
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <Briefcase className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-gray-500">Tidak ada posisi ditemukan</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredJobs.map((job) => (
                <div key={job.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{job.title}</h3>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Building size={14} />
                          {job.department}
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusColor(job.status)}`}>
                        {job.status}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <MapPin size={14} className="text-gray-400" />
                        {job.location}
                      </p>
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <Clock size={14} className="text-gray-400" />
                        {job.employment_type} • {job.level}
                      </p>
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <DollarSign size={14} className="text-gray-400" />
                        {formatSalary(job.salary)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-4">
                      {job.required_skills?.slice(0, 3).map((skill, i) => (
                        <span key={i} className="px-2 py-0.5 text-xs bg-blue-50 text-blue-600 rounded">{skill}</span>
                      ))}
                      {job.required_skills?.length > 3 && (
                        <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-500 rounded">+{job.required_skills.length - 3}</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getPriorityColor(job.priority)}`}>
                        {job.priority} priority
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEditModal(job)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => { setSelectedJob(job); setIsDeleteModalOpen(true); }}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
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
      {isDeleteModalOpen && selectedJob && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="text-red-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Hapus Posisi?</h3>
                <p className="text-sm text-gray-500">Posisi "{selectedJob.title}" akan dihapus permanen.</p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setIsDeleteModalOpen(false); setSelectedJob(null); }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={formLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center gap-2 disabled:opacity-50"
              >
                {formLoading && <Loader2 className="animate-spin" size={16} />}
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
