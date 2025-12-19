"use client";

import { PAPIQuestion } from "@/lib/test-data";

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
      {/* Sticky Header */}
      <div className="sticky top-16 z-30 bg-white border-b border-gray-200 p-4 mb-6 shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-sm text-gray-600">Progress: </span>
            <span className="font-bold text-green-600">{answeredCount}/{questions.length}</span>
            <span className="text-sm text-gray-500 ml-2">soal terjawab</span>
          </div>
          <div className={`text-xl font-mono font-bold ${timeRemaining < 60 ? "text-red-600" : "text-gray-900"}`}>
            ⏱️ {formatTime(timeRemaining)}
          </div>
        </div>
        <div className="w-full bg-gray-200 h-2 mt-2">
          <div
            className="bg-green-600 h-2 transition-all"
            style={{ width: `${(answeredCount / questions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* All Questions - Scrollable */}
      <div className="space-y-4">
        {questions.map((question, index) => (
          <div
            key={question.id}
            id={`question-${index}`}
            className={`bg-white border shadow-sm p-5 ${
              answers[index] !== null ? "border-green-300 bg-green-50/30" : "border-gray-200"
            }`}
          >
            {/* Question Header */}
            <div className="flex items-center gap-3 mb-3">
              <span className={`px-3 py-1 text-sm font-bold ${
                answers[index] !== null ? "bg-green-600 text-white" : "bg-green-700 text-white"
              }`}>
                {index + 1}
              </span>
              <span className="text-gray-700 font-medium">{question.question}</span>
              {answers[index] !== null && (
                <span className="text-green-600 text-sm ml-auto">✓</span>
              )}
            </div>

            {/* Binary Choice Options - Side by Side */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onAnswer(index, 0)}
                className={`p-4 border-2 text-left transition-all ${
                  answers[index] === 0
                    ? "border-green-500 bg-green-100"
                    : "border-gray-200 hover:border-green-300 hover:bg-green-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 flex items-center justify-center font-bold text-white flex-shrink-0 ${
                    answers[index] === 0 ? "bg-green-600" : "bg-gray-400"
                  }`}>
                    A
                  </div>
                  <span className="text-sm">{question.option_a}</span>
                </div>
              </button>

              <button
                onClick={() => onAnswer(index, 1)}
                className={`p-4 border-2 text-left transition-all ${
                  answers[index] === 1
                    ? "border-green-500 bg-green-100"
                    : "border-gray-200 hover:border-green-300 hover:bg-green-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 flex items-center justify-center font-bold text-white flex-shrink-0 ${
                    answers[index] === 1 ? "bg-green-600" : "bg-gray-400"
                  }`}>
                    B
                  </div>
                  <span className="text-sm">{question.option_b}</span>
                </div>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Summary */}
      <div className="sticky bottom-0 bg-white border-t shadow-lg p-4 mt-6">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            <span className="font-medium text-green-600">{answeredCount}</span> terjawab, 
            <span className="font-medium text-red-600 ml-1">{questions.length - answeredCount}</span> belum
          </div>
          <div className="flex gap-1 flex-wrap max-w-xs">
            {questions.map((_, index) => (
              <a
                key={index}
                href={`#question-${index}`}
                className={`w-5 h-5 text-xs flex items-center justify-center border ${
                  answers[index] !== null
                    ? "bg-green-500 text-white border-green-600"
                    : "bg-gray-100 text-gray-600 border-gray-300"
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
