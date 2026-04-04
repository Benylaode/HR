'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import Link from 'next/link'
import { 
  Search, ChevronUp, ChevronDown, ChevronsUpDown, 
  ChevronLeft, ChevronRight, Filter, X, Network, 
  MapPin, User 
} from 'lucide-react'

interface Manpower {
  id: number | string
  position_title: string
  level: string
  tingkat: number
  grade: string
  department: string
  division?: string
  work_location?: string
  employee_count?: number
}

export default function ManpowerPage() {
  const [loading, setLoading] = useState(false)
  const [tableLoading, setTableLoading] = useState(false)
  
  // State Data
  const [vacantSlots, setVacantSlots] = useState<Manpower[]>([])
  const [allPositions, setAllPositions] = useState<Manpower[]>([]) // Untuk Dropdown Atasan
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  
  const [filterOptions, setFilterOptions] = useState<{ departments: string[], levels: string[] }>({ departments: [], levels: [] });
  
  // State Form Tambah Formasi (DENGAN KOLOM BARU)
  const [formData, setFormData] = useState({
    position_title: '', level: '', tingkat: '', grade: '', department: '', 
    division: '', work_location: '', reports_to_id: '', 
    tingkat_managerial: '', tingkat_divisi: '', pointer_divisi: ''
  })

  const [query, setQuery] = useState({
    search: '', department: '', level: '', sortBy: 'id', sortDir: 'desc', page: 1, pageSize: 10
  })
  
  const [showFilters, setShowFilters] = useState(false)

  // Modal Assign Karyawan/Kandidat
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [assignLoading, setAssignLoading] = useState(false)
  const [selectedManpowerId, setSelectedManpowerId] = useState<string | number | null>(null)
  const [selectedManpowerTitle, setSelectedManpowerTitle] = useState('')
  const [availablePersons, setAvailablePersons] = useState<{
    employees: {id: string, name: string, type: string}[],
    candidates: {id: string, name: string, type: string}[]
  }>({ employees: [], candidates: [] })
  const [selectedPerson, setSelectedPerson] = useState('')

  const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem("hr_token");
    return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  };

  const fetchFilterOptions = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
      const response = await fetch(`${baseUrl}/manpower/all`, { headers: getAuthHeaders() });
      if (response.ok) {
        const allData = await response.json();
        setAllPositions(allData); // Simpan semua posisi untuk form dropdown "Reports To"
        setFilterOptions({ 
          departments: Array.from(new Set(allData.map((s: any) => s.department))) as string[], 
          levels: Array.from(new Set(allData.map((s: any) => s.level))) as string[] 
        });
      }
    } catch (error) { console.error("Gagal mengambil opsi", error); }
  }

  useEffect(() => { fetchFilterOptions(); }, []);

  const fetchVacantManpower = async () => {
    setTableLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
      const params = new URLSearchParams({
        page: query.page.toString(), page_size: query.pageSize.toString(),
        search: query.search, department: query.department, level: query.level,
        sort_by: query.sortBy, sort_dir: query.sortDir
      });

      const response = await fetch(`${baseUrl}/manpower/vacant?${params.toString()}`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Gagal memuat data');
      
      const data = await response.json();
      setVacantSlots(data.items || []);
      setTotalItems(data.total || 0);
      setTotalPages(data.total_pages || 1);
    } catch (error: any) {
      toast.error('Gagal memuat formasi', { description: error.message });
      setVacantSlots([]);
    } finally { setTableLoading(false); }
  }

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => { fetchVacantManpower(); }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [query]); 

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const submitTask = async () => {
      const payload = {
        ...formData,
        tingkat: formData.tingkat ? parseInt(formData.tingkat) : 99,
        reports_to_id: formData.reports_to_id ? parseInt(formData.reports_to_id) : null,
        tingkat_managerial: formData.tingkat_managerial ? parseInt(formData.tingkat_managerial) : null,
        tingkat_divisi: formData.tingkat_divisi ? parseInt(formData.tingkat_divisi) : null,
        pointer_divisi: formData.pointer_divisi || null
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
      const response = await fetch(`${baseUrl}/manpower/`, {
        method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(payload),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Terjadi kesalahan')

      setFormData({ position_title: '', level: '', tingkat: '', grade: '', department: '', division: '', work_location: '', reports_to_id: '', tingkat_managerial: '', tingkat_divisi: '', pointer_divisi: '' })
      await fetchFilterOptions();
      query.page !== 1 ? updateQuery({ page: 1 }) : await fetchVacantManpower();
      return data;
    }

    toast.promise(submitTask(), {
      loading: 'Menyimpan formasi baru...', success: 'Formasi ditambahkan!', error: (err) => `Gagal: ${err.message}`, finally: () => setLoading(false)
    })
  }

  const handleOpenAssignModal = async (manpowerId: string | number, title: string) => {
    setSelectedManpowerId(manpowerId); setSelectedManpowerTitle(title); setIsAssignModalOpen(true); setSelectedPerson('');
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"
      const response = await fetch(`${baseUrl}/manpower/available-persons`, { headers: getAuthHeaders() })
      if (response.ok) {
        const data = await response.json()
        setAvailablePersons({ employees: data.employees || [], candidates: data.candidates || [] })
      }
    } catch (error) { toast.error("Gagal mengambil data orang") }
  }

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selectedPerson || !selectedManpowerId) return;
    const [personType, personId] = selectedPerson.split('|')
    setAssignLoading(true)
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"
      const response = await fetch(`${baseUrl}/manpower/${selectedManpowerId}/assign`, {
        method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ type: personType, id: personId })
      })
      if (!response.ok) throw new Error("Gagal memproses data")
      toast.success("Posisi berhasil diisi!"); setIsAssignModalOpen(false); setSelectedPerson(''); fetchVacantManpower();
    } catch (error: any) { toast.error(error.message) } finally { setAssignLoading(false) }
  }

  const updateQuery = (patch: Partial<typeof query>) => setQuery(prev => ({ ...prev, ...patch, page: patch.page !== undefined ? patch.page : 1 }))
  const handleSort = (key: string) => updateQuery(query.sortBy === key ? { sortDir: query.sortDir === 'asc' ? 'desc' : 'asc' } : { sortBy: key, sortDir: 'asc' })

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar />
      <div className="lg:ml-64 min-h-screen flex flex-col bg-slate-50/50">
        <Header title="Manpower Planning" subtitle="Kelola ketersediaan formasi dan slot posisi" />
        
        <main className="flex-1 p-4 md:p-6 lg:p-8 w-full">
          <div className="max-w-[1600px] mx-auto grid grid-cols-1 xl:grid-cols-12 gap-6 xl:gap-8 items-start">
            
            {/* --- FORM KIRI --- */}
            <div className="xl:col-span-4 w-full flex flex-col gap-6 xl:sticky xl:top-24 z-10">
              <div className="bg-white shadow-lg shadow-slate-200/50 rounded-2xl p-6 border border-slate-200/60 max-h-[85vh] overflow-y-auto custom-scrollbar">
                <h2 className="text-lg md:text-xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4 flex items-center gap-2.5 sticky top-0 bg-white z-10">
                  <div className="p-2 bg-teal-50 rounded-lg text-teal-600"><Network size={20} /></div>
                  Tambah Formasi
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* BLOK 1 */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span> Organisasi & Jabatan</h3>
                    <div className="space-y-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">Nama Posisi *</label>
                        <input type="text" name="position_title" required value={formData.position_title} onChange={handleChange} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none text-sm shadow-sm" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">Divisi</label>
                          <input type="text" name="division" value={formData.division} onChange={handleChange} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none text-sm shadow-sm" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">Department *</label>
                          <input type="text" name="department" required value={formData.department} onChange={handleChange} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none text-sm shadow-sm" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* BLOK 2 */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Karir & Tingkat</h3>
                    <div className="space-y-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">Level</label>
                          <input type="text" name="level" required value={formData.level} onChange={handleChange} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none text-sm shadow-sm" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">Grade *</label>
                          <input type="text" name="grade" required value={formData.grade} onChange={handleChange} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none text-sm shadow-sm" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-indigo-600 mb-1.5 uppercase">Tingkat (0,1,2) *</label>
                          <input type="number" name="tingkat" required value={formData.tingkat} onChange={handleChange} className="w-full px-4 py-2.5 bg-indigo-50/50 border border-indigo-200 rounded-xl outline-none text-sm shadow-sm" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">Lokasi</label>
                          <input type="text" name="work_location" value={formData.work_location} onChange={handleChange} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none text-sm shadow-sm" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* BLOK 3 */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span> Rantai Komando & Managerial</h3>
                    <div className="space-y-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">Atasan (Reports To)</label>
                        <select name="reports_to_id" value={formData.reports_to_id} onChange={handleChange} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none text-sm shadow-sm">
                          <option value="">-- Puncak / Tanpa Atasan --</option>
                          {allPositions.map(pos => <option key={pos.id} value={pos.id}>[{pos.department}] {pos.position_title}</option>)}
                        </select>
                      </div>
                      <div className="pt-3 border-t border-slate-200">
                        <p className="text-[11px] font-bold text-slate-700 mb-3 uppercase">Khusus Managerial (Opsional):</p>
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase">Tk. Managerial</label>
                            <input type="number" name="tingkat_managerial" value={formData.tingkat_managerial} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg text-sm" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase">Tk. Divisi</label>
                            <input type="number" name="tingkat_divisi" value={formData.tingkat_divisi} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg text-sm" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase">Pointer Divisi</label>
                          <input type="text" name="pointer_divisi" value={formData.pointer_divisi} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg text-sm" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white rounded-xl py-3 font-semibold hover:bg-slate-800 transition-all flex justify-center items-center">
                    {loading ? <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></div> : 'Simpan Formasi'}
                  </button>
                </form>
              </div>
            </div>

            {/* --- TABEL KANAN --- */}
            <div className="xl:col-span-8 w-full min-w-0 flex flex-col gap-6">
              <div className="bg-white shadow-lg shadow-slate-200/50 rounded-2xl border border-slate-200/60 flex flex-col relative overflow-hidden">
                {tableLoading && <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-20 flex justify-center items-center"><div className="animate-spin w-8 h-8 border-4 border-teal-100 border-t-teal-600 rounded-full"></div></div>}

                <div className="p-5 md:p-6 border-b border-slate-100 bg-white space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Daftar Formasi Kosong</h2>
                      <p className="text-sm text-slate-500">Kelola slot formasi yang belum terisi.</p>
                    </div>
                    <Link href="/manpower/org-chart" className="flex items-center gap-2 bg-white border px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-50 shadow-sm"><Network size={16} className="text-indigo-500" /> Lihat Org Chart</Link>
                  </div>
                </div>
                
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase w-2/6">Posisi</th>
                        <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase w-1/6">Level & Tingkat</th>
                        <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase w-1/6">Departemen</th>
                        <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase text-center w-[15%]">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {vacantSlots.length > 0 ? vacantSlots.map((slot) => (
                        <tr key={slot.id} className="hover:bg-slate-50/80">
                          <td className="px-6 py-4"><p className="font-bold text-slate-900">{slot.position_title}</p></td>
                          <td className="px-6 py-4"><span className="text-[11px] font-bold bg-slate-100 px-2 py-1 rounded-md">{slot.level}</span> <br/><span className="text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-mono mt-1 inline-block">Tk: {slot.tingkat}</span></td>
                          <td className="px-6 py-4 text-sm font-semibold text-slate-700">{slot.department}</td>
                          <td className="px-6 py-4 text-center">
                            <button onClick={() => handleOpenAssignModal(slot.id, slot.position_title)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-lg text-xs font-bold border border-indigo-200"><User size={14} /> Isi Slot</button>
                          </td>
                        </tr>
                      )) : <tr><td colSpan={4} className="py-20 text-center text-slate-500">Tidak ada formasi kosong.</td></tr>}
                    </tbody>
                  </table>
                </div>

                {totalItems > 0 && (
                  <div className="p-4 md:p-5 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                    <p className="text-sm text-slate-500">Total {totalItems} data</p>
                    <div className="flex items-center gap-2">
                      <button disabled={query.page === 1} onClick={() => updateQuery({ page: query.page - 1 })} className="p-2 border rounded-lg bg-white disabled:opacity-50"><ChevronLeft size={16} /></button>
                      <button disabled={query.page === totalPages} onClick={() => updateQuery({ page: query.page + 1 })} className="p-2 border rounded-lg bg-white disabled:opacity-50"><ChevronRight size={16} /></button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* --- MODAL ASSIGN --- */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-bold flex items-center gap-2"><User size={18} className="text-indigo-600" /> Isi Slot Formasi</h3>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-slate-400 hover:bg-slate-200 rounded p-1"><X size={18} /></button>
            </div>
            <form onSubmit={handleAssignSubmit} className="p-6 space-y-5">
              <div className="bg-indigo-50 p-4 rounded-xl">
                <p className="text-xs text-slate-500 font-semibold mb-1 uppercase">Formasi Tujuan</p>
                <p className="font-bold text-slate-800">{selectedManpowerTitle}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Pilih Orang *</label>
                <select required value={selectedPerson} onChange={(e) => setSelectedPerson(e.target.value)} className="w-full px-4 py-3 border rounded-xl text-sm">
                  <option value="" disabled>-- Pilih Karyawan/Kandidat --</option>
                  {availablePersons.employees.length > 0 && <optgroup label="🏢 Karyawan Internal">{availablePersons.employees.map(emp => <option key={emp.id} value={`employee|${emp.id}`}>{emp.name}</option>)}</optgroup>}
                  {availablePersons.candidates.length > 0 && <optgroup label="📝 Kandidat Pelamar">{availablePersons.candidates.map(cand => <option key={cand.id} value={`candidate|${cand.id}`}>{cand.name}</option>)}</optgroup>}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsAssignModalOpen(false)} className="flex-1 py-2.5 border rounded-xl font-semibold">Batal</button>
                <button type="submit" disabled={assignLoading || !selectedPerson} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold flex justify-center items-center">
                  {assignLoading ? <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></div> : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}