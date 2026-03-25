'use client'

import { useState, useEffect, useMemo } from 'react'
import { Building2, Layers, Briefcase, ChevronDown, ChevronRight, Network } from 'lucide-react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'

interface Manpower {
  id: number | string
  position_title: string
  level: string
  grade: string
  department: string
}

// Komponen: Node Posisi (Paling Ujung)
function PositionNode({ position }: { position: Manpower }) {
  return (
    <div className="group relative flex flex-col gap-1 cursor-default select-none bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm hover:border-teal-300 hover:shadow-md transition-all duration-150 min-w-[160px] max-w-[200px] text-center">
      <div className="flex flex-col items-center gap-1.5">
        <Briefcase size={14} className="text-teal-500 flex-shrink-0" />
        <p className="text-xs font-bold text-slate-800 leading-snug">
          {position.position_title}
        </p>
      </div>
      <div className="mt-1">
        <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-mono rounded border border-slate-200">
          Grade: {position.grade}
        </span>
      </div>
      <div className="absolute inset-0 rounded-xl bg-teal-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  )
}

// Komponen: Node Level (Tengah)
function LevelNode({ name, positions }: { name: string; positions: Manpower[] }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-px h-6 bg-slate-300" />
      <button
        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-colors shadow-sm"
        onClick={() => setOpen(!open)}
      >
        <Layers size={14} />
        {name || 'Tanpa Level'}
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <span className="ml-1 text-emerald-500 font-normal">({positions.length})</span>
      </button>

      {open && (
        <>
          <div className="w-px h-4 bg-slate-300" />
          <div className="flex flex-wrap justify-center gap-4 border-t border-slate-300 pt-4 px-4 relative">
            {/* Garis horizontal penghubung anak */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] h-px bg-slate-300" />
            
            {positions.map(pos => (
              <div key={pos.id} className="relative pt-4">
                <div className="absolute top-0 left-1/2 w-px h-4 bg-slate-300 -translate-x-1/2" />
                <PositionNode position={pos} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// Komponen: Node Department (Akar/Paling Atas)
function DepartmentNode({ name, levels }: { name: string; levels: { level: string; positions: Manpower[] }[] }) {
  const [open, setOpen] = useState(true)
  const totalPositions = levels.reduce((sum, lvl) => sum + lvl.positions.length, 0)

  return (
    <div className="flex flex-col items-center gap-2 mb-12">
      <button
        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-sm font-bold shadow-lg hover:from-teal-700 hover:to-emerald-700 transition-all transform hover:-translate-y-0.5"
        onClick={() => setOpen(!open)}
      >
        <Building2 size={18} />
        {name}
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        <span className="bg-white/20 px-2 py-0.5 rounded-md text-xs font-medium backdrop-blur-sm">
          {totalPositions} Posisi
        </span>
      </button>

      {open && (
        <>
          <div className="w-px h-6 bg-slate-300" />
          <div className="flex flex-wrap justify-center gap-8 border-t-2 border-slate-300 pt-4 relative">
             <div className="absolute top-0 left-1/2 w-px h-4 bg-slate-300 -translate-x-1/2" />
             
            {levels.map((lvl, i) => (
              <div key={lvl.level} className="relative">
                 <div className="absolute top-0 left-1/2 w-px h-4 bg-slate-300 -translate-x-1/2" />
                <LevelNode name={lvl.level} positions={lvl.positions} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// Komponen Utama Halaman
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
      <div className="lg:ml-64 min-h-screen flex flex-col bg-slate-50">
        <Header title="Struktur Organisasi" subtitle="Visualisasi hierarki manpower perusahaan" />
        
        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Kartu Header & Legenda */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center">
                  <Network size={24} className="text-teal-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Bagan Struktur Posisi</h1>
                  <p className="text-sm text-slate-500">Klik pada node untuk membuka atau menutup cabang struktur.</p>
                </div>
              </div>

              <div className="flex items-center gap-4 py-4 border-t border-slate-100 text-xs text-slate-500 flex-wrap">
                <span className="font-semibold text-slate-700">Legenda:</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-teal-600" /> Departemen
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300" /> Level Karir
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-white border border-slate-300" /> Detail Posisi
                </div>
              </div>
            </div>

            {/* Area Chart */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 overflow-x-auto min-h-[500px]">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-64 gap-4 text-teal-600">
                  <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
                  <p className="font-medium animate-pulse">Menyusun struktur organisasi...</p>
                </div>
              ) : orgTree.length === 0 ? (
                <div className="text-center py-20 text-slate-400">
                  <Network size={48} className="mx-auto mb-4 opacity-20" />
                  <p>Belum ada data formasi posisi.</p>
                </div>
              ) : (
                <div className="flex flex-col items-center pt-4">
                  {orgTree.map(dept => (
                    <DepartmentNode key={dept.department} name={dept.department} levels={dept.levels} />
                  ))}
                </div>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  )
}