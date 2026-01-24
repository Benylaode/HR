'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from "@/components/layout/Sidebar"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import { Loader2, Search, CheckCircle, XCircle, Clock, FileText, User, Plus, AlertCircle } from 'lucide-react'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001"

interface ATARequest {
  id: string
  title: string
  requester: string
  department: string
  status: string
  approvals: {
    HR: string
    KTT: string
    HO: string
  }
  created_at: string
}

export default function ATATrackingPage() {
  const router = useRouter()
  const [requests, setRequests] = useState<ATARequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [userRole, setUserRole] = useState<string | null>(null)
  
  // Create ATA Request Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    requester_name: '',
    title: '',
    department: '',
    level: '',
    location: '',
    employment_type: '',
    salary_min: '',
    salary_max: '',
    justification: '',
  })
  const [file, setFile] = useState<File | null>(null)
  const [submitLoading, setSubmitLoading] = useState(false)

  useEffect(() => {
    // Ambil Role User dari LocalStorage
    const userData = localStorage.getItem("hr_user")
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUserRole(parsedUser.role)
    }
    fetchRequests()
  }, [])

    const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem("hr_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

  const fetchRequests = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/ata`, { headers: getAuthHeaders() })
      const data = await response.json()
      setRequests(data)
    } catch (error) {
      console.error('Error fetching ATA requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitATA = async () => {
    if (!formData.title || !formData.department) {
      alert('⚠️ Title dan Department wajib diisi')
      return
    }

    setSubmitLoading(true)
    try {
      const formDataToSend = new FormData()
      formDataToSend.append('requester_name', formData.requester_name || 'User')
      formDataToSend.append('title', formData.title)
      formDataToSend.append('department', formData.department)
      formDataToSend.append('level', formData.level)
      formDataToSend.append('location', formData.location)
      formDataToSend.append('employment_type', formData.employment_type)
      formDataToSend.append('salary_min', formData.salary_min)
      formDataToSend.append('salary_max', formData.salary_max)
      formDataToSend.append('justification', formData.justification)
      
      if (file) {
        formDataToSend.append('file', file)
      }

      const response = await fetch(`${API_BASE_URL}/ata`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formDataToSend,
      })

      if (response.ok) {
        setIsCreateModalOpen(false)
        setFormData({ requester_name: '', title: '', department: '', level: '', location: '', employment_type: '', salary_min: '', salary_max: '', justification: '' })
        setFile(null)
        fetchRequests()
      }
    } catch (error) {
      console.error('Error submitting ATA:', error)
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleApprove = async (reqId: string, role: string) => {
    const notes = prompt(`Masukkan catatan approval untuk ${role}:`)
    if (notes === null) return

    try {
      const response = await fetch(`${API_BASE_URL}/ata/${reqId}/approve`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ role, decision: 'Approved', notes: notes || `Approved by ${role}` }),
      })
      if (response.ok) fetchRequests()
    } catch (error) {
      console.error('Error approving:', error)
    }
  }

  const handleReject = async (reqId: string, role: string) => {
    const notes = prompt(`Masukkan alasan penolakan untuk ${role}:`)
    if (!notes) return

    try {
      const response = await fetch(`${API_BASE_URL}/ata/${reqId}/approve`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ role, decision: 'Rejected', notes }),
      })
      if (response.ok) fetchRequests()
    } catch (error) {
      console.error('Error rejecting:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Pending': return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'Approved': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
      case 'Rejected': return 'bg-rose-100 text-rose-700 border-rose-200'
      default: return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  const getApprovalIcon = (status: string) => {
    if (status === 'Approved') return <CheckCircle size={20} className="text-emerald-500" />
    if (status === 'Rejected') return <XCircle size={20} className="text-rose-500" />
    return <Clock size={20} className="text-amber-500" />
  }

  const getNextApprover = (req: ATARequest): 'HR' | 'KTT' | 'HO' | null => {
    if (req.status !== 'Pending') return null
    if (req.approvals.HR === 'Pending') return 'HR'
    if (req.approvals.KTT === 'Pending') return 'KTT'
    if (req.approvals.HO === 'Pending') return 'HO'
    return null
  }

  const filteredRequests = requests.filter(req => {
    const matchesFilter = filter === 'all' || req.status?.toLowerCase() === filter
    const matchesSearch = req.title?.toLowerCase().includes(searchQuery.toLowerCase()) || req.department?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar />
      <div className="lg:ml-64 min-h-screen flex flex-col">
        <Header title="ATA Request Tracking" subtitle="Monitor dan approve Additional Task Assignment requests" />

        <main className="p-4 md:p-8 flex-1">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
               <p className="text-slate-500 text-sm font-medium">Total Request</p>
               <p className="text-3xl font-bold text-slate-900 mt-1">{requests.length}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
               <p className="text-amber-600 text-sm font-medium">Pending Approval</p>
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

          {/* Action Toolbar */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:outline-none text-slate-700"
                placeholder="Cari berdasarkan posisi atau departemen..."
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20">
                <Plus size={20} /> Request Posisi
              </button>
            </div>
          </div>

          {/* List Requests */}
          <div className="space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100">
                <Loader2 className="animate-spin text-teal-600 mb-4" size={40} />
                <p className="text-slate-500 animate-pulse">Mengambil data terbaru...</p>
              </div>
            ) : filteredRequests.map((req) => {
              const nextApprover = getNextApprover(req)
              return (
                <div key={req.id} className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-teal-200 transition-all shadow-sm">
                  <div className="flex flex-col lg:flex-row justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 font-bold text-lg border border-teal-100">
                          {req.title.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-slate-900">{req.title}</h3>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 mt-1">
                            <span className="flex items-center gap-1.5"><FileText size={14}/> {req.department}</span>
                            <span className="text-slate-300">•</span>
                            <span className="flex items-center gap-1.5"><User size={14}/> {req.requester}</span>
                          </div>
                        </div>
                      </div>

                      {/* Timeline Alur */}
                      <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className="flex flex-col items-center">
                          {getApprovalIcon(req.approvals.HR)}
                          <span className="text-[10px] font-bold text-slate-500 mt-1">HR</span>
                        </div>
                        <div className="flex-1 h-px bg-slate-200"></div>
                        <div className="flex flex-col items-center">
                          {getApprovalIcon(req.approvals.KTT)}
                          <span className="text-[10px] font-bold text-slate-500 mt-1">KTT</span>
                        </div>
                        <div className="flex-1 h-px bg-slate-200"></div>
                        <div className="flex flex-col items-center">
                          {getApprovalIcon(req.approvals.HO)}
                          <span className="text-[10px] font-bold text-slate-500 mt-1">HO</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end justify-between lg:w-64">
                      <span className={`px-4 py-1.5 rounded-full text-xs font-bold border ${getStatusBadge(req.status)}`}>
                        {req.status}
                      </span>

                      {/* Tombol Aksi - Hanya muncul jika BUKAN HR */}
                      {nextApprover && (
                        <div className="w-full mt-4">
                          {userRole === "HR" ? (
                            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-100">
                               <AlertCircle size={14} />
                               <p className="text-[11px] font-medium">Menunggu approval {nextApprover}</p>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <button onClick={() => handleReject(req.id, nextApprover)} className="flex-1 py-2 bg-white border border-rose-200 text-rose-600 rounded-lg font-bold text-xs hover:bg-rose-50 transition-colors">Reject</button>
                              <button onClick={() => handleApprove(req.id, nextApprover)} className="flex-1 py-2 bg-emerald-600 text-white rounded-lg font-bold text-xs hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20">Approve</button>
                            </div>
                          )}
                        </div>
                      )}

                      <button onClick={() => router.push(`/ata-requests/${req.id}`)} className="text-teal-600 hover:text-teal-700 text-sm font-bold mt-4">
                        Lihat Detail →
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </main>
        <Footer />
      </div>

      {/* MODAL CREATE ATA (Hanya Header & Actions untuk hemat ruang) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-teal-600 text-white">
               <h2 className="text-xl font-bold">Request Posisi Baru</h2>
               <button onClick={() => setIsCreateModalOpen(false)}><XCircle size={24}/></button>
            </div>
            <div className="p-8 text-center text-slate-500">
               {/* Form asli Anda diletakkan di sini */}
               Isi form pengajuan posisi baru sesuai kebutuhan...
               <div className="mt-8 flex gap-3">
                  <button onClick={() => setIsCreateModalOpen(false)} className="flex-1 py-3 border border-slate-200 rounded-xl font-bold">Batal</button>
                  <button onClick={handleSubmitATA} className="flex-1 py-3 bg-teal-600 text-white rounded-xl font-bold shadow-lg shadow-teal-600/20">Kirim Request</button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}