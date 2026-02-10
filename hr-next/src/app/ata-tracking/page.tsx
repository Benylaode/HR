'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from "@/components/layout/Sidebar"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import { 
  Loader2, Search, CheckCircle, XCircle, FileText, 
  User, Plus, UploadCloud, CircleDashed, Clock, AlertCircle 
} from 'lucide-react'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001"

// --- Interface Data Sesuai Struktur JSON Baru ---
interface ATARequest {
  id: string
  title: string
  requester: string
  department: string
  status: 'Pending' | 'Approved' | 'Rejected'
  current_step: 'HR' | 'KTT' | 'HO' | 'DONE' | 'REJECTED' 
  approvals: {
    HR: string
    KTT: string
    HO: string
  }
  created_at: string
}

export default function ATATrackingPage() {
  const router = useRouter()
  
  // --- State Data ---
  const [requests, setRequests] = useState<ATARequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState('all')
  
  // --- State Role & Auth ---
  const [userRole, setUserRole] = useState<string>('') 
  
  // --- State Modal ---
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    requester_name: '', title: '', department: '', level: '', location: '', 
    employment_type: '', salary_min: '', salary_max: '', justification: '',
  })
  const [file, setFile] = useState<File | null>(null)
  const [submitLoading, setSubmitLoading] = useState(false)

  // HELPER: Normalisasi Status
  const normalizeStatus = (status: any): string => {
    if (!status) return 'Pending';
    const s = String(status).trim().toLowerCase();
    if (s === 'approved') return 'Approved';
    if (s === 'rejected') return 'Rejected';
    return 'Pending';
  }

  // 1. Inisialisasi Auth & Role
  useEffect(() => {
    const userData = localStorage.getItem("hr_user");
    let role = '';
    let requesterName = '';

    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        role = parsedUser.role ? parsedUser.role.toUpperCase().trim() : '';
        requesterName = parsedUser.name || 'User';
      } catch (e) { console.error(e); }
    } 
    
    if (!role) {
        role = (localStorage.getItem("role") || '').toUpperCase().trim();
    }
    
    setUserRole(role);
    setFormData(prev => ({ ...prev, requester_name: requesterName }));

    fetchRequests();
  }, []);

  const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem("hr_token");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  // 2. Fetch Data dengan Logika Waterfall Sesuai Struktur {approvals: {HR, KTT, HO}}
  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/ata`, { headers: getAuthHeaders() });
      const rawData = await response.json();
      
      if (Array.isArray(rawData)) {
        const formattedData = rawData.map((item: any) => {
          // Akses data dari dalam objek approvals
          const hrStatus = normalizeStatus(item.approvals?.HR);
          const kttStatus = normalizeStatus(item.approvals?.KTT);
          const hoStatus = normalizeStatus(item.approvals?.HO);
          const globalStatus = normalizeStatus(item.status);

          let currentStep: ATARequest['current_step'] = 'HR';

          // LOGIKA WATERFALL: HR -> KTT -> HO
          if (globalStatus === 'Rejected') {
            currentStep = 'REJECTED';
          } else if (globalStatus === 'Approved') {
            currentStep = 'DONE';
          } else {
            if (hrStatus === 'Pending') currentStep = 'HR';
            else if (kttStatus === 'Pending') currentStep = 'KTT';
            else if (hoStatus === 'Pending') currentStep = 'HO';
            else currentStep = 'DONE';
          }

          return {
            ...item,
            requester: item.requester || 'User',
            status: globalStatus as 'Pending' | 'Approved' | 'Rejected',
            current_step: currentStep,
            approvals: {
              HR: hrStatus,
              KTT: kttStatus,
              HO: hoStatus
            }
          };
        });
        setRequests(formattedData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // 3. Render Stepper
  const renderStepper = (req: ATARequest) => {
    const steps = [
        { key: 'HR', label: 'HR Dept' },
        { key: 'KTT', label: 'KTT / Site' },
        { key: 'HO', label: 'Head Office' }
    ];

    return (
        <div className="flex items-center w-full mt-4 mb-2">
            {steps.map((step, index) => {
                const myStatus = req.approvals[step.key as keyof typeof req.approvals];
                let visualState = 'waiting'; 

                if (req.status === 'Rejected') {
                    if (myStatus === 'Rejected') visualState = 'rejected';
                    else if (myStatus === 'Approved') visualState = 'approved';
                    else visualState = 'skipped';
                } else if (req.status === 'Approved') {
                    visualState = 'approved';
                } else {
                    if (myStatus === 'Approved') visualState = 'approved';
                    else if (req.current_step === step.key) visualState = 'active';
                    else visualState = 'waiting';
                }

                let icon = <CircleDashed size={18} />;
                let circleClass = "bg-slate-50 border-slate-300 text-slate-300";
                let textClass = "text-slate-400";

                if (visualState === 'approved') {
                    icon = <CheckCircle size={18} className="text-white" />;
                    circleClass = "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-100";
                    textClass = "text-emerald-600 font-bold";
                } else if (visualState === 'rejected') {
                    icon = <XCircle size={18} className="text-white" />;
                    circleClass = "bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-100";
                    textClass = "text-rose-600 font-bold";
                } else if (visualState === 'active') {
                    icon = <Loader2 size={18} className="animate-spin text-amber-600" />;
                    circleClass = "bg-amber-50 border-amber-400 text-amber-600 ring-4 ring-amber-100";
                    textClass = "text-amber-600 font-bold animate-pulse";
                }

                return (
                    <div key={step.key} className="flex items-center flex-1 last:flex-none">
                        <div className="relative flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center z-10 transition-all duration-500 ${circleClass}`}>
                                {icon}
                            </div>
                            <span className={`absolute -bottom-6 text-[10px] uppercase font-bold tracking-wider whitespace-nowrap ${textClass}`}>
                                {step.label}
                            </span>
                        </div>
                        {index < steps.length - 1 && (
                            <div className="flex-1 h-1 mx-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full transition-all duration-500 ${
                                  myStatus === 'Approved' ? 'bg-emerald-400' : 'bg-slate-200'
                                }`}></div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
  };

  const shouldShowActionButtons = (req: ATARequest) => {
    if (req.status === 'Approved' || req.status === 'Rejected') return false;
    if (userRole === 'SUPER_USER') return true;
    return userRole.includes(req.current_step);
  };

  const handleAction = async (reqId: string, decision: 'Approved' | 'Rejected') => {
    const notes = prompt(`Masukkan catatan ${decision}:`);
    if (notes === null) return;
    try {
      const res = await fetch(`${API_BASE_URL}/ata/${reqId}/approve`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ role: userRole, decision, notes: notes || decision }),
      });
      if (res.ok) fetchRequests();
      else alert("Gagal memperbarui status.");
    } catch (e) { console.error(e); }
  };

  const handleSubmitATA = async () => {
    if (!formData.title || !formData.department) return alert('⚠️ Lengkapi data wajib!');
    setSubmitLoading(true);
    try {
      const form = new FormData();
      Object.entries(formData).forEach(([k, v]) => form.append(k, v));
      if (file) form.append('file', file);

      const res = await fetch(`${API_BASE_URL}/ata`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem("hr_token")}` },
        body: form,
      });

      if (res.ok) {
        setIsCreateModalOpen(false);
        setFormData({ requester_name: formData.requester_name, title: '', department: '', level: '', location: '', employment_type: '', salary_min: '', salary_max: '', justification: '' });
        setFile(null);
        fetchRequests();
        alert("Request berhasil dikirim!");
      }
    } catch (e) { alert("Terjadi kesalahan koneksi."); }
    finally { setSubmitLoading(false); }
  };

  const filteredRequests = requests.filter(req => {
    const matchesSearch = req.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         req.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || req.status.toLowerCase() === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="lg:ml-64 min-h-screen flex flex-col">
        <Header title="ATA Request Tracking" subtitle="Monitor status persetujuan Additional Task Assignment" />
        
        <main className="p-4 md:p-8 flex-1">
          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
               <p className="text-slate-500 text-sm font-medium">Total Request</p>
               <p className="text-3xl font-bold text-slate-900 mt-1">{requests.length}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
               <p className="text-amber-600 text-sm font-medium">Pending</p>
               <p className="text-3xl font-bold text-slate-900 mt-1">{requests.filter(r => r.status === 'Pending').length}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
               <p className="text-emerald-600 text-sm font-medium">Approved</p>
               <p className="text-3xl font-bold text-slate-900 mt-1">{requests.filter(r => r.status === 'Approved').length}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
               <p className="text-rose-600 text-sm font-medium">Rejected</p>
               <p className="text-3xl font-bold text-slate-900 mt-1">{requests.filter(r => r.status === 'Rejected').length}</p>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" placeholder="Cari posisi atau departemen..." 
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/20 bg-white shadow-sm"
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <select 
                className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none shadow-sm"
                value={filter} onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">Semua Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <button onClick={() => setIsCreateModalOpen(true)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-teal-600 text-white rounded-xl font-bold shadow-lg shadow-teal-600/20 hover:bg-teal-700 transition-all">
                <Plus size={20}/> Request Posisi
              </button>
            </div>
          </div>

          {/* Card List */}
          <div className="space-y-4">
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100">
                    <Loader2 className="animate-spin text-teal-600 mb-4" size={40} />
                    <p className="text-slate-500">Mengambil data terbaru...</p>
                </div>
            ) : filteredRequests.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 text-slate-400 font-medium">
                    Belum ada data pengajuan yang ditemukan.
                </div>
            ) : (
              filteredRequests.map((req) => (
                <div key={req.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-teal-300 transition-all group">
                  <div className="flex flex-col lg:flex-row justify-between gap-8">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-teal-50 text-teal-700 flex items-center justify-center rounded-xl font-bold text-xl border border-teal-100 group-hover:bg-teal-600 group-hover:text-white transition-colors duration-300">
                            {req.title[0]}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-lg">{req.title}</h3>
                          <div className="flex gap-3 text-sm text-slate-500 mt-1">
                             <span className="flex items-center gap-1.5"><FileText size={14}/> {req.department}</span>
                             <span className="text-slate-300">•</span>
                             <span className="flex items-center gap-1.5"><User size={14}/> {req.requester}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* STEPPER COMPONENT */}
                      <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                        {renderStepper(req)}
                      </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="lg:w-56 flex flex-col items-end justify-between border-t lg:border-t-0 lg:border-l border-slate-100 pt-6 lg:pt-0 lg:pl-8">
                      <span className={`px-4 py-1.5 rounded-full text-xs font-bold border shadow-sm ${
                        req.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        req.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>{req.status}</span>

                      <div className="w-full mt-6">
                        {shouldShowActionButtons(req) ? (
                          <div className="flex gap-2 mb-3">
                            <button onClick={() => handleAction(req.id, 'Rejected')} className="flex-1 py-2.5 text-xs font-bold bg-white text-rose-600 border border-rose-200 rounded-xl hover:bg-rose-50 transition-colors shadow-sm">Reject</button>
                            <button onClick={() => handleAction(req.id, 'Approved')} className="flex-1 py-2.5 text-xs font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 shadow-md shadow-emerald-200">Approve</button>
                          </div>
                        ) : req.status === 'Pending' && (
                          <div className="text-xs text-slate-400 text-center mb-3 bg-slate-50 py-2.5 rounded-xl border border-slate-100 flex items-center justify-center gap-2 font-medium">
                            <Clock size={14} className="text-slate-400"/> Menunggu {req.current_step}
                          </div>
                        )}
                        <button onClick={() => router.push(`/ata-requests/${req.id}`)} className="w-full py-2.5 text-teal-600 text-sm font-bold hover:bg-teal-50 rounded-xl transition-colors">
                            Lihat Detail →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
        <Footer />
      </div>

      {/* MODAL CREATE REQUEST (FULL VERSION) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 my-8">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-teal-600 text-white rounded-t-3xl">
              <div className="flex items-center gap-3">
                <Plus className="bg-white/20 p-1 rounded-lg" />
                <h2 className="text-xl font-bold">Request Posisi Baru</h2>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="hover:bg-teal-700 p-1 rounded-full transition-colors"><XCircle size={24}/></button>
            </div>

            <div className="p-6 md:p-8 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Judul Posisi</label>
                    <input type="text" className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all" 
                        value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="Contoh: Senior Engineer" />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Departemen</label>
                    <input type="text" className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all" 
                        value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} placeholder="Contoh: IT" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Level</label>
                    <select className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all bg-white"
                        value={formData.level} onChange={(e) => setFormData({...formData, level: e.target.value})}>
                        <option value="">Pilih Level</option>
                        <option value="Staff">Staff</option>
                        <option value="Supervisor">Supervisor</option>
                        <option value="Manager">Manager</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Lokasi</label>
                    <input type="text" className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                        value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} placeholder="Contoh: Jakarta / Site" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Gaji Min</label>
                    <input type="number" className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                        value={formData.salary_min} onChange={(e) => setFormData({...formData, salary_min: e.target.value})} />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Gaji Max</label>
                    <input type="number" className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                        value={formData.salary_max} onChange={(e) => setFormData({...formData, salary_max: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Justifikasi</label>
                <textarea className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 h-24 transition-all"
                    value={formData.justification} onChange={(e) => setFormData({...formData, justification: e.target.value})} placeholder="Alasan penambahan tenaga kerja..."></textarea>
              </div>

              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-teal-400 transition-all cursor-pointer bg-slate-50/50">
                  <UploadCloud className="mx-auto text-slate-400 mb-2" size={32} />
                  <label className="block text-sm font-medium text-slate-700 cursor-pointer">
                    <span className="text-teal-600 font-bold hover:underline">Klik untuk Upload Lampiran</span>
                    <input type="file" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} className="hidden" />
                    <p className="text-xs text-slate-400 mt-1">PDF, DOCX, atau Gambar (Max 5MB)</p>
                  </label>
                  {file && <div className="mt-3 p-2 bg-teal-50 rounded-lg text-teal-700 text-xs font-bold flex items-center justify-center gap-2 border border-teal-100">
                    <CheckCircle size={14}/> {file.name}
                  </div>}
              </div>

              <div className="pt-4 flex gap-4">
                <button onClick={() => setIsCreateModalOpen(false)} className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors shadow-sm" disabled={submitLoading}>Batal</button>
                <button onClick={handleSubmitATA} disabled={submitLoading} className="flex-1 py-3 bg-teal-600 text-white rounded-xl font-bold shadow-lg shadow-teal-600/20 hover:bg-teal-700 flex justify-center items-center gap-2 transition-all">
                    {submitLoading ? <><Loader2 className="animate-spin" size={20}/> Memproses...</> : "Kirim Request"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}