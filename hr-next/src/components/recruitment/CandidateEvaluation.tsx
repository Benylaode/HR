'use client';

import React, { useState, useEffect } from 'react';
import { Save, UserCheck, Award, Target, User, Briefcase, Calendar } from 'lucide-react'; 
import { toast } from "sonner";
import { getAutoConclusion } from '@/lib/evaluationConclusions'; 
import { 
  CANDIDATE_COMPETENCY_CATEGORIES, 
  EMPLOYEE_COMPETENCY_CATEGORIES, 
  BEHAVIOR_QUESTIONS 
} from '@/lib/evaluationQuestions';

// INTERFACE
interface CandidateEvaluationProps {
  candidateId?: string; 
  employeeId?: string; 
  candidateName: string;
  candidateNik?: string; 
  jobPosition?: string;  
  evaluations?: any[];   
  submissions?: any[];   
  currentUserRole?: string; 
}

export default function CandidateEvaluation({ 
  candidateId, 
  employeeId, 
  candidateName, 
  candidateNik,
  jobPosition,
  currentUserRole = 'SUPER_USER' 
}: CandidateEvaluationProps) {
  
  const [activeTab, setActiveTab] = useState<'HR' | 'USER_1' | 'USER_2'>(currentUserRole === 'SUPER_USER' ? 'HR' : 'USER_1');
  const [scores, setScores] = useState<Record<string, number>>({});
  
  // State ini disembunyikan dari UI, tapi tetap menyimpan teks kesimpulan otomatis untuk backend
  const [overallNotes, setOverallNotes] = useState('');
  
  // STATE: Untuk menyimpan Readyness Karyawan
  const [readiness, setReadiness] = useState('');
  
  const [assessorName, setAssessorName] = useState('');
  const [assessorPosition, setAssessorPosition] = useState('');
  const [evaluationDate, setEvaluationDate] = useState(() => new Date().toISOString().split('T')[0]); 
  
  const [isSaving, setIsSaving] = useState(false);

  // === PENENTUAN PERTANYAAN (KARYAWAN VS KANDIDAT) ===
  const activeCompetencies = employeeId ? EMPLOYEE_COMPETENCY_CATEGORIES : CANDIDATE_COMPETENCY_CATEGORIES;

  // Helper untuk Autentikasi Headers
  const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem("hr_token");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  useEffect(() => {
    setActiveTab(currentUserRole === 'SUPER_USER' ? 'HR' : 'USER_1');
  }, [currentUserRole]);

  // Load Data dari Backend
  useEffect(() => {
    const fetchId = candidateId || employeeId || candidateNik;
    if (!fetchId) return;

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

    fetch(`${API_BASE_URL}/management/evaluations/${fetchId}`, {
      headers: getAuthHeaders()
    })
      .then(res => {
          if(!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.json();
      })
      .then((data: any[]) => {
        const currentForm = data.find(f => f.role_type === activeTab);
        if (currentForm) {
          if (currentForm.scores) {
            const loadedScores: Record<string, number> = {};
            currentForm.scores.forEach((s: any) => { loadedScores[s.criteria_name] = s.score; });
            setScores(loadedScores);
          }
          
          // PARSING READINESS DARI OVERALL NOTES (Jika ada)
          const notesData = currentForm.overall_notes || '';
          const match = notesData.match(/\[Readyness:\s(.*?)\]\n\nCatatan:\n([\s\S]*)/);
          if (match) {
              setReadiness(match[1]);
              setOverallNotes(match[2]);
          } else {
              setOverallNotes(notesData);
          }

          setAssessorName(currentForm.evaluator_name || '');
          setAssessorPosition(currentForm.evaluator_position || '');
          if(currentForm.evaluation_date) {
            setEvaluationDate(currentForm.evaluation_date);
          }
        } else {
          setScores({});
          setOverallNotes('');
          setReadiness('');
          setAssessorPosition('');
          setEvaluationDate(new Date().toISOString().split('T')[0]);
          try {
             const userData = localStorage.getItem("hr_user");
             if(userData) setAssessorName(JSON.parse(userData).name);
             else setAssessorName('');
          } catch (e) {
             setAssessorName('');
          }
        }
      })
      .catch((error) => { 
          console.error("Fetch Data Gagal:", error);
          setScores({}); 
          setOverallNotes(''); 
          setReadiness('');
      });
  }, [candidateId, employeeId, candidateNik, activeTab]);

  // === KALKULASI SKOR DINAMIS ===
  // Hitung jumlah soal kompetensi berdasarkan array yang aktif
  const numCompetencyQuestions = activeCompetencies.reduce((acc, cat) => acc + cat.questions.length, 0);
  
  const totalScore = Object.values(scores).reduce((acc, curr) => acc + (curr || 0), 0);
  const totalQuestions = numCompetencyQuestions + BEHAVIOR_QUESTIONS.length; 
  const maxPossibleScore = totalQuestions * 5;
  const percentageScore = Math.round((totalScore / maxPossibleScore) * 100) || 0;

  // Penentuan Kategori & Rekomendasi
  const getEvaluationStatus = (percentage: number) => {
    if (percentage < 50) return { category: "Unacceptable", status: "Not Recommended", color: "text-red-600", bg: "bg-red-50" };
    if (percentage >= 50 && percentage < 70) return { category: "Below Expectation", status: "Not Recommended", color: "text-orange-500", bg: "bg-orange-50" };
    if (percentage >= 70 && percentage < 80) return { category: "Fully Successful", status: "Recommended", color: "text-blue-600", bg: "bg-blue-50" };
    if (percentage >= 80 && percentage < 90) return { category: "Above Expectation", status: "Highly Recommended", color: "text-green-500", bg: "bg-green-50" };
    if (percentage >= 90) return { category: "Outstanding", status: "Highly Recommended", color: "text-emerald-600", bg: "bg-emerald-50" };
    return { category: "Belum Dinilai", status: "-", color: "text-gray-500", bg: "bg-gray-50" };
  };

  const evalStatus = getEvaluationStatus(percentageScore);

  // === EFEK: OTOMATIS SET CATATAN DI BACKGROUND SAAT SKOR BERUBAH ===
  // Note: Tidak dimunculkan di UI, tapi disimpan ke state untuk dikirim ke Backend
  useEffect(() => {
    if ((candidateId || employeeId || candidateNik) && percentageScore > 0) {
      const autoText = getAutoConclusion(percentageScore);
      setOverallNotes(autoText);
    } else if (percentageScore === 0) {
      setOverallNotes("");
    }
  }, [percentageScore, candidateId, employeeId, candidateNik]);

  // Fungsi mengamankan input skor (Lock 1-5)
  const handleScoreChange = (id: string, value: string) => {
    if (value === '') {
        const newScores = {...scores};
        delete newScores[id];
        setScores(newScores);
        return;
    }
    let num = parseInt(value);
    if (isNaN(num)) return;
    if (num > 5) num = 5;
    if (num < 1) num = 1;
    setScores(prev => ({...prev, [id]: num}));
  };

  // Handler Simpan
  const handleSave = async () => {
    if (!assessorName.trim()) {
        toast?.error("Mohon isi Nama Assesor terlebih dahulu!");
        return;
    }

    const fetchId = candidateId || employeeId || candidateNik;
    if (!fetchId) {
        toast?.error("Gagal menyimpan: ID Target tidak valid!");
        return;
    }

    setIsSaving(true);
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";
    
    // GABUNGKAN READINESS (Khusus Karyawan) KE NOTES UNTUK BACKEND
    const finalNotesToSave = employeeId && readiness 
        ? `[Readyness: ${readiness}]\n\nCatatan:\n${overallNotes}`
        : overallNotes;
    
    // Simpan data array aktif
    const flatCompetencyScores = activeCompetencies.flatMap(cat => 
        cat.questions.map(q => ({
            category: "COMPETENCY",
            criteria_name: q.id, 
            notes: q.indikator,
            score: scores[q.id] || 0
        }))
    );

    const payload = {
      role_type: activeTab,
      evaluator_name: assessorName, 
      evaluator_position: assessorPosition, 
      evaluation_date: evaluationDate,       
      overall_notes: finalNotesToSave, // <--- Ini akan tetap mengirimkan kesimpulan yg digenerate ke Database
      status: evalStatus.status === "Not Recommended" ? "FAILED" : "PASSED", 
      scores: [
        ...flatCompetencyScores,
        ...BEHAVIOR_QUESTIONS.map(q => ({
          category: "BEHAVIOR",
          criteria_name: q.id,
          notes: q.indikator,
          score: scores[q.id] || 0
        }))
      ]
    };

    try {
      const res = await fetch(`${API_BASE_URL}/management/evaluations/${fetchId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
          toast?.success('Penilaian berhasil disimpan!');
      } else {
          const errData = await res.json();
          toast?.error(`Gagal menyimpan penilaian: ${errData.error || 'Server error'}`);
      }
    } catch (error: any) {
      toast?.error(`Terjadi kesalahan jaringan: ${error.message}`);
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const displayIdTarget = candidateId || employeeId || candidateNik;
  if (!displayIdTarget) {
    return (
      <div className="p-8 bg-white border border-dashed border-[var(--secondary-300)] rounded-2xl text-center flex flex-col items-center justify-center h-[500px]">
        <UserCheck className="w-16 h-16 mb-4 text-[var(--secondary-200)]" />
        <p className="font-bold text-[var(--primary-900)] text-lg">Pilih Target Terlebih Dahulu</p>
        <p className="text-[var(--secondary-500)] text-sm mt-1">Silakan pilih target dari dropdown di menu untuk memulai form penilaian.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[var(--secondary-200)] flex flex-col h-full max-h-[850px] overflow-hidden">
      
      {/* HEADER & TABS */}
      <div className="p-5 border-b border-[var(--secondary-100)] bg-[var(--background)] flex flex-col gap-4">
        
        <div className="flex justify-between items-start">
            <div>
                <h3 className="font-bold text-[var(--primary-900)] text-lg">
                  {employeeId ? 'Assesment Interview (Internal Hire)' : 'Assesment Interview (Eksternal)'}
                </h3>
                <p className="text-sm text-[var(--secondary-600)] mt-1">Assesi: <span className="font-bold text-[var(--primary)]">{candidateName}</span></p>
                {jobPosition && <p className="text-xs text-[var(--secondary-500)]">Posisi: {jobPosition}</p>}
            </div>
            <div className={`px-4 py-2 rounded-xl border border-[var(--secondary-200)] shadow-sm text-right ${evalStatus.bg}`}>
                <div className="text-[10px] font-bold text-[var(--secondary-500)] uppercase tracking-widest">Grand Score</div>
                <div className={`text-2xl font-black ${evalStatus.color}`}>{percentageScore}%</div>
            </div>
        </div>

        {/* INPUT NAMA, JABATAN, DAN TANGGAL */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-white p-3 rounded-xl border border-[var(--secondary-200)] flex items-center gap-3">
             <div className="bg-[var(--primary-50)] p-2 rounded-lg">
                <User className="w-5 h-5 text-[var(--primary)]" />
             </div>
             <div className="flex-1 flex flex-col">
               <label className="text-[10px] font-bold text-[var(--secondary-500)] uppercase tracking-wide mb-1">Nama Assesor</label>
               <input 
                 type="text" 
                 placeholder="Ketik nama..."
                 value={assessorName}
                 onChange={(e) => setAssessorName(e.target.value)}
                 className="w-full bg-transparent text-sm font-bold text-[var(--primary-900)] outline-none border-b border-transparent focus:border-[var(--primary)] transition-colors py-1"
               />
             </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-[var(--secondary-200)] flex items-center gap-3">
             <div className="bg-[var(--primary-50)] p-2 rounded-lg">
                <Briefcase className="w-5 h-5 text-[var(--primary)]" />
             </div>
             <div className="flex-1 flex flex-col">
               <label className="text-[10px] font-bold text-[var(--secondary-500)] uppercase tracking-wide mb-1">Jabatan Assesor</label>
               <input 
                 type="text" 
                 placeholder="Ketik jabatan..."
                 value={assessorPosition}
                 onChange={(e) => setAssessorPosition(e.target.value)}
                 className="w-full bg-transparent text-sm font-bold text-[var(--primary-900)] outline-none border-b border-transparent focus:border-[var(--primary)] transition-colors py-1"
               />
             </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-[var(--secondary-200)] flex items-center gap-3">
             <div className="bg-[var(--primary-50)] p-2 rounded-lg">
                <Calendar className="w-5 h-5 text-[var(--primary)]" />
             </div>
             <div className="flex-1 flex flex-col">
               <label className="text-[10px] font-bold text-[var(--secondary-500)] uppercase tracking-wide mb-1">Tanggal Evaluasi</label>
               <input 
                 type="date" 
                 value={evaluationDate}
                 onChange={(e) => setEvaluationDate(e.target.value)}
                 className="w-full bg-transparent text-sm font-bold text-[var(--primary-900)] outline-none border-b border-transparent focus:border-[var(--primary)] transition-colors py-1"
               />
             </div>
          </div>
        </div>

        {/* ROLE TABS */}
        <div className="flex gap-2 bg-[var(--secondary-50)] p-1.5 rounded-xl border border-[var(--secondary-200)] w-fit">
          {currentUserRole === 'SUPER_USER' ? (
            <button onClick={() => setActiveTab('HR')} className={`px-5 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'HR' ? 'bg-white text-[var(--primary)] shadow-sm border border-[var(--secondary-200)]' : 'text-[var(--secondary-500)] hover:text-[var(--primary-700)]'}`}>Form Penilaian HR</button>
          ) : (
            <>
              <button onClick={() => setActiveTab('USER_1')} className={`px-5 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'USER_1' ? 'bg-white text-[var(--primary)] shadow-sm border border-[var(--secondary-200)]' : 'text-[var(--secondary-500)] hover:text-[var(--primary-700)]'}`}>Form User 1</button>
              <button onClick={() => setActiveTab('USER_2')} className={`px-5 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'USER_2' ? 'bg-white text-[var(--primary)] shadow-sm border border-[var(--secondary-200)]' : 'text-[var(--secondary-500)] hover:text-[var(--primary-700)]'}`}>Form User 2</button>
            </>
          )}
        </div>
      </div>

      {/* FORM CONTENT (SCROLLABLE) */}
      <div className="flex-1 overflow-y-auto p-5 bg-gray-50/50 space-y-8">
        
        {/* BAGIAN A: KOMPETENSI */}
        <div className="card-static bg-white rounded-2xl border border-[var(--secondary-200)] shadow-sm overflow-hidden">
          <div className="p-4 bg-[var(--primary-50)] border-b border-[var(--secondary-100)] flex items-center gap-2">
            <Award className="w-5 h-5 text-[var(--primary)]" />
            <h4 className="font-bold text-[var(--primary-900)] text-sm uppercase tracking-wide">
              {employeeId ? 'Scoring Assessment: Behavior Event Interview' : 'Scoring Assessment: Kompetensi (STAR Method)'}
            </h4>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm bg-white">
              <thead className="bg-[var(--secondary-50)] text-[var(--secondary-500)] font-bold uppercase text-[10px] tracking-wide border-b border-[var(--secondary-100)]">
                  <tr>
                      <th className="p-3 w-1/3">Pertanyaan Interview</th>
                      <th className="p-3 w-1/2">Perilaku / Indikator</th>
                      <th className="p-3 text-center w-24">Skala (1-5)</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-[var(--secondary-100)]">
                {activeCompetencies.map((cat, catIdx) => (
                    <React.Fragment key={catIdx}>
                        {/* Kategori Header */}
                        <tr className="bg-[var(--secondary-50)]/50">
                            <td className="p-3 font-bold text-[var(--primary-800)]">{cat.category}</td>
                            <td className="p-3 text-xs text-[var(--secondary-500)] italic">[S:Situation, T:Task, A:Action, R:Result]</td>
                            <td className="p-3 text-center text-[10px] font-bold text-[var(--primary-600)]">BOBOT {cat.bobot}</td>
                        </tr>
                        {/* Soal per Kategori */}
                        {cat.questions.map((q) => (
                            <tr key={q.id} className="hover:bg-[var(--primary-50)]/30 transition-colors">
                                <td className="p-3 text-[var(--secondary-700)] leading-relaxed pr-4">{q.question}</td>
                                <td className="p-3 text-[var(--secondary-600)]">{q.indikator}</td>
                                <td className="p-3 align-middle">
                                    <input 
                                        type="number" min="1" max="5" placeholder="1-5"
                                        className="w-full h-10 border border-[var(--secondary-200)] rounded-lg text-center font-bold text-[var(--primary-900)] focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] outline-none transition-all"
                                        value={scores[q.id] || ''}
                                        onChange={(e) => handleScoreChange(q.id, e.target.value)}
                                        onKeyDown={(e) => {
                                            if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
                                        }}
                                    />
                                </td>
                            </tr>
                        ))}
                    </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* BAGIAN B: VALUE BEHAVIOR */}
        <div className="card-static bg-white rounded-2xl border border-[var(--secondary-200)] shadow-sm overflow-hidden">
          <div className="p-4 bg-emerald-50 border-b border-[var(--secondary-100)] flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-600" />
            <h4 className="font-bold text-emerald-900 text-sm uppercase tracking-wide">
              Value Behaviour (Greatness)
            </h4>
          </div>
          
          <div className="p-4 bg-white border-b border-[var(--secondary-100)] text-xs grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 text-[var(--secondary-600)]">
              <div className="flex gap-2 items-center"><span className="w-5 h-5 rounded-md bg-red-100 text-red-700 font-bold flex items-center justify-center shrink-0">1</span> Tidak Pernah muncul</div>
              <div className="flex gap-2 items-center"><span className="w-5 h-5 rounded-md bg-orange-100 text-orange-700 font-bold flex items-center justify-center shrink-0">2</span> Jarang muncul</div>
              <div className="flex gap-2 items-center"><span className="w-5 h-5 rounded-md bg-yellow-100 text-yellow-700 font-bold flex items-center justify-center shrink-0">3</span> Kadang-Kadang muncul</div>
              <div className="flex gap-2 items-center"><span className="w-5 h-5 rounded-md bg-[var(--primary-50)] text-[var(--primary-700)] font-bold flex items-center justify-center shrink-0">4</span> Sering muncul</div>
              <div className="flex gap-2 items-center"><span className="w-5 h-5 rounded-md bg-green-100 text-green-700 font-bold flex items-center justify-center shrink-0">5</span> Selalu muncul di setiap situasi</div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm bg-white">
               <thead className="bg-[var(--secondary-50)] text-[var(--secondary-500)] font-bold uppercase text-[10px] tracking-wide border-b border-[var(--secondary-100)]">
                  <tr>
                      <th className="p-3 w-10 text-center">No</th>
                      <th className="p-3 w-28">Value</th>
                      <th className="p-3 w-36">Sub Value</th>
                      <th className="p-3 min-w-[200px]">Indikator Perilaku</th>
                      <th className="p-3 text-center w-40">Proficiency (1-5)</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-[var(--secondary-100)]">
                {BEHAVIOR_QUESTIONS.map((q, idx) => (
                  <tr key={q.id} className="hover:bg-[var(--primary-50)]/30 transition-colors">
                    <td className="p-3 text-center text-[var(--secondary-500)] font-medium">{idx + 1}</td>
                    <td className="p-3 font-bold text-[var(--primary-900)]">{q.value}</td>
                    <td className="p-3 text-[var(--secondary-700)] font-medium">{q.sub}</td>
                    <td className="p-3 text-[var(--secondary-600)] leading-relaxed">{q.indikator}</td>
                    <td className="p-3 align-middle bg-[var(--secondary-50)]/30">
                        <div className="flex justify-between items-center w-full px-2">
                            {[1, 2, 3, 4, 5].map((val) => (
                                <button
                                    key={val}
                                    onClick={() => handleScoreChange(q.id, String(val))}
                                    className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold border transition-all ${
                                        scores[q.id] === val 
                                        ? 'bg-[var(--primary)] border-[var(--primary)] text-white scale-110 shadow-md shadow-[var(--primary)]/30' 
                                        : 'bg-white border-[var(--secondary-300)] text-[var(--secondary-400)] hover:border-[var(--primary-400)] hover:text-[var(--primary-600)]'
                                    }`}
                                >
                                    {val}
                                </button>
                            ))}
                        </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* HASIL EVALUASI AKHIR (SUMMARY TANPA TEXTAREA) */}
        <div className="bg-white p-5 rounded-2xl border border-[var(--secondary-200)] shadow-sm">
            <div className={`p-6 rounded-xl border ${evalStatus.color.replace('text-', 'border-')} ${evalStatus.bg} flex flex-col md:flex-row justify-between items-center gap-4`}>
                <div>
                    <div className="text-xs font-bold uppercase tracking-wide opacity-70 mb-1">Hasil Evaluasi Akhir</div>
                    <div className={`text-3xl font-black ${evalStatus.color}`}>{evalStatus.category}</div>
                </div>
                <div className={`text-sm font-bold uppercase px-6 py-2.5 rounded-full bg-white shadow-sm border border-[var(--secondary-100)] ${evalStatus.color}`}>
                   Status: {evalStatus.status}
                </div>
            </div>
            {/* Note: Kesimpulan tersimpan secara otomatis di latar belakang tanpa ditampilkan di UI */}
        </div>

      </div>

      {/* FOOTER */}
      <div className="p-5 border-t border-[var(--secondary-200)] bg-white flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
            <div className="bg-[var(--primary-50)] px-4 py-2 rounded-xl border border-[var(--primary-100)] flex flex-col items-center">
                <span className="text-[10px] font-bold text-[var(--primary-600)] uppercase tracking-wide block mb-1">Total Poin</span>
                <span className="font-black text-2xl text-[var(--primary-900)] leading-none">{totalScore}</span>
            </div>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-[var(--primary)] hover:bg-[var(--primary-700)] text-white px-8 py-3.5 rounded-xl text-sm font-bold shadow-lg shadow-[var(--primary)]/20 disabled:opacity-50 flex items-center gap-2 transition-all active:scale-95"
        >
          {isSaving ? 'Menyimpan...' : <><Save className="w-5 h-5"/> Submit Penilaian Final</>}
        </button>
      </div>

    </div>
  );
}