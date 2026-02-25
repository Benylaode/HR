'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner' // <-- 1. IMPORT SONNER DI SINI

export default function ATARequestPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    requester_name: '',
    title: '',
    department: '',
    level: '',
    location: '',
    employment_type: 'Full-time',
    salary_min: '',
    salary_max: '',
    justification: '',
  })
  const [file, setFile] = useState<File | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const getAuthHeaders = (): HeadersInit => {
      const token = localStorage.getItem("hr_token");
      return {
        // PERHATIKAN: "Content-Type" dihapus di sini karena kita mengirim FormData (file). 
        // Browser akan otomatis menambahkan Content-Type multipart/form-data beserta boundary-nya.
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
    };

    // 2. PERUBAHAN DI SINI: Menggunakan fungsi terpisah untuk dimasukkan ke toast.promise
    const submitTask = async () => {
      const formDataToSend = new FormData()
      
      // Append all form fields
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value)
      })
      
      // Append file if exists
      if (file) {
        formDataToSend.append('file', file)
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

      return data; // Mengembalikan data untuk dipakai di pesan sukses
    }

    // 3. Menjalankan animasi loading, sukses, dan error otomatis
    toast.promise(submitTask(), {
      loading: 'Mengirim ATA Request...',
      success: (data) => {
        // Redirect setelah 1 detik agar user sempat melihat pesan sukses
        setTimeout(() => router.push('/ata-requests'), 1000);
        return `ATA Request berhasil disubmit! (ID: ${data.id})`;
      },
      error: (err) => `Gagal: ${err.message}`,
      finally: () => setLoading(false) // Matikan loading state tombol
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-emerald-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-slide-down">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 shadow-lg mb-4">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">ATA Request Form</h1>
          <p className="text-slate-600">Additional Task Assignment - Request Posisi Baru</p>
        </div>

        {/* Form Card */}
        <div className="card-static bg-white shadow-xl rounded-2xl p-8 animate-fade-in border border-slate-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Justification */}
            <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-900 mb-2">📝 Justifikasi</h3>
              <p className="text-sm text-slate-600 mb-3">Jelaskan mengapa posisi ini diperlukan</p>
              <textarea
                required
                rows={5}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 text-sm resize-none"
                value={formData.justification}
                onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
                placeholder="Alasan kenapa posisi ini dibutuhkan, dampak jika tidak ada, dan manfaat yang diharapkan..."
              />
            </div>

            {/* Requester Info */}
            <div className="bg-teal-50 border-l-4 border-teal-500 p-4 rounded-lg">
              <h3 className="font-semibold text-teal-900 mb-2">📋 Informasi Requester</h3>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nama Requester *</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400 text-sm"
                  value={formData.requester_name}
                  onChange={(e) => setFormData({ ...formData, requester_name: e.target.value })}
                  placeholder="Nama Anda"
                />
              </div>
            </div>

            {/* Position Details */}
            <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-lg">
              <h3 className="font-semibold text-emerald-900 mb-4">💼 Detail Posisi yang Dibutuhkan</h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Job Title *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 text-sm"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Senior Software Engineer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Department *</label>
                  <select
                    required
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 text-sm"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  >
                    <option value="">Pilih Department</option>
                    <option value="IT">IT</option>
                    <option value="HR">HR</option>
                    <option value="Finance">Finance</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Sales">Sales</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Level *</label>
                  <select
                    required
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 text-sm"
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  >
                    <option value="">Pilih Level</option>
                    <option value="Junior">Junior</option>
                    <option value="Senior">Senior</option>
                    <option value="Lead">Lead</option>
                    <option value="Manager">Manager</option>
                    <option value="Director">Director</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Location *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 text-sm"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Jakarta, Bandung, Surabaya, dll"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Employment Type *</label>
                  <select
                    required
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 text-sm"
                    value={formData.employment_type}
                    onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })}
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Salary Range */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-4">💰 Salary Range (Optional)</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Minimum Salary (Rp)</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-sm"
                    value={formData.salary_min}
                    onChange={(e) => setFormData({ ...formData, salary_min: e.target.value })}
                    placeholder="5000000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Maximum Salary (Rp)</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-sm"
                    value={formData.salary_max}
                    onChange={(e) => setFormData({ ...formData, salary_max: e.target.value })}
                    placeholder="10000000"
                  />
                </div>
              </div>
            </div>

            {/* File Attachment */}
            <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-lg">
              <h3 className="font-semibold text-orange-900 mb-2">📎 Attachment (Optional)</h3>
              <p className="text-sm text-slate-600 mb-3">Upload dokumen pendukung (PDF, DOC, DOCX, atau gambar)</p>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-100 file:text-orange-700 hover:file:bg-orange-200 transition-all cursor-pointer"
              />
              {file && (
                <p className="mt-2 text-sm text-green-600 font-medium">✓ {file.name} ({(file.size / 1024).toFixed(2)} KB)</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => router.push('/ata-requests')}
                className="bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl flex-1 py-3.5 font-bold transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-xl flex-1 py-3.5 font-bold hover:from-teal-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-200"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Memproses...
                  </span>
                ) : (
                  '🚀 Submit ATA Request'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-white shadow-md border border-teal-100 rounded-xl p-5 animate-fade-in">
          <div className="flex gap-4 items-start">
            <div className="bg-teal-100 p-2 rounded-lg text-teal-600 text-xl">ℹ️</div>
            <div className="text-sm text-slate-600 leading-relaxed">
              <strong className="text-slate-900 block mb-1">Proses Approval:</strong>
              1. HR Approval → 2. KTT Approval (48h) → 3. HO Jakarta Approval (72h)<br />
              Setelah semua pihak memberikan <em>approval</em>, sistem akan secara otomatis membuat <strong>Job Position</strong> yang baru.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}