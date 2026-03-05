'use client';

import React, { forwardRef } from 'react';

// Interface disesuaikan dengan struktur data backend
export interface TestResultData {
  candidate_name: string;
  participant_type: 'Candidate' | 'Employee';
  id?: string | number;
  scores: {
    cfit?: { 
      iq?: number; 
      classification?: string; 
      raw_score?: number; 
    };
    kraepelin?: { 
      benar?: number; 
      salah?: number; 
      terlewat?: number; 
      kecepatan?: string; 
      ketelitian?: string; 
      keajegan?: string; 
      ketahanan?: string;
      panker?: string | number; 
      tianker?: string | number; 
      janker?: string | number; 
      hanker?: string | number; 
    };
    papi?: Record<string, number>;
  };
}

interface Props {
  data: TestResultData | null;
}

const TestReportPDF = forwardRef<HTMLDivElement, Props>(({ data }, ref) => {
  if (!data || !data.scores) return null;

  const { cfit, kraepelin, papi } = data.scores;

  // Fungsi untuk mengambil SEMUA aspek PAPI Kostick (20 Aspek)
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
      .sort((a, b) => b[1] - a[1]) // Diurutkan dari skor tertinggi
      .map(([trait, score]) => ({ 
        trait, 
        score, 
        desc: meanings[trait] || `Aspek ${trait}` 
      }));
  };

  const allPapi = getAllPapi();
  const printDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  // Menghitung Total Errors (Salah + Terlewat)
  const totalErrors = kraepelin ? (Number(kraepelin.salah || 0) + Number(kraepelin.terlewat || 0)) : '-';

  return (
    <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', overflow: 'hidden' }}>
      <div 
        ref={ref} 
        style={{ width: '210mm', minHeight: '297mm', padding: '40px', backgroundColor: '#fff', color: '#000', fontFamily: 'Arial, sans-serif', position: 'relative', boxSizing: 'border-box' }}
      >
        {/* Border Dekoratif Luar */}
        <div style={{ position: 'absolute', top: '15px', bottom: '15px', left: '15px', right: '15px', border: '2px solid #1e3a8a', padding: '25px', boxSizing: 'border-box' }}>
          
          {/* ================= HEADER KOP SURAT ================= */}
          <div style={{ textAlign: 'center', borderBottom: '3px solid #1e3a8a', paddingBottom: '20px', marginBottom: '25px' }}>
            
            {/* Logo Berjajar di Tengah dengan Divider menggunakan Relative Path */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '25px', marginBottom: '15px' }}>
              <img src="/images/logos/MBMlogo.png" alt="Logo MBM" style={{ height: '60px', objectFit: 'contain' }} />
              
              {/* Garis vertikal halus pemisah dua logo agar terlihat profesional */}
              <div style={{ height: '45px', width: '2px', backgroundColor: '#cbd5e1', borderRadius: '2px' }}></div>
              
              <img src="/images/logos/ptLogoText.png" alt="Logo Partner" style={{ height: '50px', objectFit: 'contain' }} />
            </div>

            {/* Nama Perusahaan & Judul Dokumen */}
            <h1 style={{ fontSize: '22px', color: '#1e3a8a', margin: '0 0 8px 0', letterSpacing: '1.5px', fontWeight: '900', textTransform: 'uppercase' }}>
              PSYCHOLOGICAL ASSESSMENT REPORT
            </h1>
            <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>
              Dokumen Resmi Hasil Evaluasi Psikologi Kandidat & Karyawan
            </p>
          </div>
          {/* ==================================================== */}

          {/* PROFIL PESERTA */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', backgroundColor: '#f8fafc', padding: '12px 15px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            <div>
              <p style={{ margin: 0, fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Nama Peserta</p>
              <h2 style={{ margin: '4px 0 0 0', fontSize: '18px', color: '#0f172a', fontWeight: '800' }}>{data.candidate_name}</h2>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Tipe Peserta</p>
              <h3 style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#334155', fontWeight: '700' }}>{data.participant_type === 'Employee' ? 'Karyawan Internal' : 'Kandidat'}</h3>
            </div>
          </div>

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

            {/* KRAEPELIN CARD GRID (3 Kotak Utama) */}
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

          {/* 3. HASIL PAPI KOSTICK (20 Aspek dalam 2 Kolom) */}
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
                    {p.score}
                  </div>
                </div>
              )) : (
                <p style={{ fontSize: '12px', color: '#64748b', gridColumn: 'span 2', textAlign: 'center', padding: '20px 0' }}>Data PAPI Kostick belum tersedia untuk peserta ini.</p>
              )}
            </div>
          </div>

          {/* FOOTER */}
          <div style={{ position: 'absolute', bottom: '30px', right: '30px', left: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <p style={{ fontSize: '9px', color: '#94a3b8', margin: 0, fontWeight: 'bold' }}>Sistem HR Terintegrasi</p>
              <p style={{ fontSize: '9px', color: '#94a3b8', margin: '2px 0 0 0' }}>ID Dokumen: DOC-{data.id || 'N/A'} | Dicetak: {printDate}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '11px', margin: '0 0 40px 0', color: '#64748b' }}>Authorized Assessor,</p>
              <p style={{ fontSize: '13px', fontWeight: 'bold', margin: 0, textDecoration: 'underline', color: '#0f172a' }}>HR Department</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
});

TestReportPDF.displayName = 'TestReportPDF';

export default TestReportPDF;