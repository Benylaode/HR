// Test data for different test types
export interface CFITSubtest {
  id: number;
  name: string;
  questions: number;
  duration: number; // in seconds
}

export interface CFITQuestion {
  id: number;
  subtest: number;
  subtestName: string;
  instruction: string;
  question_image: string | null;
  options: string[];
  correctAnswer: number | number[];
}

export interface PAPIQuestion {
  id: number;
  question: string;
  option_a: string;
  option_b: string;
}

// All tests are 3 minutes (180 seconds) each
export const TEST_DURATION = 180;

export const cfitSubtests: CFITSubtest[] = [
  { id: 1, name: "Series Completion", questions: 13, duration: TEST_DURATION },
  { id: 2, name: "Classification", questions: 14, duration: TEST_DURATION },
  { id: 3, name: "Matrices", questions: 13, duration: TEST_DURATION },
  { id: 4, name: "Conditions", questions: 10, duration: TEST_DURATION },
];

export const cfitQuestions: CFITQuestion[] = [
  // Subtest 1 - Series Completion
  { id: 1, subtest: 1, subtestName: "Series Completion", instruction: "Pilih gambar yang melanjutkan pola berikut", question_image: null, options: ["A", "B", "C", "D", "E", "F"], correctAnswer: 1 },
  { id: 2, subtest: 1, subtestName: "Series Completion", instruction: "Pilih gambar yang melanjutkan pola berikut", question_image: null, options: ["A", "B", "C", "D", "E", "F"], correctAnswer: 2 },
  { id: 3, subtest: 1, subtestName: "Series Completion", instruction: "Pilih gambar yang melanjutkan pola berikut", question_image: null, options: ["A", "B", "C", "D", "E", "F"], correctAnswer: 0 },
  // Subtest 2 - Classification
  { id: 14, subtest: 2, subtestName: "Classification", instruction: "Pilih 2 gambar yang BERBEDA dari yang lain", question_image: null, options: ["A", "B", "C", "D", "E"], correctAnswer: [0, 3] },
  { id: 15, subtest: 2, subtestName: "Classification", instruction: "Pilih 2 gambar yang BERBEDA dari yang lain", question_image: null, options: ["A", "B", "C", "D", "E"], correctAnswer: [1, 4] },
  // Subtest 3 - Matrices
  { id: 28, subtest: 3, subtestName: "Matrices", instruction: "Pilih gambar yang melengkapi matriks", question_image: null, options: ["A", "B", "C", "D", "E", "F"], correctAnswer: 3 },
  { id: 29, subtest: 3, subtestName: "Matrices", instruction: "Pilih gambar yang melengkapi matriks", question_image: null, options: ["A", "B", "C", "D", "E", "F"], correctAnswer: 1 },
  // Subtest 4 - Conditions
  { id: 41, subtest: 4, subtestName: "Conditions", instruction: "Pilih gambar yang memenuhi kondisi yang diberikan", question_image: null, options: ["A", "B", "C", "D", "E", "F"], correctAnswer: 2 },
  { id: 42, subtest: 4, subtestName: "Conditions", instruction: "Pilih gambar yang memenuhi kondisi yang diberikan", question_image: null, options: ["A", "B", "C", "D", "E", "F"], correctAnswer: 4 },
];

export const papiQuestions: PAPIQuestion[] = [
  { id: 1, question: "Pilih pernyataan yang paling menggambarkan diri Anda:", option_a: "Saya seorang pekerja keras", option_b: "Saya bukan seorang pemurung" },
  { id: 2, question: "Pilih pernyataan yang paling menggambarkan diri Anda:", option_a: "Saya suka bekerja lebih baik dari orang lain", option_b: "Saya suka bekerja sama dengan orang lain" },
  { id: 3, question: "Pilih pernyataan yang paling menggambarkan diri Anda:", option_a: "Saya suka memperkenalkan kepada orang lain tentang bagaimana caranya", option_b: "Saya ingin menjadi sebaik mungkin" },
  { id: 4, question: "Pilih pernyataan yang paling menggambarkan diri Anda:", option_a: "Saya suka berkelompok dengan kelompok-kelompok", option_b: "Saya suka berhadapan atau memimpin orang lain" },
  { id: 5, question: "Pilih pernyataan yang paling menggambarkan diri Anda:", option_a: "Saya seorang bersahabat intim", option_b: "Saya seorang berkemauan" },
  { id: 6, question: "Pilih pernyataan yang paling menggambarkan diri Anda:", option_a: "Saya suka mengikuti instruksi dengan teliti", option_b: "Saya suka membuat keputusan sendiri" },
  { id: 7, question: "Pilih pernyataan yang paling menggambarkan diri Anda:", option_a: "Saya lebih suka bekerja sendiri", option_b: "Saya lebih suka bekerja dalam tim" },
  { id: 8, question: "Pilih pernyataan yang paling menggambarkan diri Anda:", option_a: "Saya suka tantangan baru", option_b: "Saya suka rutinitas yang stabil" },
  { id: 9, question: "Pilih pernyataan yang paling menggambarkan diri Anda:", option_a: "Saya cepat dalam mengambil keputusan", option_b: "Saya berhati-hati dalam mengambil keputusan" },
  { id: 10, question: "Pilih pernyataan yang paling menggambarkan diri Anda:", option_a: "Saya suka memimpin diskusi", option_b: "Saya suka mendengarkan pendapat orang lain" },
];

export const kraepelinConfig = {
  columns: 50,
  rows: 27,
  timePerColumn: 15, // seconds
  totalDuration: TEST_DURATION, // 3 minutes
};

// Generate random kraepelin grid
export function generateKraepelinGrid(cols: number = 50, rows: number = 27): number[][] {
  const grid: number[][] = [];
  for (let col = 0; col < cols; col++) {
    grid[col] = [];
    for (let row = 0; row < rows; row++) {
      grid[col][row] = Math.floor(Math.random() * 9) + 1;
    }
  }
  return grid;
}
