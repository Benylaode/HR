"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { UserPlus, Eye, EyeOff, AlertCircle, Loader2, CheckCircle, ArrowLeft, ArrowRight } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem("hr_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Password tidak cocok");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password minimal 6 karakter");
      return;
    }

    setLoading(true);

    try {
      // PERBAIKAN FETCH: Menyesuaikan payload dengan kebutuhan backend
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: "HR", // Default role sesuai permintaan Anda
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        // Redirect ke login setelah 2 detik
        setTimeout(() => router.push("/"), 2000);
      } else {
        setError(data.error || "Registrasi gagal. Coba lagi.");
      }
    } catch (err) {
      setError("Tidak dapat terhubung ke server.");
    } finally {
      setLoading(false);
    }
  };

  // SUCCESS STATE VIEW (DESIGN ASLI)
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#002D40] via-[#004D5A] to-[#003D4A] flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-12 text-center max-w-md border border-white/20">
          <div className="mx-auto w-20 h-20 bg-gradient-to-r from-teal-400 to-lime-400 flex items-center justify-center mb-6 rounded-full">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Registrasi Berhasil!</h2>
          <p className="text-white/70 mb-6">Mengalihkan ke halaman login...</p>
          <Loader2 className="animate-spin mx-auto text-teal-400" size={28} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#002D40] via-[#004D5A] to-[#003D4A] flex items-center justify-center p-4 md:p-8 overflow-hidden relative">
      
      {/* Background Pattern (DESIGN ASLI) */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      {/* Animated Stones/Crystals (DESIGN ASLI) */}
      <div className="absolute bottom-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -bottom-[10%] -left-[10%] w-[45vw] h-[45vw] max-w-[600px] max-h-[600px] opacity-90 animate-float-slow">
          <Image src="/images/stone.png" alt="Stone" fill className="object-contain" priority />
        </div>
        <div className="absolute top-10 right-10 w-96 h-96 opacity-30 blur-[2px] animate-float-delayed">
          <Image src="/images/merdeka_emblem.png" alt="Emblem" fill className="object-contain rotate-45" />
        </div>
      </div>

      <div className="relative w-full max-w-5xl flex flex-col lg:flex-row bg-white/10 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl border border-white/20 z-10">
        
        {/* Left Side - Branding (DESIGN ASLI) */}
        <div className="hidden lg:flex lg:w-1/2 p-8 lg:p-12 flex-col justify-between relative overflow-hidden bg-[#0A1A2F]">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0d9488]/20 to-transparent z-0"></div>
          <div className="relative z-10">
            <Image src="/images/logos/ptLogoText.png" alt="Logo" width={180} height={60} className="h-14 w-auto brightness-0 invert drop-shadow-lg" unoptimized />
          </div>
          <div className="relative z-10 my-10 lg:my-0">
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight drop-shadow-md">
              Registrasi <br/> <span className="text-teal-400">Akun HR</span>
            </h1>
            <p className="text-blue-100/80 text-lg font-light max-w-md border-l-4 border-teal-500 pl-4">
              HR Recruitment System<br/> <span className="text-sm opacity-70">Akses Platform Manajemen Kandidat</span>
            </p>
          </div>
          <div className="relative z-10 hidden lg:flex items-center gap-6">
            <Image src="/images/logos/MBMlogo.png" alt="MBM" width={120} height={48} className="h-10 w-auto brightness-0 invert" unoptimized />
            <div className="h-8 w-px bg-white/20"></div>
            <Image src="/images/logos/greatness.png" alt="Greatness" width={120} height={48} className="h-12 w-auto brightness-0 invert" unoptimized />
          </div>
        </div>

        {/* Right Side - Register Form (DESIGN ASLI) */}
        <div className="lg:w-1/2 p-8 lg:p-12 bg-white w-full">
          <div className="lg:hidden mb-6 flex justify-center">
            <Image src="/images/logos/ptLogoText.png" alt="Logo Mobile" width={160} height={50} className="h-10 w-auto object-contain" unoptimized />
          </div>

          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-teal-600 mb-6 transition-colors font-medium">
            <ArrowLeft size={16} /> Kembali ke Login
          </Link>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Buat Akun Baru</h2>
            <p className="text-gray-500 mt-1 font-medium">Isi data berikut untuk mendaftar</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 mb-6 rounded-xl flex items-center gap-2 text-sm font-semibold">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Nama Lengkap</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all font-medium" placeholder="John Doe" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all font-medium" placeholder="email@company.com" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all pr-12 font-medium" placeholder="Minimal 6 karakter" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Konfirmasi Password</label>
              <input type={showPassword ? "text" : "password"} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all font-medium" placeholder="Ulangi password" />
            </div>

            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white py-4 px-6 font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-wider shadow-lg shadow-teal-500/25 mt-6 active:scale-95">
              {loading ? (
                <> <Loader2 className="animate-spin" size={18} /> Memproses... </>
              ) : (
                <> <UserPlus size={18} /> Daftar <ArrowRight size={18} /> </>
              )}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-gray-600">
            Sudah punya akun?{" "}
            <Link href="/" className="text-teal-600 hover:text-teal-700 font-bold">Masuk di sini →</Link>
          </p>
        </div>
      </div>

      {/* Mobile Partner Logos (DESIGN ASLI) */}
      <div className="lg:hidden absolute bottom-6 left-0 right-0 flex justify-center gap-6">
        <Image src="/images/logos/MBMlogo.png" alt="MBM Logo" width={60} height={24} className="h-5 w-auto opacity-40 invert" unoptimized />
        <Image src="/images/logos/greatness.png" alt="Greatness Logo" width={60} height={24} className="h-5 w-auto opacity-40 invert" unoptimized />
      </div>
    </div>
  );
}