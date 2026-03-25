'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { Search, ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, Filter, X } from 'lucide-react'

interface Manpower {
  id: number | string
  position_title: string
  level: string
  grade: string
  department: string
}

export default function ManpowerPage() {
  const [loading, setLoading] = useState(false)
  const [tableLoading, setTableLoading] = useState(false)
  
  // State Data dari Backend Baru
  const [vacantSlots, setVacantSlots] = useState<Manpower[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  
  // State untuk Opsi Dropdown Filter yang lengkap
  const [filterOptions, setFilterOptions] = useState<{ departments: string[], levels: string[] }>({ 
    departments: [], 
    levels: [] 
  });
  
  const [formData, setFormData] = useState({
    position_title: '',
    level: '',
    grade: '',
    department: '',
  })

  // State Parameter untuk dikirim ke Server
  const [query, setQuery] = useState({
    search: '',
    department: '',
    level: '',
    sortBy: 'id',
    sortDir: 'desc',
    page: 1,
    pageSize: 10
  })
  
  const [showFilters, setShowFilters] = useState(false)

  const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem("hr_token");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  // --- MENGAMBIL OPSI FILTER MASTER DARI BACKEND ---
  const fetchFilterOptions = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
      const response = await fetch(`${baseUrl}/manpower/all`, { headers: getAuthHeaders() });
      if (response.ok) {
        const allData = await response.json();
        // Ekstrak departemen dan level yang unik dari seluruh data
        const depts = Array.from(new Set(allData.map((s: any) => s.department))) as string[];
        const lvls = Array.from(new Set(allData.map((s: any) => s.level))) as string[];
        
        setFilterOptions({ departments: depts, levels: lvls });
      }
    } catch (error) {
      console.error("Gagal mengambil opsi filter", error);
    }
  }

  // Panggil sekali saat halaman dimuat
  useEffect(() => {
    fetchFilterOptions();
  }, []);

  // --- SERVER-SIDE FETCHING LOGIC TABEL ---
  const fetchVacantManpower = async () => {
    setTableLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
      
      const params = new URLSearchParams({
        page: query.page.toString(),
        page_size: query.pageSize.toString(),
        search: query.search,
        department: query.department,
        level: query.level,
        sort_by: query.sortBy,
        sort_dir: query.sortDir
      });

      const response = await fetch(`${baseUrl}/manpower/vacant?${params.toString()}`, { 
        headers: getAuthHeaders() 
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Gagal memuat data');
      }
      
      const data = await response.json();
      
      setVacantSlots(data.items || []);
      setTotalItems(data.total || 0);
      setTotalPages(data.total_pages || 1);
      
    } catch (error: any) {
      console.error('Error fetching manpower:', error);
      toast.error('Gagal memuat formasi', { description: error.message });
      setVacantSlots([]);
    } finally {
      setTableLoading(false);
    }
  }

  // Otomatis panggil API jika parameter query berubah (Search, Paginasi, Sort)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchVacantManpower();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]); 

  // --- FORM LOGIC ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const submitTask = async () => {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
      const response = await fetch(`${baseUrl}/manpower/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Terjadi kesalahan')

      setFormData({ position_title: '', level: '', grade: '', department: '' })
      
      // Update filter options jika ada departemen/level baru yang ditambahkan
      await fetchFilterOptions();

      if (query.page !== 1) {
        updateQuery({ page: 1 });
      } else {
        await fetchVacantManpower();
      }
      return data;
    }

    toast.promise(submitTask(), {
      loading: 'Menyimpan formasi baru...',
      success: 'Formasi berhasil ditambahkan!',
      error: (err) => `Gagal: ${err.message}`,
      finally: () => setLoading(false)
    })
  }

  const updateQuery = (patch: Partial<typeof query>) => {
    setQuery(prev => ({ ...prev, ...patch, page: patch.page !== undefined ? patch.page : 1 }))
  }

  const handleSort = (key: string) => {
    if (query.sortBy === key) {
      updateQuery({ sortDir: query.sortDir === 'asc' ? 'desc' : 'asc' })
    } else {
      updateQuery({ sortBy: key, sortDir: 'asc' })
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar />
      <div className="lg:ml-64 min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-teal-50 to-emerald-50">
        <Header title="Manpower Planning" subtitle="Kelola ketersediaan formasi dan slot posisi" />
        
        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* KOLOM KIRI: Form Input */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="bg-white shadow-xl rounded-2xl p-6 border border-slate-100">
                <h2 className="text-xl font-bold text-slate-900 mb-6 border-b pb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Tambah Formasi
                </h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="bg-teal-50 border-l-4 border-teal-500 p-4 rounded-lg space-y-4">
                    <h3 className="font-semibold text-teal-900 text-sm flex items-center gap-2">💼 Jabatan</h3>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Position Title *</label>
                      <input type="text" name="position_title" required value={formData.position_title} onChange={handleChange} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-sm" placeholder="e.g. Fullstack Developer" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Department *</label>
                      <input type="text" name="department" required value={formData.department} onChange={handleChange} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-sm" placeholder="e.g. IT" />
                    </div>
                  </div>

                  <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-lg space-y-4">
                    <h3 className="font-semibold text-emerald-900 text-sm flex items-center gap-2">📊 Karir</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Level *</label>
                        <input type="text" name="level" required value={formData.level} onChange={handleChange} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm" placeholder="e.g. Staff" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Grade *</label>
                        <input type="text" name="grade" required value={formData.grade} onChange={handleChange} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm" placeholder="e.g. 2A" />
                      </div>
                    </div>
                  </div>

                  <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-xl py-3.5 font-bold hover:from-teal-600 transition-all shadow-lg disabled:opacity-70 flex items-center justify-center gap-2">
                    {loading ? <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div> : 'Simpan Formasi'}
                  </button>
                </form>
              </div>
            </div>

            {/* KOLOM KANAN: Tabel Canggih */}
            <div className="lg:col-span-8">
              <div className="bg-white shadow-xl rounded-2xl border border-slate-100 flex flex-col h-full overflow-hidden relative">
                
                {tableLoading && (
                  <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                    <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full"></div>
                  </div>
                )}

                <div className="p-5 border-b border-slate-100 bg-slate-50/50 space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      Daftar Slot Kosong
                    </h2>
                    <span className="bg-teal-100 text-teal-800 text-xs font-bold px-3 py-1.5 rounded-full border border-teal-200 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                      {totalItems} Total
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" placeholder="Cari posisi atau departemen..." 
                        className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                        value={query.search} onChange={e => updateQuery({ search: e.target.value })}
                      />
                      {query.search && (
                        <button onClick={() => updateQuery({ search: '' })} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    
                    <button 
                      onClick={() => setShowFilters(!showFilters)}
                      className={`px-4 py-2 border rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${showFilters || query.department || query.level ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                      <Filter size={16} /> Filter
                      {(query.department || query.level) && <span className="w-4 h-4 rounded-full bg-teal-500 text-white text-[10px] flex items-center justify-center">!</span>}
                    </button>

                    <select 
                      className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                      value={query.pageSize} onChange={e => updateQuery({ pageSize: Number(e.target.value) })}
                    >
                      <option value={5}>5 / baris</option>
                      <option value={10}>10 / baris</option>
                      <option value={25}>25 / baris</option>
                    </select>
                  </div>

                  {showFilters && (
                    <div className="pt-3 border-t border-slate-200 flex flex-wrap gap-4 animate-in fade-in slide-in-from-top-2">
                      <div className="flex-1 min-w-[150px]">
                        <label className="text-xs font-semibold text-slate-500 mb-1 block">Department</label>
                        <select className="w-full p-2 border border-slate-200 rounded-lg text-sm" value={query.department} onChange={e => updateQuery({ department: e.target.value })}>
                          <option value="">Semua Department</option>
                          {filterOptions.departments.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div className="flex-1 min-w-[150px]">
                        <label className="text-xs font-semibold text-slate-500 mb-1 block">Level</label>
                        <select className="w-full p-2 border border-slate-200 rounded-lg text-sm" value={query.level} onChange={e => updateQuery({ level: e.target.value })}>
                          <option value="">Semua Level</option>
                          {filterOptions.levels.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                      </div>
                      {(query.department || query.level) && (
                        <div className="flex items-end pb-1">
                          <button onClick={() => updateQuery({ department: '', level: '' })} className="text-xs text-red-500 font-medium hover:underline flex items-center gap-1">
                            <X size={12} /> Reset
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex-1 overflow-x-auto min-h-[300px]">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="bg-white border-b border-slate-200">
                        {['position_title', 'level', 'department'].map((key) => (
                          <th key={key} onClick={() => handleSort(key)} className="p-4 font-bold text-slate-600 text-sm uppercase tracking-wider cursor-pointer hover:bg-slate-50 transition-colors select-none">
                            <div className="flex items-center gap-2">
                              {key === 'position_title' ? 'Posisi' : key}
                              {query.sortBy === key ? (
                                query.sortDir === 'asc' ? <ChevronUp size={14} className="text-teal-600"/> : <ChevronDown size={14} className="text-teal-600"/>
                              ) : <ChevronsUpDown size={14} className="text-slate-300"/>}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {vacantSlots.length > 0 ? (
                        vacantSlots.map((slot) => (
                          <tr key={slot.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="p-4">
                              <p className="font-bold text-slate-800 group-hover:text-teal-700 transition-colors">{slot.position_title}</p>
                              <p className="text-xs text-slate-400 mt-0.5 font-mono">ID: {slot.id}</p>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-col gap-1 items-start">
                                <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded-md">{slot.level}</span>
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                                  Grade: {slot.grade}
                                </span>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="text-sm font-medium text-slate-600 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                {slot.department}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : !tableLoading && (
                        <tr>
                          <td colSpan={3} className="p-12 text-center">
                            <h3 className="text-lg font-bold text-slate-700">Data tidak ditemukan</h3>
                            <p className="text-slate-500 mt-1 text-sm">Coba sesuaikan kata kunci pencarian atau filter Anda.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {totalItems > 0 && (
                  <div className="p-4 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-slate-500">
                      Menampilkan <span className="font-bold text-slate-800">{Math.min((query.page - 1) * query.pageSize + 1, totalItems)}</span> - <span className="font-bold text-slate-800">{Math.min(query.page * query.pageSize, totalItems)}</span> dari <span className="font-bold text-slate-800">{totalItems}</span> formasi
                    </p>
                    <div className="flex items-center gap-1">
                      <button disabled={query.page === 1} onClick={() => updateQuery({ page: query.page - 1 })} className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">
                        <ChevronLeft size={18} />
                      </button>
                      
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        let pageNum = query.page;
                        if (totalPages <= 5) pageNum = i + 1;
                        else if (query.page <= 3) pageNum = i + 1;
                        else if (query.page >= totalPages - 2) pageNum = totalPages - 4 + i;
                        else pageNum = query.page - 2 + i;

                        return (
                          <button 
                            key={pageNum} onClick={() => updateQuery({ page: pageNum })} 
                            className={`w-8 h-8 rounded-lg text-sm font-semibold transition-colors ${pageNum === query.page ? 'bg-teal-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
                          >
                            {pageNum}
                          </button>
                        )
                      })}

                      <button disabled={query.page === totalPages} onClick={() => updateQuery({ page: query.page + 1 })} className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}