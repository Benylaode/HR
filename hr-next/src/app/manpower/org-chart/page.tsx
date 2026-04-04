'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { Building2, Briefcase, Users, X, Network, MapPin } from 'lucide-react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'

interface Employee { id: number; nama: string; }

interface Manpower {
  id: number | string; position_title: string; level: string;
  tingkat: number; grade: string; department: string; division: string;
  reports_to_id?: number | null; boss_name?: string | null; work_location?: string;
  tingkat_managerial?: number | null; tingkat_divisi?: number | null; pointer_divisi?: string | null;
  employee_count?: number; employees?: Employee[];
}

// --- KOMPONEN MODAL DETAIL KARYAWAN ---
function PositionDetailModal({ position, onClose }: { position: Manpower; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-slate-100 flex justify-between items-start bg-slate-50">
          <div>
            <h3 className="text-xl font-bold">{position.position_title}</h3>
            <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5"><Building2 size={16} className="text-teal-600"/> {position.department}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white border border-slate-200 rounded-xl hover:text-red-500 hover:bg-red-50"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto">
          {position.boss_name && (
            <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl text-sm">
              <span className="font-bold text-blue-700 block text-xs uppercase">Melapor Kepada:</span>
              <span className="text-blue-900 font-medium">{position.boss_name}</span>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 text-xs font-bold border border-teal-100">Level: {position.level}</span>
            <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">Grade: {position.grade}</span>
          </div>
          <div className="flex items-center gap-3.5 text-sm text-slate-600 bg-white p-4 rounded-xl border border-slate-200">
            <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100"><MapPin size={18} /></div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase">Lokasi Kerja</p>
              <p className="font-semibold text-slate-800">{position.work_location || 'Kantor Pusat - Makassar'}</p>
            </div>
          </div>
          <div className="pt-2">
            <div className="flex justify-between items-center mb-3">
              <p className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2"><Users size={16}/> Penghuni Formasi</p>
              <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-md border">{position.employee_count || 0} Orang</span>
            </div>
            {(!position.employees || position.employees.length === 0) ? (
              <div className="p-6 rounded-xl border-2 border-dashed border-slate-200 text-center bg-slate-50 text-slate-400 text-sm">Slot Masih Kosong</div>
            ) : (
              <div className="space-y-2">
                {position.employees.map((emp) => (
                  <div key={emp.id} className="flex gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:border-teal-300">
                    <div className="w-9 h-9 rounded-full bg-teal-500 text-white flex justify-center items-center font-bold uppercase">{emp.nama.charAt(0)}</div>
                    <div><p className="text-sm font-bold text-slate-800">{emp.nama}</p><p className="text-[11px] text-slate-400 font-mono mt-0.5">ID: {emp.id}</p></div>
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

export default function OrgChartPage() {
  const [data, setData] = useState<Manpower[]>([])
  const [loading, setLoading] = useState(true)
  const [chartMode, setChartMode] = useState<'managerial' | 'divisional'>('managerial')
  const [selectedDivision, setSelectedDivision] = useState<string>('')
  
  // State untuk Data Node yang Diklik
  const [selectedPosition, setSelectedPosition] = useState<Manpower | null>(null)

  // State Garis SVG
  const [lines, setLines] = useState<{ id: string, d: string }[]>([])
  const chartContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const token = localStorage.getItem("hr_token")
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"
        const response = await fetch(`${baseUrl}/manpower/all`, { headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) } })
        if (response.ok) setData(await response.json())
      } finally { setLoading(false) }
    }
    fetchAllData()
  }, [])

  const divisions = useMemo(() => Array.from(new Set(data.map(d => d.pointer_divisi || d.division).filter(Boolean))), [data])

  // Filter & Pengelompokan Logika Bisnis
  const chartData = useMemo(() => {
    let filtered = chartMode === 'managerial' 
      ? data.filter(d => d.tingkat_managerial != null)
      : data.filter(d => d.division === selectedDivision || d.pointer_divisi === selectedDivision)

    const groupedByLevel: Record<number, Record<string, Manpower[]>> = {}
    
    filtered.forEach(node => {
      let activeTingkat = node.tingkat || 0
      if (chartMode === 'managerial' && node.tingkat_managerial != null) activeTingkat = node.tingkat_managerial
      else if (chartMode === 'divisional' && node.pointer_divisi === selectedDivision && node.tingkat_divisi != null) activeTingkat = node.tingkat_divisi

      if (!groupedByLevel[activeTingkat]) groupedByLevel[activeTingkat] = {}
      const dept = node.department || 'General'
      if (!groupedByLevel[activeTingkat][dept]) groupedByLevel[activeTingkat][dept] = []
      
      groupedByLevel[activeTingkat][dept].push(node)
    })

    return groupedByLevel
  }, [data, chartMode, selectedDivision])

  const sortedLevels = Object.keys(chartData).map(Number).sort((a, b) => a - b)

  // LOGIKA SVG SKIP-LEVEL LINES
  useEffect(() => {
    const drawLines = () => {
      if (!chartContainerRef.current) return;
      const containerRect = chartContainerRef.current.getBoundingClientRect();
      const newLines: { id: string, d: string }[] = [];

      data.forEach(node => {
        if (node.reports_to_id) {
          const childEl = document.getElementById(`node-${node.id}`);
          const bossEl = document.getElementById(`node-${node.reports_to_id}`);
          
          if (childEl && bossEl) {
            const cRect = childEl.getBoundingClientRect();
            const bRect = bossEl.getBoundingClientRect();

            const startX = bRect.left + bRect.width / 2 - containerRect.left;
            const startY = bRect.bottom - containerRect.top;
            const endX = cRect.left + cRect.width / 2 - containerRect.left;
            const endY = cRect.top - containerRect.top;

            const d = `M ${startX} ${startY} C ${startX} ${startY + 40}, ${endX} ${endY - 40}, ${endX} ${endY}`;
            newLines.push({ id: `line-${node.id}`, d });
          }
        }
      });
      setLines(newLines);
    };

    const timer = setTimeout(drawLines, 300);
    window.addEventListener('resize', drawLines);
    return () => { clearTimeout(timer); window.removeEventListener('resize', drawLines); }
  }, [chartData, data])

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="lg:ml-64 flex flex-col min-h-screen">
        <Header title="Struktur Organisasi" subtitle="Visualisasi Rantai Komando & Posisi" />
        
        <main className="flex-1 p-6">
          <div className="max-w-[1600px] mx-auto space-y-6">
            
            {/* TABS NAVIGASI MANAGER & DIVISI */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap gap-3">
              <button 
                onClick={() => setChartMode('managerial')}
                className={`px-5 py-2.5 rounded-xl font-bold text-sm ${chartMode === 'managerial' ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >Struktur Managerial</button>
              
              <div className="w-px h-10 bg-slate-200 mx-2 hidden sm:block" />
              
              {divisions.map(div => (
                <button
                  key={div} onClick={() => { setChartMode('divisional'); setSelectedDivision(div); }}
                  className={`px-5 py-2.5 rounded-xl font-bold text-sm ${chartMode === 'divisional' && selectedDivision === div ? 'bg-teal-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >Divisi {div}</button>
              ))}
            </div>

            {/* AREA KANVAS CHART */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 min-h-[700px] overflow-x-auto relative" ref={chartContainerRef}>
              
              {/* LAPISAN SVG */}
              <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
                {lines.map(line => (
                  <path key={line.id} d={line.d} stroke="#94a3b8" strokeWidth="2" fill="none" />
                ))}
              </svg>

              {loading ? (
                <div className="flex justify-center items-center h-64"><div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full" /></div>
              ) : sortedLevels.length === 0 ? (
                <div className="flex flex-col justify-center items-center text-slate-400 mt-20 font-medium">
                  <Network size={48} className="text-slate-200 mb-4" />
                  Belum ada data struktur untuk tampilan ini.
                </div>
              ) : (
                <div className="flex flex-col items-center gap-20 min-w-max pb-20 relative z-10 pt-10">
                  
                  {sortedLevels.map(levelIndex => (
                    <div key={levelIndex} className="relative w-full flex flex-col items-center">
                      <div className="absolute -left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-300 -rotate-90 uppercase tracking-widest">
                        Tingkat {levelIndex}
                      </div>

                      <div className="flex gap-12 justify-center items-start">
                        {Object.entries(chartData[levelIndex]).map(([deptName, positions]) => (
                          <div key={deptName} className="flex flex-col items-center p-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                              <Building2 size={12}/> {deptName}
                            </span>
                            
                            <div className="flex gap-6">
                              {positions.map(pos => (
                                <div 
                                  key={pos.id} 
                                  id={`node-${pos.id}`} 
                                  onClick={() => setSelectedPosition(pos)}
                                  className="relative bg-white border-2 border-slate-200 hover:border-teal-500 rounded-xl p-4 shadow-sm w-[200px] z-20 transition-all cursor-pointer hover:shadow-lg"
                                >
                                  <div className="flex items-start gap-2">
                                    <Briefcase size={16} className="text-teal-600 mt-0.5 shrink-0" />
                                    <p className="text-sm font-bold text-slate-800 leading-tight">{pos.position_title}</p>
                                  </div>
                                  <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between">
                                    <span className="text-[10px] text-slate-500 font-bold uppercase">{pos.level}</span>
                                    <span className="text-[10px] text-emerald-600 font-bold">Grade {pos.grade}</span>
                                  </div>
                                  {pos.employee_count! > 0 && (
                                    <div className="absolute -top-3 -right-3 bg-teal-600 text-white text-xs font-bold w-6 h-6 flex justify-center items-center rounded-full border-2 border-white">{pos.employee_count}</div>
                                  )}
                                  {/* Label Bantuan Skip-Level */}
                                  {pos.boss_name && (
                                    <div className="mt-2 text-[9px] text-slate-400 truncate">⇧ To: {pos.boss_name}</div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      
      {/* RENDER MODAL JIKA ADA POSISI YANG DIKLIK */}
      {selectedPosition && (
        <PositionDetailModal position={selectedPosition} onClose={() => setSelectedPosition(null)} />
      )}
    </div>
  )
}