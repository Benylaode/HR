'use client';

import { useState, useEffect, useRef, useCallback } from "react";
import { generateKraepelinGrid } from "@/lib/test-data"; 
import { calculateKraepelinScore } from "@/utils/kraepelinScoring"; 
import { Play, SkipForward, Clock } from "lucide-react"; 

interface KraepelinTestProps {
  timeRemaining: number;
  onComplete: (results: any) => void;
  dbConfig: {
    columns: number;
    rows: number;
    durationPerColumn: number;
  };
  forceSubmit: boolean;
  manualSubmit: boolean;
}

const BE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export default function KraepelinTest({
  timeRemaining,
  onComplete,
  dbConfig,
  forceSubmit,
  manualSubmit,
}: KraepelinTestProps) {
  const [grid, setGrid] = useState<number[][]>([]);
  const [answers, setAnswers] = useState<(number | null)[][]>([]); 
  const [currentColumn, setCurrentColumn] = useState(0);
  const [activeInputIndex, setActiveInputIndex] = useState(0); 
  const [currentInputValue, setCurrentInputValue] = useState("");
  const [columnTimeLeft, setColumnTimeLeft] = useState(dbConfig.durationPerColumn);
  
  const inputRef = useRef<HTMLInputElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  // REFS Mutlak: Mencegah Stale Closure (Nilai Null saat dikirim)
  const answersRef = useRef<(number | null)[][]>([]);
  const gridRef = useRef<number[][]>([]);

  // Inisialisasi Tes
  useEffect(() => {
    const newGrid = generateKraepelinGrid(dbConfig.columns, dbConfig.rows);
    setGrid(newGrid);
    gridRef.current = newGrid;

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

  // --- SUBMIT LOGIC ---
  const submitDataToBackend = useCallback(async () => {
      if (isSubmitting) return; 
      setIsSubmitting(true);

      const finalAnswers = answersRef.current;
      const finalGrid = gridRef.current; 

      // 1. MENGOLAH "INFORMASI JAWABAN USER" (Penting untuk Laporan & Auto-Healing)
      // Array ini berisi rincian: jumlah benar, salah, dan array input jawaban murninya
      const detailedAnswers = finalGrid.map((colData, colIndex) => {
          let benar = 0;
          let salah = 0;
          let terjawab = 0;
          
          for (let rowIndex = 0; rowIndex < colData.length - 1; rowIndex++) {
              const userAns = finalAnswers[colIndex][rowIndex];
              if (userAns !== null && userAns !== undefined) {
                  terjawab++;
                  const correctAns = (colData[rowIndex] + colData[rowIndex + 1]) % 10;
                  if (Number(userAns) === correctAns) {
                      benar++;
                  } else {
                      salah++;
                  }
              }
          }
          return { 
              column: colIndex + 1, 
              benar: benar, 
              salah: salah, 
              terjawab: terjawab,
              inputs: finalAnswers[colIndex] // Jawaban murni user tidak hilang
          };
      });

      // 2. MENGHITUNG HASIL KESELURUHAN (Scores)
      let analysisResults = {};
      try {
          analysisResults = calculateKraepelinScore(finalAnswers, finalGrid);
      } catch (e) {
          console.error("Scoring Kraepelin gagal, mengirim data fallback:", e);
      }

      try {
        const pathSegments = window.location.pathname.split('/'); 
        const token = pathSegments[pathSegments.length - 1]; 

        // 3. MENYUSUN PAYLOAD YANG AMAN
        const payload = {
            token: token,
            answers: detailedAnswers, // Dikirim sbg `raw_answers` di DB (Bisa dibaca Auto-Healing)
            results: analysisResults  // Dikirim sbg `scores` di DB
        };

        const response = await fetch(`${BE_URL}/submission/kraepelin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
           const data = await response.json();
           onComplete(data.data || analysisResults);
        } else {
           alert("Gagal menyimpan hasil Kraepelin.");
           setIsSubmitting(false); 
        }
      } catch (error) {
        console.error("Error submitting Kraepelin:", error);
        setIsSubmitting(false);
      }
  }, [isSubmitting, onComplete]);

  // Eksekusi Submit Berdasarkan Perintah dari Parent
  useEffect(() => {
    if ((manualSubmit || forceSubmit) && !isSubmitting) {
        submitDataToBackend();
    }
  }, [manualSubmit, forceSubmit, submitDataToBackend, isSubmitting]);

  // Timer per Kolom
  useEffect(() => {
    if (!grid.length) return;
    setColumnTimeLeft(dbConfig.durationPerColumn);
    
    const timer = setInterval(() => {
      setColumnTimeLeft((prev) => {
        if (prev <= 1) {
            clearInterval(timer);
            return 0;
        }
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
  const handleMoveToNextColumn = () => {
    if (currentColumn < dbConfig.columns - 1) {
      setCurrentColumn((prev) => prev + 1);
      setActiveInputIndex(dbConfig.rows - 2); 
      setCurrentInputValue("");
    } else {
      submitDataToBackend(); 
    }
  };

  const handleInput = (val: string) => {
    if (!/^\d?$/.test(val)) return;
    setCurrentInputValue(val);
    
    if (val === "") return;
    const numVal = parseInt(val, 10);
    
    // Gunakan fungsi updater pada SetState & update Ref secara Instan!
    setAnswers(prev => {
        const newAnswers = prev.map((col, cIdx) => {
            if (cIdx === currentColumn) {
                const newCol = [...col];
                newCol[activeInputIndex] = numVal;
                return newCol;
            }
            return col;
        });
        answersRef.current = newAnswers; // KUNCI: Menjamin nilai tidak pernah null
        return newAnswers;
    });
    
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

  // --- SCROLL LOGIC PRESISI TINGGI ---
  useEffect(() => {
    inputRef.current?.focus();
    
    const timer = setTimeout(() => {
        const container = scrollContainerRef.current;
        const activeInputEl = document.getElementById(`input-row-${currentColumn}-${activeInputIndex}`);
        
        if (container && activeInputEl) {
            let offsetTop = 0;
            let offsetLeft = 0;
            let el: HTMLElement | null = activeInputEl;
            
            while (el && el !== container) {
                offsetTop += el.offsetTop;
                offsetLeft += el.offsetLeft;
                el = el.offsetParent as HTMLElement;
            }

            const targetY = offsetTop - (container.clientHeight / 2) + (activeInputEl.clientHeight / 2);
            const targetX = offsetLeft - (container.clientWidth / 2) + (activeInputEl.clientWidth / 2);

            container.scrollTo({
                top: targetY,
                left: targetX,
                behavior: "smooth"
            });
        }
    }, 20);

    return () => clearTimeout(timer);
  }, [activeInputIndex, currentColumn]);

  if (!grid.length) return <div className="p-10 text-center">Memuat Tes...</div>;

  const progressPercent = ((dbConfig.durationPerColumn - columnTimeLeft) / dbConfig.durationPerColumn) * 100;

  return (
    <div className="max-w-[95vw] mx-auto h-[calc(100vh-100px)] flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
       {/* HEADER */}
      <div className="flex-none bg-white p-4 z-20 border-b border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Play className="text-blue-600 fill-blue-600" size={20} /> Tes Kraepelin
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Jumlahkan dua angka vertikal, ketik digit terakhirnya.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Waktu Kolom</span>
                <div className="text-2xl font-mono font-bold text-blue-600 tabular-nums">
                  {columnTimeLeft}s
                </div>
             </div>
          </div>
        </div>

        {/* PROGRESS BAR & CONTROLS */}
        <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
            <div className="flex-1">
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                   <span className="text-gray-600">Progress Kolom {columnTimeLeft}s</span>
                   <span className="text-blue-600">{Math.round(progressPercent)}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-blue-500 transition-all duration-1000 ease-linear rounded-full"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>

            <div className="h-8 w-px bg-gray-300 mx-2"></div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-600 whitespace-nowrap">
                Kolom <strong className="text-gray-900">{currentColumn + 1}</strong> <span className="text-gray-400">/ {dbConfig.columns}</span>
              </span>
              <button 
                  onClick={manualSkip}
                  className="text-xs bg-gray-900 hover:bg-black text-white px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                  Skip <SkipForward size={12} />
              </button>
            </div>
        </div>
      </div>
      
      {/* AREA KOTAK TES DENGAN REF */}
      <div 
        ref={scrollContainerRef} 
        className="flex-1 overflow-x-auto overflow-y-auto bg-slate-50 relative custom-scrollbar scroll-smooth"
      >
        <div className="flex gap-2 min-w-max h-full items-start px-4">
            {grid.map((colData, colIndex) => {
                const isCurrentCol = colIndex === currentColumn;
                
                return (
                    <div 
                        key={colIndex} 
                        id={`col-container-${colIndex}`}
                        className={`
                            flex flex-col items-center flex-shrink-0 transition-all duration-300
                            py-[30vh]
                            ${isCurrentCol ? 'opacity-100 scale-100 z-10' : 'opacity-40 scale-95 grayscale'}
                        `}
                        style={{ width: '64px' }}
                    >
                        {/* HEADER KOLOM */}
                        <div className={`
                            mb-3 font-bold text-[10px] px-2 py-1 rounded-full border
                            ${isCurrentCol ? 'bg-blue-600 text-white border-blue-600 shadow-md transform -translate-y-1' : 'bg-white text-gray-400 border-gray-200'}
                        `}>
                            #{colIndex + 1}
                        </div>

                        {/* ANGKAS & INPUTS LOOP */}
                        <div className={`
                            flex flex-col items-center py-3 px-1 rounded-xl border transition-all duration-300
                            ${isCurrentCol ? 'bg-white border-blue-200 shadow-xl ring-4 ring-blue-50/50' : 'bg-gray-100/50 border-transparent'}
                        `}>
                            {colData.map((number, rowIndex) => {
                                const isLastNumber = rowIndex === colData.length - 1;
                                const isActiveInput = isCurrentCol && rowIndex === activeInputIndex;
                                const answerValue = answers[colIndex] ? answers[colIndex][rowIndex] : null;

                                return (
                                    <div 
                                        key={rowIndex} 
                                        id={`input-row-${colIndex}-${rowIndex}`}
                                        className="flex flex-col items-center relative"
                                    >
                                        {/* 1. ANGKA */}
                                        <div className={`
                                          text-2xl font-mono font-bold h-10 flex items-center justify-center w-10 rounded
                                          ${isCurrentCol ? 'text-gray-800' : 'text-gray-400'}
                                        `}>
                                            {number}
                                        </div>

                                        {/* 2. INPUT SLOT */}
                                        {!isLastNumber && (
                                            <div className="h-10 w-10 flex items-center justify-center my-1.5 relative">
                                                {isCurrentCol && <div className="absolute h-full w-[2px] bg-blue-100 -z-10 rounded-full"></div>}

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
                                                            if (e.key === 'Enter') handleInput(currentInputValue || '0'); 
                                                        }}
                                                        className="w-full h-full text-center text-2xl font-bold border-2 border-blue-500 rounded-lg bg-white shadow-lg focus:outline-none ring-4 ring-blue-100 z-20 transition-all transform scale-110"
                                                    />
                                                ) : (
                                                    <div className={`
                                                        w-8 h-8 flex items-center justify-center rounded-md text-sm font-bold transition-all
                                                        ${answerValue !== null 
                                                          ? 'text-white bg-green-500 shadow-sm scale-100' 
                                                          : isCurrentCol 
                                                            ? 'bg-gray-100 text-gray-300 scale-75'
                                                            : 'bg-transparent text-transparent'
                                                        }
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