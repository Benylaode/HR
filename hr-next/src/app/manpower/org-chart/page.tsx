'use client'

import { useState, useEffect, useMemo } from 'react'
import { 
  Building2, Layers, Briefcase, ChevronDown, ChevronRight, 
  Network, Users, MapPin, User, X
} from 'lucide-react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'

// ─── INTERFACES ───────────────────────────────────────────────────────────────
interface Employee {
  id: number;
  nama: string;
}

interface Manpower {
  id: number | string
  position_title: string
  level: string
  grade: string
  department: string
  work_location?: string
  employee_count?: number
  employees?: Employee[] // Tambahan data array karyawan dari backend
}

// ─── KOMPONEN: Modal Detail Posisi ──────────────────────────────────────────────
function PositionDetailModal({ position, onClose }: { position: Manpower; onClose: () => void }) {
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
          <div>
            <h3 className="text-lg font-bold text-slate-900 leading-tight">{position.position_title}</h3>
            <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
              <Building2 size={14} className="text-teal-600" /> {position.department || 'General'}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 bg-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>
        
        <div className="p-5 space-y-4">
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <span className="px-2.5 py-1 rounded-md bg-teal-50 text-teal-700 text-xs font-bold border border-teal-100">
              Level: {position.level}
            </span>
            <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-bold font-mono border border-emerald-100">
              Grade: {position.grade}
            </span>
          </div>

          <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
              <MapPin size={16} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold mb-0.5 uppercase tracking-wider">Lokasi Kerja</p>
              <p className="font-medium text-slate-800">{position.work_location || 'Kantor Pusat - Makassar'}</p>
            </div>
          </div>

          {/* DAFTAR KARYAWAN YANG MENEMPATI POSISI INI */}
          <div className="pt-2">
            <p className="text-xs text-slate-400 font-bold mb-3 uppercase tracking-wider flex items-center gap-2">
              <Users size={14} /> Penghuni Formasi ({position.employee_count || 0})
            </p>
            
            {(!position.employees || position.employees.length === 0) ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-300 text-center bg-slate-50">
                <p className="text-sm text-slate-500 font-medium">Slot Formasi Kosong</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                {position.employees.map((emp) => (
                  <div key={emp.id} className="flex items-center gap-3 p-2.5 bg-white border border-slate-100 rounded-xl shadow-sm">
                    <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold uppercase">
                      {emp.nama.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700">{emp.nama}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {emp.id}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl transition-all shadow-sm">
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── KOMPONEN: Node Posisi (Paling Ujung) ─────────────────────────────────────
function PositionNode({ position }: { position: Manpower }) {
  const [showDetail, setShowDetail] = useState(false)

  return (
    <>
      <div 
        onClick={() => setShowDetail(true)}
        className="group relative flex flex-col gap-1 cursor-pointer select-none bg-white border border-slate-200 rounded-xl px-3.5 py-3 shadow-sm hover:border-teal-400 hover:shadow-md transition-all duration-200 min-w-[160px] max-w-[200px]"
      >
        <div className="flex items-start gap-2">
          <Briefcase size={14} className="text-teal-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs font-bold text-slate-800 leading-snug line-clamp-2">
            {position.position_title}
          </p>
        </div>
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
            {position.level}
          </span>
          <span className="text-[10px] font-mono font-bold text-emerald-600">
            {position.grade}
          </span>
        </div>
        {/* Tambahan: Indikator cepat jika ada karyawan */}
        {position.employee_count && position.employee_count > 0 ? (
          <div className="absolute -top-2 -right-2 bg-teal-500 text-white text-[9px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm">
            {position.employee_count}
          </div>
        ) : null}
        <div className="absolute inset-0 rounded-xl bg-teal-50/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      </div>

      {showDetail && (
        <PositionDetailModal position={position} onClose={() => setShowDetail(false)} />
      )}
    </>
  )
}

// ─── KOMPONEN: Node Level (Tengah) ────────────────────────────────────────────
function LevelNode({ name, positions }: { name: string; positions: Manpower[] }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-px h-6 bg-slate-300" />
      <button
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-colors shadow-sm z-10"
        onClick={() => setOpen(!open)}
      >
        <Layers size={14} className="text-emerald-600" />
        {name || 'Tanpa Level'}
        {open ? <ChevronDown size={14} className="text-emerald-500" /> : <ChevronRight size={14} className="text-emerald-500" />}
        <span className="ml-1 text-[10px] bg-white px-1.5 py-0.5 rounded text-emerald-600 font-bold border border-emerald-100">
          {positions.length}
        </span>
      </button>

      {open && (
        <>
          <div className="w-px h-4 bg-slate-300" />
          <div className="flex flex-wrap justify-center gap-4 border-t-2 border-slate-200 pt-4 px-4 relative">
            {/* Garis horizontal atas anak */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] h-px bg-slate-200" />
            
            {positions.map(pos => (
              <div key={pos.id} className="relative pt-4 animate-in fade-in slide-in-from-top-2">
                <div className="absolute top-0 left-1/2 w-px h-4 bg-slate-200 -translate-x-1/2" />
                <PositionNode position={pos} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── KOMPONEN: Node Department (Akar/Paling Atas) ─────────────────────────────
function DepartmentNode({ name, levels }: { name: string; levels: { level: string; positions: Manpower[] }[] }) {
  const [open, setOpen] = useState(true)
  const totalPositions = levels.reduce((sum, lvl) => sum + lvl.positions.length, 0)

  return (
    <div className="flex flex-col items-center gap-2 mb-16">
      <button
        className="flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-teal-600 text-white text-sm font-bold shadow-lg hover:bg-teal-700 hover:shadow-xl transition-all z-10"
        onClick={() => setOpen(!open)}
      >
        <Building2 size={18} />
        {name}
        {open ? <ChevronDown size={16} className="opacity-70" /> : <ChevronRight size={16} className="opacity-70" />}
        <div className="flex items-center gap-1.5 ml-2 bg-white/20 px-2.5 py-1 rounded-lg text-xs font-medium backdrop-blur-sm">
          <Briefcase size={12} />
          <span>{totalPositions} Posisi</span>
        </div>
      </button>

      {open && (
        <>
          <div className="w-px h-6 bg-slate-300" />
          <div className="flex flex-wrap justify-center gap-10 border-t-2 border-slate-300 pt-5 relative">
             <div className="absolute top-0 left-1/2 w-px h-5 bg-slate-300 -translate-x-1/2" />
             
            {levels.map((lvl) => (
              <div key={lvl.level} className="relative animate-in fade-in slide-in-from-top-4">
                 <div className="absolute top-0 left-1/2 w-px h-5 bg-slate-300 -translate-x-1/2" />
                <LevelNode name={lvl.level} positions={lvl.positions} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── KOMPONEN UTAMA ───────────────────────────────────────────────────────────
export default function OrgChartPage() {
  const [data, setData] = useState<Manpower[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const token = localStorage.getItem("hr_token")
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"
        const response = await fetch(`${baseUrl}/manpower/all`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        })
        if (response.ok) {
          const result = await response.json()
          setData(result)
        }
      } catch (error) {
        console.error("Gagal memuat data chart", error)
      } finally {
        setLoading(false)
      }
    }
    fetchAllData()
  }, [])

  // Logika Pengelompokan Data (Department -> Level -> Position)
  const orgTree = useMemo(() => {
    const tree: Record<string, Record<string, Manpower[]>> = {}
    
    data.forEach(pos => {
      const dept = pos.department || 'Lainnya'
      const lvl = pos.level || 'Staff'
      
      if (!tree[dept]) tree[dept] = {}
      if (!tree[dept][lvl]) tree[dept][lvl] = []
      
      tree[dept][lvl].push(pos)
    })

    return Object.entries(tree).map(([deptName, levelsObj]) => ({
      department: deptName,
      levels: Object.entries(levelsObj).map(([levelName, positions]) => ({
        level: levelName,
        positions
      }))
    }))
  }, [data])

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar />
      <div className="lg:ml-64 min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-teal-50 to-emerald-50">
        <Header title="Struktur Organisasi" subtitle="Visualisasi hierarki manpower perusahaan" />
        
        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Kartu Header & Legenda */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center shadow-inner">
                  <Network size={24} className="text-indigo-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Bagan Struktur Posisi</h1>
                  <p className="text-sm text-slate-500">Bagan interaktif — Klik pada node untuk melihat detail atau membuka/menutup cabang.</p>
                </div>
              </div>

              <div className="flex items-center gap-4 py-4 border-t border-slate-100 text-xs text-slate-500 flex-wrap">
                <span className="font-semibold text-slate-700">Legenda Hierarki:</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-teal-600 shadow-sm" /> Departemen
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-emerald-100 border border-emerald-300" /> Level Karir
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-white border border-slate-300 shadow-sm" /> Detail Posisi (Bisa diklik)
                </div>
              </div>
            </div>

            {/* Area Chart */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-100 p-8 overflow-x-auto min-h-[600px] flex justify-center">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-64 gap-4 text-teal-600">
                  <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin shadow-md" />
                  <p className="font-semibold animate-pulse">Menyusun bagan organisasi...</p>
                </div>
              ) : orgTree.length === 0 ? (
                <div className="text-center py-24 text-slate-400">
                  <Network size={64} className="mx-auto mb-4 opacity-20" />
                  <p className="text-lg font-medium text-slate-500">Belum ada data formasi posisi.</p>
                  <p className="text-sm mt-1">Tambahkan data melalui halaman Manpower Planning.</p>
                </div>
              ) : (
                <div className="flex flex-col items-center pt-8 pb-16 min-w-max">
                  <div className="flex flex-row justify-center gap-16">
                    {orgTree.map(dept => (
                      <DepartmentNode key={dept.department} name={dept.department} levels={dept.levels} />
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  )
}