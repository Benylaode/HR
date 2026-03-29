'use client'

import { useState, useEffect, useMemo } from 'react'
import { 
  Building2, Layers, Briefcase, ChevronDown, ChevronRight, 
  Network, Users, MapPin, X
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
  employees?: Employee[]
}

// ─── KOMPONEN: Modal Detail Posisi ──────────────────────────────────────────────
function PositionDetailModal({ position, onClose }: { position: Manpower; onClose: () => void }) {
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/80">
          <div className="pr-4">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
              {position.position_title}
            </h3>
            <p className="text-sm text-slate-500 mt-1.5 flex items-center gap-1.5 font-medium">
              <Building2 size={16} className="text-teal-600" /> {position.department || 'General'}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 bg-white text-slate-400 border border-slate-200 hover:text-red-500 hover:bg-red-50 hover:border-red-100 rounded-xl transition-all shadow-sm"
          >
            <X size={18} />
          </button>
        </div>
        
        {/* Modal Body (Scrollable) */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto custom-scrollbar">
          
          <div className="flex flex-wrap gap-2.5">
            <span className="px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 text-xs font-bold border border-teal-100 shadow-sm flex items-center gap-1.5">
              <Layers size={14} /> Level: {position.level}
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold font-mono border border-emerald-100 shadow-sm flex items-center gap-1.5">
              Grade: {position.grade}
            </span>
          </div>

          <div className="flex items-center gap-3.5 text-sm text-slate-600 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 border border-indigo-100">
              <MapPin size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold mb-0.5 uppercase tracking-wider">Lokasi Kerja</p>
              <p className="font-semibold text-slate-800">{position.work_location || 'Kantor Pusat - Makassar'}</p>
            </div>
          </div>

          <div className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider flex items-center gap-2">
                <Users size={16} className="text-slate-400" /> Penghuni Formasi
              </p>
              <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-md border border-slate-200">
                {position.employee_count || 0} Orang
              </span>
            </div>
            
            {(!position.employees || position.employees.length === 0) ? (
              <div className="p-6 rounded-xl border-2 border-dashed border-slate-200 text-center bg-slate-50 flex flex-col items-center justify-center gap-2">
                <Users size={24} className="text-slate-300" />
                <p className="text-sm text-slate-500 font-medium">Slot Formasi Masih Kosong</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {position.employees.map((emp) => (
                  <div key={emp.id} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-teal-300 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 text-white flex items-center justify-center text-xs font-bold uppercase shadow-sm flex-shrink-0">
                      {emp.nama.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{emp.nama}</p>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">ID: {emp.id}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
        className="group relative flex flex-col gap-1 cursor-pointer select-none bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-teal-500 hover:shadow-lg transition-all duration-200 w-[180px] sm:w-[220px] mx-auto z-10"
      >
        <div className="flex items-start gap-2.5">
          <div className="p-1.5 rounded-lg bg-teal-50 text-teal-600 flex-shrink-0 group-hover:bg-teal-500 group-hover:text-white transition-colors">
            <Briefcase size={16} />
          </div>
          <p className="text-sm font-bold text-slate-800 leading-snug line-clamp-2 text-left">
            {position.position_title}
          </p>
        </div>
        
        <div className="flex flex-col gap-1 mt-3 pt-3 border-t border-slate-100">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Level</span>
            <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">{position.level}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Grade</span>
            <span className="text-[11px] font-mono font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">{position.grade}</span>
          </div>
        </div>
        
        {position.employee_count && position.employee_count > 0 ? (
          <div className="absolute -top-2 -right-2 bg-slate-900 text-white text-[10px] font-bold min-w-[24px] h-6 px-1 flex items-center justify-center rounded-full shadow-md border-2 border-white" title="Jumlah Karyawan">
            {position.employee_count}
          </div>
        ) : null}
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
    <div className="flex flex-col items-center">
      {/* Tombol Level */}
      <button
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold hover:bg-emerald-100 transition-colors shadow-sm z-10 relative"
        onClick={() => setOpen(!open)}
      >
        <Layers size={16} className="text-emerald-600" />
        {name || 'Tanpa Level'}
        <span className="mx-1 w-px h-4 bg-emerald-200" />
        <span className="text-xs bg-white px-2 py-0.5 rounded-lg text-emerald-700 font-bold border border-emerald-100 shadow-sm">
          {positions.length}
        </span>
        {open ? <ChevronDown size={14} className="text-emerald-500 ml-1" /> : <ChevronRight size={14} className="text-emerald-500 ml-1" />}
      </button>

      {open && positions.length > 0 && (
        <>
          {/* Garis vertikal turun dari Level */}
          <div className="w-px h-6 bg-slate-300" />
          
          {/* Container Anak (Positions) dengan CSS Tree presisi */}
          <div className="flex flex-row justify-center w-max">
            {positions.map((pos, index) => (
              <div key={pos.id} className="relative px-3 pt-6 flex flex-col items-center animate-in fade-in slide-in-from-top-2">
                {/* Garis horizontal kiri */}
                {index > 0 && <div className="absolute top-0 left-0 w-1/2 h-px bg-slate-300" />}
                
                {/* Garis horizontal kanan */}
                {index < positions.length - 1 && <div className="absolute top-0 right-0 w-1/2 h-px bg-slate-300" />}
                
                {/* Garis vertikal menunjuk ke Node ini */}
                <div className="absolute top-0 left-1/2 w-px h-6 bg-slate-300 -translate-x-1/2" />
                
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
    <div className="flex flex-col items-center mb-16">
      {/* Tombol Department */}
      <button
        className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-slate-900 text-white text-sm font-bold shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all z-10 relative"
        onClick={() => setOpen(!open)}
      >
        <div className="p-1.5 bg-white/10 rounded-lg">
          <Building2 size={18} className="text-teal-400" />
        </div>
        <span className="tracking-wide">{name}</span>
        
        <div className="flex items-center gap-1.5 ml-3 bg-white/10 border border-white/10 px-2.5 py-1 rounded-lg text-xs font-medium backdrop-blur-sm">
          <Briefcase size={12} className="text-teal-300" />
          <span>{totalPositions}</span>
        </div>
        
        {open ? <ChevronDown size={16} className="opacity-50 ml-1" /> : <ChevronRight size={16} className="opacity-50 ml-1" />}
      </button>

      {open && levels.length > 0 && (
        <>
          {/* Garis vertikal turun dari Department */}
          <div className="w-px h-8 bg-slate-300" />
          
          {/* Container Anak (Levels) dengan CSS Tree presisi */}
          <div className="flex flex-row justify-center w-max">
            {levels.map((lvl, index) => (
              <div key={lvl.level} className="relative px-6 pt-8 flex flex-col items-center animate-in fade-in slide-in-from-top-4">
                {/* Garis horizontal kiri */}
                {index > 0 && <div className="absolute top-0 left-0 w-1/2 h-px bg-slate-300" />}
                
                {/* Garis horizontal kanan */}
                {index < levels.length - 1 && <div className="absolute top-0 right-0 w-1/2 h-px bg-slate-300" />}
                
                {/* Garis vertikal menunjuk ke Level ini */}
                <div className="absolute top-0 left-1/2 w-px h-8 bg-slate-300 -translate-x-1/2" />
                
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
      <div className="lg:ml-64 min-h-screen flex flex-col bg-slate-50/50">
        <Header title="Struktur Organisasi" subtitle="Visualisasi hierarki manpower perusahaan" />
        
        <main className="flex-1 p-4 md:p-6 lg:p-8 w-full">
          <div className="max-w-[1600px] mx-auto space-y-6">
            
            {/* Kartu Header & Legenda */}
            <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/60 p-6 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shadow-inner flex-shrink-0">
                  <Network size={24} className="text-indigo-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Bagan Struktur Posisi</h1>
                  <p className="text-sm text-slate-500 mt-0.5">Bagan interaktif — Klik node posisi untuk melihat detail karyawan.</p>
                </div>
              </div>

              <div className="flex items-center gap-4 py-3 px-4 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 flex-wrap">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Legenda:</span>
                <div className="flex items-center gap-2 font-medium">
                  <span className="w-3.5 h-3.5 rounded bg-slate-900 shadow-sm" /> Departemen
                </div>
                <div className="flex items-center gap-2 font-medium">
                  <span className="w-3.5 h-3.5 rounded bg-emerald-100 border border-emerald-300" /> Level Karir
                </div>
                <div className="flex items-center gap-2 font-medium">
                  <span className="w-3.5 h-3.5 rounded bg-white border border-slate-300 shadow-sm" /> Posisi
                </div>
              </div>
            </div>

            {/* Area Chart Wrapper */}
            <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/60 overflow-hidden relative min-h-[600px]">
              
              {loading && (
                <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4 p-6 bg-white rounded-2xl shadow-xl border border-slate-100">
                    <div className="w-10 h-10 border-4 border-teal-100 border-t-teal-600 rounded-full animate-spin" />
                    <p className="font-bold text-slate-600 text-sm animate-pulse">Menyusun bagan organisasi...</p>
                  </div>
                </div>
              )}

              {!loading && orgTree.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100 mb-4">
                    <Network size={32} className="text-slate-300" />
                  </div>
                  <p className="text-lg font-bold text-slate-700">Belum ada struktur formasi</p>
                  <p className="text-sm mt-1 text-slate-500">Tambahkan data melalui menu Manpower Planning.</p>
                </div>
              )}

              {/* Area Scroll Horizontal Bebas (Flexible Canvas) */}
              <div className="w-full h-full overflow-x-auto overflow-y-auto custom-scrollbar bg-slate-50/50 cursor-grab active:cursor-grabbing p-8 lg:p-12">
                <div className="min-w-max flex flex-col items-center">
                  {/* Root Node Container untuk Department */}
                  <div className="flex flex-row justify-center gap-16 md:gap-24 relative pt-4">
                    
                    {/* Garis horizontal penghubung antar Department */}
                    {orgTree.length > 1 && (
                      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                        {orgTree.map((_, i) => (
                          <div key={`dept-line-${i}`}>
                            {i > 0 && <div className="absolute top-4 left-0 w-1/2 h-px bg-slate-300" style={{ left: `${(100 / orgTree.length) * (i - 0.5)}%`, width: `${100 / orgTree.length}%` }} />}
                          </div>
                        ))}
                      </div>
                    )}

                    {orgTree.map((dept, index) => (
                      <div key={dept.department} className="relative flex flex-col items-center">
                        {/* Jika ingin merajut garis antar department, butuh parent dummy. Tapi umumnya department berdiri terpisah/sejajar. Di sini kita biarkan sejajar. */}
                        <DepartmentNode name={dept.department} levels={dept.levels} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  )
}