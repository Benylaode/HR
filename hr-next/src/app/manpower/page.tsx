'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'

interface Manpower {
  id: number | string
  position_title: string
  level: string
  grade: string
  department: string
}

export default function ManpowerPage() {
  const [loading, setLoading] = useState(false)
  const [vacantSlots, setVacantSlots] = useState<Manpower[]>([])
  
  const [formData, setFormData] = useState({
    position_title: '',
    level: '',
    grade: '',
    department: '',
  })

  useEffect(() => {
    fetchVacantManpower()
  }, [])

  const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem("hr_token");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const fetchVacantManpower = async () => {
    try {
      // Sesuaikan endpoint backend Anda (jika tidak pakai /api, hapus bagian /api)
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
      const response = await fetch(`${baseUrl}/api/manpower/vacant`, { 
        headers: getAuthHeaders() 
      });
      
      if (!response.ok) throw new Error('Gagal mengambil data dari server');
      
      const data = await response.json();
      setVacantSlots(data);
    } catch (error) {
      console.error('Error fetching manpower:', error);
      toast.error('Gagal memuat formasi kosong', { description: 'Periksa koneksi server Anda.' });
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const submitTask = async () => {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
      const response = await fetch(`${baseUrl}/api/manpower`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Terjadi kesalahan saat menyimpan Manpower')
      }

      // Reset Form & Refresh Tabel
      setFormData({ position_title: '', level: '', grade: '', department: '' })
      await fetchVacantManpower()

      return data;
    }

    toast.promise(submitTask(), {
      loading: 'Menyimpan slot formasi baru...',
      success: () => 'Formasi Manpower berhasil ditambahkan!',
      error: (err) => `Gagal: ${err.message}`,
      finally: () => setLoading(false)
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-emerald-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center mb-10 animate-slide-down">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 shadow-lg mb-4">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Manpower Planning</h1>
          <p className="text-slate-600">Kelola ketersediaan formasi dan slot posisi di perusahaan</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Kolom Kiri: Form Input Manpower Baru */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow-xl rounded-2xl p-6 border border-slate-100 h-full">
              <h2 className="text-xl font-bold text-slate-900 mb-6 border-b pb-3">Tambah Formasi</h2>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* Posisi & Departemen */}
                <div className="bg-teal-50 border-l-4 border-teal-500 p-4 rounded-lg space-y-4">
                  <h3 className="font-semibold text-teal-900 text-sm">💼 Informasi Jabatan</h3>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Position Title *</label>
                    <input 
                      type="text" name="position_title" required 
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all" 
                      value={formData.position_title} onChange={handleChange} 
                      placeholder="e.g. Fullstack Developer" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Department *</label>
                    <input 
                      type="text" name="department" required 
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all" 
                      value={formData.department} onChange={handleChange} 
                      placeholder="e.g. Information Technology" 
                    />
                  </div>
                </div>

                {/* Level & Grade */}
                <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-lg space-y-4">
                  <h3 className="font-semibold text-emerald-900 text-sm">📊 Jenjang Karir</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Level *</label>
                      <input 
                        type="text" name="level" required 
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all" 
                        value={formData.level} onChange={handleChange} 
                        placeholder="e.g. Staff" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Grade *</label>
                      <input 
                        type="text" name="grade" required 
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all" 
                        value={formData.grade} onChange={handleChange} 
                        placeholder="e.g. 2A" 
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-xl py-3.5 font-bold hover:from-teal-600 transition-all shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                        Memproses...
                      </>
                    ) : (
                      '➕ Simpan Formasi'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Kolom Kanan: Tabel Slot Kosong */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow-xl rounded-2xl border border-slate-100 overflow-hidden flex flex-col h-full">
              
              <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Daftar Slot Kosong (Vacant)</h2>
                  <p className="text-sm text-slate-500 mt-1">Slot formasi yang belum diisi oleh kandidat/karyawan</p>
                </div>
                <span className="bg-teal-100 text-teal-800 text-xs font-bold px-3 py-1.5 rounded-full border border-teal-200 shadow-sm">
                  {vacantSlots.length} Tersedia
                </span>
              </div>
              
              <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="p-4 font-bold text-slate-600 text-sm uppercase tracking-wider">Posisi</th>
                      <th className="p-4 font-bold text-slate-600 text-sm uppercase tracking-wider">Level / Grade</th>
                      <th className="p-4 font-bold text-slate-600 text-sm uppercase tracking-wider">Department</th>
                      <th className="p-4 font-bold text-slate-600 text-sm uppercase tracking-wider text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {vacantSlots.length > 0 ? (
                      vacantSlots.map((slot) => (
                        <tr key={slot.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="p-4">
                            <p className="font-bold text-slate-800">{slot.position_title}</p>
                            <p className="text-xs text-slate-400 mt-0.5 font-mono">ID: {slot.id}</p>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col gap-1">
                              <span className="text-sm font-medium text-slate-700">{slot.level}</span>
                              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md w-max border border-slate-200">
                                Grade: {slot.grade}
                              </span>
                            </div>
                          </td>
                          <td className="p-4 text-slate-600 text-sm font-medium">
                            {slot.department}
                          </td>
                          <td className="p-4 text-center">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              Tersedia
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-12 text-center">
                          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-bold text-slate-700">Tidak ada slot kosong</h3>
                          <p className="text-slate-500 mt-1 max-w-sm mx-auto">
                            Saat ini belum ada formasi manpower yang tersedia. Silakan tambahkan formasi baru melalui form di samping.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          </div>
          
        </div>
      </div>
    </div>
  )
}