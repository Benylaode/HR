"use client";

import { useState, useEffect, useCallback } from "react";
import { generateKraepelinGrid, kraepelinConfig } from "@/lib/test-data";

interface KraepelinTestProps {
  timeRemaining: number;
  onComplete: (results: KraepelinResult) => void;
}

interface KraepelinResult {
  answers: number[][];
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
}

export default function KraepelinTest({ timeRemaining, onComplete }: KraepelinTestProps) {
  const [grid, setGrid] = useState<number[][]>([]);
  const [currentColumn, setCurrentColumn] = useState(0);
  const [answers, setAnswers] = useState<number[][]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [currentRow, setCurrentRow] = useState(0);

  useEffect(() => {
    // Generate grid on mount
    const newGrid = generateKraepelinGrid(kraepelinConfig.columns, kraepelinConfig.rows);
    setGrid(newGrid);
    setAnswers(Array(kraepelinConfig.columns).fill([]).map(() => Array(kraepelinConfig.rows - 1).fill(null)));
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleInput = (value: string) => {
    if (!/^\d?$/.test(value)) return;
    setCurrentInput(value);

    if (value) {
      // Save answer
      const newAnswers = [...answers];
      newAnswers[currentColumn][currentRow] = parseInt(value);
      setAnswers(newAnswers);

      // Move to next row
      if (currentRow < kraepelinConfig.rows - 2) {
        setCurrentRow(currentRow + 1);
        setCurrentInput("");
      }
    }
  };

  const moveToNextColumn = () => {
    if (currentColumn < kraepelinConfig.columns - 1) {
      setCurrentColumn(currentColumn + 1);
      setCurrentRow(0);
      setCurrentInput("");
    }
  };

  if (grid.length === 0) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Tes Kraepelin</h2>
            <p className="text-gray-600">Jumlahkan dua angka yang berdekatan dari BAWAH ke ATAS</p>
          </div>
          <div className={`text-3xl font-mono font-bold ${timeRemaining < 60 ? "text-red-600" : "text-gray-900"}`}>
            {formatTime(timeRemaining)}
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 p-4 mb-4">
          <p className="text-yellow-800">
            <strong>Contoh:</strong> 7 + 5 = 12, tulis <strong>2</strong> (angka satuan)
          </p>
        </div>

        <div className="flex gap-4 text-sm">
          <span className="bg-blue-100 text-blue-800 px-3 py-1">
            Kolom: {currentColumn + 1} / {kraepelinConfig.columns}
          </span>
          <span className="bg-green-100 text-green-800 px-3 py-1">
            Baris: {currentRow + 1} / {kraepelinConfig.rows - 1}
          </span>
        </div>
      </div>

      {/* Grid Display */}
      <div className="bg-white border border-gray-200 p-6 overflow-x-auto">
        <div className="inline-flex gap-1">
          {/* Show current and nearby columns */}
          {grid.slice(Math.max(0, currentColumn - 2), currentColumn + 8).map((column, colOffset) => {
            const colIndex = Math.max(0, currentColumn - 2) + colOffset;
            const isCurrentColumn = colIndex === currentColumn;

            return (
              <div
                key={colIndex}
                className={`flex flex-col gap-1 ${isCurrentColumn ? "bg-blue-50 p-2 border-2 border-blue-500" : "p-2"}`}
              >
                <div className="text-xs text-center text-gray-500 mb-1">Col {colIndex + 1}</div>
                {column.map((num, rowIndex) => {
                  const isInputRow = isCurrentColumn && rowIndex === currentRow;
                  const showAnswer = rowIndex < kraepelinConfig.rows - 1;

                  return (
                    <div key={rowIndex} className="flex items-center gap-1">
                      <div className={`w-8 h-8 flex items-center justify-center border text-sm font-mono ${
                        isCurrentColumn ? "bg-white border-blue-300" : "bg-gray-50 border-gray-200"
                      }`}>
                        {num}
                      </div>
                      {showAnswer && isCurrentColumn && (
                        <div className={`w-8 h-8 flex items-center justify-center border ${
                          isInputRow
                            ? "border-2 border-green-500 bg-green-50"
                            : answers[colIndex][rowIndex] !== null
                            ? "bg-green-100 border-green-300"
                            : "bg-gray-50 border-gray-200"
                        }`}>
                          {isInputRow ? (
                            <input
                              type="text"
                              value={currentInput}
                              onChange={(e) => handleInput(e.target.value)}
                              className="w-full h-full text-center font-mono bg-transparent focus:outline-none"
                              maxLength={1}
                              autoFocus
                            />
                          ) : (
                            <span className="text-sm font-mono text-green-700">
                              {answers[colIndex][rowIndex]}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="mt-6 flex justify-between">
        <div className="text-sm text-gray-600">
          <p>Tekan angka untuk mengisi jawaban</p>
          <p>Jawaban otomatis pindah ke baris berikutnya</p>
        </div>
        <button
          onClick={moveToNextColumn}
          className="px-6 py-3 bg-blue-600 text-white hover:bg-blue-700"
        >
          Kolom Selanjutnya →
        </button>
      </div>
    </div>
  );
}
