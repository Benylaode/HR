'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

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

export default function ATARequestsPage() {
  const [requests, setRequests] = useState<ATARequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ata`)
      const data = await response.json()
      setRequests(data)
    } catch (error) {
      console.error('Error fetching ATA requests:', error)
    } finally {
      setLoading(false)
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
    if (status === 'Approved') return '✅'
    if (status === 'Rejected') return '❌'
    return '⏳'
  }

  const filteredRequests = requests.filter(req => {
    if (filter === 'all') return true
    return req.status.toLowerCase() === filter
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-emerald-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 animate-slide-down">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">ATA Requests</h1>
            <p className="text-slate-600">Track semua Additional Task Assignment requests</p>
          </div>
          <Link 
            href="/ata-request"
            className="btn-primary rounded-lg px-6 py-3 font-semibold flex items-center gap-2 hover-lift"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New ATA Request
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="card rounded-xl p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="text-3xl mb-2">📊</div>
            <div className="text-2xl font-bold">{requests.length}</div>
            <div className="text-blue-100 text-sm">Total Requests</div>
          </div>
          <div className="card rounded-xl p-6 bg-gradient-to-br from-yellow-500 to-orange-600 text-white">
            <div className="text-3xl mb-2">⏳</div>
            <div className="text-2xl font-bold">{requests.filter(r => r.status === 'Pending').length}</div>
            <div className="text-orange-100 text-sm">Pending</div>
          </div>
          <div className="card rounded-xl p-6 bg-gradient-to-br from-green-500 to-emerald-600 text-white">
            <div className="text-3xl mb-2">✅</div>
            <div className="text-2xl font-bold">{requests.filter(r => r.status === 'Approved').length}</div>
            <div className="text-emerald-100 text-sm">Approved</div>
          </div>
          <div className="card rounded-xl p-6 bg-gradient-to-br from-red-500 to-pink-600 text-white">
            <div className="text-3xl mb-2">❌</div>
            <div className="text-2xl font-bold">{requests.filter(r => r.status === 'Rejected').length}</div>
            <div className="text-pink-100 text-sm">Rejected</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {['all', 'pending', 'approved', 'rejected'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                filter === f
                  ? 'bg-teal-600 text-white shadow-lg'
                  : 'bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Requests List */}
        {loading ? (
          <div className="card-static rounded-xl p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent mb-4" />
            <p className="text-slate-600">Loading requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="card-static rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-slate-600 text-lg">Belum ada ATA request</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((req) => (
              <div
                key={req.id}
                className="card rounded-xl p-6 hover-lift animate-fade-in"
              >
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white font-bold text-lg">
                        {req.title.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-slate-900">{req.title}</h3>
                        <p className="text-sm text-slate-600">
                          {req.department} • Requested by {req.requester}
                        </p>
                      </div>
                    </div>

                    {/* Approval Progress */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-1">
                        <span className="text-lg">{getApprovalIcon(req.approvals.HR)}</span>
                        <span className="text-xs font-medium text-slate-600">HR</span>
                      </div>
                      <div className="w-8 h-0.5 bg-slate-300" />
                      <div className="flex items-center gap-1">
                        <span className="text-lg">{getApprovalIcon(req.approvals.KTT)}</span>
                        <span className="text-xs font-medium text-slate-600">KTT</span>
                      </div>
                      <div className="w-8 h-0.5 bg-slate-300" />
                      <div className="flex items-center gap-1">
                        <span className="text-lg">{getApprovalIcon(req.approvals.HO)}</span>
                        <span className="text-xs font-medium text-slate-600">HO</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {req.created_at}
                      </span>
                      <span>• ID: {req.id}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <span className={`${getStatusBadge(req.status)} rounded-full px-4 py-1.5`}>
                      {req.status}
                    </span>
                    <Link
                      href={`/ata-requests/${req.id}`}
                      className="text-teal-600 hover:text-teal-700 font-medium text-sm flex items-center gap-1"
                    >
                      View Details
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
