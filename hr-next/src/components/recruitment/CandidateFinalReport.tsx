'use client';

import React from 'react';
import { getPapiInterpretation, getPapiTraitName, extractPapiLetter } from '@/utils/papiScoring';
import { 
  getCompetencyConclusion, 
  getValueConclusion, 
  getAutoConclusion, 
  getRecommendationStatus,
  getBeiOverallConclusion,
  getValueOverallConclusion
} from '@/lib/evaluationConclusions';
import { CANDIDATE_COMPETENCY_CATEGORIES, EMPLOYEE_COMPETENCY_CATEGORIES, BEHAVIOR_QUESTIONS } from '@/lib/evaluationQuestions';

interface ReportProps {
  candidateId?: string;
  employeeId?: string;
  candidateName: string;
  candidateNik?: string;
  jobPosition?: string;
  evaluations: any[];
  submissions: any[];
}

export default function CandidateFinalReport({
  candidateId,
  employeeId,
  candidateName,
  candidateNik = "-",
  jobPosition = "-",
  evaluations = [],
  submissions = [],
}: ReportProps) {
  
  const displayId = employeeId || candidateId || candidateNik || "UNKNOWN";
  const printDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  // =====================================
  // 1. DATA PROCESSING (EVALUASI)
  // =====================================
  const maxCompScore = employeeId ? 80 : 75;

  const processedEvals = evaluations.map((e: any) => {
    const compScores = e.scores?.filter((s: any) => s.category === 'COMPETENCY') || [];
    const behavScores = e.scores?.filter((s: any) => s.category === 'BEHAVIOR') || [];
    const compTotal = compScores.reduce((acc: number, curr: any) => acc + curr.score, 0);
    const behavTotal = behavScores.reduce((acc: number, curr: any) => acc + curr.score, 0);
    const rawNotes = e.overall_notes || '';
    const match = rawNotes.match(/\[Readyness:\s(.*?)\]\n\nCatatan:\n([\s\S]*)/);
    
    return {
      role: e.role_type || 'Assessor',
      name: e.evaluator_name || '-',
      compScore: Math.round((compTotal / maxCompScore) * 100) || 0,
      behavScore: Math.round((behavTotal / 70) * 100) || 0,
      notes: match ? match[2].trim() : rawNotes.trim()
    };
  });

  // MENGHITUNG PERSENTASE AKHIR KATEGORI (Kategori BEI & Kategori Value Behaviour)
  const avgComp = processedEvals.length > 0 ? processedEvals.reduce((acc, curr) => acc + curr.compScore, 0) / processedEvals.length : 0;
  const avgBehav = processedEvals.length > 0 ? processedEvals.reduce((acc, curr) => acc + curr.behavScore, 0) / processedEvals.length : 0;
  
  // Penanganan BUG 0%
  const totalScore = evaluations.length > 0 ? (avgComp + avgBehav) / 2 : 0; 
  const finalStatus = getRecommendationStatus(totalScore);
  const mainAssessor = evaluations.find(e => e.role_type === 'HR') || evaluations[0] || { evaluator_name: '-', role_type: '-' };

  // =====================================
  // GENERATE DYNAMIC DETAILS DARI LIB (MENGGUNAKAN PERSENTASE KATEGORI)
  // =====================================
  const competencyTemplate = employeeId ? EMPLOYEE_COMPETENCY_CATEGORIES : CANDIDATE_COMPETENCY_CATEGORIES;

  // Mapping BEI: Semua Teks Parameter menggunakan persentase AKHIR KATEGORI BEI (avgComp)
  const BEI_DETAILS = competencyTemplate.map((c: any) => ({
    title: c.category,
    text: getCompetencyConclusion(c.category, avgComp)
  }));

  // Mapping VALUE BEHAVIOUR: Semua Teks Parameter menggunakan persentase AKHIR KATEGORI VB (avgBehav)
  const uniqueBehaviors = Array.from(new Set(BEHAVIOR_QUESTIONS.map((q: any) => q.value)));
  const VALUE_DETAILS = uniqueBehaviors.map((v: any) => ({
    title: v,
    text: getValueConclusion(v as string, avgBehav)
  }));

  // =====================================
  // 2. DATA PSIKOTES & KRAEPELIN
  // =====================================
  const cfit = submissions.find(s => s.test_type === 'cfit')?.scores || {};
  const papi = submissions.find(s => s.test_type === 'papi')?.scores || {};
  const kraepelinSub = submissions.find(s => s.test_type === 'kraepelin');
  const kraepelin = kraepelinSub?.scores || {};
  
  const displayPanker = kraepelin.panker ?? kraepelin.kecepatan ?? '-';
  const displayErrors = kraepelin.totalErrors ?? kraepelin.salah ?? '-';
  let displayHanker: string | number = kraepelin.hanker ?? '-';

  if ((displayHanker === '-' || !displayHanker) && kraepelinSub?.raw_answers) {
    try {
      let raw = typeof kraepelinSub.raw_answers === 'string' ? JSON.parse(kraepelinSub.raw_answers) : kraepelinSub.raw_answers;
      let rawDataArray: any[] = [];
      if (Array.isArray(raw)) {
        rawDataArray = raw;
      } else if (raw && typeof raw === 'object') {
        rawDataArray = Object.keys(raw).sort((a, b) => Number(a) - Number(b)).map(k => raw[k]);
      }
      if (rawDataArray.length > 1) {
        let y_values = rawDataArray.map((item: any) => {
          if (typeof item === 'object' && item !== null) return Number(item.correct || item.benar || 0);
          return Number(item || 0);
        }).filter(v => !isNaN(v));

        const N = y_values.length;
        if (N > 1) {
          let sx = 0, sy = 0, sx2 = 0, sxy = 0;
          for (let i = 0; i < N; i++) {
            const x = i + 1; const y = y_values[i];
            sx += x; sy += y; sx2 += (x * x); sxy += (x * y);
          }
          const denom = (N * sx2) - (sx * sx);
          const b = denom !== 0 ? ((N * sxy) - (sx * sy)) / denom : 0;
          displayHanker = Number((b * 50).toFixed(3));
        }
      }
    } catch (e) {
      console.error("Gagal auto-healing hanker di Final Report:", e);
    }
  }

  const getSpeedLabel = (n: any) => { if (n === '-' || n === undefined) return '-'; const v = Number(n); if (v > 17.21) return "Above"; if (v >= 14.973) return "High"; if (v >= 12.736) return "Average"; if (v >= 10.5) return "Low"; return "Below"; };
  const getAccuracyLabel = (n: any) => { if (n === '-' || n === undefined) return '-'; const v = Number(n); if (v <= 0) return "Above"; if (v <= 2) return "High"; if (v <= 13) return "Average"; if (v <= 22) return "Low"; return "Below"; };
  const getEnduranceLabel = (n: any) => { if (n === '-' || n === undefined) return '-'; const v = Number(n); if (v > 2.496) return "Above"; if (v >= 1.015) return "High"; if (v >= -0.468) return "Average"; if (v >= -1.95) return "Low"; return "Below"; };

  const labelCepat = getSpeedLabel(displayPanker);
  const labelTeliti = getAccuracyLabel(displayErrors);
  const labelTahan = getEnduranceLabel(displayHanker);

  const allPapi = Object.entries(papi).map(([trait, score]) => ({
    letter: extractPapiLetter(trait),
    score: Number(score),
    traitName: getPapiTraitName(trait),
    desc: getPapiInterpretation(trait, Number(score))
  })).sort((a, b) => b.score - a.score);

  // =====================================
  // 3. STYLES (PDF CONFIG)
  // =====================================
  const safePageStyle: React.CSSProperties = {
    width: '210mm', height: '296.5mm', padding: '12mm', backgroundColor: '#ffffff', boxSizing: 'border-box',
    display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', color: '#1e293b', pageBreakInside: 'avoid'
  };
  const thStyle: React.CSSProperties = { padding: '5px 8px', textAlign: 'left', fontSize: '9px', color: '#1e3a8a', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', fontWeight: 'bold' };
  const tdStyle: React.CSSProperties = { padding: '5px 8px', fontSize: '9px', border: '1px solid #cbd5e1', color: '#334155' };
  const getBadgeStyle = (label: string, defaultColor: string, defaultBg: string): React.CSSProperties => {
    if (label === '-') return { display: 'none' };
    const isBad = label === 'Low' || label === 'Below';
    return { fontSize: '7px', fontWeight: 'bold', marginTop: '3px', textTransform: 'uppercase', color: isBad ? '#b91c1c' : defaultColor, backgroundColor: isBad ? '#fee2e2' : defaultBg, padding: '2px 4px', borderRadius: '2px', display: 'inline-block' };
  };

  const DocHeader = ({ subtitle }: { subtitle: string }) => (
    <div style={{ marginBottom: '15px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
        <div style={{ width: '140px', display: 'flex', justifyContent: 'flex-start' }}><img src="/images/logos/ptLogoText.png" alt="Logo SCM" style={{ height: '35px', objectFit: 'contain' }} /></div>
        <div style={{ flex: 1, textAlign: 'center', paddingTop: '4px' }}>
          <h1 style={{ fontSize: '16px', color: '#1e3a8a', margin: '0 0 2px 0', letterSpacing: '0.5px', fontWeight: '900', textTransform: 'uppercase' }}>{subtitle}</h1>
          <p style={{ fontSize: '9px', color: '#64748b', margin: 0 }}>Dokumen Resmi Hasil Evaluasi Psikologi & Wawancara</p>
        </div>
        <div style={{ width: '140px', display: 'flex', justifyContent: 'flex-end' }}><img src="/images/logos/MBMlogo.png" alt="Logo MBM" style={{ height: '35px', objectFit: 'contain' }} /></div>
      </div>
      <div style={{ width: '100%', height: '2px', backgroundColor: '#1e3a8a', marginTop: '10px' }}></div>
    </div>
  );

  return (
    <div style={{ backgroundColor: '#ffffff', padding: 0, margin: 0, display: 'flex', justifyContent: 'center', width: '100%', minHeight: '100vh' }}>
      <div id="pdf-document" style={{ width: '210mm', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column' }}>
        
        {/* ==================== HALAMAN 1: LAYOUT SHEET 2 ==================== */}
        <div style={safePageStyle}>
          <DocHeader subtitle="FINAL EVALUATION REPORT" />

          <table style={{ width: '100%', fontSize: '10px', marginBottom: '12px', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ width: '15%', fontWeight: 'bold', padding: '2px' }}>Nama Assesi</td>
                <td style={{ width: '35%', padding: '2px' }}>: <span style={{ fontWeight: 'bold', fontSize: '12px' }}>{candidateName}</span></td>
                <td style={{ width: '15%', fontWeight: 'bold', padding: '2px' }}>NIK / No. KTP</td>
                <td style={{ width: '35%', padding: '2px' }}>: {candidateNik}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', padding: '2px' }}>Posisi</td>
                <td style={{ padding: '2px' }}>: {jobPosition}</td>
                <td style={{ fontWeight: 'bold', padding: '2px' }}>Tanggal Cetak</td>
                <td style={{ padding: '2px' }}>: {printDate}</td>
              </tr>
            </tbody>
          </table>

          <div style={{ backgroundColor: '#1e3a8a', color: '#ffffff', textAlign: 'center', fontWeight: 'bold', fontSize: '11px', padding: '6px', marginBottom: '10px', borderRadius: '2px' }}>
            PSIKOGRAPH HASIL INTERVIEW
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
             <div style={{ flex: 1 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                   <thead><tr><th style={thStyle}>Soft Kompetensi (BEI)</th><th style={{ ...thStyle, textAlign: 'center', width: '25%' }}>Score</th></tr></thead>
                   <tbody>
                      <tr><td style={{...tdStyle, fontWeight: 'bold', backgroundColor: '#f8fafc'}}>Overall Score</td><td style={{...tdStyle, textAlign: 'center', fontWeight: 'bold', backgroundColor: '#f8fafc', color: '#1e3a8a'}}>{totalScore > 0 ? avgComp.toFixed(2)+'%' : '-'}</td></tr>
                      {processedEvals.length > 0 ? processedEvals.map((e, i) => (
                         <tr key={i}><td style={tdStyle}>[{e.role}] {e.name !== '-' ? e.name : 'Menunggu...'}</td><td style={{...tdStyle, textAlign: 'center'}}>{e.compScore}%</td></tr>
                      )) : <tr><td style={tdStyle} colSpan={2} align="center"><span style={{fontStyle:'italic', color:'#94a3b8'}}>Belum ada penilai</span></td></tr>}
                   </tbody>
                </table>
             </div>
             <div style={{ flex: 1 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                   <thead><tr><th style={thStyle}>Value Behaviour (Greatness)</th><th style={{ ...thStyle, textAlign: 'center', width: '25%' }}>Score</th></tr></thead>
                   <tbody>
                      <tr><td style={{...tdStyle, fontWeight: 'bold', backgroundColor: '#f8fafc'}}>Overall Score</td><td style={{...tdStyle, textAlign: 'center', fontWeight: 'bold', backgroundColor: '#f8fafc', color: '#059669'}}>{totalScore > 0 ? avgBehav.toFixed(2)+'%' : '-'}</td></tr>
                      {processedEvals.length > 0 ? processedEvals.map((e, i) => (
                         <tr key={i}><td style={tdStyle}>[{e.role}] {e.name !== '-' ? e.name : 'Menunggu...'}</td><td style={{...tdStyle, textAlign: 'center'}}>{e.behavScore}%</td></tr>
                      )) : <tr><td style={tdStyle} colSpan={2} align="center"><span style={{fontStyle:'italic', color:'#94a3b8'}}>Belum ada penilai</span></td></tr>}
                   </tbody>
                </table>
             </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
             {/* BAGIAN KIRI - KESIMPULAN & TABEL BEI */}
             <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', padding: '6px', marginBottom: '6px' }}>
                   <div style={{ fontWeight: 'bold', fontSize: '9px', color: '#1e3a8a', marginBottom: '4px', borderBottom: '1px solid #cbd5e1', paddingBottom: '3px' }}>
                      Kesimpulan Soft Kompetensi (BEI)
                   </div>
                   <div style={{ fontSize: '9px', textAlign: 'justify', lineHeight: 1.4, color: avgComp > 0 ? '#1e293b' : '#94a3b8' }}>
                      {getBeiOverallConclusion(avgComp)}
                   </div>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                   <tbody>
                      {BEI_DETAILS.map((d, i) => (
                         <tr key={i}>
                            <td style={{ ...tdStyle, width: '35%', fontWeight: 'bold', backgroundColor: '#f8fafc', verticalAlign: 'top' }}>{d.title}</td>
                            <td style={{ ...tdStyle, textAlign: 'justify', lineHeight: 1.3 }}>{d.text}</td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>

             {/* BAGIAN KANAN - KESIMPULAN & TABEL VALUE BEHAVIOUR */}
             <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', padding: '6px', marginBottom: '6px' }}>
                   <div style={{ fontWeight: 'bold', fontSize: '9px', color: '#059669', marginBottom: '4px', borderBottom: '1px solid #cbd5e1', paddingBottom: '3px' }}>
                      Kesimpulan Value Behaviour
                   </div>
                   <div style={{ fontSize: '9px', textAlign: 'justify', lineHeight: 1.4, color: avgBehav > 0 ? '#1e293b' : '#94a3b8' }}>
                      {getValueOverallConclusion(avgBehav)}
                   </div>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                   <tbody>
                      {VALUE_DETAILS.map((d, i) => (
                         <tr key={i}>
                            <td style={{ ...tdStyle, width: '35%', fontWeight: 'bold', backgroundColor: '#f8fafc', verticalAlign: 'top' }}>{d.title}</td>
                            <td style={{ ...tdStyle, textAlign: 'justify', lineHeight: 1.3 }}>{d.text}</td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>

          <div style={{ border: '1px solid #cbd5e1', marginBottom: '12px' }}>
            <div style={{ padding: '5px 8px', backgroundColor: '#f1f5f9', fontWeight: 'bold', fontSize: '9px', borderBottom: '1px solid #cbd5e1' }}>
               KESIMPULAN INTERVIEW
            </div>
            <div style={{ padding: '10px', fontSize: '9px', textAlign: 'justify', lineHeight: 1.5, color: totalScore > 0 ? '#1e293b' : '#94a3b8' }}>
               {getAutoConclusion(totalScore)}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 'auto', paddingTop: '10px' }}>
             <table style={{ width: '65%', borderCollapse: 'collapse', border: '2px solid #1e3a8a' }}>
                 <thead style={{ backgroundColor: '#1e3a8a', color: '#fff' }}>
                    <tr>
                       <th style={{ padding: '5px', fontSize: '9px', borderRight: '1px solid #93c5fd', textAlign: 'center' }}>GRAND SCORE</th>
                       <th style={{ padding: '5px', fontSize: '9px', borderRight: '1px solid #93c5fd', textAlign: 'center' }}>KATEGORI</th>
                       <th style={{ padding: '5px', fontSize: '9px', borderRight: '1px solid #93c5fd', textAlign: 'center' }}>STATUS</th>
                       <th style={{ padding: '5px', fontSize: '9px', textAlign: 'center' }}>KODE</th>
                    </tr>
                 </thead>
                 <tbody>
                   <tr>
                      <td style={{ padding: '10px', fontWeight: '900', textAlign: 'center', fontSize: '20px', color: '#1e3a8a', borderRight: '1px solid #cbd5e1', backgroundColor: '#eff6ff' }}>
                         {totalScore > 0 ? totalScore.toFixed(2)+'%' : '-'}
                      </td>
                      <td style={{ padding: '10px', fontWeight: 'bold', backgroundColor: '#f8fafc', borderRight: '1px solid #cbd5e1', fontSize: '11px', textAlign: 'center' }}>{finalStatus.remarks}</td>
                      <td style={{ padding: '10px', fontWeight: 'bold', borderRight: '1px solid #cbd5e1', fontSize: '11px', color: totalScore > 0 ? '#059669' : '#64748b', textAlign: 'center' }}>{finalStatus.status}</td>
                      <td style={{ padding: '10px', fontWeight: '900', textAlign: 'center', fontSize: '13px', color: totalScore > 0 ? '#b91c1c' : '#64748b' }}>{finalStatus.code}</td>
                   </tr>
                 </tbody>
             </table>

             <div style={{ width: '30%', textAlign: 'center' }}>
                <p style={{ fontSize: '10px', margin: '0 0 40px 0' }}>Authorized Assessor,</p>
                <p style={{ fontSize: '11px', fontWeight: 'bold', textDecoration: 'underline', margin: 0 }}>{mainAssessor.evaluator_name !== '-' ? mainAssessor.evaluator_name : '_______________________'}</p>
                <p style={{ fontSize: '9px', color: '#64748b', margin: '2px 0 0 0' }}>HR Department</p>
             </div>
          </div>
        </div>

        {/* ==================== HALAMAN 2: PSIKOTES ==================== */}
        <div style={safePageStyle}>
          <DocHeader subtitle="PSYCHOLOGICAL ASSESSMENT REPORT" />

          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <div style={{ flex: '1', border: '1px solid #e2e8f0', borderTop: '3px solid #3b82f6', borderRadius: '4px', padding: '8px', backgroundColor: '#ffffff' }}>
              <h3 style={{ fontSize: '9px', color: '#1e40af', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', margin: '0 0 8px 0', fontWeight: 'bold' }}>1. Kecerdasan Kognitif (CFIT)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', textAlign: 'center' }}>
                  <div style={{ backgroundColor: '#f8fafc', padding: '6px', borderRadius: '4px' }}>
                     <p style={{ fontSize: '7.5px', color: '#64748b', margin: 0, fontWeight: 'bold', textTransform: 'uppercase' }}>Skor IQ</p>
                     <p style={{ fontSize: '16px', fontWeight: '900', margin: '4px 0 0 0', color: '#1e40af' }}>{cfit.iq || '-'}</p>
                  </div>
                  <div style={{ backgroundColor: '#f8fafc', padding: '6px', borderRadius: '4px' }}>
                     <p style={{ fontSize: '7.5px', color: '#64748b', margin: 0, fontWeight: 'bold', textTransform: 'uppercase' }}>Klasifikasi</p>
                     <p style={{ fontSize: '11px', fontWeight: 'bold', margin: '4px 0 0 0' }}>{cfit.classification || '-'}</p>
                  </div>
                  <div style={{ backgroundColor: '#f8fafc', padding: '6px', borderRadius: '4px' }}>
                     <p style={{ fontSize: '7.5px', color: '#64748b', margin: 0, fontWeight: 'bold', textTransform: 'uppercase' }}>Benar</p>
                     <p style={{ fontSize: '16px', fontWeight: 'bold', margin: '4px 0 0 0' }}>{cfit.raw_score ?? '-'}</p>
                  </div>
              </div>
            </div>
            
            <div style={{ flex: '1', border: '1px solid #e2e8f0', borderTop: '3px solid #10b981', borderRadius: '4px', padding: '8px', backgroundColor: '#ffffff' }}>
              <h3 style={{ fontSize: '9px', color: '#065f46', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', margin: '0 0 8px 0', fontWeight: 'bold' }}>2. Performa Kerja (Kraepelin)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', textAlign: 'center' }}>
                  <div style={{ backgroundColor: '#fcf8ea', padding: '6px', borderRadius: '4px' }}>
                    <p style={{ fontSize: '7.5px', color: '#b45309', margin: 0, fontWeight: 'bold', textTransform: 'uppercase' }}>Cepat</p>
                    <p style={{ fontSize: '16px', fontWeight: '900', margin: '4px 0 0 0', color: '#78350f' }}>{displayPanker}</p>
                    <span style={getBadgeStyle(labelCepat, '#b45309', '#fef3c7')}>{labelCepat}</span>
                  </div>
                  <div style={{ backgroundColor: '#fef2f2', padding: '6px', borderRadius: '4px' }}>
                    <p style={{ fontSize: '7.5px', color: '#ef4444', margin: 0, fontWeight: 'bold', textTransform: 'uppercase' }}>Teliti</p>
                    <p style={{ fontSize: '16px', fontWeight: '900', margin: '4px 0 0 0', color: '#b91c1c' }}>{displayErrors}</p>
                    <span style={getBadgeStyle(labelTeliti, '#ef4444', '#fee2e2')}>{labelTeliti}</span>
                  </div>
                  <div style={{ backgroundColor: '#faf5ff', padding: '6px', borderRadius: '4px' }}>
                    <p style={{ fontSize: '7.5px', color: '#9333ea', margin: 0, fontWeight: 'bold', textTransform: 'uppercase' }}>Tahan</p>
                    <p style={{ fontSize: '16px', fontWeight: '900', margin: '4px 0 0 0', color: '#5b21b6' }}>{displayHanker}</p>
                    <span style={getBadgeStyle(labelTahan, '#7e22ce', '#f3e8ff')}>{labelTahan}</span>
                  </div>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '4px', padding: '8px', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', overflow: 'hidden' }}>
            <h3 style={{ fontSize: '9px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '6px', fontWeight: 'bold', color: '#006666' }}>3. Profil Kepribadian & Gaya Kerja (PAPI Kostick)</h3>
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: '15px', gridAutoRows: '1fr' }}>
              {allPapi.length > 0 ? allPapi.map((p, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', borderBottom: '1px dashed #cbd5e1', padding: '3px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8.5px', fontWeight: 'bold' }}>
                    <span style={{ fontSize: '11px', color : '#006666' }}>[{p.letter}] {p.traitName}</span>
                    <span style={{ backgroundColor: '#f1f5f9', padding: '1px 5px', borderRadius: '3px', fontSize: '11px', color : '#006666'}}>{p.score}</span>
                  </div>
                  <p style={{ fontSize: '9px', margin: '2px 0 0 0', fontStyle: 'italic', lineHeight: '1.2', color: '#475569' }}>"{p.desc}"</p>
                </div>
              )) : (
                <p style={{ fontSize: '8.5px', color: '#64748b', textAlign: 'center', alignSelf: 'center', gridColumn: 'span 2', padding: '20px' }}>Data PAPI Kostick tidak tersedia.</p>
              )}
            </div>
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '7px', color: '#94a3b8' }}>
              <div>
                <p style={{ margin: '0 0 2px 0' }}>Sistem HR Terintegrasi</p>
                <p style={{ margin: 0 }}>ID Dokumen: DOC-{displayId} | Dicetak: {printDate}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: '0 0 2px 0', fontWeight: 'bold' }}>{mainAssessor.evaluator_name !== '-' ? mainAssessor.evaluator_name : 'System Generated'}</p>
                <p style={{ margin: 0 }}>HR Department</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}