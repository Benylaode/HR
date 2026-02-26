'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function ATARequestPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  // State disesuaikan dengan 15 field baru
  const [formData, setFormData] = useState({
    requesterName: '',
    candidateName: '',
    employeeNo: '',
    company: '',
    position: '',
    grade: '',
    reportTo: '',
    department: '',
    division: '',
    budgetType: 'Replacement',
    employmentAgreement: 'Full-time',
    staffStatus: 'Staff',
    pointOfHire: '',
    hiredType: 'Local Hired',
    requirementsNote: '',
  })
  
  const [file, setFile] = useState<File | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const getAuthHeaders = (): HeadersInit => {
      const token = localStorage.getItem("hr_token");
      return {
        // Jangan set Content-Type, biarkan browser yang mengaturnya untuk FormData
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
    };

    const submitTask = async () => {
      const formDataToSend = new FormData()
      
      // Append semua field text
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value)
      })
      
      // Append file document (Scan ATA)
      if (file) {
        formDataToSend.append('file', file)
      } else {
        throw new Error('Dokumen Scan ATA wajib diunggah!')
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"}/ata`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formDataToSend,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Terjadi kesalahan saat submit ATA Request')
      }

      return data;
    }

    toast.promise(submitTask(), {
      loading: 'Mengirim ATA Request...',
      success: (data) => {
        setTimeout(() => router.push('/ata-requests'), 1500);
        return `ATA Request berhasil disubmit! (ID: ${data.id})`;
      },
      error: (err) => `Gagal: ${err.message}`,
      finally: () => setLoading(false)
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-emerald-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 animate-slide-down">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 shadow-lg mb-4">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">ATA Request Form</h1>
          <p className="text-slate-600">Authorization to Appoint - Pengajuan Posisi</p>
        </div>

        <div className="bg-white shadow-xl rounded-2xl p-8 border border-slate-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Requester & Candidate Info */}
            <div className="bg-teal-50 border-l-4 border-teal-500 p-4 rounded-lg space-y-4">
              <h3 className="font-semibold text-teal-900">📋 Informasi Dasar</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nama Requester *</label>
                  <input type="text" name="requesterName" required className="w-full px-4 py-2 border rounded-xl" value={formData.requesterName} onChange={handleChange} placeholder="Nama Anda" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kandidat / Karyawan yang Diajukan</label>
                  <input type="text" name="candidateName" className="w-full px-4 py-2 border rounded-xl" value={formData.candidateName} onChange={handleChange} placeholder="Kosongkan jika rekrutmen baru" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Employee No (Jika Internal)</label>
                  <input type="text" name="employeeNo" className="w-full px-4 py-2 border rounded-xl" value={formData.employeeNo} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Company *</label>
                  <input type="text" name="company" required className="w-full px-4 py-2 border rounded-xl" value={formData.company} onChange={handleChange} placeholder="Nama Perusahaan" />
                </div>
              </div>
            </div>

            {/* Position Details */}
            <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-lg space-y-4">
              <h3 className="font-semibold text-emerald-900">💼 Detail Posisi</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Jabatan (Position) *</label>
                  <input type="text" name="position" required className="w-full px-4 py-2 border rounded-xl" value={formData.position} onChange={handleChange} placeholder="e.g. Senior Backend" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Department *</label>
                  <input type="text" name="department" required className="w-full px-4 py-2 border rounded-xl" value={formData.department} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Division</label>
                  <input type="text" name="division" className="w-full px-4 py-2 border rounded-xl" value={formData.division} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Report To (Atasan)</label>
                  <input type="text" name="reportTo" className="w-full px-4 py-2 border rounded-xl" value={formData.reportTo} onChange={handleChange} placeholder="Jabatan Atasan" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Grade</label>
                  <input type="text" name="grade" className="w-full px-4 py-2 border rounded-xl" value={formData.grade} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Point of Hire</label>
                  <input type="text" name="pointOfHire" className="w-full px-4 py-2 border rounded-xl" value={formData.pointOfHire} onChange={handleChange} placeholder="Lokasi Penempatan" />
                </div>
              </div>

              <div className="grid md:grid-cols-4 gap-4 pt-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Budget Type</label>
                  <select name="budgetType" className="w-full px-4 py-2 border rounded-xl" value={formData.budgetType} onChange={handleChange}>
                    <option value="Replacement">Replacement</option>
                    <option value="Additional">Additional</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Staff Status</label>
                  <select name="staffStatus" className="w-full px-4 py-2 border rounded-xl" value={formData.staffStatus} onChange={handleChange}>
                    <option value="Staff">Staff</option>
                    <option value="Non Staff">Non Staff</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Hired Type</label>
                  <select name="hiredType" className="w-full px-4 py-2 border rounded-xl" value={formData.hiredType} onChange={handleChange}>
                    <option value="Local Hired">Local Hired</option>
                    <option value="Non Local Hired">Non Local Hired</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Agreement</label>
                  <select name="employmentAgreement" className="w-full px-4 py-2 border rounded-xl" value={formData.employmentAgreement} onChange={handleChange}>
                    <option value="Full-time">Full-time</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Justification & Note */}
            <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-900 mb-2">📝 Requirements / Note / Justification</h3>
              <textarea name="requirementsNote" required rows={4} className="w-full px-4 py-3 border rounded-xl resize-none" value={formData.requirementsNote} onChange={handleChange} placeholder="Alasan kebutuhan posisi, kualifikasi khusus, dll..." />
            </div>

            {/* File Attachment */}
            <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-lg">
              <h3 className="font-semibold text-orange-900 mb-2">📎 Upload Form Scan ATA *</h3>
              <p className="text-sm text-slate-600 mb-3">Wajib mengunggah dokumen ATA yang sudah ditandatangani.</p>
              <input type="file" required accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" onChange={handleFileChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-100 file:text-orange-700 hover:file:bg-orange-200 cursor-pointer" />
            </div>

            <div className="flex gap-3 pt-4">
              <button type="button" onClick={() => router.push('/ata-requests')} className="bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl flex-1 py-3.5 font-bold transition-colors">Batal</button>
              <button type="submit" disabled={loading} className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-xl flex-1 py-3.5 font-bold hover:from-teal-600 transition-all shadow-lg">
                {loading ? 'Memproses...' : '🚀 Submit ATA Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}