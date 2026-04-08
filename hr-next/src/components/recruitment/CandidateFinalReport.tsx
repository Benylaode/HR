'use client';

import React from 'react';

interface ReportProps {
  candidateName: string;
  candidateNik?: string;
  jobPosition?: string;
  evaluations: any[]; 
  submissions: any[]; 
}

const C = {
  white: '#ffffff',
  black: '#000000',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#cbd5e1',
  gray500: '#64748b',
  gray600: '#475569',
  gray800: '#1e293b',
  teal800: '#115e59',
  teal900: '#134e4a',
  blue900: '#1e3a8a',
  red600: '#dc2626'
};

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
      
      competencyScore = Math.round((compTotal / 80) * 100) || 0; // Sesuaikan pembagi max score jika perlu
      behaviorScore = Math.round((behavTotal / 75) * 100) || 0;  // Sesuaikan pembagi max score jika perlu
  }

  // Jika tidak ada evaluasi, fallback ke angka dummy untuk preview
  if (!hrEval) {
      competencyScore = 52;
      behaviorScore = 79;
  }

  const totalScore = (competencyScore + behaviorScore) / 2;

  // =====================================
  // DATA HALAMAN 2 (HASIL PSIKOTES)
  // =====================================
  const cfitSub = submissions.find(s => s.test_type === 'cfit');
  const kraepelinSub = submissions.find(s => s.test_type === 'kraepelin');
  const papiSub = submissions.find(s => s.test_type === 'papi');
  const totalErrors = kraepelinSub ? (Number(kraepelinSub.scores?.salah || 0) + Number(kraepelinSub.scores?.terlewat || 0)) : '0';

  const getPapiName = (key: string) => {
      const names: Record<string, string> = {
          G: "Peran Pekerja Keras (Hard Intense Worker)", L: "Peran Kepemimpinan (Leadership Role)", I: "Peran Pembuat Keputusan (Decision Making)", T: "Peran Sibuk/Kecepatan (Pace)", 
          V: "Peran Penuh Semangat (Vigorous Type)", S: "Peran Hubungan Sosial (Social Extension)", R: "Peran Teoritis/Pemikir (Theoretical Type)", D: "Peran Bekerja Detail (Detail Worker)", 
          C: "Peran Keteraturan (Organized Type)", E: "Peran Pengendalian Emosi (Emotional Restraint)", N: "Kebutuhan Penyelesaian Tugas (Need to Finish Task)", A: "Kebutuhan Berprestasi (Need to Achieve)", 
          P: "Kebutuhan Mengontrol Orang Lain (Control Others)", X: "Kebutuhan Diperhatikan (Need to be Noticed)", B: "Kebutuhan Diterima Kelompok (Belong to Groups)", 
          O: "Kebutuhan Kedekatan (Closeness & Affection)", Z: "Kebutuhan Perubahan (Need for Change)", K: "Kebutuhan Agresif/Keras Kepala (Forceful)", 
          F: "Kebutuhan Mendukung Atasan (Support Authority)", W: "Kebutuhan Aturan/Arahan (Rules & Supervision)"
      };
      return names[key] || key;
  };

  const printDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  // REUSABLE FOOTER COMPONENT
  const FooterSignature = () => (
    <div style={{ position: 'absolute', bottom: '40px', left: '40px', right: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontFamily: 'Arial, sans-serif' }}>
      <div>
         <p style={{ fontSize: '10px', color: C.gray500, fontWeight: 'bold', margin: '0 0 2px 0' }}>Sistem HR Terintegrasi</p>
         <p style={{ fontSize: '10px', color: C.gray500, margin: 0 }}>ID: DOC-{candidateNik} | Dicetak: {printDate}</p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '11px', margin: '0 0 50px 0', color: C.gray500 }}>Authorized Assessor,</p>
        <p style={{ fontSize: '14px', fontWeight: 'bold', margin: 0, color: C.black, textDecoration: 'underline' }}>{assessorName}</p>
        <p style={{ fontSize: '11px', color: C.gray600, margin: '2px 0 0 0' }}>{assessorPosition}</p>
      </div>
    </div>
  );

  return (
    <div style={{ backgroundColor: C.gray200, padding: '32px 0', display: 'flex', justifyContent: 'center', width: '100%', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
        
        {/* WADAH PDF: 2 Halaman A4 */}
        <div id="pdf-content" style={{ backgroundColor: C.white, display: 'flex', flexDirection: 'column', gap: '48px', width: '210mm' }}>
            
            {/* ========================================================= */}
            {/* HALAMAN 1: REKAPITULASI INTERVIEW & VALUE */}
            {/* ========================================================= */}
            <div style={{ width: '210mm', minHeight: '297mm', padding: '40px', backgroundColor: C.white, position: 'relative', boxSizing: 'border-box' }}>
                
                <h1 style={{ fontSize: '20px', fontWeight: 'bold', textAlign: 'center', color: C.black, marginBottom: '32px', borderBottom: `2px solid ${C.black}`, paddingBottom: '12px', textTransform: 'uppercase' }}>
                    Rekapitulasi Final Evaluation
                </h1>

                <h2 style={{ fontWeight: 'bold', color: C.black, marginBottom: '8px', fontSize: '14px' }}>Identitas Assesi</h2>
                <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse', border: `1px solid ${C.black}`, marginBottom: '32px' }}>
                    <tbody>
                        <tr style={{ borderBottom: `1px solid ${C.black}` }}>
                            <td style={{ width: '30%', padding: '6px 12px', fontWeight: 'bold', borderRight: `1px solid ${C.black}` }}>NIK</td>
                            <td style={{ padding: '6px 12px' }}>{candidateNik}</td>
                        </tr>
                        <tr style={{ borderBottom: `1px solid ${C.black}` }}>
                            <td style={{ width: '30%', padding: '6px 12px', fontWeight: 'bold', borderRight: `1px solid ${C.black}` }}>Nama Assesi</td>
                            <td style={{ padding: '6px 12px' }}>{candidateName}</td>
                        </tr>
                        <tr>
                            <td style={{ width: '30%', padding: '6px 12px', fontWeight: 'bold', borderRight: `1px solid ${C.black}` }}>Posisi Assesi</td>
                            <td style={{ padding: '6px 12px' }}>{jobPosition}</td>
                        </tr>
                    </tbody>
                </table>

                {/* Interview */}
                <h2 style={{ fontWeight: 'bold', color: C.black, marginBottom: '8px', fontSize: '14px' }}>Interview</h2>
                <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse', border: `1px solid ${C.black}`, marginBottom: '32px' }}>
                    <thead>
                        <tr style={{ borderBottom: `1px solid ${C.black}` }}>
                            <th style={{ padding: '6px 12px', borderRight: `1px solid ${C.black}`, textAlign: 'left', width: '30%' }}>Assesor</th>
                            <th style={{ padding: '6px 12px', borderRight: `1px solid ${C.black}`, textAlign: 'left' }}>Nama Assesor</th>
                            <th style={{ padding: '6px 12px', textAlign: 'center', width: '20%' }}>Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ padding: '6px 12px', borderRight: `1px solid ${C.black}` }}>HR</td>
                            <td style={{ padding: '6px 12px', borderRight: `1px solid ${C.black}` }}>{assessorName}</td>
                            <td style={{ padding: '6px 12px', textAlign: 'center' }}>{competencyScore}%</td>
                        </tr>
                    </tbody>
                </table>

                {/* Value Behaviour */}
                <h2 style={{ fontWeight: 'bold', color: C.black, marginBottom: '8px', fontSize: '14px' }}>Value Behaviour</h2>
                <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse', border: `1px solid ${C.black}`, marginBottom: '32px' }}>
                    <thead>
                        <tr style={{ borderBottom: `1px solid ${C.black}` }}>
                            <th style={{ padding: '6px 12px', borderRight: `1px solid ${C.black}`, textAlign: 'left', width: '30%' }}>Assesor</th>
                            <th style={{ padding: '6px 12px', borderRight: `1px solid ${C.black}`, textAlign: 'left' }}>Nama Assesor</th>
                            <th style={{ padding: '6px 12px', textAlign: 'center', width: '20%' }}>Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ padding: '6px 12px', borderRight: `1px solid ${C.black}` }}>HR</td>
                            <td style={{ padding: '6px 12px', borderRight: `1px solid ${C.black}` }}>{assessorName}</td>
                            <td style={{ padding: '6px 12px', textAlign: 'center' }}>{behaviorScore}%</td>
                        </tr>
                    </tbody>
                </table>

                {/* Summary */}
                <h2 style={{ fontWeight: 'bold', color: C.black, marginBottom: '8px', fontSize: '14px' }}>Summary</h2>
                <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse', border: `1px solid ${C.black}`, marginBottom: '32px' }}>
                    <thead>
                        <tr style={{ borderBottom: `1px solid ${C.black}` }}>
                            <th style={{ padding: '6px 12px', borderRight: `1px solid ${C.black}`, width: '10%', textAlign: 'center' }}>No</th>
                            <th style={{ padding: '6px 12px', borderRight: `1px solid ${C.black}`, textAlign: 'left' }}>Jenis Assesment</th>
                            <th style={{ padding: '6px 12px', textAlign: 'center', width: '20%' }}>Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style={{ borderBottom: `1px solid ${C.black}` }}>
                            <td style={{ padding: '6px 12px', borderRight: `1px solid ${C.black}`, textAlign: 'center' }}>1</td>
                            <td style={{ padding: '6px 12px', borderRight: `1px solid ${C.black}` }}>Assesmenet - Presentasi</td>
                            <td style={{ padding: '6px 12px', textAlign: 'center' }}>{competencyScore}%</td>
                        </tr>
                        <tr style={{ borderBottom: `1px solid ${C.black}` }}>
                            <td style={{ padding: '6px 12px', borderRight: `1px solid ${C.black}`, textAlign: 'center' }}>2</td>
                            <td style={{ padding: '6px 12px', borderRight: `1px solid ${C.black}` }}>Assesement - Value</td>
                            <td style={{ padding: '6px 12px', textAlign: 'center' }}>{behaviorScore}%</td>
                        </tr>
                        <tr>
                            <td colSpan={2} style={{ padding: '6px 12px', borderRight: `1px solid ${C.black}`, fontWeight: 'bold', textAlign: 'right' }}>Total Score</td>
                            <td style={{ padding: '6px 12px', textAlign: 'center', fontWeight: 'bold' }}>{totalScore.toFixed(2)}%</td>
                        </tr>
                    </tbody>
                </table>

                {/* Kategori Keputusan */}
                <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', border: `1px solid ${C.black}`, textAlign: 'center', marginBottom: '8px' }}>
                    <thead>
                        <tr style={{ borderBottom: `1px solid ${C.black}` }}>
                            <th style={{ padding: '6px', borderRight: `1px solid ${C.black}` }}>Kategori</th>
                            <th style={{ padding: '6px', borderRight: `1px solid ${C.black}` }}>Remarks</th>
                            <th style={{ padding: '6px', borderRight: `1px solid ${C.black}` }}>Kategori</th>
                            <th style={{ padding: '6px', borderRight: `1px solid ${C.black}` }}>Status</th>
                            <th style={{ padding: '6px' }}>Readyness</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style={totalScore < 50 ? { fontWeight: 'bold', backgroundColor: C.gray200 } : {}}>
                            <td style={{ padding: '6px', borderRight: `1px solid ${C.black}`, borderBottom: `1px solid ${C.black}` }}>&lt;50%</td>
                            <td style={{ padding: '6px', borderRight: `1px solid ${C.black}`, borderBottom: `1px solid ${C.black}` }}>Unacceptable</td>
                            <td style={{ padding: '6px', borderRight: `1px solid ${C.black}`, borderBottom: `1px solid ${C.black}` }}></td><td style={{ borderBottom: `1px solid ${C.black}`, borderRight: `1px solid ${C.black}` }}></td><td style={{ borderBottom: `1px solid ${C.black}` }}></td>
                        </tr>
                        <tr style={totalScore >= 50 && totalScore < 70 ? { fontWeight: 'bold', backgroundColor: C.gray200 } : {}}>
                            <td style={{ padding: '6px', borderRight: `1px solid ${C.black}`, borderBottom: `1px solid ${C.black}` }}>≥50% - &lt;70%</td>
                            <td style={{ padding: '6px', borderRight: `1px solid ${C.black}`, borderBottom: `1px solid ${C.black}` }}>Below Expectation</td>
                            <td style={{ padding: '6px', borderRight: `1px solid ${C.black}`, borderBottom: `1px solid ${C.black}` }}></td><td style={{ borderBottom: `1px solid ${C.black}`, borderRight: `1px solid ${C.black}` }}></td><td style={{ borderBottom: `1px solid ${C.black}` }}></td>
                        </tr>
                        <tr style={totalScore >= 70 && totalScore < 80 ? { fontWeight: 'bold', backgroundColor: C.gray200 } : {}}>
                            <td style={{ padding: '6px', borderRight: `1px solid ${C.black}`, borderBottom: `1px solid ${C.black}` }}>≥70% - &lt;80%</td>
                            <td style={{ padding: '6px', borderRight: `1px solid ${C.black}`, borderBottom: `1px solid ${C.black}` }}>Fully Successful</td>
                            <td style={{ padding: '6px', borderRight: `1px solid ${C.black}`, borderBottom: `1px solid ${C.black}` }}>Fully Successful</td>
                            <td style={{ padding: '6px', borderRight: `1px solid ${C.black}`, borderBottom: `1px solid ${C.black}` }}>Recommended</td>
                            <td style={{ padding: '6px', borderBottom: `1px solid ${C.black}` }}>R1</td>
                        </tr>
                        <tr style={totalScore >= 80 && totalScore < 90 ? { fontWeight: 'bold', backgroundColor: C.gray200 } : {}}>
                            <td style={{ padding: '6px', borderRight: `1px solid ${C.black}`, borderBottom: `1px solid ${C.black}` }}>≥80% - &lt;90%</td>
                            <td style={{ padding: '6px', borderRight: `1px solid ${C.black}`, borderBottom: `1px solid ${C.black}` }}>Above Expectation</td>
                            <td style={{ padding: '6px', borderRight: `1px solid ${C.black}`, borderBottom: `1px solid ${C.black}` }}></td><td style={{ borderBottom: `1px solid ${C.black}`, borderRight: `1px solid ${C.black}` }}></td><td style={{ borderBottom: `1px solid ${C.black}` }}></td>
                        </tr>
                        <tr style={totalScore >= 90 ? { fontWeight: 'bold', backgroundColor: C.gray200 } : {}}>
                            <td style={{ padding: '6px', borderRight: `1px solid ${C.black}` }}>≥90%</td>
                            <td style={{ padding: '6px', borderRight: `1px solid ${C.black}` }}>Outstanding</td>
                            <td style={{ padding: '6px', borderRight: `1px solid ${C.black}` }}></td><td style={{ borderRight: `1px solid ${C.black}` }}></td><td></td>
                        </tr>
                    </tbody>
                </table>
                <p style={{ fontSize: '11px', color: C.black, fontStyle: 'italic', marginTop: 0 }}>*Recomended dengan kategori minimal FS</p>

                <FooterSignature />
            </div>

            {/* ========================================================= */}
            {/* FORCE PAGE BREAK */}
            {/* ========================================================= */}
            <div className="html2pdf__page-break" style={{ pageBreakBefore: 'always', height: 0, overflow: 'hidden' }}></div>

            {/* ========================================================= */}
            {/* HALAMAN 2: PSYCHOLOGICAL ASSESSMENT REPORT (TES) */}
            {/* ========================================================= */}
            <div style={{ width: '210mm', minHeight: '297mm', padding: '40px', backgroundColor: C.white, position: 'relative', boxSizing: 'border-box' }}>
                
                {/* Kop Surat / Header */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: '900', color: C.blue900, margin: '0 0 4px 0', letterSpacing: '1px' }}>MERDEKA BATTERY MATERIALS</h1>
                    <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: C.gray600, margin: '0 0 24px 0' }}>PT. SULAWESI CAHAYA MINERAL</h2>
                    
                    <div style={{ borderBottom: `2px solid ${C.black}`, width: '100%', marginBottom: '24px' }}></div>
                    
                    <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: C.black, margin: '0 0 8px 0', textTransform: 'uppercase' }}>PSYCHOLOGICAL ASSESSMENT REPORT</h2>
                    <p style={{ fontSize: '13px', color: C.gray600, margin: 0 }}>Dokumen Resmi Hasil Evaluasi Psikologi Kandidat & Karyawan</p>
                </div>

                {/* Nama Peserta */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px', border: `1px solid ${C.black}`, padding: '16px' }}>
                    <div>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>NAMA PESERTA</span>
                        <span style={{ fontSize: '18px', fontWeight: 'bold', color: C.black }}>{candidateNik} - {candidateName.toUpperCase()}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>TIPE PESERTA</span>
                        <span style={{ fontSize: '14px' }}>Kandidat / Pelamar</span>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '32px', marginBottom: '32px' }}>
                    {/* 1. KOGNITIF (CFIT) */}
                    <div style={{ flex: 1 }}>
                        <h3 style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '12px', borderBottom: `1px solid ${C.black}`, paddingBottom: '4px' }}>1. Kecerdasan Kognitif (CFIT)</h3>
                        <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse', border: `1px solid ${C.black}`, textAlign: 'center' }}>
                            <thead>
                                <tr style={{ backgroundColor: C.gray200, borderBottom: `1px solid ${C.black}` }}>
                                    <th style={{ padding: '8px', borderRight: `1px solid ${C.black}` }}>SKOR IQ</th>
                                    <th style={{ padding: '8px', borderRight: `1px solid ${C.black}` }}>KLASIFIKASI</th>
                                    <th style={{ padding: '8px' }}>JWB BENAR</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style={{ padding: '12px', borderRight: `1px solid ${C.black}`, fontWeight: 'bold', fontSize: '16px' }}>{cfitSub?.scores?.iq || '-'}</td>
                                    <td style={{ padding: '12px', borderRight: `1px solid ${C.black}`, fontWeight: 'bold' }}>{cfitSub?.scores?.classification || '-'}</td>
                                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{cfitSub?.scores?.raw_score || '-'}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* 2. KRAEPELIN */}
                    <div style={{ flex: 1 }}>
                        <h3 style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '12px', borderBottom: `1px solid ${C.black}`, paddingBottom: '4px' }}>2. Performa Kerja (Kraepelin)</h3>
                        <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse', border: `1px solid ${C.black}`, textAlign: 'center' }}>
                            <thead>
                                <tr style={{ backgroundColor: C.gray200, borderBottom: `1px solid ${C.black}` }}>
                                    <th style={{ padding: '8px', borderRight: `1px solid ${C.black}` }}>KECEPATAN</th>
                                    <th style={{ padding: '8px', borderRight: `1px solid ${C.black}` }}>KETELITIAN</th>
                                    <th style={{ padding: '8px' }}>TOTAL ERRORS</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style={{ padding: '12px', borderRight: `1px solid ${C.black}`, fontWeight: 'bold' }}>{kraepelinSub?.scores?.panker || '-'}</td>
                                    <td style={{ padding: '12px', borderRight: `1px solid ${C.black}`, fontWeight: 'bold' }}>{kraepelinSub?.scores?.janker || '-'}</td>
                                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{totalErrors}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 3. PAPI KOSTICK */}
                <div>
                    <h3 style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '16px', borderBottom: `1px solid ${C.black}`, paddingBottom: '4px' }}>3. Profil Kepribadian & Gaya Kerja (PAPI Kostick)</h3>
                    {papiSub?.scores ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: '32px', rowGap: '4px', fontSize: '12px' }}>
                            {Object.entries(papiSub.scores)
                                .filter(([k]) => /^[A-Z]$/.test(k))
                                .sort(([keyA], [keyB]) => {
                                    // Custom sort jika ingin sesuai PDF (W, K, P, G dsb)
                                    // Namun kita urutkan by default alphabet untuk keamanan
                                    return keyA.localeCompare(keyB);
                                })
                                .map(([key, val]: any) => (
                                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px dashed ${C.gray300}` }}>
                                    <span>{key} {getPapiName(key)}</span>
                                    <span style={{ fontWeight: 'bold' }}>{val}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ fontSize: '13px', color: C.gray500, fontStyle: 'italic', textAlign: 'center', padding: '20px', border: `1px solid ${C.gray300}` }}>Data PAPI Kostick belum tersedia.</div>
                    )}
                </div>

                <FooterSignature />
            </div>
        </div>
    </div>
  );
}