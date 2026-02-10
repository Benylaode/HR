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
  const [userRole, setUserRole] = useState<string>('') 
  
  // State untuk penanda apakah user ini TIM HR atau BUKAN
  const [isHR, setIsHR] = useState(false)

  useEffect(() => {
    // 1. PERBAIKAN DI SINI: Gunakan key "role" (bukan hr_role)
    const rawRole = localStorage.getItem("role"); 
    
    // 2. Normalisasi (Huruf Besar & Trim spasi)
    const role = rawRole ? rawRole.toUpperCase().trim() : ''; 
    
    setUserRole(role);
    // 3. Logic Pendeteksi HR yang Aman
    // Cek apakah di dalam role ada kata "HR" (misal: "HR STAFF", "HEAD OF HR", "HR")
    if (role.includes('HR')) {
        setIsHR(true); // User ini dikenali sebagai orang HR
    } else {
        setIsHR(false);
    }

    fetchRequests();
  }, [])

  const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem("hr_token"); // Pastikan token key-nya benar juga (cek localStorage Anda)
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const fetchRequests = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ata`, { headers: getAuthHeaders() })
      const data = await response.json()
      setRequests(data)
    } catch (error) {
      console.error('Error fetching ATA requests:', error)
    } finally {
      setLoading(false)
    }
  }

  // Logic Tombol Action (Approve/Reject)
  const shouldShowActionButtons = (req: ATARequest) => {
    // Jika user terdeteksi sebagai HR, MATIKAN tombol Action di list ini
    if (isHR) return false; 

    if (req.status === 'Approved' || req.status === 'Rejected') return false;
    
    // Logic Approve untuk KTT dan HO
    if (userRole === 'KTT') return req.approvals.HR === 'Approved' && req.approvals.KTT === 'Pending';
    if (userRole === 'HO') return req.approvals.KTT === 'Approved' && req.approvals.HO === 'Pending';
    
    return false;
  }

  // --- STEPPER VISUAL ---
  const renderApprovalStepper = (approvals: ATARequest['approvals']) => {
    const steps = [
      { key: 'HR', label: 'HR' },
      { key: 'KTT', label: 'KTT' },
      { key: 'HO', label: 'HO' }
    ];

    return (
      <div className="flex items-center w-full max-w-sm mt-4 mb-2">
        {steps.map((step, index) => {
          const status = approvals[step.key as keyof typeof approvals];
          let isActive = false;
          if (status === 'Pending') {
             if (index === 0) isActive = true; 
             else {
                const prevStepKey = steps[index - 1].key as keyof typeof approvals;
                if (approvals[prevStepKey] === 'Approved') isActive = true;
             }
          }

          let circleClass = "bg-slate-100 border-slate-300 text-slate-400"; 
          let icon = <span className="text-[10px] font-bold">{index + 1}</span>;

          if (status === 'Approved') {
            circleClass = "bg-emerald-100 border-emerald-500 text-emerald-600";
            icon = <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>;
          } else if (status === 'Rejected') {
            circleClass = "bg-red-100 border-red-500 text-red-600";
            icon = <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>;
          } else if (isActive) {
            circleClass = "bg-yellow-50 border-yellow-500 text-yellow-600 ring-2 ring-yellow-200 ring-offset-1 animate-pulse";
            icon = <span className="text-[10px] font-bold">Wait</span>;
          }

          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              <div className="relative flex flex-col items-center group">
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center z-10 transition-all duration-300 ${circleClass}`}>
                  {icon}
                </div>
                <span className={`absolute -bottom-5 text-[10px] font-semibold whitespace-nowrap ${isActive ? 'text-yellow-600' : 'text-slate-500'}`}>
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-1 mx-1 rounded ${status === 'Approved' ? 'bg-emerald-400' : 'bg-slate-200'}`} />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
      console.log(`${action} request ${id} by ${userRole}`);
      // Panggil API Approve/Reject disini
  }

  const filteredRequests = requests.filter(req => {
    if (filter === 'all') return true
    return req.status.toLowerCase() === filter
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-emerald-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">ATA Request Tracking</h1>
            <p className="text-slate-600">Monitor dan approve Additional Task Assignment requests</p>
          </div>
          <Link 
            href="/ata-request"
            className="btn-primary bg-teal-600 text-white rounded-lg px-6 py-3 font-semibold flex items-center gap-2 hover:bg-teal-700 transition-colors shadow-lg"
          >
            + Request Posisi
          </Link>
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

        {/* List */}
        {loading ? (
          <div className="text-center p-12">Loading...</div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-xl shadow-sm">Belum ada data</div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((req) => (
              <div key={req.id} className="card rounded-xl p-6 bg-white shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                  
                  {/* KIRI */}
                  <div className="flex-1 w-full">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 font-bold text-lg">
                        {req.title.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-slate-900">{req.title}</h3>
                        <div className="flex items-center text-xs text-slate-500 mt-1 space-x-2">
                           <span>📄 {req.department}</span>
                           <span>•</span>
                           <span>👤 {req.requester}</span>
                        </div>
                      </div>
                    </div>
                    {renderApprovalStepper(req.approvals)}
                  </div>

                  {/* KANAN */}
                  <div className="flex flex-col items-end gap-3 mt-2 md:mt-0">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                      req.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                      req.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {req.status}
                    </span>

                    <div className="flex items-center gap-2 mt-2">
                        {/* 1. Logic Tombol Approve (Muncul jika isHR FALSE dan giliran KTT/HO) */}
                        {shouldShowActionButtons(req) && (
                            <>
                                <button onClick={() => handleAction(req.id, 'reject')} className="px-4 py-1.5 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50">
                                    Reject
                                </button>
                                <button onClick={() => handleAction(req.id, 'approve')} className="px-4 py-1.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700">
                                    Approve
                                </button>
                            </>
                        )}

                        {/* 2. Logic Tombol Detail */}
                        {/* Kunci Perbaikan: HANYA MUNCUL JIKA `isHR` ADALAH FALSE */}
                        {!isHR && (
                          <Link
                            href={`/ata-requests/${req.id}`}
                            className="flex items-center gap-1 text-teal-600 font-semibold text-sm hover:underline px-3 py-1"
                          >
                            Lihat Detail →
                          </Link>
                        )}
                    </div>
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