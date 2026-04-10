"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { toast } from "sonner";
import { 
  UserPlus, 
  Mail, 
  Lock, 
  Building, 
  ShieldCheck, 
  User, 
  Loader2, 
  CheckCircle,
  AlertCircle
} from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export default function InputUserPage() {
  const router = useRouter();
  
  const [currentUser, setCurrentUser] = useState<{ name: string; role?: string } | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(true);
  
  // State untuk form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("HR");
  const [department, setDepartment] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem("hr_user");
    if (!userData) {
      router.push("/");
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    setCurrentUser(parsedUser);

    // Validasi Role: Hanya SUPER_USER yang boleh mengakses halaman ini
    if (parsedUser.role !== "SUPER_USER") {
      setIsAuthorized(false);
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !password || !department) {
      toast.warning("Peringatan", { description: "Semua kolom wajib diisi!" });
      return;
    }

    setIsLoading(true);

    const token = localStorage.getItem("hr_token");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/create-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          department
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal menambahkan user baru");
      }

      toast.success("Berhasil!", { 
        description: `User ${name} berhasil ditambahkan ke departemen ${department}.` 
      });

      // Reset form setelah sukses
      setName("");
      setEmail("");
      setPassword("");
      setRole("HR");
      setDepartment("");

    } catch (error: any) {
      toast.error("Gagal", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  // Jika user bukan SUPER_USER, tampilkan pesan akses ditolak
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex">
        <Sidebar />
        <div className="lg:pl-64 flex flex-col flex-1 min-w-0">
          <Header title="Akses Ditolak" subtitle="Anda tidak memiliki izin" />
          <main className="flex-1 p-8 flex items-center justify-center">
            <div className="bg-white p-10 rounded-2xl border border-red-200 text-center shadow-lg max-w-md">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Akses Terbatas</h2>
              <p className="text-slate-600 mb-6">
                Halaman ini hanya dapat diakses oleh Administrator (SUPER_USER).
              </p>
              <button 
                onClick={() => router.push("/dashboard")}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-xl font-bold transition-colors"
              >
                Kembali ke Dashboard
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex">
      <Sidebar />
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0">
        
        {/* HEADER */}
        <div className="sticky top-0 z-30 bg-[var(--background)]/90 backdrop-blur-md">
           <Header title="Manajemen User" subtitle="Input akun pengguna baru untuk sistem HR" />
        </div>

        {/* MAIN CONTENT */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div className="max-w-3xl mx-auto space-y-6">
            
            {/* Kartu Info */}
            <div className="bg-gradient-to-r from-[var(--primary-50)] to-blue-50 border border-[var(--primary-100)] rounded-2xl p-6 flex items-start gap-4 shadow-sm">
              <div className="bg-white p-3 rounded-xl shadow-sm shrink-0">
                <UserPlus className="w-6 h-6 text-[var(--primary)]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--primary-900)]">Registrasi Akun Baru</h3>
                <p className="text-sm text-[var(--secondary-600)] mt-1">
                  Tambahkan staf HR atau Administrator baru. Pastikan untuk menetapkan Departemen yang sesuai agar data terorganisir dengan baik.
                </p>
              </div>
            </div>

            {/* FORM INPUT USER */}
            <div className="card-static bg-white rounded-2xl border border-[var(--secondary-200)] shadow-sm overflow-hidden">
              <div className="p-6 border-b border-[var(--secondary-100)] bg-white">
                <h2 className="font-bold text-lg text-[var(--primary-900)] flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[var(--primary)]" />
                  Formulir Data Pengguna
                </h2>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Nama Lengkap */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[var(--secondary-500)] uppercase tracking-wide flex items-center gap-1">
                      <User className="w-3.5 h-3.5" /> Nama Lengkap <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Masukkan nama lengkap"
                      className="w-full px-4 py-3 bg-gray-50 border border-[var(--secondary-200)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--primary-200)] focus:border-[var(--primary)] transition-all font-medium text-sm text-[var(--primary-900)]"
                      required
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[var(--secondary-500)] uppercase tracking-wide flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" /> Alamat Email <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@perusahaan.com"
                      className="w-full px-4 py-3 bg-gray-50 border border-[var(--secondary-200)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--primary-200)] focus:border-[var(--primary)] transition-all font-medium text-sm text-[var(--primary-900)]"
                      required
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[var(--secondary-500)] uppercase tracking-wide flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" /> Password <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="w-full px-4 py-3 bg-gray-50 border border-[var(--secondary-200)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--primary-200)] focus:border-[var(--primary)] transition-all font-medium text-sm text-[var(--primary-900)]"
                      required
                    />
                  </div>

                  {/* Departemen */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[var(--secondary-500)] uppercase tracking-wide flex items-center gap-1">
                      <Building className="w-3.5 h-3.5" /> Departemen / Divisi <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      list="dept-list"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="Contoh: Recruitment, General, IT"
                      className="w-full px-4 py-3 bg-gray-50 border border-[var(--secondary-200)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--primary-200)] focus:border-[var(--primary)] transition-all font-medium text-sm text-[var(--primary-900)]"
                      required
                    />
                    <datalist id="dept-list">
                      <option value="Recruitment" />
                      <option value="General Affairs" />
                      <option value="Human Capital" />
                      <option value="Management" />
                      <option value="IT & Data" />
                    </datalist>
                  </div>
                </div>

                {/* Role / Hak Akses */}
                <div className="space-y-3 pt-4 border-t border-[var(--secondary-100)]">
                  <label className="text-xs font-bold text-[var(--secondary-500)] uppercase tracking-wide flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Hak Akses Sistem <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <label className={`flex-1 cursor-pointer border-2 rounded-xl p-4 transition-all flex items-start gap-3 ${role === 'HR' ? 'border-[var(--primary)] bg-[var(--primary-50)]' : 'border-[var(--secondary-200)] hover:border-[var(--secondary-300)]'}`}>
                      <input 
                        type="radio" 
                        name="role" 
                        value="HR" 
                        checked={role === 'HR'} 
                        onChange={() => setRole('HR')} 
                        className="mt-1 w-4 h-4 text-[var(--primary)] focus:ring-[var(--primary)]"
                      />
                      <div>
                        <div className={`font-bold text-sm ${role === 'HR' ? 'text-[var(--primary-900)]' : 'text-slate-700'}`}>User Staf</div>
                        <div className="text-xs text-[var(--secondary-500)] mt-0.5">Akses ke operasional rekrutmen, penilaian, dan kandidat.</div>
                      </div>
                    </label>

                    <label className={`flex-1 cursor-pointer border-2 rounded-xl p-4 transition-all flex items-start gap-3 ${role === 'SUPER_USER' ? 'border-purple-500 bg-purple-50' : 'border-[var(--secondary-200)] hover:border-[var(--secondary-300)]'}`}>
                      <input 
                        type="radio" 
                        name="role" 
                        value="SUPER_USER" 
                        checked={role === 'SUPER_USER'} 
                        onChange={() => setRole('SUPER_USER')} 
                        className="mt-1 w-4 h-4 text-purple-600 focus:ring-purple-500"
                      />
                      <div>
                        <div className={`font-bold text-sm ${role === 'SUPER_USER' ? 'text-purple-900' : 'text-slate-700'}`}>Administrator (Super User)</div>
                        <div className="text-xs text-[var(--secondary-500)] mt-0.5">Akses penuh termasuk pengaturan tes, manpower, dan manajemen akun.</div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Tombol Submit */}
                <div className="pt-6 flex justify-end">
                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full md:w-auto px-8 py-3.5 bg-[var(--primary)] hover:bg-[var(--primary-700)] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-[var(--primary)]/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <CheckCircle className="w-5 h-5" />
                    )}
                    {isLoading ? "Menyimpan Data..." : "Simpan Pengguna Baru"}
                  </button>
                </div>

              </form>
            </div>

          </div>
        </main>
        
        <Footer />
      </div>
    </div>
  );
}