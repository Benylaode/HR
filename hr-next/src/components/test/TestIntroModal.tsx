import React, { useState, useEffect } from "react";
import { Play, ClipboardList, AlertTriangle } from "lucide-react";

interface TestIntroModalProps {
  testType: "cfit" | "kraepelin" | "papi";
  candidateName: string;
  onStart: () => void;
  onCancel: () => void;
}

export default function TestIntroModal({
  testType,
  candidateName,
  onStart,
  onCancel,
}: TestIntroModalProps) {
  const [canStart, setCanStart] = useState(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else {
      setCanStart(true);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const renderKraepelinPreview = () => (
      <div className="bg-slate-50 p-6 rounded-xl border border-gray-200 mb-6 flex flex-col items-center">
        <h4 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-widest">Simulasi Pengerjaan</h4>
        
        <div className="flex gap-8 items-center">
            {/* KOLOM SIMULASI (Mirip Real Test) */}
            <div className="flex flex-col items-center p-3 rounded-xl bg-white border border-blue-200 shadow-xl ring-4 ring-blue-50/50" style={{ width: '64px' }}>
                {/* Angka Atas */}
                <div className="text-2xl font-mono font-bold h-10 flex items-center justify-center w-10 rounded text-gray-800">
                    8
                </div>

                {/* Input Slot (Target) */}
                <div className="h-10 w-10 flex items-center justify-center my-1.5 relative">
                     <div className="absolute h-full w-[2px] bg-blue-100 -z-10 rounded-full"></div>
                     <div className="w-full h-full flex items-center justify-center text-2xl font-bold border-2 border-blue-500 rounded-lg bg-white shadow-lg z-20 animate-pulse text-blue-600">
                        ?
                     </div>
                </div>

                {/* Angka Bawah */}
                <div className="text-2xl font-mono font-bold h-10 flex items-center justify-center w-10 rounded text-gray-800">
                    7
                </div>
            </div>

            <div className="text-gray-400">
                <div className="text-xs font-mono mb-1">Logika:</div>
                <div className="text-lg font-bold">8 + 7 = 15</div>
                <div className="text-xs text-blue-600 font-bold mt-1">Ketik: 5</div>
            </div>
        </div>

        <p className="text-xs text-gray-500 mt-4 text-center max-w-xs">
           Jumlahkan dua angka yang berdekatan. Ketik hanya <b>digit terakhir</b> (satuan) di kotak input diantaranya.
        </p>
      </div>
  );

  const renderCFITPreview = () => (
    <div className="bg-purple-50 p-6 rounded-xl border border-purple-100 mb-6">
        <h4 className="text-sm font-bold text-purple-800 mb-4 text-center uppercase tracking-widest">Contoh Soal: Melengkapi Pola</h4>
        
        {/* SOAL SEQUENCE */}
        <div className="flex items-center justify-center gap-3 mb-6">
            {/* Box 1 (Top-Left) */}
            <div className="w-14 h-14 border-2 border-gray-800 bg-white relative p-1">
                <div className="w-4 h-4 bg-black absolute top-2 left-2"></div>
            </div>
            {/* Box 2 (Top-Right) */}
            <div className="w-14 h-14 border-2 border-gray-800 bg-white relative p-1">
                <div className="w-4 h-4 bg-black absolute top-2 right-2"></div>
            </div>
            {/* Box 3 (Bottom-Right) */}
            <div className="w-14 h-14 border-2 border-gray-800 bg-white relative p-1">
                <div className="w-4 h-4 bg-black absolute bottom-2 right-2"></div>
            </div>
            
            {/* Answer Slot (Empty) */}
            <div className="w-14 h-14 border-2 border-purple-500 border-dashed bg-white/50 flex items-center justify-center relative">
                <span className="text-purple-600 text-xs font-bold">?</span>
            </div>
        </div>

        {/* PILIHAN JAWABAN */}
        <div className="grid grid-cols-6 gap-2 max-w-md mx-auto">
            {/* Pilihan A-F */}
            {[
                'top-2 left-2',     // a (Pos 1)
                'top-2 right-2',    // b (Pos 2)
                'bottom-2 right-2', // c (Pos 3) 
                'bottom-2 left-2',  // d (Pos 4 - CORRECT)
                'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2', // e (Center)
                'top-2 left-1/2 -translate-x-1/2' // f (Top-Center)
            ].map((posClass, idx) => {
                const label = String.fromCharCode(97 + idx); // a, b, c...
                const isCorrect = idx === 3; 
                return (
                    <div key={idx} className="flex flex-col items-center gap-1 group cursor-pointer">
                        <div className={`
                            w-12 h-12 border-2 bg-white relative transition-all
                            ${isCorrect ? 'border-green-500 ring-2 ring-green-200 bg-green-50' : 'border-gray-300 hover:border-gray-500'}
                        `}>
                             <div className={`w-3 h-3 bg-black absolute ${posClass}`}></div>
                        </div>
                        <span className={`text-xs font-bold uppercase ${isCorrect ? 'text-green-600' : 'text-gray-400'}`}>
                            {label}
                        </span>
                    </div>
                );
            })}
        </div>
        
        <p className="text-center text-xs text-purple-700 mt-4">
            Pola kotak hitam bergerak searah jarum jam setiap sudut. Pilih kotak selanjutnya.
        </p>
    </div>
  );

  const renderPAPIPreview = () => (
    <div className="bg-orange-50 p-4 rounded-lg border border-orange-100 mb-4">
        <h4 className="text-sm font-bold text-orange-800 mb-2 text-center">Pilih Satu Pernyataan</h4>
        <div className="flex flex-col gap-2 max-w-xs mx-auto">
            <div className="bg-white p-3 rounded border border-gray-200 shadow-sm cursor-pointer hover:border-orange-500 transition-colors flex items-center gap-3">
                <div className="w-4 h-4 rounded-full border border-gray-300"></div>
                <span className="text-sm text-gray-700">Saya suka bekerja keras.</span>
            </div>
            <div className="bg-white p-3 rounded border border-gray-200 shadow-sm cursor-pointer hover:border-orange-500 transition-colors flex items-center gap-3">
                <div className="w-4 h-4 rounded-full border border-gray-300"></div>
                <span className="text-sm text-gray-700">Saya suka bersantai.</span>
            </div>
        </div>
        <p className="text-center text-xs text-orange-700 mt-2">Pilih yang <b>paling menggambarkan</b> diri Anda saat ini.</p>
    </div>
  );


  const getTestDetails = () => {
    switch (testType) {
      case "kraepelin":
        return {
          title: "Tes Kraepelin (Kecepatan & Ketelitian)",
          desc: "Tes ini mengukur kecepatan, ketelitian, dan ketahanan kerja anda.",
          items: [
            "Jumlahkan dua angka yang berdekatan secara vertikal.",
            "Ketik hanya digit satuan (contoh: 8 + 7 = 15, ketik 5).",
            "Jika salah ketik, hapus dan ketik ulang secepatnya.",
            "Waktu per kolom terbatas! Pindah otomatis jika waktu habis.",
          ],
        };
      case "cfit":
        return {
          title: "CFIT (Intelligence Test)",
          desc: "Tes ini mengukur kemampuan analisis logika non-verbal.",
          items: [
            "Pilih pola gambar yang paling tepat untuk melengkapi urutan.",
            "Temukan pola yang berbeda dari kelompok gambar.",
            "Setiap sub-tes memiliki waktu spesifik.",
          ],
        };
      case "papi":
        return {
          title: "PAPI Kostick (Personality)",
          desc: "Tes kepribadian kerja.",
          items: [
            "Pilih satu dari dua pernyataan yang paling menggambarkan diri Anda.",
            "Tidak ada jawaban benar atau salah.",
            "Jawablah dengan jujur sesuai kondisi Anda.",
          ],
        };
      default:
        return { title: "", desc: "", items: [] };
    }
  };

  const details = getTestDetails();

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="p-6 border-b bg-gray-50 flex items-center gap-3">
            <div className={`p-2 rounded-lg ${testType === 'kraepelin' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                <ClipboardList size={24} />
            </div>
            <div>
                <h2 className="text-xl font-bold text-gray-900">{details.title}</h2>
                <p className="text-sm text-gray-500">Kandidat: {candidateName}</p>
            </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
            {/* Warning Device */}
            <div className="flex items-start gap-3 bg-red-50 border border-red-100 p-3 rounded-lg mb-6">
                <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={18} />
                <div className="text-sm text-red-800">
                    <span className="font-bold">PENTING:</span> Dilarang reload, berpindah tab, atau keluar dari fullscreen. Sistem akan mendeteksi kecurangan.
                </div>
            </div>

            <p className="text-gray-700 mb-4">{details.desc}</p>

            {/* Dynamic Preview */}
            {testType === 'kraepelin' && renderKraepelinPreview()}
            {testType === 'cfit' && renderCFITPreview()}
            {testType === 'papi' && renderPAPIPreview()}

            <div className="mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">Instruksi Pengerjaan:</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                    {details.items.map((item, idx) => (
                        <li key={idx}>{item}</li>
                    ))}
                </ul>
            </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex gap-4">
            <button
                onClick={onCancel}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
                Batal
            </button>
            <button
                onClick={onStart}
                disabled={!canStart}
                className={`flex-1 px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                    canStart 
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg scale-100 opacity-100' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
            >
                {canStart ? (
                    <>Mulai Sekarang <Play size={16} /></>
                ) : (
                    `Tunggu ${countdown}s...`
                )}
            </button>
        </div>

      </div>
    </div>
  );
}
