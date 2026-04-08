'use client';

import React from 'react';
import { Camera } from 'lucide-react';

interface ReportProps {
  candidateName: string;
  candidateNik?: string;
  jobPosition?: string;
  evaluations: any[]; // Data dari Form Penilaian (HR/User)
  submissions: any[]; // Data dari Hasil Tes (CFIT, PAPI, Kraepelin)
}

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
  
  // Mengambil form HR sebagai acuan utama
  const hrEval = evaluations.find(e => e.role_type === 'HR') || evaluations[0] || null;
  
  // MENGAMBIL DATA NAMA, JABATAN & TANGGAL ASSESOR
  const assessorName = hrEval?.evaluator_name || "-";
  const assessorPosition = hrEval?.evaluator_position || "HR Department";
  const evaluationDateRaw = hrEval?.evaluation_date;
  
  // Format Tanggal (Jika ada, format ke Indonesia. Jika tidak, gunakan tanggal cetak)
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
      
      // Max score kompetensi (16 soal * 5) = 80, Value Behavior (15 soal * 5) = 75
      competencyScore = Math.round((compTotal / 80) * 100) || 0;
      behaviorScore = Math.round((behavTotal / 75) * 100) || 0;
  }

  const totalScore = (competencyScore + behaviorScore) / 2;

  // Menentukan Kategori
  let categoryRemarks = "";
  let categoryStatus = "";
  let categoryReadyness = "";

  if (totalScore < 50) {
      categoryRemarks = "Unacceptable"; categoryStatus = "Not Recommended"; categoryReadyness = "-";
  } else if (totalScore < 70) {
      categoryRemarks = "Below Expectation"; categoryStatus = "Considered"; categoryReadyness = "R3";
  } else if (totalScore < 80) {
      categoryRemarks = "Fully Successful"; categoryStatus = "Recommended"; categoryReadyness = "R1";
  } else if (totalScore < 90) {
      categoryRemarks = "Above Expectation"; categoryStatus = "Highly Recommended"; categoryReadyness = "R1";
  } else {
      categoryRemarks = "Outstanding"; categoryStatus = "Highly Recommended"; categoryReadyness = "R1";
  }

  // =====================================
  // DATA HALAMAN 2 (HASIL PSIKOTES)
  // =====================================
  const cfitSub = submissions.find(s => s.test_type === 'cfit');
  const kraepelinSub = submissions.find(s => s.test_type === 'kraepelin');
  const papiSub = submissions.find(s => s.test_type === 'papi');

  // Helper untuk PAPI
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
    <div style={{ position: 'absolute', bottom: '30px', left: '40px', right: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
      <div>
         <p style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold', margin: '0 0 2px 0' }}>Sistem HR Terintegrasi</p>
         <p style={{ fontSize: '10px', color: '#94a3b8', margin: 0 }}>ID: DOC-{candidateNik} | Dicetak: {printDate}</p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '11px', margin: '0 0 35px 0', color: '#64748b' }}>Authorized Assessor,</p>
        <p style={{ fontSize: '13px', fontWeight: 'bold', margin: 0, color: '#0f172a', textDecoration: 'underline' }}>{assessorName}</p>
        <p style={{ fontSize: '10px', color: '#64748b', margin: '2px 0 0 0' }}>{assessorPosition}</p>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-200 py-8 flex justify-center w-full min-h-screen">
        {/* WADAH PDF: 2 Halaman A4 */}
        <div id="pdf-content" className="bg-white flex flex-col gap-12" style={{ width: '210mm' }}>
            
            {/* ========================================================= */}
            {/* HALAMAN 1: REKAPITULASI INTERVIEW & VALUE */}
            {/* ========================================================= */}
            <div className="w-[210mm] min-h-[297mm] p-10 bg-white relative break-after-page shadow-xl">
                
                <h1 className="text-2xl font-bold text-center text-teal-800 mb-8 border-b-2 border-teal-800 pb-2 uppercase tracking-widest">
                    Rekapitulasi Final Evaluation
                </h1>

                {/* Identitas Assesi */}
                <div className="flex justify-between items-center mb-2">
                    <h2 className="font-bold text-teal-700 bg-teal-50 px-3 py-1 border-l-4 border-teal-700">Identitas Assesi</h2>
                    <span className="text-xs text-gray-500 font-semibold bg-gray-50 px-3 py-1 rounded border border-gray-200">
                        Tanggal Evaluasi: {evaluationDate}
                    </span>
                </div>

                <table className="w-full text-sm border-collapse border border-gray-300 mb-8">
                    <tbody>
                        <tr className="border-b border-gray-300">
                            <td className="w-1/3 p-2 font-bold bg-gray-50 border-r border-gray-300">NIK</td>
                            <td className="p-2">{candidateNik}</td>
                        </tr>
                        <tr className="border-b border-gray-300">
                            <td className="w-1/3 p-2 font-bold bg-gray-50 border-r border-gray-300">Nama Assesi</td>
                            <td className="p-2">{candidateName}</td>
                        </tr>
                        <tr>
                            <td className="w-1/3 p-2 font-bold bg-gray-50 border-r border-gray-300">Posisi Assesi</td>
                            <td className="p-2">{jobPosition}</td>
                        </tr>
                    </tbody>
                </table>

                {/* Interview / Kompetensi */}
                <h2 className="font-bold text-teal-700 bg-teal-50 px-3 py-1 mb-2 border-l-4 border-teal-700">Interview (Kompetensi)</h2>
                <table className="w-full text-sm border-collapse border border-gray-300 text-center mb-8">
                    <thead className="bg-teal-700 text-white">
                        <tr>
                            <th className="p-2 border border-teal-800 w-1/4">Assesor</th>
                            <th className="p-2 border border-teal-800">Nama Assesor</th>
                            <th className="p-2 border border-teal-800 w-1/4">Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="p-2 border border-gray-300 font-bold bg-gray-50">HR / Interviewer</td>
                            <td className="p-2 border border-gray-300">
                                {assessorName} <br/> 
                                <span className="text-xs text-gray-500 font-normal">{assessorPosition}</span>
                            </td>
                            <td className="p-2 border border-gray-300 font-bold text-lg">{competencyScore}%</td>
                        </tr>
                    </tbody>
                </table>

                {/* Value Behaviour */}
                <h2 className="font-bold text-teal-700 bg-teal-50 px-3 py-1 mb-2 border-l-4 border-teal-700">Value Behaviour</h2>
                <table className="w-full text-sm border-collapse border border-gray-300 text-center mb-8">
                    <thead className="bg-teal-700 text-white">
                        <tr>
                            <th className="p-2 border border-teal-800 w-1/4">Assesor</th>
                            <th className="p-2 border border-teal-800">Nama Assesor</th>
                            <th className="p-2 border border-teal-800 w-1/4">Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="p-2 border border-gray-300 font-bold bg-gray-50">HR / Interviewer</td>
                            <td className="p-2 border border-gray-300">
                                {assessorName} <br/> 
                                <span className="text-xs text-gray-500 font-normal">{assessorPosition}</span>
                            </td>
                            <td className="p-2 border border-gray-300 font-bold text-lg">{behaviorScore}%</td>
                        </tr>
                    </tbody>
                </table>

                {/* Summary */}
                <h2 className="font-bold text-teal-700 bg-teal-50 px-3 py-1 mb-2 border-l-4 border-teal-700">Summary</h2>
                <table className="w-full text-sm border-collapse border border-gray-300 mb-8 text-center">
                    <thead className="bg-teal-700 text-white">
                        <tr>
                            <th className="p-2 border border-teal-800 w-16">No</th>
                            <th className="p-2 border border-teal-800 text-left">Jenis Assesment</th>
                            <th className="p-2 border border-teal-800 w-1/4">Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="p-2 border border-gray-300 bg-gray-50">1</td>
                            <td className="p-2 border border-gray-300 text-left">Assesment - Kompetensi</td>
                            <td className="p-2 border border-gray-300 font-bold">{competencyScore}%</td>
                        </tr>
                        <tr>
                            <td className="p-2 border border-gray-300 bg-gray-50">2</td>
                            <td className="p-2 border border-gray-300 text-left">Assesment - Value Behavior</td>
                            <td className="p-2 border border-gray-300 font-bold">{behaviorScore}%</td>
                        </tr>
                        <tr className="bg-teal-50">
                            <td colSpan={2} className="p-2 border border-gray-300 font-bold text-right text-teal-800">Total Score</td>
                            <td className="p-2 border border-gray-300 font-black text-teal-800 text-lg">{totalScore.toFixed(2)}%</td>
                        </tr>
                    </tbody>
                </table>

                {/* Kategori Keputusan */}
                <table className="w-full text-xs border-collapse border border-gray-300 text-center mb-8">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-2 border border-gray-300">Skor</th>
                            <th className="p-2 border border-gray-300">Remarks</th>
                            <th className="p-2 border border-gray-300">Status</th>
                            <th className="p-2 border border-gray-300">Readyness</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className={totalScore < 50 ? 'bg-yellow-200 font-bold' : ''}>
                            <td className="p-2 border border-gray-300">&lt;50%</td><td className="p-2 border border-gray-300">Unacceptable</td><td className="p-2 border border-gray-300">Not Recommended</td><td className="p-2 border border-gray-300">-</td>
                        </tr>
                        <tr className={totalScore >= 50 && totalScore < 70 ? 'bg-yellow-200 font-bold' : ''}>
                            <td className="p-2 border border-gray-300">≥50 - &lt;70%</td><td className="p-2 border border-gray-300">Below Expectation</td><td className="p-2 border border-gray-300">Considered</td><td className="p-2 border border-gray-300">R3</td>
                        </tr>
                        <tr className={totalScore >= 70 && totalScore < 80 ? 'bg-yellow-200 font-bold' : ''}>
                            <td className="p-2 border border-gray-300">≥70% - &lt;80%</td><td className="p-2 border border-gray-300">Fully Successful</td><td className="p-2 border border-gray-300">Recommended</td><td className="p-2 border border-gray-300">R1</td>
                        </tr>
                        <tr className={totalScore >= 80 && totalScore < 90 ? 'bg-yellow-200 font-bold' : ''}>
                            <td className="p-2 border border-gray-300">≥80% - &lt;90%</td><td className="p-2 border border-gray-300">Above Expectation</td><td className="p-2 border border-gray-300">Highly Recommended</td><td className="p-2 border border-gray-300">R1</td>
                        </tr>
                        <tr className={totalScore >= 90 ? 'bg-yellow-200 font-bold' : ''}>
                            <td className="p-2 border border-gray-300">≥90%</td><td className="p-2 border border-gray-300">Outstanding</td><td className="p-2 border border-gray-300">Highly Recommended</td><td className="p-2 border border-gray-300">R1</td>
                        </tr>
                    </tbody>
                </table>
                <p className="text-xs text-gray-500 italic mt-[-20px] mb-8">*Recommended dengan kategori minimal Fully Successful (FS)</p>

                {/* DOKUMENTASI WAWANCARA (Sesuai Screenshot/Foto) */}
                <h2 className="font-bold text-teal-700 bg-teal-50 px-3 py-1 mb-2 border-l-4 border-teal-700">Dokumentasi Wawancara</h2>
                <div className="w-full h-32 border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center text-gray-400 rounded-lg">
                    <Camera className="w-8 h-8 mb-2" />
                    <span className="text-sm">Lampirkan Foto / Screenshot Interview di Sini</span>
                </div>

                {/* FOOTER HALAMAN 1 */}
                <FooterSignature />

            </div>


            {/* ========================================================= */}
            {/* HALAMAN 2: PSYCHOLOGICAL ASSESSMENT REPORT (TES) */}
            {/* ========================================================= */}
            <div className="w-[210mm] min-h-[297mm] p-10 bg-white relative shadow-xl">
                
                {/* Kop Surat / Header */}
                <div className="flex justify-between items-center mb-6 pb-4 border-b-4 border-teal-800">
                    <div>
                        <h2 className="text-lg font-black text-gray-800 tracking-tighter">MERDEKA BATTERY</h2>
                        <h2 className="text-lg font-black text-teal-700 tracking-tighter mt-[-5px]">MATERIALS</h2>
                    </div>
                    <div className="text-right">
                        <h3 className="font-bold text-gray-600 text-sm">PT. SULAWESI CAHAYA MINERAL</h3>
                    </div>
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-2xl font-black text-gray-900 uppercase tracking-widest">Psychological Assessment Report</h1>
                    <p className="text-sm text-gray-500 mt-1">Dokumen Resmi Hasil Evaluasi Psikologi Kandidat & Karyawan</p>
                </div>

                {/* Nama Peserta */}
                <div className="bg-gray-100 p-4 rounded-lg flex justify-between items-center mb-8 border border-gray-300">
                    <div>
                        <span className="text-xs text-gray-500 font-bold uppercase block mb-1">Nama Peserta</span>
                        <span className="text-xl font-bold text-teal-900">{candidateNik} - {candidateName.toUpperCase()}</span>
                    </div>
                    <div className="text-right">
                        <span className="text-xs text-gray-500 font-bold uppercase block mb-1">Tipe Peserta</span>
                        <span className="text-sm font-bold bg-white px-3 py-1 rounded border border-gray-300">Kandidat / Pelamar</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-8">
                    {/* 1. KOGNITIF (CFIT) */}
                    <div>
                        <h3 className="font-bold text-white bg-teal-800 px-3 py-1.5 mb-3 inline-block">1. Kecerdasan Kognitif (CFIT)</h3>
                        <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 text-center">
                            {cfitSub?.scores ? (
                                <>
                                    <div className="text-xs text-gray-500 font-bold uppercase mb-1">SKOR IQ</div>
                                    <div className="text-4xl font-black text-teal-700 mb-2">{cfitSub.scores.iq}</div>
                                    <div className="grid grid-cols-2 gap-2 mt-4">
                                        <div className="bg-white border border-gray-300 p-2 rounded">
                                            <div className="text-[10px] text-gray-500 uppercase">Klasifikasi</div>
                                            <div className="font-bold text-sm text-gray-800">{cfitSub.scores.classification}</div>
                                        </div>
                                        <div className="bg-white border border-gray-300 p-2 rounded">
                                            <div className="text-[10px] text-gray-500 uppercase">Jwb Benar</div>
                                            <div className="font-bold text-sm text-gray-800">{cfitSub.scores.raw_score} / 50</div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-sm text-gray-400 py-6 italic">Belum ada hasil CFIT</div>
                            )}
                        </div>
                    </div>

                    {/* 2. KRAEPELIN */}
                    <div>
                        <h3 className="font-bold text-white bg-teal-800 px-3 py-1.5 mb-3 inline-block">2. Performa Kerja (Kraepelin)</h3>
                        <div className="border border-gray-300 rounded-lg overflow-hidden text-center">
                            {kraepelinSub?.scores ? (
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-100 border-b border-gray-300 text-xs text-gray-600">
                                        <tr><th className="p-2 border-r border-gray-300">Kecepatan</th><th className="p-2 border-r border-gray-300">Ketelitian</th><th className="p-2">Total Errors</th></tr>
                                    </thead>
                                    <tbody>
                                        <tr className="font-bold text-teal-900 text-lg">
                                            <td className="p-4 border-r border-gray-300">{kraepelinSub.scores.panker}</td>
                                            <td className="p-4 border-r border-gray-300">{kraepelinSub.scores.janker}</td>
                                            <td className="p-4">0</td>
                                        </tr>
                                    </tbody>
                                </table>
                            ) : (
                                <div className="text-sm text-gray-400 py-10 italic">Belum ada hasil Kraepelin</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 3. PAPI KOSTICK */}
                <div>
                    <h3 className="font-bold text-white bg-teal-800 px-3 py-1.5 mb-4 inline-block">3. Profil Kepribadian & Gaya Kerja (PAPI Kostick)</h3>
                    {papiSub?.scores ? (
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                            {Object.entries(papiSub.scores)
                                .filter(([k]) => /^[A-Z]$/.test(k))
                                .map(([key, val]: any) => (
                                <div key={key} className="flex justify-between items-center border-b border-gray-200 py-1.5">
                                    <div className="flex items-center gap-2">
                                        <span className="font-black text-teal-800 w-4">{key}</span>
                                        <span className="text-gray-700">{getPapiName(key)}</span>
                                    </div>
                                    <span className="font-bold bg-gray-100 border border-gray-300 px-2 py-0.5 rounded">{val}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-sm text-gray-400 py-6 italic text-center border border-gray-300 rounded-lg bg-gray-50">Belum ada profil PAPI Kostick</div>
                    )}
                </div>

                {/* FOOTER HALAMAN 2 */}
                <FooterSignature />

            </div>
        </div>
    </div>
  );
}