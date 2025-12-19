// Dummy data for HR System - Psikotes Categories

export interface Category {
  id: number;
  name: string;
  code: string;
  description: string;
  color: string;
  question_count: number;
  duration: number;
  is_active: boolean;
  type?: string;
}

export interface Question {
  id: number;
  category_id: number;
  question_text: string;
  question_type: string;
  question_image?: string | null;
  subtest?: number;
  instruction?: string;
  option_a?: string;
  option_b?: string;
  options?: string;
  correct_answer?: number | number[];
  order_index: number;
}

export interface Candidate {
  id: number;
  name: string;
  email: string;
  phone: string;
  position: string;
  status: string;
  appliedDate: string;
  testStatus?: string;
}

export interface TestLink {
  id: string;
  testName: string;
  candidateName: string;
  candidateEmail: string;
  position: string;
  status: string;
  usage: { current: number; limit: number };
  expires: string;
  createdDate: string;
  token: string;
  link?: string;
}

// Categories
export const categories: Category[] = [
  {
    id: 1,
    name: "CFIT (Culture Fair Intelligence Test)",
    code: "CFIT",
    description: "Tes kecerdasan non-verbal - 50 soal gambar dalam 4 subtest",
    color: "#dc2626",
    question_count: 50,
    duration: 750, // 12.5 menit dalam detik
    is_active: true,
    type: "cfit",
  },
  {
    id: 2,
    name: "Kraepelin",
    code: "KRAEPELIN",
    description: "Tes konsentrasi dan ketahanan - penjumlahan angka berurutan",
    color: "#2563eb",
    question_count: 1350,
    duration: 780, // 13 menit
    is_active: true,
    type: "kraepelin",
  },
  {
    id: 3,
    name: "PAPI Kostick",
    code: "PAPI",
    description: "Tes kepribadian - 90 pernyataan pilihan A/B",
    color: "#059669",
    question_count: 90,
    duration: 180, // 3 menit
    is_active: true,
    type: "papi",
  },
];

// Questions by category
export const allQuestions: Record<number, Question[]> = {
  // CFIT Questions
  1: [
    {
      id: 1,
      category_id: 1,
      question_text: "Pilih gambar yang melanjutkan pola berikut",
      question_type: "cfit_series",
      question_image: null,
      subtest: 1,
      instruction: "Pilih gambar yang melanjutkan pola berikut",
      options: JSON.stringify(["A", "B", "C", "D", "E", "F"]),
      correct_answer: 1,
      order_index: 0,
    },
    {
      id: 2,
      category_id: 1,
      question_text: "Pilih gambar yang melanjutkan pola berikut",
      question_type: "cfit_series",
      question_image: null,
      subtest: 1,
      instruction: "Pilih gambar yang melanjutkan pola berikut",
      options: JSON.stringify(["A", "B", "C", "D", "E", "F"]),
      correct_answer: 2,
      order_index: 1,
    },
    {
      id: 3,
      category_id: 1,
      question_text: "Pilih 2 gambar yang BERBEDA dari yang lain",
      question_type: "cfit_classification",
      question_image: null,
      subtest: 2,
      instruction: "Pilih 2 gambar yang BERBEDA dari yang lain",
      options: JSON.stringify(["A", "B", "C", "D", "E"]),
      correct_answer: [0, 3],
      order_index: 2,
    },
  ],
  // Kraepelin - no predefined questions, generated dynamically
  2: [],
  // PAPI Kostick Questions
  3: [
    {
      id: 101,
      category_id: 3,
      question_text: "Pilih pernyataan yang paling menggambarkan diri Anda:",
      question_type: "binary_choice",
      option_a: "Saya seorang pekerja keras",
      option_b: "Saya bukan seorang pemurung",
      order_index: 0,
    },
    {
      id: 102,
      category_id: 3,
      question_text: "Pilih pernyataan yang paling menggambarkan diri Anda:",
      question_type: "binary_choice",
      option_a: "Saya suka bekerja lebih baik dari orang lain",
      option_b: "Saya suka bekerja sama dengan orang lain",
      order_index: 1,
    },
    {
      id: 103,
      category_id: 3,
      question_text: "Pilih pernyataan yang paling menggambarkan diri Anda:",
      question_type: "binary_choice",
      option_a: "Saya suka memperkenalkan kepada orang lain tentang bagaimana caranya",
      option_b: "Saya ingin menjadi sebaik mungkin",
      order_index: 2,
    },
    {
      id: 104,
      category_id: 3,
      question_text: "Pilih pernyataan yang paling menggambarkan diri Anda:",
      question_type: "binary_choice",
      option_a: "Saya suka berkelompok dengan kelompok-kelompok",
      option_b: "Saya suka berhadapan atau memimpin orang lain",
      order_index: 3,
    },
    {
      id: 105,
      category_id: 3,
      question_text: "Pilih pernyataan yang paling menggambarkan diri Anda:",
      question_type: "binary_choice",
      option_a: "Saya seorang bersahabat intim",
      option_b: "Saya seorang berkemauan",
      order_index: 4,
    },
  ],
};

// Sample candidates
export const candidates: Candidate[] = [
  {
    id: 1,
    name: "Ahmad Rizki",
    email: "ahmad.rizki@email.com",
    phone: "081234567890",
    position: "Software Engineer",
    status: "Pending",
    appliedDate: "2024-12-15",
    testStatus: "Not Started",
  },
  {
    id: 2,
    name: "Siti Nurhaliza",
    email: "siti.nurhaliza@email.com",
    phone: "082345678901",
    position: "Product Manager",
    status: "Interview",
    appliedDate: "2024-12-14",
    testStatus: "Completed",
  },
  {
    id: 3,
    name: "Budi Santoso",
    email: "budi.santoso@email.com",
    phone: "083456789012",
    position: "Data Analyst",
    status: "Pending",
    appliedDate: "2024-12-13",
    testStatus: "In Progress",
  },
];

// Sample test links
export const testLinks: TestLink[] = [
  {
    id: "tl-001",
    testName: "Psikotes CFIT",
    candidateName: "Ahmad Rizki",
    candidateEmail: "ahmad.rizki@email.com",
    position: "Software Engineer",
    status: "active",
    usage: { current: 0, limit: 1 },
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdDate: new Date().toISOString(),
    token: "cfit_1_abc123",
  },
];
