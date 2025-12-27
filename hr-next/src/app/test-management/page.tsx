"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import {
  CheckCircle,
  Plus,
  RefreshCw,
  Trash2,
  X,
  FolderOpen,
  HelpCircle,
  Upload,
  Image,
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
// Menggunakan Environment Variable agar mudah diganti saat production
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

// --- 1. INTERFACES ---

export interface Candidate {
  id: string;
  name: string;
  email: string;
  top_position: string;
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
  { id: 1, name: "Series Completion", code: "cfit_series", description: "Melengkapi pola urutan", instruction: "Tentukan pola yang melengkapi urutan gambar berikut.", optionCount: 6, questions: [] },
  { id: 2, name: "Classification", code: "cfit_classification", description: "Klasifikasi objek", instruction: "Temukan gambar yang tidak termasuk dalam kelompok.", optionCount: 5, questions: [] },
  { id: 3, name: "Matrices", code: "cfit_matrices", description: "Melengkapi matriks", instruction: "Lengkapi matriks dengan memilih gambar yang tepat.", optionCount: 6, questions: [] },
  { id: 4, name: "Conditions", code: "cfit_conditions", description: "Kondisi dan aturan", instruction: "Berdasarkan kondisi yang diberikan, tentukan jawaban yang tepat.", optionCount: 5, questions: [] },
];

type TabType = "test-links" | "categories" | "submissions";

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
  
  // Candidates & Jobs List for Dropdown
  const [candidatesList, setCandidatesList] = useState<Candidate[]>([]);
  const [jobsList, setJobsList] = useState<JobPosition[]>([]);
  
  // Form State
  const [selectedCandidateId, setSelectedCandidateId] = useState("");
  const [selectedJobId, setSelectedJobId] = useState(""); 

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  
  // CFIT State
  const [cfitSubtypes, setCfitSubtypes] = useState<CfitSubtype[]>(INITIAL_CFIT_SUBTYPES);
  const [selectedCfitSubtype, setSelectedCfitSubtype] = useState<CfitSubtype | null>(null);
  
  // Modals
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showCreateLinkModal, setShowCreateLinkModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState<Submission | null>(null);
  const [showCreateSubtypeModal, setShowCreateSubtypeModal] = useState(false);
  const [showEditSubtypeModal, setShowEditSubtypeModal] = useState(false);

  // Form Inputs
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");

  const [kraepelinColumns, setKraepelinColumns] = useState("50");
  const [kraepelinRows, setKraepelinRows] = useState("27");
  const [kraepelinTimePerColumn, setKraepelinTimePerColumn] = useState("15");

  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- USE EFFECTS ---

  useEffect(() => {
    const userData = localStorage.getItem("hr_user");
    if (!userData) {
      router.push("/");
      return;
    }
    setUser(JSON.parse(userData));
    fetchData(); 
  }, [router]);

  // --- API FETCH FUNCTIONS ---

  const fetchData = async () => {
    try {
      const resLinks = await fetch(`${API_BASE_URL}/management/links`);
      if (resLinks.ok) setLocalTestLinks(await resLinks.json());

      const resSubs = await fetch(`${API_BASE_URL}/management/submissions`); 
      if (resSubs.ok) setSubmissions(await resSubs.json());

      const resCandidates = await fetch(`${API_BASE_URL}/candidates`);
      if (resCandidates.ok) setCandidatesList(await resCandidates.json());

      const resJobs = await fetch(`${API_BASE_URL}/job-positions?status=active`);
      if (resJobs.ok) setJobsList(await resJobs.json());

      const resKraepelin = await fetch(`${API_BASE_URL}/management/config/kraepelin`);
      if (resKraepelin.ok) {
        const data = await resKraepelin.json();
        setKraepelinColumns(String(data.columns || 50));
        setKraepelinRows(String(data.rows || 27));
        setKraepelinTimePerColumn(String(data.durationPerColumn || 15));
      }

      const resCfit = await fetch(`${API_BASE_URL}/management/questions/cfit`);
      if (resCfit.ok) {
        const allCfitQuestionsFromBE = await resCfit.json();
        setCfitSubtypes((prev) => prev.map((st) => ({
            ...st,
            questions: allCfitQuestionsFromBE
              .filter((q: any) => q.subtest === st.id)
              .map((q: any) => ({
                id: q.id,
                // Fix: Pastikan URL gambar lengkap dengan API_BASE_URL
                imageUrl: q.question_image ? `${API_BASE_URL}${q.question_image}` : null,
                correctAnswer: String.fromCharCode(65 + q.correctAnswer),
              })),
          }))
        );
        setLocalCategories(prev => prev.map(c => c.code === 'cfit' ? { ...c, question_count: allCfitQuestionsFromBE.length } : c));
      }

      const resPapi = await fetch(`${API_BASE_URL}/management/questions/papi`);
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
    }
  };

  // --- HANDLERS ---

  const handleGenerateLink = async () => { 
    if (!selectedCandidateId) { alert("Pilih kandidat dari daftar!"); return; }
    
    setIsGeneratingLink(true);
    try {
      const response = await fetch(`${API_BASE_URL}/management/generate-link`, {
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ 
            candidate_id: selectedCandidateId,
            job_id: selectedJobId || null 
        }), 
      });
      
      const data = await response.json();

      if (response.ok) {
        const selectedCand = candidatesList.find(c => c.id === selectedCandidateId);
        const candName = selectedCand ? selectedCand.name : "Unknown";

        setLocalTestLinks([{ 
            id: Date.now(), 
            candidateName: candName, 
            token: data.token, 
            status: "active", 
            createdAt: new Date().toISOString() 
        }, ...localTestLinks]);
        
        alert(`Link dibuat!\nToken: ${data.token}`);
        setShowCreateLinkModal(false);
        setSelectedCandidateId(""); 
        setSelectedJobId("");
      } else {
        alert(`Gagal: ${data.error || "Terjadi kesalahan"}`);
      }
    } catch(e) { 
        alert("Gagal menghubungi server."); 
    } finally { 
        setIsGeneratingLink(false); 
    }
  };

  const handleSaveKraepelin = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/management/config/kraepelin`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ columns: parseInt(kraepelinColumns), rows: parseInt(kraepelinRows), durationPerColumn: parseInt(kraepelinTimePerColumn) }),
      });
      if (response.ok) alert("Tersimpan!");
    } catch (err) { console.error(err); }
  };

  const handleAddPapiQuestion = async () => {
    if (!optionA || !optionB) { alert("Isi opsi!"); return; }
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/management/questions/papi`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ option_a: optionA, option_b: optionB }),
      });
      if (res.ok) { alert("Disimpan!"); setShowQuestionModal(false); setOptionA(""); setOptionB(""); fetchData(); }
    } catch (err) { console.error(err); } finally { setIsSubmitting(false); }
  };

  const handleAddCfitQuestion = async () => {
      if (!imagePreview || !correctAnswer) return;
      setIsSubmitting(true);
      const formData = new FormData();
      if (fileInputRef.current?.files?.[0]) formData.append("image", fileInputRef.current.files[0]);
      formData.append("subtest", String(selectedCfitSubtype?.id));
      formData.append("correctAnswer", String(labelToIndex(correctAnswer)));
      formData.append("instruction", selectedCfitSubtype?.instruction || "");
      try {
        const res = await fetch(`${API_BASE_URL}/management/questions/cfit`, { method: "POST", body: formData });
        if (res.ok) { alert("Ditambahkan!"); setShowQuestionModal(false); setImagePreview(null); setCorrectAnswer(""); fetchData(); }
      } catch (err) { alert("Error."); } finally { setIsSubmitting(false); }
  };

  const handleDeleteQuestion = async (endpoint: 'cfit' | 'papi', id: number) => {
    if (!confirm("Hapus?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/management/questions/${endpoint}/${id}`, { method: "DELETE" });
      if (res.ok) fetchData();
    } catch (err) { console.error(err); }
  };

  const handleCreateSubtype = () => { setShowCreateSubtypeModal(false); };
  const handleUpdateSubtype = () => { setShowEditSubtypeModal(false); };

  // --- UTILS ---
  const copyLink = async (token: string) => {
    try {
      const url = `${window.location.origin}/test/${token}`;
      await navigator.clipboard.writeText(url);
    } catch (err) {
      console.error("Gagal menyalin");
    }
  };

  const getOptionLabels = (count: number) => Array.from({ length: count }, (_, i) => String.fromCharCode(65 + i));
  const labelToIndex = (label: string) => label.charCodeAt(0) - 65;
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
      case 'cfit': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'kraepelin': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'papi': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const renderSubmissionTable = () => (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-200 bg-gray-50/50">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-gray-500" />
          Riwayat Hasil Tes
        </h3>
      </div>
      <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-gray-500 font-semibold uppercase text-[11px] tracking-wider border-b">
          <tr>
            <th className="px-6 py-4">Kandidat</th>
            <th className="px-6 py-4">Jenis Tes</th>
            <th className="px-6 py-4">Hasil Ringkas</th>
            <th className="px-6 py-4">Waktu Submit</th>
            <th className="px-6 py-4 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {submissions.length > 0 ? submissions.map((sub) => {
            let scoreBadge = <span className="text-gray-400 italic text-xs">Menunggu...</span>;
            if (sub.scores && Object.keys(sub.scores).length > 0) {
              if (sub.test_type === 'cfit') {
                const iq = sub.scores.iq || 0;
                const color = iq >= 110 ? 'text-green-600 bg-green-50 border-green-200' : (iq >= 90 ? 'text-blue-600 bg-blue-50 border-blue-200' : 'text-red-600 bg-red-50 border-red-200');
                scoreBadge = (
                  <div className={`inline-flex flex-col px-3 py-1 rounded-lg border ${color}`}>
                    <span className="font-bold text-xs">IQ: {iq}</span>
                    <span className="text-[9px] uppercase tracking-wide opacity-80">{sub.scores.classification}</span>
                  </div>
                );
              } else if (sub.test_type === 'kraepelin') {
                scoreBadge = (
                  <div className="flex gap-2">
                    <div className="px-2 py-1 bg-gray-50 border rounded text-xs">
                      <span className="text-gray-400 mr-1">Speed:</span><span className="font-bold text-gray-700">{sub.scores.panker}</span>
                    </div>
                    <div className="px-2 py-1 bg-gray-50 border rounded text-xs">
                      <span className="text-gray-400 mr-1">Acc:</span><span className="font-bold text-gray-700">{sub.scores.janker}</span>
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
              <tr key={sub.id} className="hover:bg-gray-50/80 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 font-bold text-xs">
                      {sub.candidate_name ? sub.candidate_name.charAt(0).toUpperCase() : "?"}
                    </div>
                    <span className="font-medium text-gray-900">{sub.candidate_name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${getTestBadgeColor(sub.test_type)}`}>
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
                    className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-end gap-1.5 ml-auto"
                  >
                    <Eye className="w-3.5 h-3.5"/> Detail
                  </button>
                </td>
              </tr>
            );
          }) : (
            <tr>
              <td colSpan={5} className="px-6 py-12 text-center text-gray-400 bg-gray-50/30">
                <div className="flex flex-col items-center justify-center">
                  <FileCheck className="w-10 h-10 mb-3 text-gray-200" />
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
        return <div className="p-8 text-center text-gray-400 italic">Data hasil belum diproses atau kosong.</div>;
    }

    if (sub.test_type === 'cfit') {
        const iq = sub.scores.iq || 0;
        const color = iq >= 110 ? 'text-green-600' : (iq >= 90 ? 'text-blue-600' : 'text-red-600');
        return (
            <div className="space-y-6">
                <div className="flex flex-col items-center justify-center p-8 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="text-sm text-blue-600 font-bold uppercase tracking-widest mb-1">IQ Score</div>
                    <div className={`text-6xl font-black ${color}`}>{iq}</div>
                    <div className="mt-2 px-4 py-1 bg-white rounded-full text-sm font-bold shadow-sm text-gray-700 border">
                        {sub.scores.classification || "Unclassified"}
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border rounded-xl bg-gray-50">
                        <div className="text-xs text-gray-500 uppercase font-bold mb-1">Raw Score</div>
                        <div className="text-2xl font-bold text-gray-900">{sub.scores.raw_score} <span className="text-sm text-gray-400 font-normal">/ 50</span></div>
                    </div>
                    <div className="p-4 border rounded-xl bg-gray-50">
                        <div className="text-xs text-gray-500 uppercase font-bold mb-1">Detail Jawaban</div>
                        <div className="text-sm text-gray-700">Lihat breakdown jawaban di database (JSON).</div>
                    </div>
                </div>
            </div>
        );
    } 
    
    if (sub.test_type === 'kraepelin') {
        return (
            <div className="space-y-6">
                <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 text-center">
                    <h4 className="font-bold text-purple-900 mb-2">Interpretasi Umum</h4>
                    <p className="text-sm text-purple-800 italic">"{sub.scores.interpretation || '-'}"</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border rounded-xl shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <Zap className="w-4 h-4 text-yellow-500"/>
                            <span className="text-xs font-bold uppercase text-gray-500">Kecepatan (Panker)</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{sub.scores.panker}</div>
                        <div className="text-xs mt-1 text-gray-500 bg-gray-100 px-2 py-0.5 rounded w-fit">{sub.scores.gradeSpeed || '-'}</div>
                    </div>
                    <div className="p-4 border rounded-xl shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <Target className="w-4 h-4 text-green-500"/>
                            <span className="text-xs font-bold uppercase text-gray-500">Ketelitian (Janker)</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{sub.scores.janker}</div>
                        <div className="text-xs mt-1 text-gray-500 bg-gray-100 px-2 py-0.5 rounded w-fit">{sub.scores.gradeStability || '-'}</div>
                    </div>
                    <div className="p-4 border rounded-xl shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <Activity className="w-4 h-4 text-red-500"/>
                            <span className="text-xs font-bold uppercase text-gray-500">Total Errors</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{sub.scores.totalErrors}</div>
                        <div className="text-xs mt-1 text-gray-500 bg-gray-100 px-2 py-0.5 rounded w-fit">{sub.scores.gradeAccuracy || '-'}</div>
                    </div>
                </div>
            </div>
        );
    }

    if (sub.test_type === 'papi') {
        const aspects = Object.entries(sub.scores).filter(([key]) => /^[A-Z]$/.test(key)); // Filter A-Z keys
        return (
            <div className="space-y-4">
                <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl mb-4">
                    <h4 className="font-bold text-orange-900 text-sm">PAPI Kostick Profile</h4>
                    <p className="text-xs text-orange-700">Skor mentah per aspek (Range 0-9)</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto pr-2">
                    {aspects.map(([key, value]: any) => (
                        <div key={key} className="flex flex-col gap-1 p-2 border rounded-lg hover:shadow-sm">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-gray-700">{key}</span>
                                <span className="text-xs font-mono text-gray-500">{value}/9</span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full rounded-full ${value > 5 ? 'bg-green-500' : (value < 4 ? 'bg-red-400' : 'bg-yellow-400')}`} 
                                    style={{ width: `${(value / 9) * 100}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return <pre className="text-xs">{JSON.stringify(sub.scores, null, 2)}</pre>;
  };


  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0">
        
        {/* HEADER */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="px-6 h-16 flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Manajemen Test</h1>
              <p className="text-xs text-gray-500">Dashboard & Submissions</p>
            </div>
            <div className="flex gap-3">
              <button onClick={fetchData} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><RefreshCw className="w-5 h-5" /></button>
              <button onClick={() => setShowCreateLinkModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center shadow-sm"><Plus className="w-4 h-4 mr-2" /> Buat Link</button>
            </div>
          </div>
          <div className="px-6 border-t border-gray-100 flex gap-8">
            {[{ id: "categories", label: "Soal & Kategori" }, { id: "test-links", label: "Link Tes Aktif" }, { id: "submissions", label: "Hasil Submission" }].map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as TabType)} className={`py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>{tab.label}</button>
            ))}
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main className="flex-1 p-6 overflow-y-auto">
          
          {/* === TAB 1: CATEGORIES === */}
          {activeTab === "categories" && (
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              <aside className="w-full lg:w-72 sticky top-28">
               <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                 <div className="p-4 bg-gray-50 border-b text-xs font-bold text-gray-400 uppercase tracking-widest">Kategori Tes</div>
                 <div className="divide-y divide-gray-100">
                   {localCategories.map((cat) => (
                     <button key={cat.id} onClick={() => { setSelectedCategory(cat); setSelectedCfitSubtype(null); }} className={`w-full flex items-center justify-between p-4 transition-all ${selectedCategory?.id === cat.id ? "bg-blue-50 text-blue-700 border-l-4 border-blue-600" : "text-gray-600 hover:bg-gray-50"}`}>
                       <div className="flex items-center gap-3"><FolderOpen className={`w-4 h-4 ${selectedCategory?.id === cat.id ? "text-blue-600" : "text-gray-400"}`} /><span className="text-sm font-semibold">{cat.name}</span></div>
                       <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-bold">{cat.question_count}</span>
                     </button>
                   ))}
                 </div>
               </div>
              </aside>

              <section className="flex-1 w-full min-w-0">
                {!selectedCategory ? (
                  <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-20 text-center"><FolderOpen className="w-16 h-16 text-gray-200 mx-auto mb-4" /><h3 className="text-gray-400 font-medium text-sm">Pilih kategori tes untuk mengelola soal</h3></div>
                ) : isCfitCategory ? (
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-4"><span className="hover:underline cursor-pointer" onClick={() => setSelectedCfitSubtype(null)}>CFIT</span>{selectedCfitSubtype && <><span className="text-gray-300">/</span><span className="font-bold text-gray-900">{selectedCfitSubtype.name}</span></>}</div>
                    {!selectedCfitSubtype ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {cfitSubtypes.map((st) => (
                          <div key={st.id} onClick={() => setSelectedCfitSubtype(st)} className="bg-white p-5 rounded-xl border border-gray-200 hover:border-blue-400 cursor-pointer group">
                             <div className="flex justify-between items-start mb-4"><div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold">{st.id}</div><span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded uppercase">{st.questions.length} SOAL</span></div>
                             <h4 className="font-bold text-gray-900">{st.name}</h4><p className="text-xs text-gray-500 mt-1">{st.description}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50/50"><div><h3 className="font-bold text-gray-900">{selectedCfitSubtype.name}</h3></div><button onClick={() => setShowQuestionModal(true)} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center"><Plus className="w-3 h-3 mr-2" /> Tambah Soal</button></div>
                        <div className="p-6 grid grid-cols-2 md:grid-cols-5 gap-4">
                          {selectedCfitSubtype.questions.map((q, idx) => (
                            <div key={q.id} className="relative group bg-white border border-gray-200 rounded-lg overflow-hidden">
                              <div className="aspect-square bg-gray-50 flex items-center justify-center p-2">{q.imageUrl ? <img src={q.imageUrl} className="max-w-full max-h-full object-contain" /> : <Image className="w-8 h-8 text-gray-300" />}</div>
                              <div className="absolute top-2 left-2 bg-gray-900/80 text-white text-[10px] px-2 py-0.5 font-bold rounded">#{idx + 1}</div>
                              <div className="absolute top-2 right-2 bg-green-600 text-white text-[10px] px-2 py-0.5 font-bold rounded">{q.correctAnswer}</div>
                              <button onClick={() => handleDeleteQuestion('cfit', q.id)} className="absolute inset-0 bg-red-600/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><div className="bg-red-600 text-white p-2 rounded-full"><Trash2 className="w-4 h-4" /></div></button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : isKraepelinCategory ? (
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
                    <div className="border-b pb-4 mb-4"><h3 className="font-bold text-gray-900 text-lg">Pengaturan Tes Kraepelin</h3><p className="text-gray-500 text-sm">Konfigurasi parameter grid angka dan durasi perpindahan.</p></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">JUMLAH KOLOM</label><input type="number" value={kraepelinColumns} onChange={e => setKraepelinColumns(e.target.value)} className="w-full border border-gray-300 p-3 rounded-xl outline-none" /></div>
                       <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">JUMLAH BARIS</label><input type="number" value={kraepelinRows} onChange={e => setKraepelinRows(e.target.value)} className="w-full border border-gray-300 p-3 rounded-xl outline-none" /></div>
                       <div className="bg-blue-50 p-3 rounded-xl border border-blue-200"><label className="block text-xs font-bold text-blue-700 uppercase mb-2 flex items-center gap-1"><Clock className="w-3 h-3"/> DURASI PINDAH (DETIK)</label><input type="number" value={kraepelinTimePerColumn} onChange={e => setKraepelinTimePerColumn(e.target.value)} className="w-full border border-blue-300 p-3 rounded-lg outline-none font-bold text-blue-900" /></div>
                    </div>
                    {/* Live Preview Kraepelin Grid */}
                    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mt-6">
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Live Preview Grid Angka</p>
                          <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-1 rounded font-mono font-bold tracking-tighter">EST: ~{Math.ceil((parseInt(kraepelinColumns) || 0) * (parseInt(kraepelinTimePerColumn) || 0) / 60)} MENIT</span>
                        </div>
                        <div className="bg-gray-800/50 p-4 border border-gray-700 overflow-x-auto shadow-inner rounded-lg scrollbar-hide">
                          <div className="flex gap-1.5 justify-start">
                            {Array.from({ length: Math.min(parseInt(kraepelinColumns) || 10, 20) }).map((_, colIdx) => (
                              <div key={colIdx} className="flex flex-col gap-1">
                                {Array.from({ length: Math.min(parseInt(kraepelinRows) || 10, 12) }).map((_, rowIdx) => (
                                  <div key={rowIdx} className="w-6 h-6 bg-gray-900 border border-gray-700 flex items-center justify-center text-xs font-mono font-bold text-blue-400/80 shadow-sm">{Math.floor(Math.random() * 10)}</div>
                                ))}
                                <div className="text-[8px] text-center text-gray-500 font-bold mt-1 uppercase">C{colIdx + 1}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                    </div>
                    <button onClick={handleSaveKraepelin} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-100 transition-all active:scale-95"><CheckCircle className="w-5 h-5" /> Simpan Konfigurasi</button>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                      <div className="p-6 border-b flex justify-between items-center bg-gray-50/50"><h3 className="font-bold text-gray-900">{selectedCategory.name}</h3><button onClick={() => setShowQuestionModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center"><Plus className="w-3 h-3 mr-2" /> Tambah Soal</button></div>
                      <div className="divide-y divide-gray-100">
                        {localQuestions[selectedCategory.id]?.map((q, idx) => (
                          <div key={q.id} className="p-6 hover:bg-gray-50 group flex justify-between">
                             <div className="space-y-2 flex-1">
                               <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Item #{idx + 1}</span>
                               <div className="grid grid-cols-2 gap-4 text-sm"><div className="border p-3 rounded">A: {q.option_a}</div><div className="border p-3 rounded">B: {q.option_b}</div></div>
                             </div>
                             <button onClick={() => handleDeleteQuestion('papi', q.id)} className="text-gray-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-5 h-5" /></button>
                          </div>
                        )) || <div className="p-10 text-center text-gray-400">Belum ada soal.</div>}
                      </div>
                  </div>
                )}
              </section>
            </div>
          )}

          {/* === TAB 2: TEST LINKS === */}
          {activeTab === "test-links" && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center"><h3 className="text-lg font-semibold text-gray-900">Active Links</h3><div className="text-sm text-gray-500">{localTestLinks.length} Links Total</div></div>
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-400 font-bold uppercase text-[10px] tracking-widest border-b"><tr><th className="p-4">Kandidat</th><th className="p-4">Token</th><th className="p-4">Status</th><th className="p-4 text-right">Aksi</th></tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {localTestLinks.map(link => (
                    <tr key={link.id} className="hover:bg-gray-50">
                      <td className="p-4 font-semibold text-gray-900">{link.candidateName}</td>
                      <td className="p-4 font-mono text-gray-500 text-xs bg-gray-50 inline-block m-2 rounded">{link.token}</td>
                      <td className="p-4"><span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${link.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{link.status}</span></td>
                      <td className="p-4 text-right"><button onClick={() => copyLink(link.token)} className="text-blue-600 font-bold text-xs flex items-center justify-end gap-1 w-full hover:underline"><Copy className="w-3 h-3"/> Copy</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* === TAB 3: SUBMISSIONS (IMPROVED UI) === */}
          {activeTab === "submissions" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
                  <div className="bg-blue-100 p-3 rounded-full text-blue-600"><FileCheck className="w-6 h-6"/></div>
                  <div><div className="text-2xl font-bold text-gray-900">{submissions.length}</div><div className="text-sm text-gray-500">Total Submissions</div></div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
                  <div className="bg-green-100 p-3 rounded-full text-green-600"><BarChart2 className="w-6 h-6"/></div>
                  <div><div className="text-2xl font-bold text-gray-900">{submissions.filter(s => s.test_type === 'cfit').length}</div><div className="text-sm text-gray-500">CFIT Completed</div></div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
                  <div className="bg-purple-100 p-3 rounded-full text-purple-600"><Zap className="w-6 h-6"/></div>
                  <div><div className="text-2xl font-bold text-gray-900">{submissions.filter(s => s.test_type === 'kraepelin').length}</div><div className="text-sm text-gray-500">Kraepelin Completed</div></div>
                </div>
              </div>
              {renderSubmissionTable()}
            </div>
          )}

        </main>
      </div>

      {/* --- CREATE LINK MODAL (UPDATED WITH DROPDOWN) --- */}
      {showCreateLinkModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
             <div className="flex justify-between items-center border-b pb-4">
                <h3 className="font-bold text-lg">Buat Link Baru</h3>
                <button onClick={() => setShowCreateLinkModal(false)}><X className="w-5 h-5" /></button>
             </div>
             
             <div className="space-y-3">
               {/* DROPDOWN KANDIDAT */}
               <div>
                 <label className="text-sm font-semibold text-gray-700 mb-1 block">Pilih Kandidat</label>
                 <select 
                   value={selectedCandidateId} 
                   onChange={(e) => setSelectedCandidateId(e.target.value)} 
                   className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-700"
                 >
                   <option value="" disabled>-- Pilih dari Database --</option>
                   {candidatesList.map((candidate) => (
                     <option key={candidate.id} value={candidate.id}>
                       {candidate.name} - {candidate.top_position}
                     </option>
                   ))}
                 </select>
                 {candidatesList.length === 0 && (
                   <p className="text-xs text-red-500 mt-1">Belum ada kandidat. Upload CV dulu.</p>
                 )}
               </div>

               {/* [NEW] DROPDOWN JOB POSITION */}
               <div>
                 <label className="text-sm font-semibold text-gray-700 mb-1 block">Pilih Posisi (Opsional)</label>
                 <select 
                   value={selectedJobId} 
                   onChange={(e) => setSelectedJobId(e.target.value)} 
                   className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-700"
                 >
                   <option value="" disabled>-- Pilih Posisi Pekerjaan --</option>
                   <option value="">(Semua Posisi / Umum)</option>
                   {jobsList.map((job) => (
                     <option key={job.id} value={job.id}>
                       {job.title}
                     </option>
                   ))}
                 </select>
               </div>
             </div>

             <div className="flex gap-2 pt-4">
                <button onClick={() => setShowCreateLinkModal(false)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-lg">Batal</button>
                <button 
                  onClick={handleGenerateLink} 
                  disabled={isGeneratingLink || !selectedCandidateId} 
                  className="flex-[2] bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-300"
                >
                  {isGeneratingLink ? 'Memproses...' : 'Generate Link'}
                </button>
             </div>
          </div>
        </div>
      )}

      {showQuestionModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4">
              <div className="flex justify-between items-center border-b pb-4"><h3 className="font-bold text-lg">{isCfitCategory ? `Tambah CFIT: ${selectedCfitSubtype?.name}` : `Tambah Soal: ${selectedCategory?.name}`}</h3><button onClick={() => setShowQuestionModal(false)}><X className="w-5 h-5" /></button></div>
              {isCfitCategory ? (
                <div className="space-y-4">
                  <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:bg-gray-50">
                     <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImageUpload} />
                     {imagePreview ? <img src={imagePreview} className="max-h-40 mx-auto rounded" /> : <div className="text-gray-500 text-sm"><Upload className="w-8 h-8 mx-auto mb-2"/>Pilih Gambar</div>}
                  </div>
                  <div className="flex justify-center gap-2 flex-wrap">
                     {getOptionLabels(selectedCfitSubtype?.optionCount || 6).map(lbl => (
                       <button key={lbl} onClick={() => setCorrectAnswer(lbl)} className={`w-10 h-10 rounded font-bold border ${correctAnswer === lbl ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-400'}`}>{lbl}</button>
                     ))}
                  </div>
                  <button onClick={handleAddCfitQuestion} disabled={isSubmitting} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold">{isSubmitting ? "Uploading..." : "Simpan CFIT"}</button>
                </div>
              ) : (
                <div className="space-y-4">
                  <textarea placeholder="Pernyataan A" value={optionA} onChange={e => setOptionA(e.target.value)} className="w-full border p-3 rounded-lg" />
                  <textarea placeholder="Pernyataan B" value={optionB} onChange={e => setOptionB(e.target.value)} className="w-full border p-3 rounded-lg" />
                  <button onClick={handleAddPapiQuestion} disabled={isSubmitting} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold">{isSubmitting ? "Menyimpan..." : "Simpan PAPI"}</button>
                </div>
              )}
          </div>
        </div>
      )}

      {showDetailModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm transition-all">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col transform transition-all scale-100">
            {/* Header Modal */}
            <div className="p-6 border-b flex justify-between items-start bg-gray-50 rounded-t-2xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-blue-200">
                    {showDetailModal.candidate_name ? showDetailModal.candidate_name.charAt(0).toUpperCase() : "U"}
                </div>
                <div>
                    <h3 className="font-bold text-xl text-gray-900">{showDetailModal.candidate_name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                            {showDetailModal.test_type} RESULT
                        </span>
                        <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                        <span className="text-xs text-gray-400">
                            {new Date(showDetailModal.submitted_at).toLocaleString('id-ID')}
                        </span>
                    </div>
                </div>
              </div>
              <button onClick={() => setShowDetailModal(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
            </div>

            {/* Content Body */}
            <div className="p-8 overflow-y-auto bg-white">
                {renderDetailContent(showDetailModal)}
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-gray-50 flex justify-end rounded-b-2xl">
              <button onClick={() => setShowDetailModal(null)} className="px-6 py-2.5 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-black shadow-lg shadow-gray-200 transition-transform active:scale-95">
                Tutup Panel
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateSubtypeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg p-6 rounded-lg">
             <h3 className="font-bold mb-4">Buat Tipe Soal Baru</h3>
             <button onClick={() => setShowCreateSubtypeModal(false)} className="bg-gray-200 px-4 py-2 rounded">Tutup</button>
          </div>
        </div>
      )}

      {showEditSubtypeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg p-6 rounded-lg">
             <h3 className="font-bold mb-4">Edit Tipe Soal</h3>
             <button onClick={() => setShowEditSubtypeModal(false)} className="bg-gray-200 px-4 py-2 rounded">Tutup</button>
          </div>
        </div>
      )}

    </div>
  );
}