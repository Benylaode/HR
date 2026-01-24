"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, AlertCircle, Loader2, ArrowRight, ShieldCheck, User as UserIcon } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // PERBAIKAN: Cek apakah token benar-benar ada sebelum disimpan
        if (data.access_token) {
            localStorage.setItem("hr_user", JSON.stringify(data.user));
            localStorage.setItem("hr_token", data.access_token);
            console.log("Login Success, Token Saved:", data.access_token); // Debugging
            router.push("/dashboard");
        } else {
            setError("Token tidak diterima dari server.");
        }
      } else {
        setError(data.error || "Login gagal. Periksa email dan password.");
      }
    } catch (err) {
      console.error(err); // Log error asli
      setError("Tidak dapat terhubung ke server.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#002D40] via-[#004D5A] to-[#003D4A] flex items-center justify-center p-4 md:p-8 overflow-hidden relative">
      
      {/* BACKGROUND ANIMATION LAYER */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      {/* FLOATING STONES/CRYSTALS */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute -bottom-20 -left-20 w-[500px] h-[500px] opacity-60 animate-float-slow">
          <Image src="/images/stone.png" alt="Crystal 1" fill className="object-contain" priority />
        </div>
        <div className="absolute top-10 -right-20 w-80 h-80 opacity-20 blur-sm animate-float-delayed">
          <Image src="/images/stone.png" alt="Crystal 2" fill className="object-contain rotate-90" />
        </div>
      </div>

      {/* LOGIN CARD */}
      <div className="relative w-full max-w-5xl flex flex-col lg:flex-row bg-white/10 backdrop-blur-2xl rounded-[40px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/20 z-10 animate-in fade-in zoom-in duration-700">
        
        {/* Left Side - Branding (Glass Effect) */}
        <div className="hidden lg:flex lg:w-1/2 p-12 flex-col justify-between relative overflow-hidden bg-black/20">
          <div className="relative z-10">
            <Image
              src="/images/logos/ptLogoText.png"
              alt="Logo"
              width={180}
              height={60}
              className="brightness-0 invert drop-shadow-xl"
              unoptimized
            />
          </div>

          <div className="relative z-10">
            <h1 className="text-5xl font-black text-white mb-6 leading-[1.1]">
              Powering the future, <br/>
              <span className="text-teal-400">sustainably.</span>
            </h1>
            <div className="h-1 w-20 bg-teal-500 mb-6"></div>
            <p className="text-blue-100/70 text-lg font-light max-w-sm">
              Sistem Manajemen Rekrutmen Terpadu dengan integrasi kecerdasan buatan.
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-6 grayscale opacity-40">
             <Image src="/images/logos/MBMlogo.png" alt="Partner" width={100} height={40} className="invert" unoptimized />
             <div className="w-px h-6 bg-white/20"></div>
             <Image src="/images/logos/greatness.png" alt="Partner" width={100} height={40} className="invert" unoptimized />
          </div>
        </div>

        {/* Right Side - Login Form (Solid White) */}
        <div className="lg:w-1/2 p-10 lg:p-16 bg-white flex flex-col justify-center">
          <div className="mb-10">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Selamat Datang</h2>
            <p className="text-slate-500 font-medium mt-1">Gunakan kredensial Anda untuk masuk</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-4 mb-6 rounded-2xl flex items-center gap-3 text-sm font-bold animate-shake">
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all text-slate-900 font-medium"
                placeholder="email@company.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all text-slate-900 font-medium pr-14"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-teal-600 text-white py-5 rounded-2xl font-black transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-900/20 uppercase tracking-widest text-xs disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <>Masuk Sekarang <ArrowRight size={18} /></>}
            </button>
          </form>

          {/* DEMO ACCOUNTS SECTION */}
          <div className="mt-12 pt-8 border-t border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-5">Demo Quick Access</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Akun HR (user123) */}
              <button 
                onClick={() => fillDemo("user@gmail.com", "password123")}
                className="flex items-center gap-3 p-4 rounded-2xl border border-teal-100 bg-teal-50/50 hover:bg-teal-50 transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/20 group-hover:rotate-12 transition-transform">
                  <UserIcon size={18} />
                </div>
                <div>
                  <p className="text-[13px] font-black text-slate-900 leading-tight">user123</p>
                  <p className="text-[10px] font-bold text-teal-600 uppercase tracking-tight">HR Staff</p>
                </div>
              </button>

              {/* Akun Super User */}
              <button 
                onClick={() => fillDemo("admin@hrrs.com", "admin123")}
                className="flex items-center gap-3 p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-white shadow-lg shadow-slate-900/20 group-hover:rotate-12 transition-transform">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <p className="text-[13px] font-black text-slate-900 leading-tight">Administrator</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Super User</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}