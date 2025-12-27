"use client";

// 1. Sesuaikan import interface jika sudah didefinisikan secara global atau biarkan jika tetap ingin memakai any
interface CFITQuestion {
  id: number;
  subtest: number;
  subtestName: string;
  instruction: string;
  question_image: string | null;
  options: string[] | string; // BE mengirim string "A,B,C..." atau array
  correctAnswer: number | number[];
}

interface CFITTestProps {
  questions: CFITQuestion[];
  answers: (number | null)[];
  onAnswer: (questionIndex: number, answer: number) => void;
  timeRemaining: number;
}

export default function CFITTest({
  questions,
  answers,
  onAnswer,
  timeRemaining,
}: CFITTestProps) {
  const BE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const answeredCount = answers.filter((a) => a !== null).length;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Sticky Header */}
      <div className="sticky top-16 z-30 bg-white border-b border-gray-200 p-4 mb-6 shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-sm text-gray-600">Progress: </span>
            <span className="font-bold text-blue-600">{answeredCount}/{questions.length}</span>
            <span className="text-sm text-gray-500 ml-2">soal terjawab</span>
          </div>
          <div className={`text-xl font-mono font-bold ${timeRemaining < 60 ? "text-red-600" : "text-gray-900"}`}>
            ⏱️ {formatTime(timeRemaining)}
          </div>
        </div>
        <div className="w-full bg-gray-200 h-2 mt-2">
          <div
            className="bg-blue-600 h-2 transition-all"
            style={{ width: `${(answeredCount / (questions.length || 1)) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* All Questions - Scrollable */}
      <div className="space-y-6">
        {questions.map((question, index) => {
          // 2. Karena di Backend 'options' disimpan sebagai string "A,B,C,D,E,F", 
          // kita perlu mengubahnya kembali menjadi array jika ia datang sebagai string.
          const optionsArray = typeof question.options === 'string' 
            ? question.options.split(",") 
            : question.options;

          return (
            <div
              key={question.id}
              id={`question-${index}`}
              className={`bg-white border shadow-sm p-6 ${
                answers[index] !== null ? "border-green-300 bg-green-50/30" : "border-gray-200"
              }`}
            >
              {/* Question Header */}
              <div className="flex items-center gap-3 mb-4">
                <span className={`px-3 py-1 text-sm font-bold ${
                  answers[index] !== null ? "bg-green-600 text-white" : "bg-red-600 text-white"
                }`}>
                  Soal {index + 1}
                </span>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 text-sm">
                  Subtest {question.subtest}: {question.subtestName}
                </span>
                {answers[index] !== null && (
                  <span className="text-green-600 text-sm">✓ Terjawab</span>
                )}
              </div>

              {/* Instruction */}
              <h3 className="text-lg font-medium text-gray-800 mb-4">
                {question.instruction}
              </h3>

              {/* 3. Question Image - Disesuaikan dengan URL Backend */}
              {question.question_image ? (
                <img
                  // Gabungkan Base URL Backend dengan path dari database
                  src={`${BE_URL}${question.question_image}`}
                  alt={`Soal ${index + 1}`}
                  className="max-w-full h-auto mb-4 border shadow-sm mx-auto"
                />
              ) : (
                <div className="bg-gray-100 h-32 flex items-center justify-center mb-4 text-gray-400 border text-center">
                  <p>📷 Gambar tidak tersedia</p>
                </div>
              )}

              {/* Options Grid */}
              <div className="flex flex-wrap gap-2 justify-center">
                {optionsArray.map((option, optIndex) => (
                  <button
                    key={optIndex}
                    onClick={() => onAnswer(index, optIndex)}
                    className={`w-14 h-14 border-2 text-center font-bold text-lg transition-all ${
                      answers[index] === optIndex
                        ? "border-green-500 bg-green-100 text-green-700 ring-2 ring-green-300"
                        : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Summary tetap sama */}
      <div className="sticky bottom-0 bg-white border-t shadow-lg p-4 mt-6">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            <span className="font-medium text-green-600">{answeredCount}</span> terjawab, 
            <span className="font-medium text-red-600 ml-1">{questions.length - answeredCount}</span> belum
          </div>
          <div className="flex gap-2 flex-wrap max-w-md">
            {questions.map((_, index) => (
              <a
                key={index}
                href={`#question-${index}`}
                className={`w-6 h-6 text-xs flex items-center justify-center border ${
                  answers[index] !== null
                    ? "bg-green-500 text-white border-green-600"
                    : "bg-gray-100 text-gray-600 border-gray-300 hover:bg-blue-100"
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