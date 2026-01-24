"use client";

import { useState, useEffect, useCallback, memo, useMemo } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import {
  Plus, Search, Edit2, Trash2, X, Briefcase, MapPin, Building,
  DollarSign, Loader2, CheckCircle, AlertTriangle, Save
} from "lucide-react";

// --- Types & Interfaces ---
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
}

interface JobFormData extends Omit<JobPosition, "id" | "available"> {
  available: boolean;
}

type ModalType = "create" | "edit" | null;

interface FieldErrors {
  [key: string]: string | undefined;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

const INITIAL_FORM_DATA: JobFormData = {
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

// --- Toast Component (Internal) ---
const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => (
  <div className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-lg shadow-lg border flex items-center gap-3 animate-in slide-in-from-right duration-300 ${type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
    {type === 'success' ? <CheckCircle size={18}/> : <AlertTriangle size={18}/>}
    <span className="font-medium text-sm">{message}</span>
    <button onClick={onClose}><X size={14} className="opacity-50 hover:opacity-100"/></button>
  </div>
);

// --- Memoized Modal Component ---
const JobFormModal = memo(({ 
  isOpen, onClose, onSubmit, title, formData, setFormData, fieldErrors, isSubmitting
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  title: string;
  formData: JobFormData;
  setFormData: React.Dispatch<React.SetStateAction<JobFormData>>;
  fieldErrors: FieldErrors;
  isSubmitting: boolean;
}) => {
  const [reqInput, setReqInput] = useState("");
  const [skillInput, setSkillInput] = useState("");

  if (!isOpen) return null;

  const handleAddReq = () => {
    if (reqInput.trim()) {
      setFormData(prev => ({ ...prev, requirements: [...prev.requirements, reqInput.trim()] }));
      setReqInput("");
    }
  };

  const handleAddSkill = () => {
    if (skillInput.trim()) {
      setFormData(prev => ({ ...prev, required_skills: [...prev.required_skills, skillInput.trim()] }));
      setSkillInput("");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col border border-gray-100">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-white rounded-t-2xl">
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"><X size={20}/></button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Judul Posisi <span className="text-red-500">*</span></label>
              <input type="text" value={formData.title} onChange={e => setFormData(p => ({...p, title: e.target.value}))} 
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--primary)]/20 outline-none transition-all ${fieldErrors.title ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} placeholder="e.g. Backend Engineer"/>
              {fieldErrors.title && <p className="text-xs text-red-500 mt-1">{fieldErrors.title}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Departemen <span className="text-red-500">*</span></label>
              <input type="text" value={formData.department} onChange={e => setFormData(p => ({...p, department: e.target.value}))} 
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--primary)]/20 outline-none transition-all ${fieldErrors.department ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} placeholder="e.g. Engineering"/>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Level</label>
              <select value={formData.level} onChange={e => setFormData(p => ({...p, level: e.target.value}))} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-[var(--primary)]">
                {["Intern", "Junior", "Mid", "Senior", "Lead", "Manager"].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Tipe</label>
              <select value={formData.employment_type} onChange={e => setFormData(p => ({...p, employment_type: e.target.value}))} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-[var(--primary)]">
                {["Full-time", "Part-time", "Contract", "Freelance"].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div className="col-span-2 md:col-span-1">
               <label className="block text-sm font-semibold text-gray-700 mb-1">Lokasi</label>
               <input type="text" value={formData.location} onChange={e => setFormData(p => ({...p, location: e.target.value}))} className={`w-full px-4 py-2 border rounded-lg outline-none ${fieldErrors.location ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} placeholder="Jakarta"/>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
             <label className="block text-sm font-semibold text-gray-700 mb-2">Estimasi Gaji (Bulanan)</label>
             <div className="flex gap-2">
                <select value={formData.salary.currency} onChange={e => setFormData(p => ({...p, salary: {...p.salary, currency: e.target.value}}))} className="px-3 py-2 border border-gray-300 rounded-lg bg-white outline-none">
                  <option value="IDR">IDR</option>
                  <option value="USD">USD</option>
                </select>
                <input type="number" min="0" placeholder="Min" value={formData.salary.min || ''} onChange={e => setFormData(p => ({...p, salary: {...p.salary, min: Number(e.target.value)}}))} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"/>
                <span className="self-center text-gray-400">-</span>
                <input type="number" min="0" placeholder="Max" value={formData.salary.max || ''} onChange={e => setFormData(p => ({...p, salary: {...p.salary, max: Number(e.target.value)}}))} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"/>
             </div>
             {fieldErrors.salary && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertTriangle size={12}/> {fieldErrors.salary}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Requirements</label>
            <div className="flex gap-2 mb-2">
              <input type="text" value={reqInput} onChange={e => setReqInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddReq())} 
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]/20 outline-none" placeholder="Tambah kualifikasi (Enter)..." />
              <button onClick={handleAddReq} className="p-2 bg-[var(--primary)] text-white rounded-lg hover:brightness-90"><Plus size={20}/></button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.requirements.map((req, i) => (
                <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-xs font-medium flex items-center gap-1">
                  {req} <button onClick={() => setFormData(p => ({...p, requirements: p.requirements.filter((_, idx) => idx !== i)}))} className="hover:text-red-500"><X size={12}/></button>
                </span>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Skills</label>
            <div className="flex gap-2 mb-2">
              <input type="text" value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())} 
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]/20 outline-none" placeholder="Tambah skill (Enter)..." />
              <button onClick={handleAddSkill} className="p-2 bg-[var(--primary)] text-white rounded-lg hover:brightness-90"><Plus size={20}/></button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.required_skills.map((skill, i) => (
                <span key={i} className="px-3 py-1 bg-purple-50 text-purple-700 border border-purple-100 rounded-full text-xs font-medium flex items-center gap-1">
                  {skill} <button onClick={() => setFormData(p => ({...p, required_skills: p.required_skills.filter((_, idx) => idx !== i)}))} className="hover:text-red-500"><X size={12}/></button>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t bg-gray-50 rounded-b-2xl flex justify-end gap-3">
           <button onClick={onClose} className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors">Batal</button>
           <button onClick={onSubmit} disabled={isSubmitting} className="px-6 py-2.5 bg-[var(--primary)] text-white rounded-xl font-bold flex items-center gap-2 shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {isSubmitting ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
              Simpan
           </button>
        </div>
      </div>
    </div>
  );
});
JobFormModal.displayName = "JobFormModal";

// --- Main Page ---
export default function JobPositionsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{name: string} | null>(null);
  const [jobs, setJobs] = useState<JobPosition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [modalConfig, setModalConfig] = useState<{ type: ModalType; data?: JobPosition }>({ type: null });
  const [formData, setFormData] = useState<JobFormData>(INITIAL_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  
  const [toast, setToast] = useState<{message: string, type: 'success'|'error'} | null>(null);

  const getAuthHeaders = useCallback(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("hr_token") : null;
    return {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    };
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // FETCH JOBS - FIX: Signal passed as argument
  const fetchJobs = useCallback(async (signal?: AbortSignal) => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/job-positions`, { 
        headers: getAuthHeaders(),
        signal: signal 
      });
      if (res.ok) {
        setJobs(await res.json());
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders]);

  // USE EFFECT - FIX: Controller created inside effect
  useEffect(() => {
    const userData = localStorage.getItem("hr_user");
    if (!userData) { router.push("/"); return; }
    setUser(JSON.parse(userData));
    
    const controller = new AbortController();
    fetchJobs(controller.signal);

    return () => controller.abort();
  }, [router, fetchJobs]);

  const openModal = useCallback((type: ModalType, data?: JobPosition) => {
    setModalConfig({ type, data });
    setFieldErrors({});
    if (type === 'edit' && data) {
      const { id, ...rest } = data as any; 
      setFormData(rest);
    } else {
      setFormData(INITIAL_FORM_DATA);
    }
  }, []);

  const validateForm = useCallback(() => {
    const errors: FieldErrors = {};
    if (!formData.title.trim()) errors.title = "Judul posisi wajib diisi";
    if (!formData.department.trim()) errors.department = "Departemen wajib diisi";
    if (!formData.location.trim()) errors.location = "Lokasi wajib diisi";
    
    if (formData.salary.min > formData.salary.max && formData.salary.max > 0) {
      errors.salary = "Gaji minimum tidak boleh lebih besar dari maksimum";
    }
    return errors;
  }, [formData]);

  const handleSave = useCallback(async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    const isEdit = modalConfig.type === 'edit';
    const url = isEdit 
      ? `${API_BASE_URL}/job-positions/${modalConfig.data?.id}` 
      : `${API_BASE_URL}/job-positions`;

    try {
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        showToast(`Posisi berhasil ${isEdit ? 'diperbarui' : 'dibuat'}!`, 'success');
        setModalConfig({ type: null });
        fetchJobs(); // No signal needed for manual refetch
      } else {
        const err = await res.json();
        showToast(err.message || "Gagal menyimpan data", 'error');
      }
    } catch (error) {
      showToast("Terjadi kesalahan jaringan", 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, modalConfig, getAuthHeaders, fetchJobs, validateForm]);

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus posisi ini?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/job-positions/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        showToast("Posisi berhasil dihapus", 'success');
        fetchJobs();
      }
    } catch (error) {
      showToast("Gagal menghapus data", 'error');
    }
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter(j => 
      j.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      j.department.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [jobs, searchQuery]);

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-[#F8F9FC]">
      <Sidebar />
      <div className="flex-1 flex flex-col lg:ml-64">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        
        <Header title="Lowongan Pekerjaan" subtitle="Kelola posisi yang tersedia untuk pelamar" />
        
        <main className="p-6 md:p-8 flex-1">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
             <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                <input 
                  type="text" 
                  placeholder="Cari posisi atau departemen..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--primary)]/20 outline-none transition-all"
                />
             </div>
             <button 
                onClick={() => openModal('create')}
                className="w-full md:w-auto flex items-center justify-center gap-2 bg-[var(--primary)] text-white px-5 py-2.5 rounded-xl font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all"
             >
                <Plus size={20}/> Tambah Posisi
             </button>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
               <Loader2 className="animate-spin mb-3" size={40}/>
               <p>Memuat data...</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
               <Briefcase size={48} className="mx-auto text-gray-300 mb-4"/>
               <h3 className="text-lg font-bold text-gray-800">Tidak ada lowongan ditemukan</h3>
               <p className="text-gray-500">Coba kata kunci lain atau buat posisi baru.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
               {filteredJobs.map(job => (
                 <div key={job.id} className="group bg-white rounded-2xl p-6 border border-gray-100 hover:border-[var(--primary)]/30 hover:shadow-xl transition-all duration-300 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 bg-white/80 backdrop-blur-sm rounded-bl-2xl">
                       <button onClick={() => openModal('edit', job)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={18}/></button>
                       <button onClick={() => handleDelete(job.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18}/></button>
                    </div>

                    <div className="mb-4">
                       <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-bold text-gray-900 line-clamp-1 pr-16">{job.title}</h3>
                       </div>
                       <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${job.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {job.status}
                       </span>
                    </div>

                    <div className="space-y-2.5 text-sm text-gray-600 mb-5">
                       <div className="flex items-center gap-2"><Building size={16} className="text-gray-400"/> {job.department}</div>
                       <div className="flex items-center gap-2"><MapPin size={16} className="text-gray-400"/> {job.location}</div>
                       {/* FIX APPLIED HERE */}
                       <div className="flex items-center gap-2 font-medium text-gray-800">
                          <DollarSign size={16} className="text-[var(--primary)]"/> 
                          {job.salary?.currency || 'IDR'} {(job.salary?.min ?? 0).toLocaleString()} - {(job.salary?.max ?? 0).toLocaleString()}
                       </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-auto">
                       {job.required_skills?.slice(0, 3).map((skill, i) => (
                          <span key={i} className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded border border-gray-200">{skill}</span>
                       ))}
                       {(job.required_skills?.length || 0) > 3 && <span className="px-2 py-1 bg-gray-50 text-gray-400 text-xs rounded">+{job.required_skills.length - 3}</span>}
                    </div>
                 </div>
               ))}
            </div>
          )}
        </main>
        <Footer />
      </div>

      <JobFormModal 
        isOpen={!!modalConfig.type} 
        onClose={() => setModalConfig({ type: null })} 
        onSubmit={handleSave}
        title={modalConfig.type === 'create' ? "Buat Posisi Baru" : "Edit Posisi"}
        formData={formData}
        setFormData={setFormData}
        fieldErrors={fieldErrors}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}