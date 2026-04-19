'use client';

import React from 'react';
import { getPapiInterpretation, getPapiTraitName, extractPapiLetter } from '@/utils/papiScoring';

// 1. UPDATE INTERFACE
interface ReportProps {
  candidateId?: string;
  employeeId?: string; 
  candidateName: string;
  candidateNik?: string;
  jobPosition?: string;
  evaluations: any[]; 
  submissions: any[]; 
  onClose?: () => void; 
}

// FUNGSI TRANSLASI READINESS
const getReadinessLabel = (code: string) => {
  switch (code) {
    case 'NR': return 'Belum Siap Kerja';
    case 'R0': return 'Siap Kerja + Penyesuaian Pekerjaan';
    case 'R1': return 'Siap Kerja + Penyesuaian Pekerjaan + Sedikit pengembangan';
    case 'R2': return 'Siap Kerja + Penyesuaian Pekerjaan + Banyak Pengembangan';
    default: return '';
  }
};

export default function CandidateFinalReport({ 
  candidateId,
  employeeId,
  candidateName, 
  candidateNik = "-", 
  jobPosition = "-", 
  evaluations = [], 
  submissions = [],
  onClose
}: ReportProps) {
  
  const displayId = employeeId || candidateId || candidateNik;

  // =====================================
  // 1. PULL DATA INTERVIEW & READINESS
  // =====================================
  const processedEvals = evaluations.map((e: any) => {
      const compScores = e.scores?.filter((s: any) => s.category === 'COMPETENCY') || [];
      const behavScores = e.scores?.filter((s: any) => s.category === 'BEHAVIOR') || [];
      
      const compTotal = compScores.reduce((acc: number, curr: any) => acc + curr.score, 0);
      const behavTotal = behavScores.reduce((acc: number, curr: any) => acc + curr.score, 0);
      
      // EKSTRAK READINESS & KESIMPULAN DARI CATATAN
      const rawNotes = e.overall_notes || '';
      const match = rawNotes.match(/\[Readyness:\s(.*?)\]\n\nCatatan:\n([\s\S]*)/);
      const readinessCode = match ? match[1] : null;
      const cleanNotes = match ? match[2].trim() : rawNotes.trim();

      return {
          role: e.role_type || 'Assessor',
          name: e.evaluator_name || '-',
          compScore: Math.round((compTotal / 75) * 100) || 0, // Disesuaikan max skor dari Excel
          behavScore: Math.round((behavTotal / 70) * 100) || 0, // Disesuaikan max skor dari Excel
          readiness: readinessCode,
          notes: cleanNotes
      };
  });

  const avgComp = processedEvals.length > 0 
      ? processedEvals.reduce((acc, curr) => acc + curr.compScore, 0) / processedEvals.length 
      : 0;

  const avgBehav = processedEvals.length > 0 
      ? processedEvals.reduce((acc, curr) => acc + curr.behavScore, 0) / processedEvals.length 
      : 0;

  const totalScore = processedEvals.length > 0 ? (avgComp + avgBehav) / 2 : 0;
  
  // Dapatkan Assesor utama
  const mainAssessor = processedEvals.find(e => e.role === 'HR') || processedEvals[0] || { name: '-', role: '-', notes: '' };
  
  // Ambil Readiness
  const finalReadinessCode = processedEvals.find(e => e.readiness)?.readiness || null;

  // URUTAN DIBALIK: Skor Tinggi = R0
  const getRecommendation = (score: number) => {
    if (processedEvals.length === 0) return { cat: '-', remarks: 'Belum Dinilai', status: '-', readyness: '-', rowColor: '#ffffff' };
    if (score < 50) return { cat: '<50%', remarks: 'Unacceptable', status: 'Not Recommended', readyness: 'Failed', rowColor: '#ffffff' };
    if (score < 70) return { cat: '≥50% - <70%', remarks: 'Below Expectation', status: 'Not Recommended', readyness: 'NR', rowColor: '#ffffff' };
    if (score < 80) return { cat: '≥70% - <80%', remarks: 'Fully Successful', status: 'Recommended', readyness: 'R2', rowColor: '#a5b4fc' }; // Indigo-300 highlight seperti gambar
    if (score < 90) return { cat: '≥80% - <90%', remarks: 'Above Expectation', status: 'Recommended', readyness: 'R1', rowColor: '#ffffff' };
    return { cat: '≥90%', remarks: 'Outstanding', status: 'Recommended', readyness: 'R0', rowColor: '#ffffff' };
  };
  const finalStatus = getRecommendation(totalScore);

  // =====================================
  // 2. PENGAMBILAN DATA PSIKOTES
  // =====================================
  const cfitSub = submissions.find(s => s.test_type === 'cfit');
  const kraepelinSub = submissions.find(s => s.test_type === 'kraepelin');
  const papiSub = submissions.find(s => s.test_type === 'papi');
  
  const cfit = cfitSub?.scores || {};
  const kraepelin = kraepelinSub?.scores || {};
  const papi = papiSub?.scores || {};

  const iqScore = cfit.iq || '-';
  const cfitClass = cfit.classification || '-';
  const cfitRaw = cfit.raw_score ?? '-';

  const kraepelinPanker = kraepelin.panker || kraepelin.kecepatan || '-';
  const kraepelinJanker = kraepelin.janker || kraepelin.ketelitian || '-';
  const totalErrors = kraepelin.totalErrors ?? "-";

  const getAllPapi = () => {
    if (!papi || Object.keys(papi).length === 0) return [];
    return Object.entries(papi)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .map(([trait, score]) => {
          const numericScore = Number(score);
          const letter = extractPapiLetter(trait);
          return { 
              letter: letter,
              score: numericScore, 
              traitName: getPapiTraitName(trait),
              desc: getPapiInterpretation(trait, numericScore) 
          };
      });
  };

  const allPapi = getAllPapi();
  const printDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  // ================= REUSABLE COMPONENTS KORPORAT =================
  // HEADER MENGGUNAKAN SUMBER LOGO GAMBAR LAMA
  const DocumentHeader = () => (
    <div style={{ textAlign: 'center', marginBottom: '15px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
        <img src="/images/logos/MBMlogo.png" alt="Logo MBM" style={{ height: '35px', objectFit: 'contain' }} />
        <div style={{ height: '20px', width: '2px', backgroundColor: '#cbd5e1' }}></div>
        <img src="/images/logos/ptLogoText.png" alt="Logo Partner" style={{ height: '30px', objectFit: 'contain' }} />
      </div>
      
      <h1 style={{ fontSize: '14px', color: '#1e3a8a', margin: '15px 0 2px 0', letterSpacing: '0.5px', fontWeight: '900', textTransform: 'uppercase' }}>FINAL EVALUATION REPORT</h1>
      <p style={{ fontSize: '8px', color: '#64748b', margin: 0 }}>Rekapitulasi Hasil Evaluasi Wawancara & Value Behavior</p>
      
      {/* Garis Biru Tebal Pemisah Header */}
      <div style={{ width: '100%', height: '2px', backgroundColor: '#1e3a8a', marginTop: '10px' }}></div>
    </div>
  );

  const SectionTitle = ({ title, color = '#1e3a8a' }: { title: string, color?: string }) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', marginTop: '15px' }}>
          <div style={{ width: '4px', height: '14px', backgroundColor: color }}></div>
          <h2 style={{ fontSize: '10px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>{title}</h2>
      </div>
  );

  // ================= STYLE HALAMAN =================
  const safePageStyle: React.CSSProperties = {
    width: '210mm', height: '297mm', padding: '12mm', backgroundColor: '#fff', boxSizing: 'border-box', overflow: 'hidden', display: 'flex', flexDirection: 'column', margin: '0 auto', 
    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'
  };

  return (
    <div style={{ backgroundColor: '#e5e7eb', padding: '24px 0', display: 'flex', justifyContent: 'center', width: '100%', minHeight: '100vh' }}>
        <div id="pdf-content" style={{ display: 'block', backgroundColor: '#fff' }}>
            
            {/* HALAMAN 1 */}
            <div style={safePageStyle}>
                <DocumentHeader />
                
                {/* IDENTITAS ASSESI */}
                <SectionTitle title="Identitas Assesi" />
                <table style={{ width: '100%', fontSize: '9px', borderCollapse: 'collapse', border: '1px solid #e2e8f0', marginBottom: '5px' }}>
                    <tbody>
                        <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                            <td style={{ width: '30%', padding: '6px 10px', fontWeight: 'bold', color: '#334155' }}>
                                {employeeId ? "Nomor Karyawan" : "NIK KTP"}
                            </td>
                            <td style={{ padding: '6px 10px', fontWeight: 'bold', color: '#1e3a8a' }}>{candidateNik}</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '6px 10px', fontWeight: 'bold', color: '#334155' }}>Nama Assesi</td>
                            <td style={{ padding: '6px 10px', color: '#0f172a' }}>{candidateName}</td>
                        </tr>
                        <tr style={{ backgroundColor: '#f8fafc' }}>
                            <td style={{ padding: '6px 10px', fontWeight: 'bold', color: '#334155' }}>Posisi Assesi</td>
                            <td style={{ padding: '6px 10px', color: '#0f172a' }}>{jobPosition}</td>
                        </tr>
                    </tbody>
                </table>

                {/* READINESS JIKA KARYAWAN INTERNAL (Opsional - Tampil di bawah Nama) */}
                {employeeId && finalReadinessCode && (
                    <div style={{ backgroundColor: '#f0fdf4', padding: '4px 10px', border: '1px solid #e2e8f0', borderTop: 'none', fontSize: '8px', color: '#166534', fontWeight: 'bold' }}>
                        Rekomendasi Kesiapan Karyawan: {finalReadinessCode} - {getReadinessLabel(finalReadinessCode)}
                    </div>
                )}

                {/* INTERVIEW KOMPETENSI */}
                <SectionTitle title="Interview (Kompetensi)" color="#f59e0b" />
                <table style={{ width: '100%', fontSize: '9px', borderCollapse: 'collapse' }}>
                    <thead style={{ borderBottom: '1px solid #cbd5e1' }}>
                        <tr>
                            <th style={{ padding: '6px 0', textAlign: 'left', color: '#64748b', textTransform: 'uppercase', width: '30%' }}>Assesor</th>
                            <th style={{ padding: '6px 0', textAlign: 'left', color: '#64748b', textTransform: 'uppercase' }}>Nama Assesor</th>
                            <th style={{ padding: '6px 0', textAlign: 'center', color: '#64748b', textTransform: 'uppercase', width: '20%' }}>Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        {processedEvals.length > 0 ? processedEvals.map((ev, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '8px 0', color: '#0f172a' }}>{ev.role}</td>
                                <td style={{ padding: '8px 0', color: '#0f172a' }}>{ev.name}</td>
                                <td style={{ padding: '8px 0', textAlign: 'center', fontWeight: 'bold', color: '#b45309' }}>{ev.compScore}%</td>
                            </tr>
                        )) : (<tr><td colSpan={3} style={{ padding: '8px 0', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>Belum ada data evaluasi.</td></tr>)}
                    </tbody>
                </table>

                {/* VALUE BEHAVIOUR */}
                <SectionTitle title="Value Behaviour" color="#06b6d4" />
                <table style={{ width: '100%', fontSize: '9px', borderCollapse: 'collapse' }}>
                    <thead style={{ borderBottom: '1px solid #cbd5e1' }}>
                        <tr>
                            <th style={{ padding: '6px 0', textAlign: 'left', color: '#64748b', textTransform: 'uppercase', width: '30%' }}>Assesor</th>
                            <th style={{ padding: '6px 0', textAlign: 'left', color: '#64748b', textTransform: 'uppercase' }}>Nama Assesor</th>
                            <th style={{ padding: '6px 0', textAlign: 'center', color: '#64748b', textTransform: 'uppercase', width: '20%' }}>Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        {processedEvals.length > 0 ? processedEvals.map((ev, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '8px 0', color: '#0f172a' }}>{ev.role}</td>
                                <td style={{ padding: '8px 0', color: '#0f172a' }}>{ev.name}</td>
                                <td style={{ padding: '8px 0', textAlign: 'center', fontWeight: 'bold', color: '#0284c7' }}>{ev.behavScore}%</td>
                            </tr>
                        )) : (<tr><td colSpan={3} style={{ padding: '8px 0', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>Belum ada data evaluasi.</td></tr>)}
                    </tbody>
                </table>

                {/* SUMMARY */}
                <SectionTitle title="Summary" />
                <table style={{ width: '100%', fontSize: '9px', borderCollapse: 'collapse', border: '1px solid #e2e8f0' }}>
                    <thead style={{ borderBottom: '1px solid #cbd5e1', backgroundColor: '#f8fafc' }}>
                        <tr>
                            <th style={{ padding: '8px', textAlign: 'center', color: '#64748b', textTransform: 'uppercase', width: '10%', borderRight: '1px solid #e2e8f0' }}>NO</th>
                            <th style={{ padding: '8px', textAlign: 'left', color: '#64748b', textTransform: 'uppercase', borderRight: '1px solid #e2e8f0' }}>Jenis Assesment</th>
                            <th style={{ padding: '8px', textAlign: 'center', color: '#64748b', textTransform: 'uppercase', width: '20%' }}>Rata-Rata Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '8px', textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>1</td>
                            <td style={{ padding: '8px', borderRight: '1px solid #e2e8f0' }}>Assesment - Presentasi (Kompetensi)</td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>{avgComp.toFixed(2)}%</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '8px', textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>2</td>
                            <td style={{ padding: '8px', borderRight: '1px solid #e2e8f0' }}>Assesment - Value Behaviour</td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>{avgBehav.toFixed(2)}%</td>
                        </tr>
                        <tr style={{ backgroundColor: '#e0e7ff', fontWeight: 'bold' }}>
                            <td colSpan={2} style={{ padding: '8px', textAlign: 'right', color: '#0f172a', borderRight: '1px solid #cbd5e1' }}>TOTAL SCORE</td>
                            <td style={{ padding: '8px', textAlign: 'center', color: '#1e3a8a', fontSize: '10px' }}>{totalScore.toFixed(2)}%</td>
                        </tr>
                    </tbody>
                </table>

                {/* MATRIKS REKOMENDASI KELULUSAN */}
                <h3 style={{ fontSize: '10px', color: '#1e3a8a', fontWeight: 'bold', margin: '20px 0 8px 0' }}>Matriks Rekomendasi Kelulusan</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8px', border: '1px solid #e2e8f0' }}>
                    <tbody>
                    {[
                        { score: '<50%', remarks: 'Unacceptable', status: 'Not Recommended', ready: 'Failed' },
                        { score: '≥50% - <70%', remarks: 'Below Expectation', status: 'Not Recommended', ready: 'NR' },
                        { score: '≥70% - <80%', remarks: 'Fully Successful', status: 'Recommended', ready: 'R2' },
                        { score: '≥80% - <90%', remarks: 'Above Expectation', status: 'Recommended', ready: 'R1' },
                        { score: '≥90%', remarks: 'Outstanding', status: 'Recommended', ready: 'R0' }
                    ].map((row, idx) => {
                        // Cek apakah baris ini adalah baris hasil akhir (Highlight Biru seperti gambar)
                        const isMatch = finalStatus.remarks === row.remarks;
                        const rowStyle = isMatch ? { backgroundColor: '#93c5fd', fontWeight: 'bold', color: '#0f172a' } : {};

                        return (
                        <tr key={idx} style={{ ...rowStyle, borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ borderRight: '1px solid #e2e8f0', padding: '6px 10px', width: '20%' }}>{row.score}</td>
                            <td style={{ borderRight: '1px solid #e2e8f0', padding: '6px 10px', width: '30%' }}>{row.remarks}</td>
                            <td style={{ borderRight: '1px solid #e2e8f0', padding: '6px 10px', width: '30%' }}>{row.status}</td>
                            <td style={{ padding: '6px 10px', textAlign: 'center', width: '20%' }}>{row.ready}</td>
                        </tr>
                        );
                    })}
                    </tbody>
                </table>

                {/* CATATAN KESIMPULAN ASSESOR (Di dalam kotak abu-abu seperti gambar) */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '12px', marginTop: '15px', fontSize: '8px', color: '#334155', lineHeight: '1.6', minHeight: '80px', whiteSpace: 'pre-wrap' }}>
                    {mainAssessor.notes || <span style={{ fontStyle: 'italic', color: '#94a3b8' }}>Tidak ada catatan kesimpulan dari assesor.</span>}
                </div>

                {/* KOTAK HASIL AKHIR & TTD (Sesuai Gambar) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '20px' }}>
                    
                    {/* KOTAK KIRI (Hasil) */}
                    <div style={{ border: '2px solid #93c5fd', borderRadius: '8px', padding: '15px 20px', width: '250px', backgroundColor: '#f0f9ff' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#475569', textTransform: 'uppercase' }}>HASIL EVALUASI AKHIR</span>
                            <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#2563eb', border: '1px solid #93c5fd', padding: '2px 8px', borderRadius: '12px', textTransform: 'uppercase', backgroundColor: '#fff' }}>
                                {finalStatus.status}
                            </span>
                        </div>
                        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#1e3a8a' }}>
                            {finalStatus.remarks}
                        </h2>
                    </div>

                    {/* KOTAK KANAN (TTD) */}
                    <div style={{ textAlign: 'right', marginBottom: '10px' }}>
                        <p style={{ fontSize: '9px', margin: '0 0 35px 0', color: '#64748b' }}>Authorized Assessor,</p>
                        <p style={{ fontSize: '11px', fontWeight: 'bold', margin: 0, textDecoration: 'underline', color: '#0f172a' }}>{mainAssessor.name}</p>
                        <p style={{ fontSize: '8px', color: '#64748b', margin: '2px 0 0 0' }}>{mainAssessor.role}</p>
                    </div>
                </div>

                {/* FOOTER PAGE */}
                <div style={{ marginTop: 'auto', paddingTop: '15px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '7px', color: '#94a3b8' }}>
                        <p style={{ margin: '0 0 2px 0' }}>Sistem HR Terintegrasi</p>
                        <p style={{ margin: 0 }}>ID Dokumen: DOC-{displayId?.slice(0,8) || "UNDEF"} | Dicetak: {printDate}</p>
                    </div>
                    <div style={{ fontSize: '7px', color: '#94a3b8', textAlign: 'right', fontWeight: 'bold' }}>
                        <p style={{ margin: '0 0 2px 0' }}>{mainAssessor.name}</p>
                        <p style={{ margin: 0 }}>HR</p>
                    </div>
                </div>

            </div>

            <div className="html2pdf__page-break" style={{ height: '0px', width: '100%', margin: 0, padding: 0, border: 'none', pageBreakAfter: 'always' }}></div>

            {/* HALAMAN 2: TES PSIKOLOGI */}
            <div style={safePageStyle}>
                <DocumentHeader />

                {/* ... (Konten Halaman 2 Psikotes Tetap Sama) ... */}
                <div style={{ flex: 1 }}>
                  <SectionTitle title="Psychological Assessment Report" color="#3b82f6" />
                  
                  <div style={{ display: 'flex', gap: '15px', marginBottom: '15px', marginTop: '10px' }}>
                    {/* CFIT */}
                    <div style={{ flex: '1', backgroundColor: '#fff', padding: '12px', border: '1px solid #e2e8f0', borderTop: '3px solid #3b82f6', borderRadius: '4px' }}>
                      <h3 style={{ marginTop: 0, fontSize: '11px', color: '#1e40af', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '10px', fontWeight: 'bold' }}>1. Kecerdasan Kognitif (CFIT)</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                        <div style={{ backgroundColor: '#f8fafc', padding: '8px', borderRadius: '4px', textAlign: 'center', border: '1px solid #f1f5f9' }}>
                          <p style={{ fontSize: '8px', color: '#64748b', margin: 0, fontWeight: 'bold' }}>Skor IQ</p>
                          <p style={{ fontSize: '16px', fontWeight: '900', margin: '4px 0 0 0', color: '#1e40af' }}>{iqScore}</p>
                        </div>
                        <div style={{ backgroundColor: '#f8fafc', padding: '8px', borderRadius: '4px', textAlign: 'center', border: '1px solid #f1f5f9' }}>
                          <p style={{ fontSize: '8px', color: '#64748b', margin: 0, fontWeight: 'bold' }}>Klasifikasi</p>
                          <p style={{ fontSize: '11px', fontWeight: 'bold', margin: '4px 0 0 0', color: '#0f172a' }}>{cfitClass}</p>
                        </div>
                        <div style={{ backgroundColor: '#f8fafc', padding: '8px', borderRadius: '4px', textAlign: 'center', border: '1px solid #f1f5f9' }}>
                          <p style={{ fontSize: '8px', color: '#64748b', margin: 0, fontWeight: 'bold' }}>Jwb Benar</p>
                          <p style={{ fontSize: '16px', fontWeight: 'bold', margin: '4px 0 0 0', color: '#0f172a' }}>{cfitRaw}</p>
                        </div>
                      </div>
                    </div>

                    {/* KRAEPELIN */}
                    <div style={{ flex: '1', backgroundColor: '#fff', padding: '12px', border: '1px solid #e2e8f0', borderTop: '3px solid #10b981', borderRadius: '4px' }}>
                      <h3 style={{ marginTop: 0, fontSize: '11px', color: '#065f46', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '10px', fontWeight: 'bold' }}>2. Performa Kerja (Kraepelin)</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                        <div style={{ backgroundColor: '#fcf8ea', padding: '8px', borderRadius: '4px', textAlign: 'center', border: '1px solid #fef3c7' }}>
                          <p style={{ fontSize: '8px', color: '#b45309', margin: 0, fontWeight: 'bold' }}>Kecepatan</p>
                          <p style={{ fontSize: '16px', fontWeight: 'bold', margin: '4px 0 0 0', color: '#78350f' }}>{kraepelinPanker}</p>
                        </div>
                        <div style={{ backgroundColor: '#f0fdf4', padding: '8px', borderRadius: '4px', textAlign: 'center', border: '1px solid #dcfce7' }}>
                          <p style={{ fontSize: '8px', color: '#15803d', margin: 0, fontWeight: 'bold' }}>Ketelitian</p>
                          <p style={{ fontSize: '16px', fontWeight: 'bold', margin: '4px 0 0 0', color: '#14532d' }}>{kraepelinJanker}</p>
                        </div>
                        <div style={{ backgroundColor: '#fef2f2', padding: '8px', borderRadius: '4px', textAlign: 'center', border: '1px solid #fee2e2' }}>
                          <p style={{ fontSize: '8px', color: '#ef4444', margin: 0, fontWeight: 'bold' }}>Total Errors</p>
                          <p style={{ fontSize: '16px', fontWeight: '900', margin: '4px 0 0 0', color: '#b91c1c' }}>{totalErrors}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* PAPI KOSTICK */}
                  <div style={{ backgroundColor: '#fff', padding: '15px', border: '1px solid #e2e8f0', borderTop: '3px solid #8b5cf6', borderRadius: '4px' }}>
                    <h3 style={{ marginTop: 0, fontSize: '11px', color: '#5b21b6', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '12px', fontWeight: 'bold' }}>3. Profil Kepribadian & Gaya Kerja (PAPI Kostick)</h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', columnGap: '25px', rowGap: '8px' }}>
                      {allPapi.length > 0 ? allPapi.map((p, i) => (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', borderBottom: '1px dashed #cbd5e1', paddingBottom: '6px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                             <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#334155', lineHeight: '1.2' }}>
                               <span style={{ color: '#4c1d95', marginRight: '5px' }}>[{p.letter}]</span> 
                               {p.traitName}
                             </div>
                             <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#0f172a', backgroundColor: '#ede9fe', padding: '2px 6px', borderRadius: '4px' }}>
                               {String(p.score)}
                             </div>
                          </div>
                          <div style={{ fontSize: '9px', color: '#475569', fontStyle: 'italic', lineHeight: '1.3' }}>
                            Interpretasi: "{p.desc}"
                          </div>
                        </div>
                      )) : (
                        <p style={{ fontSize: '10px', color: '#64748b', gridColumn: 'span 2', textAlign: 'center', padding: '20px 0' }}>Data PAPI Kostick belum tersedia untuk peserta ini.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* FOOTER PAGE 2 */}
                <div style={{ marginTop: 'auto', paddingTop: '15px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '7px', color: '#94a3b8' }}>
                        <p style={{ margin: '0 0 2px 0' }}>Sistem HR Terintegrasi</p>
                        <p style={{ margin: 0 }}>ID Dokumen: DOC-{displayId?.slice(0,8) || "UNDEF"} | Dicetak: {printDate}</p>
                    </div>
                </div>
            </div>

        </div>
    </div>
  );
}