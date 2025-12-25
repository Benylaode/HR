// utils/kraepelinScoring.ts

interface KraepelinResult {
  panker: number;      // Kecepatan (Rata-rata benar)
  janker: number;      // Ajeg/Konsistensi (Simpangan rata-rata)
  totalErrors: number; // Teliti (Jumlah Salah)
  gradeSpeed: string;  // Kategori PANKER
  gradeStability: string; // Kategori AJEG
  gradeAccuracy: string; // Kategori TELITI (Error count)
  interpretation: string;
}

export const calculateKraepelinScore = (
  userAnswers: (number | null)[][], 
  gridData: number[][] // Grid angka soal asli
): KraepelinResult => {
  
  // 1. Generate Kunci Jawaban ((Atas + Bawah) % 10)
  const correctAnswersMatrix = gridData.map(col => 
    col.slice(0, -1).map((num, idx) => (num + col[idx+1]) % 10)
  );

  let totalCorrect = 0;
  let totalErrors = 0; // Untuk aspek "TELITI"

  // 2. Hitung Benar & Salah per Kolom
  const columnScores = userAnswers.map((colAnswers, colIdx) => {
    let colCorrect = 0;
    colAnswers.forEach((ans, rowIdx) => {
      if (ans !== null) {
        if (ans === correctAnswersMatrix[colIdx][rowIdx]) {
          colCorrect++;
          totalCorrect++;
        } else {
          totalErrors++; // Jawaban diisi tapi salah
        }
      }
    });
    return colCorrect;
  });

  // 3. Hitung PANKER (Kecepatan / Mean)
  //
  const panker = columnScores.length > 0 ? totalCorrect / columnScores.length : 0;

  // 4. Hitung JANKER / AJEG (Mean Deviation)
  // Rumus: Rata-rata dari selisih mutlak setiap skor kolom terhadap Panker
  const totalDeviation = columnScores.reduce((sum, score) => {
    return sum + Math.abs(score - panker);
  }, 0);
  const janker = columnScores.length > 0 ? totalDeviation / columnScores.length : 0;

  // 5. Penilaian Berdasarkan Norma Sarjana (File: 8. NORMA SARJANA.csv)
  
  // A. Kategori PANKER (Kecepatan)
  let gradeSpeed = "Kurang Sekali";
  if (panker > 17.21) gradeSpeed = "Baik Sekali";
  else if (panker >= 14.973) gradeSpeed = "Baik";
  else if (panker >= 12.736) gradeSpeed = "Sedang";
  else if (panker >= 10.5) gradeSpeed = "Kurang";
  
  // B. Kategori AJEG (Konsistensi/Janker) - Makin kecil makin bagus
  let gradeStability = "Kurang Sekali";
  if (janker < 0.696) gradeStability = "Baik Sekali";
  else if (janker <= 0.908) gradeStability = "Baik";
  else if (janker <= 1.056) gradeStability = "Sedang";
  else if (janker <= 1.779) gradeStability = "Kurang";

  // C. Kategori TELITI (Errors) - Berdasarkan jumlah salah
  let gradeAccuracy = "Kurang Sekali"; // default >= 23
  if (totalErrors === 0) gradeAccuracy = "Baik Sekali";
  else if (totalErrors <= 1) gradeAccuracy = "Baik";
  else if (totalErrors <= 3) gradeAccuracy = "Sedang";
  else if (totalErrors <= 14) gradeAccuracy = "Kurang";

  return {
    panker: Number(panker.toFixed(2)),
    janker: Number(janker.toFixed(2)),
    totalErrors,
    gradeSpeed,     // Aspek CEPAT
    gradeStability, // Aspek AJEG
    gradeAccuracy,  // Aspek TELITI
    interpretation: `Kecepatan: ${gradeSpeed}, Stabilitas: ${gradeStability}, Ketelitian: ${gradeAccuracy}`
  };
};