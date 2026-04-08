'use client';

import React from 'react';

interface ReportProps {
  candidateName: string;
  candidateNik?: string;
  jobPosition?: string;
  evaluations: any[]; 
  submissions: any[]; 
}

export default function CandidateFinalReport({ 
  candidateName, 
  candidateNik = "PUS-0000", 
  jobPosition = "Staff", 
  evaluations = [], 
  submissions = [] 
}: ReportProps) {
  
  // =====================================
  // KALKULASI HALAMAN 1 (INTERVIEW & VALUE)
  // =====================================
  const hrEval = evaluations.find(e => e.role_type === 'HR') || evaluations[0] || null;
  const assessorName = hrEval?.evaluator_name || "Fariz Apriliyanto";
  const assessorPosition = hrEval?.evaluator_position || "HR Department";
  
  let competencyScore = 0;
  let behaviorScore = 0;

  if (hrEval && hrEval.scores) {
      const compScores = hrEval.scores.filter((s: any) => s.category === 'COMPETENCY');
      const behavScores = hrEval.scores.filter((s: any) => s.category === 'BEHAVIOR');
      const compTotal = compScores.reduce((acc: number, curr: any) => acc + curr.score, 0);
      const behavTotal = behavScores.reduce((acc: number, curr: any) => acc + curr.score, 0);
      
      competencyScore = Math.round((compTotal / 80) * 100) || 0; 
      behaviorScore = Math.round((behavTotal / 75) * 100) || 0;  
  }

  // Fallback dummy jika belum dinilai (untuk preview)
  if (!hrEval) {
      competencyScore = 52;
      behaviorScore = 79;
  }

  const totalScore = (competencyScore + behaviorScore) / 2;

  // Fungsi penentuan status kelulusan otomatis
  const getRecommendation = (score: number) => {
    if (score < 50) return { cat: '<50%', remarks: 'Unacceptable', status: 'Not Recommended', readyness: '-' };
    if (score < 70) return { cat: '≥50% - <70%', remarks: 'Below Expectation', status: 'Considered', readyness: 'R3' };
    if (score < 80) return { cat: '≥70% - <80%', remarks: 'Fully Successful', status: 'Recommended', readyness: 'R1' };
    if (score < 90) return { cat: '≥80% - <90%', remarks: 'Above Expectation', status: 'Highly Recommended', readyness: 'R1' };
    return { cat: '≥90%', remarks: 'Outstanding', status: 'Highly Recommended', readyness: 'R1' };
  };
  const finalStatus = getRecommendation(totalScore);

  // =====================================
  // DATA HALAMAN 2 (HASIL PSIKOTES)
  // =====================================
  const cfitSub = submissions.find(s => s.test_type === 'cfit');
  const kraepelinSub = submissions.find(s => s.test_type === 'kraepelin');
  const papiSub = submissions.find(s => s.test_type === 'papi');
  const cfit = cfitSub?.scores;
  const kraepelin = kraepelinSub?.scores;
  const papi = papiSub?.scores;

  const totalErrors = kraepelin ? (Number(kraepelin.salah || 0) + Number(kraepelin.terlewat || 0)) : '-';

  const getAllPapi = () => {
    if (!papi || Object.keys(papi).length === 0) return [];
    const meanings: Record<string, string> = {
      'G': 'Peran Pekerja Keras (Hard Intense Worker)', 
      'L': 'Peran Kepemimpinan (Leadership Role)', 
      'I': 'Peran Pembuat Keputusan (Making Decisions)', 
      'T': 'Peran Sibuk/Kecepatan (Pace)', 
      'V': 'Peran Penuh Semangat (Vigorous Type)', 
      'S': 'Peran Hubungan Sosial (Social Extension)',
      'R': 'Peran Teoritis/Pemikir (Theoretical Type)', 
      'D': 'Peran Bekerja Detail (Working With Details)', 
      'C': 'Peran Terorganisir (Organized Type)',
      'E': 'Peran Pengendalian Emosi (Emotional Restraint)',
      'N': 'Kebutuhan Menyelesaikan Tugas (Finish Task)',
      'A': 'Kebutuhan Berprestasi (Need to Achieve)',
      'P': 'Kebutuhan Mengontrol Orang Lain (Control Others)',
      'X': 'Kebutuhan Diperhatikan (Need to be Noticed)',
      'B': 'Kebutuhan Diterima Kelompok (Belong to Groups)',
      'O': 'Kebutuhan Kedekatan (Closeness & Affection)',
      'Z': 'Kebutuhan Berubah (Need for Change)',
      'K': 'Kebutuhan Agresif/Keras Kepala (Forceful)',
      'F': 'Kebutuhan Mendukung Atasan (Support Authority)',
      'W': 'Kebutuhan Aturan/Arahan (Rules & Supervision)'
    };

    return Object.entries(papi)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .map(([trait, score]) => ({ trait, score, desc: meanings[trait] || `Aspek ${trait}` }));
  };

  const allPapi = getAllPapi();
  const printDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  // ================= REUSABLE COMPONENTS =================
  const DocumentHeader = ({ title, subtitle }: { title: string, subtitle: string }) => (
    <div style={{ textAlign: 'center', borderBottom: '3px solid #1e3a8a', paddingBottom: '20px', marginBottom: '25px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '25px', marginBottom: '15px' }}>
        <img src="/images/logos/MBMlogo.png" alt="Logo MBM" style={{ height: '60px', objectFit: 'contain' }} />
        <div style={{ height: '45px', width: '2px', backgroundColor: '#cbd5e1', borderRadius: '2px' }}></div>
        <img src="/images/logos/ptLogoText.png" alt="Logo Partner" style={{ height: '50px', objectFit: 'contain' }} />
      </div>
      <h1 style={{ fontSize: '22px', color: '#1e3a8a', margin: '0 0 8px 0', letterSpacing: '1.5px', fontWeight: '900', textTransform: 'uppercase' }}>{title}</h1>
      <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>{subtitle}</p>
    </div>
  );

  const ParticipantProfile = () => (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', backgroundColor: '#f8fafc', padding: '12px 15px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', gap: '40px' }}>
        <div>
          <p style={{ margin: 0, fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>NIK / ID</p>
          <h2 style={{ margin: '4px 0 0 0', fontSize: '15px', color: '#0f172a', fontWeight: '800' }}>{candidateNik}</h2>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Nama Peserta</p>
          <h2 style={{ margin: '4px 0 0 0', fontSize: '15px', color: '#0f172a', fontWeight: '800' }}>{candidateName}</h2>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <p style={{ margin: 0, fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Posisi Dilamar</p>
        <h3 style={{ margin: '4px 0 0 0', fontSize: '15px', color: '#334155', fontWeight: '700' }}>{jobPosition}</h3>
      </div>
    </div>
  );

  const DocumentFooter = () => (
    <div style={{ position: 'absolute', bottom: '30px', right: '30px', left: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
      <div>
        <p style={{ fontSize: '9px', color: '#94a3b8', margin: 0, fontWeight: 'bold' }}>Sistem HR Terintegrasi</p>
        <p style={{ fontSize: '9px', color: '#94a3b8', margin: '2px 0 0 0' }}>ID Dokumen: DOC-{candidateNik} | Dicetak: {printDate}</p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '11px', margin: '0 0 40px 0', color: '#64748b' }}>Authorized Assessor,</p>
        <p style={{ fontSize: '13px', fontWeight: 'bold', margin: 0, textDecoration: 'underline', color: '#0f172a' }}>{assessorName}</p>
        <p style={{ fontSize: '10px', color: '#64748b', margin: '2px 0 0 0' }}>{assessorPosition}</p>
      </div>
    </div>
  );

  return (
    <div style={{ backgroundColor: '#e5e7eb', padding: '32px 0', display: 'flex', justifyContent: 'center', width: '100%', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
        
        {/* WADAH PDF: Terdiri dari 2 Halaman */}
        <div id="pdf-content" style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
            
            {/* ========================================================= */}
            {/* HALAMAN 1: REKAPITULASI INTERVIEW & VALUE */}
            {/* ========================================================= */}
            <div style={{ width: '210mm', minHeight: '297mm', padding: '40px', backgroundColor: '#fff', position: 'relative', boxSizing: 'border-box', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                <div style={{ position: 'absolute', top: '15px', bottom: '15px', left: '15px', right: '15px', border: '2px solid #1e3a8a', padding: '25px', boxSizing: 'border-box' }}>
                    
                    <DocumentHeader title="FINAL EVALUATION REPORT" subtitle="Rekapitulasi Hasil Evaluasi Wawancara & Value Behavior" />
                    <ParticipantProfile />

                    {/* KOTAK HASIL INTERVIEW & VALUE (Mirip style Kraepelin/CFIT) */}
                    <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                      <div style={{ flex: '1', backgroundColor: '#fff', padding: '15px', border: '1px solid #e2e8f0', borderTop: '4px solid #f59e0b', borderRadius: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ marginTop: 0, fontSize: '13px', color: '#b45309', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '12px', fontWeight: 'bold' }}>Assesment - Kompetensi</h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fffbeb', padding: '12px', borderRadius: '4px' }}>
                          <div>
                            <p style={{ fontSize: '9px', color: '#d97706', margin: 0, textTransform: 'uppercase', fontWeight: 'bold' }}>Assessor: {assessorName}</p>
                            <p style={{ fontSize: '11px', fontWeight: 'bold', margin: '2px 0 0 0', color: '#92400e' }}>Human Resources</p>
                          </div>
                          <div style={{ fontSize: '24px', fontWeight: '900', color: '#b45309' }}>{competencyScore}%</div>
                        </div>
                      </div>

                      <div style={{ flex: '1', backgroundColor: '#fff', padding: '15px', border: '1px solid #e2e8f0', borderTop: '4px solid #06b6d4', borderRadius: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ marginTop: 0, fontSize: '13px', color: '#0e7490', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '12px', fontWeight: 'bold' }}>Assesment - Value Behavior</h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ecfeff', padding: '12px', borderRadius: '4px' }}>
                          <div>
                            <p style={{ fontSize: '9px', color: '#0891b2', margin: 0, textTransform: 'uppercase', fontWeight: 'bold' }}>Assessor: {assessorName}</p>
                            <p style={{ fontSize: '11px', fontWeight: 'bold', margin: '2px 0 0 0', color: '#155e75' }}>Human Resources</p>
                          </div>
                          <div style={{ fontSize: '24px', fontWeight: '900', color: '#0e7490' }}>{behaviorScore}%</div>
                        </div>
                      </div>
                    </div>

                    {/* KOTAK TOTAL SCORE & KESIMPULAN */}
                    <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <div>
                        <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0, fontWeight: 'bold', letterSpacing: '1px' }}>TOTAL SCORE</p>
                        <p style={{ fontSize: '32px', color: '#fff', fontWeight: '900', margin: '5px 0 0 0' }}>{totalScore.toFixed(2)}%</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0, fontWeight: 'bold', letterSpacing: '1px' }}>FINAL REMARKS</p>
                        <div style={{ display: 'inline-block', backgroundColor: totalScore >= 70 ? '#10b981' : '#f59e0b', color: '#fff', padding: '6px 16px', borderRadius: '4px', fontWeight: 'bold', fontSize: '16px', margin: '5px 0' }}>
                          {finalStatus.remarks}
                        </div>
                        <p style={{ fontSize: '11px', color: '#cbd5e1', margin: 0 }}>Readyness: <strong style={{ color: '#fff' }}>{finalStatus.readyness}</strong></p>
                      </div>
                    </div>

                    {/* TABEL MATRIKS KEPUTUSAN */}
                    <h3 style={{ fontSize: '13px', color: '#1e3a8a', fontWeight: 'bold', marginBottom: '8px' }}>Matriks Rekomendasi Kelulusan</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', border: '1px solid #e2e8f0' }}>
                      <thead style={{ backgroundColor: '#f8fafc' }}>
                        <tr>
                          <th style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'center', color: '#475569' }}>Kategori Skor</th>
                          <th style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'center', color: '#475569' }}>Remarks</th>
                          <th style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'center', color: '#475569' }}>Status</th>
                          <th style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'center', color: '#475569' }}>Readyness</th>
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
                          <tr key={idx} style={{ backgroundColor: finalStatus.remarks === row.remarks ? '#e0f2fe' : '#fff', fontWeight: finalStatus.remarks === row.remarks ? 'bold' : 'normal' }}>
                            <td style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'center' }}>{row.score}</td>
                            <td style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'center' }}>{row.remarks}</td>
                            <td style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'center' }}>{row.status}</td>
                            <td style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'center' }}>{row.ready}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <DocumentFooter />
                </div>
            </div>

            {/* ========================================================= */}
            {/* FORCE PAGE BREAK */}
            {/* ========================================================= */}
            <div className="html2pdf__page-break" style={{ pageBreakBefore: 'always', height: 0, overflow: 'hidden' }}></div>

            {/* ========================================================= */}
            {/* HALAMAN 2: PSYCHOLOGICAL ASSESSMENT REPORT (TES) */}
            {/* ========================================================= */}
            <div style={{ width: '210mm', minHeight: '297mm', padding: '40px', backgroundColor: '#fff', position: 'relative', boxSizing: 'border-box', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                <div style={{ position: 'absolute', top: '15px', bottom: '15px', left: '15px', right: '15px', border: '2px solid #1e3a8a', padding: '25px', boxSizing: 'border-box' }}>
                  
                  <DocumentHeader title="PSYCHOLOGICAL ASSESSMENT REPORT" subtitle="Dokumen Resmi Hasil Evaluasi Psikologi Kandidat & Karyawan" />
                  <ParticipantProfile />

                  {/* 1. HASIL CFIT & KRAEPELIN (Simetris 3 Kotak vs 3 Kotak) */}
                  <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                    
                    {/* CFIT CARD GRID */}
                    <div style={{ flex: '1', backgroundColor: '#fff', padding: '15px', border: '1px solid #e2e8f0', borderTop: '4px solid #3b82f6', borderRadius: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                      <h3 style={{ marginTop: 0, fontSize: '13px', color: '#1e40af', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '12px', fontWeight: 'bold' }}>1. Kecerdasan Kognitif (CFIT)</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                        <div style={{ backgroundColor: '#f8fafc', padding: '8px', borderRadius: '4px', textAlign: 'center' }}>
                          <p style={{ fontSize: '9px', color: '#64748b', margin: 0, textTransform: 'uppercase', fontWeight: 'bold' }}>Skor IQ</p>
                          <p style={{ fontSize: '16px', fontWeight: '900', margin: '4px 0 0 0', color: '#1e40af' }}>{cfit?.iq || '-'}</p>
                        </div>
                        <div style={{ backgroundColor: '#f8fafc', padding: '8px', borderRadius: '4px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <p style={{ fontSize: '9px', color: '#64748b', margin: 0, textTransform: 'uppercase', fontWeight: 'bold' }}>Klasifikasi</p>
                          <p style={{ fontSize: '11px', fontWeight: 'bold', margin: '4px 0 0 0', color: '#0f172a' }}>{cfit?.classification || '-'}</p>
                        </div>
                        <div style={{ backgroundColor: '#f8fafc', padding: '8px', borderRadius: '4px', textAlign: 'center' }}>
                          <p style={{ fontSize: '9px', color: '#64748b', margin: 0, textTransform: 'uppercase', fontWeight: 'bold' }}>Jwb Benar</p>
                          <p style={{ fontSize: '16px', fontWeight: 'bold', margin: '4px 0 0 0', color: '#0f172a' }}>{cfit?.raw_score ?? '-'}</p>
                        </div>
                      </div>
                    </div>

                    {/* KRAEPELIN CARD GRID */}
                    <div style={{ flex: '1', backgroundColor: '#fff', padding: '15px', border: '1px solid #e2e8f0', borderTop: '4px solid #10b981', borderRadius: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                      <h3 style={{ marginTop: 0, fontSize: '13px', color: '#065f46', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '12px', fontWeight: 'bold' }}>2. Performa Kerja (Kraepelin)</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                        <div style={{ backgroundColor: '#fcf8ea', padding: '8px', borderRadius: '4px', textAlign: 'center' }}>
                          <p style={{ fontSize: '9px', color: '#b45309', margin: 0, textTransform: 'uppercase', fontWeight: 'bold' }}>Kecepatan</p>
                          <p style={{ fontSize: '16px', fontWeight: 'bold', margin: '4px 0 0 0', color: '#78350f' }}>{kraepelin?.kecepatan || kraepelin?.panker || '-'}</p>
                        </div>
                        <div style={{ backgroundColor: '#f0fdf4', padding: '8px', borderRadius: '4px', textAlign: 'center' }}>
                          <p style={{ fontSize: '9px', color: '#15803d', margin: 0, textTransform: 'uppercase', fontWeight: 'bold' }}>Ketelitian</p>
                          <p style={{ fontSize: '16px', fontWeight: 'bold', margin: '4px 0 0 0', color: '#14532d' }}>{kraepelin?.ketelitian || kraepelin?.janker || '-'}</p>
                        </div>
                        <div style={{ backgroundColor: '#fef2f2', padding: '8px', borderRadius: '4px', textAlign: 'center' }}>
                          <p style={{ fontSize: '9px', color: '#ef4444', margin: 0, textTransform: 'uppercase', fontWeight: 'bold' }}>Total Errors</p>
                          <p style={{ fontSize: '16px', fontWeight: '900', margin: '4px 0 0 0', color: '#b91c1c' }}>{totalErrors}</p>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* 3. HASIL PAPI KOSTICK */}
                  <div style={{ backgroundColor: '#fff', padding: '20px', border: '1px solid #e2e8f0', borderTop: '4px solid #8b5cf6', borderRadius: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ marginTop: 0, fontSize: '13px', color: '#5b21b6', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '15px', fontWeight: 'bold' }}>3. Profil Kepribadian & Gaya Kerja (PAPI Kostick)</h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', columnGap: '40px', rowGap: '10px' }}>
                      {allPapi.length > 0 ? allPapi.map((p, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #cbd5e1', paddingBottom: '4px' }}>
                          <div style={{ fontSize: '10.5px', color: '#334155' }}>
                            <strong style={{ color: '#4c1d95', marginRight: '6px', fontSize: '11px' }}>{p.trait}</strong> 
                            {p.desc}
                          </div>
                          <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a', backgroundColor: '#ede9fe', padding: '3px 8px', borderRadius: '4px' }}>
                            {String(p.score)}
                          </div>
                        </div>
                      )) : (
                        <p style={{ fontSize: '12px', color: '#64748b', gridColumn: 'span 2', textAlign: 'center', padding: '20px 0' }}>Data PAPI Kostick belum tersedia untuk peserta ini.</p>
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