'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import Link from 'next/link'
import { 
  Search, ChevronUp, ChevronDown, ChevronsUpDown, 
  ChevronLeft, ChevronRight, Filter, X, Network, 
  MapPin 
} from 'lucide-react'

// Menambahkan optional property untuk mengantisipasi update backend
interface Manpower {
  id: number | string
  position_title: string
  level: string
  grade: string
  department: string
  division?: string
  work_location?: string
  employee_count?: number
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
  
  // State division dan work_location
  const [formData, setFormData] = useState({
    position_title: '',
    level: '',
    grade: '',
    department: '',
    division: '',      
    work_location: ''  
  })

  // State Parameter untuk dikirim ke Server / Frontend Filtering
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
        const depts = Array.from(new Set(allData.map((s: any) => s.department))) as string[];
        const lvls = Array.from(new Set(allData.map((s: any) => s.level))) as string[];
        
        setFilterOptions({ departments: depts, levels: lvls });
      }
    } catch (error) {
      console.error("Gagal mengambil opsi filter", error);
    }
  }

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  // --- SERVER-SIDE FETCHING & SMART FRONTEND PARSING LOGIC ---
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

      // Coba fetch endpoint vacant, jika error 404 (endpoint belum ada), fallback ke endpoint /all
      let response = await fetch(`${baseUrl}/manpower/vacant?${params.toString()}`, { 
        headers: getAuthHeaders() 
      });

      if (response.status === 404) {
         response = await fetch(`${baseUrl}/manpower/all`, { headers: getAuthHeaders() });
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Gagal memuat data');
      }
      
      const data = await response.json();
      
      // 💡 PERBAIKAN: Jika backend mengirimkan ARRAY MURNI (seperti di OrgChart)
      if (Array.isArray(data)) {
        let filteredData = data;

        // Proses search/filter manual jika backend belum support query params
        if (query.search) {
          filteredData = filteredData.filter((item: Manpower) => 
            (item.position_title || '').toLowerCase().includes(query.search.toLowerCase()) ||
            (item.department || '').toLowerCase().includes(query.search.toLowerCase())
          );
        }
        if (query.department) {
          filteredData = filteredData.filter((item: Manpower) => item.department === query.department);
        }
        if (query.level) {
          filteredData = filteredData.filter((item: Manpower) => item.level === query.level);
        }

        // Sorting manual
        filteredData.sort((a: any, b: any) => {
          let valA = a[query.sortBy] || '';
          let valB = b[query.sortBy] || '';
          if (valA < valB) return query.sortDir === 'asc' ? -1 : 1;
          if (valA > valB) return query.sortDir === 'asc' ? 1 : -1;
          return 0;
        });

        // Pagination manual
        const startIndex = (query.page - 1) * query.pageSize;
        const paginatedItems = filteredData.slice(startIndex, startIndex + query.pageSize);

        setVacantSlots(paginatedItems);
        setTotalItems(filteredData.length);
        setTotalPages(Math.ceil(filteredData.length / query.pageSize) || 1);

      } else {
        // 💡 NORMAL: Jika backend sudah mengirim format objek pagination { items: [...], total: X }
        setVacantSlots(data.items || []);
        setTotalItems(data.total || 0);
        setTotalPages(data.total_pages || 1);
      }
      
    } catch (error: any) {
      console.error('Error fetching manpower:', error);
      toast.error('Gagal memuat formasi', { description: error.message });
      setVacantSlots([]);
    } finally {
      setTableLoading(false);
    }
  }

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchVacantManpower();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

      setFormData({ position_title: '', level: '', grade: '', department: '', division: '', work_location: '' })
      
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
      <div className="lg:ml-64 min-h-screen flex flex-col bg-slate-50/50">
        <Header title="Manpower Planning" subtitle="Kelola ketersediaan formasi dan slot posisi" />
        
        <main className="flex-1 p-4 md:p-6 lg:p-8 w-full">
          <div className="max-w-[1600px] mx-auto grid grid-cols-1 xl:grid-cols-12 gap-6 xl:gap-8 items-start">
            
            {/* KOLOM KIRI: Form Input */}
            <div className="xl:col-span-4 w-full flex flex-col gap-6 xl:sticky xl:top-24 z-10">
              <div className="bg-white shadow-lg shadow-slate-200/50 rounded-2xl p-6 border border-slate-200/60">
                <h2 className="text-lg md:text-xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4 flex items-center gap-2.5">
                  <div className="p-2 bg-teal-50 rounded-lg text-teal-600">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  Tambah Formasi
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* BLOK 1 - STRUKTUR ORGANISASI */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                      Organisasi & Jabatan
                    </h3>
                    
                    <div className="space-y-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Nama Posisi *</label>
                        <input type="text" name="position_title" required value={formData.position_title} onChange={handleChange} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-sm transition-all shadow-sm placeholder-slate-400" placeholder="e.g. Fullstack Developer" />
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Divisi</label>
                          <input type="text" name="division" value={formData.division} onChange={handleChange} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-sm transition-all shadow-sm placeholder-slate-400" placeholder="e.g. Technology" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Department *</label>
                          <input type="text" name="department" required value={formData.department} onChange={handleChange} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-sm transition-all shadow-sm placeholder-slate-400" placeholder="e.g. IT" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* BLOK 2 - KARIR & LOKASI */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Karir & Lokasi
                    </h3>
                    
                    <div className="space-y-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Level *</label>
                          <input type="text" name="level" required value={formData.level} onChange={handleChange} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm transition-all shadow-sm placeholder-slate-400" placeholder="e.g. Staff" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Grade *</label>
                          <input type="text" name="grade" required value={formData.grade} onChange={handleChange} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm transition-all shadow-sm placeholder-slate-400" placeholder="e.g. 2A" />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Lokasi Kerja</label>
                        <input type="text" name="work_location" value={formData.work_location} onChange={handleChange} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm transition-all shadow-sm placeholder-slate-400" placeholder="Otomatis Makassar jika kosong" />
                      </div>
                    </div>
                  </div>

                  <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white rounded-xl py-3 font-semibold hover:bg-slate-800 transition-all shadow-md hover:shadow-lg disabled:opacity-70 flex items-center justify-center gap-2 mt-2">
                    {loading ? <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></div> : 'Simpan Formasi'}
                  </button>
                </form>
              </div>
            </div>

            {/* KOLOM KANAN: Tabel Data */}
            <div className="xl:col-span-8 w-full min-w-0 flex flex-col gap-6">
              <div className="bg-white shadow-lg shadow-slate-200/50 rounded-2xl border border-slate-200/60 flex flex-col relative overflow-hidden">
                
                {tableLoading && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-20 flex items-center justify-center rounded-2xl">
                    <div className="flex flex-col items-center gap-3 bg-white p-4 rounded-2xl shadow-xl border border-slate-100">
                      <div className="animate-spin w-8 h-8 border-4 border-teal-100 border-t-teal-600 rounded-full"></div>
                      <span className="text-sm font-semibold text-slate-600">Memuat data...</span>
                    </div>
                  </div>
                )}

                {/* ── Controls & Filters Header ── */}
                <div className="p-5 md:p-6 border-b border-slate-100 bg-white space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg md:text-xl font-bold text-slate-900 flex items-center gap-2">
                        Daftar Formasi
                      </h2>
                      <p className="text-sm text-slate-500 mt-1">Kelola dan pantau seluruh slot posisi yang tersedia.</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Link 
                        href="/manpower/org-chart" 
                        className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm"
                      >
                        <Network size={16} className="text-indigo-500" />
                        <span className="hidden sm:inline">Org Chart</span>
                      </Link>

                      <div className="bg-slate-900 text-white text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-2 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        {totalItems} Formasi
                      </div>
                    </div>
                  </div>

                  {/* Search Bar & Toggles */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <div className="relative flex-1 group">
                      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                      <input 
                        type="text" placeholder="Cari posisi atau departemen..." 
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                        value={query.search} onChange={e => updateQuery({ search: e.target.value, page: 1 })}
                      />
                      {query.search && (
                        <button onClick={() => updateQuery({ search: '', page: 1 })} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 bg-slate-200 rounded-full p-1 transition-colors">
                          <X size={12} />
                        </button>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setShowFilters(!showFilters)}
                        className={`px-4 py-2.5 border rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${showFilters || query.department || query.level ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'}`}
                      >
                        <Filter size={16} /> <span className="hidden sm:inline">Filter</span>
                        {(query.department || query.level) && <span className="w-4 h-4 rounded-full bg-teal-500 text-white text-[10px] flex items-center justify-center font-bold">!</span>}
                      </button>

                      <select 
                        className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all shadow-sm font-semibold text-slate-700 cursor-pointer"
                        value={query.pageSize} onChange={e => updateQuery({ pageSize: Number(e.target.value), page: 1 })}
                      >
                        <option value={5}>5 Baris</option>
                        <option value={10}>10 Baris</option>
                        <option value={25}>25 Baris</option>
                      </select>
                    </div>
                  </div>

                  {/* Filter Dropdowns */}
                  {showFilters && (
                    <div className="pt-4 pb-1 border-t border-slate-100 flex flex-col sm:flex-row flex-wrap gap-4 animate-in fade-in slide-in-from-top-2">
                      <div className="flex-1 min-w-[200px]">
                        <label className="text-xs font-semibold text-slate-500 mb-1.5 block uppercase tracking-wider">Department</label>
                        <select className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all shadow-sm" value={query.department} onChange={e => updateQuery({ department: e.target.value, page: 1 })}>
                          <option value="">Semua Department</option>
                          {filterOptions.departments.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div className="flex-1 min-w-[200px]">
                        <label className="text-xs font-semibold text-slate-500 mb-1.5 block uppercase tracking-wider">Level</label>
                        <select className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all shadow-sm" value={query.level} onChange={e => updateQuery({ level: e.target.value, page: 1 })}>
                          <option value="">Semua Level</option>
                          {filterOptions.levels.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                      </div>
                      {(query.department || query.level) && (
                        <div className="flex items-end pb-1.5 w-full sm:w-auto mt-2 sm:mt-0">
                          <button onClick={() => updateQuery({ department: '', level: '', page: 1 })} className="text-xs text-red-600 font-semibold hover:text-red-700 hover:bg-red-50 px-4 py-2.5 rounded-xl border border-red-100 transition-colors flex items-center justify-center gap-1.5 w-full sm:w-auto">
                            <X size={14} /> Reset Filter
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* ── Area Tabel ── */}
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm shadow-sm border-b border-slate-200">
                      <tr>
                        <th onClick={() => handleSort('position_title')} className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider cursor-pointer hover:bg-slate-100/80 transition-colors select-none w-2/6">
                          <div className="flex items-center gap-2">
                            Posisi
                            {query.sortBy === 'position_title' ? (
                              query.sortDir === 'asc' ? <ChevronUp size={14} className="text-slate-800"/> : <ChevronDown size={14} className="text-slate-800"/>
                            ) : <ChevronsUpDown size={14} className="text-slate-300"/>}
                          </div>
                        </th>
                        <th onClick={() => handleSort('level')} className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider cursor-pointer hover:bg-slate-100/80 transition-colors select-none w-1/6">
                          <div className="flex items-center gap-2">
                            Level & Grade
                            {query.sortBy === 'level' ? (
                              query.sortDir === 'asc' ? <ChevronUp size={14} className="text-slate-800"/> : <ChevronDown size={14} className="text-slate-800"/>
                            ) : <ChevronsUpDown size={14} className="text-slate-300"/>}
                          </div>
                        </th>
                        <th onClick={() => handleSort('department')} className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider cursor-pointer hover:bg-slate-100/80 transition-colors select-none w-1/6">
                          <div className="flex items-center gap-2">
                            Departemen
                            {query.sortBy === 'department' ? (
                              query.sortDir === 'asc' ? <ChevronUp size={14} className="text-slate-800"/> : <ChevronDown size={14} className="text-slate-800"/>
                            ) : <ChevronsUpDown size={14} className="text-slate-300"/>}
                          </div>
                        </th>
                        <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider select-none w-1/6">
                          Lokasi
                        </th>
                        <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider select-none text-center w-[10%]">
                          Kebutuhan
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {vacantSlots.length > 0 ? (
                        vacantSlots.map((slot) => (
                          <tr key={slot.id} className="hover:bg-slate-50/80 transition-colors group">
                            <td className="px-6 py-4 align-top">
                              <p className="font-bold text-slate-900 group-hover:text-teal-600 transition-colors cursor-pointer line-clamp-2">
                                {slot.position_title}
                              </p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                  ID: {slot.id}
                                </span>
                                {slot.division && (
                                  <span className="text-[11px] text-slate-500 font-medium line-clamp-1">
                                    • {slot.division}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 align-top">
                              <div className="flex flex-col gap-1.5 items-start">
                                <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-md tracking-wide whitespace-nowrap">
                                  {slot.level}
                                </span>
                                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-mono whitespace-nowrap">
                                  Grade: {slot.grade}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 align-top">
                              <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-teal-400 transition-colors flex-shrink-0"></span>
                                <span className="line-clamp-2">{slot.department}</span>
                              </span>
                            </td>
                            <td className="px-6 py-4 align-top">
                              <div className="flex items-center gap-1.5 text-slate-500 text-sm">
                                <MapPin size={14} className="text-slate-400 flex-shrink-0" /> 
                                <span className="line-clamp-2">{slot.work_location || 'Kantor Pusat - Makassar'}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 align-top text-center">
                              <div className="inline-flex items-center justify-center min-w-[2rem] h-8 px-2 rounded-lg text-xs font-bold bg-slate-50 text-slate-600 border border-slate-200 group-hover:bg-teal-50 group-hover:text-teal-700 group-hover:border-teal-200 transition-colors shadow-sm cursor-help" title="Kebutuhan SDM">
                                {slot.employee_count || 0}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : !tableLoading && (
                        <tr>
                          <td colSpan={5} className="py-20 text-center">
                            <div className="flex flex-col items-center justify-center text-slate-400 space-y-4">
                              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                                <Search size={28} className="text-slate-300" />
                              </div>
                              <div>
                                <h3 className="text-lg font-bold text-slate-700">Tidak ada formasi ditemukan</h3>
                                <p className="text-slate-500 mt-1 text-sm max-w-sm mx-auto">Coba sesuaikan kata kunci pencarian, atau reset filter yang sedang aktif.</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* ── Pagination Footer ── */}
                {totalItems > 0 && (
                  <div className="p-4 md:p-5 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4 mt-auto">
                    <p className="text-sm text-slate-500 text-center sm:text-left">
                      Menampilkan <span className="font-bold text-slate-900">{Math.min((query.page - 1) * query.pageSize + 1, totalItems)}</span> - <span className="font-bold text-slate-900">{Math.min(query.page * query.pageSize, totalItems)}</span> dari <span className="font-bold text-slate-900">{totalItems}</span> data
                    </p>
                    
                    <div className="flex items-center gap-1">
                      <button 
                        disabled={query.page === 1} 
                        onClick={() => updateQuery({ page: query.page - 1 })} 
                        className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm mr-1"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      
                      <div className="flex items-center overflow-x-auto max-w-[200px] sm:max-w-none scrollbar-hide">
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                          let pageNum = query.page;
                          if (totalPages <= 5) pageNum = i + 1;
                          else if (query.page <= 3) pageNum = i + 1;
                          else if (query.page >= totalPages - 2) pageNum = totalPages - 4 + i;
                          else pageNum = query.page - 2 + i;

                          return (
                            <button 
                              key={pageNum} onClick={() => updateQuery({ page: pageNum })} 
                              className={`min-w-[36px] h-9 mx-0.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center ${pageNum === query.page ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-200/50 bg-transparent'}`}
                            >
                              {pageNum}
                            </button>
                          )
                        })}
                      </div>

                      <button 
                        disabled={query.page === totalPages} 
                        onClick={() => updateQuery({ page: query.page + 1 })} 
                        className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm ml-1"
                      >
                        <ChevronRight size={16} />
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