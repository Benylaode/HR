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
  candidateNik = "CAND-0000", 
  jobPosition = "Staff", 
  evaluations = [], 
  submissions = [] 
}: ReportProps) {
  
  // =====================================
  // KALKULASI HALAMAN 1 (INTERVIEW & VALUE)
  // =====================================
  const hrEval = evaluations.find(e => e.role_type === 'HR') || evaluations[0] || null;
  const assessorName = hrEval?.evaluator_name || "Fariz Apriliyanto";
  const assessorPosition = hrEval?.evaluator_position || "Human Resources";
  
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

  if (!hrEval) {
      competencyScore = 52;
      behaviorScore = 79;
  }

  const totalScore = (competencyScore + behaviorScore) / 2;

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
      'G': 'Peran Pekerja Keras', 'L': 'Peran Kepemimpinan', 'I': 'Peran Pembuat Keputusan', 
      'T': 'Peran Sibuk/Kecepatan', 'V': 'Peran Penuh Semangat', 'S': 'Peran Hubungan Sosial',
      'R': 'Peran Teoritis/Pemikir', 'D': 'Peran Bekerja Detail', 'C': 'Peran Terorganisir',
      'E': 'Peran Pengendalian Emosi', 'N': 'Kebutuhan Menyelesaikan Tugas', 'A': 'Kebutuhan Berprestasi',
      'P': 'Kebutuhan Mengontrol Orang Lain', 'X': 'Kebutuhan Diperhatikan', 'B': 'Kebutuhan Diterima Kelompok',
      'O': 'Kebutuhan Kedekatan', 'Z': 'Kebutuhan Berubah', 'K': 'Kebutuhan Agresif/Keras Kepala',
      'F': 'Kebutuhan Mendukung Atasan', 'W': 'Kebutuhan Aturan/Arahan'
    };

    return Object.entries(papi)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .map(([trait, score]) => ({ trait, score, desc: meanings[trait] || `Aspek ${trait}` }));
  };

  const allPapi = getAllPapi();
  const printDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  // ================= REUSABLE COMPONENTS =================
  const DocumentHeader = ({ title, subtitle }: { title: string, subtitle: string }) => (
    <div style={{ textAlign: 'center', borderBottom: '2px solid #1e3a8a', paddingBottom: '8px', marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginBottom: '6px' }}>
        <img src="/images/logos/MBMlogo.png" alt="Logo MBM" style={{ height: '35px', objectFit: 'contain' }} />
        <div style={{ height: '25px', width: '1px', backgroundColor: '#cbd5e1' }}></div>
        <img src="/images/logos/ptLogoText.png" alt="Logo Partner" style={{ height: '30px', objectFit: 'contain' }} />
      </div>
      <h1 style={{ fontSize: '15px', color: '#1e3a8a', margin: '0 0 2px 0', letterSpacing: '1px', fontWeight: '900', textTransform: 'uppercase' }}>{title}</h1>
      <p style={{ fontSize: '9px', color: '#64748b', margin: 0 }}>{subtitle}</p>
    </div>
  );

  const ParticipantProfile = () => (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', backgroundColor: '#f8fafc', padding: '8px 12px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', gap: '30px' }}>
        <div>
          <p style={{ margin: 0, fontSize: '8px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold' }}>NIK / ID</p>
          <h2 style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#0f172a', fontWeight: '800' }}>{candidateNik}</h2>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: '8px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold' }}>Nama Peserta</p>
          <h2 style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#0f172a', fontWeight: '800' }}>{candidateName}</h2>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <p style={{ margin: 0, fontSize: '8px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold' }}>Posisi Dilamar</p>
        <h3 style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#334155', fontWeight: '700' }}>{jobPosition}</h3>
      </div>
    </div>
  );

  const DocumentFooter = () => (
    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '8px' }}>
      <div>
        <p style={{ fontSize: '8px', color: '#94a3b8', margin: 0, fontWeight: 'bold' }}>Sistem HR Terintegrasi</p>
        <p style={{ fontSize: '8px', color: '#94a3b8', margin: '2px 0 0 0' }}>ID Dokumen: DOC-{candidateNik} | Dicetak: {printDate}</p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '9px', margin: '0 0 30px 0', color: '#64748b' }}>Authorized Assessor,</p>
        <p style={{ fontSize: '11px', fontWeight: 'bold', margin: 0, textDecoration: 'underline', color: '#0f172a' }}>{assessorName}</p>
        <p style={{ fontSize: '9px', color: '#64748b', margin: '2px 0 0 0' }}>{assessorPosition}</p>
      </div>
    </div>
  );

  // ================= KUNCI UTAMA: CSS A4 LEBIH PENDEK =================
  const safePageStyle: React.CSSProperties = {
    width: '200mm',   // LEBIH KECIL 1 CM DARI A4 (Awalnya 210mm)
    height: '285mm',  // LEBIH PENDEK 1.2 CM DARI A4 (Awalnya 297mm)
    padding: '6mm',   // Ruang penyangga luar
    backgroundColor: '#fff',
    boxSizing: 'border-box',
    overflow: 'hidden', // Gunting semua "tumpahan" isi tak kasat mata
    display: 'flex',
    flexDirection: 'column',
    margin: '0 auto', // Selalu di tengah
  };

  const innerBorderStyle: React.CSSProperties = {
    border: '2px solid #1e3a8a',
    flex: 1, // Otomatis mengisi 285mm
    padding: '16px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden' 
  };

  return (
    <div style={{ backgroundColor: '#e5e7eb', padding: '20px 0', display: 'flex', justifyContent: 'center', width: '100%', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
        
        {/* WADAH UTAMA HTML2PDF */}
        {/* Tidak ada lagi flexbox di root container ini */}
        <div id="pdf-content" style={{ display: 'block', backgroundColor: '#fff' }}>
            
            {/* ========================================================= */}
            {/* HALAMAN 1: REKAPITULASI INTERVIEW & VALUE */}
            {/* ========================================================= */}
            <div style={safePageStyle}>
                <div style={innerBorderStyle}>
                    
                    <DocumentHeader title="FINAL EVALUATION REPORT" subtitle="Rekapitulasi Hasil Evaluasi Wawancara & Value Behavior" />
                    <ParticipantProfile />

                    {/* KOTAK HASIL INTERVIEW & VALUE */}
                    <div style={{ display: 'flex', gap: '15px', marginBottom: '12px' }}>
                      <div style={{ flex: '1', backgroundColor: '#fff', padding: '10px', border: '1px solid #e2e8f0', borderTop: '3px solid #f59e0b', borderRadius: '4px' }}>
                        <h3 style={{ marginTop: 0, fontSize: '10px', color: '#b45309', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '8px', fontWeight: 'bold' }}>Assesment - Kompetensi</h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fffbeb', padding: '8px', borderRadius: '4px' }}>
                          <div>
                            <p style={{ fontSize: '7px', color: '#d97706', margin: 0, textTransform: 'uppercase', fontWeight: 'bold' }}>Assessor: {assessorName}</p>
                            <p style={{ fontSize: '8px', fontWeight: 'bold', margin: '2px 0 0 0', color: '#92400e' }}>Human Resources</p>
                          </div>
                          <div style={{ fontSize: '16px', fontWeight: '900', color: '#b45309' }}>{competencyScore}%</div>
                        </div>
                      </div>

                      <div style={{ flex: '1', backgroundColor: '#fff', padding: '10px', border: '1px solid #e2e8f0', borderTop: '3px solid #06b6d4', borderRadius: '4px' }}>
                        <h3 style={{ marginTop: 0, fontSize: '10px', color: '#0e7490', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '8px', fontWeight: 'bold' }}>Assesment - Value Behavior</h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ecfeff', padding: '8px', borderRadius: '4px' }}>
                          <div>
                            <p style={{ fontSize: '7px', color: '#0891b2', margin: 0, textTransform: 'uppercase', fontWeight: 'bold' }}>Assessor: {assessorName}</p>
                            <p style={{ fontSize: '8px', fontWeight: 'bold', margin: '2px 0 0 0', color: '#155e75' }}>Human Resources</p>
                          </div>
                          <div style={{ fontSize: '16px', fontWeight: '900', color: '#0e7490' }}>{behaviorScore}%</div>
                        </div>
                      </div>
                    </div>

                    {/* KOTAK TOTAL SCORE & KESIMPULAN */}
                    <div style={{ backgroundColor: '#1e293b', padding: '12px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div>
                        <p style={{ fontSize: '8px', color: '#94a3b8', margin: 0, fontWeight: 'bold', letterSpacing: '1px' }}>TOTAL SCORE</p>
                        <p style={{ fontSize: '20px', color: '#fff', fontWeight: '900', margin: '2px 0 0 0' }}>{totalScore.toFixed(2)}%</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '8px', color: '#94a3b8', margin: 0, fontWeight: 'bold', letterSpacing: '1px' }}>FINAL REMARKS</p>
                        <div style={{ display: 'inline-block', backgroundColor: totalScore >= 70 ? '#10b981' : '#f59e0b', color: '#fff', padding: '4px 8px', borderRadius: '3px', fontWeight: 'bold', fontSize: '12px', margin: '4px 0' }}>
                          {finalStatus.remarks}
                        </div>
                        <p style={{ fontSize: '8px', color: '#cbd5e1', margin: 0 }}>Readyness: <strong style={{ color: '#fff' }}>{finalStatus.readyness}</strong></p>
                      </div>
                    </div>

                    {/* TABEL MATRIKS KEPUTUSAN */}
                    <h3 style={{ fontSize: '10px', color: '#1e3a8a', fontWeight: 'bold', marginBottom: '4px' }}>Matriks Rekomendasi Kelulusan</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px', border: '1px solid #e2e8f0' }}>
                      <thead style={{ backgroundColor: '#f8fafc' }}>
                        <tr>
                          <th style={{ border: '1px solid #cbd5e1', padding: '5px', textAlign: 'center', color: '#475569' }}>Kategori Skor</th>
                          <th style={{ border: '1px solid #cbd5e1', padding: '5px', textAlign: 'center', color: '#475569' }}>Remarks</th>
                          <th style={{ border: '1px solid #cbd5e1', padding: '5px', textAlign: 'center', color: '#475569' }}>Status</th>
                          <th style={{ border: '1px solid #cbd5e1', padding: '5px', textAlign: 'center', color: '#475569' }}>Readyness</th>
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
                            <td style={{ border: '1px solid #cbd5e1', padding: '5px', textAlign: 'center' }}>{row.score}</td>
                            <td style={{ border: '1px solid #cbd5e1', padding: '5px', textAlign: 'center' }}>{row.remarks}</td>
                            <td style={{ border: '1px solid #cbd5e1', padding: '5px', textAlign: 'center' }}>{row.status}</td>
                            <td style={{ border: '1px solid #cbd5e1', padding: '5px', textAlign: 'center' }}>{row.ready}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <DocumentFooter />
                </div>
            </div>

            {/* LOGICAL PAGE BREAK */}
            {/* Dibentuk sebagai div setipis rambut yang tidak akan mengacaukan flexbox */}
            <div className="html2pdf__page-break" style={{ height: '0px', width: '100%', margin: 0, padding: 0, border: 'none', pageBreakAfter: 'always' }}></div>

            {/* ========================================================= */}
            {/* HALAMAN 2: PSYCHOLOGICAL ASSESSMENT REPORT (TES) */}
            {/* ========================================================= */}
            <div style={safePageStyle}>
                <div style={innerBorderStyle}>
                  
                  <DocumentHeader title="PSYCHOLOGICAL ASSESSMENT REPORT" subtitle="Dokumen Resmi Hasil Evaluasi Psikologi Kandidat & Karyawan" />
                  <ParticipantProfile />

                  {/* 1. HASIL CFIT & KRAEPELIN */}
                  <div style={{ display: 'flex', gap: '15px', marginBottom: '10px' }}>
                    <div style={{ flex: '1', backgroundColor: '#fff', padding: '10px', border: '1px solid #e2e8f0', borderTop: '3px solid #3b82f6', borderRadius: '4px' }}>
                      <h3 style={{ marginTop: 0, fontSize: '10px', color: '#1e40af', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '8px', fontWeight: 'bold' }}>1. Kecerdasan Kognitif (CFIT)</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                        <div style={{ backgroundColor: '#f8fafc', padding: '6px', borderRadius: '4px', textAlign: 'center' }}>
                          <p style={{ fontSize: '7px', color: '#64748b', margin: 0, textTransform: 'uppercase', fontWeight: 'bold' }}>Skor IQ</p>
                          <p style={{ fontSize: '12px', fontWeight: '900', margin: '2px 0 0 0', color: '#1e40af' }}>{cfit?.iq || '-'}</p>
                        </div>
                        <div style={{ backgroundColor: '#f8fafc', padding: '6px', borderRadius: '4px', textAlign: 'center' }}>
                          <p style={{ fontSize: '7px', color: '#64748b', margin: 0, textTransform: 'uppercase', fontWeight: 'bold' }}>Klasifikasi</p>
                          <p style={{ fontSize: '8px', fontWeight: 'bold', margin: '2px 0 0 0', color: '#0f172a' }}>{cfit?.classification || '-'}</p>
                        </div>
                        <div style={{ backgroundColor: '#f8fafc', padding: '6px', borderRadius: '4px', textAlign: 'center' }}>
                          <p style={{ fontSize: '7px', color: '#64748b', margin: 0, textTransform: 'uppercase', fontWeight: 'bold' }}>Jwb Benar</p>
                          <p style={{ fontSize: '12px', fontWeight: 'bold', margin: '2px 0 0 0', color: '#0f172a' }}>{cfit?.raw_score ?? '-'}</p>
                        </div>
                      </div>
                    </div>

                    <div style={{ flex: '1', backgroundColor: '#fff', padding: '10px', border: '1px solid #e2e8f0', borderTop: '3px solid #10b981', borderRadius: '4px' }}>
                      <h3 style={{ marginTop: 0, fontSize: '10px', color: '#065f46', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '8px', fontWeight: 'bold' }}>2. Performa Kerja (Kraepelin)</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                        <div style={{ backgroundColor: '#fcf8ea', padding: '6px', borderRadius: '4px', textAlign: 'center' }}>
                          <p style={{ fontSize: '7px', color: '#b45309', margin: 0, textTransform: 'uppercase', fontWeight: 'bold' }}>Kecepatan</p>
                          <p style={{ fontSize: '12px', fontWeight: 'bold', margin: '2px 0 0 0', color: '#78350f' }}>{kraepelin?.kecepatan || kraepelin?.panker || '-'}</p>
                        </div>
                        <div style={{ backgroundColor: '#f0fdf4', padding: '6px', borderRadius: '4px', textAlign: 'center' }}>
                          <p style={{ fontSize: '7px', color: '#15803d', margin: 0, textTransform: 'uppercase', fontWeight: 'bold' }}>Ketelitian</p>
                          <p style={{ fontSize: '12px', fontWeight: 'bold', margin: '2px 0 0 0', color: '#14532d' }}>{kraepelin?.ketelitian || kraepelin?.janker || '-'}</p>
                        </div>
                        <div style={{ backgroundColor: '#fef2f2', padding: '6px', borderRadius: '4px', textAlign: 'center' }}>
                          <p style={{ fontSize: '7px', color: '#ef4444', margin: 0, textTransform: 'uppercase', fontWeight: 'bold' }}>Total Errors</p>
                          <p style={{ fontSize: '12px', fontWeight: '900', margin: '2px 0 0 0', color: '#b91c1c' }}>{totalErrors}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. HASIL PAPI KOSTICK */}
                  <div style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #e2e8f0', borderTop: '3px solid #8b5cf6', borderRadius: '4px', flex: 1 }}>
                    <h3 style={{ marginTop: 0, fontSize: '10px', color: '#5b21b6', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '8px', fontWeight: 'bold' }}>3. Profil Kepribadian & Gaya Kerja (PAPI Kostick)</h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', columnGap: '20px', rowGap: '4px' }}>
                      {allPapi.length > 0 ? allPapi.map((p, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #cbd5e1', paddingBottom: '2px' }}>
                          <div style={{ fontSize: '8.5px', color: '#334155' }}>
                            <strong style={{ color: '#4c1d95', marginRight: '6px' }}>{p.trait}</strong> 
                            {p.desc}
                          </div>
                          <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#0f172a', backgroundColor: '#ede9fe', padding: '2px 5px', borderRadius: '3px' }}>
                            {String(p.score)}
                          </div>
                        </div>
                      )) : (
                        <p style={{ fontSize: '9px', color: '#64748b', gridColumn: 'span 2', textAlign: 'center', padding: '10px 0' }}>Data PAPI Kostick belum tersedia untuk peserta ini.</p>
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