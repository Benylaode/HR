'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from "@/components/layout/Sidebar"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import { Loader2, Search, CheckCircle, XCircle, Clock, FileText, User, Plus } from 'lucide-react'

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
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/ata`)
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
        body: formDataToSend,
      })

      const data = await response.json()

      if (response.ok) {
        alert(
          `✅ ATA Request berhasil disubmit!\n\n` +
          `Request ID: ${data.id}\n` +
          `Posisi: ${formData.title}\n\n` +
          `Status: Menunggu approval HR (SLA: 24h)`
        )
        setIsCreateModalOpen(false)
        setFormData({
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
        setFile(null)
        fetchRequests()
      } else {
        alert(`❌ Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error submitting ATA:', error)
      alert('❌ Terjadi kesalahan')
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleApprove = async (reqId: string, role: 'HR' | 'KTT' | 'HO') => {
    const notes = prompt(`Masukkan catatan approval untuk ${role}:`)
    if (notes === null) return // User cancelled

    try {
      const response = await fetch(`${API_BASE_URL}/ata/${reqId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          decision: 'Approved',
          notes: notes || `Approved by ${role}`,
        }),
      })

      const data = await response.json()
      
      if (response.ok) {
        if (data.status === 'Approved' && data.job_id) {
          // Fully approved
          alert(
            `🎉 ATA Request FULLY APPROVED!\n\n` +
            `Job Position telah dibuat:\n` +
            `ID: ${data.job_id}\n` +
            `Title: ${data.job_title}\n\n` +
            `Silakan cek di halaman Job Positions.`
          )
        } else {
          // Partially approved
          alert(`✅ ${data.message}\n\nStatus: ${data.status}`)
        }
        fetchRequests() // Refresh list
      } else {
        alert(`❌ Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error approving:', error)
      alert('❌ Terjadi kesalahan')
    }
  }

  const handleReject = async (reqId: string, role: 'HR' | 'KTT' | 'HO') => {
    const notes = prompt(`Masukkan alasan penolakan untuk ${role}:`)
    if (!notes) {
      alert('⚠️ Alasan penolakan wajib diisi')
      return
    }

    if (!confirm(`⚠️ Yakin ingin REJECT request ini sebagai ${role}?\n\nRequest akan dibatalkan dan tidak dapat diproses lagi.`)) return

    try {
      const response = await fetch(`${API_BASE_URL}/ata/${reqId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          decision: 'Rejected',
          notes,
        }),
      })

      const data = await response.json()
      
      if (response.ok) {
        alert(
          `❌ ATA REQUEST DITOLAK\n\n` +
          `Ditolak oleh: ${data.rejected_by}\n` +
          `Job Position: ${data.job_title}\n` +
          `Requester: ${data.requester}\n` +
          `Alasan: ${data.rejected_reason}\n\n` +
          `Request ini tidak akan diproses lebih lanjut.`
        )
        fetchRequests()
      } else {
        alert(`❌ Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error rejecting:', error)
      alert('❌ Terjadi kesalahan')
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: { [key: string]: string } = {
      'Pending': 'badge badge-warning',
      'Approved': 'badge badge-success',
      'Rejected': 'badge badge-danger',
    }
    return badges[status] || 'badge badge-secondary'
  }

  const getApprovalIcon = (status: string) => {
    if (status === 'Approved') return <CheckCircle size={20} className="text-green-600" />
    if (status === 'Rejected') return <XCircle size={20} className="text-red-600" />
    return <Clock size={20} className="text-yellow-600" />
  }

  const filteredRequests = requests.filter(req => {
    const matchesFilter = filter === 'all' || req.status?.toLowerCase() === filter
    const matchesSearch = 
      (req.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (req.department?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (req.requester?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const getNextApprover = (req: ATARequest): 'HR' | 'KTT' | 'HO' | null => {
    if (req.status !== 'Pending') return null
    if (req.approvals.HR === 'Pending') return 'HR'
    if (req.approvals.KTT === 'Pending') return 'KTT'
    if (req.approvals.HO === 'Pending') return 'HO'
    return null
  }

  const getSLAInfo = (req: ATARequest) => {
    // Calculate hours since creation
    const createdDate = new Date(req.created_at)
    const now = new Date()
    const hoursElapsed = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60))
    
    const nextApprover = getNextApprover(req)
    
    if (!nextApprover || req.status !== 'Pending') return null
    
    // SLA: HR = 24h, KTT = 48h, HO = 72h
    if (nextApprover === 'HR') {
      const sla = 24
      const remaining = sla - hoursElapsed
      const exceeded = remaining < 0
      return {
        label: 'HR SLA',
        sla: '24h',
        remaining: Math.abs(remaining),
        exceeded,
        text: exceeded 
          ? `⚠️ Terlewat ${Math.abs(remaining)} jam` 
          : `✓ ${remaining} jam tersisa`
      }
    }
    
    if (nextApprover === 'KTT') {
      const sla = 48
      const remaining = sla - hoursElapsed
      const exceeded = remaining < 0
      return {
        label: 'KTT SLA',
        sla: '48h',
        remaining: Math.abs(remaining),
        exceeded,
        text: exceeded 
          ? `⚠️ Terlewat ${Math.abs(remaining)} jam` 
          : `✓ ${remaining} jam tersisa`
      }
    }
    
    if (nextApprover === 'HO') {
      const sla = 72
      const remaining = sla - hoursElapsed
      const exceeded = remaining < 0
      return {
        label: 'HO SLA',
        sla: '72h',
        remaining: Math.abs(remaining),
        exceeded,
        text: exceeded 
          ? `⚠️ Terlewat ${Math.abs(remaining)} jam` 
          : `✓ ${remaining} jam tersisa`
      }
    }
    
    return null
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar />
      <div className="lg:ml-64 min-h-screen flex flex-col">
        <Header
          title="ATA Request Tracking"
          subtitle="Monitor dan approve Additional Task Assignment requests"
        />

        <main className="p-4 md:p-8 flex-1">
          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <div className="card rounded-xl p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white hover-lift">
              <div className="text-3xl mb-2">📊</div>
              <div className="text-2xl font-bold">{requests.length}</div>
              <div className="text-blue-100 text-sm">Total Requests</div>
            </div>
            <div className="card rounded-xl p-6 bg-gradient-to-br from-yellow-500 to-orange-600 text-white hover-lift">
              <div className="text-3xl mb-2">⏳</div>
              <div className="text-2xl font-bold">{requests.filter(r => r.status === 'Pending').length}</div>
              <div className="text-orange-100 text-sm">Pending Approval</div>
            </div>
            <div className="card rounded-xl p-6 bg-gradient-to-br from-green-500 to-emerald-600 text-white hover-lift">
              <div className="text-3xl mb-2">✅</div>
              <div className="text-2xl font-bold">{requests.filter(r => r.status === 'Approved').length}</div>
              <div className="text-emerald-100 text-sm">Approved</div>
            </div>
            <div className="card rounded-xl p-6 bg-gradient-to-br from-red-500 to-pink-600 text-white hover-lift">
              <div className="text-3xl mb-2">❌</div>
              <div className="text-2xl font-bold">{requests.filter(r => r.status === 'Rejected').length}</div>
              <div className="text-pink-100 text-sm">Rejected</div>
            </div>
          </div>

          {/* Request Button - Prominent Position */}
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-[var(--primary)] text-white rounded-xl hover:bg-[var(--primary-700)] font-bold shadow-md hover:shadow-lg transition-all transform hover:scale-105"
            >
              <Plus size={20} />
              Request Posisi Baru
            </button>
          </div>

          {/* Toolbar */}
          <div className="card-static bg-white p-4 rounded-xl border border-[var(--secondary-200)] mb-6">
            <div className="flex flex-col gap-4">
              {/* Search */}
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--secondary-400)]" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-[var(--secondary-200)] rounded-lg focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] focus:outline-none transition-colors text-sm"
                  placeholder="Cari request..."
                />
              </div>

              {/* Filter Buttons */}
              <div className="flex gap-2 flex-wrap">
                {['all', 'pending', 'approved', 'rejected'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                      filter === f
                        ? 'bg-[var(--primary)] text-white shadow-md'
                        : 'bg-[var(--secondary-50)] text-slate-700 hover:bg-[var(--secondary-100)]'
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Requests List */}
          {loading ? (
            <div className="card-static rounded-xl p-12 text-center bg-white border border-[var(--secondary-200)]">
              <Loader2 className="inline-block animate-spin text-[var(--primary)] mb-4" size={40} />
              <p className="text-slate-600">Loading requests...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="card-static rounded-xl p-12 text-center bg-white border border-[var(--secondary-200)]">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="font-bold text-lg mb-2">Tidak ada request ditemukan</h3>
              <p className="text-slate-600">Coba sesuaikan filter atau pencarian Anda</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((req) => {
                const nextApprover = getNextApprover(req)
                
                return (
                  <div
                    key={req.id}
                    className="card-static rounded-xl p-6 bg-white border border-[var(--secondary-200)] hover:border-[var(--primary-200)] hover:shadow-lg transition-all"
                  >
                    <div className="flex flex-col lg:flex-row justify-between gap-4">
                      {/* Left: Request Info */}
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                            {req.title.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-slate-900 mb-1">{req.title}</h3>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                              <span className="flex items-center gap-1">
                                <FileText size={14} />
                                {req.department}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <User size={14} />
                                {req.requester}
                              </span>
                              <span>•</span>
                              <span>ID: {req.id}</span>
                            </div>
                          </div>
                        </div>

                        {/* Approval Progress */}
                        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg">
                          <div className="flex items-center gap-2">
                            {getApprovalIcon(req.approvals.HR)}
                            <span className="text-xs font-semibold text-slate-700">HR</span>
                          </div>
                          {/* Line HR -> KTT */}
                          <div className={`flex-1 h-1 rounded-full transition-all duration-500 ${
                            req.approvals.HR === 'Approved' 
                              ? 'bg-gradient-to-r from-green-500 to-green-400' 
                              : 'bg-slate-200'
                          }`} />
                          <div className="flex items-center gap-2">
                            {getApprovalIcon(req.approvals.KTT)}
                            <span className="text-xs font-semibold text-slate-700">KTT</span>
                          </div>
                          {/* Line KTT -> HO */}
                          <div className={`flex-1 h-1 rounded-full transition-all duration-500 ${
                            req.approvals.KTT === 'Approved' 
                              ? 'bg-gradient-to-r from-green-500 to-green-400' 
                              : 'bg-slate-200'
                          }`} />
                          <div className="flex items-center gap-2">
                            {getApprovalIcon(req.approvals.HO)}
                            <span className="text-xs font-semibold text-slate-700">HO</span>
                          </div>
                        </div>

                        {/* SLA Indicator */}
                        {(() => {
                          const slaInfo = getSLAInfo(req)
                          if (!slaInfo) return null
                          return (
                            <div className={`text-xs px-3 py-1.5 rounded-lg font-medium ${
                              slaInfo.exceeded 
                                ? 'bg-red-50 text-red-700 border border-red-200' 
                                : 'bg-green-50 text-green-700 border border-green-200'
                            }`}>
                              {slaInfo.text}
                            </div>
                          )
                        })()}
                      </div>

                      {/* Right: Status & Actions */}
                      <div className="flex flex-col items-end gap-3 lg:w-64">
                        <span className={`${getStatusBadge(req.status)} rounded-full px-4 py-1.5 text-xs font-bold`}>
                          {req.status}
                        </span>

                        {nextApprover && (
                          <div className="flex flex-col gap-2 w-full">
                            <p className="text-xs text-slate-600 text-right">
                              Waiting for <strong>{nextApprover}</strong> approval
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleReject(req.id, nextApprover)}
                                className="flex-1 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 font-semibold text-sm transition-colors border border-red-200"
                              >
                                Reject
                              </button>
                              <button
                                onClick={() => handleApprove(req.id, nextApprover)}
                                className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-sm transition-colors shadow-sm"
                              >
                                Approve
                              </button>
                            </div>
                          </div>
                        )}

                        <button
                          onClick={() => router.push(`/ata-requests/${req.id}`)}
                          className="text-teal-600 hover:text-teal-700 font-medium text-sm flex items-center gap-1"
                        >
                          View Details
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </main>
        <Footer />
      </div>

      {/* Create ATA Request Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[var(--primary)] text-white px-6 py-4 rounded-t-2xl">
              <h2 className="text-xl font-bold">Request Posisi Baru (ATA)</h2>
              <p className="text-sm text-teal-100 mt-1">Melalui approval HR → KTT → HO</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nama Requester *</label>
                  <input
                    type="text"
                    value={formData.requester_name}
                    onChange={(e) => setFormData({...formData, requester_name: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]"
                    placeholder="Nama Anda"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Job Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]"
                    placeholder="e.g. Senior Developer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Department *</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]"
                    placeholder="e.g. IT"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Level</label>
                  <input
                    type="text"
                    value={formData.level}
                    onChange={(e) => setFormData({...formData, level: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]"
                    placeholder="e.g. Senior"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]"
                    placeholder="e.g. Jakarta"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Employment Type</label>
                  <input
                    type="text"
                    value={formData.employment_type}
                    onChange={(e) => setFormData({...formData, employment_type: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]"
                    placeholder="e.g. Full-time"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Salary Min</label>
                  <input
                    type="number"
                    value={formData.salary_min}
                    onChange={(e) => setFormData({...formData, salary_min: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]"
                    placeholder="5000000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Salary Max</label>
                  <input
                    type="number"
                    value={formData.salary_max}
                    onChange={(e) => setFormData({...formData, salary_max: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]"
                    placeholder="10000000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Justification</label>
                <textarea
                  rows={4}
                  value={formData.justification}
                  onChange={(e) => setFormData({...formData, justification: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]"
                  placeholder="Jelaskan alasan kebutuhan posisi ini..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Attachment (Optional)</label>
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  accept=".pdf,.doc,.docx"
                />
                <p className="text-xs text-slate-500 mt-1">PDF, DOC, DOCX (Max 5MB)</p>
              </div>
            </div>

            <div className="border-t border-slate-200 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="px-5 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 font-semibold text-slate-600"
                disabled={submitLoading}
              >
                Batal
              </button>
              <button
                onClick={handleSubmitATA}
                disabled={submitLoading}
                className="px-5 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-700)] font-bold shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                {submitLoading && <Loader2 className="animate-spin" size={16} />}
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
