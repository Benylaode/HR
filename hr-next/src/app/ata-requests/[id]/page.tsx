'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Sidebar from "@/components/layout/Sidebar"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import { Loader2, ChevronLeft, Download, FileText, Building2, MapPin, Briefcase, DollarSign, Clock, CheckCircle, XCircle, User as UserIcon, AlertCircle } from 'lucide-react'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001"

interface ATARequestDetail {
  id: string
  requester_name: string
  title: string
  department: string
  level: string
  location: string
  employment_type: string
  salary_min: number
  salary_max: number
  justification: string
  attachment_url: string | null
  status: string
  hr_status: string
  hr_notes: string | null
  hr_date: string | null
  ktt_status: string
  ktt_notes: string | null
  ktt_date: string | null
  ho_status: string
  ho_notes: string | null
  ho_date: string | null
  created_at: string
  job_id: string | null
}

export default function ATARequestDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [request, setRequest] = useState<ATARequestDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [approveLoading, setApproveLoading] = useState(false)
  
  // State untuk menyimpan role user yang sedang login
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    // Ambil data user dari localStorage untuk pengecekan role
    const userData = localStorage.getItem("hr_user")
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUserRole(parsedUser.role)
    }
    fetchRequest()
  }, [params.id])

    const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem("hr_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

  const fetchRequest = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/ata/${params.id}`, { headers: getAuthHeaders() })
      const data = await response.json()
      setRequest(data)
    } catch (error) {
      console.error('Error fetching request:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApproval = async (role: 'HR' | 'KTT' | 'HO', decision: 'Approved' | 'Rejected') => {
    if (!request) return
    
    const notes = prompt(`Masukkan catatan ${decision === 'Approved' ? 'approval' : 'penolakan'}:`)
    if (decision === 'Rejected' && !notes) {
      alert('⚠️ Catatan wajib diisi untuk rejection')
      return
    }

    setApproveLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/ata/${request.id}/approve`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          role,
          decision,
          notes: notes || `${decision} by ${role}`,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        alert(`✅ ${data.message}`)
        router.push('/ata-tracking')
      } else {
        alert(`❌ Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error submitting approval:', error)
      alert('❌ Terjadi kesalahan')
    } finally {
      setApproveLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: { [key: string]: string } = {
      'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Approved': 'bg-green-100 text-green-800 border-green-200',
      'Rejected': 'bg-red-100 text-red-800 border-red-200',
    }
    return badges[status] || 'bg-gray-100 text-gray-800'
  }

  const getNextApprover = (): 'HR' | 'KTT' | 'HO' | null => {
    if (!request || request.status !== 'Pending') return null
    if (request.hr_status === 'Pending') return 'HR'
    if (request.ktt_status === 'Pending') return 'KTT'
    if (request.ho_status === 'Pending') return 'HO'
    return null
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <Sidebar />
        <div className="lg:ml-64 min-h-screen flex flex-col">
          <Header title="ATA Request Detail" subtitle="Loading..." />
          <main className="flex-1 flex items-center justify-center p-8">
            <Loader2 className="animate-spin text-[var(--primary)]" size={48} />
          </main>
          <Footer />
        </div>
      </div>
    )
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <Sidebar />
        <div className="lg:ml-64 min-h-screen flex flex-col">
          <Header title="ATA Request Detail" subtitle="Not found" />
          <main className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <div className="text-6xl mb-4">❌</div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Request Not Found</h2>
              <button 
                onClick={() => router.push('/ata-tracking')} 
                className="mt-4 px-6 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-700)] font-semibold"
              >
                Back to Tracking
              </button>
            </div>
          </main>
          <Footer />
        </div>
      </div>
    )
  }

  const nextApprover = getNextApprover()

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar />
      <div className="lg:ml-64 min-h-screen flex flex-col">
        <Header 
          title={`ATA Request: ${request.id}`}
          subtitle={request.title}
        />

        <main className="p-4 md:p-8 flex-1">
          {/* Back Button */}
          <button
            onClick={() => router.push('/ata-tracking')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 font-medium"
          >
            <ChevronLeft size={20} />
            Back to Tracking
          </button>

          {/* Status Banner */}
          <div className={`rounded-xl p-6 mb-6 border-2 ${getStatusBadge(request.status)}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold mb-1">Status: {request.status}</h3>
                <p className="text-sm opacity-80">
                  {nextApprover ? `Waiting for ${nextApprover} approval` : 
                   request.status === 'Approved' ? 'All approvals completed' : 
                   'Request has been rejected'}
                </p>
              </div>
              {request.job_id && (
                <div className="bg-white/50 px-4 py-2 rounded-lg">
                  <p className="text-xs font-medium">Job Created</p>
                  <p className="text-sm font-bold">ID: {request.job_id}</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Position Details Card */}
              <div className="card-static rounded-xl p-6 bg-white border border-slate-200">
                <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Briefcase className="text-teal-600" size={24} />
                  Position Details
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Building2 className="text-slate-400 mt-1" size={18} />
                    <div>
                      <label className="text-xs font-medium text-slate-500">Department</label>
                      <p className="text-slate-900 font-semibold">{request.department}</p>
                    </div>
                  </div>
                  {/* ... (detail lainnya tetap sama) */}
                  <div className="flex items-start gap-3">
                    <MapPin className="text-slate-400 mt-1" size={18} />
                    <div>
                      <label className="text-xs font-medium text-slate-500">Location</label>
                      <p className="text-slate-900 font-semibold">{request.location || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="text-slate-400 mt-1" size={18} />
                    <div>
                      <label className="text-xs font-medium text-slate-500">Employment Type</label>
                      <p className="text-slate-900 font-semibold">{request.employment_type || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <UserIcon className="text-slate-400 mt-1" size={18} />
                    <div>
                      <label className="text-xs font-medium text-slate-500">Requester</label>
                      <p className="text-slate-900 font-semibold">{request.requester_name}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Justification & Attachment (tetap sama) */}
              <div className="card-static rounded-xl p-6 bg-white border border-slate-200">
                <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <FileText className="text-teal-600" size={24} />
                  Justification
                </h2>
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {request.justification || 'No justification provided'}
                </p>
              </div>
            </div>

            {/* Right Column - Approval Timeline & Actions */}
            <div className="space-y-6">
              <div className="card-static rounded-xl p-6 bg-white border border-slate-200">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Approval Timeline</h2>
                
                {/* Timeline item HR, KTT, HO (logika warna tetap sama) */}
                <div className="space-y-6">
                   {/* HR Item */}
                   <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${request.hr_status === 'Approved' ? 'bg-green-500' : 'bg-yellow-500'}`}>
                         {request.hr_status === 'Approved' ? <CheckCircle size={16} className="text-white"/> : <Clock size={16} className="text-white"/>}
                      </div>
                      <div>
                         <p className="text-sm font-bold text-slate-900">HR Approval</p>
                         <p className="text-xs text-slate-500">{request.hr_status}</p>
                      </div>
                   </div>
                   {/* ... KTT & HO Items ... */}
                </div>
              </div>

              {/* Action Buttons - TERAPKAN FILTER ROLE DISINI */}
              {nextApprover && request.status === 'Pending' && (
                <div className="card-static rounded-xl p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-sm">
                  <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                    <AlertCircle size={18} />
                    Take Action as {nextApprover}
                  </h3>

                  {userRole === "HR" ? (
                    // Tampilan jika user adalah HR: Tombol disembunyikan, tampilkan pesan info
                    <div className="bg-white/60 p-3 rounded-lg border border-blue-100">
                      <p className="text-xs text-blue-700 font-medium leading-relaxed">
                        ⚠️ Status Anda adalah <strong>HR Staff</strong>. Menunggu approval selanjutnya dari pihak terkait (KTT/HO) sesuai alur sistem.
                      </p>
                    </div>
                  ) : (
                    // Tampilan jika user BUKAN HR (Admin): Tombol muncul
                    <div className="space-y-2">
                      <button
                        onClick={() => handleApproval(nextApprover, 'Approved')}
                        disabled={approveLoading}
                        className="w-full bg-emerald-600 text-white rounded-lg py-3 font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                      >
                        {approveLoading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                        Approve Request
                      </button>
                      <button
                        onClick={() => handleApproval(nextApprover, 'Rejected')}
                        disabled={approveLoading}
                        className="w-full bg-rose-600 text-white rounded-lg py-3 font-bold hover:bg-rose-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                      >
                        {approveLoading ? <Loader2 className="animate-spin" size={18} /> : <XCircle size={18} />}
                        Reject Request
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  )
}