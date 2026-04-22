// utils/kraepelinScoring.ts

export interface KraepelinResult {
  panker: number;      // 1. Kecepatan (Rata-rata benar per kolom)
  totalErrors: number; // 2. Ketelitian (Jumlah Salah total)
  hanker: number;      // 3. Ketahanan (Daya Tahan dari Regresi Linear)
  gradeSpeed: string;  // Kategori Kecepatan
  gradeAccuracy: string; // Kategori Ketelitian
  gradeEndurance: string; // Kategori Ketahanan
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

  const N = columnScores.length;

  // ==========================================
  // POIN 1: PANKER (Kecepatan / Mean)
  // ==========================================
  const panker = N > 0 ? totalCorrect / N : 0;

  // ==========================================
  // POIN 2: HANKER (Ketahanan / Regresi Linear)
  // Diambil dari rumus hanker_calculator.py
  // ==========================================
  let hanker = 0;
  if (N > 1) {
    let sum_x = 0;
    let sum_y = 0;
    let sum_x2 = 0;
    let sum_xy = 0;

    for (let i = 0; i < N; i++) {
      const x = i + 1; // Sumbu X adalah indeks lajur (1, 2, 3...)
      const y = columnScores[i]; // Sumbu Y adalah jumlah benar di lajur itu

      sum_x += x;
      sum_y += y;
      sum_x2 += (x * x);
      sum_xy += (x * y);
    }

    const denom = (N * sum_x2) - (sum_x * sum_x);
    // Koefisien gradien (b)
    const b = denom !== 0 ? ((N * sum_xy) - (sum_x * sum_y)) / denom : 0;
    
    // Hanker = b * 50
    hanker = b * 50;
  }

  // ==========================================
  // POIN 3: KATEGORI NORMA SARJANA (Sesuai Excel)
  // ==========================================
  
  // A. Kategori KECEPATAN (Panker)
  let gradeSpeed = "Below";
  if (panker > 17.21) gradeSpeed = "Above";
  else if (panker >= 14.973) gradeSpeed = "High";
  else if (panker >= 12.736) gradeSpeed = "Average";
  else if (panker >= 10.5) gradeSpeed = "Low";
  
  // B. Kategori KETELITIAN (Total Errors) - Makin kecil makin bagus
  let gradeAccuracy = "Below"; // Default >= 23
  if (totalErrors <= 0) gradeAccuracy = "Above"; // 0
  else if (totalErrors <= 2) gradeAccuracy = "High";   // 1 - 2
  else if (totalErrors <= 13) gradeAccuracy = "Average"; // 3 - 13
  else if (totalErrors <= 22) gradeAccuracy = "Low"; // 14 - 22

  // C. Kategori KETAHANAN (Hanker) - Boleh bernilai minus
  let gradeEndurance = "Below";
  if (hanker > 2.496) gradeEndurance = "Above";
  else if (hanker >= 1.015) gradeEndurance = "High";
  else if (hanker >= -0.468) gradeEndurance = "Average";
  else if (hanker >= -1.95) gradeEndurance = "Low";

  // ==========================================
  // KEMBALIKAN 3 POIN SAJA
  // ==========================================
  return {
    panker: Number(panker.toFixed(2)),
    totalErrors: totalErrors,
    hanker: Number(hanker.toFixed(3)),
    gradeSpeed,      
    gradeAccuracy,   
    gradeEndurance,  
    interpretation: `Speed: ${gradeSpeed}, Accuracy: ${gradeAccuracy}, Endurance: ${gradeEndurance}`
  };
};