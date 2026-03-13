"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getTestConfig, saveTestConfig } from "@/utils/config-actions"; // <-- Import Server Actions
import { toast } from "sonner";
import {
  CheckCircle,
  Plus,
  RefreshCw,
  Trash2,
  X,
  FolderOpen,
  HelpCircle,
  Upload,
  Image as ImageIcon,
  Link as LinkIcon,
  Copy,
  Clock,
  FileCheck,
  Eye,
  Activity,
  Grid3X3,
  Layers,
  Settings,
  User,
  Calendar,
  BarChart2,
  Zap,
  Target,
  AlertCircle
} from "lucide-react";

// --- 0. CONFIG ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

// --- 1. INTERFACES ---

export interface Candidate {
  id: string;
  fullName: string;
  email: string;
  top_position: string;
}

export interface Karyawan {
  id: string;
  fullName: string;
  email: string;
}

export interface JobPosition {
  id: string;
  title: string;
}

export interface TestLink {
  id: number;
  candidateName: string;
  token: string;
  status: string;
  createdAt?: string;
}

export interface Submission {
  id: number;
  candidate_name: string;
  test_type: 'cfit' | 'papi' | 'kraepelin';
  scores: any; 
  submitted_at: string;
}

export interface Category {
  id: number;
  name: string;
  code: string;
  question_count: number;
}

export interface Question {
  id: number;
  option_a?: string;
  option_b?: string;
  question_type?: string;
}

interface CfitSubtype {
  id: number;
  name: string;
  code: string;
  description: string;
  instruction: string;
  optionCount: number;
  questions: CfitQuestion[];
}

interface CfitQuestion {
  id: number;
  imageUrl: string | null;
  correctAnswer: string;
}

// --- 2. STATIC DATA ---

const STATIC_CATEGORIES: Category[] = [
  { id: 1, name: "CFIT (Culture Fair Intelligence Test)", code: "cfit", question_count: 0 },
  { id: 2, name: "PAPI Kostick (Personality)", code: "papi", question_count: 0 },
  { id: 3, name: "Kraepelin (Work Speed & Accuracy)", code: "kraepelin", question_count: 0 },
];

const INITIAL_CFIT_SUBTYPES: CfitSubtype[] = [
  { id: 1, name: "Subtes 1: Pola Urutan", code: "cfit_series", description: "Melengkapi pola urutan gambar", instruction: "Tentukan 1 pola yang melengkapi urutan gambar tersebut.", optionCount: 6, questions: [] },
  { id: 2, name: "Subtes 2: Klasifikasi", code: "cfit_classification", description: "Mencari 2 gambar yang berbeda", instruction: "Tentukan 2 gambar yang berbeda dari 3 gambar lainnya.", optionCount: 5, questions: [] },
  { id: 3, name: "Subtes 3: Matriks", code: "cfit_matrices", description: "Melengkapi matriks gambar yang kosong", instruction: "Mencari pola gambar yang tepat untuk mengisi kotak yang kosong.", optionCount: 6, questions: [] },
  { id: 4, name: "Subtes 4: Kondisi Titik", code: "cfit_conditions", description: "Menentukan komposisi peletakan titik", instruction: "Pilih gambar dimana posisi titik tidak berbeda komposisinya dengan gambar contoh.", optionCount: 5, questions: [] },
];

type TabType = "test-links" | "categories" | "submissions";

// --- FUNGSI INTERPRETASI PAPI KOSTICK ---
const getPapiAspectName = (aspect: string) => {
  const names: Record<string, string> = {
      G: "Hard Intense Worked (Pekerja Keras)",
      L: "Leadership Role (Peran Kepemimpinan)",
      I: "Ease in Decision Making (Pembuat Keputusan)",
      T: "Pace (Tingkat Kecepatan/Sibuk)",
      V: "Vigorous Type (Aktif & Penuh Semangat)",
      S: "Social Extension (Perluasan Sosial)",
      R: "Theoretical Type (Tipe Teoritis)",
      D: "Interest in Details (Bekerja Detail)",
      C: "Organized Type (Keteraturan)",
      E: "Emotional Resistant (Daya Tahan Emosi)",
      N: "Need to Finish Task (Penyelesaian Tugas)",
      A: "Need to Achieve (Kebutuhan Berprestasi)",
      P: "Need to Control Others (Kebutuhan Mengontrol)",
      X: "Need to be Noticed (Kebutuhan Diperhatikan)",
      B: "Need to Belong to Groups (Kebutuhan Diterima Kelompok)",
      O: "Need for Closeness (Kebutuhan Kedekatan & Kasih Sayang)",
      Z: "Need for Change (Kebutuhan Akan Perubahan)",
      K: "Need to be Forceful (Kebutuhan Bertindak Tegas/Agresif)",
      F: "Need to Support Authority (Kebutuhan Mendukung Otoritas)",
      W: "Need for Rules & Supervision (Kebutuhan Aturan & Arahan)"
  };
  return names[aspect] || aspect;
};

const getPapiInterpretation = (aspect: string, score: number) => {
  switch(aspect) {
      case 'L': return score >= 5 ? "Sangat tinggi dimana seseorang memproyeksikan dirinya sebagai pemimpin, ia mencoba menggunakan orang lain untuk mencapai tujuannya." : "Cenderung tidak secara aktif menggunakan orang lain dalam bekerja.";
      case 'P': return score >= 5 ? "Tingkat kebutuhan yang tinggi untuk menerima tanggung jawab dan menjadi pengontrol orang lain." : "Menurunnya keinginan untuk bertanggung jawab pada pekerjaan dan tindakan orang lain.";
      case 'I': return score >= 8 ? "Tidak ragu dalam mengambil keputusan, cenderung terburu-buru." : score >= 5 ? "Lancar dan mudah mengambil keputusan." : score >= 3 ? "Berhati-hati membuat keputusan." : "Ragu - menolak mengambil keputusan.";
      case 'F': return score >= 6 ? "Bersikap setia dan membantu, kemungkinan bantuannya bersifat politis." : score >= 4 ? "Setia terhadap otoritas." : score >= 2 ? "Mandiri." : "Cenderung egois, kemungkinan bisa memberontak.";
      case 'W': return score >= 6 ? "Meningkatnya orientasi terhadap tugas dan membutuhkan instruksi yang jelas." : score >= 4 ? "Kebutuhan akan pengarahan dan harapan yang dirumuskan untuknya." : "Berorientasi pada tujuan, mandiri.";
      case 'T': return score >= 4 ? "Tergolong aktif secara internal dan mental." : "Melakukan segala sesuatu menurut kemauan dan kecepatannya sendiri.";
      case 'V': return score >= 5 ? "Aktif secara fisik, cenderung sportif." : "Cenderung pasif.";
      case 'R': return score >= 5 ? "Nilai pendirian tergolong tinggi." : "Bersifat praktis.";
      case 'D': return score >= 4 ? "Minat tinggi untuk bekerja secara detail." : "Menyadari kebutuhan akan kecermatan, tetapi tidak berminat bekerja detail.";
      case 'C': return score >= 6 ? "Keteraturan tinggi cenderung kaku." : score >= 3 ? "Teratur tetapi tergolong fleksibel." : "Tidak teratur.";
      case 'X': return score >= 6 ? "Benar-benar membutuhkan perhatian." : score >= 4 ? "Memiliki pola perilaku yang unik." : score >= 2 ? "Rendah hati, tulus." : "Cenderung pemalu.";
      case 'B': return score >= 6 ? "Butuh disukai dan diakui, mudah dipengaruhi." : score >= 4 ? "Butuh diterima, tapi tidak mudah dipengaruhi kelompok." : "Selektif.";
      case 'S': return score >= 6 ? "Kepercayaan tinggi dalam berhubungan sosial, suka interaksi sosial." : "Perhatian rendah terhadap hubungan sosial, kurang percaya pada orang lain.";
      case 'O': return score >= 5 ? "Sangat tergantung, butuh penerimaan diri." : score >= 3 ? "Sadar akan hubungan perorangan, tapi tidak terlalu tergantung." : "Tidak suka hubungan perorangan.";
      case 'N': return score >= 6 ? "Tekun, tanggung jawab tinggi." : score >= 4 ? "Cukup bertanggung jawab pada pekerjaan." : score >= 3 ? "Delegator." : "Komitmen rendah, tapi ada kemungkinan dapat memegang banyak pekerjaan dalam satu waktu.";
      case 'A': return score >= 6 ? "Tujuan jelas, kebutuhan sukses dan ambisi tinggi." : "Ketidakpastian tujuan, tidak ada usaha lebih.";
      case 'G': return score >= 4 ? "Kemauan bekerja keras tinggi." : "Bekerja untuk kesenangan saja, bukan hasil optimal.";
      case 'Z': return score >= 8 ? "Mudah gelisah, frustasi, karena segala sesuatu tidak berjalan dengan cepat, mudah berubah-ubah." : score >= 6 ? "Membuat perubahan tertentu, berfikir jauh kedepan." : score >= 5 ? "Mudah menyesuaikan diri." : score >= 3 ? "Meremehkan atau mengacuhkan apabila dipaksa berubah." : "Tidak suka berubah, tradisional.";
      case 'K': return score >= 8 ? "Agresif yang cenderung defensive." : score >= 6 ? "Menyalurkan agresi personal ke dalam pekerjaan, drive dan persaingan." : score === 5 ? "Keras kepala." : score >= 3 ? "Suka lingkungan yang tenang, menghindari konflik, biasanya menunda penyelesaian konflik." : "Menghindari masalah, menolak, mengelak adanya masalah.";
      case 'E': return score >= 7 ? "Sangat normatif, kebutuhan pengendalian diri yang berlebihan, kecenderungan defensif." : score >= 4 ? "Punya pendekatan emosional seimbang, mampu mengendalikan." : score >= 2 ? "Agen bola terka." : "Terlalu cepat bereaksi, tidak normatif, ekspresi berlebihan.";
      default: return "Tidak ada interpretasi spesifik.";
  }
};

// --- 3. MAIN COMPONENT ---

export default function TestManagementPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("categories");
  
  // Data State
  const [localCategories, setLocalCategories] = useState<Category[]>(STATIC_CATEGORIES);
  const [localQuestions, setLocalQuestions] = useState<Record<number, Question[]>>({});
  const [localTestLinks, setLocalTestLinks] = useState<TestLink[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]); 
  
  // Candidates, Karyawan & Jobs List for Dropdown
  const [candidatesList, setCandidatesList] = useState<Candidate[]>([]);
  const [karyawanList, setKaryawanList] = useState<Karyawan[]>([]); // Data Karyawan
  const [jobsList, setJobsList] = useState<JobPosition[]>([]);
  
  // Form State
  const [participantType, setParticipantType] = useState<"candidate" | "karyawan">("candidate"); // Tipe Peserta
  const [selectedCandidateId, setSelectedCandidateId] = useState("");
  const [selectedKaryawanId, setSelectedKaryawanId] = useState("");
  const [selectedJobId, setSelectedJobId] = useState(""); 

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  
  // CFIT State
  const [cfitSubtypes, setCfitSubtypes] = useState<CfitSubtype[]>(INITIAL_CFIT_SUBTYPES);
  const [selectedCfitSubtype, setSelectedCfitSubtype] = useState<CfitSubtype | null>(null);
  
  // Modals
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showCreateLinkModal, setShowCreateLinkModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState<Submission | null>(null);

  // Form Inputs
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // State untuk file asli
  const [correctAnswer, setCorrectAnswer] = useState<string | string[]>(""); // Mendukung array string
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");

  const [kraepelinColumns, setKraepelinColumns] = useState("50");
  const [kraepelinRows, setKraepelinRows] = useState("27");
  const [kraepelinTimePerColumn, setKraepelinTimePerColumn] = useState("15");

  const [cfitDurations, setCfitDurations] = useState({
    sub1: "180", // 3 Menit
    sub2: "240", // 4 Menit
    sub3: "180", // 3 Menit
    sub4: "150", // 2.5 Menit
  });
  
  const [papiDuration, setPapiDuration] = useState("1800");

  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem("hr_token");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  useEffect(() => {
    const userData = localStorage.getItem("hr_user");
    if (!userData) {
      router.push("/");
      return;
    }
    setUser(JSON.parse(userData));
    
    // --- LOAD DURASI DARI JSON VIA SERVER ACTION ---
    const loadConfig = async () => {
      const config = await getTestConfig();
      if (config) {
        setCfitDurations({
          sub1: String(config.cfit_sub1 || 180),
          sub2: String(config.cfit_sub2 || 240),
          sub3: String(config.cfit_sub3 || 180),
          sub4: String(config.cfit_sub4 || 150),
        });
        setPapiDuration(String(config.papi || 1800)); // Set papi dari config JSON
      }
    };
    loadConfig();
    // -----------------------------------------------
    
    fetchData(); 
  }, [router]);

  // --- API FETCH FUNCTIONS ---

  const fetchData = async () => {
    try {
      // Tambah cache: 'no-store' agar Next.js tidak nge-cache data lama
      const fetchOptions: RequestInit = { headers: getAuthHeaders(), cache: "no-store" };

      const resLinks = await fetch(`${API_BASE_URL}/management/links`, fetchOptions);
      if (resLinks.ok) setLocalTestLinks(await resLinks.json());

      const resSubs = await fetch(`${API_BASE_URL}/management/submissions`, fetchOptions); 
      if (resSubs.ok) setSubmissions(await resSubs.json());

      // Fetch Kandidat
      const resCandidates = await fetch(`${API_BASE_URL}/candidates`, fetchOptions);
      if (resCandidates.ok) setCandidatesList(await resCandidates.json());

      // Fetch Karyawan
      const resKaryawan = await fetch(`${API_BASE_URL}/employees`, fetchOptions);
      if (resKaryawan.ok) setKaryawanList(await resKaryawan.json());
      
      // Fetch Jobs
      const resJobs = await fetch(`${API_BASE_URL}/job-positions?status=active`, fetchOptions);
      if (resJobs.ok) setJobsList(await resJobs.json());

      const resKraepelin = await fetch(`${API_BASE_URL}/management/config/kraepelin`, fetchOptions);
      if (resKraepelin.ok) {
        const data = await resKraepelin.json();
        setKraepelinColumns(String(data.columns || 50));
        setKraepelinRows(String(data.rows || 27));
        setKraepelinTimePerColumn(String(data.durationPerColumn || 15));
      }

      const resCfit = await fetch(`${API_BASE_URL}/management/questions/cfit`, fetchOptions);
      if (resCfit.ok) {
        const allCfitQuestionsFromBE = await resCfit.json();
        setCfitSubtypes((prev) => prev.map((st) => ({
            ...st,
            questions: allCfitQuestionsFromBE
              .filter((q: any) => q.subtest === st.id)
              .map((q: any) => ({
                id: q.id,
                imageUrl: q.question_image ? `${API_BASE_URL}${q.question_image}` : null,
                correctAnswer: typeof q.correctAnswer === 'string' && q.correctAnswer.includes(',') 
                               ? q.correctAnswer.split(',').map((ans:string) => String.fromCharCode(65 + parseInt(ans))).join(' & ')
                               : String.fromCharCode(65 + parseInt(q.correctAnswer)),
              })),
          }))
        );
        setLocalCategories(prev => prev.map(c => c.code === 'cfit' ? { ...c, question_count: allCfitQuestionsFromBE.length } : c));
      }

      const resPapi = await fetch(`${API_BASE_URL}/management/questions/papi`, fetchOptions);
      if (resPapi.ok) {
        const papiQ = await resPapi.json();
        const papiId = localCategories.find(c => c.code === 'papi')?.id || 2;
        setLocalQuestions(prev => ({
          ...prev,
          [papiId]: papiQ.map((q: any) => ({ id: q.id, option_a: q.option_a, option_b: q.option_b, question_type: "PAPI" }))
        }));
        setLocalCategories(prev => prev.map(c => c.code === 'papi' ? { ...c, question_count: papiQ.length } : c));
      }

    } catch (err) {
      console.error("Error fetching data:", err);
      toast.error("Gagal memuat data", { description: "Periksa koneksi internet atau server Anda." });
    }
  };


  const handleGenerateLink = async () => { 
    if (participantType === "candidate" && !selectedCandidateId) { 
      toast.warning("Perhatian", { description: "Silakan pilih kandidat dari daftar!" }); 
      return; 
    }
    if (participantType === "karyawan" && !selectedKaryawanId) { 
      toast.warning("Perhatian", { description: "Silakan pilih karyawan dari daftar!" }); 
      return; 
    }
    
    setIsGeneratingLink(true);

    const generateTask = async () => {
      const payload = {
        job_id: selectedJobId || null,
        ...(participantType === "candidate" ? { candidate_id: selectedCandidateId } : { employee_id: selectedKaryawanId }) 
      };

      const response = await fetch(`${API_BASE_URL}/management/generate-link`, {
        method: "POST", 
        headers: getAuthHeaders(), 
        body: JSON.stringify(payload), 
      });
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal membuat link tes");
      }

      fetchData(); // Reload from server
      
      setShowCreateLinkModal(false);
      setSelectedCandidateId(""); 
      setSelectedKaryawanId("");
      setSelectedJobId("");

      return data.token;
    };

    toast.promise(generateTask(), {
      loading: 'Membuat link tes...',
      success: (token) => `Berhasil! Link tes dibuat dengan token: ${token}`,
      error: (err) => err.message,
      finally: () => setIsGeneratingLink(false)
    });
  };

  const handleSaveKraepelin = async () => {
    const saveTask = async () => {
      const response = await fetch(`${API_BASE_URL}/management/config/kraepelin`, {
        method: "PUT", 
        headers: getAuthHeaders(),
        body: JSON.stringify({ 
          columns: parseInt(kraepelinColumns), 
          rows: parseInt(kraepelinRows), 
          durationPerColumn: parseInt(kraepelinTimePerColumn) 
        }),
      });
      if (!response.ok) throw new Error("Gagal menyimpan konfigurasi");
      return "Konfigurasi Kraepelin berhasil disimpan!";
    };

    toast.promise(saveTask(), {
      loading: 'Menyimpan konfigurasi...',
      success: (msg) => msg,
      error: (err) => err.message,
    });
  };

  // --- MENGGUNAKAN SERVER ACTIONS UNTUK SIMPAN DURASI ---
  const handleSaveTestDuration = async () => {
    let payload = {};

    if (selectedCategory?.code === 'cfit') {
      payload = {
        cfit_sub1: parseInt(cfitDurations.sub1),
        cfit_sub2: parseInt(cfitDurations.sub2),
        cfit_sub3: parseInt(cfitDurations.sub3),
        cfit_sub4: parseInt(cfitDurations.sub4),
      };
    } else if (selectedCategory?.code === 'papi') {
      payload = {
        papi: parseInt(papiDuration)
      };
    }

    const saveTask = async () => {
      // Panggil Server Action
      const response = await saveTestConfig(payload);
      
      if (!response.success) throw new Error(response.error || "Gagal menyimpan konfigurasi JSON.");
      return "Pengaturan waktu berhasil disimpan secara global!";
    };

    toast.promise(saveTask(), {
      loading: 'Menyimpan ke pengaturan global...',
      success: (msg) => msg,
      error: (err) => err.message
    });
  };

  const handleAddPapiQuestion = async () => {
    if (!optionA || !optionB) { 
      toast.warning("Peringatan", { description: "Opsi A dan B harus diisi!" }); 
      return; 
    }
    
    setIsSubmitting(true);
    const saveTask = async () => {
      const res = await fetch(`${API_BASE_URL}/management/questions/papi`, {
        method: "POST", 
        headers: getAuthHeaders(), 
        body: JSON.stringify({ option_a: optionA, option_b: optionB }),
      });
      
      if (!res.ok) throw new Error("Gagal menyimpan soal PAPI");
      
      setShowQuestionModal(false); 
      setOptionA(""); 
      setOptionB(""); 
      fetchData(); 
      return "Soal PAPI berhasil ditambahkan!";
    };

    toast.promise(saveTask(), {
      loading: 'Menyimpan soal...',
      success: (msg) => msg,
      error: (err) => err.message,
      finally: () => setIsSubmitting(false)
    });
  };

  const handleAddCfitQuestion = async () => {
      if (!imagePreview || correctAnswer.length === 0) {
        toast.warning("Peringatan", { description: "Pilih gambar dan kunci jawaban terlebih dahulu!" });
        return;
      }

      setIsSubmitting(true);
      const saveTask = async () => {
        const formData = new FormData();
        
        const headers: HeadersInit = {
           ...(localStorage.getItem("hr_token") ? { Authorization: `Bearer ${localStorage.getItem("hr_token")}` } : {}),
        };

        if (selectedFile) {
            formData.append("image", selectedFile);
        }
        
        formData.append("subtest", String(selectedCfitSubtype?.id));
        formData.append("instruction", selectedCfitSubtype?.instruction || "");
        
        let answerToSubmit = "";
        if (selectedCfitSubtype?.id === 2 && Array.isArray(correctAnswer)) {
           answerToSubmit = correctAnswer.map(labelToIndex).sort().join(",");
        } else {
           answerToSubmit = String(labelToIndex(correctAnswer as string)); 
        }
        formData.append("correctAnswer", answerToSubmit);
        
        const res = await fetch(`${API_BASE_URL}/management/questions/cfit`, { 
          method: "POST", 
          body: formData, 
          headers: headers 
        });
        
        if (!res.ok) throw new Error("Gagal menyimpan soal CFIT");
        
        setShowQuestionModal(false); 
        setImagePreview(null); 
        setSelectedFile(null); 
        setCorrectAnswer(selectedCfitSubtype?.id === 2 ? [] : ""); 
        fetchData();
        return "Soal CFIT berhasil ditambahkan!";
      };

      toast.promise(saveTask(), {
        loading: 'Mengunggah soal...',
        success: (msg) => msg,
        error: (err) => err.message,
        finally: () => setIsSubmitting(false)
      });
  };

  const handleDeleteQuestion = async (endpoint: 'cfit' | 'papi', id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus soal ini?")) return;
    
    const deleteTask = async () => {
      const res = await fetch(`${API_BASE_URL}/management/questions/${endpoint}/${id}`, { 
        method: "DELETE", 
        headers: getAuthHeaders() 
      });
      if (!res.ok) throw new Error("Gagal menghapus soal");
      fetchData();
      return "Soal berhasil dihapus";
    };

    toast.promise(deleteTask(), {
      loading: 'Menghapus...',
      success: (msg) => msg,
      error: (err) => err.message
    });
  };

  // --- UTILS ---
  const copyLink = async (token: string) => {
    try {
      const url = `${window.location.origin}/test/${token}`;
      await navigator.clipboard.writeText(url);
      toast.success("Tersalin!", { description: "Link tes berhasil disalin ke clipboard." });
    } catch (err) {
      toast.error("Gagal menyalin link.");
    }
  };

  const getOptionLabels = (count: number) => Array.from({ length: count }, (_, i) => String.fromCharCode(65 + i));
  const labelToIndex = (label: string) => label.charCodeAt(0) - 65;
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const isCfitCategory = selectedCategory?.code === "cfit";
  const isKraepelinCategory = selectedCategory?.code === "kraepelin";

  // --- RENDER HELPERS FOR BEAUTIFUL SUBMISSIONS ---

  const getTestBadgeColor = (type: string) => {
    switch (type) {
      case 'cfit': return 'bg-[var(--primary-50)] text-[var(--primary)] border border-[var(--primary-100)]';
      case 'kraepelin': return 'bg-[var(--secondary-50)] text-[var(--secondary-600)] border border-[var(--secondary-200)]';
      case 'papi': return 'bg-orange-50 text-orange-600 border border-orange-100';
      default: return 'bg-gray-50 text-gray-600 border border-gray-100';
    }
  };

  const renderSubmissionTable = () => (
    <div className="card-static bg-white rounded-2xl border border-[var(--secondary-200)] overflow-hidden">
      <div className="p-6 border-b border-[var(--secondary-100)] bg-white">
        <h3 className="text-lg font-bold text-[var(--primary-900)] flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-[var(--primary)]" />
          Riwayat Hasil Tes
        </h3>
      </div>
      <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-[var(--secondary-50)] text-[var(--secondary-500)] font-bold uppercase text-[10px] tracking-wide border-b border-[var(--secondary-100)]">
          <tr>
            <th className="px-6 py-4">Peserta</th>
            <th className="px-6 py-4">Jenis Tes</th>
            <th className="px-6 py-4">Hasil Ringkas</th>
            <th className="px-6 py-4">Waktu Submit</th>
            <th className="px-6 py-4 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--secondary-50)]">
          {submissions.length > 0 ? submissions.map((sub) => {
            let scoreBadge = <span className="text-[var(--secondary)] italic text-xs">Menunggu...</span>;
            if (sub.scores && Object.keys(sub.scores).length > 0) {
              if (sub.test_type === 'cfit') {
                const iq = sub.scores.iq || 0;
                const color = iq >= 110 ? 'text-green-600 bg-green-50 border-green-200' : (iq >= 90 ? 'text-[var(--primary)] bg-[var(--primary-50)] border-[var(--primary-200)]' : 'text-red-600 bg-red-50 border-red-200');
                scoreBadge = (
                  <div className={`inline-flex flex-col px-3 py-1 rounded-lg border ${color}`}>
                    <span className="font-bold text-xs">IQ: {iq}</span>
                    <span className="text-[9px] uppercase tracking-wide opacity-80">{sub.scores.classification}</span>
                  </div>
                );
              } else if (sub.test_type === 'kraepelin') {
                scoreBadge = (
                  <div className="flex gap-2">
                    <div className="px-2 py-1 bg-[var(--secondary-50)] border border-[var(--secondary-200)] rounded text-xs">
                      <span className="text-[var(--secondary)] mr-1">Speed:</span><span className="font-bold text-[var(--primary-900)]">{sub.scores.panker}</span>
                    </div>
                    <div className="px-2 py-1 bg-[var(--secondary-50)] border border-[var(--secondary-200)] rounded text-xs">
                      <span className="text-[var(--secondary)] mr-1">Acc:</span><span className="font-bold text-[var(--primary-900)]">{sub.scores.janker}</span>
                    </div>
                  </div>
                );
              } else if (sub.test_type === 'papi') {
                scoreBadge = (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-50 text-orange-700 text-xs border border-orange-100 font-medium">
                    <CheckCircle className="w-3 h-3"/> Profile Ready
                  </span>
                );
              }
            }

            return (
              <tr key={sub.id} className="hover:bg-[var(--primary-50)]/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[var(--secondary-200)] flex items-center justify-center text-[var(--secondary-600)] font-bold text-xs">
                      {sub.candidate_name ? sub.candidate_name.charAt(0).toUpperCase() : "?"}
                    </div>
                    <span className="font-bold text-[var(--primary-900)]">{sub.candidate_name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${getTestBadgeColor(sub.test_type)}`}>
                    {sub.test_type}
                  </span>
                </td>
                <td className="px-6 py-4">{scoreBadge}</td>
                <td className="px-6 py-4 text-[var(--secondary-600)] text-xs">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-[var(--secondary-400)]"/>
                    {new Date(sub.submitted_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    <span className="text-[var(--secondary-300)]">|</span>
                    {new Date(sub.submitted_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => setShowDetailModal(sub)}
                    className="text-[var(--secondary-500)] hover:text-[var(--primary)] hover:bg-[var(--primary-50)] px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-end gap-1.5 ml-auto"
                  >
                    <Eye className="w-3.5 h-3.5"/> Detail
                  </button>
                </td>
              </tr>
            );
          }) : (
            <tr>
              <td colSpan={5} className="px-6 py-12 text-center text-[var(--secondary)] bg-[var(--secondary-50)]">
                <div className="flex flex-col items-center justify-center">
                  <FileCheck className="w-10 h-10 mb-3 text-[var(--secondary-300)]" />
                  <p className="text-sm font-medium">Belum ada data submission.</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
    </div>
  );

  // --- RENDER MODAL CONTENT (DASHBOARD) ---
  const renderDetailContent = (sub: Submission) => {
    if (!sub.scores || Object.keys(sub.scores).length === 0) {
        return <div className="p-8 text-center text-[var(--secondary)] italic">Data hasil belum diproses atau kosong.</div>;
    }

    if (sub.test_type === 'cfit') {
        const iq = sub.scores.iq || 0;
        const color = iq >= 110 ? 'text-green-600' : (iq >= 90 ? 'text-[var(--primary)]' : 'text-red-600');
        return (
            <div className="space-y-6">
                <div className="flex flex-col items-center justify-center p-8 bg-[var(--primary-50)] rounded-xl border border-[var(--primary-100)]">
                    <div className="text-sm text-[var(--primary)] font-bold uppercase tracking-widest mb-1">IQ Score</div>
                    <div className={`text-6xl font-black ${color}`}>{iq}</div>
                    <div className="mt-2 px-4 py-1 bg-white rounded-full text-sm font-bold shadow-sm text-[var(--primary-900)] border border-[var(--secondary-200)]">
                        {sub.scores.classification || "Unclassified"}
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border border-[var(--secondary-200)] rounded-xl bg-gray-50/50">
                        <div className="text-xs text-[var(--secondary-500)] uppercase font-bold mb-1">Raw Score</div>
                        <div className="text-2xl font-bold text-[var(--primary-900)]">{sub.scores.raw_score} <span className="text-sm text-[var(--secondary)] font-normal">/ 50</span></div>
                    </div>
                    <div className="p-4 border border-[var(--secondary-200)] rounded-xl bg-gray-50/50">
                        <div className="text-xs text-[var(--secondary-500)] uppercase font-bold mb-1">Detail Jawaban</div>
                        <div className="text-sm text-[var(--secondary-700)]">Lihat breakdown jawaban di database (JSON).</div>
                    </div>
                </div>
            </div>
        );
    } 
    
    if (sub.test_type === 'kraepelin') {
        return (
            <div className="space-y-6">
                <div className="p-4 bg-[var(--secondary-50)] rounded-xl border border-[var(--secondary-200)] text-center">
                    <h4 className="font-bold text-[var(--primary-900)] mb-2">Interpretasi Umum</h4>
                    <p className="text-sm text-[var(--secondary-600)] italic">"{sub.scores.interpretation || '-'}"</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border border-[var(--secondary-200)] rounded-xl shadow-sm bg-white">
                        <div className="flex items-center gap-2 mb-2">
                            <Zap className="w-4 h-4 text-yellow-500"/>
                            <span className="text-xs font-bold uppercase text-[var(--secondary-500)]">Kecepatan (Panker)</span>
                        </div>
                        <div className="text-2xl font-bold text-[var(--primary-900)]">{sub.scores.panker}</div>
                        <div className="text-xs mt-1 text-[var(--secondary)] bg-[var(--secondary-50)] px-2 py-0.5 rounded w-fit">{sub.scores.gradeSpeed || '-'}</div>
                    </div>
                    <div className="p-4 border border-[var(--secondary-200)] rounded-xl shadow-sm bg-white">
                        <div className="flex items-center gap-2 mb-2">
                            <Target className="w-4 h-4 text-green-500"/>
                            <span className="text-xs font-bold uppercase text-[var(--secondary-500)]">Ketelitian (Janker)</span>
                        </div>
                        <div className="text-2xl font-bold text-[var(--primary-900)]">{sub.scores.janker}</div>
                        <div className="text-xs mt-1 text-[var(--secondary)] bg-[var(--secondary-50)] px-2 py-0.5 rounded w-fit">{sub.scores.gradeStability || '-'}</div>
                    </div>
                    <div className="p-4 border border-[var(--secondary-200)] rounded-xl shadow-sm bg-white">
                        <div className="flex items-center gap-2 mb-2">
                            <Activity className="w-4 h-4 text-red-500"/>
                            <span className="text-xs font-bold uppercase text-[var(--secondary-500)]">Total Errors</span>
                        </div>
                        <div className="text-2xl font-bold text-[var(--primary-900)]">{sub.scores.totalErrors}</div>
                        <div className="text-xs mt-1 text-[var(--secondary)] bg-[var(--secondary-50)] px-2 py-0.5 rounded w-fit">{sub.scores.gradeAccuracy || '-'}</div>
                    </div>
                </div>
            </div>
        );
    }

    if (sub.test_type === 'papi') {
        const aspects = Object.entries(sub.scores).filter(([key]) => /^[A-Z]$/.test(key));
        return (
            <div className="space-y-4">
                <div className="bg-orange-50 border border-orange-100 p-5 rounded-xl mb-4">
                    <h4 className="font-bold text-orange-900 text-lg flex items-center gap-2"><CheckCircle className="w-5 h-5"/> PAPI Kostick Profile</h4>
                    <p className="text-sm text-orange-700 mt-1">Berikut adalah interpretasi kepribadian berdasarkan skor 20 aspek (Range 0-9).</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2">
                    {aspects.map(([key, value]: any) => {
                        const score = Number(value);
                        return (
                        <div key={key} className="flex flex-col gap-3 p-4 border border-[var(--secondary-200)] rounded-xl hover:shadow-md bg-white transition-all">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 shrink-0 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center font-black text-xl border border-orange-200">{key}</div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-[var(--primary-900)] text-sm line-clamp-1">{getPapiAspectName(key)}</span>
                                        <span className="font-bold text-xs bg-gray-100 px-2 py-1 rounded-md text-[var(--secondary-600)]">Skor: {score}/9</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full ${score >= 6 ? 'bg-green-500' : (score <= 3 ? 'bg-red-400' : 'bg-yellow-400')}`} 
                                            style={{ width: `${(score / 9) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <p className="text-xs text-gray-700 leading-relaxed">
                                    <span className="font-bold text-gray-500 mr-1">Interpretasi:</span> 
                                    {getPapiInterpretation(key, score)}
                                </p>
                            </div>
                        </div>
                    )})}
                </div>
            </div>
        );
    }

    return <pre className="text-xs text-[var(--secondary-600)]">{JSON.stringify(sub.scores, null, 2)}</pre>;
  };


  if (!user) return null;

  return (
    <div className="min-h-screen bg-[var(--background)] flex">
      <Sidebar />
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0">
        
        {/* HEADER */}
        <div className="sticky top-0 z-30 bg-[var(--background)]/90 backdrop-blur-md">
           <Header
             title="Manajemen Test"
             subtitle="Kelola soal, link tes, dan lihat hasil submission"
             onRefresh={fetchData}
           />
           {/* Tab Navigation - Modern Pill Style */}
           <div className="px-4 md:px-8 pb-4 pt-1 flex overflow-x-auto scrollbar-hide">
             <div className="flex p-1 bg-[var(--secondary-100)] rounded-xl whitespace-nowrap">
               {[
                 { id: "categories", label: "Soal & Kategori" },
                 { id: "test-links", label: "Link Tes Aktif" },
                 { id: "submissions", label: "Hasil Submission" }
               ].map((tab) => (
                 <button
                   key={tab.id}
                   onClick={() => setActiveTab(tab.id as TabType)}
                   className={`py-2 px-4 text-xs font-bold rounded-lg transition-all ${
                     activeTab === tab.id
                       ? "bg-white text-[var(--primary)] shadow-sm"
                       : "text-[var(--secondary-500)] hover:text-[var(--secondary-800)]"
                   }`}
                 >
                   {tab.label}
                 </button>
               ))}
             </div>
           </div>
        </div>

        {/* MAIN CONTENT */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* === TAB 1: CATEGORIES === */}
          {activeTab === "categories" && (
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              <aside className="w-full lg:w-72 lg:sticky lg:top-28 flex-shrink-0">
               <div className="card-static bg-white rounded-2xl border border-[var(--secondary-200)] shadow-sm overflow-hidden">
                 <div className="p-4 bg-[var(--secondary-50)] border-b border-[var(--secondary-100)] text-xs font-bold text-[var(--secondary-500)] uppercase tracking-widest">Kategori Tes</div>
                 <div className="divide-y divide-[var(--secondary-50)]">
                   {localCategories.map((cat) => (
                     <button
                       key={cat.id}
                       onClick={() => { setSelectedCategory(cat); setSelectedCfitSubtype(null); }}
                       className={`w-full flex items-center justify-between p-4 transition-all ${
                         selectedCategory?.id === cat.id
                           ? "bg-[var(--primary-50)] text-[var(--primary-900)] border-l-4 border-[var(--primary)]"
                           : "text-[var(--secondary-600)] hover:bg-[var(--secondary-50)] border-l-4 border-transparent"
                       }`}
                     >
                       <div className="flex items-center gap-3">
                         <FolderOpen className={`w-4 h-4 ${selectedCategory?.id === cat.id ? "text-[var(--primary)]" : "text-[var(--secondary-400)]"}`} />
                         <span className="text-sm font-bold">{cat.name}</span>
                       </div>
                       <span className="text-[10px] bg-white border border-[var(--secondary-200)] text-[var(--secondary-500)] px-2 py-0.5 rounded-full font-bold">{cat.question_count}</span>
                     </button>
                   ))}
                 </div>
               </div>
              </aside>

              <section className="flex-1 w-full min-w-0">
                {!selectedCategory ? (
                  <div className="bg-white border-2 border-dashed border-[var(--secondary-200)] rounded-2xl p-20 text-center">
                    <FolderOpen className="w-16 h-16 text-[var(--secondary-200)] mx-auto mb-4" />
                    <h3 className="text-[var(--secondary-500)] font-bold text-sm">Pilih kategori tes di sebelah kiri untuk mengelola soal</h3>
                  </div>
                ) : isCfitCategory ? (
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 text-sm text-[var(--secondary)] mb-4">
                      <span className="hover:text-[var(--primary)] cursor-pointer font-medium transition-colors" onClick={() => setSelectedCfitSubtype(null)}>CFIT</span>
                      {selectedCfitSubtype && (
                        <>
                          <span className="text-[var(--secondary-300)]">/</span>
                          <span className="font-bold text-[var(--primary-900)]">{selectedCfitSubtype.name}</span>
                        </>
                      )}
                    </div>
                    {!selectedCfitSubtype ? (
                      <div className="space-y-6">
                        
                        {/* --- PERUBAHAN UI: KONFIGURASI DURASI CFIT PER SUBTES --- */}
                        <div className="card-static bg-white rounded-2xl border border-[var(--secondary-200)] shadow-sm p-6">
                          <div className="border-b border-[var(--secondary-100)] pb-4 mb-4">
                            <h3 className="font-bold text-[var(--primary-900)] text-lg">Pengaturan Durasi Tes CFIT</h3>
                            <p className="text-[var(--secondary)] text-sm">Atur batas waktu secara spesifik untuk masing-masing subtes.</p>
                          </div>
                          
                          <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Subtes 1 */}
                              <div className="bg-[var(--primary-50)] p-4 rounded-xl border border-[var(--primary-100)]">
                                <label className="block text-[10px] font-bold text-[var(--primary-700)] uppercase mb-2 flex items-center gap-1">
                                  <Clock className="w-3 h-3"/> WAKTU SUBTES 1 (DETIK)
                                </label>
                                <input 
                                  type="number" 
                                  value={cfitDurations.sub1} 
                                  onChange={e => setCfitDurations({...cfitDurations, sub1: e.target.value})} 
                                  className="w-full border border-[var(--primary-200)] p-3 rounded-lg outline-none font-bold text-[var(--primary-900)] focus:ring-2 focus:ring-[var(--primary-200)]" 
                                />
                                <p className="text-[10px] text-[var(--primary-600)] mt-2">
                                  = {(parseInt(cfitDurations.sub1 || "0") / 60).toFixed(1)} menit (Standar: 3 mnt)
                                </p>
                              </div>
                              
                              {/* Subtes 2 */}
                              <div className="bg-[var(--primary-50)] p-4 rounded-xl border border-[var(--primary-100)]">
                                <label className="block text-[10px] font-bold text-[var(--primary-700)] uppercase mb-2 flex items-center gap-1">
                                  <Clock className="w-3 h-3"/> WAKTU SUBTES 2 (DETIK)
                                </label>
                                <input 
                                  type="number" 
                                  value={cfitDurations.sub2} 
                                  onChange={e => setCfitDurations({...cfitDurations, sub2: e.target.value})} 
                                  className="w-full border border-[var(--primary-200)] p-3 rounded-lg outline-none font-bold text-[var(--primary-900)] focus:ring-2 focus:ring-[var(--primary-200)]" 
                                />
                                <p className="text-[10px] text-[var(--primary-600)] mt-2">
                                  = {(parseInt(cfitDurations.sub2 || "0") / 60).toFixed(1)} menit (Standar: 4 mnt)
                                </p>
                              </div>

                              {/* Subtes 3 */}
                              <div className="bg-[var(--primary-50)] p-4 rounded-xl border border-[var(--primary-100)]">
                                <label className="block text-[10px] font-bold text-[var(--primary-700)] uppercase mb-2 flex items-center gap-1">
                                  <Clock className="w-3 h-3"/> WAKTU SUBTES 3 (DETIK)
                                </label>
                                <input 
                                  type="number" 
                                  value={cfitDurations.sub3} 
                                  onChange={e => setCfitDurations({...cfitDurations, sub3: e.target.value})} 
                                  className="w-full border border-[var(--primary-200)] p-3 rounded-lg outline-none font-bold text-[var(--primary-900)] focus:ring-2 focus:ring-[var(--primary-200)]" 
                                />
                                <p className="text-[10px] text-[var(--primary-600)] mt-2">
                                  = {(parseInt(cfitDurations.sub3 || "0") / 60).toFixed(1)} menit (Standar: 3 mnt)
                                </p>
                              </div>

                              {/* Subtes 4 */}
                              <div className="bg-[var(--primary-50)] p-4 rounded-xl border border-[var(--primary-100)]">
                                <label className="block text-[10px] font-bold text-[var(--primary-700)] uppercase mb-2 flex items-center gap-1">
                                  <Clock className="w-3 h-3"/> WAKTU SUBTES 4 (DETIK)
                                </label>
                                <input 
                                  type="number" 
                                  value={cfitDurations.sub4} 
                                  onChange={e => setCfitDurations({...cfitDurations, sub4: e.target.value})} 
                                  className="w-full border border-[var(--primary-200)] p-3 rounded-lg outline-none font-bold text-[var(--primary-900)] focus:ring-2 focus:ring-[var(--primary-200)]" 
                                />
                                <p className="text-[10px] text-[var(--primary-600)] mt-2">
                                  = {(parseInt(cfitDurations.sub4 || "0") / 60).toFixed(1)} menit (Standar: 2.5 mnt)
                                </p>
                              </div>
                            </div>

                            <button 
                              onClick={handleSaveTestDuration} 
                              className="w-full bg-[var(--primary)] hover:bg-[var(--primary-700)] text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99]"
                            >
                              <CheckCircle className="w-5 h-5" /> Simpan Durasi CFIT
                            </button>
                          </div>
                        </div>

                        {/* Grid Subtypes */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {cfitSubtypes.map((st) => (
                          <div key={st.id} onClick={() => { setSelectedCfitSubtype(st); setCorrectAnswer(st.id === 2 ? [] : ""); }} className="bg-white p-5 rounded-xl border border-[var(--secondary-200)] hover:border-[var(--primary-300)] hover:shadow-md cursor-pointer group transition-all">
                             <div className="flex justify-between items-start mb-4">
                               <div className="w-10 h-10 rounded-lg bg-[var(--primary-50)] text-[var(--primary)] flex items-center justify-center font-bold">{st.id}</div>
                               <span className="text-[10px] font-bold text-[var(--secondary-500)] bg-[var(--secondary-50)] px-2 py-1 rounded-lg uppercase tracking-wide border border-[var(--secondary-100)]">{st.questions.length} SOAL</span>
                             </div>
                             <h4 className="font-bold text-[var(--primary-900)] text-lg group-hover:text-[var(--primary)] transition-colors">{st.name}</h4>
                             <p className="text-xs text-[var(--secondary)] mt-1">{st.description}</p>
                          </div>
                        ))}
                      </div>
                      </div>
                    ) : (
                      <div className="card-static bg-white rounded-2xl border border-[var(--secondary-200)] shadow-sm">
                        <div className="p-6 border-b border-[var(--secondary-100)] flex justify-between items-center bg-white">
                          <div><h3 className="font-bold text-[var(--primary-900)] text-lg">{selectedCfitSubtype.name}</h3></div>
                          <button onClick={() => setShowQuestionModal(true)} className="bg-[var(--primary)] hover:bg-[var(--primary-700)] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center transition-colors shadow-sm">
                            <Plus className="w-3 h-3 mr-2" /> Tambah Soal
                          </button>
                        </div>
                        <div className="p-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                          {selectedCfitSubtype.questions.map((q, idx) => (
                            <div key={q.id} className="relative group bg-white border border-[var(--secondary-200)] rounded-xl overflow-hidden hover:shadow-md transition-all">
                              <div className="aspect-square bg-[var(--secondary-50)] flex items-center justify-center p-2 relative">
                                {q.imageUrl ? <img src={q.imageUrl} className="max-w-full max-h-full object-contain" /> : <ImageIcon className="w-8 h-8 text-[var(--secondary-300)]" />}
                                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 font-bold rounded">#{idx + 1}</div>
                                <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] px-2 py-0.5 font-bold rounded shadow-sm">{q.correctAnswer}</div>
                              </div>
                              <button onClick={() => handleDeleteQuestion('cfit', q.id)} className="absolute inset-0 bg-red-500/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all backdrop-blur-[1px]">
                                <div className="bg-red-500 text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform">
                                  <Trash2 className="w-4 h-4" />
                                </div>
                              </button>
                            </div>
                          ))}
                          {selectedCfitSubtype.questions.length === 0 && (
                            <div className="col-span-full py-10 text-center text-[var(--secondary)] italic bg-[var(--secondary-50)] rounded-xl border border-dashed border-[var(--secondary-200)]">
                               Belum ada soal untuk kategori ini.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : isKraepelinCategory ? (
                  <div className="card-static bg-white rounded-2xl border border-[var(--secondary-200)] shadow-sm p-6 space-y-6">
                    <div className="border-b border-[var(--secondary-100)] pb-4 mb-4">
                      <h3 className="font-bold text-[var(--primary-900)] text-lg">Pengaturan Tes Kraepelin</h3>
                      <p className="text-[var(--secondary)] text-sm">Konfigurasi parameter grid angka dan durasi perpindahan.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       <div><label className="block text-xs font-bold text-[var(--secondary-500)] uppercase mb-2">JUMLAH KOLOM</label><input type="number" value={kraepelinColumns} onChange={e => setKraepelinColumns(e.target.value)} className="w-full border border-[var(--secondary-200)] p-3 rounded-xl outline-none focus:ring-2 focus:ring-[var(--primary-200)] focus:border-[var(--primary)] transition-all" /></div>
                       <div><label className="block text-xs font-bold text-[var(--secondary-500)] uppercase mb-2">JUMLAH BARIS</label><input type="number" value={kraepelinRows} onChange={e => setKraepelinRows(e.target.value)} className="w-full border border-[var(--secondary-200)] p-3 rounded-xl outline-none focus:ring-2 focus:ring-[var(--primary-200)] focus:border-[var(--primary)] transition-all" /></div>
                       <div className="bg-[var(--primary-50)] p-3 rounded-xl border border-[var(--primary-100)]"><label className="block text-xs font-bold text-[var(--primary-700)] uppercase mb-2 flex items-center gap-1"><Clock className="w-3 h-3"/> DURASI PINDAH (DETIK)</label><input type="number" value={kraepelinTimePerColumn} onChange={e => setKraepelinTimePerColumn(e.target.value)} className="w-full border border-[var(--primary-200)] p-3 rounded-lg outline-none font-bold text-[var(--primary-900)] focus:ring-2 focus:ring-[var(--primary-200)]" /></div>
                    </div>
                    {/* Live Preview Kraepelin Grid */}
                    <div className="bg-[#1e293b] rounded-xl p-6 border border-gray-700 mt-6 shadow-inner">
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Live Preview Grid Angka</p>
                          <span className="text-[10px] bg-[var(--primary)]/20 text-[var(--primary-300)] px-2 py-1 rounded font-mono font-bold tracking-tighter border border-[var(--primary)]/30">EST: ~{Math.ceil((parseInt(kraepelinColumns) || 0) * (parseInt(kraepelinTimePerColumn) || 0) / 60)} MENIT</span>
                        </div>
                        <div className="bg-[#0f172a] p-4 border border-gray-700 overflow-x-auto shadow-inner rounded-lg scrollbar-hide">
                          <div className="flex gap-1.5 justify-start">
                            {Array.from({ length: Math.min(parseInt(kraepelinColumns) || 10, 20) }).map((_, colIdx) => (
                              <div key={colIdx} className="flex flex-col gap-1">
                                {Array.from({ length: Math.min(parseInt(kraepelinRows) || 10, 12) }).map((_, rowIdx) => (
                                  <div key={rowIdx} className="w-6 h-6 bg-[#1e293b] border border-gray-700 flex items-center justify-center text-xs font-mono font-bold text-[var(--primary-300)] shadow-sm rounded-sm">{Math.floor(Math.random() * 10)}</div>
                                ))}
                                <div className="text-[8px] text-center text-gray-600 font-bold mt-1 uppercase">C{colIdx + 1}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                    </div>
                    <button onClick={handleSaveKraepelin} className="w-full bg-[var(--primary)] hover:bg-[var(--primary-700)] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99]"><CheckCircle className="w-5 h-5" /> Simpan Konfigurasi</button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Konfigurasi Durasi Tes PAPI */}
                    <div className="card-static bg-white rounded-2xl border border-[var(--secondary-200)] shadow-sm p-6">
                      <div className="border-b border-[var(--secondary-100)] pb-4 mb-4">
                        <h3 className="font-bold text-[var(--primary-900)] text-lg">Pengaturan Durasi Tes</h3>
                        <p className="text-[var(--secondary)] text-sm">Konfigurasi durasi untuk tes {selectedCategory.name}</p>
                      </div>
                      
                      {selectedCategory.code === 'papi' ? (
                        <div className="space-y-4">
                          <div className="bg-[var(--primary-50)] p-4 rounded-xl border border-[var(--primary-100)]">
                            <label className="block text-xs font-bold text-[var(--primary-700)] uppercase mb-2 flex items-center gap-1">
                              <Clock className="w-3 h-3"/> DURASI TES PAPI (DETIK)
                            </label>
                            <input 
                              type="number" 
                              value={papiDuration} 
                              onChange={e => setPapiDuration(e.target.value)} 
                              className="w-full border border-[var(--primary-200)] p-3 rounded-lg outline-none font-bold text-[var(--primary-900)] focus:ring-2 focus:ring-[var(--primary-200)]" 
                            />
                            <p className="text-[10px] text-[var(--primary-600)] mt-2">
                              = {(parseInt(papiDuration || "0") / 60).toFixed(1)} menit
                            </p>
                          </div>
                          <button 
                            onClick={handleSaveTestDuration} 
                            className="w-full bg-[var(--primary)] hover:bg-[var(--primary-700)] text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99]"
                          >
                            <CheckCircle className="w-5 h-5" /> Simpan Durasi
                          </button>
                        </div>
                      ) : null}
                    </div>

                    {/* List Soal */}
                    <div className="card-static bg-white rounded-2xl border border-[var(--secondary-200)] shadow-sm overflow-hidden">
                      <div className="p-6 border-b border-[var(--secondary-100)] flex justify-between items-center bg-white">
                        <h3 className="font-bold text-[var(--primary-900)] text-lg">{selectedCategory.name}</h3>
                        <button onClick={() => setShowQuestionModal(true)} className="bg-[var(--primary)] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center hover:bg-[var(--primary-700)] transition-colors shadow-sm"><Plus className="w-3 h-3 mr-2" /> Tambah Soal</button>
                      </div>
                      <div className="divide-y divide-[var(--secondary-100)]">
                        {localQuestions[selectedCategory.id]?.map((q, idx) => (
                          <div key={q.id} className="p-6 hover:bg-[var(--secondary-50)] group flex justify-between transition-colors">
                             <div className="space-y-3 flex-1">
                               <span className="text-[10px] font-bold text-[var(--primary)] bg-[var(--primary-50)] px-2 py-1 rounded border border-[var(--primary-100)]">Item #{idx + 1}</span>
                               <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                                 <div className="border border-[var(--secondary-200)] p-3 rounded-lg bg-white shadow-sm"><span className="font-bold text-[var(--secondary-500)] mr-2">A:</span> {q.option_a}</div>
                                 <div className="border border-[var(--secondary-200)] p-3 rounded-lg bg-white shadow-sm"><span className="font-bold text-[var(--secondary-500)] mr-2">B:</span> {q.option_b}</div>
                               </div>
                             </div>
                             <button onClick={() => handleDeleteQuestion('papi', q.id)} className="text-[var(--secondary-300)] hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all p-2 rounded-lg hover:bg-red-50"><Trash2 className="w-5 h-5" /></button>
                          </div>
                        )) || <div className="p-10 text-center text-[var(--secondary)] italic">Belum ada soal.</div>}
                      </div>
                    </div>
                  </div>
                )}
              </section>
            </div>
          )}

          {/* === TAB 2: TEST LINKS === */}
          {activeTab === "test-links" && (
            <div className="card-static bg-white rounded-2xl border border-[var(--secondary-200)] shadow-sm overflow-hidden">
              <div className="p-4 md:p-6 border-b border-[var(--secondary-100)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[var(--background)]">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-[var(--primary-900)]">Active Links</h3>
                  <div className="text-xs font-bold bg-white border border-[var(--secondary-200)] px-3 py-1 rounded-full text-[var(--secondary-600)]">
                    {localTestLinks.length} Links Total
                  </div>
                </div>

                <button 
                  onClick={() => setShowCreateLinkModal(true)} 
                  className="w-full md:w-auto bg-[var(--primary)] hover:bg-[var(--primary-700)] text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Buat Link Baru
                </button>
              </div>

              {/* Desktop View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[var(--secondary-50)] text-[var(--secondary-500)] font-bold uppercase text-[10px] tracking-wide border-b border-[var(--secondary-100)]">
                    <tr>
                      <th className="p-4">Peserta</th>
                      <th className="p-4">Token</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--secondary-50)]">
                    {localTestLinks.map(link => (
                      <tr key={link.id} className="hover:bg-[var(--primary-50)]/30 transition-colors">
                        <td className="p-4 font-bold text-[var(--primary-900)]">{link.candidateName}</td>
                        <td className="p-4">
                          <span className="font-mono text-[var(--secondary-600)] text-xs bg-[var(--secondary-50)] border border-[var(--secondary-200)] px-2 py-1 rounded ">
                            {link.token}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${link.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                            {link.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                             <button onClick={() => copyLink(link.token)} className="text-[var(--secondary-400)] hover:text-[var(--primary)] p-2 hover:bg-[var(--primary-50)] rounded-lg transition-colors" title="Copy Link"><Copy className="w-4 h-4"/></button>
                             <button className="text-[var(--secondary-400)] hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors" title="Revoke"><X className="w-4 h-4"/></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {localTestLinks.length === 0 && (
                      <tr><td colSpan={4} className="p-8 text-center text-[var(--secondary)] italic">Belum ada link aktif.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-[var(--secondary-100)]">
                  {localTestLinks.map(link => (
                    <div key={link.id} className="p-4 hover:bg-[var(--secondary-50)] transition-colors">
                      <div className="flex justify-between items-start mb-2">
                         <div className="font-bold text-[var(--primary-900)]">{link.candidateName}</div>
                         <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${link.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                            {link.status}
                         </span>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                         <span className="text-xs text-[var(--secondary)]">Token:</span>
                         <span className="font-mono text-[var(--secondary-600)] text-xs bg-[var(--secondary-50)] border border-[var(--secondary-200)] px-2 py-0.5 rounded ">
                            {link.token}
                         </span>
                      </div>
                      <div className="flex gap-2">
                         <button onClick={() => copyLink(link.token)} className="flex-1 py-2 bg-[var(--primary-50)] text-[var(--primary)] text-xs font-bold rounded-lg flex items-center justify-center gap-1 active:scale-95 transition-transform">
                            <Copy className="w-3 h-3"/> Salin Link
                         </button>
                         <button className="flex-1 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-lg flex items-center justify-center gap-1 active:scale-95 transition-transform">
                            <X className="w-3 h-3"/> Revoke
                         </button>
                      </div>
                    </div>
                  ))}
                  {localTestLinks.length === 0 && (
                    <div className="p-8 text-center text-[var(--secondary)] italic">Belum ada link aktif.</div>
                  )}
              </div>
            </div>
          )}
          
          {/* === TAB 3: SUBMISSIONS (IMPROVED UI) === */}
          {activeTab === "submissions" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-[var(--secondary-200)] flex items-center gap-4">
                  <div className="bg-[var(--primary-50)] p-3 rounded-full text-[var(--primary)] border border-[var(--primary-100)]"><FileCheck className="w-6 h-6"/></div>
                  <div><div className="text-2xl font-bold text-[var(--primary-900)]">{submissions.length}</div><div className="text-sm text-[var(--secondary)]">Total Submissions</div></div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-[var(--secondary-200)] flex items-center gap-4">
                  <div className="bg-green-50 p-3 rounded-full text-green-600 border border-green-100"><BarChart2 className="w-6 h-6"/></div>
                  <div><div className="text-2xl font-bold text-[var(--primary-900)]">{submissions.filter(s => s.test_type === 'cfit').length}</div><div className="text-sm text-[var(--secondary)]">CFIT Completed</div></div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-[var(--secondary-200)] flex items-center gap-4">
                  <div className="bg-purple-50 p-3 rounded-full text-purple-600 border border-purple-100"><Zap className="w-6 h-6"/></div>
                  <div><div className="text-2xl font-bold text-[var(--primary-900)]">{submissions.filter(s => s.test_type === 'kraepelin').length}</div><div className="text-sm text-[var(--secondary)]">Kraepelin Completed</div></div>
                </div>
              </div>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                 {renderSubmissionTable()}
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                 {submissions.map((sub) => {
                    let scoreBadge = <span className="text-[var(--secondary)] italic text-xs">Menunggu...</span>;
                    if (sub.scores && Object.keys(sub.scores).length > 0) {
                      if (sub.test_type === 'cfit') {
                        const iq = sub.scores.iq || 0;
                        const color = iq >= 110 ? 'text-green-600 bg-green-50 border-green-200' : (iq >= 90 ? 'text-[var(--primary)] bg-[var(--primary-50)] border-[var(--primary-200)]' : 'text-red-600 bg-red-50 border-red-200');
                        scoreBadge = (
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border ${color}`}>
                            <span className="font-bold text-xs">IQ: {iq}</span>
                            <span className="text-[10px] uppercase opacity-80 border-l border-current pl-2">{sub.scores.classification}</span>
                          </div>
                        );
                      } else if (sub.test_type === 'kraepelin') {
                           scoreBadge = (
                              <div className="flex flex-wrap gap-2 text-xs">
                                <span className="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-200">Speed: <b>{sub.scores.panker}</b></span>
                                <span className="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-200">Acc: <b>{sub.scores.janker}</b></span>
                              </div>
                           );
                      } else if (sub.test_type === 'papi') {
                        scoreBadge = (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-50 text-orange-700 text-xs border border-orange-100 font-medium">
                            <CheckCircle className="w-3 h-3"/> Ready
                          </span>
                        );
                      }
                    }

                    return (
                        <div key={sub.id} className="card-static bg-white border border-[var(--secondary-200)] rounded-xl p-4 shadow-sm">
                           <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[var(--secondary-100)] flex items-center justify-center text-[var(--secondary-600)] font-bold text-sm">
                                  {sub.candidate_name ? sub.candidate_name.charAt(0).toUpperCase() : "?"}
                                </div>
                                <div>
                                   <div className="font-bold text-[var(--primary-900)] text-sm">{sub.candidate_name}</div>
                                   <div className="text-[10px] text-[var(--secondary)] flex items-center gap-1">
                                      <Calendar size={10}/> {new Date(sub.submitted_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} • {new Date(sub.submitted_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                   </div>
                                </div>
                              </div>
                              <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border ${getTestBadgeColor(sub.test_type)}`}>
                                {sub.test_type}
                              </span>
                           </div>
                           
                           <div className="mb-4 bg-[var(--secondary-50)] p-3 rounded-lg border border-[var(--secondary-100)]">
                              <span className="text-[10px] font-bold text-[var(--secondary-500)] uppercase block mb-1">Result Summary</span>
                              {scoreBadge}
                           </div>

                           <button 
                             onClick={() => setShowDetailModal(sub)}
                             className="w-full py-2.5 bg-white border border-[var(--secondary-200)] text-[var(--primary)] hover:bg-[var(--primary-50)] rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                           >
                             <Eye className="w-3.5 h-3.5"/> Lihat Detail Lengkap
                           </button>
                        </div>
                    );
                 })}
                 {submissions.length === 0 && (
                     <div className="p-8 text-center text-[var(--secondary)] bg-[var(--secondary-50)] rounded-xl border border-dashed border-[var(--secondary-200)]">Belum ada data submission.</div>
                 )}
              </div>
            </div>
          )}

        </main>
        <Footer />
      </div>

      {/* --- CREATE LINK MODAL --- */}
      {showCreateLinkModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-[var(--secondary-100)] flex justify-between items-center bg-[var(--background)]">
                <h3 className="text-lg font-bold text-[var(--primary-900)]">Buat Link Tes Baru</h3>
                <button onClick={() => setShowCreateLinkModal(false)}><X className="text-[var(--secondary-400)] hover:text-red-500 transition-colors" /></button>
              </div>
              <div className="p-6 space-y-4">
                
                {/* PILIHAN TIPE PESERTA (TOGGLE) */}
                <div className="flex gap-2 mb-2 p-1 bg-[var(--secondary-50)] rounded-lg w-full">
                  <button 
                    onClick={() => setParticipantType("candidate")}
                    className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${participantType === "candidate" ? "bg-white text-[var(--primary)] shadow-sm border border-[var(--secondary-200)]" : "text-[var(--secondary-500)] hover:bg-white/50"}`}
                  >
                    Kandidat Baru
                  </button>
                  <button 
                    onClick={() => setParticipantType("karyawan")}
                    className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${participantType === "karyawan" ? "bg-white text-[var(--primary)] shadow-sm border border-[var(--secondary-200)]" : "text-[var(--secondary-500)] hover:bg-white/50"}`}
                  >
                    Karyawan Internal
                  </button>
                </div>

                <div>
                   <label className="block text-xs font-bold text-[var(--secondary-500)] uppercase mb-2">
                     Pilih {participantType === "candidate" ? "Kandidat" : "Karyawan"}
                   </label>
                   {participantType === "candidate" ? (
                     <select 
                       value={selectedCandidateId} 
                       onChange={(e) => setSelectedCandidateId(e.target.value)}
                       className="w-full p-3 border border-[var(--secondary-200)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] text-sm bg-white"
                     >
                       <option value="">-- Pilih Kandidat --</option>
                       {candidatesList.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
                     </select>
                   ) : (
                     <select 
                       value={selectedKaryawanId} 
                       onChange={(e) => setSelectedKaryawanId(e.target.value)}
                       className="w-full p-3 border border-[var(--secondary-200)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] text-sm bg-white"
                     >
                       <option value="">-- Pilih Karyawan --</option>
                       {karyawanList.map(k => <option key={k.id} value={k.id}>{k.fullName}</option>)}
                     </select>
                   )}
                </div>

                <div>
                   <label className="block text-xs font-bold text-[var(--secondary-500)] uppercase mb-2">Posisi (Opsional)</label>
                   <select 
                     value={selectedJobId} 
                     onChange={(e) => setSelectedJobId(e.target.value)}
                     className="w-full p-3 border border-[var(--secondary-200)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] text-sm bg-white"
                   >
                     <option value="">-- Tidak Spesifik --</option>
                     {jobsList.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                   </select>
                </div>
                <div className="bg-[var(--primary-50)] p-4 rounded-xl border border-[var(--primary-100)] flex gap-3">
                   <AlertCircle className="w-5 h-5 text-[var(--primary)] flex-shrink-0" />
                   <p className="text-xs text-[var(--primary-800)] leading-relaxed">
                      Link akan otomatis berisi 3 paket tes (CFIT, PAPI, Kraepelin). Token unik akan di-generate untuk akses ujian.
                   </p>
                </div>
              </div>
              <div className="p-6 border-t border-[var(--secondary-100)] flex justify-end gap-3 bg-gray-50">
                 <button onClick={() => setShowCreateLinkModal(false)} className="px-5 py-2.5 text-[var(--secondary-600)] font-bold text-sm hover:bg-gray-100 rounded-xl transition-colors">Batal</button>
                 <button 
                   onClick={handleGenerateLink} 
                   disabled={isGeneratingLink}
                   className="px-5 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-700)] text-white font-bold text-sm rounded-xl transition-colors flex items-center shadow-lg shadow-teal-500/20 disabled:opacity-50"
                 >
                   {isGeneratingLink ? <RefreshCw className="animate-spin w-4 h-4 mr-2"/> : <Zap className="w-4 h-4 mr-2"/>}
                   Generate Link
                 </button>
              </div>
            </div>
        </div>
      )}

      {/* --- ADD QUESTION MODAL --- */}
      {showQuestionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-6 border-b border-[var(--secondary-100)] flex justify-between items-center bg-[var(--background)]">
              <h3 className="text-lg font-bold text-[var(--primary-900)]">Tambah Soal {isCfitCategory ? 'CFIT' : 'PAPI'}</h3>
              <button onClick={() => setShowQuestionModal(false)}><X className="text-[var(--secondary-400)] hover:text-red-500 transition-colors" /></button>
            </div>
            <div className="p-6 space-y-4">
              {isCfitCategory ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-[var(--secondary-500)] uppercase mb-1 block">Gambar Soal</label>
                    <input type="file" onChange={handleImageUpload} className="w-full text-sm text-[var(--secondary-700)] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[var(--primary-50)] file:text-[var(--primary)] hover:file:bg-[var(--primary-100)]" />
                    {imagePreview && <img src={imagePreview} alt="Preview" className="mt-4 max-h-48 object-contain mx-auto rounded-lg border border-[var(--secondary-200)]" />}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[var(--secondary-500)] uppercase mb-2 block">
                      Kunci Jawaban {selectedCfitSubtype?.id === 2 && <span className="text-red-500 normal-case ml-1">(Pilih 2)</span>}
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {getOptionLabels(selectedCfitSubtype?.optionCount || 6).map(lbl => {
                        const isSubtest2 = selectedCfitSubtype?.id === 2;
                        const isSelected = isSubtest2 ? Array.isArray(correctAnswer) && correctAnswer.includes(lbl) : correctAnswer === lbl;
                        return (
                          <button 
                            key={lbl} 
                            onClick={() => {
                              if (isSubtest2) {
                                setCorrectAnswer((prev: any) => {
                                  const arr = Array.isArray(prev) ? [...prev] : [];
                                  if (arr.includes(lbl)) return arr.filter((a: string) => a !== lbl); // Unselect
                                  if (arr.length < 2) return [...arr, lbl].sort(); // Select
                                  toast.warning("Maksimal 2 kunci jawaban."); return arr;
                                });
                              } else {
                                setCorrectAnswer(lbl);
                              }
                            }} 
                            className={`w-10 h-10 rounded-lg font-bold border transition-all ${isSelected ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-md' : 'text-[var(--secondary-400)] border-[var(--secondary-200)] hover:bg-[var(--secondary-50)]'}`}
                          >{lbl}</button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                   <div><label className="block text-xs font-bold text-[var(--secondary-500)] uppercase mb-2">Opsi A (Pernyataan 1)</label><textarea value={optionA} onChange={e => setOptionA(e.target.value)} className="w-full border border-[var(--secondary-200)] p-3 rounded-xl text-sm focus:ring-2 focus:ring-[var(--primary)]/20 outline-none" rows={2} placeholder="Saya suka bekerja keras..." /></div>
                   <div><label className="block text-xs font-bold text-[var(--secondary-500)] uppercase mb-2">Opsi B (Pernyataan 2)</label><textarea value={optionB} onChange={e => setOptionB(e.target.value)} className="w-full border border-[var(--secondary-200)] p-3 rounded-xl text-sm focus:ring-2 focus:ring-[var(--primary)]/20 outline-none" rows={2} placeholder="Saya suka menjadi pemimpin..." /></div>
                </div>
              )}
              
              <div className="flex gap-2 pt-4">
                 <button onClick={() => setShowQuestionModal(false)} className="flex-1 py-3 text-[var(--secondary-600)] font-bold hover:bg-[var(--secondary-50)] rounded-xl border border-[var(--secondary-200)] transition-colors">Batal</button>
                 <button onClick={isCfitCategory ? handleAddCfitQuestion : handleAddPapiQuestion} disabled={isSubmitting} className="flex-[2] bg-[var(--primary)] text-white py-3 rounded-xl font-bold hover:bg-[var(--primary-700)] disabled:bg-[var(--secondary-200)] disabled:text-[var(--secondary-400)] transition-colors shadow-sm text-sm">
                   {isSubmitting ? 'Menyimpan...' : 'Simpan Soal'}
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- DETAIL MODAL --- */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[95vh] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
              <div className="p-5 border-b border-[var(--secondary-100)] flex justify-between items-center bg-[var(--background)] shrink-0">
                 <div>
                    <h3 className="text-lg font-bold text-[var(--primary-900)]">Detail Hasil Tes</h3>
                    <p className="text-xs text-[var(--secondary)]">Peserta: {showDetailModal.candidate_name}</p>
                 </div>
                 <button onClick={() => setShowDetailModal(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="text-[var(--secondary-400)]" /></button>
              </div>
              <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
                 {renderDetailContent(showDetailModal)}
              </div>
              <div className="p-4 border-t border-[var(--secondary-100)] bg-gray-50 flex justify-end">
                 <button onClick={() => setShowDetailModal(null)} className="px-5 py-2 bg-white border border-[var(--secondary-200)] text-[var(--secondary-700)] font-bold text-sm rounded-xl hover:bg-[var(--secondary-50)]">Tutup</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}