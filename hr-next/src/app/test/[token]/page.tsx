"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { AlertTriangle, Clock, Shield, ClipboardCheck, Info, Check } from "lucide-react";
// Pastikan path import komponen di bawah ini sudah benar di project Anda
import CFITTest from "@/components/test/CFITTest";
import PAPITest from "@/components/test/PAPITest";
import KraepelinTest from "@/components/test/KraepelinTest";
import { cfitQuestions, papiQuestions, TEST_DURATION } from "@/lib/test-data";
import TestIntroModal from "@/components/test/TestIntroModal"; // Impor modal baru

type TestType = "cfit" | "kraepelin" | "papi";

// API Config
// const API_BASE_URL = "http://localhost:5000";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface TestState {
  currentTest: TestType;
  cfitAnswers: (number | null)[];
  papiAnswers: (number | null)[];
  kraepelinResults: any;
  timeRemaining: number;
  isStarted: boolean;
  isCompleted: boolean;
}

export default function TestExamPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  
  // --- PERBAIKAN: Hooks dipindahkan ke DALAM function component ---
  const token = params?.token as string; // Tambahkan safe access
  const candidateNameParam = searchParams.get("candidate") || "Kandidat";

  const [realCandidateName, setRealCandidateName] = useState<string>("");
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);
  const [isMobile, setIsMobile] = useState(false); // New state for mobile check
  const [triggerKraepelinSubmit, setTriggerKraepelinSubmit] = useState(false);

  const [state, setState] = useState<TestState>({
    currentTest: "cfit",
    cfitAnswers: new Array(cfitQuestions.length).fill(null),
    papiAnswers: new Array(papiQuestions.length).fill(null),
    kraepelinResults: null,
    timeRemaining: TEST_DURATION,
    isStarted: false,
    isCompleted: false,
  });

  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [completedTests, setCompletedTests] = useState<TestType[]>([]);
  
  // Security States
  const [violationCount, setViolationCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSecurityWarning, setShowSecurityWarning] = useState(false);
  const MAX_VIOLATIONS = 3;
  
  const [dbQuestions, setDbQuestions] = useState<{cfit: any[], papi: any[]}>({ cfit: [], papi: [] });
  const [kraepelinConfig, setKraepelinConfig] = useState<any>(null);

  // Modal State
  const [showIntroModal, setShowIntroModal] = useState(false);
  const [selectedTestToStart, setSelectedTestToStart] = useState<TestType | null>(null);

    const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem("access_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};
  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    if (/android/i.test(userAgent) || /iPad|iPhone|iPod/.test(userAgent) || window.innerWidth < 768) {
        setIsMobile(true);
    }
    
    // Resize listener for desktop resize
    const handleResize = () => {
        if (window.innerWidth < 768) setIsMobile(true);
        else setIsMobile(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch Data dari Database & Validasi Token
  useEffect(() => {
    if (!token) return;

    const fetchAllData = async () => {
      try {
        // 1. Cek Token
        const res = await fetch(`${API_BASE_URL}/submission/check-token/${token}`, { headers: getAuthHeaders() });
        
        if (res.ok) {
          const data = await res.json();
          setRealCandidateName(data.candidate_name);
          setIsTokenValid(true);
          
          // Load completed tests from backend
          if (data.completed_tests && Array.isArray(data.completed_tests)) {
             setCompletedTests(data.completed_tests);
          }
        } else {
          setIsTokenValid(false);
          // Jika token tidak valid, stop fetch lainnya
          return;
        }

        // 2. Ambil Config Kraepelin
        const resKrae = await fetch(`${API_BASE_URL}/management/config/kraepelin`, { headers: getAuthHeaders() });
        if (resKrae.ok) {
           const dataKrae = await resKrae.json();
           setKraepelinConfig(dataKrae);
        }

        // 3. Ambil Soal CFIT
        const resCfit = await fetch(`${API_BASE_URL}/management/questions/cfit`, { headers: getAuthHeaders() });
        const dataCfit = await resCfit.json();
        
        // 4. Ambil Soal PAPI
        const resPapi = await fetch(`${API_BASE_URL}/management/questions/papi`, { headers: getAuthHeaders() });
        const dataPapi = await resPapi.json();

        setDbQuestions({ cfit: dataCfit, papi: dataPapi });

        // Update state jawaban sesuai jumlah soal dari DB
        setState(prev => ({
          ...prev,
          cfitAnswers: new Array(dataCfit.length).fill(null),
          papiAnswers: new Array(dataPapi.length).fill(null),
        }));

      } catch (err) {
        console.error("Gagal mengambil data dari database:", err);
        setIsTokenValid(false); // Anggap invalid jika koneksi error
      }
    };

    fetchAllData();
  }, [token]); 

  // Timer Logic
  useEffect(() => {
    if (!state.isStarted || state.isCompleted) return;

    const timer = setInterval(() => {
      setState((prev) => {
        if (prev.timeRemaining <= 1) {
          // Waktu habis, otomatis trigger selesai untuk tes saat ini
          // Note: handleTestComplete butuh dipanggil di effect atau event handler lain
          // Di sini kita set time 0 dulu, nanti logic submit bisa ditrigger
          return { ...prev, timeRemaining: 0 }; 
        }
        return { ...prev, timeRemaining: prev.timeRemaining - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [state.isStarted, state.isCompleted]);

  // Pantau Timer Habis (0 detik) -> Auto Submit / Complete
  useEffect(() => {
      if (state.isStarted && state.timeRemaining === 0) {
          handleTestComplete();
      }
  }, [state.timeRemaining, state.isStarted]);


  // Request Fullscreen
  const requestFullscreen = async () => {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if ((elem as any).webkitRequestFullscreen) {
        await (elem as any).webkitRequestFullscreen();
      } else if ((elem as any).msRequestFullscreen) {
        await (elem as any).msRequestFullscreen();
      }
      setIsFullscreen(true);
    } catch (err) {
    }
  };

  // Handle Security Violation
  const handleViolation = (reason: string) => {
    if (!state.isStarted) return;
    
    const newCount = violationCount + 1;
    setViolationCount(newCount);
    setWarningMessage(`⚠️ Peringatan ${newCount}/${MAX_VIOLATIONS}: ${reason}`);
    setShowSecurityWarning(true);
    
    if (newCount >= MAX_VIOLATIONS) {
      setTimeout(() => {
        submitCurrentTest();
        setWarningMessage("Tes otomatis disubmit karena terlalu banyak pelanggaran!");
      }, 1500);
    }
  };

  // Anti-Cheat: Visibility Change Detection
  useEffect(() => {
    if (!state.isStarted) return;
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleViolation("Terdeteksi berpindah tab atau minimize browser!");
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [state.isStarted, violationCount]);

  // Anti-Cheat: Window Blur Detection  
  useEffect(() => {
    if (!state.isStarted) return;
    
    const handleBlur = () => {
      handleViolation("Terdeteksi keluar dari jendela tes!");
    };
    
    window.addEventListener("blur", handleBlur);
    return () => window.removeEventListener("blur", handleBlur);
  }, [state.isStarted, violationCount]);

  // Anti-Cheat: Right-click Prevention
  useEffect(() => {
    if (!state.isStarted) return;
    
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      handleViolation("Klik kanan tidak diperbolehkan!");
    };
    
    document.addEventListener("contextmenu", handleContextMenu);
    return () => document.removeEventListener("contextmenu", handleContextMenu);
  }, [state.isStarted, violationCount]);

  // Anti-Cheat: Keyboard Shortcuts Prevention
  useEffect(() => {
    if (!state.isStarted) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block: Ctrl+C, Ctrl+V, Ctrl+P, F12, Ctrl+Shift+I
      if (
        (e.ctrlKey && ["c", "v", "p", "u"].includes(e.key.toLowerCase())) ||
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "i")
      ) {
        e.preventDefault();
        handleViolation("Shortcut keyboard terlarang terdeteksi!");
      }
    };
    
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [state.isStarted, violationCount]);

  // Anti-Cheat: Prevent Browser Back/Close
  useEffect(() => {
    if (!state.isStarted) return;
    
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Tes sedang berlangsung. Yakin ingin meninggalkan halaman?";
      return e.returnValue;
    };
    
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [state.isStarted]);

  // Track Fullscreen Exit
  useEffect(() => {
    if (!state.isStarted) return;
    
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isFullscreen) {
        setIsFullscreen(false);
        handleViolation("Keluar dari mode fullscreen!");
      }
    };
    
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [state.isStarted, isFullscreen]);

  const handleTestSelection = (testType: TestType) => {
    if (completedTests.includes(testType)) return;
    setSelectedTestToStart(testType);
    setShowIntroModal(true);
  };

  const confirmStartTest = () => {
      if (!selectedTestToStart) return;
      
      const testType = selectedTestToStart;
      let duration = TEST_DURATION;

      // Override durasi jika tes Kraepelin dan config tersedia
      if (testType === "kraepelin" && kraepelinConfig) {
        duration = kraepelinConfig.columns * kraepelinConfig.duration_per_column;
      }

      // Request fullscreen when starting test
      requestFullscreen();
      
      // Reset violation count
      setViolationCount(0);

      setState((prev) => ({
        ...prev,
        currentTest: testType,
        timeRemaining: duration,
        isStarted: true,
      }));
      
      // Close modal
      setShowIntroModal(false);
      setSelectedTestToStart(null);
  };

  const finalizeAllTests = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/submission/finalize`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ token: token }),
      });
      if (response.ok) {
      }
    } catch (err) {
    }
  };

  // Effect untuk Finalize saat semua selesai
  useEffect(() => {
    if (completedTests.length === 3) {
      finalizeAllTests();
    }
  }, [completedTests]);

  const handleCFITAnswer = (questionIndex: number, answer: number) => {
    setState((prev) => {
      const newAnswers = [...prev.cfitAnswers];
      newAnswers[questionIndex] = answer;
      return { ...prev, cfitAnswers: newAnswers };
    });
  };

  const handlePAPIAnswer = (questionIndex: number, answer: number) => {
    setState((prev) => {
      const newAnswers = [...prev.papiAnswers];
      newAnswers[questionIndex] = answer;
      return { ...prev, papiAnswers: newAnswers };
    });
  };

  const handleTestComplete = () => {
    if (!completedTests.includes(state.currentTest)) {
      setCompletedTests((prev) => [...prev, state.currentTest]);
    }
    
    setState((prev) => ({ 
      ...prev, 
      isStarted: false 
    }));
  };

  const handleKraepelinComplete = (results: any) => {
    setCompletedTests((prev) => [...prev, "kraepelin"]);
    setState((prev) => ({
      ...prev,
      kraepelinResults: results,
      isStarted: false,
    }));
  };

// Di dalam TestExamPage.tsx

const submitCurrentTest = async () => {
    // 1. CEGAH KRAEPELIN DISUBMIT DARI SINI
    // Kraepelin punya tombol submit sendiri di komponen anaknya (KraepelinTest.tsx).
    // Jadi kita hentikan proses di sini agar tidak double submit atau error.
    if (state.currentTest === "kraepelin") {
        setTriggerKraepelinSubmit(true); 
        return; 
    }

    // 2. TENTUKAN ENDPOINT
    let endpoint = "";
    let payload: any = { token: token };

    if (state.currentTest === "cfit") {
      endpoint = "cfit";
      payload.answers = state.cfitAnswers;
    } else if (state.currentTest === "papi") {
      endpoint = "papi";
      payload.answers = state.papiAnswers;
    } 

    // 3. VALIDASI ENDPOINT (PENTING!)
    // Jika endpoint masih kosong (misal ada error logika), jangan lakukan fetch.
    if (!endpoint) {
        console.error("Error: Endpoint tidak terdefinisi untuk tes ini.");
        return;
    }

    // 4. EKSEKUSI FETCH
    try {
      const response = await fetch(`${API_BASE_URL}/submission/${endpoint}`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        handleTestComplete();
      } else {
        const errorMsg = await response.json();
        alert(`Gagal mengirim ${endpoint}: ${errorMsg.error || 'Server Error'}`);
      }
    } catch (err) {
      console.error(`Koneksi ke Backend gagal (${endpoint}):`, err);
      // alert("Koneksi ke server terputus."); // Opsional: matikan alert jika mengganggu
    }
  };

  const allTestsCompleted = completedTests.length === 3;

  // --- TAMPILAN JIKA MOBILE ---
  if (isMobile) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50 p-6 text-center">
            <div className="bg-white p-8 rounded-xl shadow-xl max-w-sm border-t-4 border-red-600">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <h1 className="text-xl font-bold text-gray-900 mb-2">Perangkat Tidak Didukung</h1>
                <p className="text-gray-600 mb-6 text-sm">
                    Ujian ini memerlukan konsentrasi dan tampilan layar penuh. 
                    Silakan akses menggunakan <b>Laptop</b> atau <b>PC Desktop</b>.
                </p>
                <div className="bg-gray-100 p-3 rounded text-xs text-gray-500">
                    Sistem mendeteksi layar mobile/tablet.
                </div>
            </div>
        </div>
      );
  }

  // --- TAMPILAN JIKA TOKEN TIDAK VALID ---
  if (isTokenValid === false) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
                <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Akses Ditolak</h1>
                <p className="text-gray-600">Token ujian tidak valid atau sudah kadaluarsa.</p>
            </div>
        </div>
    );
  }

  // --- TAMPILAN LOADING CHECK TOKEN ---
  if (isTokenValid === null) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-pulse flex flex-col items-center">
                <div className="h-8 w-8 bg-blue-600 rounded-full mb-4 animate-bounce"></div>
                <p className="text-gray-500 font-medium">Memverifikasi sesi ujian...</p>
            </div>
        </div>
      );
  }

  // --- SCREEN: SELESAI SEMUA TES ---
  if (allTestsCompleted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white shadow p-8 max-w-lg text-center">
          <div className="w-16 h-16 bg-green-100 flex items-center justify-center mx-auto mb-6 text-3xl">✓</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Selesai!</h2>
          <p className="text-gray-600 mb-6">Terima kasih, {realCandidateName}. Hasil Anda telah disimpan.</p>
          <p className="text-sm text-gray-500">Anda dapat menutup halaman ini.</p>
        </div>
      </div>
    );
  }

  // --- SCREEN: MENU PILIH TEST ---
  if (!state.isStarted && !allTestsCompleted) {
    const testConfigs = [
      { type: "cfit" as TestType, name: "CFIT Intelligence Test", icon: "🧠", color: "blue", questions: dbQuestions.cfit.length || cfitQuestions.length, time: "3 menit" },
      { type: "kraepelin" as TestType, name: "Kraepelin Test", icon: "📊", color: "green", questions: 50, time: "Per Kolom" },
      { type: "papi" as TestType, name: "PAPI Kostick", icon: "👤", color: "purple", questions: dbQuestions.papi.length || papiQuestions.length, time: "3 menit" },
    ];

    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <ClipboardCheck className="w-6 h-6 text-blue-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">HR Assessment Tests</h1>
                <p className="text-sm text-gray-600">{realCandidateName || "Memuat..."}</p>
              </div>
            </div>
          </div>
        </nav>

        {/* TEST INTRO MODAL */}
        {showIntroModal && selectedTestToStart && (
            <TestIntroModal 
                testType={selectedTestToStart}
                candidateName={realCandidateName}
                onStart={confirmStartTest}
                onCancel={() => setShowIntroModal(false)}
            />
        )}

        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Pilih Test</h2>
            <div className="bg-blue-50 border border-blue-200 p-4">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-600" />
                <p className="text-blue-800 text-sm">
                  <strong>Tips:</strong> Jawab sebanyak mungkin! Soal ditampilkan semua, scroll untuk menjawab dengan cepat.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3 mb-8">
            {testConfigs.map((config) => {
              const isCompleted = completedTests.includes(config.type);
              return (
                <div key={config.type} className="bg-white shadow border border-gray-200 p-6 hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-3xl">{config.icon}</div>
                    {isCompleted && <Check className="w-6 h-6 text-green-600" />}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{config.name}</h3>
                  <div className="space-y-1 mb-4 text-sm text-gray-600">
                    <p>📝 {config.questions} soal</p>
                    <p>⏱️ {config.time}</p>
                  </div>
                  <button
                    onClick={() => !isCompleted && handleTestSelection(config.type)}
                    disabled={isCompleted}
                    className={`w-full py-3 font-medium ${
                      isCompleted ? "bg-green-100 text-green-800" : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {isCompleted ? "✓ Selesai" : "Mulai Test"}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="bg-white shadow border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-gray-900">Progress</h3>
              <span className="text-sm text-gray-600">{completedTests.length}/3</span>
            </div>
            <div className="w-full bg-gray-200 h-3">
              <div className="bg-blue-600 h-3 transition-all" style={{ width: `${(completedTests.length / 3) * 100}%` }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- SCREEN: UJIAN AKTIF (SEDANG BERJALAN) ---
  return (
    <div className="min-h-screen bg-gray-100">
      {showWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 max-w-md">
            <div className="flex gap-4">
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
              <div>
                <h3 className="font-bold text-lg mb-2">Peringatan!</h3>
                <p className="text-gray-600 mb-4">{warningMessage}</p>
                <button onClick={() => setShowWarning(false)} className="px-4 py-2 bg-blue-600 text-white">
                  Mengerti
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Violation Warning Modal */}
      {showSecurityWarning && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl p-8 max-w-md shadow-2xl animate-pulse">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Shield className="w-10 h-10 text-red-600" />
              </div>
              <h3 className="font-bold text-xl text-red-600 mb-2">⚠️ Pelanggaran Keamanan!</h3>
              <p className="text-gray-700 mb-2">{warningMessage}</p>
              <p className="text-sm text-gray-500 mb-4">
                Pelanggaran: <span className={`font-bold ${violationCount >= MAX_VIOLATIONS ? 'text-red-600' : 'text-orange-500'}`}>{violationCount}/{MAX_VIOLATIONS}</span>
              </p>
              {violationCount >= MAX_VIOLATIONS ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 w-full">
                  <p className="text-red-700 font-medium">Batas pelanggaran tercapai!</p>
                  <p className="text-red-600 text-sm">Tes akan otomatis disubmit...</p>
                </div>
              ) : (
                <button 
                  onClick={() => {
                    setShowSecurityWarning(false);
                    requestFullscreen();
                  }} 
                  className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  Saya Mengerti, Lanjutkan Tes
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <nav className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <div>
            <h2 className="font-bold text-gray-900">
              {state.currentTest === "cfit" && "CFIT Intelligence Test"}
              {state.currentTest === "kraepelin" && "Kraepelin Test"}
              {state.currentTest === "papi" && "PAPI Kostick Test"}
            </h2>
            <p className="text-sm text-gray-500">{realCandidateName}</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Violation Counter */}
            {violationCount > 0 && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${
                violationCount >= MAX_VIOLATIONS 
                  ? 'bg-red-100 text-red-700' 
                  : violationCount >= 2 
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-orange-100 text-orange-700'
              }`}>
                <AlertTriangle size={16} />
                <span>{violationCount}/{MAX_VIOLATIONS}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-500" />
              <span className={`font-mono text-lg ${state.timeRemaining < 60 ? "text-red-600 font-bold" : ""}`}>
                {Math.floor(state.timeRemaining / 60).toString().padStart(2, "0")}:
                {(state.timeRemaining % 60).toString().padStart(2, "0")}
              </span>
            </div>
            <button
              onClick={submitCurrentTest}
              className="px-4 py-2 bg-green-600 text-white hover:bg-green-700"
            >
              Selesai & Submit
            </button>
          </div>
        </div>
      </nav>

      <div className="py-6 px-4">
        {state.currentTest === "cfit" && (
          <CFITTest
            questions={dbQuestions.cfit}
            answers={state.cfitAnswers}
            onAnswer={handleCFITAnswer}
            timeRemaining={state.timeRemaining}
          />
        )}
        
        {state.currentTest === "kraepelin" && kraepelinConfig ? (
          <KraepelinTest
            timeRemaining={state.timeRemaining}
            onComplete={handleKraepelinComplete}
            dbConfig={kraepelinConfig}
            forceSubmit={violationCount >= MAX_VIOLATIONS} 
            manualSubmit={triggerKraepelinSubmit}
          />
        ) : state.currentTest === "kraepelin" && (
          <div className="flex flex-col items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Memuat konfigurasi tes...</p>
          </div>
        )}

        {state.currentTest === "papi" && dbQuestions.papi.length > 0 && (
          <PAPITest
            questions={dbQuestions.papi} 
            answers={state.papiAnswers}
            onAnswer={handlePAPIAnswer}
            timeRemaining={state.timeRemaining}
          />
        )}
      </div>
    </div>
  );
}