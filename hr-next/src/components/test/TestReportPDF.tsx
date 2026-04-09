'use client';

import React, { forwardRef } from 'react';
import { getPapiInterpretation, getPapiTraitName, extractPapiLetter } from '@/utils/papiScoring';

export interface TestResultData {
  candidate_name: string;
  participant_type: 'Candidate' | 'Employee';
  id?: string | number;
  scores: {
    cfit?: { iq?: number; classification?: string; raw_score?: number; };
    kraepelin?: { salah?: number; terlewat?: number; kecepatan?: string; ketelitian?: string; panker?: string | number; janker?: string | number; };
    papi?: Record<string, number>;
  };
}

interface Props {
  data: TestResultData | null;
}

const TestReportPDF = forwardRef<HTMLDivElement, Props>(({ data }, ref) => {
  if (!data || !data.scores) return null;

  const { cfit, kraepelin, papi } = data.scores;

  const getAllPapi = () => {
    if (!papi || Object.keys(papi).length === 0) return [];
    
    return Object.entries(papi)
      .sort((a, b) => b[1] - a[1]) // Diurutkan dari skor tertinggi
      .map(([trait, score]) => ({ 
        letter: extractPapiLetter(trait), // Ambil hurufnya
        score, 
        traitName: getPapiTraitName(trait),
        desc: getPapiInterpretation(trait, score) 
      }));
  };

  const allPapi = getAllPapi();
  const printDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const totalErrors = kraepelin ? (Number(kraepelin.salah || 0) + Number(kraepelin.terlewat || 0)) : '-';

  return (
    <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', overflow: 'hidden' }}>
      <div 
        ref={ref} 
        style={{ width: '210mm', minHeight: '297mm', padding: '30px', backgroundColor: '#fff', color: '#000', fontFamily: 'Arial, sans-serif', position: 'relative', boxSizing: 'border-box' }}
      >
        <div style={{ position: 'absolute', top: '15px', bottom: '15px', left: '15px', right: '15px', border: '2px solid #1e3a8a', padding: '20px', boxSizing: 'border-box' }}>
          
          {/* HEADER */}
          <div style={{ textAlign: 'center', borderBottom: '2px solid #1e3a8a', paddingBottom: '12px', marginBottom: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginBottom: '10px' }}>
              <img src="/images/logos/MBMlogo.png" alt="Logo MBM" style={{ height: '45px', objectFit: 'contain' }} />
              <div style={{ height: '35px', width: '2px', backgroundColor: '#cbd5e1' }}></div>
              <img src="/images/logos/ptLogoText.png" alt="Logo Partner" style={{ height: '40px', objectFit: 'contain' }} />
            </div>
            <h1 style={{ fontSize: '18px', color: '#1e3a8a', margin: '0 0 4px 0', letterSpacing: '1px', fontWeight: '900' }}>PSYCHOLOGICAL ASSESSMENT REPORT</h1>
            <p style={{ fontSize: '9px', color: '#64748b', margin: 0 }}>Dokumen Resmi Hasil Evaluasi Psikologi Kandidat & Karyawan</p>
          </div>

          {/* PROFIL */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', backgroundColor: '#f8fafc', padding: '8px 12px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
            <div>
              <p style={{ margin: 0, fontSize: '8px', color: '#64748b', fontWeight: 'bold' }}>NAMA PESERTA</p>
              <h2 style={{ margin: '2px 0 0 0', fontSize: '16px', color: '#0f172a', fontWeight: '800' }}>{data.candidate_name}</h2>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '8px', color: '#64748b', fontWeight: 'bold' }}>TIPE PESERTA</p>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#334155', fontWeight: '700' }}>{data.participant_type === 'Employee' ? 'Karyawan Internal' : 'Kandidat'}</h3>
            </div>
          </div>

          {/* HASIL CFIT & KRAEPELIN */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <div style={{ flex: '1', backgroundColor: '#fff', padding: '10px', border: '1px solid #e2e8f0', borderTop: '3px solid #3b82f6', borderRadius: '4px' }}>
              <h3 style={{ marginTop: 0, fontSize: '11px', color: '#1e40af', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '8px', fontWeight: 'bold' }}>1. Kecerdasan Kognitif (CFIT)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                <div style={{ backgroundColor: '#f8fafc', padding: '6px', borderRadius: '4px', textAlign: 'center' }}><p style={{ fontSize: '8px', color: '#64748b', margin: 0, fontWeight: 'bold' }}>Skor IQ</p><p style={{ fontSize: '14px', fontWeight: '900', margin: '2px 0 0 0', color: '#1e40af' }}>{cfit?.iq || '-'}</p></div>
                <div style={{ backgroundColor: '#f8fafc', padding: '6px', borderRadius: '4px', textAlign: 'center' }}><p style={{ fontSize: '8px', color: '#64748b', margin: 0, fontWeight: 'bold' }}>Klasifikasi</p><p style={{ fontSize: '10px', fontWeight: 'bold', margin: '2px 0 0 0', color: '#0f172a' }}>{cfit?.classification || '-'}</p></div>
                <div style={{ backgroundColor: '#f8fafc', padding: '6px', borderRadius: '4px', textAlign: 'center' }}><p style={{ fontSize: '8px', color: '#64748b', margin: 0, fontWeight: 'bold' }}>Jwb Benar</p><p style={{ fontSize: '14px', fontWeight: 'bold', margin: '2px 0 0 0', color: '#0f172a' }}>{cfit?.raw_score ?? '-'}</p></div>
              </div>
            </div>
            <div style={{ flex: '1', backgroundColor: '#fff', padding: '10px', border: '1px solid #e2e8f0', borderTop: '3px solid #10b981', borderRadius: '4px' }}>
              <h3 style={{ marginTop: 0, fontSize: '11px', color: '#065f46', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '8px', fontWeight: 'bold' }}>2. Performa Kerja (Kraepelin)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                <div style={{ backgroundColor: '#fcf8ea', padding: '6px', borderRadius: '4px', textAlign: 'center' }}><p style={{ fontSize: '8px', color: '#b45309', margin: 0, fontWeight: 'bold' }}>Kecepatan</p><p style={{ fontSize: '14px', fontWeight: 'bold', margin: '2px 0 0 0', color: '#78350f' }}>{kraepelin?.kecepatan || kraepelin?.panker || '-'}</p></div>
                <div style={{ backgroundColor: '#f0fdf4', padding: '6px', borderRadius: '4px', textAlign: 'center' }}><p style={{ fontSize: '8px', color: '#15803d', margin: 0, fontWeight: 'bold' }}>Ketelitian</p><p style={{ fontSize: '14px', fontWeight: 'bold', margin: '2px 0 0 0', color: '#14532d' }}>{kraepelin?.ketelitian || kraepelin?.janker || '-'}</p></div>
                <div style={{ backgroundColor: '#fef2f2', padding: '6px', borderRadius: '4px', textAlign: 'center' }}><p style={{ fontSize: '8px', color: '#ef4444', margin: 0, fontWeight: 'bold' }}>Total Errors</p><p style={{ fontSize: '14px', fontWeight: '900', margin: '2px 0 0 0', color: '#b91c1c' }}>{totalErrors}</p></div>
              </div>
            </div>
          </div>

          {/* HASIL PAPI KOSTICK (KEMBALI KE 2 KOLOM TAPI SANGAT COMPACT & ANTI TERPOTONG) */}
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
                      {p.score}
                    </div>
                  </div>
                  <div style={{ fontSize: '8px', color: '#475569', fontStyle: 'italic', lineHeight: '1.2' }}>
                    {p.desc}
                  </div>
                </div>
              )) : (
                <p style={{ fontSize: '10px', color: '#64748b', gridColumn: 'span 2', textAlign: 'center', padding: '10px 0' }}>Data PAPI Kostick belum tersedia.</p>
              )}
            </div>
          </div>

          {/* FOOTER */}
          <div style={{ position: 'absolute', bottom: '20px', right: '20px', left: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <p style={{ fontSize: '8px', color: '#94a3b8', margin: 0, fontWeight: 'bold' }}>Sistem HR Terintegrasi</p>
              <p style={{ fontSize: '8px', color: '#94a3b8', margin: '2px 0 0 0' }}>ID Dokumen: DOC-{data.id || 'N/A'} | Dicetak: {printDate}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '9px', margin: '0 0 30px 0', color: '#64748b' }}>Authorized Assessor,</p>
              <p style={{ fontSize: '11px', fontWeight: 'bold', margin: 0, textDecoration: 'underline', color: '#0f172a' }}>HR Department</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
});

TestReportPDF.displayName = 'TestReportPDF';

export default TestReportPDF;