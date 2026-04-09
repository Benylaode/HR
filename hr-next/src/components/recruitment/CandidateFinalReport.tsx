'use client';

import React from 'react';
import { getPapiInterpretation, getPapiTraitName, extractPapiLetter } from '@/utils/papiScoring';

interface ReportProps {
  candidateName: string;
  candidateNik?: string;
  jobPosition?: string;
  evaluations: any[]; 
  submissions: any[]; 
}

export default function CandidateFinalReport({ 
  candidateName, 
  candidateNik = "-", 
  jobPosition = "-", 
  evaluations = [], 
  submissions = [] 
}: ReportProps) {
  
  // =====================================
  // 1. PULL DATA INTERVIEW (MULTIPLE ASSESSOR)
  // =====================================
  const processedEvals = evaluations.map((e: any) => {
      const compScores = e.scores?.filter((s: any) => s.category === 'COMPETENCY') || [];
      const behavScores = e.scores?.filter((s: any) => s.category === 'BEHAVIOR') || [];
      
      const compTotal = compScores.reduce((acc: number, curr: any) => acc + curr.score, 0);
      const behavTotal = behavScores.reduce((acc: number, curr: any) => acc + curr.score, 0);
      
      return {
          role: e.role_type || 'Assessor',
          name: e.evaluator_name || '-',
          compScore: Math.round((compTotal / 80) * 100) || 0,
          behavScore: Math.round((behavTotal / 75) * 100) || 0,
      };
  });

  const avgComp = processedEvals.length > 0 
      ? processedEvals.reduce((acc, curr) => acc + curr.compScore, 0) / processedEvals.length 
      : 0;

  const avgBehav = processedEvals.length > 0 
      ? processedEvals.reduce((acc, curr) => acc + curr.behavScore, 0) / processedEvals.length 
      : 0;

  const totalScore = processedEvals.length > 0 ? (avgComp + avgBehav) / 2 : 0;
  const mainAssessor = processedEvals.find(e => e.role === 'HR') || processedEvals[0] || { name: '-', role: '-' };

  const getRecommendation = (score: number) => {
    if (processedEvals.length === 0) return { cat: '-', remarks: 'Belum Dinilai', status: '-', readyness: '-' };
    if (score < 50) return { cat: '<50%', remarks: 'Unacceptable', status: 'Not Recommended', readyness: '-' };
    if (score < 70) return { cat: '≥50% - <70%', remarks: 'Below Expectation', status: 'Considered', readyness: 'R3' };
    if (score < 80) return { cat: '≥70% - <80%', remarks: 'Fully Successful', status: 'Recommended', readyness: 'R1' };
    if (score < 90) return { cat: '≥80% - <90%', remarks: 'Above Expectation', status: 'Highly Recommended', readyness: 'R1' };
    return { cat: '≥90%', remarks: 'Outstanding', status: 'Highly Recommended', readyness: 'R1' };
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

  // Standardisasi Variabel Tampilan
  const iqScore = cfit.iq || '-';
  const cfitClass = cfit.classification || '-';
  const cfitRaw = cfit.raw_score ?? '-';

  const kraepelinPanker = kraepelin.panker || kraepelin.kecepatan || '-';
  const kraepelinJanker = kraepelin.janker || kraepelin.ketelitian || '-';
  
  // LOGIKA TOTAL ERROR LANGSUNG MENGAMBIL DARI BACKEND
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

  // ================= REUSABLE COMPONENTS =================
  const DocumentHeader = ({ title, subtitle }: { title: string, subtitle: string }) => (
    <div style={{ textAlign: 'center', borderBottom: '2px solid #1e3a8a', paddingBottom: '6px', marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginBottom: '4px' }}>
        <img src="/images/logos/MBMlogo.png" alt="Logo MBM" style={{ height: '35px', objectFit: 'contain' }} />
        <div style={{ height: '20px', width: '2px', backgroundColor: '#cbd5e1' }}></div>
        <img src="/images/logos/ptLogoText.png" alt="Logo Partner" style={{ height: '30px', objectFit: 'contain' }} />
      </div>
      <h1 style={{ fontSize: '14px', color: '#1e3a8a', margin: '0 0 2px 0', letterSpacing: '1px', fontWeight: '900', textTransform: 'uppercase' }}>{title}</h1>
      <p style={{ fontSize: '8px', color: '#64748b', margin: 0 }}>{subtitle}</p>
    </div>
  );

  const ParticipantProfile = () => (
    <div style={{ marginBottom: '10px' }}>
      <h2 style={{ fontSize: '10px', fontWeight: 'bold', color: '#0f172a', marginBottom: '4px', borderLeft: '3px solid #1e3a8a', paddingLeft: '6px' }}>Identitas Assesi</h2>
      <table style={{ width: '100%', fontSize: '9px', borderCollapse: 'collapse', border: '1px solid #cbd5e1' }}>
        <tbody>
            <tr style={{ borderBottom: '1px solid #cbd5e1', backgroundColor: '#f8fafc' }}>
                <td style={{ width: '30%', padding: '4px 8px', fontWeight: 'bold', borderRight: '1px solid #cbd5e1' }}>NIK</td>
                <td style={{ padding: '4px 8px', fontWeight: 'bold', color: '#1e3a8a' }}>{candidateNik}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                <td style={{ width: '30%', padding: '4px 8px', fontWeight: 'bold', borderRight: '1px solid #cbd5e1' }}>Nama Assesi</td>
                <td style={{ padding: '4px 8px' }}>{candidateName}</td>
            </tr>
            <tr style={{ backgroundColor: '#f8fafc' }}>
                <td style={{ width: '30%', padding: '4px 8px', fontWeight: 'bold', borderRight: '1px solid #cbd5e1' }}>Posisi Assesi</td>
                <td style={{ padding: '4px 8px' }}>{jobPosition}</td>
            </tr>
        </tbody>
      </table>
    </div>
  );

  const DocumentFooter = () => (
    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '8px' }}>
      <div>
        <p style={{ fontSize: '8px', color: '#94a3b8', margin: 0, fontWeight: 'bold' }}>Sistem HR Terintegrasi</p>
        <p style={{ fontSize: '8px', color: '#94a3b8', margin: '2px 0 0 0' }}>ID Dokumen: DOC-{candidateNik} | Dicetak: {printDate}</p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '9px', margin: '0 0 25px 0', color: '#64748b' }}>Authorized Assessor,</p>
        <p style={{ fontSize: '11px', fontWeight: 'bold', margin: 0, textDecoration: 'underline', color: '#0f172a' }}>{mainAssessor.name}</p>
        <p style={{ fontSize: '8px', color: '#64748b', margin: '2px 0 0 0' }}>{mainAssessor.role}</p>
      </div>
    </div>
  );

  const safePageStyle: React.CSSProperties = {
    width: '200mm', height: '285mm', padding: '6mm', backgroundColor: '#fff', boxSizing: 'border-box', overflow: 'hidden', display: 'flex', flexDirection: 'column', margin: '0 auto', 
  };
  const innerBorderStyle: React.CSSProperties = {
    border: '2px solid #1e3a8a', flex: 1, padding: '14px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', overflow: 'hidden' 
  };

  return (
    <div style={{ backgroundColor: '#e5e7eb', padding: '24px 0', display: 'flex', justifyContent: 'center', width: '100%', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
        <div id="pdf-content" style={{ display: 'block', backgroundColor: '#fff' }}>
            
            {/* HALAMAN 1 */}
            <div style={safePageStyle}>
                <div style={innerBorderStyle}>
                    <DocumentHeader title="FINAL EVALUATION REPORT" subtitle="Rekapitulasi Hasil Evaluasi Wawancara & Value Behavior" />
                    <ParticipantProfile />
                    
                    <div style={{ marginBottom: '8px' }}>
                        <h2 style={{ fontSize: '10px', fontWeight: 'bold', color: '#0f172a', marginBottom: '4px', borderLeft: '3px solid #f59e0b', paddingLeft: '6px' }}>Interview (Kompetensi)</h2>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px', border: '1px solid #cbd5e1' }}>
                            <thead style={{ backgroundColor: '#f8fafc' }}>
                                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                                    <th style={{ padding: '4px 6px', borderRight: '1px solid #cbd5e1', textAlign: 'left', width: '30%', color: '#475569' }}>Assesor</th>
                                    <th style={{ padding: '4px 6px', borderRight: '1px solid #cbd5e1', textAlign: 'left', color: '#475569' }}>Nama Assesor</th>
                                    <th style={{ padding: '4px 6px', textAlign: 'center', width: '20%', color: '#475569' }}>Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                {processedEvals.length > 0 ? processedEvals.map((ev, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #cbd5e1' }}>
                                        <td style={{ padding: '3px 6px', borderRight: '1px solid #cbd5e1' }}>{ev.role}</td>
                                        <td style={{ padding: '3px 6px', borderRight: '1px solid #cbd5e1' }}>{ev.name}</td>
                                        <td style={{ padding: '3px 6px', textAlign: 'center', fontWeight: 'bold', color: '#b45309' }}>{ev.compScore}%</td>
                                    </tr>
                                )) : (<tr><td colSpan={3} style={{ padding: '4px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>Belum ada data evaluasi.</td></tr>)}
                            </tbody>
                        </table>
                    </div>

                    <div style={{ marginBottom: '8px' }}>
                        <h2 style={{ fontSize: '10px', fontWeight: 'bold', color: '#0f172a', marginBottom: '4px', borderLeft: '3px solid #06b6d4', paddingLeft: '6px' }}>Value Behaviour</h2>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px', border: '1px solid #cbd5e1' }}>
                            <thead style={{ backgroundColor: '#f8fafc' }}>
                                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                                    <th style={{ padding: '4px 6px', borderRight: '1px solid #cbd5e1', textAlign: 'left', width: '30%', color: '#475569' }}>Assesor</th>
                                    <th style={{ padding: '4px 6px', borderRight: '1px solid #cbd5e1', textAlign: 'left', color: '#475569' }}>Nama Assesor</th>
                                    <th style={{ padding: '4px 6px', textAlign: 'center', width: '20%', color: '#475569' }}>Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                {processedEvals.length > 0 ? processedEvals.map((ev, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #cbd5e1' }}>
                                        <td style={{ padding: '3px 6px', borderRight: '1px solid #cbd5e1' }}>{ev.role}</td>
                                        <td style={{ padding: '3px 6px', borderRight: '1px solid #cbd5e1' }}>{ev.name}</td>
                                        <td style={{ padding: '3px 6px', textAlign: 'center', fontWeight: 'bold', color: '#0e7490' }}>{ev.behavScore}%</td>
                                    </tr>
                                )) : (<tr><td colSpan={3} style={{ padding: '4px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>Belum ada data evaluasi.</td></tr>)}
                            </tbody>
                        </table>
                    </div>

                    <div style={{ marginBottom: '8px' }}>
                        <h2 style={{ fontSize: '10px', fontWeight: 'bold', color: '#0f172a', marginBottom: '4px', borderLeft: '3px solid #1e3a8a', paddingLeft: '6px' }}>Summary</h2>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px', border: '1px solid #cbd5e1' }}>
                            <thead style={{ backgroundColor: '#f8fafc' }}>
                                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                                    <th style={{ padding: '4px 6px', borderRight: '1px solid #cbd5e1', textAlign: 'center', width: '10%', color: '#475569' }}>No</th>
                                    <th style={{ padding: '4px 6px', borderRight: '1px solid #cbd5e1', textAlign: 'left', color: '#475569' }}>Jenis Assesment</th>
                                    <th style={{ padding: '4px 6px', textAlign: 'center', width: '20%', color: '#475569' }}>Rata-Rata Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                                    <td style={{ padding: '4px 6px', borderRight: '1px solid #cbd5e1', textAlign: 'center' }}>1</td>
                                    <td style={{ padding: '4px 6px', borderRight: '1px solid #cbd5e1' }}>Assesment - Presentasi (Kompetensi)</td>
                                    <td style={{ padding: '4px 6px', textAlign: 'center', fontWeight: 'bold' }}>{avgComp.toFixed(2)}%</td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                                    <td style={{ padding: '4px 6px', borderRight: '1px solid #cbd5e1', textAlign: 'center' }}>2</td>
                                    <td style={{ padding: '4px 6px', borderRight: '1px solid #cbd5e1' }}>Assesment - Value Behaviour</td>
                                    <td style={{ padding: '4px 6px', textAlign: 'center', fontWeight: 'bold' }}>{avgBehav.toFixed(2)}%</td>
                                </tr>
                                <tr>
                                    <td colSpan={2} style={{ padding: '4px 6px', borderRight: '1px solid #cbd5e1', textAlign: 'right', fontWeight: '900', backgroundColor: '#f8fafc' }}>TOTAL SCORE</td>
                                    <td style={{ padding: '4px 6px', textAlign: 'center', fontWeight: '900', fontSize: '11px', color: '#1e3a8a', backgroundColor: '#e0e7ff' }}>{totalScore.toFixed(2)}%</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <h3 style={{ fontSize: '10px', color: '#1e3a8a', fontWeight: 'bold', marginBottom: '4px' }}>Matriks Rekomendasi Kelulusan</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8px', border: '1px solid #e2e8f0' }}>
                      <thead style={{ backgroundColor: '#f8fafc' }}>
                        <tr>
                          <th style={{ border: '1px solid #cbd5e1', padding: '4px', textAlign: 'center', color: '#475569' }}>Kategori Skor</th>
                          <th style={{ border: '1px solid #cbd5e1', padding: '4px', textAlign: 'center', color: '#475569' }}>Remarks</th>
                          <th style={{ border: '1px solid #cbd5e1', padding: '4px', textAlign: 'center', color: '#475569' }}>Status</th>
                          <th style={{ border: '1px solid #cbd5e1', padding: '4px', textAlign: 'center', color: '#475569' }}>Readyness</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { score: '<50%', remarks: 'Unacceptable', status: 'Not Recommended', ready: '-' },
                          { score: '≥50% - <70%', remarks: 'Below Expectation', status: 'Considered', ready: 'R3' },
                          { score: '≥70% - <80%', remarks: 'Fully Successful', status: 'Recommended', ready: 'R1' },
                          { score: '≥80% - <90%', remarks: 'Above Expectation', status: 'Highly Recommended', ready: 'R1' },
                          { score: '≥90%', remarks: 'Outstanding', status: 'Highly Recommended', ready: 'R1' }
                        ].map((row, idx) => (
                          <tr key={idx} style={{ backgroundColor: finalStatus.remarks === row.remarks ? '#dbeafe' : '#fff', fontWeight: finalStatus.remarks === row.remarks ? 'bold' : 'normal' }}>
                            <td style={{ border: '1px solid #cbd5e1', padding: '3px', textAlign: 'center' }}>{row.score}</td>
                            <td style={{ border: '1px solid #cbd5e1', padding: '3px', textAlign: 'center' }}>{row.remarks}</td>
                            <td style={{ border: '1px solid #cbd5e1', padding: '3px', textAlign: 'center' }}>{row.status}</td>
                            <td style={{ border: '1px solid #cbd5e1', padding: '3px', textAlign: 'center' }}>{row.ready}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <DocumentFooter />
                </div>
            </div>

            <div className="html2pdf__page-break" style={{ height: '0px', width: '100%', margin: 0, padding: 0, border: 'none', pageBreakAfter: 'always' }}></div>

            {/* HALAMAN 2: TES PSIKOLOGI (DIADAPTASI DARI TEST REPORT PDF) */}
            <div style={safePageStyle}>
                <div style={innerBorderStyle}>
                  <DocumentHeader title="PSYCHOLOGICAL ASSESSMENT REPORT" subtitle="Dokumen Resmi Hasil Evaluasi Psikologi Kandidat & Karyawan" />
                  <ParticipantProfile />

                  <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                    <div style={{ flex: '1', backgroundColor: '#fff', padding: '10px', border: '1px solid #e2e8f0', borderTop: '3px solid #3b82f6', borderRadius: '4px' }}>
                      <h3 style={{ marginTop: 0, fontSize: '11px', color: '#1e40af', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '8px', fontWeight: 'bold' }}>1. Kecerdasan Kognitif (CFIT)</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                        <div style={{ backgroundColor: '#f8fafc', padding: '6px', borderRadius: '4px', textAlign: 'center' }}>
                          <p style={{ fontSize: '8px', color: '#64748b', margin: 0, fontWeight: 'bold' }}>Skor IQ</p>
                          <p style={{ fontSize: '14px', fontWeight: '900', margin: '2px 0 0 0', color: '#1e40af' }}>{iqScore}</p>
                        </div>
                        <div style={{ backgroundColor: '#f8fafc', padding: '6px', borderRadius: '4px', textAlign: 'center' }}>
                          <p style={{ fontSize: '8px', color: '#64748b', margin: 0, fontWeight: 'bold' }}>Klasifikasi</p>
                          <p style={{ fontSize: '10px', fontWeight: 'bold', margin: '2px 0 0 0', color: '#0f172a' }}>{cfitClass}</p>
                        </div>
                        <div style={{ backgroundColor: '#f8fafc', padding: '6px', borderRadius: '4px', textAlign: 'center' }}>
                          <p style={{ fontSize: '8px', color: '#64748b', margin: 0, fontWeight: 'bold' }}>Jwb Benar</p>
                          <p style={{ fontSize: '14px', fontWeight: 'bold', margin: '2px 0 0 0', color: '#0f172a' }}>{cfitRaw}</p>
                        </div>
                      </div>
                    </div>

                    <div style={{ flex: '1', backgroundColor: '#fff', padding: '10px', border: '1px solid #e2e8f0', borderTop: '3px solid #10b981', borderRadius: '4px' }}>
                      <h3 style={{ marginTop: 0, fontSize: '11px', color: '#065f46', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '8px', fontWeight: 'bold' }}>2. Performa Kerja (Kraepelin)</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                        <div style={{ backgroundColor: '#fcf8ea', padding: '6px', borderRadius: '4px', textAlign: 'center' }}>
                          <p style={{ fontSize: '8px', color: '#b45309', margin: 0, fontWeight: 'bold' }}>Kecepatan</p>
                          <p style={{ fontSize: '14px', fontWeight: 'bold', margin: '2px 0 0 0', color: '#78350f' }}>{kraepelinPanker}</p>
                        </div>
                        <div style={{ backgroundColor: '#f0fdf4', padding: '6px', borderRadius: '4px', textAlign: 'center' }}>
                          <p style={{ fontSize: '8px', color: '#15803d', margin: 0, fontWeight: 'bold' }}>Ketelitian</p>
                          <p style={{ fontSize: '14px', fontWeight: 'bold', margin: '2px 0 0 0', color: '#14532d' }}>{kraepelinJanker}</p>
                        </div>
                        <div style={{ backgroundColor: '#fef2f2', padding: '6px', borderRadius: '4px', textAlign: 'center' }}>
                          <p style={{ fontSize: '8px', color: '#ef4444', margin: 0, fontWeight: 'bold' }}>Total Errors</p>
                          <p style={{ fontSize: '14px', fontWeight: '900', margin: '2px 0 0 0', color: '#b91c1c' }}>{totalErrors}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#fff', padding: '12px', border: '1px solid #e2e8f0', borderTop: '3px solid #8b5cf6', borderRadius: '4px' }}>
                    <h3 style={{ marginTop: 0, fontSize: '11px', color: '#5b21b6', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '10px', fontWeight: 'bold' }}>3. Profil Kepribadian & Gaya Kerja (PAPI Kostick)</h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', columnGap: '20px', rowGap: '6px' }}>
                      {allPapi.length > 0 ? allPapi.map((p, i) => (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', borderBottom: '1px dashed #cbd5e1', paddingBottom: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2px' }}>
                             <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#334155', lineHeight: '1.2' }}>
                               <span style={{ color: '#4c1d95', marginRight: '4px' }}>[{p.letter}]</span> 
                               {p.traitName}
                             </div>
                             <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#0f172a', backgroundColor: '#ede9fe', padding: '2px 5px', borderRadius: '3px' }}>
                               {String(p.score)}
                             </div>
                          </div>
                          <div style={{ fontSize: '8px', color: '#475569', fontStyle: 'italic', lineHeight: '1.2' }}>
                            Interpretasi: "{p.desc}"
                          </div>
                        </div>
                      )) : (
                        <p style={{ fontSize: '10px', color: '#64748b', gridColumn: 'span 2', textAlign: 'center', padding: '10px 0' }}>Data PAPI Kostick belum tersedia untuk peserta ini.</p>
                      )}
                    </div>
                  </div>

                  <DocumentFooter />
                </div>
            </div>

        </div>
    </div>
  );
}