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

export default function CandidateFinalReport({ 
  candidateName, 
  candidateNik = "CAND-000", 
  jobPosition = "Posisi Tidak Diketahui", 
  evaluations, 
  submissions 
}: ReportProps) {
  
  // ... (Kalkulasi Skor & Mapping PAPI tetap sama seperti kode Anda) ...
  const hrEval = evaluations.find(e => e.role_type === 'HR') || evaluations[0] || null;
  const assessorName = hrEval?.evaluator_name || "-";
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
  const cfit = submissions.find(s => s.test_type === 'cfit')?.scores;
  const kraepelin = submissions.find(s => s.test_type === 'kraepelin')?.scores;
  const papi = submissions.find(s => s.test_type === 'papi')?.scores;
  const totalErrors = kraepelin ? (Number(kraepelin.salah || 0) + Number(kraepelin.terlewat || 0)) : '-';

  const getAllPapi = () => {
    if (!papi || Object.keys(papi).length === 0) return [];
    const meanings: Record<string, string> = {
      'G': 'Peran Pekerja Keras', 'L': 'Peran Kepemimpinan', 'I': 'Peran Pembuat Keputusan', 'T': 'Peran Sibuk/Kecepatan', 
      'V': 'Peran Penuh Semangat', 'S': 'Peran Hubungan Sosial', 'R': 'Peran Teoritis/Pemikir', 'D': 'Peran Bekerja Detail', 
      'C': 'Peran Terorganisir', 'E': 'Peran Pengendalian Emosi', 'N': 'Kebutuhan Menyelesaikan Tugas', 'A': 'Kebutuhan Berprestasi',
      'P': 'Kebutuhan Mengontrol Orang Lain', 'X': 'Kebutuhan Diperhatikan', 'B': 'Kebutuhan Diterima Kelompok', 'O': 'Kebutuhan Kedekatan',
      'Z': 'Kebutuhan Berubah', 'K': 'Kebutuhan Agresif/Keras Kepala', 'F': 'Kebutuhan Mendukung Atasan', 'W': 'Kebutuhan Aturan/Arahan'
    };
    return Object.entries(papi).map(([trait, score]) => ({ trait, score, desc: meanings[trait] || `Aspek ${trait}` }));
  };
  const allPapi = getAllPapi();
  const printDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  // REUSABLE COMPONENTS
  const HeaderKop = ({ title }: { title: string }) => (
    <div style={{ textAlign: 'center', borderBottom: '3px solid #1e3a8a', paddingBottom: '10px', marginBottom: '15px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginBottom: '10px' }}>
        <img src="/images/logos/MBMlogo.png" alt="Logo" style={{ height: '45px' }} />
        <div style={{ height: '35px', width: '2px', backgroundColor: '#cbd5e1' }}></div>
        <img src="/images/logos/ptLogoText.png" alt="Logo" style={{ height: '40px' }} />
      </div>
      <h1 style={{ fontSize: '18px', color: '#1e3a8a', margin: '0', fontWeight: '900' }}>{title}</h1>
    </div>
  );

  const FooterSignature = () => (
    <div style={{ position: 'absolute', bottom: '40px', left: '40px', right: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
      <p style={{ fontSize: '9px', color: '#94a3b8' }}>ID: {candidateNik} | {printDate}</p>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '11px', margin: '0 0 35px 0' }}>Authorized Assessor,</p>
        <p style={{ fontSize: '12px', fontWeight: 'bold', borderTop: '1px solid #000', paddingTop: '5px' }}>HR Department</p>
      </div>
    </div>
  );

  return (
    <div style={{ width: '210mm', backgroundColor: '#ffffff' }}>
      
      {/* HALAMAN 1 */}
      <div style={{ width: '210mm', height: '296mm', padding: '20mm', boxSizing: 'border-box', position: 'relative' }}>
        <div style={{ border: '2px solid #1e3a8a', height: '100%', padding: '10mm', position: 'relative', boxSizing: 'border-box' }}>
          <HeaderKop title="FINAL ASSESSMENT REPORT (INTERVIEW)" />
          
          <div style={{ marginBottom: '15px', backgroundColor: '#f8fafc', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
            <p style={{ fontSize: '12px', fontWeight: 'bold' }}>{candidateNik} - {candidateName}</p>
            <p style={{ fontSize: '10px', color: '#1e3a8a' }}>{jobPosition}</p>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <div style={{ flex: 1, border: '1px solid #e2e8f0', textAlign: 'center', padding: '10px' }}>
              <p style={{ fontSize: '9px', textTransform: 'uppercase' }}>Interview Score</p>
              <p style={{ fontSize: '20px', fontWeight: '900', color: '#1e3a8a' }}>{competencyScore}%</p>
            </div>
            <div style={{ flex: 1, border: '1px solid #e2e8f0', textAlign: 'center', padding: '10px' }}>
              <p style={{ fontSize: '9px', textTransform: 'uppercase' }}>Value Score</p>
              <p style={{ fontSize: '20px', fontWeight: '900', color: '#1e3a8a' }}>{behaviorScore}%</p>
            </div>
          </div>

          <div style={{ backgroundColor: '#eff6ff', padding: '15px', borderRadius: '4px', border: '1px solid #bfdbfe', marginBottom: '20px' }}>
             <p style={{ fontSize: '10px', fontWeight: 'bold' }}>TOTAL SCORE: {totalScore.toFixed(2)}%</p>
          </div>

          <div style={{ width: '100%', height: '150px', border: '2px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#94a3b8' }}>
             Dokumentasi Wawancara
          </div>

          <FooterSignature />
        </div>
      </div>

      {/* FORCE PAGE BREAK - Sangat Penting untuk html2pdf */}
      <div className="html2pdf__page-break"></div>

      {/* HALAMAN 2 */}
      <div style={{ width: '210mm', height: '296mm', padding: '20mm', boxSizing: 'border-box', position: 'relative' }}>
        <div style={{ border: '2px solid #1e3a8a', height: '100%', padding: '10mm', position: 'relative', boxSizing: 'border-box' }}>
          <HeaderKop title="PSYCHOLOGICAL ASSESSMENT REPORT (TEST)" />
          
          {/* CFIT & KRAEPELIN */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
             <div style={{ flex: 1, padding: '10px', border: '1px solid #e2e8f0', borderTop: '3px solid #3b82f6' }}>
                <p style={{ fontSize: '11px', fontWeight: 'bold' }}>1. CFIT Score</p>
                <p style={{ fontSize: '16px', fontWeight: 'bold' }}>IQ: {cfit?.iq || '-'}</p>
             </div>
             <div style={{ flex: 1, padding: '10px', border: '1px solid #e2e8f0', borderTop: '3px solid #10b981' }}>
                <p style={{ fontSize: '11px', fontWeight: 'bold' }}>2. Kraepelin</p>
                <p style={{ fontSize: '12px' }}>Speed: {kraepelin?.panker || '-'}</p>
             </div>
          </div>

          {/* PAPI KOSTICK */}
          <div style={{ padding: '10px', border: '1px solid #e2e8f0', borderTop: '3px solid #8b5cf6' }}>
            <p style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '10px' }}>3. PAPI Kostick Profile</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
              {allPapi.slice(0, 20).map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', borderBottom: '1px dashed #eee' }}>
                  <span>{p.trait} {p.desc}</span>
                  <span style={{ fontWeight: 'bold' }}>{String(p.score)}</span>
                </div>
              ))}
            </div>
          </div>

          <FooterSignature />
        </div>
      </div>

    </div>
  );
}