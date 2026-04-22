'use client';

import React from 'react';
import { getPapiInterpretation, getPapiTraitName, extractPapiLetter } from '@/utils/papiScoring';

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

  // =====================================
  // 1. DATA PROCESSING (EVALUASI)
  // =====================================
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
      compScore: Math.round((compTotal / 75) * 100) || 0,
      behavScore: Math.round((behavTotal / 70) * 100) || 0,
      notes: match ? match[2].trim() : rawNotes.trim()
    };
  });

  const avgComp = processedEvals.length > 0 ? processedEvals.reduce((acc, curr) => acc + curr.compScore, 0) / processedEvals.length : 0;
  const avgBehav = processedEvals.length > 0 ? processedEvals.reduce((acc, curr) => acc + curr.behavScore, 0) / processedEvals.length : 0;
  const totalScore = processedEvals.length > 0 ? (avgComp + avgBehav) / 2 : 0;
  const mainAssessor = processedEvals.find(e => e.role === 'HR') || processedEvals[0] || { name: '-', role: '-', notes: '' };

  const getRecommendation = (score: number) => {
    if (score < 50) return { remarks: 'Unacceptable', status: 'Not Recommended' };
    if (score < 70) return { remarks: 'Below Expectation', status: 'Not Recommended' };
    if (score < 80) return { remarks: 'Fully Successful', status: 'Recommended' }; 
    if (score < 90) return { remarks: 'Above Expectation', status: 'Recommended' };
    return { remarks: 'Outstanding', status: 'Recommended' };
  };
  const finalStatus = getRecommendation(totalScore);

  // =====================================
  // 2. DATA PSIKOTES & AUTO-HEALING KRAEPELIN
  // =====================================
  const cfit = submissions.find(s => s.test_type === 'cfit')?.scores || {};
  const papi = submissions.find(s => s.test_type === 'papi')?.scores || {};
  const kraepelinSub = submissions.find(s => s.test_type === 'kraepelin');
  const kraepelin = kraepelinSub?.scores || {};
  
  const displayPanker = kraepelin.panker ?? kraepelin.kecepatan ?? '-';
  const displayErrors = kraepelin.totalErrors ?? kraepelin.salah ?? '-';
  let displayHanker: string | number = kraepelin.hanker ?? '-';

  // Real-time Healing Hanker
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

  // =====================================
  // 3. PENENTUAN KETERANGAN (GRADE LABEL) BAHASA INGGRIS
  // =====================================
  const getSpeedLabel = (n: any) => {
    if (n === '-' || n === undefined) return '-';
    const v = Number(n);
    if (v > 17.21) return "Above";
    if (v >= 14.973) return "High";
    if (v >= 12.736) return "Average";
    if (v >= 10.5) return "Low";
    return "Below";
  };

  const getAccuracyLabel = (n: any) => {
    if (n === '-' || n === undefined) return '-';
    const v = Number(n);
    if (v <= 0) return "Above";
    if (v <= 2) return "High";
    if (v <= 13) return "Average";
    if (v <= 22) return "Low";
    return "Below";
  };

  const getEnduranceLabel = (n: any) => {
    if (n === '-' || n === undefined) return '-';
    const v = Number(n);
    if (v > 2.496) return "Above";
    if (v >= 1.015) return "High";
    if (v >= -0.468) return "Average";
    if (v >= -1.95) return "Low";
    return "Below";
  };

  // Translator jika backend mengirim data lama berbahasa Indonesia
  const translateGrade = (label: string) => {
    if (!label || label === '-') return '-';
    const lower = label.toLowerCase();
    if (lower.includes('baik sekali')) return 'Above';
    if (lower.includes('baik')) return 'High';
    if (lower.includes('sedang')) return 'Average';
    if (lower.includes('kurang sekali')) return 'Below';
    if (lower.includes('kurang')) return 'Low';
    return label; 
  };

  const labelCepat = translateGrade(kraepelin.gradeSpeed) !== '-' ? translateGrade(kraepelin.gradeSpeed) : getSpeedLabel(displayPanker);
  const labelTeliti = translateGrade(kraepelin.gradeAccuracy) !== '-' ? translateGrade(kraepelin.gradeAccuracy) : getAccuracyLabel(displayErrors);
  const labelTahan = translateGrade(kraepelin.gradeEndurance) !== '-' ? translateGrade(kraepelin.gradeEndurance) : getEnduranceLabel(displayHanker);

  // Penyiapan Data PAPI
  const allPapi = Object.entries(papi).map(([trait, score]) => ({
    letter: extractPapiLetter(trait),
    score: Number(score),
    traitName: getPapiTraitName(trait),
    desc: getPapiInterpretation(trait, Number(score))
  })).sort((a, b) => b.score - a.score);

  const printDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  // Helper function untuk warna label grade di PDF
  const getBadgeStyle = (label: string, defaultColor: string, defaultBg: string): React.CSSProperties => {
    if (label === '-') return { display: 'none' };
    const isBad = label.toLowerCase() === 'low' || label.toLowerCase() === 'below';
    return {
      fontSize: '7px',
      fontWeight: 'bold',
      marginTop: '3px',
      textTransform: 'uppercase',
      color: isBad ? '#b91c1c' : defaultColor,
      backgroundColor: isBad ? '#fee2e2' : defaultBg,
      padding: '2px 4px',
      borderRadius: '2px',
      display: 'inline-block'
    };
  };

  // =====================================
  // 4. STYLES (PDF CONFIG)
  // =====================================
  const safePageStyle: React.CSSProperties = {
    width: '210mm',
    height: '296.5mm', 
    padding: '10mm', 
    backgroundColor: '#ffffff',
    boxSizing: 'border-box',
    display: 'flex',         
    flexDirection: 'column', 
    overflow: 'hidden', 
    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    color: '#1e293b',
    pageBreakInside: 'avoid'
  };

  const sectionTitleStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px', marginTop: '8px' };
  const titleBar = (color: string) => <div style={{ width: '4px', height: '10px', backgroundColor: color }}></div>;
  const thStyle: React.CSSProperties = { padding: '3px 8px', textAlign: 'left', fontSize: '7.5px', color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #cbd5e1' };
  const tdStyle: React.CSSProperties = { padding: '3px 8px', fontSize: '8px', borderBottom: '1px solid #e2e8f0' };

  const DocHeader = () => (
    <div style={{ textAlign: 'center', marginBottom: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginBottom: '6px' }}>
        <img src="/images/logos/MBMlogo.png" alt="Logo MBM" style={{ height: '30px', objectFit: 'contain' }} />
        <div style={{ height: '18px', width: '2px', backgroundColor: '#cbd5e1' }}></div>
        <img src="/images/logos/ptLogoText.png" alt="Logo SCM" style={{ height: '26px', objectFit: 'contain' }} />
      </div>
      <h1 style={{ fontSize: '11px', color: '#1e3a8a', margin: '2px 0', letterSpacing: '0.5px', fontWeight: '900' }}>FINAL EVALUATION REPORT</h1>
      <p style={{ fontSize: '7.5px', color: '#64748b', margin: 0 }}>Rekapitulasi Hasil Evaluasi Wawancara & Value Behavior</p>
      <div style={{ width: '100%', height: '2px', backgroundColor: '#1e3a8a', marginTop: '6px' }}></div>
    </div>
  );

  return (
    <div style={{ backgroundColor: '#ffffff', padding: 0, margin: 0, display: 'flex', justifyContent: 'center', width: '100%', minHeight: '100vh' }}>
      
      <div id="pdf-document" style={{ width: '210mm', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column' }}>
        
        {/* ==================== HALAMAN 1 (WAWANCARA) ==================== */}
        <div style={safePageStyle}>
          <DocHeader />

          <div style={sectionTitleStyle}>{titleBar('#1e3a8a')}<h2 style={{ fontSize: '9px', fontWeight: 'bold', margin: 0 }}>Identitas Assesi</h2></div>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e2e8f0' }}>
            <tbody>
              <tr><td style={{ ...tdStyle, width: '30%', backgroundColor: '#f8fafc', fontWeight: 'bold' }}>{employeeId ? "Nomor Karyawan" : "NIK KTP"}</td><td style={{ ...tdStyle, color: '#1e3a8a', fontWeight: 'bold' }}>{candidateNik}</td></tr>
              <tr><td style={{ ...tdStyle, backgroundColor: '#f8fafc', fontWeight: 'bold' }}>Nama Assesi</td><td style={{ ...tdStyle }}>{candidateName}</td></tr>
              <tr><td style={{ ...tdStyle, backgroundColor: '#f8fafc', fontWeight: 'bold' }}>Posisi Assesi</td><td style={{ ...tdStyle }}>{jobPosition}</td></tr>
            </tbody>
          </table>

          <div style={sectionTitleStyle}>{titleBar('#f59e0b')}<h2 style={{ fontSize: '9px', fontWeight: 'bold', margin: 0 }}>Behavioral Event Interview (BEI)</h2></div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={{...thStyle, width: '30%'}}>Assesor</th><th style={thStyle}>Nama Assesor</th><th style={{...thStyle, textAlign: 'center', width: '20%'}}>Score</th></tr></thead>
            <tbody>
              {processedEvals.map((ev, i) => (
                <tr key={i}><td style={tdStyle}>{ev.role}</td><td style={tdStyle}>{ev.name}</td><td style={{ ...tdStyle, textAlign: 'center', fontWeight: 'bold', color: '#b45309' }}>{ev.compScore}%</td></tr>
              ))}
            </tbody>
          </table>

          <div style={sectionTitleStyle}>{titleBar('#06b6d4')}<h2 style={{ fontSize: '9px', fontWeight: 'bold', margin: 0 }}>Value Behaviour</h2></div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={{...thStyle, width: '30%'}}>Assesor</th><th style={thStyle}>Nama Assesor</th><th style={{...thStyle, textAlign: 'center', width: '20%'}}>Score</th></tr></thead>
            <tbody>
              {processedEvals.map((ev, i) => (
                <tr key={i}><td style={tdStyle}>{ev.role}</td><td style={tdStyle}>{ev.name}</td><td style={{ ...tdStyle, textAlign: 'center', fontWeight: 'bold', color: '#0284c7' }}>{ev.behavScore}%</td></tr>
              ))}
            </tbody>
          </table>

          <div style={sectionTitleStyle}>{titleBar('#1e3a8a')}<h2 style={{ fontSize: '9px', fontWeight: 'bold', margin: 0 }}>Summary</h2></div>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e2e8f0' }}>
            <thead style={{ backgroundColor: '#f8fafc' }}>
              <tr><th style={{ ...thStyle, width: '10%', textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>NO</th><th style={{ ...thStyle, borderRight: '1px solid #e2e8f0' }}>JENIS ASSESMENT</th><th style={{ ...thStyle, width: '20%', textAlign: 'center' }}>RATA-RATA SCORE</th></tr>
            </thead>
            <tbody>
              <tr><td style={{ ...tdStyle, textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>1</td><td style={{ ...tdStyle, borderRight: '1px solid #e2e8f0' }}>Assesment - Behavioral Event Interview (BEI)</td><td style={{ ...tdStyle, textAlign: 'center' }}>{avgComp.toFixed(2)}%</td></tr>
              <tr><td style={{ ...tdStyle, textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>2</td><td style={{ ...tdStyle, borderRight: '1px solid #e2e8f0' }}>Assesment - Value Behaviour</td><td style={{ ...tdStyle, textAlign: 'center' }}>{avgBehav.toFixed(2)}%</td></tr>
              <tr style={{ backgroundColor: '#e0e7ff' }}><td colSpan={2} style={{ ...tdStyle, textAlign: 'right', fontWeight: 'bold', borderRight: '1px solid #cbd5e1' }}>TOTAL SCORE</td><td style={{ ...tdStyle, textAlign: 'center', fontWeight: 'bold', color: '#1e3a8a', fontSize: '9px' }}>{totalScore.toFixed(2)}%</td></tr>
            </tbody>
          </table>

          <h3 style={{ fontSize: '8px', color: '#1e3a8a', fontWeight: 'bold', margin: '8px 0 3px 0' }}>Matriks Rekomendasi Kelulusan</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e2e8f0', marginBottom: '6px' }}>
            <thead style={{ backgroundColor: '#f8fafc' }}>
              <tr>
                <th style={{ ...thStyle, width: '20%', borderRight: '1px solid #e2e8f0' }}>Score</th>
                <th style={{ ...thStyle, width: '30%', borderRight: '1px solid #e2e8f0' }}>Kategori</th>
                <th style={{ ...thStyle, width: '30%', borderRight: '1px solid #e2e8f0' }}>Result</th>
                <th style={{ ...thStyle, width: '20%', textAlign: 'center' }}>Readyness</th>
              </tr>
            </thead>
            <tbody>
              {[
                { r: '<50%', m: 'Unacceptable', s: 'Not Recommended', c: 'Failed' },
                { r: '≥50% - <70%', m: 'Below Expectation', s: 'Not Recommended', c: 'NR' },
                { r: '≥70% - <80%', m: 'Fully Successful', s: 'Recommended', c: 'R2' },
                { r: '≥80% - <90%', m: 'Above Expectation', s: 'Recommended', c: 'R1' },
                { r: '≥90%', m: 'Outstanding', s: 'Recommended', c: 'R0' },
              ].map((row, idx) => {
                const isMatch = finalStatus.remarks === row.m;
                return (
                  <tr key={idx} style={{ backgroundColor: isMatch ? '#93c5fd' : 'transparent', borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '2px 8px', fontSize: '7.5px', borderRight: '1px solid #e2e8f0', width: '20%' }}>{row.r}</td>
                    <td style={{ padding: '2px 8px', fontSize: '7.5px', borderRight: '1px solid #e2e8f0', width: '30%' }}>{row.m}</td>
                    <td style={{ padding: '2px 8px', fontSize: '7.5px', borderRight: '1px solid #e2e8f0', width: '30%' }}>{row.s}</td>
                    <td style={{ padding: '2px 8px', fontSize: '7.5px', textAlign: 'center', width: '20%' }}>{row.c}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{ 
              flex: 1, minHeight: '40px', border: '1px solid #cbd5e1', borderRadius: '4px', 
              padding: '6px 8px', backgroundColor: '#ffffff', fontSize: '7.5px', color: '#334155', 
              lineHeight: '1.4', textAlign: 'justify', overflow: 'hidden', wordBreak: 'break-all', overflowWrap: 'break-word'
          }}>
            <p style={{ whiteSpace: 'pre-wrap', margin: 0, wordBreak: 'break-all' }}>
              {mainAssessor.notes || <span style={{ fontStyle: 'italic', color: '#94a3b8' }}>Tidak ada catatan kesimpulan.</span>}
            </p>
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '6px' }}>
              <div style={{ border: '1px solid #93c5fd', borderRadius: '6px', padding: '6px 10px', width: '220px', backgroundColor: '#eff6ff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                  <span style={{ fontSize: '7px', fontWeight: 'bold', color: '#475569' }}>HASIL EVALUASI AKHIR</span>
                  <span style={{ fontSize: '7px', fontWeight: 'bold', color: '#2563eb', border: '1px solid #93c5fd', padding: '1px 5px', borderRadius: '10px', backgroundColor: '#ffffff' }}>
                    {finalStatus.status}
                  </span>
                </div>
                <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '900', color: '#1e3a8a' }}>{finalStatus.remarks}</h2>
              </div>
              <div style={{ textAlign: 'right', paddingBottom: '2px' }}>
                <p style={{ fontSize: '7.5px', margin: '0 0 30px 0', color: '#64748b' }}>Authorized Assessor,</p>
                <p style={{ fontSize: '9px', fontWeight: 'bold', margin: 0, textDecoration: 'underline' }}>{mainAssessor.name !== '-' ? mainAssessor.name : ''}</p>
                <p style={{ fontSize: '7px', color: '#64748b', margin: '2px 0 0 0' }}>{mainAssessor.role !== '-' ? mainAssessor.role : ''}</p>
              </div>
            </div>
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '4px', display: 'flex', justifyContent: 'space-between', fontSize: '6px', color: '#94a3b8' }}>
              <div>
                <p style={{ margin: '0 0 2px 0' }}>Sistem HR Terintegrasi</p>
                <p style={{ margin: 0 }}>ID Dokumen: DOC-{displayId.slice(0,8).toUpperCase()} | Dicetak: {printDate}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: '0 0 2px 0', fontWeight: 'bold' }}>{mainAssessor.name !== '-' ? mainAssessor.name : ''}</p>
                <p style={{ margin: 0 }}>HR</p>
              </div>
            </div>
          </div>
        </div>

        {/* ==================== HALAMAN 2 (PSIKOTES) ==================== */}
        <div style={safePageStyle}>
          <DocHeader />
          <h2 style={{ fontSize: '10px', fontWeight: 'bold', textAlign: 'center', margin: '8px 0', color: '#1e3a8a' }}>Psychological Assessment Report</h2>

          {/* Grid CFIT dan Kraepelin */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <div style={{ flex: '1', border: '1px solid #e2e8f0', borderTop: '3px solid #3b82f6', borderRadius: '4px', padding: '6px', backgroundColor: '#ffffff' }}>
              <h3 style={{ fontSize: '8px', color: '#1e40af', borderBottom: '1px solid #e2e8f0', paddingBottom: '3px', margin: '0 0 4px 0', fontWeight: 'bold' }}>1. Kecerdasan Kognitif (CFIT)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px', textAlign: 'center' }}>
                  <div><p style={{ fontSize: '6.5px', color: '#64748b', margin: 0, fontWeight: 'bold', textTransform: 'uppercase' }}>Skor IQ</p><p style={{ fontSize: '12px', fontWeight: '900', margin: '2px 0 0 0', color: '#1e40af' }}>{cfit.iq || '-'}</p></div>
                  <div><p style={{ fontSize: '6.5px', color: '#64748b', margin: 0, fontWeight: 'bold', textTransform: 'uppercase' }}>Klasifikasi</p><p style={{ fontSize: '9px', fontWeight: 'bold', margin: '2px 0 0 0' }}>{cfit.classification || '-'}</p></div>
                  <div><p style={{ fontSize: '6.5px', color: '#64748b', margin: 0, fontWeight: 'bold', textTransform: 'uppercase' }}>Benar</p><p style={{ fontSize: '12px', fontWeight: 'bold', margin: '2px 0 0 0' }}>{cfit.raw_score ?? '-'}</p></div>
              </div>
            </div>
            
            {/* KRAEPELIN (Dengan Auto-Healing Variables & Label English) */}
            <div style={{ flex: '1', border: '1px solid #e2e8f0', borderTop: '3px solid #10b981', borderRadius: '4px', padding: '6px', backgroundColor: '#ffffff' }}>
              <h3 style={{ fontSize: '8px', color: '#065f46', borderBottom: '1px solid #e2e8f0', paddingBottom: '3px', margin: '0 0 4px 0', fontWeight: 'bold' }}>2. Performa Kerja (Kraepelin)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px', textAlign: 'center' }}>
                  
                  {/* CEPAT */}
                  <div style={{ backgroundColor: '#fcf8ea', padding: '4px', borderRadius: '4px' }}>
                    <p style={{ fontSize: '6.5px', color: '#b45309', margin: 0, fontWeight: 'bold', textTransform: 'uppercase' }}>Cepat</p>
                    <p style={{ fontSize: '12px', fontWeight: '900', margin: '2px 0 0 0', color: '#78350f' }}>{displayPanker}</p>
                    <span style={getBadgeStyle(labelCepat, '#b45309', '#fef3c7')}>{labelCepat}</span>
                  </div>

                  {/* TELITI */}
                  <div style={{ backgroundColor: '#fef2f2', padding: '4px', borderRadius: '4px' }}>
                    <p style={{ fontSize: '6.5px', color: '#ef4444', margin: 0, fontWeight: 'bold', textTransform: 'uppercase' }}>Teliti</p>
                    <p style={{ fontSize: '12px', fontWeight: '900', margin: '2px 0 0 0', color: '#b91c1c' }}>{displayErrors}</p>
                    <span style={getBadgeStyle(labelTeliti, '#ef4444', '#fee2e2')}>{labelTeliti}</span>
                  </div>

                  {/* TAHAN */}
                  <div style={{ backgroundColor: '#faf5ff', padding: '4px', borderRadius: '4px' }}>
                    <p style={{ fontSize: '6.5px', color: '#9333ea', margin: 0, fontWeight: 'bold', textTransform: 'uppercase' }}>Tahan</p>
                    <p style={{ fontSize: '12px', fontWeight: '900', margin: '2px 0 0 0', color: '#5b21b6' }}>{displayHanker}</p>
                    <span style={getBadgeStyle(labelTahan, '#7e22ce', '#f3e8ff')}>{labelTahan}</span>
                  </div>

              </div>
            </div>
          </div>

          {/* Grid PAPI Kostick */}
          <div style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '4px', padding: '6px', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', overflow: 'hidden' }}>
            <h3 style={{ fontSize: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '3px', marginBottom: '4px', fontWeight: 'bold', color: '#5b21b6' }}>3. Profil Kepribadian & Gaya Kerja (PAPI Kostick)</h3>
            
            {/* Tambahan flex: 1 dan gridAutoRows: '1fr' agar baris otomatis membagi rata sisa tinggi div */}
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: '12px', gridAutoRows: '1fr' }}>
              {allPapi.length > 0 ? allPapi.map((p, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', borderBottom: '1px dashed #cbd5e1', padding: '2px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '7.5px', fontWeight: 'bold' }}>
                    <span style={{ fontSize: '12px', color : '#3a1577' }}>[{p.letter}] {p.traitName}</span>
                    <span style={{ backgroundColor: '#f1f5f9', padding: '0 4px', borderRadius: '3px', fontSize: '12px', color : '#5b21b6'}}>{p.score}</span>
                  </div>
                  <p style={{ fontSize: '10px', margin: 0, fontStyle: 'italic', lineHeight: '1.1', color: '#475569' }}>"{p.desc}"</p>
                </div>
              )) : (
                <p style={{ fontSize: '7.5px', color: '#64748b', textAlign: 'center', alignSelf: 'center', gridColumn: 'span 2', padding: '20px' }}>
                  Data PAPI Kostick tidak tersedia.
                </p>
              )}
            </div>
          </div>

          {/* FOOTER HALAMAN 2 */}
          <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '4px', display: 'flex', justifyContent: 'space-between', fontSize: '6px', color: '#94a3b8' }}>
              <div>
                <p style={{ margin: '0 0 2px 0' }}>Sistem HR Terintegrasi</p>
                <p style={{ margin: 0 }}>ID Dokumen: DOC-{displayId.slice(0,8).toUpperCase()} | Dicetak: {printDate}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: '0 0 2px 0', fontWeight: 'bold' }}>{mainAssessor.name !== '-' ? mainAssessor.name : ''}</p>
                <p style={{ margin: 0 }}>{mainAssessor.role !== '-' ? mainAssessor.role : ''}</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}