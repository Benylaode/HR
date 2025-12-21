"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import {
  Link,
  CheckCircle,
  FileCheck,
  Target,
  Plus,
  RefreshCw,
  Trash2,
  X,
  FolderOpen,
  HelpCircle,
  Upload,
  Image,
  Grid3X3,
  Layers,
  Settings,
  Edit,
} from "lucide-react";
import { categories, allQuestions, testLinks, Category, Question, TestLink } from "@/lib/dummy-data";

type TabType = "test-links" | "categories" | "submissions";

// Interface untuk Tipe Soal CFIT
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

// Data awal CFIT Sub-types (bisa di-extend)
const initialCfitSubtypes: CfitSubtype[] = [
  { 
    id: 1, 
    name: "Series Completion", 
    code: "cfit_series", 
    description: "Melengkapi pola urutan",
    instruction: "Tentukan pola yang melengkapi urutan gambar berikut. Pilih salah satu jawaban yang paling tepat.",
    optionCount: 6,
    questions: []
  },
  { 
    id: 2, 
    name: "Classification", 
    code: "cfit_classification", 
    description: "Klasifikasi objek",
    instruction: "Temukan gambar yang tidak termasuk dalam kelompok. Pilih gambar yang berbeda dari yang lainnya.",
    optionCount: 5,
    questions: []
  },
  { 
    id: 3, 
    name: "Matrices", 
    code: "cfit_matrices", 
    description: "Melengkapi matriks",
    instruction: "Lengkapi matriks dengan memilih gambar yang tepat untuk mengisi kotak kosong.",
    optionCount: 6,
    questions: []
  },
  { 
    id: 4, 
    name: "Conditions", 
    code: "cfit_conditions", 
    description: "Kondisi dan aturan",
    instruction: "Berdasarkan kondisi yang diberikan, tentukan jawaban yang paling tepat.",
    optionCount: 5,
    questions: []
  },
];

export default function TestManagementPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("categories");
  const [localCategories, setLocalCategories] = useState<Category[]>(categories);
  const [localQuestions, setLocalQuestions] = useState<Record<number, Question[]>>(allQuestions);
  const [localTestLinks, setLocalTestLinks] = useState<TestLink[]>(testLinks);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  
  // CFIT State
  const [cfitSubtypes, setCfitSubtypes] = useState<CfitSubtype[]>(initialCfitSubtypes);
  const [selectedCfitSubtype, setSelectedCfitSubtype] = useState<CfitSubtype | null>(null);
  
  // Modals
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showCreateSubtypeModal, setShowCreateSubtypeModal] = useState(false);
  const [showEditSubtypeModal, setShowEditSubtypeModal] = useState(false);
  const [showCreateLinkModal, setShowCreateLinkModal] = useState(false);
  
  // Form state untuk Tipe Soal
  const [subtypeName, setSubtypeName] = useState("");
  const [subtypeInstruction, setSubtypeInstruction] = useState("");
  const [subtypeOptionCount, setSubtypeOptionCount] = useState("6");
  
  // Form state untuk Pertanyaan
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState("");
  
  // PAPI State
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [questionText, setQuestionText] = useState("");
  
  // Kraepelin settings
  const [kraepelinColumns, setKraepelinColumns] = useState("50");
  const [kraepelinRows, setKraepelinRows] = useState("27");
  const [kraepelinTimePerColumn, setKraepelinTimePerColumn] = useState("15");

  useEffect(() => {
    const userData = localStorage.getItem("hr_user");
    if (!userData) {
      router.push("/");
      return;
    }
    setUser(JSON.parse(userData));
  }, [router]);

  // Stats
  const stats = {
    totalLinks: localTestLinks.length,
    activeLinks: localTestLinks.filter((l) => l.status === "active").length,
    totalSubmissions: 0,
    completionRate: 0,
  };

  const copyLink = (token: string) => {
    const text = `${window.location.origin}/test/${token}`;

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => alert("Link copied!"))
        .catch(err => console.error("Clipboard error:", err));
    } else {
      // fallback untuk browser lama
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      alert("Link copied (fallback)!");
    }
  };


  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Tambah Tipe Soal Baru
  const handleCreateSubtype = () => {
    if (!subtypeName.trim()) return;
    
    const newSubtype: CfitSubtype = {
      id: cfitSubtypes.length + 1,
      name: subtypeName,
      code: `cfit_${subtypeName.toLowerCase().replace(/\s+/g, '_')}`,
      description: subtypeInstruction.substring(0, 50) + "...",
      instruction: subtypeInstruction,
      optionCount: parseInt(subtypeOptionCount),
      questions: []
    };
    
    setCfitSubtypes([...cfitSubtypes, newSubtype]);
    setSubtypeName("");
    setSubtypeInstruction("");
    setSubtypeOptionCount("6");
    setShowCreateSubtypeModal(false);
  };

  // Update Tipe Soal
  const handleUpdateSubtype = () => {
    if (!selectedCfitSubtype) return;
    
    setCfitSubtypes(cfitSubtypes.map(st => 
      st.id === selectedCfitSubtype.id
        ? { ...st, name: subtypeName, instruction: subtypeInstruction, optionCount: parseInt(subtypeOptionCount) }
        : st
    ));
    setShowEditSubtypeModal(false);
  };

  // Tambah Pertanyaan
  const handleAddQuestion = () => {
    if (!selectedCfitSubtype || !imagePreview || !correctAnswer) return;
    
    const newQuestion: CfitQuestion = {
      id: selectedCfitSubtype.questions.length + 1,
      imageUrl: imagePreview,
      correctAnswer: correctAnswer
    };
    
    setCfitSubtypes(cfitSubtypes.map(st => 
      st.id === selectedCfitSubtype.id
        ? { ...st, questions: [...st.questions, newQuestion] }
        : st
    ));
    
    // Update selected subtype
    setSelectedCfitSubtype({
      ...selectedCfitSubtype,
      questions: [...selectedCfitSubtype.questions, newQuestion]
    });
    
    setImagePreview(null);
    setCorrectAnswer("");
    setShowQuestionModal(false);
  };

  // Delete Question
  const handleDeleteQuestion = (questionId: number) => {
    if (!selectedCfitSubtype) return;
    
    const updatedQuestions = selectedCfitSubtype.questions.filter(q => q.id !== questionId);
    
    setCfitSubtypes(cfitSubtypes.map(st => 
      st.id === selectedCfitSubtype.id
        ? { ...st, questions: updatedQuestions }
        : st
    ));
    
    setSelectedCfitSubtype({
      ...selectedCfitSubtype,
      questions: updatedQuestions
    });
  };

  const isCfitCategory = selectedCategory?.code?.toLowerCase().includes("cfit");
  const isKraepelinCategory = selectedCategory?.code?.toLowerCase().includes("kraepelin");

  // Generate option labels based on count
  const getOptionLabels = (count: number) => {
    return Array.from({ length: count }, (_, i) => String.fromCharCode(65 + i));
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">Manajemen Test</h1>
                <p className="text-sm text-gray-600">Kelola soal CFIT, PAPI, dan Kraepelin</p>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowCreateLinkModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 font-medium flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Buat Test Link
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="bg-white border-b">
          <div className="px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab("test-links")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "test-links" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"
                }`}
              >
                Test Links
              </button>
              <button
                onClick={() => setActiveTab("categories")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "categories" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"
                }`}
              >
                Categories & Questions
              </button>
              <button
                onClick={() => setActiveTab("submissions")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "submissions" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"
                }`}
              >
                Submissions
              </button>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            {/* Test Links Tab */}
            {activeTab === "test-links" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white p-6 shadow border border-gray-200">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        <Link className="w-5 h-5 text-white" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Total Links</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.totalLinks}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-6 shadow border border-gray-200">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Active</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.activeLinks}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-6 shadow border border-gray-200">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                        <FileCheck className="w-5 h-5 text-white" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Submissions</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.totalSubmissions}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-6 shadow border border-gray-200">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                        <Target className="w-5 h-5 text-white" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Completion</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.completionRate}%</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white shadow border border-gray-200 mb-8">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Test Links</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Token</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Candidate</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {localTestLinks.map((link) => (
                          <tr key={link.id}>
                            <td className="px-6 py-4"><code className="text-xs bg-gray-100 px-2 py-1">{link.token.substring(0, 20)}...</code></td>
                            <td className="px-6 py-4 text-sm text-gray-900">{link.candidateName}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 text-xs font-semibold ${
                                link.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                              }`}>{link.status}</span>
                            </td>
                            <td className="px-6 py-4">
                              <button onClick={() => copyLink(link.token)} className="text-blue-600 hover:underline text-sm">Copy</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* Categories Tab */}
            {activeTab === "categories" && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Categories List */}
                <div className="bg-white shadow border border-gray-200">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">Categories</h3>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {localCategories.map((cat) => (
                      <div
                        key={cat.id}
                        onClick={() => {
                          setSelectedCategory(cat);
                          setSelectedCfitSubtype(null);
                        }}
                        className={`px-4 py-3 cursor-pointer hover:bg-gray-50 ${
                          selectedCategory?.id === cat.id ? "bg-blue-50 border-l-4 border-blue-600" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FolderOpen className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-900 text-sm">{cat.name}</span>
                          </div>
                          <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5">{cat.question_count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CFIT: Show Subtypes when category selected */}
                {isCfitCategory && !selectedCfitSubtype && (
                  <div className="lg:col-span-3 bg-white shadow border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Layers className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Tipe Soal CFIT</h3>
                      </div>
                      <button
                        onClick={() => setShowCreateSubtypeModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 font-medium flex items-center"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Buat Tipe Soal
                      </button>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {cfitSubtypes.map((subtype) => (
                        <div
                          key={subtype.id}
                          onClick={() => setSelectedCfitSubtype(subtype)}
                          className="border-2 border-gray-200 p-4 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                <span className="text-white font-bold">{subtype.id}</span>
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">{subtype.name}</h4>
                                <p className="text-sm text-gray-500">{subtype.optionCount} pilihan jawaban</p>
                                <p className="text-xs text-gray-400 mt-1">{subtype.questions.length} soal</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CFIT: Show Questions when subtype selected */}
                {isCfitCategory && selectedCfitSubtype && (
                  <div className="lg:col-span-3 space-y-6">
                    {/* Subtype Header */}
                    <div className="bg-white shadow border border-gray-200">
                      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{selectedCfitSubtype.name}</h3>
                          <button
                            onClick={() => setSelectedCfitSubtype(null)}
                            className="text-sm text-blue-600 hover:underline"
                          >
                            ← Kembali ke daftar tipe soal
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSubtypeName(selectedCfitSubtype.name);
                              setSubtypeInstruction(selectedCfitSubtype.instruction);
                              setSubtypeOptionCount(String(selectedCfitSubtype.optionCount));
                              setShowEditSubtypeModal(true);
                            }}
                            className="border border-gray-300 px-3 py-2 hover:bg-gray-50 flex items-center"
                          >
                            <Settings className="w-4 h-4 mr-2" />
                            Edit Pengaturan
                          </button>
                          <button
                            onClick={() => setShowQuestionModal(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 font-medium flex items-center"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Tambah Soal
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Subtype Info */}
                    <div className="bg-blue-50 border border-blue-200 p-4">
                      <div className="flex items-start gap-3">
                        <Layers className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-blue-900">Instruksi Pengerjaan:</p>
                          <p className="text-sm text-blue-700 mt-1">{selectedCfitSubtype.instruction}</p>
                          <p className="text-xs text-blue-600 mt-2">
                            Pilihan jawaban: {getOptionLabels(selectedCfitSubtype.optionCount).join(", ")}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Questions Grid */}
                    <div className="bg-white shadow border border-gray-200">
                      <div className="px-6 py-4 border-b border-gray-200">
                        <h4 className="font-semibold text-gray-900">Daftar Soal ({selectedCfitSubtype.questions.length})</h4>
                      </div>
                      <div className="p-6">
                        {selectedCfitSubtype.questions.length > 0 ? (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {selectedCfitSubtype.questions.map((q, idx) => (
                              <div key={q.id} className="relative group border">
                                <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                                  {q.imageUrl ? (
                                    <img src={q.imageUrl} alt={`Soal ${idx + 1}`} className="w-full h-full object-cover" />
                                  ) : (
                                    <Image className="w-8 h-8 text-gray-400" />
                                  )}
                                </div>
                                <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 font-bold">
                                  #{idx + 1}
                                </div>
                                <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1">
                                  {q.correctAnswer}
                                </div>
                                <button 
                                  onClick={() => handleDeleteQuestion(q.id)}
                                  className="absolute bottom-2 right-2 bg-red-500 text-white p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12 text-gray-500">
                            <Image className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p>Belum ada soal</p>
                            <p className="text-sm">Klik "Tambah Soal" untuk menambahkan</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Non-CFIT Categories */}
                {selectedCategory && !isCfitCategory && (
                  <div className="lg:col-span-3 bg-white shadow border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-900">{selectedCategory.name}</h3>
                      <button
                        onClick={() => setShowQuestionModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 font-medium flex items-center"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Question
                      </button>
                    </div>
                    {isKraepelinCategory ? (
                      <div className="p-6 space-y-4">
                        <div className="bg-blue-50 border border-blue-200 p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Grid3X3 className="w-5 h-5 text-blue-600" />
                            <span className="font-medium text-blue-900">Pengaturan Kraepelin</span>
                          </div>
                          <p className="text-sm text-blue-700">
                            Kraepelin adalah tes konsentrasi dengan grid angka. Kandidat menjumlahkan dua angka berurutan.
                          </p>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Jumlah Kolom</label>
                            <input
                              type="number"
                              value={kraepelinColumns}
                              onChange={(e) => setKraepelinColumns(e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 focus:border-blue-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Jumlah Baris</label>
                            <input
                              type="number"
                              value={kraepelinRows}
                              onChange={(e) => setKraepelinRows(e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 focus:border-blue-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Detik/Kolom</label>
                            <input
                              type="number"
                              value={kraepelinTimePerColumn}
                              onChange={(e) => setKraepelinTimePerColumn(e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 focus:border-blue-500 focus:outline-none"
                            />
                          </div>
                        </div>
                        {/* Preview Grid */}
                        <div className="bg-gray-100 p-4">
                          <p className="font-medium text-gray-900 mb-3">Preview Grid:</p>
                          <div className="bg-white p-3 border overflow-x-auto">
                            <div className="flex gap-1">
                              {Array.from({ length: Math.min(parseInt(kraepelinColumns) || 10, 20) }).map((_, colIdx) => (
                                <div key={colIdx} className="flex flex-col gap-0.5">
                                  {Array.from({ length: Math.min(parseInt(kraepelinRows) || 10, 10) }).map((_, rowIdx) => (
                                    <div key={rowIdx} className="w-5 h-5 bg-gray-200 flex items-center justify-center text-xs font-mono">
                                      {Math.floor(Math.random() * 10)}
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="mt-3 text-sm text-gray-600">
                            <p><strong>Konfigurasi:</strong> {kraepelinColumns} kolom × {kraepelinRows} baris</p>
                            <p><strong>Total durasi:</strong> ~{Math.ceil(parseInt(kraepelinColumns) * parseInt(kraepelinTimePerColumn) / 60)} menit</p>
                          </div>
                        </div>
                        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 font-medium">
                          Simpan Pengaturan Kraepelin
                        </button>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200">
                        {(localQuestions[selectedCategory.id] || []).slice(0, 5).map((q, idx) => (
                          <div key={q.id} className="px-6 py-4 hover:bg-gray-50">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1">#{idx + 1}</span>
                                  <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1">{q.question_type}</span>
                                </div>
                                <p className="text-gray-900">{q.question_text || q.instruction || "No text"}</p>
                              </div>
                              <button className="p-1 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </div>
                        ))}
                        {(!localQuestions[selectedCategory.id] || localQuestions[selectedCategory.id].length === 0) && (
                          <div className="px-6 py-12 text-center text-gray-500">
                            <HelpCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p>No questions in this category</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* No Category Selected */}
                {!selectedCategory && (
                  <div className="lg:col-span-3 bg-white shadow border border-gray-200 p-12 text-center text-gray-500">
                    <FolderOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Pilih kategori untuk melihat soal</p>
                  </div>
                )}
              </div>
            )}

            {/* Submissions Tab */}
            {activeTab === "submissions" && (
              <div className="bg-white shadow border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Submissions</h3>
                </div>
                <div className="px-6 py-12 text-center text-gray-500">
                  <FileCheck className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No submissions yet</p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modal: Buat Tipe Soal */}
      {showCreateSubtypeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Buat Tipe Soal Baru</h3>
              <button onClick={() => setShowCreateSubtypeModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nama Tipe Soal</label>
                <input
                  type="text"
                  value={subtypeName}
                  onChange={(e) => setSubtypeName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 focus:border-blue-500 focus:outline-none"
                  placeholder="Contoh: Series Completion"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Instruksi Pengerjaan</label>
                <textarea
                  value={subtypeInstruction}
                  onChange={(e) => setSubtypeInstruction(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 focus:border-blue-500 focus:outline-none"
                  rows={3}
                  placeholder="Instruksi yang akan ditampilkan kepada kandidat..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Jumlah Pilihan Jawaban</label>
                <select
                  value={subtypeOptionCount}
                  onChange={(e) => setSubtypeOptionCount(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 focus:border-blue-500 focus:outline-none"
                >
                  <option value="4">4 (A-D)</option>
                  <option value="5">5 (A-E)</option>
                  <option value="6">6 (A-F)</option>
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button
                onClick={() => setShowCreateSubtypeModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleCreateSubtype}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700"
              >
                Buat Tipe Soal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Tipe Soal */}
      {showEditSubtypeModal && selectedCfitSubtype && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Edit Tipe Soal</h3>
              <button onClick={() => setShowEditSubtypeModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nama Tipe Soal</label>
                <input
                  type="text"
                  value={subtypeName}
                  onChange={(e) => setSubtypeName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Instruksi Pengerjaan</label>
                <textarea
                  value={subtypeInstruction}
                  onChange={(e) => setSubtypeInstruction(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 focus:border-blue-500 focus:outline-none"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Jumlah Pilihan Jawaban</label>
                <select
                  value={subtypeOptionCount}
                  onChange={(e) => setSubtypeOptionCount(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 focus:border-blue-500 focus:outline-none"
                >
                  <option value="4">4 (A-D)</option>
                  <option value="5">5 (A-E)</option>
                  <option value="6">6 (A-F)</option>
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button
                onClick={() => setShowEditSubtypeModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleUpdateSubtype}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Tambah Soal (Gambar + Jawaban saja) */}
      {showQuestionModal && selectedCfitSubtype && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Tambah Soal - {selectedCfitSubtype.name}</h3>
              <button onClick={() => setShowQuestionModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              {/* Info */}
              <div className="bg-gray-50 border p-3 text-sm text-gray-600">
                Soal #{selectedCfitSubtype.questions.length + 1} • Pilihan: {getOptionLabels(selectedCfitSubtype.optionCount).join(", ")}
              </div>

              {/* Upload Gambar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Image className="w-4 h-4 inline mr-1" />
                  Gambar Soal
                </label>
                <div className="border-2 border-dashed border-gray-300 p-6 text-center">
                  {imagePreview ? (
                    <div>
                      <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto mb-3" />
                      <button onClick={() => setImagePreview(null)} className="text-red-600 text-sm hover:underline">
                        Hapus Gambar
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-10 h-10 mx-auto text-gray-400 mb-3" />
                      <p className="text-gray-600 mb-2">Upload gambar soal</p>
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="text-sm" />
                    </>
                  )}
                </div>
              </div>

              {/* Kunci Jawaban */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kunci Jawaban</label>
                <div className="flex gap-2">
                  {getOptionLabels(selectedCfitSubtype.optionCount).map((label) => (
                    <button
                      key={label}
                      onClick={() => setCorrectAnswer(label)}
                      className={`flex-1 py-3 font-bold text-lg border-2 ${
                        correctAnswer === label
                          ? "border-green-500 bg-green-50 text-green-700"
                          : "border-gray-300 hover:border-blue-500"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowQuestionModal(false);
                  setImagePreview(null);
                  setCorrectAnswer("");
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleAddQuestion}
                disabled={!imagePreview || !correctAnswer}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Simpan Soal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
