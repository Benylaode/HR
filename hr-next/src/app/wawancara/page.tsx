"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { toast } from "sonner";
import CandidateEvaluation from "@/components/recruitment/CandidateEvaluation";
import { User, FileCheck } from "lucide-react";

// --- 0. CONFIG ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

// --- 1. INTERFACES ---
export interface Candidate {
  id: string;
  fullName: string;
  email: string;
  top_position: string;
}

// --- 2. MAIN COMPONENT ---
export default function TestManagementPage() {
  const router = useRouter();
  
  // State User
  const [user, setUser] = useState<{ name: string; role?: string } | null>(null);
  
  // State Kandidat & Evaluasi
  const [evalCandidateId, setEvalCandidateId] = useState("");
  const [candidatesList, setCandidatesList] = useState<Candidate[]>([]);
  
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
      const fetchOptions: RequestInit = { headers: getAuthHeaders(), cache: "no-store" };

      // Hanya mengambil data kandidat untuk dropdown penilaian
      const resCandidates = await fetch(`${API_BASE_URL}/candidates`, fetchOptions);
      if (resCandidates.ok) {
        setCandidatesList(await resCandidates.json());
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      toast.error("Gagal memuat data", { description: "Periksa koneksi internet atau server Anda." });
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[var(--background)] flex">
      <Sidebar />
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0">
        
        {/* HEADER */}
        <div className="sticky top-0 z-30 bg-[var(--background)]/90 backdrop-blur-md">
           <Header 
             title="Manajemen Evaluasi" 
             subtitle="Penilaian Interview Kandidat Menggunakan Form Assesment" 
             onRefresh={fetchData} 
           />
        </div>

        {/* MAIN CONTENT */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* === TAB EVALUATION === */}
          <div className="space-y-6">
            {/* Box Pemilihan Kandidat */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-[var(--secondary-200)]">
              <h3 className="font-bold text-[var(--primary-900)] mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-[var(--primary)]" />
                Pilih Kandidat untuk Penilaian Interview
              </h3>
              <select
                value={evalCandidateId}
                onChange={(e) => setEvalCandidateId(e.target.value)}
                className="w-full p-4 border border-[var(--secondary-200)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] text-sm bg-gray-50 font-medium"
              >
                <option value="">-- Silakan Pilih Kandidat --</option>
                {candidatesList.map(c => (
                  <option key={c.id} value={c.id}>{c.fullName}</option>
                ))}
              </select>
            </div>

            {/* Render Komponen Form Penilaian jika kandidat sudah dipilih */}
            {evalCandidateId ? (
              <div className="animate-in slide-in-from-bottom-4 duration-500">
                <CandidateEvaluation 
                  candidateId={evalCandidateId}
                  candidateName={candidatesList.find(c => c.id === evalCandidateId)?.fullName || "Unknown"}
                  currentUserRole={user?.role || "HR"} 
                />
              </div>
            ) : (
              <div className="p-10 text-center bg-white rounded-2xl border border-dashed border-[var(--secondary-300)] text-[var(--secondary-500)] flex flex-col items-center justify-center">
                <FileCheck className="w-12 h-12 mb-3 text-[var(--secondary-200)]" />
                <p className="font-medium text-lg text-[var(--primary-900)]">Belum Ada Kandidat Dipilih</p>
                <p className="text-sm mt-1">Pilih kandidat dari *dropdown* di atas untuk memunculkan Form Assesment STAR Method dan Value Behavior.</p>
              </div>
            )}
          </div>

        </main>
        <Footer />
      </div>
    </div>
  );
}