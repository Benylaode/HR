"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import {
  Users,
  Briefcase,
  Brain,
  Target,
  ClipboardList,
  TrendingUp,
  BarChart3,
  Trophy,
  Medal,
  Star,
  ChevronDown,
  Loader2
} from "lucide-react";

// URL Backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// const API_BASE_URL = "http://localhost:5000";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [stats, setStats] = useState({
    total_candidates: 0,
    active_jobs: 0,
    test_taken: 0,
    completion_rate: "0%"
  });
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState("all");

  useEffect(() => {
    const userData = localStorage.getItem("hr_user");
    if (!userData) {
      router.push("/");
      return;
    }
    setUser(JSON.parse(userData));
    
    fetchDashboardData();
  }, [router]);

  // Fetch Data Gabungan
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Stats
      const statsRes = await fetch(`${API_BASE_URL}/dashboard/stats`);
      if (statsRes.ok) setStats(await statsRes.json());

      // 2. Fetch Jobs (Untuk Filter)
      const jobsRes = await fetch(`${API_BASE_URL}/job-positions?status=active`);
      if (jobsRes.ok) {
         const jobsData = await jobsRes.json();
         setJobs([{ id: "all", title: "Semua Posisi" }, ...jobsData]);
      }

      // 3. Fetch Leaderboard Awal
      await fetchLeaderboard("all");

    } catch (error) {
      console.error("Error fetching dashboard data", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch Leaderboard saat filter berubah
  const fetchLeaderboard = async (jobId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/dashboard/leaderboard?job_id=${jobId}`);
      if (res.ok) {
        setLeaderboard(await res.json());
      }
    } catch (error) {
      console.error("Error fetching leaderboard", error);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newJobId = e.target.value;
    setSelectedJob(newJobId);
    fetchLeaderboard(newJobId);
  };

  if (!user) return null;

  // Helper UI
  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-6 h-6 text-yellow-500 fill-yellow-100" />;
    if (index === 1) return <Medal className="w-6 h-6 text-gray-400 fill-gray-100" />;
    if (index === 2) return <Medal className="w-6 h-6 text-orange-400 fill-orange-100" />;
    return <span className="font-bold text-gray-500 text-lg">#{index + 1}</span>;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Offer": return "bg-green-100 text-green-700 border-green-200";
      case "Interview": return "bg-blue-100 text-blue-700 border-blue-200";
      case "Psychotest": return "bg-purple-100 text-purple-700 border-purple-200";
      case "Screening": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "Rejected": return "bg-red-50 text-red-600 border-red-100";
      default: return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:ml-64">
        <Header
          title="Dashboard HR"
          subtitle="Overview rekrutmen, hasil tes, dan ranking kandidat"
          userName={user.name}
          userEmail={user.email}
        />
        
        <main className="p-6">
          {/* STATS CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
               <div>
                  <p className="text-sm text-gray-500 font-medium">Total Kandidat</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total_candidates}</p>
               </div>
               <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                  <Users size={24} />
               </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
               <div>
                  <p className="text-sm text-gray-500 font-medium">Posisi Aktif</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.active_jobs}</p>
               </div>
               <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center text-green-600">
                  <Briefcase size={24} />
               </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
               <div>
                  <p className="text-sm text-gray-500 font-medium">Test Diambil</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.test_taken}</p>
               </div>
               <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600">
                  <Brain size={24} />
               </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
               <div>
                  <p className="text-sm text-gray-500 font-medium">Completion Rate</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.completion_rate}</p>
               </div>
               <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600">
                  <Target size={24} />
               </div>
            </div>
          </div>

          {/* LEADERBOARD SECTION */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm mb-8 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Trophy className="text-yellow-500" />
                  Top Talent Leaderboard
                </h3>
                <p className="text-sm text-gray-500">Ranking kombinasi skor CV (40%) & Psikotes (60%)</p>
              </div>
              
              {/* Filter Job */}
              <div className="relative">
                <select 
                  className="appearance-none bg-gray-50 border border-gray-300 text-gray-700 py-2.5 px-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium"
                  value={selectedJob}
                  onChange={handleFilterChange}
                  disabled={loading}
                >
                  {jobs.map(job => (
                    <option key={job.id} value={job.id}>{job.title}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              </div>
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                 <div className="p-12 text-center text-gray-500">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
                    Memuat data leaderboard...
                 </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Rank</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Kandidat</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Posisi</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">CV Score</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Test Score</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Final Score</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {leaderboard.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                          Belum ada kandidat atau data tes untuk posisi ini.
                        </td>
                      </tr>
                    ) : (
                      leaderboard.map((candidate, index) => (
                        <tr 
                          key={candidate.id} 
                          className={`hover:bg-blue-50/50 transition-colors ${index < 3 ? 'bg-gradient-to-r from-white to-gray-50' : ''}`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center justify-center w-8">
                               {getRankIcon(index)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm
                                ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-400' : 'bg-blue-500'}`}>
                                {candidate.avatar}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-bold text-gray-900">{candidate.name}</div>
                                <div className="text-xs text-gray-500">ID: {candidate.id.substring(0,6)}...</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {candidate.position}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-semibold border border-gray-200">
                              {candidate.cvScore}%
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border
                              ${candidate.testScore > 0 ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                              {candidate.testScore > 0 ? `${candidate.testScore}%` : '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <Star size={16} className={`${index < 3 ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />
                              <span className="text-lg font-bold text-gray-900">{candidate.finalScore}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(candidate.status)}`}>
                              {candidate.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
            
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 text-right">
              <button onClick={() => router.push("/candidates")} className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
                Lihat Detail Semua Kandidat &rarr;
              </button>
            </div>
          </div>

          {/* Quick Actions (Bawah) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button 
              onClick={() => router.push("/test-management")}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all group text-left"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
                <ClipboardList size={20} />
              </div>
              <h4 className="font-semibold text-gray-900">Kelola Soal Tes</h4>
              <p className="text-sm text-gray-500 mt-1">Atur bank soal CFIT, PAPI, & Kraepelin.</p>
            </button>
            
            <button 
              onClick={() => router.push("/cv-scanner")}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all group text-left"
            >
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 mb-4 group-hover:scale-110 transition-transform">
                <Brain size={20} />
              </div>
              <h4 className="font-semibold text-gray-900">AI CV Scanner</h4>
              <p className="text-sm text-gray-500 mt-1">Upload dan screening CV otomatis.</p>
            </button>

            <button 
              onClick={() => router.push("/candidates")}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all group text-left"
            >
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600 mb-4 group-hover:scale-110 transition-transform">
                <Users size={20} />
              </div>
              <h4 className="font-semibold text-gray-900">Database Kandidat</h4>
              <p className="text-sm text-gray-500 mt-1">Lihat profil lengkap dan riwayat tes.</p>
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}