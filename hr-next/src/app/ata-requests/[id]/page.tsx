'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Sidebar from "@/components/layout/Sidebar"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import { Loader2, ChevronLeft, Download, FileText, Building2, MapPin, Briefcase, DollarSign, Clock, CheckCircle, XCircle, User as UserIcon } from 'lucide-react'

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

  useEffect(() => {
    fetchRequest()
  }, [params.id])

  const fetchRequest = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/ata/${params.id}`)
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
        headers: { 'Content-Type': 'application/json' },
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
            {/* Left Column - Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Job Details Card */}
              <div className="card-static rounded-xl p-6 bg-white">
                <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Briefcase className="text-[var(--primary)]" size={24} />
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

                  <div className="flex items-start gap-3">
                    <MapPin className="text-slate-400 mt-1" size={18} />
                    <div>
                      <label className="text-xs font-medium text-slate-500">Location</label>
                      <p className="text-slate-900 font-semibold">{request.location || '-'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Briefcase className="text-slate-400 mt-1" size={18} />
                    <div>
                      <label className="text-xs font-medium text-slate-500">Level</label>
                      <p className="text-slate-900 font-semibold">{request.level || '-'}</p>
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

                  <div className="flex items-start gap-3">
                    <Clock className="text-slate-400 mt-1" size={18} />
                    <div>
                      <label className="text-xs font-medium text-slate-500">Requested On</label>
                      <p className="text-slate-900 font-semibold">
                        {new Date(request.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Salary Card */}
              {(request.salary_min > 0 || request.salary_max > 0) && (
                <div className="card-static rounded-xl p-6 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200">
                  <h2 className="text-xl font-bold text-emerald-900 mb-4 flex items-center gap-2">
                    <DollarSign className="text-emerald-600" size={24} />
                    Salary Range
                  </h2>
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-sm text-emerald-700 mb-1">Minimum</p>
                      <p className="text-2xl font-bold text-emerald-900">{formatCurrency(request.salary_min)}</p>
                    </div>
                    <div className="text-3xl text-emerald-400">→</div>
                    <div>
                      <p className="text-sm text-emerald-700 mb-1">Maximum</p>
                      <p className="text-2xl font-bold text-emerald-900">{formatCurrency(request.salary_max)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Justification Card */}
              <div className="card-static rounded-xl p-6 bg-white">
                <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <FileText className="text-[var(--primary)]" size={24} />
                  Justification
                </h2>
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {request.justification || 'No justification provided'}
                </p>
              </div>

              {/* Attachment Card with PDF Viewer */}
              {request.attachment_url && (
                <div className="card-static rounded-xl p-6 bg-white border-2 border-orange-200">
                  <h2 className="text-xl font-bold text-orange-900 mb-4 flex items-center gap-2">
                    <FileText className="text-orange-600" size={24} />
                    Attachment Document
                  </h2>
                  <div className="space-y-3">
                    <a
                      href={`${API_BASE_URL}${request.attachment_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold transition-colors"
                    >
                      <Download size={18} />
                      Download Attachment
                    </a>

                    {/* PDF Preview */}
                    {request.attachment_url.toLowerCase().endsWith('.pdf') && (
                      <div className="border-2 border-slate-200 rounded-lg overflow-hidden">
                        <iframe
                          src={`${API_BASE_URL}${request.attachment_url}`}
                          className="w-full h-[600px]"
                          title="PDF Preview"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Approval Timeline */}
            <div className="space-y-6">
              {/* Approval Timeline */}
              <div className="card-static rounded-xl p-6 bg-white">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Approval Timeline</h2>
                
                {/* HR */}
                <div className="mb-6 relative">
                  <div className={`flex items-start gap-3 p-4 rounded-lg ${
                    request.hr_status === 'Approved' ? 'bg-green-50 border-2 border-green-200' :
                    request.hr_status === 'Rejected' ? 'bg-red-50 border-2 border-red-200' :
                    'bg-yellow-50 border-2 border-yellow-200'
                  }`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      request.hr_status === 'Approved' ? 'bg-green-500' :
                      request.hr_status === 'Rejected' ? 'bg-red-500' :
                      'bg-yellow-500'
                    }`}>
                      {request.hr_status === 'Approved' ? <CheckCircle className="text-white" size={20} /> :
                       request.hr_status === 'Rejected' ? <XCircle className="text-white" size={20} /> :
                       <Clock className="text-white" size={20} />}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900">HR Approval</h3>
                      <p className="text-xs text-slate-600 mb-1">SLA: 24 hours</p>
                      <span className={`inline-block text-xs px-2 py-1 rounded-full font-semibold ${getStatusBadge(request.hr_status)}`}>
                        {request.hr_status}
                      </span>
                      {request.hr_notes && (
                        <p className="mt-2 text-sm text-slate-700 italic">"{request.hr_notes}"</p>
                      )}
                      {request.hr_date && (
                        <p className="mt-1 text-xs text-slate-500">
                          {new Date(request.hr_date).toLocaleString('id-ID')}
                        </p>
                      )}
                    </div>
                  </div>
                  {request.hr_status !== 'Pending' && <div className="absolute left-[28px] top-[72px] bottom-[-24px] w-0.5 bg-slate-200" />}
                </div>

                {/* KTT */}
                <div className="mb-6 relative">
                  <div className={`flex items-start gap-3 p-4 rounded-lg ${
                    request.ktt_status === 'Approved' ? 'bg-green-50 border-2 border-green-200' :
                    request.ktt_status === 'Rejected' ? 'bg-red-50 border-2 border-red-200' :
                    'bg-yellow-50 border-2 border-yellow-200'
                  }`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      request.ktt_status === 'Approved' ? 'bg-green-500' :
                      request.ktt_status === 'Rejected' ? 'bg-red-500' :
                      'bg-yellow-500'
                    }`}>
                      {request.ktt_status === 'Approved' ? <CheckCircle className="text-white" size={20} /> :
                       request.ktt_status === 'Rejected' ? <XCircle className="text-white" size={20} /> :
                       <Clock className="text-white" size={20} />}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900">KTT Approval</h3>
                      <p className="text-xs text-slate-600 mb-1">SLA: 48 hours</p>
                      <span className={`inline-block text-xs px-2 py-1 rounded-full font-semibold ${getStatusBadge(request.ktt_status)}`}>
                        {request.ktt_status}
                      </span>
                      {request.ktt_notes && (
                        <p className="mt-2 text-sm text-slate-700 italic">"{request.ktt_notes}"</p>
                      )}
                      {request.ktt_date && (
                        <p className="mt-1 text-xs text-slate-500">
                          {new Date(request.ktt_date).toLocaleString('id-ID')}
                        </p>
                      )}
                    </div>
                  </div>
                  {request.ktt_status !== 'Pending' && <div className="absolute left-[28px] top-[72px] bottom-[-24px] w-0.5 bg-slate-200" />}
                </div>

                {/* HO */}
                <div>
                  <div className={`flex items-start gap-3 p-4 rounded-lg ${
                    request.ho_status === 'Approved' ? 'bg-green-50 border-2 border-green-200' :
                    request.ho_status === 'Rejected' ? 'bg-red-50 border-2 border-red-200' :
                    'bg-yellow-50 border-2 border-yellow-200'
                  }`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      request.ho_status === 'Approved' ? 'bg-green-500' :
                      request.ho_status === 'Rejected' ? 'bg-red-500' :
                      'bg-yellow-500'
                    }`}>
                      {request.ho_status === 'Approved' ? <CheckCircle className="text-white" size={20} /> :
                       request.ho_status === 'Rejected' ? <XCircle className="text-white" size={20} /> :
                       <Clock className="text-white" size={20} />}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900">HO Jakarta Approval</h3>
                      <p className="text-xs text-slate-600 mb-1">SLA: 72 hours</p>
                      <span className={`inline-block text-xs px-2 py-1 rounded-full font-semibold ${getStatusBadge(request.ho_status)}`}>
                        {request.ho_status}
                      </span>
                      {request.ho_notes && (
                        <p className="mt-2 text-sm text-slate-700 italic">"{request.ho_notes}"</p>
                      )}
                      {request.ho_date && (
                        <p className="mt-1 text-xs text-slate-500">
                          {new Date(request.ho_date).toLocaleString('id-ID')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {nextApprover && request.status === 'Pending' && (
                <div className="card-static rounded-xl p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
                  <h3 className="font-bold text-blue-900 mb-3">Take Action as {nextApprover}</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => handleApproval(nextApprover, 'Approved')}
                      disabled={approveLoading}
                      className="w-full bg-green-600 text-white rounded-lg py-3 font-bold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {approveLoading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                      Approve
                    </button>
                    <button
                      onClick={() => handleApproval(nextApprover, 'Rejected')}
                      disabled={approveLoading}
                      className="w-full bg-red-600 text-white rounded-lg py-3 font-bold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {approveLoading ? <Loader2 className="animate-spin" size={18} /> : <XCircle size={18} />}
                      Reject
                    </button>
                  </div>
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
