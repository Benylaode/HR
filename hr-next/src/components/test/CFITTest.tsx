"use client";

import { useState, useMemo, useEffect } from "react";
import { CheckCircle, ArrowRight, Play, Info } from "lucide-react";
import { toast } from "sonner";
import { getTestDuration } from "@/lib/test-data";

// 1. Interface
interface CFITQuestion {
  id: number;
  subtest: number;
  subtestName: string;
  instruction: string;
  question_image: string | null;
  options: string[] | string; 
  correctAnswer: number | string; // Diupdate agar mendukung string koma "1,3"
}

interface CFITTestProps {
  questions: CFITQuestion[];
  answers: any[]; // Diupdate menggunakan any[] agar bisa menerima array [1,3] atau angka tunggal
  onAnswer: (questionIndex: number, answer: any) => void;
  timeRemaining: number;
  onTimerControl?: (action: "pause" | "resume", newTime?: number) => void;
}

export default function CFITTest({
  questions,
  answers,
  onAnswer,
  timeRemaining,
  onTimerControl,
}: CFITTestProps) {
  const BE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

  // --- STATE UNTUK MENGATUR ALUR SUBTES ---
  const [currentSubtestIndex, setCurrentSubtestIndex] = useState(0); 
  const [phase, setPhase] = useState<"instruction" | "test" | "finished">("instruction");

  // Ekstrak daftar ID subtes yang unik dan urut
  const availableSubtests = useMemo(() => {
    const subs = new Set(questions.map((q) => q.subtest));
    return Array.from(subs).sort((a, b) => a - b);
  }, [questions]);

  const activeSubtestId = availableSubtests[currentSubtestIndex] || 1;

  // --- KONTEN INSTRUKSI BERDASARKAN GAMBAR ---
  const INSTRUCTIONS: Record<number, { title: string; content: React.ReactNode }> = {
    1: {
      title: "Subtes 1: Melengkapi Pola Urutan",
      content: (
        <div className="space-y-4 text-gray-700 text-lg leading-relaxed">
          <p>Pada subtes ini, Anda akan melihat deretan kotak yang berisi gambar dengan pola urutan tertentu.</p>
          <p>
            <strong>Tugas Anda adalah:</strong> Menentukan 1 pola gambar yang paling tepat untuk melanjutkan urutan gambar tersebut dari pilihan jawaban yang disediakan.
          </p>
        </div>
      ),
    },
    2: {
      title: "Subtes 2: Klasifikasi Gambar",
      content: (
        <div className="space-y-4 text-gray-700 text-lg leading-relaxed">
          <p>Pada subtes ini, cara menjawab persoalannya berbeda dengan subtes 1. Perhatikan instruksi saya.</p>
          <p>
            Ada 5 kotak yang pada masing-masing kotak memiliki gambarnya tersendiri. Apabila anda lihat maka akan ada <strong>2 gambar yang berbeda</strong> dari 3 gambar lainnya.
          </p>
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 font-medium">
            Tugas anda adalah menentukan mana 2 gambar yang berbeda dari 3 gambar lainnya.
          </div>
          <div className="bg-gray-100 p-5 rounded-xl border border-gray-200 mt-4">
            <p className="font-bold mb-2">Contoh :</p>
            <p className="mb-2"><strong>Pada contoh 1:</strong> dapatkah anda melihat 2 gambar yang berbeda dari 3 gambar lainnya..?? terlihat gambar pada kotak B dan D berbeda dari 3 gambar di kotak lainnya. Maka jawabannya adalah B dan D.</p>
            <p><strong>Pada contoh 2:</strong> mana 2 gambar yang berbeda dari 3 gambar yang lainnya. Terlihat pada kotak C dan E gambarnya berbeda dengan 3 kotak lainnya. Segi empat pada kotak ini memiliki isi/buram/ada titik-titiknya.. sedangkan pada 3 kotak lainnya, lingkarannya tidak berisi apa2.</p>
          </div>
          <p className="text-sm italic text-gray-500 mt-2">*Catatan: Klik pada 2 pilihan jawaban secara bersamaan di bawah tiap soal.</p>
        </div>
      ),
    },
    3: {
      title: "Subtes 3: Melengkapi Matriks",
      content: (
        <div className="space-y-4 text-gray-700 text-lg leading-relaxed">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 font-medium">
            Pada subtes ini, anda diminta untuk mencari pola gambar yang tepat untuk mengisi kotak yang kosong.
          </div>
          <div className="bg-gray-100 p-5 rounded-xl border border-gray-200 mt-4 space-y-3">
            <p><strong>Pada contoh 1:</strong> anda melihat kotak di atas yaitu kotak pertama, kotak dengan dua garis hitam yang berdekatan satu garis menjauh. Pada kotak kedua, tiga garis saling berjauhan. Kotak ketiga polanya sama dengan pola kotak di atasnya, sehingga jawaban yang paling tepat untuk kotak keempat adalah....B</p>
            <p><strong>Contoh no 2:</strong> ada gambar tangan saling bertolak belakang di 2 kotak atas, dikotak kiri bawah, ada gambar tangan dengan titik2 hitam di badannya. Maka jawaban untuk kotak yang kosong yang paling tepat adalah...C</p>
            <p><strong>Contoh ke 3:</strong> ada 1 segiempat pada kotak atas dengan warna gelap, dan bawah sebelah kiri tanpa warna dan 2 segiempat pada kotak kanan atas berwarna gelap. Maka gambar kotak kanan bawah yang paling tepat adalah... A</p>
          </div>
        </div>
      ),
    },
    4: {
      title: "Subtes 4: Kondisi & Posisi Titik",
      content: (
        <div className="space-y-4 text-gray-700 text-lg leading-relaxed">
          <p>Pada subtes 4 ini agak berbeda dengan 3 subtes sebelumnya. Harap anda perhatikan instruksi saya, jika anda lihat maka ada kotak disebelah kiri dan kotak pilihan jawaban di sebelah kanannya. Ada 3 unsur bentuk dalam kotak sebelah kiri. Titik, dan 2 bentuk lainnya.</p>
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl text-orange-900 font-bold">
            Tugas anda adalah memilih gambar dimana anda dapat meletakkan posisi titik yang tidak berbeda komposisinya dengan gambar contoh.
          </div>
          <div className="bg-gray-100 p-5 rounded-xl border border-gray-200 mt-4 space-y-3">
            <p><strong>Contoh 1:</strong> Misalnya pada gambar pertama, posisi titik berada dalam perpotongan bentuk persegi dan lingkaran. Maka jawaban yang benar adalah C, karena posisi titik masih berada dalam perpotongan persegi dan lingkaran.</p>
            <p><strong>Contoh kedua:</strong> posisi titik berada dalam area dua buah segitiga yang saling berpotongan. Maka jawaban yang benar adalah D, karena posisi titik masih bisa ditempatkan dalam dua buah segitiga.</p>
            <p><strong>Contoh ketiga:</strong> posisi titik berada diatas garis lengkung dan berada didalam segiempat. Maka jawaban yang benar adalah B, karena titik masih dapat ditempatkan diatas garis lengkung dan didalam segiempat</p>
          </div>
        </div>
      ),
    },
  };

  // --- FORMAT TIMER ---
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // --- LOGIKA PROGRESS BAR (Disesuaikan untuk Subtes 2) ---
  const isQuestionFullyAnswered = (globalIndex: number, subtestId: number) => {
    const ans = answers[globalIndex];
    if (subtestId === 2) {
      return Array.isArray(ans) && ans.length === 2;
    }
    return ans !== null && ans !== undefined;
  };

  // --- HITUNG PROGRESS SUBTES SAAT INI ---
  const questionsInActiveSubtest = questions.filter(q => q.subtest === activeSubtestId);
  const answeredInActiveSubtest = questions.reduce((count, q, idx) => {
    if (q.subtest === activeSubtestId && isQuestionFullyAnswered(idx, q.subtest)) {
      return count + 1;
    }
    return count;
  }, 0);

  // --- PANTAU WAKTU HABIS ---
  useEffect(() => {
    if (phase === "test" && timeRemaining === 0) {
      toast.error(`Waktu Subtes ${activeSubtestId} Habis!`, { 
        description: "Otomatis beralih ke instruksi subtes berikutnya." 
      });
      handleNextPhase(true); // true = force next karena waktu habis
    }
  }, [timeRemaining, phase, activeSubtestId]);

  // --- HANDLERS ---
  const handleStartSubtest = () => {
    setPhase("test");
    window.scrollTo(0, 0);
    
    // Mulai dan set waktu sesuai subtes yang akan berjalan
    const duration = getTestDuration(`cfit_sub${activeSubtestId}` as any);
    if (onTimerControl) {
      onTimerControl("resume", duration);
    }
  };

  const handleNextPhase = (isTimeUp = false) => {
    // Jika manual next (bukan karena waktu habis), pastikan semua terjawab
    if (!isTimeUp && answeredInActiveSubtest < questionsInActiveSubtest.length) {
      const confirmNext = window.confirm("Masih ada soal yang belum Anda jawab di subtes ini. Anda tidak bisa kembali jika sudah lanjut. Lanjutkan?");
      if (!confirmNext) return;
    }

    if (currentSubtestIndex + 1 < availableSubtests.length) {
      setCurrentSubtestIndex((prev) => prev + 1);
      setPhase("instruction");
      
      // Pause dan siapkan durasi untuk subtes berikutnya
      if (onTimerControl) {
        const nextSubtestId = availableSubtests[currentSubtestIndex + 1];
        const nextDuration = getTestDuration(`cfit_sub${nextSubtestId}` as any);
        onTimerControl("pause", nextDuration);
      }
    } else {
      setPhase("finished");
      if (onTimerControl) onTimerControl("pause", 0); // Selesai semua (Timer stop)
    }
    window.scrollTo(0, 0);
  };


  // --- RENDER 1: HALAMAN SELESAI ---
  if (phase === "finished") {
    return (
      <div className="max-w-2xl mx-auto mt-12 bg-green-50 border border-green-200 rounded-3xl p-10 text-center shadow-sm">
        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
        <h2 className="text-3xl font-black text-green-900 mb-4">Ujian CFIT Selesai!</h2>
        <p className="text-green-800 text-lg mb-6">
          Anda telah menyelesaikan seluruh urutan Subtes CFIT.
        </p>
        <div className="bg-white p-4 rounded-xl border border-green-100 text-sm text-gray-600 shadow-sm inline-block">
          Silakan klik tombol <b>"Kumpulkan / Selesai"</b> (Submit) utama di bagian bawah atau atas aplikasi untuk menyimpan hasil Anda secara permanen.
        </div>
      </div>
    );
  }

  // --- RENDER 2: HALAMAN INSTRUKSI ---
  if (phase === "instruction") {
    const currentInstruction = INSTRUCTIONS[activeSubtestId] || { 
      title: `Subtes ${activeSubtestId}`, 
      content: <p>Silakan kerjakan soal-soal berikut dengan teliti.</p> 
    };

    return (
      <div className="max-w-3xl mx-auto my-8 bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
        <div className="bg-blue-700 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-10 transform translate-x-4 -translate-y-4">
             <Info className="w-48 h-48" />
          </div>
          <span className="bg-blue-800 text-blue-100 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 inline-block">
            Instruksi Pengerjaan
          </span>
          <h2 className="text-3xl font-black text-white relative z-10">{currentInstruction.title}</h2>
        </div>
        
        <div className="p-8 md:p-10">
          {currentInstruction.content}
        </div>

        <div className="bg-gray-50 border-t border-gray-100 p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-500">
            Pastikan Anda memahami instruksi sebelum memulai. Waktu akan berjalan terus.
          </div>
          <button 
            onClick={handleStartSubtest} 
            className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-blue-600/30 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <Play className="w-5 h-5 fill-current" />
            Mulai Kerjakan Subtes {activeSubtestId}
          </button>
        </div>
      </div>
    );
  }

  // --- RENDER 3: HALAMAN SOAL (TEST PHASE) ---
  return (
    <div className="max-w-4xl mx-auto pb-24">
      {/* Sticky Header untuk Progress Subtes & Timer */}
      <div className="sticky top-16 z-30 bg-white border border-gray-200 rounded-2xl p-5 mb-8 shadow-lg shadow-blue-900/5 mt-4">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-3">
             <span className="bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded-lg text-sm border border-blue-200">
               Subtes {activeSubtestId}
             </span>
             <span className="text-sm font-medium text-gray-600">
               Terjawab: <span className="text-blue-600 font-bold">{answeredInActiveSubtest}</span> / {questionsInActiveSubtest.length}
             </span>
          </div>
          <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 font-mono font-bold text-lg ${timeRemaining < 60 ? "bg-red-50 text-red-600 border-red-200" : "bg-gray-50 text-gray-900 border-gray-200"}`}>
            ⏱️ {formatTime(timeRemaining)}
          </div>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-blue-600 h-full transition-all duration-500 ease-out"
            style={{ width: `${(answeredInActiveSubtest / (questionsInActiveSubtest.length || 1)) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* List Soal HANYA untuk Subtes yang Aktif */}
      <div className="space-y-8">
        {questions.map((question, globalIndex) => {
          if (question.subtest !== activeSubtestId) return null;

          const localNumber = questionsInActiveSubtest.findIndex(q => q.id === question.id) + 1;

          const optionsArray = typeof question.options === 'string' 
            ? question.options.split(",") 
            : question.options;

          const isSubtest2 = activeSubtestId === 2;
          const currentAnswer = answers[globalIndex];
          const isAnswered = isQuestionFullyAnswered(globalIndex, question.subtest);

          return (
            <div
              key={question.id}
              id={`question-${globalIndex}`}
              className={`bg-white border rounded-3xl overflow-hidden transition-colors ${
                isAnswered ? "border-green-300 shadow-md shadow-green-50" : "border-gray-200 shadow-sm"
              }`}
            >
              {/* Question Header */}
              <div className={`px-6 py-4 border-b flex justify-between items-center ${isAnswered ? 'bg-green-50/50' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isAnswered ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                     {localNumber}
                  </div>
                  <span className="font-bold text-gray-700">Pertanyaan</span>
                  {isSubtest2 && <span className="text-xs bg-red-100 text-red-700 font-bold px-2 py-1 rounded ml-2">Pilih 2 Jawaban</span>}
                </div>
                {isAnswered && (
                  <span className="flex items-center gap-1 text-green-600 text-sm font-bold bg-green-100 px-3 py-1 rounded-full">
                    <CheckCircle className="w-4 h-4" /> Tersimpan
                  </span>
                )}
              </div>

              <div className="p-6 md:p-8">
                {/* Instruction Soal */}
                {question.instruction && (
                   <h3 className="text-base text-gray-600 mb-6 italic border-l-4 border-blue-400 pl-4 py-1">
                     "{question.instruction}"
                   </h3>
                )}

                {/* Gambar Soal */}
                <div className="mb-8 flex justify-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  {question.question_image ? (
                    <img
                      src={`${BE_URL}${question.question_image}`}
                      alt={`Soal ${localNumber}`}
                      className="max-w-full h-auto object-contain max-h-80 mix-blend-multiply"
                    />
                  ) : (
                    <div className="h-32 flex flex-col items-center justify-center text-gray-400">
                      <p>📷 Gambar tidak tersedia</p>
                    </div>
                  )}
                </div>

                {/* Pilihan Jawaban */}
                <div>
                   <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 text-center">Pilih Jawaban Anda</p>
                   <div className="flex flex-wrap gap-3 justify-center">
                     {optionsArray.map((option, optIndex) => {
                       // Cek apakah opsi ini sedang dipilih
                       const isSelected = isSubtest2 
                          ? Array.isArray(currentAnswer) && currentAnswer.includes(optIndex)
                          : currentAnswer === optIndex;

                       return (
                         <button
                           key={optIndex}
                           onClick={() => {
                             if (isSubtest2) {
                               let arr = Array.isArray(currentAnswer) ? [...currentAnswer] : [];
                               if (arr.includes(optIndex)) {
                                 arr = arr.filter(a => a !== optIndex); // Unselect
                               } else {
                                 if (arr.length < 2) arr.push(optIndex); // Select baru
                                 else toast.warning("Maksimal 2 jawaban untuk subtes ini.");
                               }
                               onAnswer(globalIndex, arr.length > 0 ? arr : null);
                             } else {
                               onAnswer(globalIndex, optIndex);
                             }
                           }}
                           className={`w-16 h-16 rounded-2xl border-2 font-black text-xl transition-all ${
                             isSelected
                               ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-600/30 transform scale-110"
                               : "border-gray-200 text-gray-600 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600"
                           }`}
                         >
                           {option}
                         </button>
                       );
                     })}
                   </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Pindah Subtes / Selesai */}
      <div className="mt-10 pt-8 border-t border-gray-200 flex justify-end">
         <button 
           onClick={() => handleNextPhase(false)} // False agar tetap trigger notifikasi konfirmasi peringatan kosong
           className="px-8 py-4 bg-gray-900 hover:bg-black text-white font-bold text-lg rounded-2xl shadow-lg flex items-center gap-3 transition-transform active:scale-95"
         >
           {currentSubtestIndex + 1 < availableSubtests.length ? (
             <>Lanjut ke Subtes Berikutnya <ArrowRight className="w-5 h-5"/></>
           ) : (
             <>Selesaikan Subtes Terakhir <CheckCircle className="w-5 h-5"/></>
           )}
         </button>
      </div>

    </div>
  );
}