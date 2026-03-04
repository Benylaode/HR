'use client';

import React, { forwardRef } from 'react';

// Sesuaikan tipe data dengan struktur data backend Anda
interface TestData {
  candidate_name: string;
  participant_type: string;
  id: string | number;
  scores: {
    cfit?: { iq: number; classification: string };
    kraepelin?: { panker: number; tianker: number; janker: number; hanker: number };
    papi?: Record<string, number>;
  };
}

interface Props {
  data: TestData | null;
}

const TestReportPDF = forwardRef<HTMLDivElement, Props>(({ data }, ref) => {
  if (!data) return null;

  const { cfit, kraepelin, papi } = data.scores || {};

  // Fungsi untuk mengambil 3 karakter PAPI Kostick tertinggi
  const getTopPapi = () => {
    if (!papi || Object.keys(papi).length === 0) return [];
    
    const papiMeanings: Record<string, string> = {
      'G': 'Pekerja Keras (Berorientasi pada tugas)', 'L': 'Kepemimpinan (Dorongan memimpin)',
      'I': 'Pengambil Keputusan (Yakin & Cepat)', 'T': 'Bekerja Cepat (Pace)',
      'V': 'Penuh Energi (Vigorous)', 'S': 'Mudah Bergaul (Social)',
      'R': 'Pemikir Teoritis (Konseptor)', 'D': 'Bekerja Teliti (Detail)',
      'C': 'Terorganisir (Organized)'
    };

    return Object.entries(papi)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([trait, score]) => ({
        trait,
        score,
        desc: papiMeanings[trait] || `Karakter ${trait}`
      }));
  };

  const topPapi = getTopPapi();
  const printDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    // Wrapper disembunyikan agar tidak merusak UI, tapi tetap bisa dibaca oleh html2pdf
    <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
      <div 
        ref={ref} 
        style={{ width: '210mm', minHeight: '297mm', padding: '40px', backgroundColor: '#ffffff', color: '#333', fontFamily: 'Arial, sans-serif', position: 'relative' }}
      >
        {/* Border Dekoratif */}
        <div style={{ position: 'absolute', top: '20px', bottom: '20px', left: '20px', right: '20px', border: '2px solid #1e3a8a', padding: '20px' }}>
          
          {/* HEADER */}
          <div style={{ textAlign: 'center', borderBottom: '2px solid #e5e7eb', paddingBottom: '20px', marginBottom: '30px' }}>
             {/* Gunakan gambar logo dari folder public Anda */}
            <img src="/images/logos/MBM.png" alt="Company Logo" style={{ height: '60px', marginBottom: '10px' }} />
            <h1 style={{ fontSize: '24px', color: '#1e3a8a', margin: '0', letterSpacing: '2px' }}>PSYCHOLOGICAL ASSESSMENT REPORT</h1>
            <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '5px' }}>Dokumen Resmi Hasil Evaluasi Psikologi</p>
          </div>

          {/* PROFIL PESERTA */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
            <div>
              <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>Nama Peserta</p>
              <h2 style={{ margin: 0, fontSize: '20px', color: '#111' }}>{data.candidate_name}</h2>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>Tipe Peserta</p>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#374151' }}>{data.participant_type === 'Candidate' ? 'Kandidat' : 'Karyawan'}</h3>
            </div>
          </div>

          {/* 1. HASIL CFIT */}
          <div style={{ marginBottom: '30px', backgroundColor: '#f8fafc', padding: '15px', borderLeft: '4px solid #3b82f6' }}>
            <h3 style={{ marginTop: 0, fontSize: '16px', color: '#1e40af', borderBottom: '1px solid #cbd5e1', paddingBottom: '5px' }}>1. Kecerdasan Kognitif (CFIT)</h3>
            <div style={{ display: 'flex', gap: '40px', marginTop: '10px' }}>
              <div><p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Skor IQ</p><p style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>{cfit?.iq || '-'}</p></div>
              <div><p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Klasifikasi</p><p style={{ fontSize: '18px', fontWeight: 'bold', margin: '8px 0 0 0' }}>{cfit?.classification || '-'}</p></div>
            </div>
          </div>

          {/* 2. HASIL KRAEPELIN */}
          <div style={{ marginBottom: '30px', backgroundColor: '#f8fafc', padding: '15px', borderLeft: '4px solid #10b981' }}>
            <h3 style={{ marginTop: 0, fontSize: '16px', color: '#065f46', borderBottom: '1px solid #cbd5e1', paddingBottom: '5px' }}>2. Performa Kerja (Kraepelin)</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
              <div style={{ textAlign: 'center' }}><p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Kecepatan</p><p style={{ fontSize: '18px', fontWeight: 'bold', margin: '5px 0 0 0' }}>{kraepelin?.panker || '-'}</p></div>
              <div style={{ textAlign: 'center' }}><p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Ketelitian</p><p style={{ fontSize: '18px', fontWeight: 'bold', margin: '5px 0 0 0' }}>{kraepelin?.tianker || '-'}</p></div>
              <div style={{ textAlign: 'center' }}><p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Keajegan</p><p style={{ fontSize: '18px', fontWeight: 'bold', margin: '5px 0 0 0' }}>{kraepelin?.janker || '-'}</p></div>
              <div style={{ textAlign: 'center' }}><p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Ketahanan</p><p style={{ fontSize: '18px', fontWeight: 'bold', margin: '5px 0 0 0' }}>{kraepelin?.hanker || '-'}</p></div>
            </div>
          </div>

          {/* 3. HASIL PAPI KOSTICK */}
          <div style={{ marginBottom: '40px', backgroundColor: '#f8fafc', padding: '15px', borderLeft: '4px solid #8b5cf6' }}>
            <h3 style={{ marginTop: 0, fontSize: '16px', color: '#5b21b6', borderBottom: '1px solid #cbd5e1', paddingBottom: '5px' }}>3. Profil Kepribadian (PAPI Kostick)</h3>
            <ul style={{ margin: '10px 0 0 0', paddingLeft: '20px', fontSize: '14px', lineHeight: '1.6' }}>
              {topPapi.length > 0 ? topPapi.map((item, idx) => (
                <li key={idx}><strong>{item.desc}</strong> (Skor: {item.score})</li>
              )) : <li>Belum ada data PAPI Kostick.</li>}
            </ul>
          </div>

          {/* FOOTER */}
          <div style={{ position: 'absolute', bottom: '40px', right: '40px', left: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <p style={{ fontSize: '10px', color: '#94a3b8', margin: 0 }}>ID Dok: DOC-{data.id}</p>
              <p style={{ fontSize: '10px', color: '#94a3b8', margin: 0 }}>Dicetak: {printDate}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '14px', margin: '0 0 40px 0' }}>Mengetahui,</p>
              <p style={{ fontSize: '14px', fontWeight: 'bold', margin: 0, textDecoration: 'underline' }}>HR Department</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
});

TestReportPDF.displayName = 'TestReportPDF';

export default TestReportPDF;