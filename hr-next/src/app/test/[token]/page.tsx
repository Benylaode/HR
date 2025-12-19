"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { AlertTriangle, Clock, Shield, ClipboardCheck, Info, Check } from "lucide-react";
import CFITTest from "@/components/test/CFITTest";
import PAPITest from "@/components/test/PAPITest";
import KraepelinTest from "@/components/test/KraepelinTest";
import { cfitQuestions, papiQuestions, TEST_DURATION } from "@/lib/test-data";

type TestType = "cfit" | "kraepelin" | "papi";

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
  const token = params.token as string;
  const candidateName = searchParams.get("candidate") || "Kandidat";

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

  // Timer
  useEffect(() => {
    if (!state.isStarted || state.isCompleted) return;

    const timer = setInterval(() => {
      setState((prev) => {
        if (prev.timeRemaining <= 1) {
          handleTestComplete();
          return { ...prev, timeRemaining: 0 };
        }
        return { ...prev, timeRemaining: prev.timeRemaining - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [state.isStarted, state.isCompleted, state.currentTest]);

  // Anti-cheat
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && state.isStarted) {
        setWarningMessage("Anda keluar dari halaman tes!");
        setShowWarning(true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [state.isStarted]);

  const startTest = (testType: TestType) => {
    setState((prev) => ({
      ...prev,
      currentTest: testType,
      timeRemaining: TEST_DURATION,
      isStarted: true,
    }));
  };

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
    setState((prev) => ({ ...prev, isStarted: false }));
  };

  const handleKraepelinComplete = (results: any) => {
    setCompletedTests((prev) => [...prev, "kraepelin"]);
    setState((prev) => ({
      ...prev,
      kraepelinResults: results,
      isStarted: false,
    }));
  };

  const submitCurrentTest = () => {
    handleTestComplete();
  };

  const allTestsCompleted = completedTests.length === 3;

  // Test Selection Screen
  if (!state.isStarted && !allTestsCompleted) {
    const testConfigs = [
      { type: "cfit" as TestType, name: "CFIT Intelligence Test", icon: "🧠", color: "blue", questions: cfitQuestions.length, time: "3 menit" },
      { type: "kraepelin" as TestType, name: "Kraepelin Test", icon: "📊", color: "green", questions: 50, time: "3 menit" },
      { type: "papi" as TestType, name: "PAPI Kostick", icon: "👤", color: "purple", questions: papiQuestions.length, time: "3 menit" },
    ];

    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <ClipboardCheck className="w-6 h-6 text-blue-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">HR Assessment Tests</h1>
                <p className="text-sm text-gray-600">{candidateName}</p>
              </div>
            </div>
          </div>
        </nav>

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
                    onClick={() => !isCompleted && startTest(config.type)}
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

  // Completed Screen
  if (allTestsCompleted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white shadow p-8 max-w-lg text-center">
          <div className="w-16 h-16 bg-green-100 flex items-center justify-center mx-auto mb-6 text-3xl">✓</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Selesai!</h2>
          <p className="text-gray-600 mb-6">Terima kasih, {candidateName}. Hasil Anda telah disimpan.</p>
          <p className="text-sm text-gray-500">Anda dapat menutup halaman ini.</p>
        </div>
      </div>
    );
  }

  // Active Test
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

      <nav className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <div>
            <h2 className="font-bold text-gray-900">
              {state.currentTest === "cfit" && "CFIT Intelligence Test"}
              {state.currentTest === "kraepelin" && "Kraepelin Test"}
              {state.currentTest === "papi" && "PAPI Kostick Test"}
            </h2>
            <p className="text-sm text-gray-500">{candidateName}</p>
          </div>
          <div className="flex items-center gap-4">
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
            questions={cfitQuestions}
            answers={state.cfitAnswers}
            onAnswer={handleCFITAnswer}
            timeRemaining={state.timeRemaining}
          />
        )}

        {state.currentTest === "kraepelin" && (
          <KraepelinTest
            timeRemaining={state.timeRemaining}
            onComplete={handleKraepelinComplete}
          />
        )}

        {state.currentTest === "papi" && (
          <PAPITest
            questions={papiQuestions}
            answers={state.papiAnswers}
            onAnswer={handlePAPIAnswer}
            timeRemaining={state.timeRemaining}
          />
        )}
      </div>
    </div>
  );
}
