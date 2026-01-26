"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
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
    fetchData(); 
  }, [router]);

  // --- API FETCH FUNCTIONS ---

  const fetchData = async () => {
    try {
      const resLinks = await fetch(`${API_BASE_URL}/management/links`, { headers: getAuthHeaders() });
      if (resLinks.ok) setLocalTestLinks(await resLinks.json());

      const resSubs = await fetch(`${API_BASE_URL}/management/submissions`, { headers: getAuthHeaders() }); 
      if (resSubs.ok) setSubmissions(await resSubs.json());

      const resCandidates = await fetch(`${API_BASE_URL}/candidates`, { headers: getAuthHeaders() });
      if (resCandidates.ok) setCandidatesList(await resCandidates.json());

      const resJobs = await fetch(`${API_BASE_URL}/job-positions?status=active`, { headers: getAuthHeaders() });
      if (resJobs.ok) setJobsList(await resJobs.json());

      const resKraepelin = await fetch(`${API_BASE_URL}/management/config/kraepelin`, { headers: getAuthHeaders() });
      if (resKraepelin.ok) {
        const data = await resKraepelin.json();
        setKraepelinColumns(String(data.columns || 50));
        setKraepelinRows(String(data.rows || 27));
        setKraepelinTimePerColumn(String(data.durationPerColumn || 15));
      }

      const resCfit = await fetch(`${API_BASE_URL}/management/questions/cfit`, { headers: getAuthHeaders() });
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

      const resPapi = await fetch(`${API_BASE_URL}/management/questions/papi`, { headers: getAuthHeaders() });
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
        headers: getAuthHeaders(), 
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
        method: "PUT", headers: getAuthHeaders(),
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
        method: "POST", headers: getAuthHeaders(), body: JSON.stringify({ option_a: optionA, option_b: optionB }),
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
        const res = await fetch(`${API_BASE_URL}/management/questions/cfit`, { method: "POST", body: formData, headers: getAuthHeaders() });
        if (res.ok) { alert("Ditambahkan!"); setShowQuestionModal(false); setImagePreview(null); setCorrectAnswer(""); fetchData(); }
      } catch (err) { alert("Error."); } finally { setIsSubmitting(false); }
  };

  const handleDeleteQuestion = async (endpoint: 'cfit' | 'papi', id: number) => {
    if (!confirm("Hapus?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/management/questions/${endpoint}/${id}`, { method: "DELETE", headers: getAuthHeaders() });
      if (res.ok) fetchData();
    } catch (err) { console.error(err); }
  };

  const handleCreateSubtype = () => { setShowCreateSubtypeModal(false); };
  const handleUpdateSubtype = () => { setShowEditSubtypeModal(false); };

  // --- UTILS ---
  const copyLink = async (token: string) => {
  try {
    const url = `${window.location.origin}/test/${token}`;
    await navigator.clipboard.writeText(url).then(() => alert("Disalin!"));
    console.log("Link berhasil disalin!");
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
            <th className="px-6 py-4">Kandidat</th>
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
        const aspects = Object.entries(sub.scores).filter(([key]) => /^[A-Z]$/.test(key)); // Filter A-Z keys
        return (
            <div className="space-y-4">
                <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl mb-4">
                    <h4 className="font-bold text-orange-900 text-sm">PAPI Kostick Profile</h4>
                    <p className="text-xs text-orange-700">Skor mentah per aspek (Range 0-9)</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto pr-2">
                    {aspects.map(([key, value]: any) => (
                        <div key={key} className="flex flex-col gap-1 p-2 border border-[var(--secondary-200)] rounded-lg hover:shadow-sm bg-white">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-[var(--primary-900)]">{key}</span>
                                <span className="text-xs font-mono text-[var(--secondary-500)]">{value}/9</span>
                            </div>
                            <div className="w-full h-1.5 bg-[var(--secondary-100)] rounded-full overflow-hidden">
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {cfitSubtypes.map((st) => (
                          <div key={st.id} onClick={() => setSelectedCfitSubtype(st)} className="bg-white p-5 rounded-xl border border-[var(--secondary-200)] hover:border-[var(--primary-300)] hover:shadow-md cursor-pointer group transition-all">
                             <div className="flex justify-between items-start mb-4">
                               <div className="w-10 h-10 rounded-lg bg-[var(--primary-50)] text-[var(--primary)] flex items-center justify-center font-bold">{st.id}</div>
                               <span className="text-[10px] font-bold text-[var(--secondary-500)] bg-[var(--secondary-50)] px-2 py-1 rounded-lg uppercase tracking-wide border border-[var(--secondary-100)]">{st.questions.length} SOAL</span>
                             </div>
                             <h4 className="font-bold text-[var(--primary-900)] text-lg group-hover:text-[var(--primary)] transition-colors">{st.name}</h4>
                             <p className="text-xs text-[var(--secondary)] mt-1">{st.description}</p>
                          </div>
                        ))}
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
                      <th className="p-4">Kandidat</th>
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
                <div>
                   <label className="block text-xs font-bold text-[var(--secondary-500)] uppercase mb-2">Pilih Kandidat</label>
                   <select 
                     value={selectedCandidateId} 
                     onChange={(e) => setSelectedCandidateId(e.target.value)}
                     className="w-full p-3 border border-[var(--secondary-200)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] text-sm bg-white"
                   >
                     <option value="">-- Pilih Kandidat --</option>
                     {candidatesList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                   </select>
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
                      Link akan otomatis berisi 3 paket tes (CFIT, PAPI, Kraepelin). Token unik akan di-generate untuk akses kandidat.
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
                    <label className="text-xs font-bold text-[var(--secondary-500)] uppercase mb-2 block">Kunci Jawaban</label>
                    <div className="flex gap-2 flex-wrap">
                      {getOptionLabels(selectedCfitSubtype?.optionCount || 6).map(lbl => (
                        <button key={lbl} onClick={() => setCorrectAnswer(lbl)} className={`w-10 h-10 rounded-lg font-bold border transition-all ${correctAnswer === lbl ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-md' : 'text-[var(--secondary-400)] border-[var(--secondary-200)] hover:bg-[var(--secondary-50)]'}`}>{lbl}</button>
                      ))}
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

      {showDetailModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
              <div className="p-5 border-b border-[var(--secondary-100)] flex justify-between items-center bg-[var(--background)] shrink-0">
                 <div>
                    <h3 className="text-lg font-bold text-[var(--primary-900)]">Detail Hasil Tes</h3>
                    <p className="text-xs text-[var(--secondary)]">Kandidat: {showDetailModal.candidate_name}</p>
                 </div>
                 <button onClick={() => setShowDetailModal(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="text-[var(--secondary-400)]" /></button>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
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
