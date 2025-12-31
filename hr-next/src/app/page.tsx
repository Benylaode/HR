"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, AlertCircle, Loader2, ArrowRight } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
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
        localStorage.setItem("hr_user", JSON.stringify(data.user));
        localStorage.setItem("hr_token", data.access_token);
        router.push("/dashboard");
      } else {
        setError(data.error || "Login gagal. Periksa email dan password.");
      }
    } catch (err) {
      setError("Tidak dapat terhubung ke server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#002D40] via-[#004D5A] to-[#003D4A] flex items-center justify-center p-4 md:p-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

       {/* Animated Stones/Crystals - Background Layer */}
        <div className="absolute bottom-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          {/* Primary Stone - Floating Bottom Left */}
          <div className="absolute -bottom-[10%] -left-[10%] w-[45vw] h-[45vw] max-w-[600px] max-h-[600px] opacity-90 animate-float-slow">
            <Image
              src="/images/stone.png"
              alt="Merdeka Crystal"
              fill
              className="object-contain"
              priority
            />
          </div>

           {/* Secondary Stone - Blurred Top Right */}
          <div className="absolute top-10 right-10 w-96 h-96 opacity-30 blur-[2px] animate-float-delayed">
             <Image
              src="/images/stone.png"
              alt="Merdeka Crystal Blur"
              fill
              className="object-contain rotate-45"
            />
          </div>
        </div>

      <div className="relative w-full max-w-5xl flex flex-col lg:flex-row bg-white/10 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl border border-white/20 z-10">
        {/* Left Side - Branding (Desktop Only) */}
        <div className="hidden lg:flex lg:w-1/2 p-8 lg:p-12 flex-col justify-between relative overflow-hidden bg-[#0A1A2F]">
          {/* Background Gradient & Effects - Inside Card */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0d9488]/20 to-transparent z-0"></div>

          {/* Logo */}
          <div className="relative z-10">
            <Image
              src="/images/logos/ptLogoText.png"
              alt="Company Logo"
              width={180}
              height={60}
              className="h-14 w-auto brightness-0 invert drop-shadow-lg"
              unoptimized
            />
          </div>

          {/* Hero Text */}
          <div className="relative z-10 my-10 lg:my-0">
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight drop-shadow-md">
              Powering the future, <br/>
              <span className="text-teal-400">sustainably</span>
            </h1>
            <p className="text-blue-100/80 text-lg font-light max-w-md border-l-4 border-teal-500 pl-4">
              HR Recruitment System<br/>
              <span className="text-sm opacity-70">Platform Manajemen Kandidat</span>
            </p>
          </div>

          {/* Partner Logos */}
          <div className="relative z-10 hidden lg:flex items-center gap-6">
            <div className="opacity-80 hover:opacity-100 transition-opacity" title="Merdeka Battery Materials">
              <Image
                src="/images/logos/MBMlogo.png"
                alt="MBM Logo"
                width={120}
                height={48}
                className="h-10 w-auto brightness-0 invert"
                unoptimized
              />
            </div>
            <div className="h-8 w-px bg-white/20"></div>
            <div className="opacity-80 hover:opacity-100 transition-opacity" title="Greatness">
              <Image
                src="/images/logos/greatness.png"
                alt="Greatness Logo"
                width={120}
                height={48}
                className="h-12 w-auto brightness-0 invert"
                unoptimized
              />
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="lg:w-1/2 p-8 lg:p-12 bg-white w-full">
          {/* Mobile Logo Name */}
          <div className="lg:hidden mb-8 flex justify-center">
             <Image
              src="/images/logos/ptLogoText.png"
              alt="Company Logo"
              width={160}
              height={50}
              className="h-10 w-auto object-contain"
              unoptimized
            />
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Selamat Datang</h2>
            <p className="text-gray-500 mt-1">Masuk ke akun Anda untuk melanjutkan</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 mb-6 rounded-xl flex items-center gap-2 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
                placeholder="email@company.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all pr-12"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="mr-2 w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <label htmlFor="remember" className="text-sm text-gray-600">
                  Ingat saya
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white py-4 px-6 font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-wider shadow-lg shadow-teal-500/25"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Memproses...
                </>
              ) : (
                <>
                  Masuk
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Register Link */}
          <p className="text-center mt-6 text-sm text-gray-600">
            Belum punya akun?{" "}
            <Link href="/register" className="text-teal-600 hover:text-teal-700 font-semibold">
              Daftar sekarang →
            </Link>
          </p>

          {/* Demo Credentials */}
          <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">Demo Login</p>
            <p className="font-mono text-sm text-gray-700">
              admin@hrrs.com / admin123
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Partner Logos */}
      <div className="lg:hidden absolute bottom-6 left-0 right-0 flex justify-center gap-6">
        <Image
          src="/images/logos/MBMlogo.png"
          alt="MBM Logo"
          width={60}
          height={24}
          className="h-5 w-auto opacity-40"
          unoptimized
        />
        <Image
          src="/images/logos/greatness.png"
          alt="Greatness Logo"
          width={60}
          height={24}
          className="h-5 w-auto opacity-40"
          unoptimized
        />
      </div>
    </div>
  );
}
