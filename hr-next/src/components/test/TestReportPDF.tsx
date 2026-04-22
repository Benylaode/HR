'use client';

import React, { forwardRef } from 'react';
import { getPapiInterpretation, getPapiTraitName, extractPapiLetter } from '@/utils/papiScoring';

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
      salah?: number; 
      terlewat?: number; 
      kecepatan?: string; 
      ketelitian?: string; 
      panker?: string | number; 
      janker?: string | number; 
      totalErrors?: string | number;
      hanker?: string | number;
      gradeSpeed?: string;
      gradeAccuracy?: string;
      gradeEndurance?: string;
      raw_answers?: any; // Diperlukan untuk proses healing
    };
    papi?: Record<string, number>;
  };
}

interface Props {
  data: TestResultData | null;
}

const TestReportPDF = forwardRef<HTMLDivElement, Props>(({ data }, ref) => {
  if (!data || !data.scores) return null;

  // =====================================
  // 1. PENGAMBILAN DATA PSIKOTES
  // =====================================
  const { cfit = {}, kraepelin = {}, papi = {} } = data.scores;

  // Standardisasi Variabel Tampilan CFIT
  const iqScore = cfit.iq || '-';
  const cfitClass = cfit.classification || '-';
  const cfitRaw = cfit.raw_score ?? '-';

  // =====================================
  // 2. LOGIKA AUTO-HEALING KRAEPELIN
  // =====================================
  const kraepelinPanker = kraepelin.panker ?? kraepelin.kecepatan ?? '-';
  const totalErrors = kraepelin.totalErrors ?? kraepelin.salah ?? '-';
  let kraepelinHanker: string | number = kraepelin.hanker ?? '-';

  // JIKA HANKER KOSONG ATAU STRIP, HITUNG DARI DATA MENTAH (HEALING)
  if ((kraepelinHanker === '-' || !kraepelinHanker) && kraepelin.raw_answers) {
    try {
      // Parsing raw_answers (bisa string JSON atau array/objek)
      let raw = typeof kraepelin.raw_answers === 'string' 
                ? JSON.parse(kraepelin.raw_answers) 
                : kraepelin.raw_answers;
      
      // Normalisasi format: Ubah Object ke Array jika perlu
      let rawDataArray: any[] = [];
      if (Array.isArray(raw)) {
        rawDataArray = raw;
      } else if (raw && typeof raw === 'object') {
        rawDataArray = Object.keys(raw)
          .sort((a, b) => Number(a) - Number(b))
          .map(k => raw[k]);
      }

      if (rawDataArray.length > 1) {
        // Ekstrak nilai Benar (y_values)
        const y_values = rawDataArray.map((item: any) => {
          if (typeof item === 'object' && item !== null) {
            return Number(item.correct || item.benar || 0);
          }
          return Number(item || 0);
        }).filter(v => !isNaN(v));

        const N = y_values.length;
        if (N > 1) {
          let sx = 0, sy = 0, sx2 = 0, sxy = 0;
          for (let i = 0; i < N; i++) {
            const x = i + 1;
            const y = y_values[i];
            sx += x; sy += y; sx2 += (x * x); sxy += (x * y);
          }
          const denom = (N * sx2) - (sx * sx);
          const b = denom !== 0 ? ((N * sxy) - (sx * sy)) / denom : 0;
          
          // Nilai Hanker (Multiplier 50)
          kraepelinHanker = Number((b * 50).toFixed(3));
        }
      }
    } catch (e) {
      console.error("Auto-healing gagal pada PDF:", e);
    }
  }

  // =====================================
  // 3. PENENTUAN KETERANGAN (GRADE)
  // =====================================
  const getSpeedLabel = (n: any) => {
    if (n === '-' || n === undefined) return '-';
    const v = Number(n);
    if (v > 17.21) return "Baik Sekali";
    if (v >= 14.973) return "Baik";
    if (v >= 12.736) return "Sedang";
    if (v >= 10.5) return "Kurang";
    return "Kurang Sekali";
  };

  const getAccuracyLabel = (n: any) => {
    if (n === '-' || n === undefined) return '-';
    const v = Number(n);
    if (v <= 0) return "Baik Sekali";
    if (v <= 2) return "Baik";
    if (v <= 13) return "Sedang";
    if (v <= 22) return "Kurang";
    return "Kurang Sekali";
  };

  const getEnduranceLabel = (n: any) => {
    if (n === '-' || n === undefined) return '-';
    const v = Number(n);
    if (v > 2.496) return "Baik Sekali";
    if (v >= 1.015) return "Baik";
    if (v >= -0.468) return "Sedang";
    if (v >= -1.95) return "Kurang";
    return "Kurang Sekali";
  };

  // Menggunakan Grade yang sudah dikirim dari API, atau hitung otomatis jika kosong
  const labelCepat = kraepelin.gradeSpeed || getSpeedLabel(kraepelinPanker);
  const labelTeliti = kraepelin.gradeAccuracy || getAccuracyLabel(totalErrors);
  const labelTahan = kraepelin.gradeEndurance || getEnduranceLabel(kraepelinHanker);

  const getAllPapi = () => {
    if (!papi || Object.keys(papi).length === 0) return [];
    
    return Object.entries(papi)
      .sort((a, b) => b[1] - a[1]) // Diurutkan dari skor tertinggi
      .map(([trait, score]) => ({ 
        letter: extractPapiLetter(trait), 
        score, 
        traitName: getPapiTraitName(trait),
        desc: getPapiInterpretation(trait, score) 
      }));
  };

  const allPapi = getAllPapi();
  const printDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

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
            
            {/* CFIT */}
            <div style={{ flex: '1', backgroundColor: '#fff', padding: '10px', border: '1px solid #e2e8f0', borderTop: '3px solid #3b82f6', borderRadius: '4px' }}>
              <h3 style={{ marginTop: 0, fontSize: '11px', color: '#1e40af', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '8px', fontWeight: 'bold' }}>1. Kecerdasan Kognitif (CFIT)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                <div style={{ backgroundColor: '#f8fafc', padding: '6px', borderRadius: '4px', textAlign: 'center' }}>
                  <p style={{ fontSize: '8px', color: '#64748b', margin: 0, fontWeight: 'bold', textTransform: 'uppercase' }}>Skor IQ</p>
                  <p style={{ fontSize: '14px', fontWeight: '900', margin: '2px 0 0 0', color: '#1e40af' }}>{iqScore}</p>
                </div>
                <div style={{ backgroundColor: '#f8fafc', padding: '6px', borderRadius: '4px', textAlign: 'center' }}>
                  <p style={{ fontSize: '8px', color: '#64748b', margin: 0, fontWeight: 'bold', textTransform: 'uppercase' }}>Klasifikasi</p>
                  <p style={{ fontSize: '10px', fontWeight: 'bold', margin: '2px 0 0 0', color: '#0f172a' }}>{cfitClass}</p>
                </div>
                <div style={{ backgroundColor: '#f8fafc', padding: '6px', borderRadius: '4px', textAlign: 'center' }}>
                  <p style={{ fontSize: '8px', color: '#64748b', margin: 0, fontWeight: 'bold', textTransform: 'uppercase' }}>Jwb Benar</p>
                  <p style={{ fontSize: '14px', fontWeight: 'bold', margin: '2px 0 0 0', color: '#0f172a' }}>{cfitRaw}</p>
                </div>
              </div>
            </div>

            {/* KRAEPELIN (3 POIN UTAMA BESERTA KETERANGAN) */}
            <div style={{ flex: '1', backgroundColor: '#fff', padding: '10px', border: '1px solid #e2e8f0', borderTop: '3px solid #10b981', borderRadius: '4px' }}>
              <h3 style={{ marginTop: 0, fontSize: '11px', color: '#065f46', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '8px', fontWeight: 'bold' }}>2. Performa Kerja (Kraepelin)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                
                {/* CEPAT */}
                <div style={{ backgroundColor: '#fcf8ea', padding: '6px', borderRadius: '4px', textAlign: 'center' }}>
                  <p style={{ fontSize: '8px', color: '#b45309', margin: 0, fontWeight: 'bold', textTransform: 'uppercase' }}>Cepat</p>
                  <p style={{ fontSize: '14px', fontWeight: 'bold', margin: '2px 0 0 0', color: '#78350f' }}>{kraepelinPanker}</p>
                  <p style={{ fontSize: '7px', fontWeight: 'bold', marginTop: '3px', textTransform: 'uppercase', color: '#b45309', backgroundColor: '#fef3c7', padding: '2px', borderRadius: '2px', display: 'inline-block' }}>
                    {labelCepat}
                  </p>
                </div>

                {/* TELITI */}
                <div style={{ backgroundColor: '#fef2f2', padding: '6px', borderRadius: '4px', textAlign: 'center' }}>
                  <p style={{ fontSize: '8px', color: '#ef4444', margin: 0, fontWeight: 'bold', textTransform: 'uppercase' }}>Teliti</p>
                  <p style={{ fontSize: '14px', fontWeight: '900', margin: '2px 0 0 0', color: '#b91c1c' }}>{totalErrors}</p>
                  <p style={{ fontSize: '7px', fontWeight: 'bold', marginTop: '3px', textTransform: 'uppercase', color: '#ef4444', backgroundColor: '#fee2e2', padding: '2px', borderRadius: '2px', display: 'inline-block' }}>
                    {labelTeliti}
                  </p>
                </div>

                {/* TAHAN */}
                <div style={{ backgroundColor: '#faf5ff', padding: '6px', borderRadius: '4px', textAlign: 'center' }}>
                  <p style={{ fontSize: '8px', color: '#9333ea', margin: 0, fontWeight: 'bold', textTransform: 'uppercase' }}>Tahan</p>
                  <p style={{ fontSize: '14px', fontWeight: '900', margin: '2px 0 0 0', color: '#5b21b6' }}>{kraepelinHanker}</p>
                  <p style={{ fontSize: '7px', fontWeight: 'bold', marginTop: '3px', textTransform: 'uppercase', color: '#9333ea', backgroundColor: '#f3e8ff', padding: '2px', borderRadius: '2px', display: 'inline-block' }}>
                    {labelTahan}
                  </p>
                </div>

              </div>
            </div>
          </div>

          {/* HASIL PAPI KOSTICK */}
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
                    Interpretasi: "{p.desc}"
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