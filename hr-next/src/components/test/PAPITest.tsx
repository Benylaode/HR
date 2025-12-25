"use client";

// Interface disesuaikan dengan response JSON dari Backend Flask (get_papi_questions)
interface PAPIQuestion {
  id: number;
  option_a: string; // Map ke statement_a di database
  option_b: string; // Map ke statement_b di database
  question?: string; 
}

interface PAPITestProps {
  questions: PAPIQuestion[];
  answers: (number | null)[];
  onAnswer: (questionIndex: number, answer: number) => void;
  timeRemaining: number;
}

export default function PAPITest({
  questions,
  answers,
  onAnswer,
  timeRemaining,
}: PAPITestProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const answeredCount = answers.filter((a) => a !== null).length;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header Progres & Timer */}
      <div className="sticky top-16 z-30 bg-white border-b border-gray-200 p-4 mb-6 shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-sm text-gray-600">Progress: </span>
            <span className="font-bold text-green-600">{answeredCount}/{questions.length}</span>
          </div>
          <div className={`text-xl font-mono font-bold ${timeRemaining < 60 ? "text-red-600" : "text-gray-900"}`}>
            ⏱️ {formatTime(timeRemaining)}
          </div>
        </div>
        <div className="w-full bg-gray-200 h-2 mt-2">
          <div
            className="bg-green-600 h-2 transition-all"
            style={{ width: `${(answeredCount / (questions.length || 1)) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Daftar Soal dari Database */}
      <div className="space-y-4">
        {questions.map((question, index) => (
          <div
            key={question.id}
            id={`question-${index}`}
            className={`bg-white border shadow-sm p-5 transition-colors ${
              answers[index] !== null ? "border-green-300 bg-green-50/30" : "border-gray-200"
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-green-700 text-white px-3 py-1 text-sm font-bold rounded">
                {index + 1}
              </span>
              <span className="text-gray-700 font-medium">
                Pilih pernyataan yang paling menggambarkan diri Anda:
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Pilihan A (statement_a) */}
              <button
                onClick={() => onAnswer(index, 0)}
                className={`p-4 border-2 text-left rounded-lg transition-all ${
                  answers[index] === 0
                    ? "border-green-500 bg-green-100 ring-2 ring-green-200"
                    : "border-gray-200 hover:border-green-300 hover:bg-green-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 flex items-center justify-center font-bold text-white rounded-full flex-shrink-0 ${
                    answers[index] === 0 ? "bg-green-600" : "bg-gray-400"
                  }`}>
                    A
                  </div>
                  <span className="text-sm leading-relaxed">{question.option_a}</span>
                </div>
              </button>

              {/* Pilihan B (statement_b) */}
              <button
                onClick={() => onAnswer(index, 1)}
                className={`p-4 border-2 text-left rounded-lg transition-all ${
                  answers[index] === 1
                    ? "border-green-500 bg-green-100 ring-2 ring-green-200"
                    : "border-gray-200 hover:border-green-300 hover:bg-green-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 flex items-center justify-center font-bold text-white rounded-full flex-shrink-0 ${
                    answers[index] === 1 ? "bg-green-600" : "bg-gray-400"
                  }`}>
                    B
                  </div>
                  <span className="text-sm leading-relaxed">{question.option_b}</span>
                </div>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Ringkasan Navigasi Bawah */}
      <div className="sticky bottom-0 bg-white border-t shadow-lg p-4 mt-8">
        <div className="flex justify-between items-center max-w-2xl mx-auto">
          <div className="text-xs text-gray-500 italic">
            Klik nomor untuk kembali ke soal
          </div>
          <div className="flex gap-1 flex-wrap justify-end">
            {questions.map((_, index) => (
              <a
                key={index}
                href={`#question-${index}`}
                className={`w-6 h-6 text-[10px] flex items-center justify-center border transition-all ${
                  answers[index] !== null
                    ? "bg-green-500 text-white border-green-600"
                    : "bg-gray-100 text-gray-400 border-gray-200 hover:border-blue-400"
                }`}
              >
                {index + 1}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}