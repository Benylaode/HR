"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getTestConfig, saveTestConfig } from "@/utils/config-actions"; 
import { healAllSubmissions } from "@/utils/kraepelinHealer";
import { toast } from "sonner";
import CandidateEvaluation from "@/components/recruitment/CandidateEvaluation"; 
import { getPapiInterpretation, getPapiTraitName, extractPapiLetter } from "@/utils/papiScoring";
import {
  CheckCircle, Plus, RefreshCw, Trash2, X, FolderOpen, 
  Clock, FileCheck, Eye, Zap, Target, AlertCircle, User, Calendar, Image as ImageIcon, Copy, Shield
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
  employee_name?: string; 
  test_type: string;
  scores: any; 
  raw_answers?: any; // <-- DITAMBAHKAN UNTUK MENGAMBIL DATA RAW DARI BACKEND
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

type TabType = "categories" | "test-links" | "submissions" | "evaluation";

// --- 3. MAIN COMPONENT ---
export default function TestManagementPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  
  const [user, setUser] = useState<{ name: string; role?: string } | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("categories");
  
  const [evalTargetType, setEvalTargetType] = useState<"candidate" | "karyawan">("candidate");
  const [evalTargetId, setEvalTargetId] = useState("");
  
  const [localCategories, setLocalCategories] = useState<Category[]>(STATIC_CATEGORIES);
  const [localQuestions, setLocalQuestions] = useState<Record<number, Question[]>>({});
  const [localTestLinks, setLocalTestLinks] = useState<TestLink[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]); 
  
  const [candidatesList, setCandidatesList] = useState<Candidate[]>([]);
  const [karyawanList, setKaryawanList] = useState<Karyawan[]>([]);
  const [jobsList, setJobsList] = useState<JobPosition[]>([]);
  
  const [participantType, setParticipantType] = useState<"candidate" | "karyawan">("candidate");
  const [selectedCandidateId, setSelectedCandidateId] = useState("");
  const [selectedKaryawanId, setSelectedKaryawanId] = useState("");
  const [selectedJobId, setSelectedJobId] = useState(""); 

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(STATIC_CATEGORIES[0]);
  const [cfitSubtypes, setCfitSubtypes] = useState<CfitSubtype[]>(INITIAL_CFIT_SUBTYPES);
  const [selectedCfitSubtype, setSelectedCfitSubtype] = useState<CfitSubtype | null>(null);
  
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showCreateLinkModal, setShowCreateLinkModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState<Submission | null>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState<string | string[]>("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");

  const [kraepelinColumns, setKraepelinColumns] = useState("50");
  const [kraepelinRows, setKraepelinRows] = useState("27");
  const [kraepelinTimePerColumn, setKraepelinTimePerColumn] = useState("20");

  const [cfitDurations, setCfitDurations] = useState({
    sub1: "180", sub2: "240", sub3: "180", sub4: "150", 
  });
  const [papiDuration, setPapiDuration] = useState("1800");
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fungsi untuk men-generate angka acak untuk Preview Kraepelin
  const generateRandomKraepelinColumn = (rows: number) => {
      return Array.from({ length: rows }, () => Math.floor(Math.random() * 9) + 1);
  };
  
  const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem("hr_token");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  useEffect(() => {
    setIsMounted(true);
    const userData = localStorage.getItem("hr_user");
    if (!userData) {
      router.push("/");
      return;
    }
    setUser(JSON.parse(userData));
    
    const loadConfig = async () => {
      const config = await getTestConfig();
      if (config) {
        setCfitDurations({
          sub1: String(config.cfit_sub1 || 180),
          sub2: String(config.cfit_sub2 || 240),
          sub3: String(config.cfit_sub3 || 180),
          sub4: String(config.cfit_sub4 || 150),
        });
        setPapiDuration(String(config.papi || 1800));
      }
    };
    loadConfig();
    fetchData(); 
  }, [router]);

  const fetchData = async () => {
    try {
      const fetchOptions: RequestInit = { headers: getAuthHeaders(), cache: "no-store" };

      // FETCH TEST LINKS
      const resLinks = await fetch(`${API_BASE_URL}/management/links`, fetchOptions);
      if (resLinks.ok) setLocalTestLinks(await resLinks.json());

      // FETCH SUBMISSIONS & LAKUKAN AUTO-HEALING UNTUK DATA LAMA
      const resSubs = await fetch(`${API_BASE_URL}/management/submissions`, fetchOptions); 
      // console.log(resSubs)
      if (resSubs.ok) {
        const data = await resSubs.json();
        const subsArray = Array.isArray(data) ? data : (data.data || data.submissions || []);
        
        // Gunakan Utility Healer untuk menangani data lama & menghitung Hanker otomatis
        const processedSubs = healAllSubmissions(subsArray);
        
        setSubmissions(processedSubs);
      }

      // FETCH OTHERS
      const resCandidates = await fetch(`${API_BASE_URL}/candidates`, fetchOptions);
      if (resCandidates.ok) setCandidatesList(await resCandidates.json());

      const resKaryawan = await fetch(`${API_BASE_URL}/employees`, fetchOptions);
      if (resKaryawan.ok) setKaryawanList(await resKaryawan.json());
      
      const resJobs = await fetch(`${API_BASE_URL}/job-positions?status=active`, fetchOptions);
      if (resJobs.ok) setJobsList(await resJobs.json());

      const resKraepelin = await fetch(`${API_BASE_URL}/management/config/kraepelin`, fetchOptions);
      if (resKraepelin.ok) {
        const data = await resKraepelin.json();
        setKraepelinColumns(String(data.columns || 50));
        setKraepelinRows(String(data.rows || 27));
        setKraepelinTimePerColumn(String(data.durationPerColumn || 20));
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
      if (!response.ok) throw new Error(data.error || "Gagal membuat link tes");

      fetchData();
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
        const headers: HeadersInit = { ...(localStorage.getItem("hr_token") ? { Authorization: `Bearer ${localStorage.getItem("hr_token")}` } : {}) };

        if (selectedFile) formData.append("image", selectedFile);
        formData.append("subtest", String(selectedCfitSubtype?.id));
        formData.append("instruction", selectedCfitSubtype?.instruction || "");
        
        let answerToSubmit = "";
        if (selectedCfitSubtype?.id === 2 && Array.isArray(correctAnswer)) {
           answerToSubmit = correctAnswer.map(labelToIndex).sort().join(",");
        } else {
           answerToSubmit = String(labelToIndex(correctAnswer as string)); 
        }
        formData.append("correctAnswer", answerToSubmit);
        
        const res = await fetch(`${API_BASE_URL}/management/questions/cfit`, { method: "POST", body: formData, headers: headers });
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
      const res = await fetch(`${API_BASE_URL}/management/questions/${endpoint}/${id}`, { method: "DELETE", headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Gagal menghapus soal");
      fetchData();
      return "Soal berhasil dihapus";
    };
    toast.promise(deleteTask(), { loading: 'Menghapus...', success: (msg) => msg, error: (err) => err.message });
  };

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

  // Logika Kategori Aktif
  const isCfitCategory = selectedCategory?.code === "cfit";
  const isKraepelinCategory = selectedCategory?.code === "kraepelin";

  const getTestBadgeColor = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('cfit')) return 'bg-blue-50 text-blue-700 border border-blue-200';
    if (t.includes('kraepelin')) return 'bg-teal-50 text-teal-700 border border-teal-200';
    if (t.includes('papi')) return 'bg-orange-50 text-orange-700 border border-orange-200';
    return 'bg-gray-50 text-gray-600 border border-gray-200';
  };

  // --- RENDER TABLE HASIL SUBMISSION ---
  const renderSubmissionTable = () => (
    <div className="bg-white rounded-[20px] border border-gray-200 shadow-sm overflow-hidden max-w-5xl">
      <div className="p-6 border-b border-gray-100 bg-white">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-[#0a8b74]" />
          Riwayat Hasil Tes
        </h3>
      </div>
      <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] tracking-wide border-b border-gray-100">
          <tr>
            <th className="px-6 py-4">Peserta</th>
            <th className="px-6 py-4">Jenis Tes</th>
            <th className="px-6 py-4">Hasil Ringkas</th>
            <th className="px-6 py-4">Waktu Submit</th>
            <th className="px-6 py-4 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {submissions.length > 0 ? submissions.map((sub) => {
            const participantName = sub.candidate_name || sub.employee_name || "Unknown";
            const testType = sub.test_type ? sub.test_type.toLowerCase() : "";

            let scoreBadge = <span className="text-gray-400 italic text-xs">Menunggu...</span>;
            
            if (sub.scores && Object.keys(sub.scores).length > 0) {
              if (testType.includes('cfit')) {
                const iq = sub.scores.iq || 0;
                const color = iq >= 110 ? 'text-green-600 bg-green-50 border-green-200' : (iq >= 90 ? 'text-blue-600 bg-blue-50 border-blue-200' : 'text-red-600 bg-red-50 border-red-200');
                scoreBadge = (
                  <div className={`inline-flex flex-col px-3 py-1 rounded-lg border ${color}`}>
                    <span className="font-bold text-xs">IQ: {iq}</span>
                    <span className="text-[9px] uppercase tracking-wide opacity-80">{sub.scores.classification || "Unclassified"}</span>
                  </div>
                );
                  } else if (testType.includes('kraepelin')) {
                    // Ambil data dengan fallback ke key lama jika healer belum berjalan sempurna
                    const cepat = sub.scores.panker ?? sub.scores.kecepatan ?? '-';
                    const teliti = sub.scores.totalErrors ?? sub.scores.salah ?? '-';
                    const tahan = sub.scores.hanker ?? '-';

                    scoreBadge = (
                      <div className="flex flex-wrap gap-2">
                        {/* 1. CEPAT (PANKER) */}
                        <div className="px-2 py-1 bg-yellow-50 border border-yellow-100 rounded text-xs">
                          <span className="text-yellow-600 mr-1">Cepat:</span>
                          <span className="font-bold text-yellow-900">{cepat}</span>
                        </div>

                        {/* 2. TELITI (TOTAL ERRORS) */}
                        <div className="px-2 py-1 bg-red-50 border border-red-100 rounded text-xs">
                          <span className="text-red-600 mr-1">Teliti:</span>
                          <span className="font-bold text-red-900">{teliti}</span>
                        </div>

                        {/* 3. TAHAN (HANKER - HASIL HEALING) */}
                        <div className="px-2 py-1 bg-purple-50 border border-purple-100 rounded text-xs">
                          <span className="text-purple-600 mr-1">Tahan:</span>
                          <span className="font-bold text-purple-900">{tahan}</span>
                        </div>
                      </div>
                    );

              } else if (testType.includes('papi')) {
                scoreBadge = (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-50 text-orange-700 text-xs border border-orange-100 font-medium">
                    <CheckCircle className="w-3 h-3"/> Profile Ready
                  </span>
                );
              }
            }

            return (
              <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-xs shrink-0">
                      {participantName.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-bold text-gray-900">{participantName}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${getTestBadgeColor(testType)}`}>
                    {sub.test_type}
                  </span>
                </td>
                <td className="px-6 py-4">{scoreBadge}</td>
                <td className="px-6 py-4 text-gray-500 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-gray-400"/>
                    {new Date(sub.submitted_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    <span className="text-gray-300">|</span>
                    {new Date(sub.submitted_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => setShowDetailModal(sub)}
                    className="text-gray-500 hover:text-[#0a8b74] hover:bg-[#0a8b74]/10 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-end gap-1.5 ml-auto"
                  >
                    <Eye className="w-3.5 h-3.5"/> Detail
                  </button>
                </td>
              </tr>
            );
          }) : (
            <tr>
              <td colSpan={5} className="px-6 py-12 text-center text-gray-500 bg-gray-50">
                <div className="flex flex-col items-center justify-center">
                  <FileCheck className="w-10 h-10 mb-3 text-gray-300" />
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

  // --- RENDER DETAIL MODAL CONTENT ---
  const renderDetailContent = (sub: Submission) => {
    if (!sub.scores || Object.keys(sub.scores).length === 0) return <div className="p-8 text-center text-gray-500 italic">Data hasil belum diproses atau kosong.</div>;
    const testType = sub.test_type ? sub.test_type.toLowerCase() : "";

    if (testType.includes('cfit')) {
        const iq = sub.scores.iq || 0;
        const color = iq >= 110 ? 'text-green-600' : (iq >= 90 ? 'text-blue-600' : 'text-red-600');
        return (
            <div className="space-y-6">
                <div className="flex flex-col items-center justify-center p-8 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="text-sm text-blue-600 font-bold uppercase tracking-widest mb-1">IQ Score</div>
                    <div className={`text-6xl font-black ${color}`}>{iq}</div>
                    <div className="mt-2 px-4 py-1 bg-white rounded-full text-sm font-bold shadow-sm text-blue-900 border border-blue-200">
                        {sub.scores.classification || "Unclassified"}
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border border-gray-200 rounded-xl bg-gray-50/50">
                        <div className="text-xs text-gray-500 uppercase font-bold mb-1">Raw Score</div>
                        <div className="text-2xl font-bold text-gray-900">{sub.scores.raw_score} <span className="text-sm text-gray-400 font-normal">/ 50</span></div>
                    </div>
                </div>
            </div>
        );
    } 
    
    if (testType.includes('kraepelin')) {
        // Logika pewarnaan otomatis (Merah untuk 'Kurang', Teal untuk yang lain)
        const getBadgeClass = (grade: string | undefined) => {
            if (!grade) return "";
            return grade.toLowerCase().includes('kurang') 
                ? "bg-red-50 text-red-700 border-red-100" 
                : "text-teal-700 bg-teal-50 border-teal-100";
        };

        return (
            <div className="space-y-6">
                {sub.scores.interpretation && (
                  <div className="p-4 bg-teal-50 rounded-xl border border-teal-100 text-center">
                      <h4 className="font-bold text-teal-900 mb-2">Interpretasi Umum</h4>
                      <p className="text-sm text-teal-700 italic">"{sub.scores.interpretation}"</p>
                  </div>
                )}
                
                {/* Menampilkan 3 poin: CEPAT, TELITI, dan TAHAN */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* 1. CEPAT (Produktivitas) */}
                    <div className="p-4 border border-gray-200 rounded-xl shadow-sm bg-white">
                        <div className="flex items-center gap-2 mb-2"><Zap className="w-4 h-4 text-yellow-500"/><span className="text-[11px] font-bold uppercase text-gray-500">CEPAT (Produktivitas)</span></div>
                        <div className="text-2xl font-bold text-gray-900">{sub.scores.panker ?? '-'}</div>
                        {sub.scores.gradeSpeed && <div className={`text-xs mt-1 px-2 py-0.5 rounded w-fit border ${getBadgeClass(sub.scores.gradeSpeed)}`}>{sub.scores.gradeSpeed}</div>}
                    </div>

                    {/* 2. TELITI (Ketelitian) */}
                    <div className="p-4 border border-gray-200 rounded-xl shadow-sm bg-white">
                        <div className="flex items-center gap-2 mb-2"><AlertCircle className="w-4 h-4 text-red-500"/><span className="text-[11px] font-bold uppercase text-gray-500">TELITI (Ketelitian)</span></div>
                        <div className="text-2xl font-bold text-red-600">{sub.scores.totalErrors ?? '-'}</div>
                        {sub.scores.gradeAccuracy && <div className={`text-xs mt-1 px-2 py-0.5 rounded w-fit border ${getBadgeClass(sub.scores.gradeAccuracy)}`}>{sub.scores.gradeAccuracy}</div>}
                    </div>

                    {/* 3. TAHAN (Ketahanan) */}
                    <div className="p-4 border border-gray-200 rounded-xl shadow-sm bg-white">
                        <div className="flex items-center gap-2 mb-2"><Shield className="w-4 h-4 text-purple-500"/><span className="text-[11px] font-bold uppercase text-gray-500">TAHAN (Ketahanan)</span></div>
                        <div className="text-2xl font-bold text-gray-900">{sub.scores.hanker ?? '-'}</div>
                        {sub.scores.gradeEndurance && <div className={`text-xs mt-1 px-2 py-0.5 rounded w-fit border ${getBadgeClass(sub.scores.gradeEndurance)}`}>{sub.scores.gradeEndurance}</div>}
                    </div>
                </div>
            </div>
        );
    }

    if (testType.includes('papi')) {
        const aspects = Object.entries(sub.scores).sort((a: any, b: any) => Number(b[1]) - Number(a[1]));
        
        return (
            <div className="space-y-4">
                <div className="bg-orange-50 border border-orange-100 p-5 rounded-xl mb-4">
                    <h4 className="font-bold text-orange-900 text-lg flex items-center gap-2"><CheckCircle className="w-5 h-5"/> PAPI Kostick Profile</h4>
                </div>
                <div className="grid grid-cols-1 gap-4 max-h-[600px] overflow-y-auto pr-2">
                    {aspects.map(([originalKey, value]: any, idx) => {
                        const score = Number(value);
                        const letter = extractPapiLetter(originalKey);
                        if (!letter) return null;

                        return (
                        <div key={idx} className="flex flex-col gap-3 p-4 border border-gray-200 rounded-xl hover:shadow-md bg-white transition-all">
                            <div className="flex items-start gap-3">
                                <div className="w-12 h-12 shrink-0 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center font-black text-xl border border-orange-200">{letter}</div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-gray-900 text-sm">{getPapiTraitName(originalKey)}</span>
                                        <span className="font-bold text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-md">Skor: {score}</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                                        <div className={`h-full rounded-full ${score >= 6 ? 'bg-green-500' : (score <= 3 ? 'bg-red-400' : 'bg-yellow-400')}`} style={{ width: `${(score / 9) * 100}%` }}/>
                                    </div>
                                    <div className="text-xs text-gray-600 italic bg-gray-50 p-2 rounded-lg border border-gray-100">
                                        Interpretasi: "{getPapiInterpretation(originalKey, score)}"
                                    </div>
                                </div>
                            </div>
                        </div>
                    )})}
                </div>
            </div>
        );
    }
    return <pre className="text-xs text-gray-500 bg-gray-50 p-4 rounded-xl overflow-auto">{JSON.stringify(sub.scores, null, 2)}</pre>;
  };

  if (!isMounted) return null;
  if (!user) return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <RefreshCw className="w-8 h-8 animate-spin text-[#0a8b74]" />
      </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      <Sidebar />
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0">
        
        {/* HEADER */}
        <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-200">
           <Header title="Manajemen Test" subtitle="Kelola soal, link tes, dan lihat hasil submission" onRefresh={fetchData} />
           
           {/* Tab Navigation */}
           <div className="px-4 md:px-8 pb-4 pt-2 flex overflow-x-auto scrollbar-hide">
             <div className="flex p-1 bg-gray-100 rounded-xl whitespace-nowrap">
               {[
                 { id: "categories", label: "Soal & Kategori" },
                 { id: "test-links", label: "Link Tes Aktif" },
                 { id: "submissions", label: "Hasil Submission" },
                 { id: "evaluation", label: "Form Penilaian" }
               ].map((tab) => (
                 <button
                   key={tab.id}
                   onClick={() => setActiveTab(tab.id as TabType)}
                   className={`py-2 px-5 text-sm font-bold rounded-lg transition-all ${
                     activeTab === tab.id
                       ? "bg-white text-[#0a8b74] shadow-sm"
                       : "text-gray-500 hover:text-gray-700"
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
              
              {/* SIDEBAR KATEGORI (KIRI) */}
              <aside className="w-full lg:w-80 lg:sticky lg:top-36 flex-shrink-0">
               <div className="bg-white rounded-[20px] border border-gray-200 shadow-sm overflow-hidden p-2">
                 <div className="p-3 text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Kategori Tes</div>
                 <div className="space-y-1">
                   {localCategories.map((cat) => {
                     const isActive = selectedCategory?.id === cat.id;
                     return (
                       <button
                         key={cat.id}
                         onClick={() => { setSelectedCategory(cat); setSelectedCfitSubtype(null); }}
                         className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${
                           isActive
                             ? "bg-[#eefcf6] text-[#0a8b74] border border-[#bbf0df]"
                             : "text-gray-600 hover:bg-gray-50 border border-transparent"
                         }`}
                       >
                         <div className="flex items-center gap-3">
                           <FolderOpen className={`w-5 h-5 ${isActive ? "text-[#0a8b74]" : "text-gray-400"}`} />
                           <span className="text-sm font-bold text-left leading-tight pr-2">{cat.name}</span>
                         </div>
                         <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold border ${isActive ? "bg-white text-[#0a8b74] border-[#0a8b74]/30" : "bg-white border-gray-200 text-gray-500"}`}>{cat.question_count}</span>
                       </button>
                     )
                   })}
                 </div>
               </div>
              </aside>

              {/* PENGATURAN KONTEN (KANAN) */}
              <section className="flex-1 w-full min-w-0">
                {!selectedCategory ? (
                  <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-20 text-center">
                    <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-gray-500 font-bold text-sm">Pilih kategori tes di sebelah kiri untuk mengelola soal</h3>
                  </div>
                ) : isCfitCategory ? (
                  <div className="space-y-6 max-w-4xl">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                      <span className="hover:text-[#0a8b74] cursor-pointer font-medium transition-colors" onClick={() => setSelectedCfitSubtype(null)}>CFIT</span>
                      {selectedCfitSubtype && (
                        <>
                          <span className="text-gray-300">/</span>
                          <span className="font-bold text-gray-900">{selectedCfitSubtype.name}</span>
                        </>
                      )}
                    </div>
                    {!selectedCfitSubtype ? (
                      <div className="space-y-6">
                        <div className="bg-white rounded-[20px] border border-gray-200 shadow-sm p-8">
                          <div className="border-b border-gray-100 pb-4 mb-6">
                            <h3 className="font-bold text-[#0f4b42] text-xl">Pengaturan Durasi Tes CFIT</h3>
                            <p className="text-gray-500 text-sm mt-1">Atur batas waktu secara spesifik untuk masing-masing subtes.</p>
                          </div>
                          
                          <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-2 flex items-center gap-1"><Clock className="w-3.5 h-3.5"/> WAKTU SUBTES 1 (DETIK)</label>
                                <input type="number" value={cfitDurations.sub1} onChange={e => setCfitDurations({...cfitDurations, sub1: e.target.value})} className="w-full border border-gray-300 p-3 rounded-lg outline-none font-bold text-gray-900 focus:ring-2 focus:ring-[#0a8b74]/30 focus:border-[#0a8b74]" />
                              </div>
                              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-2 flex items-center gap-1"><Clock className="w-3.5 h-3.5"/> WAKTU SUBTES 2 (DETIK)</label>
                                <input type="number" value={cfitDurations.sub2} onChange={e => setCfitDurations({...cfitDurations, sub2: e.target.value})} className="w-full border border-gray-300 p-3 rounded-lg outline-none font-bold text-gray-900 focus:ring-2 focus:ring-[#0a8b74]/30 focus:border-[#0a8b74]" />
                              </div>
                              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-2 flex items-center gap-1"><Clock className="w-3.5 h-3.5"/> WAKTU SUBTES 3 (DETIK)</label>
                                <input type="number" value={cfitDurations.sub3} onChange={e => setCfitDurations({...cfitDurations, sub3: e.target.value})} className="w-full border border-gray-300 p-3 rounded-lg outline-none font-bold text-gray-900 focus:ring-2 focus:ring-[#0a8b74]/30 focus:border-[#0a8b74]" />
                              </div>
                              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-2 flex items-center gap-1"><Clock className="w-3.5 h-3.5"/> WAKTU SUBTES 4 (DETIK)</label>
                                <input type="number" value={cfitDurations.sub4} onChange={e => setCfitDurations({...cfitDurations, sub4: e.target.value})} className="w-full border border-gray-300 p-3 rounded-lg outline-none font-bold text-gray-900 focus:ring-2 focus:ring-[#0a8b74]/30 focus:border-[#0a8b74]" />
                              </div>
                            </div>
                            <button onClick={handleSaveTestDuration} className="w-full bg-[#0a8b74] hover:bg-[#087360] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99] text-base"><CheckCircle className="w-5 h-5" /> Simpan Durasi CFIT</button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {cfitSubtypes.map((st) => (
                          <div key={st.id} onClick={() => { setSelectedCfitSubtype(st); setCorrectAnswer(st.id === 2 ? [] : ""); }} className="bg-white p-6 rounded-xl border border-gray-200 hover:border-[#0a8b74] hover:shadow-md cursor-pointer group transition-all">
                             <div className="flex justify-between items-start mb-4">
                               <div className="w-12 h-12 rounded-xl bg-[#eefcf6] text-[#0a8b74] flex items-center justify-center font-black text-xl">{st.id}</div>
                               <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-lg uppercase tracking-wide border border-gray-200">{st.questions.length} SOAL</span>
                             </div>
                             <h4 className="font-bold text-gray-900 text-lg group-hover:text-[#0a8b74] transition-colors">{st.name}</h4>
                             <p className="text-xs text-gray-500 mt-1 line-clamp-2">{st.description}</p>
                          </div>
                        ))}
                      </div>
                      </div>
                    ) : (
                      <div className="bg-white rounded-[20px] border border-gray-200 shadow-sm">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white rounded-t-[20px]">
                          <div><h3 className="font-bold text-[#0f4b42] text-xl">{selectedCfitSubtype.name}</h3></div>
                          <button onClick={() => setShowQuestionModal(true)} className="bg-[#0a8b74] hover:bg-[#087360] text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center transition-colors shadow-sm"><Plus className="w-4 h-4 mr-2" /> Tambah Soal</button>
                        </div>
                        <div className="p-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                          {selectedCfitSubtype.questions.map((q, idx) => (
                            <div key={q.id} className="relative group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-all">
                              <div className="aspect-square bg-gray-50 flex items-center justify-center p-2 relative">
                                {q.imageUrl ? <img src={q.imageUrl} className="max-w-full max-h-full object-contain" /> : <ImageIcon className="w-8 h-8 text-gray-300" />}
                                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 font-bold rounded">#{idx + 1}</div>
                                <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] px-2 py-0.5 font-bold rounded shadow-sm">{q.correctAnswer}</div>
                              </div>
                              <button onClick={() => handleDeleteQuestion('cfit', q.id)} className="absolute inset-0 bg-red-500/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all backdrop-blur-[1px]"><div className="bg-red-500 text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform"><Trash2 className="w-4 h-4" /></div></button>
                            </div>
                          ))}
                          {selectedCfitSubtype.questions.length === 0 && <div className="col-span-full py-10 text-center text-gray-500 italic bg-gray-50 rounded-xl border border-dashed border-gray-200">Belum ada soal untuk kategori ini.</div>}
                        </div>
                      </div>
                    )}
                  </div>

                /* ===== UI EXACT MATCH KRAEPELIN ===== */
                ) : isKraepelinCategory ? (
                  <div className="space-y-6 max-w-4xl">
                    <div className="bg-white rounded-[20px] border border-gray-200 shadow-sm p-8">
                      <h3 className="font-bold text-[#0f4b42] text-xl mb-8">Pengaturan Tes Kraepelin</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 items-end">
                         <div>
                            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-2">JUMLAH KOLOM</label>
                            <input type="number" value={kraepelinColumns} onChange={e => setKraepelinColumns(e.target.value)} className="w-full border border-gray-300 p-4 rounded-xl outline-none focus:ring-2 focus:ring-[#0a8b74]/30 focus:border-[#0a8b74] transition-all text-base" />
                         </div>
                         <div>
                            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-2">JUMLAH BARIS</label>
                            <input type="number" value={kraepelinRows} onChange={e => setKraepelinRows(e.target.value)} className="w-full border border-gray-300 p-4 rounded-xl outline-none focus:ring-2 focus:ring-[#0a8b74]/30 focus:border-[#0a8b74] transition-all text-base" />
                         </div>
                         <div className="bg-[#eefcf6] p-4 rounded-xl border border-[#bbf0df] flex flex-col justify-center">
                            <label className="text-[11px] font-bold text-[#0a8b74] uppercase mb-2 flex items-center gap-1">
                              <Clock className="w-4 h-4"/> DURASI PINDAH (DETIK)
                            </label>
                            <input type="number" value={kraepelinTimePerColumn} onChange={e => setKraepelinTimePerColumn(e.target.value)} className="w-full bg-white border border-[#0a8b74]/30 p-3 rounded-lg outline-none font-bold text-[#0a8b74] focus:ring-2 focus:ring-[#0a8b74]/50 text-base" />
                         </div>
                      </div>
                      <button onClick={handleSaveKraepelin} className="w-full bg-[#0a8b74] hover:bg-[#087360] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] text-base">
                        <CheckCircle className="w-5 h-5" /> Simpan Konfigurasi
                      </button>
                    </div>

                    {/* PREVIEW KRAEPELIN GRID */}
                    <div className="bg-white rounded-[20px] border border-gray-200 shadow-sm p-8">
                      <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-4">
                        <Eye className="w-5 h-5 text-[#0a8b74]" />
                        <h3 className="font-bold text-[#0f4b42] text-lg">Preview Grid Kraepelin (Simulasi)</h3>
                      </div>
                      <div className="overflow-auto max-h-[400px] border border-gray-200 rounded-xl bg-gray-50 p-6 shadow-inner relative">
                         {/* Bayangan fading di kanan & bawah menandakan bisa di-scroll */}
                         <div className="flex gap-4 w-max">
                            {Array.from({ length: Math.min(parseInt(kraepelinColumns) || 50, 50) }).map((_, colIdx) => (
                               <div key={colIdx} className="flex flex-col gap-2 items-center">
                                  <div className="text-[10px] font-bold text-[#0a8b74] bg-[#eefcf6] px-2 py-0.5 rounded border border-[#bbf0df] mb-2">K-{colIdx + 1}</div>
                                  {generateRandomKraepelinColumn(Math.min(parseInt(kraepelinRows) || 27, 40)).map((num, rowIdx) => (
                                     <div key={rowIdx} className="text-lg font-black text-gray-800 w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm border border-gray-100">
                                        {num}
                                     </div>
                                  ))}
                               </div>
                            ))}
                         </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> *Preview dibatasi maksimal 50 kolom dan 40 baris untuk menjaga performa browser.
                      </p>
                    </div>
                  </div>
                ) : (
                  
                  <div className="space-y-6 max-w-4xl">
                    <div className="bg-white rounded-[20px] border border-gray-200 shadow-sm p-8">
                      <div className="border-b border-gray-100 pb-4 mb-6"><h3 className="font-bold text-[#0f4b42] text-xl">Pengaturan Durasi Tes</h3></div>
                      {selectedCategory.code === 'papi' ? (
                        <div className="space-y-4">
                          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <label className="block text-[11px] font-bold text-gray-600 uppercase mb-2 flex items-center gap-1"><Clock className="w-3.5 h-3.5"/> DURASI TES PAPI (DETIK)</label>
                            <input type="number" value={papiDuration} onChange={e => setPapiDuration(e.target.value)} className="w-full border border-gray-300 p-3 rounded-xl outline-none font-bold text-gray-900 focus:ring-2 focus:ring-[#0a8b74]/30 focus:border-[#0a8b74]" />
                          </div>
                          <button onClick={handleSaveTestDuration} className="w-full bg-[#0a8b74] hover:bg-[#087360] text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99] text-base"><CheckCircle className="w-5 h-5" /> Simpan Durasi</button>
                        </div>
                      ) : null}
                    </div>

                    <div className="bg-white rounded-[20px] border border-gray-200 shadow-sm overflow-hidden">
                      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
                        <h3 className="font-bold text-[#0f4b42] text-xl">{selectedCategory.name}</h3>
                        <button onClick={() => setShowQuestionModal(true)} className="bg-[#0a8b74] hover:bg-[#087360] text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center transition-colors shadow-sm"><Plus className="w-4 h-4 mr-2" /> Tambah Soal</button>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {localQuestions[selectedCategory.id]?.map((q, idx) => (
                          <div key={q.id} className="p-6 hover:bg-gray-50 group flex justify-between transition-colors">
                             <div className="space-y-3 flex-1">
                               <span className="text-[10px] font-bold text-[#0a8b74] bg-[#eefcf6] px-2 py-1 rounded border border-[#bbf0df]">Item #{idx + 1}</span>
                               <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                                 <div className="border border-gray-200 p-4 rounded-xl bg-white shadow-sm"><span className="font-bold text-gray-500 mr-2">A:</span> {q.option_a}</div>
                                 <div className="border border-gray-200 p-4 rounded-xl bg-white shadow-sm"><span className="font-bold text-gray-500 mr-2">B:</span> {q.option_b}</div>
                               </div>
                             </div>
                             <button onClick={() => handleDeleteQuestion('papi', q.id)} className="text-gray-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all p-3 rounded-xl hover:bg-red-50"><Trash2 className="w-5 h-5" /></button>
                          </div>
                        )) || <div className="p-10 text-center text-gray-500 italic">Belum ada soal.</div>}
                      </div>
                    </div>
                  </div>
                )}
              </section>
            </div>
          )}

          {/* === TAB 2: TEST LINKS === */}
          {activeTab === "test-links" && (
            <div className="bg-white rounded-[20px] border border-gray-200 shadow-sm overflow-hidden max-w-5xl">
              <div className="p-4 md:p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-gray-900">Active Links</h3>
                  <div className="text-xs font-bold bg-white border border-gray-200 px-3 py-1 rounded-full text-gray-600">{localTestLinks.length} Links Total</div>
                </div>
                <button onClick={() => setShowCreateLinkModal(true)} className="w-full md:w-auto bg-[#0a8b74] hover:bg-[#087360] text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center transition-colors shadow-sm"><Plus className="w-4 h-4 mr-2" /> Buat Link Baru</button>
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] tracking-wide border-b border-gray-100">
                    <tr><th className="p-4 px-6">Peserta</th><th className="p-4">Token</th><th className="p-4">Status</th><th className="p-4 px-6 text-right">Aksi</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {localTestLinks.map(link => (
                      <tr key={link.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 px-6 font-bold text-gray-900">{link.candidateName}</td>
                        <td className="p-4"><span className="font-mono text-gray-600 text-xs bg-gray-100 border border-gray-200 px-2 py-1 rounded ">{link.token}</span></td>
                        <td className="p-4"><span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${link.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>{link.status}</span></td>
                        <td className="p-4 px-6 text-right">
                          <div className="flex justify-end gap-2">
                             <button onClick={() => copyLink(link.token)} className="text-gray-400 hover:text-[#0a8b74] p-2 hover:bg-[#0a8b74]/10 rounded-lg transition-colors"><Copy className="w-4 h-4"/></button>
                             <button className="text-gray-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors"><X className="w-4 h-4"/></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* === TAB 3: HASIL SUBMISSION === */}
          {activeTab === "submissions" && renderSubmissionTable()}

          {/* === TAB 4: FORM EVALUATION === */}
          {activeTab === "evaluation" && (
            <div className="space-y-6 max-w-4xl">
              <div className="bg-white p-8 rounded-[20px] shadow-sm border border-gray-200">
                <h3 className="font-bold text-[#0f4b42] text-xl mb-6 flex items-center gap-2">
                  <User className="w-6 h-6 text-[#0a8b74]" />
                  Pilih Target Penilaian Wawancara / Evaluasi
                </h3>

                <div className="flex gap-2 mb-6 p-1 bg-gray-50 rounded-xl w-full max-w-md border border-gray-100">
                  <button 
                    onClick={() => { setEvalTargetType("candidate"); setEvalTargetId(""); }} 
                    className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${evalTargetType === "candidate" ? "bg-white text-[#0a8b74] shadow-sm border border-gray-200" : "text-gray-500 hover:bg-white/50"}`}
                  >
                    Kandidat Baru
                  </button>
                  <button 
                    onClick={() => { setEvalTargetType("karyawan"); setEvalTargetId(""); }} 
                    className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${evalTargetType === "karyawan" ? "bg-white text-[#0a8b74] shadow-sm border border-gray-200" : "text-gray-500 hover:bg-white/50"}`}
                  >
                    Karyawan Internal
                  </button>
                </div>

                <select
                  value={evalTargetId}
                  onChange={(e) => setEvalTargetId(e.target.value)}
                  className="w-full p-4 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-[#0a8b74]/30 focus:border-[#0a8b74] text-base bg-gray-50 font-medium"
                >
                  <option value="">-- Silakan Pilih {evalTargetType === "candidate" ? "Kandidat" : "Karyawan"} --</option>
                  {evalTargetType === "candidate" 
                    ? candidatesList.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)
                    : karyawanList.map(k => <option key={k.id} value={k.id}>{k.fullName}</option>)
                  }
                </select>
              </div>

              {evalTargetId ? (
                <div className="animate-in slide-in-from-bottom-4 duration-500">
                  {(() => {
                    if (evalTargetType === "candidate") {
                      const selectedCand = candidatesList.find(c => c.id === evalTargetId);
                      return (
                        <CandidateEvaluation 
                          candidateId={evalTargetId}
                          candidateName={selectedCand?.fullName || "Unknown"}
                          jobPosition={selectedCand?.top_position || "Belum Ditentukan"}
                          currentUserRole={user?.role || "HR"} 
                        />
                      );
                    } else {
                      const selectedEmp = karyawanList.find(k => k.id === evalTargetId);
                      return (
                        <CandidateEvaluation 
                          employeeId={evalTargetId}  
                          candidateName={selectedEmp?.fullName || "Unknown"}
                          jobPosition="Karyawan Internal" 
                          currentUserRole={user?.role || "HR"} 
                        />
                      );
                    }
                  })()}
                </div>
              ) : (
                <div className="p-16 text-center bg-white rounded-[20px] border border-dashed border-gray-300 text-gray-500 flex flex-col items-center justify-center">
                  <FileCheck className="w-16 h-16 mb-4 text-gray-200" />
                  <p className="font-bold text-xl text-gray-900">Belum Ada Target Dipilih</p>
                  <p className="text-sm mt-2 max-w-md">Pilih {evalTargetType === "candidate" ? "kandidat" : "karyawan"} dari menu dropdown di atas untuk memunculkan Form Assesment STAR Method dan Value Behavior.</p>
                </div>
              )}
            </div>
          )}

        </main>
        <Footer />
      </div>

      {/* --- CREATE LINK MODAL --- */}
      {showCreateLinkModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
                <h3 className="text-xl font-bold text-[#0f4b42]">Buat Link Tes Baru</h3>
                <button onClick={() => setShowCreateLinkModal(false)}><X className="text-gray-400 hover:text-red-500 transition-colors" /></button>
              </div>
              <div className="p-6 space-y-5">
                <div className="flex gap-2 p-1 bg-gray-50 rounded-xl w-full border border-gray-100">
                  <button onClick={() => setParticipantType("candidate")} className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${participantType === "candidate" ? "bg-white text-[#0a8b74] shadow-sm border border-gray-200" : "text-gray-500 hover:bg-white/50"}`}>Kandidat Baru</button>
                  <button onClick={() => setParticipantType("karyawan")} className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${participantType === "karyawan" ? "bg-white text-[#0a8b74] shadow-sm border border-gray-200" : "text-gray-500 hover:bg-white/50"}`}>Karyawan Internal</button>
                </div>
                <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Pilih {participantType === "candidate" ? "Kandidat" : "Karyawan"}</label>
                   <select value={selectedCandidateId} onChange={(e) => participantType === "candidate" ? setSelectedCandidateId(e.target.value) : setSelectedKaryawanId(e.target.value)} className="w-full p-3.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-[#0a8b74]/30 focus:border-[#0a8b74] text-sm bg-white font-medium">
                     <option value="">-- Pilih {participantType === "candidate" ? "Kandidat" : "Karyawan"} --</option>
                     {participantType === "candidate" 
                        ? candidatesList.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)
                        : karyawanList.map(k => <option key={k.id} value={k.id}>{k.fullName}</option>)
                     }
                   </select>
                </div>
                <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Posisi (Opsional)</label>
                   <select value={selectedJobId} onChange={(e) => setSelectedJobId(e.target.value)} className="w-full p-3.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-[#0a8b74]/30 focus:border-[#0a8b74] text-sm bg-white font-medium">
                     <option value="">-- Tidak Spesifik --</option>
                     {jobsList.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                   </select>
                </div>
              </div>
              <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                 <button onClick={() => setShowCreateLinkModal(false)} className="px-5 py-3 text-gray-600 font-bold text-sm hover:bg-gray-200 rounded-xl transition-colors">Batal</button>
                 <button onClick={handleGenerateLink} disabled={isGeneratingLink} className="px-6 py-3 bg-[#0a8b74] hover:bg-[#087360] text-white font-bold text-sm rounded-xl transition-colors flex items-center shadow-lg shadow-[#0a8b74]/20 disabled:opacity-50">
                   {isGeneratingLink ? <RefreshCw className="animate-spin w-4 h-4 mr-2"/> : <Zap className="w-4 h-4 mr-2"/>} Generate Link
                 </button>
              </div>
            </div>
        </div>
      )}

      {/* --- ADD QUESTION MODAL --- */}
      {showQuestionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
              <h3 className="text-lg font-bold text-[#0f4b42]">Tambah Soal {isCfitCategory ? 'CFIT' : 'PAPI'}</h3>
              <button onClick={() => setShowQuestionModal(false)}><X className="text-gray-400 hover:text-red-500 transition-colors" /></button>
            </div>
            <div className="p-6 space-y-4">
              {isCfitCategory ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Gambar Soal</label>
                    <input type="file" onChange={handleImageUpload} className="w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[#eefcf6] file:text-[#0a8b74] hover:file:bg-[#bbf0df]" />
                    {imagePreview && <img src={imagePreview} alt="Preview" className="mt-4 max-h-48 object-contain mx-auto rounded-lg border border-gray-200" />}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">
                      Kunci Jawaban {selectedCfitSubtype?.id === 2 && <span className="text-red-500 normal-case ml-1">(Pilih 2)</span>}
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {getOptionLabels(selectedCfitSubtype?.optionCount || 6).map(lbl => {
                        const isSubtest2 = selectedCfitSubtype?.id === 2;
                        const isSelected = isSubtest2 ? Array.isArray(correctAnswer) && correctAnswer.includes(lbl) : correctAnswer === lbl;
                        return (
                          <button key={lbl} onClick={() => {
                              if (isSubtest2) {
                                setCorrectAnswer((prev: any) => {
                                  const arr = Array.isArray(prev) ? [...prev] : [];
                                  if (arr.includes(lbl)) return arr.filter((a: string) => a !== lbl);
                                  if (arr.length < 2) return [...arr, lbl].sort();
                                  toast.warning("Maksimal 2 kunci jawaban."); return arr;
                                });
                              } else setCorrectAnswer(lbl);
                            }} className={`w-10 h-10 rounded-lg font-bold border transition-all ${isSelected ? 'bg-[#0a8b74] text-white border-[#0a8b74] shadow-md' : 'text-gray-400 border-gray-200 hover:bg-gray-50'}`}
                          >{lbl}</button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                   <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Opsi A (Pernyataan 1)</label><textarea value={optionA} onChange={e => setOptionA(e.target.value)} className="w-full border border-gray-300 p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#0a8b74]/30 focus:border-[#0a8b74]" rows={2} /></div>
                   <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Opsi B (Pernyataan 2)</label><textarea value={optionB} onChange={e => setOptionB(e.target.value)} className="w-full border border-gray-300 p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#0a8b74]/30 focus:border-[#0a8b74]" rows={2} /></div>
                </div>
              )}
              <div className="flex gap-2 pt-4">
                 <button onClick={() => setShowQuestionModal(false)} className="flex-1 py-3.5 text-gray-600 font-bold hover:bg-gray-50 rounded-xl border border-gray-200 transition-colors">Batal</button>
                 <button onClick={isCfitCategory ? handleAddCfitQuestion : handleAddPapiQuestion} disabled={isSubmitting} className="flex-[2] bg-[#0a8b74] text-white py-3.5 rounded-xl font-bold hover:bg-[#087360] shadow-sm text-sm transition-colors">{isSubmitting ? 'Menyimpan...' : 'Simpan Soal'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- DETAIL MODAL --- */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[95vh] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
              <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
                 <div>
                    <h3 className="text-lg font-bold text-gray-900">Detail Hasil Tes</h3>
                    <p className="text-xs text-gray-500">Peserta: {showDetailModal.candidate_name || showDetailModal.employee_name || "Unknown"}</p>
                 </div>
                 <button onClick={() => setShowDetailModal(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="text-gray-400" /></button>
              </div>
              <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
                 {renderDetailContent(showDetailModal)}
              </div>
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                 <button onClick={() => setShowDetailModal(null)} className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-100 transition-colors">Tutup</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}