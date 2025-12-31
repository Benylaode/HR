"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import {
  Users,
  Briefcase,
  Brain,
  Target,
  ClipboardList,
  BarChart3,
  Trophy,
  Medal,
  ChevronDown,
  Loader2,
  ArrowUpRight,
  TrendingUp,
  FileText
} from "lucide-react";

// URL Backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

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
    if (index === 0) return <Trophy className="w-5 h-5 text-yellow-500 fill-yellow-100" />;
    if (index === 1) return <Medal className="w-5 h-5 text-gray-400 fill-gray-100" />;
    if (index === 2) return <Medal className="w-5 h-5 text-orange-400 fill-orange-100" />;
    return <span className="font-bold text-[var(--secondary)] text-lg">#{index + 1}</span>;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Offer": return "badge badge-success";
      case "Interview": return "badge badge-primary"; 
      case "Psychotest": return "badge badge-secondary"; 
      case "Screening": return "badge badge-warning";
      case "Rejected": return "badge badge-danger";
      default: return "badge badge-secondary";
    }
  };

  // Helper for Stats Card using Global classes
  const StatsCard = ({ title, value, icon: Icon, colorClass, delay }: any) => (
    <div className={`card-static bg-white p-6 rounded-2xl border border-[var(--secondary-200)] hover:border-[var(--primary-200)] transition-colors relative overflow-hidden group animate-in fade-in slide-in-from-bottom-4 duration-500`} style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colorClass}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-[var(--secondary)] uppercase tracking-wide">{title}</p>
        <h3 className="text-3xl font-bold text-[var(--primary-900)] mt-1">{value}</h3>
      </div>
      {/* Decorative gradient overlay */}
      <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-gradient-to-br from-[var(--primary-50)] to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar />
      <div className="lg:ml-64 min-h-screen flex flex-col">
        <Header
          title="Dashboard Overview"
          subtitle="Pantau performa rekrutmen dan hasil seleksi kandidat"
        />
        
        <main className="p-4 md:p-8 flex-1 w-full">
          {/* STATS CARDS - Using Global Vars */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard 
              title="Total Kandidat" 
              value={stats.total_candidates} 
              icon={Users} 
              colorClass="bg-[var(--primary-50)] text-[var(--primary)]"
              delay={0}
            />
            <StatsCard 
              title="Posisi Aktif" 
              value={stats.active_jobs} 
              icon={Briefcase} 
              colorClass="bg-[var(--secondary-50)] text-[var(--secondary)]" 
              delay={100}
            />
            <StatsCard 
              title="Tes Selesai" 
              value={stats.test_taken} 
              icon={ClipboardList} 
              colorClass="bg-[var(--primary-50)] text-[var(--primary)]" 
              delay={200}
            />
            <StatsCard 
              title="Completion Rate" 
              value={stats.completion_rate} 
              icon={TrendingUp} 
              colorClass="bg-[var(--secondary-50)] text-[var(--secondary)]" 
              delay={300}
            />
          </div>

          {/* LEADERBOARD SECTION */}
          <div className="card rounded-3xl mb-8 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="p-6 border-b border-[var(--secondary-100)] flex flex-col md:flex-row justify-between items-center gap-4 bg-gradient-to-r from-[var(--background)] to-white">
              <div>
                <h3 className="text-xl font-bold text-[var(--primary-900)] flex items-center gap-2">
                  <Trophy className="text-[var(--primary)]" size={24} />
                  Top Talent Leaderboard
                </h3>
                <p className="text-sm text-[var(--secondary)] mt-1">Ranking berdasarkan bobot: 40% CV + 60% Psikotes</p>
              </div>
              
              {/* Filter Job */}
              <div className="relative z-10">
                <select 
                  className="appearance-none bg-white border border-[var(--secondary-200)] text-[var(--secondary-700)] py-2.5 px-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] text-sm font-medium shadow-sm cursor-pointer hover:bg-[var(--secondary-50)] transition-colors"
                  value={selectedJob}
                  onChange={handleFilterChange}
                  disabled={loading}
                >
                  {jobs.map(job => (
                    <option key={job.id} value={job.id}>{job.title}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--secondary-400)] pointer-events-none" size={16} />
              </div>
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                 <div className="p-20 text-center">
                    <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-[var(--primary)]" />
                    <p className="text-[var(--secondary)] font-medium">Memproses data kandidat...</p>
                 </div>
              ) : (
                <table className="min-w-full divide-y divide-[var(--secondary-100)]">
                  <thead className="bg-[var(--secondary-50)]">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-[var(--secondary)] uppercase tracking-wider">Rank</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-[var(--secondary)] uppercase tracking-wider">Kandidat</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-[var(--secondary)] uppercase tracking-wider">Posisi Dilamar</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-[var(--secondary)] uppercase tracking-wider">Skor CV</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-[var(--secondary)] uppercase tracking-wider">Skor Tes</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-[var(--secondary)] uppercase tracking-wider">Total</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-[var(--secondary)] uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-[var(--secondary-50)]">
                    {leaderboard.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-16 text-center text-[var(--secondary)]">
                          <div className="flex flex-col items-center justify-center">
                            <div className="w-16 h-16 bg-[var(--secondary-100)] rounded-full flex items-center justify-center mb-4">
                              <Users className="w-8 h-8 text-[var(--secondary-400)]" />
                            </div>
                            <p className="text-lg font-medium text-[var(--primary-900)]">Belum ada data</p>
                            <p className="text-sm text-[var(--secondary)]">Tidak ada kandidat untuk posisi ini.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      leaderboard.map((candidate, index) => (
                        <tr 
                          key={candidate.id} 
                          className="hover:bg-[var(--primary-50)]/30 transition-all duration-200 group"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center justify-center w-8">
                               {getRankIcon(index)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-white
                                ${index < 3 ? 'bg-gradient-to-br from-[var(--primary)] to-[var(--primary-700)]' : 'bg-[var(--secondary-400)]'}`}>
                                {candidate.avatar}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-bold text-[var(--primary-900)] group-hover:text-[var(--primary)] transition-colors">{candidate.name}</div>
                                <div className="text-xs text-[var(--secondary)]">{candidate.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--secondary)] font-medium">
                            {candidate.position}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="badge badge-secondary">
                               {candidate.cvScore}%
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`badge ${candidate.testScore > 0 ? 'badge-primary' : 'badge-secondary'}`}>
                              {candidate.testScore > 0 ? `${candidate.testScore}%` : '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="text-lg font-bold text-[var(--primary)]">{candidate.finalScore}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={getStatusBadge(candidate.status) + " rounded-full px-3 py-1"}>
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
            
            <div className="bg-[var(--background)] px-6 py-4 border-t border-[var(--secondary-100)] flex justify-end backdrop-blur-sm">
              <button 
                onClick={() => router.push("/candidates")} 
                className="text-sm font-semibold text-[var(--primary)] hover:text-[var(--primary-700)] transition-colors flex items-center gap-1 hover:gap-2 duration-300"
              >
                Lihat Semua Kandidat <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Actions - Using Global Colors */}
          <h3 className="text-lg font-bold text-[var(--primary-900)] mb-4 px-1">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { 
                title: "Kelola Soal Tes", 
                desc: "Atur bank soal CFIT, PAPI, & Kraepelin", 
                icon: ClipboardList, 
                href: "/test-management",
                color: "bg-[var(--primary-50)] text-[var(--primary)]"
              },
              { 
                title: "AI CV Scanner", 
                desc: "Upload dan screening CV otomatis dengan AI", 
                icon: Brain, 
                href: "/cv-scanner",
                color: "bg-[var(--secondary-50)] text-[var(--secondary)]" // Monochrome
              },
              { 
                title: "Database Kandidat", 
                desc: "Lihat profil lengkap dan riwayat hasil tes", 
                icon: Users, 
                href: "/candidates",
                color: "bg-[var(--secondary-50)] text-[var(--secondary)]" // Monochrome
              }
            ].map((action, i) => (
              <button 
                key={i}
                onClick={() => router.push(action.href)}
                className="card bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg hover:border-[var(--primary-100)] hover:-translate-y-1 transition-all duration-300 group text-left relative overflow-hidden"
              >
                <div className={`w-14 h-14 ${action.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <action.icon size={24} />
                </div>
                <h4 className="font-bold text-[var(--primary-900)] group-hover:text-[var(--primary)] transition-colors">{action.title}</h4>
                <p className="text-sm text-[var(--secondary)] mt-2 leading-relaxed">{action.desc}</p>
                
                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0 duration-300">
                   <ArrowUpRight className="text-[var(--secondary-300)]" />
                </div>
              </button>
            ))}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}