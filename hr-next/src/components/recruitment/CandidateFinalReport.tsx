'use client';

import React from 'react';
import { Camera } from 'lucide-react';

interface ReportProps {
  candidateName: string;
  candidateNik?: string;
  jobPosition?: string;
  evaluations: any[]; 
  submissions: any[]; 
}

// Konstanta warna HEX untuk menghindari error 'lab' atau 'oklch' dari Tailwind
const C = {
  white: '#ffffff',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#cbd5e1',
  gray400: '#94a3b8',
  gray500: '#64748b',
  gray600: '#475569',
  gray800: '#1e293b',
  gray900: '#0f172a',
  teal50: '#f0fdf4',
  teal700: '#0f766e',
  teal800: '#115e59',
  teal900: '#134e4a',
  yellow200: '#fef08a',
  blue500: '#3b82f6',
  blue800: '#1e40af',
  green500: '#10b981',
  purple500: '#8b5cf6',
  purple800: '#6b21a8',
  purple900: '#581c87',
  orange800: '#9a3412',
  green800: '#166534',
  red800: '#991b1b',
};

export default function CandidateFinalReport({ 
  candidateName, 
  candidateNik = "PUS-0000", 
  jobPosition = "Staff", 
  evaluations, 
  submissions 
}: ReportProps) {
  
  // =====================================
  // KALKULASI HALAMAN 1 (INTERVIEW & VALUE)
  // =====================================
  
  const hrEval = evaluations.find(e => e.role_type === 'HR') || evaluations[0] || null;
  const assessorName = hrEval?.evaluator_name || "-";
  const assessorPosition = hrEval?.evaluator_position || "HR Department";
  const evaluationDateRaw = hrEval?.evaluation_date;
  
  const evaluationDate = evaluationDateRaw 
      ? new Date(evaluationDateRaw).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      : "-";

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

  const totalScore = (competencyScore + behaviorScore) / 2;

  // =====================================
  // DATA HALAMAN 2 (HASIL PSIKOTES)
  // =====================================
  const cfitSub = submissions.find(s => s.test_type === 'cfit');
  const kraepelinSub = submissions.find(s => s.test_type === 'kraepelin');
  const papiSub = submissions.find(s => s.test_type === 'papi');
  const totalErrors = kraepelinSub ? (Number(kraepelinSub.scores?.salah || 0) + Number(kraepelinSub.scores?.terlewat || 0)) : '-';

  const getPapiName = (key: string) => {
      const names: Record<string, string> = {
          G: "Pekerja Keras", L: "Kepemimpinan", I: "Pembuat Keputusan", T: "Kecepatan/Sibuk", 
          V: "Penuh Semangat", S: "Perluasan Sosial", R: "Tipe Teoritis", D: "Bekerja Detail", 
          C: "Keteraturan", E: "Daya Tahan Emosi", N: "Penyelesaian Tugas", A: "Kebutuhan Berprestasi", 
          P: "Mengontrol Orang Lain", X: "Kebutuhan Diperhatikan", B: "Diterima Kelompok", 
          O: "Kebutuhan Kedekatan", Z: "Kebutuhan Perubahan", K: "Bertindak Tegas/Agresif", 
          F: "Mendukung Otoritas", W: "Aturan & Arahan"
      };
      return names[key] || key;
  };

  const printDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  // REUSABLE FOOTER COMPONENT
  const FooterSignature = () => (
    <div style={{ position: 'absolute', bottom: '30px', left: '40px', right: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontFamily: 'Arial, sans-serif' }}>
      <div>
         <p style={{ fontSize: '10px', color: C.gray500, fontWeight: 'bold', margin: '0 0 2px 0' }}>Sistem HR Terintegrasi</p>
         <p style={{ fontSize: '10px', color: C.gray400, margin: 0 }}>ID: DOC-{candidateNik} | Dicetak: {printDate}</p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '11px', margin: '0 0 35px 0', color: C.gray500 }}>Authorized Assessor,</p>
        <p style={{ fontSize: '13px', fontWeight: 'bold', margin: 0, color: C.gray900, textDecoration: 'underline' }}>{assessorName}</p>
        <p style={{ fontSize: '10px', color: C.gray500, margin: '2px 0 0 0' }}>{assessorPosition}</p>
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
            <div style={{ width: '210mm', minHeight: '297mm', padding: '40px', backgroundColor: C.white, position: 'relative', boxSizing: 'border-box', border: `1px solid ${C.gray300}` }}>
                
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', textAlign: 'center', color: C.teal800, marginBottom: '32px', borderBottom: `2px solid ${C.teal800}`, paddingBottom: '8px', textTransform: 'uppercase', letterSpacing: '2px' }}>
                    Rekapitulasi Final Evaluation
                </h1>

                {/* Identitas Assesi */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h2 style={{ fontWeight: 'bold', color: C.teal700, backgroundColor: C.teal50, padding: '4px 12px', borderLeft: `4px solid ${C.teal700}`, margin: 0, fontSize: '16px' }}>Identitas Assesi</h2>
                    <span style={{ fontSize: '12px', color: C.gray500, fontWeight: 'bold', backgroundColor: C.gray50, padding: '4px 12px', borderRadius: '4px', border: `1px solid ${C.gray200}` }}>
                        Tanggal Evaluasi: {evaluationDate}
                    </span>
                </div>

                <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse', border: `1px solid ${C.gray300}`, marginBottom: '32px' }}>
                    <tbody>
                        <tr style={{ borderBottom: `1px solid ${C.gray300}` }}>
                            <td style={{ width: '33%', padding: '8px', fontWeight: 'bold', backgroundColor: C.gray50, borderRight: `1px solid ${C.gray300}` }}>NIK</td>
                            <td style={{ padding: '8px' }}>{candidateNik}</td>
                        </tr>
                        <tr style={{ borderBottom: `1px solid ${C.gray300}` }}>
                            <td style={{ width: '33%', padding: '8px', fontWeight: 'bold', backgroundColor: C.gray50, borderRight: `1px solid ${C.gray300}` }}>Nama Assesi</td>
                            <td style={{ padding: '8px' }}>{candidateName}</td>
                        </tr>
                        <tr>
                            <td style={{ width: '33%', padding: '8px', fontWeight: 'bold', backgroundColor: C.gray50, borderRight: `1px solid ${C.gray300}` }}>Posisi Assesi</td>
                            <td style={{ padding: '8px' }}>{jobPosition}</td>
                        </tr>
                    </tbody>
                </table>

                {/* Interview / Kompetensi */}
                <h2 style={{ fontWeight: 'bold', color: C.teal700, backgroundColor: C.teal50, padding: '4px 12px', marginBottom: '8px', borderLeft: `4px solid ${C.teal700}`, fontSize: '16px' }}>Interview (Kompetensi)</h2>
                <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse', border: `1px solid ${C.gray300}`, textAlign: 'center', marginBottom: '32px' }}>
                    <thead style={{ backgroundColor: C.teal800, color: C.white }}>
                        <tr>
                            <th style={{ padding: '8px', border: `1px solid ${C.teal800}`, width: '25%' }}>Assesor</th>
                            <th style={{ padding: '8px', border: `1px solid ${C.teal800}` }}>Nama Assesor</th>
                            <th style={{ padding: '8px', border: `1px solid ${C.teal800}`, width: '25%' }}>Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ padding: '8px', border: `1px solid ${C.gray300}`, fontWeight: 'bold', backgroundColor: C.gray50 }}>HR / Interviewer</td>
                            <td style={{ padding: '8px', border: `1px solid ${C.gray300}` }}>
                                {assessorName} <br/> 
                                <span style={{ fontSize: '12px', color: C.gray500, fontWeight: 'normal' }}>{assessorPosition}</span>
                            </td>
                            <td style={{ padding: '8px', border: `1px solid ${C.gray300}`, fontWeight: 'bold', fontSize: '18px' }}>{competencyScore}%</td>
                        </tr>
                    </tbody>
                </table>

                {/* Value Behaviour */}
                <h2 style={{ fontWeight: 'bold', color: C.teal700, backgroundColor: C.teal50, padding: '4px 12px', marginBottom: '8px', borderLeft: `4px solid ${C.teal700}`, fontSize: '16px' }}>Value Behaviour</h2>
                <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse', border: `1px solid ${C.gray300}`, textAlign: 'center', marginBottom: '32px' }}>
                    <thead style={{ backgroundColor: C.teal800, color: C.white }}>
                        <tr>
                            <th style={{ padding: '8px', border: `1px solid ${C.teal800}`, width: '25%' }}>Assesor</th>
                            <th style={{ padding: '8px', border: `1px solid ${C.teal800}` }}>Nama Assesor</th>
                            <th style={{ padding: '8px', border: `1px solid ${C.teal800}`, width: '25%' }}>Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ padding: '8px', border: `1px solid ${C.gray300}`, fontWeight: 'bold', backgroundColor: C.gray50 }}>HR / Interviewer</td>
                            <td style={{ padding: '8px', border: `1px solid ${C.gray300}` }}>
                                {assessorName} <br/> 
                                <span style={{ fontSize: '12px', color: C.gray500, fontWeight: 'normal' }}>{assessorPosition}</span>
                            </td>
                            <td style={{ padding: '8px', border: `1px solid ${C.gray300}`, fontWeight: 'bold', fontSize: '18px' }}>{behaviorScore}%</td>
                        </tr>
                    </tbody>
                </table>

                {/* Summary */}
                <h2 style={{ fontWeight: 'bold', color: C.teal700, backgroundColor: C.teal50, padding: '4px 12px', marginBottom: '8px', borderLeft: `4px solid ${C.teal700}`, fontSize: '16px' }}>Summary</h2>
                <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse', border: `1px solid ${C.gray300}`, textAlign: 'center', marginBottom: '32px' }}>
                    <thead style={{ backgroundColor: C.teal800, color: C.white }}>
                        <tr>
                            <th style={{ padding: '8px', border: `1px solid ${C.teal800}`, width: '60px' }}>No</th>
                            <th style={{ padding: '8px', border: `1px solid ${C.teal800}`, textAlign: 'left' }}>Jenis Assesment</th>
                            <th style={{ padding: '8px', border: `1px solid ${C.teal800}`, width: '25%' }}>Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ padding: '8px', border: `1px solid ${C.gray300}`, backgroundColor: C.gray50 }}>1</td>
                            <td style={{ padding: '8px', border: `1px solid ${C.gray300}`, textAlign: 'left' }}>Assesment - Kompetensi</td>
                            <td style={{ padding: '8px', border: `1px solid ${C.gray300}`, fontWeight: 'bold' }}>{competencyScore}%</td>
                        </tr>
                        <tr>
                            <td style={{ padding: '8px', border: `1px solid ${C.gray300}`, backgroundColor: C.gray50 }}>2</td>
                            <td style={{ padding: '8px', border: `1px solid ${C.gray300}`, textAlign: 'left' }}>Assesment - Value Behavior</td>
                            <td style={{ padding: '8px', border: `1px solid ${C.gray300}`, fontWeight: 'bold' }}>{behaviorScore}%</td>
                        </tr>
                        <tr style={{ backgroundColor: C.teal50 }}>
                            <td colSpan={2} style={{ padding: '8px', border: `1px solid ${C.gray300}`, fontWeight: 'bold', textAlign: 'right', color: C.teal800 }}>Total Score</td>
                            <td style={{ padding: '8px', border: `1px solid ${C.gray300}`, fontWeight: '900', color: C.teal800, fontSize: '18px' }}>{totalScore.toFixed(2)}%</td>
                        </tr>
                    </tbody>
                </table>

                {/* Kategori Keputusan */}
                <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', border: `1px solid ${C.gray300}`, textAlign: 'center', marginBottom: '8px' }}>
                    <thead style={{ backgroundColor: C.gray100 }}>
                        <tr>
                            <th style={{ padding: '8px', border: `1px solid ${C.gray300}` }}>Skor</th>
                            <th style={{ padding: '8px', border: `1px solid ${C.gray300}` }}>Remarks</th>
                            <th style={{ padding: '8px', border: `1px solid ${C.gray300}` }}>Status</th>
                            <th style={{ padding: '8px', border: `1px solid ${C.gray300}` }}>Readyness</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style={totalScore < 50 ? { backgroundColor: C.yellow200, fontWeight: 'bold' } : {}}>
                            <td style={{ padding: '8px', border: `1px solid ${C.gray300}` }}>&lt;50%</td><td style={{ padding: '8px', border: `1px solid ${C.gray300}` }}>Unacceptable</td><td style={{ padding: '8px', border: `1px solid ${C.gray300}` }}>Not Recommended</td><td style={{ padding: '8px', border: `1px solid ${C.gray300}` }}>-</td>
                        </tr>
                        <tr style={totalScore >= 50 && totalScore < 70 ? { backgroundColor: C.yellow200, fontWeight: 'bold' } : {}}>
                            <td style={{ padding: '8px', border: `1px solid ${C.gray300}` }}>≥50 - &lt;70%</td><td style={{ padding: '8px', border: `1px solid ${C.gray300}` }}>Below Expectation</td><td style={{ padding: '8px', border: `1px solid ${C.gray300}` }}>Considered</td><td style={{ padding: '8px', border: `1px solid ${C.gray300}` }}>R3</td>
                        </tr>
                        <tr style={totalScore >= 70 && totalScore < 80 ? { backgroundColor: C.yellow200, fontWeight: 'bold' } : {}}>
                            <td style={{ padding: '8px', border: `1px solid ${C.gray300}` }}>≥70% - &lt;80%</td><td style={{ padding: '8px', border: `1px solid ${C.gray300}` }}>Fully Successful</td><td style={{ padding: '8px', border: `1px solid ${C.gray300}` }}>Recommended</td><td style={{ padding: '8px', border: `1px solid ${C.gray300}` }}>R1</td>
                        </tr>
                        <tr style={totalScore >= 80 && totalScore < 90 ? { backgroundColor: C.yellow200, fontWeight: 'bold' } : {}}>
                            <td style={{ padding: '8px', border: `1px solid ${C.gray300}` }}>≥80% - &lt;90%</td><td style={{ padding: '8px', border: `1px solid ${C.gray300}` }}>Above Expectation</td><td style={{ padding: '8px', border: `1px solid ${C.gray300}` }}>Highly Recommended</td><td style={{ padding: '8px', border: `1px solid ${C.gray300}` }}>R1</td>
                        </tr>
                        <tr style={totalScore >= 90 ? { backgroundColor: C.yellow200, fontWeight: 'bold' } : {}}>
                            <td style={{ padding: '8px', border: `1px solid ${C.gray300}` }}>≥90%</td><td style={{ padding: '8px', border: `1px solid ${C.gray300}` }}>Outstanding</td><td style={{ padding: '8px', border: `1px solid ${C.gray300}` }}>Highly Recommended</td><td style={{ padding: '8px', border: `1px solid ${C.gray300}` }}>R1</td>
                        </tr>
                    </tbody>
                </table>
                <p style={{ fontSize: '10px', color: C.gray500, fontStyle: 'italic', marginTop: 0, marginBottom: '32px' }}>*Recommended dengan kategori minimal Fully Successful (FS)</p>

                {/* DOKUMENTASI WAWANCARA (Sesuai Screenshot/Foto) */}
                <h2 style={{ fontWeight: 'bold', color: C.teal700, backgroundColor: C.teal50, padding: '4px 12px', marginBottom: '8px', borderLeft: `4px solid ${C.teal700}`, fontSize: '16px' }}>Dokumentasi Wawancara</h2>
                <div style={{ width: '100%', height: '160px', border: `2px dashed ${C.gray300}`, backgroundColor: C.gray50, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: C.gray400, borderRadius: '8px' }}>
                    <Camera size={32} color={C.gray400} style={{ marginBottom: '8px' }} />
                    <span style={{ fontSize: '14px' }}>Lampirkan Foto / Screenshot Interview di Sini</span>
                </div>

                <FooterSignature />
            </div>

            {/* ========================================================= */}
            {/* FORCE PAGE BREAK */}
            {/* ========================================================= */}
            <div className="html2pdf__page-break" style={{ pageBreakBefore: 'always', height: 0, overflow: 'hidden' }}></div>

            {/* ========================================================= */}
            {/* HALAMAN 2: PSYCHOLOGICAL ASSESSMENT REPORT (TES) */}
            {/* ========================================================= */}
            <div style={{ width: '210mm', minHeight: '297mm', padding: '40px', backgroundColor: C.white, position: 'relative', boxSizing: 'border-box', border: `1px solid ${C.gray300}` }}>
                
                {/* Kop Surat / Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: `4px solid ${C.teal800}` }}>
                    <div>
                        <h2 style={{ fontSize: '18px', fontWeight: '900', color: C.gray800, margin: 0, letterSpacing: '-0.5px' }}>MERDEKA BATTERY</h2>
                        <h2 style={{ fontSize: '18px', fontWeight: '900', color: C.teal700, margin: 0, letterSpacing: '-0.5px', marginTop: '-4px' }}>MATERIALS</h2>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <h3 style={{ fontWeight: 'bold', color: C.gray600, fontSize: '14px', margin: 0 }}>PT. SULAWESI CAHAYA MINERAL</h3>
                    </div>
                </div>

                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: '900', color: C.gray900, textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 4px 0' }}>Psychological Assessment Report</h1>
                    <p style={{ fontSize: '14px', color: C.gray500, margin: 0 }}>Dokumen Resmi Hasil Evaluasi Psikologi Kandidat & Karyawan</p>
                </div>

                {/* Nama Peserta */}
                <div style={{ backgroundColor: C.gray100, padding: '16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', border: `1px solid ${C.gray300}` }}>
                    <div>
                        <span style={{ fontSize: '12px', color: C.gray500, fontWeight: 'bold', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Nama Peserta</span>
                        <span style={{ fontSize: '20px', fontWeight: 'bold', color: C.teal900 }}>{candidateNik} - {candidateName.toUpperCase()}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '12px', color: C.gray500, fontWeight: 'bold', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Tipe Peserta</span>
                        <span style={{ fontSize: '14px', fontWeight: 'bold', backgroundColor: C.white, padding: '4px 12px', borderRadius: '4px', border: `1px solid ${C.gray300}` }}>Kandidat / Pelamar</span>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '32px', marginBottom: '32px' }}>
                    {/* 1. KOGNITIF (CFIT) */}
                    <div style={{ flex: 1 }}>
                        <h3 style={{ fontWeight: 'bold', color: C.white, backgroundColor: C.teal800, padding: '6px 12px', marginBottom: '12px', display: 'inline-block', fontSize: '14px' }}>1. Kecerdasan Kognitif (CFIT)</h3>
                        <div style={{ border: `1px solid ${C.gray300}`, borderRadius: '8px', padding: '16px', backgroundColor: C.gray50, textAlign: 'center' }}>
                            {cfitSub?.scores ? (
                                <>
                                    <div style={{ fontSize: '12px', color: C.gray500, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>SKOR IQ</div>
                                    <div style={{ fontSize: '36px', fontWeight: '900', color: C.teal700, marginBottom: '8px' }}>{cfitSub.scores.iq}</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '16px' }}>
                                        <div style={{ backgroundColor: C.white, border: `1px solid ${C.gray300}`, padding: '8px', borderRadius: '4px' }}>
                                            <div style={{ fontSize: '10px', color: C.gray500, textTransform: 'uppercase' }}>Klasifikasi</div>
                                            <div style={{ fontWeight: 'bold', fontSize: '14px', color: C.gray800, marginTop: '2px' }}>{cfitSub.scores.classification}</div>
                                        </div>
                                        <div style={{ backgroundColor: C.white, border: `1px solid ${C.gray300}`, padding: '8px', borderRadius: '4px' }}>
                                            <div style={{ fontSize: '10px', color: C.gray500, textTransform: 'uppercase' }}>Jwb Benar</div>
                                            <div style={{ fontWeight: 'bold', fontSize: '14px', color: C.gray800, marginTop: '2px' }}>{cfitSub.scores.raw_score} / 50</div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div style={{ fontSize: '14px', color: C.gray400, padding: '24px 0', fontStyle: 'italic' }}>Belum ada hasil CFIT</div>
                            )}
                        </div>
                    </div>

                    {/* 2. KRAEPELIN */}
                    <div style={{ flex: 1 }}>
                        <h3 style={{ fontWeight: 'bold', color: C.white, backgroundColor: C.teal800, padding: '6px 12px', marginBottom: '12px', display: 'inline-block', fontSize: '14px' }}>2. Performa Kerja (Kraepelin)</h3>
                        <div style={{ border: `1px solid ${C.gray300}`, borderRadius: '8px', overflow: 'hidden', textAlign: 'center' }}>
                            {kraepelinSub?.scores ? (
                                <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
                                    <thead style={{ backgroundColor: C.gray100, borderBottom: `1px solid ${C.gray300}`, fontSize: '12px', color: C.gray600 }}>
                                        <tr>
                                            <th style={{ padding: '8px', borderRight: `1px solid ${C.gray300}` }}>Kecepatan</th>
                                            <th style={{ padding: '8px', borderRight: `1px solid ${C.gray300}` }}>Ketelitian</th>
                                            <th style={{ padding: '8px' }}>Total Errors</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr style={{ fontWeight: 'bold', color: C.teal900, fontSize: '18px' }}>
                                            <td style={{ padding: '16px', borderRight: `1px solid ${C.gray300}` }}>{kraepelinSub.scores.panker}</td>
                                            <td style={{ padding: '16px', borderRight: `1px solid ${C.gray300}` }}>{kraepelinSub.scores.janker}</td>
                                            <td style={{ padding: '16px' }}>{totalErrors}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            ) : (
                                <div style={{ fontSize: '14px', color: C.gray400, padding: '40px 0', fontStyle: 'italic' }}>Belum ada hasil Kraepelin</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 3. PAPI KOSTICK */}
                <div>
                    <h3 style={{ fontWeight: 'bold', color: C.white, backgroundColor: C.teal800, padding: '6px 12px', marginBottom: '16px', display: 'inline-block', fontSize: '14px' }}>3. Profil Kepribadian & Gaya Kerja (PAPI Kostick)</h3>
                    {papiSub?.scores ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: '24px', rowGap: '8px', fontSize: '12px' }}>
                            {Object.entries(papiSub.scores)
                                .filter(([k]) => /^[A-Z]$/.test(k))
                                .map(([key, val]: any) => (
                                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${C.gray200}`, paddingBottom: '6px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontWeight: '900', color: C.teal800, width: '16px' }}>{key}</span>
                                        <span style={{ color: C.gray500 }}>{getPapiName(key)}</span>
                                    </div>
                                    <span style={{ fontWeight: 'bold', backgroundColor: C.gray100, border: `1px solid ${C.gray300}`, padding: '2px 8px', borderRadius: '4px', color: C.gray900 }}>{val}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ fontSize: '14px', color: C.gray400, padding: '24px 0', fontStyle: 'italic', textAlign: 'center', border: `1px solid ${C.gray300}`, borderRadius: '8px', backgroundColor: C.gray50 }}>Belum ada profil PAPI Kostick</div>
                    )}
                </div>

                <FooterSignature />
            </div>
        </div>
    </div>
  );
}