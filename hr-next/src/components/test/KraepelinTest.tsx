"use client";
import { useState, useEffect, useRef } from "react";
import { generateKraepelinGrid } from "@/lib/test-data"; 
// 1. IMPORT FUNGSI DARI FILE UTILS
import { calculateKraepelinScore } from "@/utils/kraepelinScoring"; 

interface KraepelinTestProps {
  timeRemaining: number;
  onComplete: (results: any) => void;
  dbConfig: {
    columns: number;
    rows: number;
    durationPerColumn: number;
  };
}

export default function KraepelinTest({
  timeRemaining,
  onComplete,
  dbConfig,
}: KraepelinTestProps) {
  const [grid, setGrid] = useState<number[][]>([]);
  const [answers, setAnswers] = useState<(number | null)[][]>([]); 
  const [currentColumn, setCurrentColumn] = useState(0);
  const [activeInputIndex, setActiveInputIndex] = useState(0); 
  const [currentInputValue, setCurrentInputValue] = useState("");
  const [columnTimeLeft, setColumnTimeLeft] = useState(dbConfig.durationPerColumn);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const answersRef = useRef<any>([]);

  useEffect(() => {
    const newGrid = generateKraepelinGrid(dbConfig.columns, dbConfig.rows);
    setGrid(newGrid);
    const numberOfInputs = dbConfig.rows - 1;
    const initialAnswers = Array.from({ length: dbConfig.columns }, () =>
      Array(numberOfInputs).fill(null)
    );
    setAnswers(initialAnswers);
    answersRef.current = initialAnswers;
    setCurrentColumn(0);
    setActiveInputIndex(numberOfInputs - 1); 
    setColumnTimeLeft(dbConfig.durationPerColumn);
  }, [dbConfig]);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    if (!grid.length) return;
    setColumnTimeLeft(dbConfig.durationPerColumn);
    const timer = setInterval(() => {
      setColumnTimeLeft((prev) => {
        if (prev <= 1) return 0; 
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [currentColumn, grid.length, dbConfig.durationPerColumn]);

  useEffect(() => {
    if (columnTimeLeft === 0) {
      handleMoveToNextColumn();
    }
  }, [columnTimeLeft]);

  // --- NAVIGATION & INPUT ---

  const handleMoveToNextColumn = async () => {
    if (currentColumn < dbConfig.columns - 1) {
      setCurrentColumn((prev) => prev + 1);
      setActiveInputIndex(dbConfig.rows - 2); 
      setCurrentInputValue("");
    } else {
      // === TES SELESAI ===
      const finalAnswers = answersRef.current;
      
      // 2. Gunakan fungsi calculateKraepelinScore yang di-import
      const results = calculateKraepelinScore(finalAnswers, grid);

      console.log("Hasil Perhitungan Norma Sarjana:", results);

      try {
        const pathSegments = window.location.pathname.split('/'); 
        const token = pathSegments[pathSegments.length - 1]; 

        const response = await fetch('http://localhost:5000/submission/kraepelin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: token,
            answers: finalAnswers, 
            results: results 
          })
        });

        if (response.ok) {
           const data = await response.json();
           onComplete(data);
        } else {
           alert("Gagal menyimpan hasil tes.");
        }
      } catch (error) {
        console.error("Error submitting logic:", error);
      }
    }
  };

  const handleInput = (val: string) => {
    if (!/^\d?$/.test(val)) return;
    setCurrentInputValue(val);
    if (val === "") return;
    const numVal = parseInt(val, 10);
    const updatedAnswers = structuredClone(answers);
    if (updatedAnswers[currentColumn]) {
        updatedAnswers[currentColumn][activeInputIndex] = numVal;
        setAnswers(updatedAnswers);
    }
    if (activeInputIndex > 0) {
      setActiveInputIndex((prev) => prev - 1);
      setCurrentInputValue("");
    } else {
      handleMoveToNextColumn();
    }
  };

  const manualSkip = () => {
    handleMoveToNextColumn();
  };

  useEffect(() => {
    inputRef.current?.focus();
    const el = document.getElementById(`col-container-${currentColumn}`);
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [activeInputIndex, currentColumn]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (!grid.length) return <div className="p-10 text-center">Memuat Tes...</div>;

  const progressPercent = ((dbConfig.durationPerColumn - columnTimeLeft) / dbConfig.durationPerColumn) * 100;

  return (
    // ... Copy paste bagian Return JSX Anda yang lama di sini ...
    // ... (Tidak ada perubahan pada tampilan) ...
    <div className="max-w-7xl mx-auto px-4 h-screen flex flex-col">
       {/* ... Isi JSX sama persis seperti file Anda ... */}
       {/* HEADER FIXED */}
      <div className="flex-none bg-white pt-4 pb-2 z-20">
        <div className="flex justify-between items-end mb-4 border-b pb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Tes Kraepelin</h1>
            <p className="text-sm text-gray-500">
              Jumlahkan dua angka, ketik digit terakhirnya saja.
            </p>
          </div>
          <div className="text-right">
             <div className="text-xs text-gray-500 uppercase tracking-wide">Total Waktu</div>
             <div className={`text-3xl font-mono font-bold ${timeRemaining < 60 ? 'text-red-500 animate-pulse' : 'text-gray-800'}`}>
                {formatTime(timeRemaining)}
             </div>
          </div>
        </div>

        {/* PROGRESS BAR KOLOM */}
        <div className="relative w-full h-6 bg-gray-200 rounded-full overflow-hidden shadow-inner mb-2">
            <div 
                className="h-full bg-blue-600 transition-all duration-1000 ease-linear"
                style={{ width: `${progressPercent}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700 drop-shadow-md">
                Pindah kolom dalam: {columnTimeLeft} detik
            </div>
        </div>

        <div className="flex justify-between items-center text-sm font-medium text-gray-600 bg-gray-50 px-3 py-1 rounded border">
            <span>Kolom: <span className="text-blue-600">{currentColumn + 1}</span> / {dbConfig.columns}</span>
            <button 
                onClick={manualSkip}
                className="text-xs bg-gray-800 hover:bg-black text-white px-3 py-1 rounded transition-colors"
            >
                Lewati Kolom (Enter) &rarr;
            </button>
        </div>
      </div>

      {/* MAIN GRID AREA */}
      <div className="flex-1 overflow-y-hidden overflow-x-auto py-4">
        {/* Container Flex Row untuk Kolom-kolom */}
        <div className="flex gap-4 min-w-max px-4 h-full items-start justify-center">
            {grid.map((colData, colIndex) => {
                const isCurrentCol = colIndex === currentColumn;
                
                return (
                    <div 
                        key={colIndex} 
                        id={`col-container-${colIndex}`}
                        className={`
                            flex flex-col items-center flex-shrink-0 w-16 transition-all duration-300
                            ${isCurrentCol ? 'scale-105 opacity-100' : 'opacity-40 blur-[1px]'}
                        `}
                    >
                        {/* HEADER KOLOM */}
                        <div className={`
                            mb-2 font-bold text-xs px-2 py-1 rounded 
                            ${isCurrentCol ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}
                        `}>
                            C-{colIndex + 1}
                        </div>

                        {/* ANGKAS & INPUTS LOOP */}
                        <div className={`
                            flex flex-col items-center py-2 px-1 rounded-lg border
                            ${isCurrentCol ? 'bg-blue-50 border-blue-300 shadow-lg' : 'bg-gray-50 border-gray-200'}
                        `}>
                            {colData.map((number, rowIndex) => {
                                // Kita merender Angka dulu
                                // Jika ini BUKAN angka terakhir, kita render Input di bawahnya
                                const isLastNumber = rowIndex === colData.length - 1;
                                
                                // Input slot index sesuai dengan rowIndex
                                // (Input ke-0 ada di antara Angka 0 dan Angka 1)
                                const inputIndex = rowIndex; 
                                const isActiveInput = isCurrentCol && inputIndex === activeInputIndex;
                                const answerValue = answers[colIndex] ? answers[colIndex][rowIndex] : null;

                                return (
                                    <div key={rowIndex} className="flex flex-col items-center">
                                        {/* 1. ANGKA */}
                                        <div className="text-xl font-mono font-bold text-gray-800 my-1 h-8 flex items-center">
                                            {number}
                                        </div>

                                        {/* 2. INPUT SLOT (Jika bukan angka terakhir) */}
                                        {!isLastNumber && (
                                            <div className="my-1 h-10 w-10 flex items-center justify-center relative">
                                                {/* Garis penghubung tipis visual */}
                                                <div className="absolute h-full w-[1px] bg-gray-200 -z-10"></div>

                                                {isActiveInput ? (
                                                    <input
                                                        ref={inputRef}
                                                        autoFocus
                                                        type="text"
                                                        inputMode="numeric"
                                                        maxLength={1}
                                                        value={currentInputValue}
                                                        onChange={(e) => handleInput(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleInput(currentInputValue || '0'); // Safety enter
                                                        }}
                                                        className="w-full h-full text-center text-xl font-bold border-2 border-blue-500 rounded bg-white shadow-sm focus:outline-none ring-2 ring-blue-200"
                                                    />
                                                ) : (
                                                    // Menampilkan jawaban yang sudah diisi (atau kosong jika belum sampai)
                                                    <div className={`
                                                        w-8 h-8 flex items-center justify-center rounded text-sm font-bold
                                                        ${answerValue !== null ? 'text-green-600 bg-green-50 border border-green-200' : 'text-transparent bg-gray-100/50 rounded-full w-2 h-2'}
                                                    `}>
                                                        {answerValue}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
}
