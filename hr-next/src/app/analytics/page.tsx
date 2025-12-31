"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import {
  BarChart3,
  Users,
  Briefcase,
  CheckCircle,
  TrendingUp,
  Brain,
  Target,
  Award,
  RefreshCw,
} from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

interface Stats {
  total_candidates: number;
  active_jobs: number;
  test_taken: number;
  completion_rate: string;
}

interface LeaderboardEntry {
  id: string;
  name: string;
  position: string;
  cvScore: number;
  testScore: number;
  finalScore: number;
  status: string;
  avatar: string;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem("hr_user");
    if (!userData) {
      router.push("/");
      return;
    }
    setUser(JSON.parse(userData));
    fetchData();
  }, [router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, leaderboardRes] = await Promise.all([
        fetch(`${API_BASE_URL}/dashboard/stats`),
        fetch(`${API_BASE_URL}/dashboard/leaderboard`),
      ]);

      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
      if (leaderboardRes.ok) {
        setLeaderboard(await leaderboardRes.json());
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate score distribution for visualization
  const getScoreDistribution = () => {
    const ranges = [
      { label: "0-40", count: 0, color: "bg-red-500", text: "text-red-600" },
      { label: "41-60", count: 0, color: "bg-yellow-500", text: "text-yellow-600" },
      { label: "61-80", count: 0, color: "bg-[var(--primary)]", text: "text-[var(--primary)]" },
      { label: "81-100", count: 0, color: "bg-green-500", text: "text-green-600" },
    ];

    leaderboard.forEach((entry) => {
      if (entry.finalScore <= 40) ranges[0].count++;
      else if (entry.finalScore <= 60) ranges[1].count++;
      else if (entry.finalScore <= 80) ranges[2].count++;
      else ranges[3].count++;
    });

    return ranges;
  };

  // Get top performers
  const topPerformers = leaderboard.slice(0, 5);
  const scoreDistribution = getScoreDistribution();
  const maxCount = Math.max(...scoreDistribution.map((r) => r.count), 1);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[var(--background)] flex">
      <Sidebar />
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0">


        {/* Header - Consistent Style */}
        <Header 
          title="Analytics Dashboard" 
          subtitle="Insight & Visualisasi Data Rekrutmen"
          onRefresh={fetchData} 
        />

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card-static bg-white p-6 rounded-2xl shadow-sm border border-[var(--secondary-200)]">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[var(--primary-50)] rounded-xl border border-[var(--primary-100)]">
                  <Users className="w-6 h-6 text-[var(--primary)]" />
                </div>
                <div>
                  <p className="text-sm text-[var(--secondary)] font-medium">Total Kandidat</p>
                  <p className="text-3xl font-bold text-[var(--primary-900)]">{stats?.total_candidates || 0}</p>
                </div>
              </div>
            </div>

            <div className="card-static bg-white p-6 rounded-2xl shadow-sm border border-[var(--secondary-200)]">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-50 rounded-xl border border-green-100">
                  <Briefcase className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-[var(--secondary)] font-medium">Posisi Aktif</p>
                  <p className="text-3xl font-bold text-[var(--primary-900)]">{stats?.active_jobs || 0}</p>
                </div>
              </div>
            </div>

            <div className="card-static bg-white p-6 rounded-2xl shadow-sm border border-[var(--secondary-200)]">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[var(--secondary-100)] rounded-xl border border-[var(--secondary-200)]">
                  <Brain className="w-6 h-6 text-[var(--secondary-600)]" />
                </div>
                <div>
                  <p className="text-sm text-[var(--secondary)] font-medium">Test Diambil</p>
                  <p className="text-3xl font-bold text-[var(--primary-900)]">{stats?.test_taken || 0}</p>
                </div>
              </div>
            </div>

            <div className="card-static bg-white p-6 rounded-2xl shadow-sm border border-[var(--secondary-200)]">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-50 rounded-xl border border-orange-100">
                  <Target className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-[var(--secondary)] font-medium">Completion Rate</p>
                  <p className="text-3xl font-bold text-[var(--primary-900)]">{stats?.completion_rate || "0%"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Score Distribution Bar Chart */}
            <div className="card-static bg-white p-6 rounded-2xl shadow-sm border border-[var(--secondary-200)]">
              <h3 className="text-lg font-bold text-[var(--primary-900)] mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[var(--primary)]" />
                Distribusi Skor Kandidat
              </h3>
              <div className="space-y-5">
                {scoreDistribution.map((range) => (
                  <div key={range.label} className="flex items-center gap-4">
                    <span className="text-sm font-bold text-[var(--secondary-600)] w-16 text-right">{range.label}</span>
                    <div className="flex-1 bg-[var(--secondary-50)] rounded-full h-8 overflow-hidden border border-[var(--secondary-100)]">
                      <div
                        className={`h-full ${range.color} rounded-full flex items-center justify-end pr-3 transition-all duration-700 ease-out`}
                        style={{ width: `${(range.count / maxCount) * 100}%` }}
                      >
                        {range.count > 0 && (
                          <span className="text-white text-xs font-bold drop-shadow-sm">{range.count}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex justify-center gap-4 md:gap-8 text-xs flex-wrap">
                <span className="flex items-center gap-2 text-[var(--secondary-600)]">
                  <span className="w-3 h-3 bg-red-500 rounded-full"></span> Rendah
                </span>
                <span className="flex items-center gap-2 text-[var(--secondary-600)]">
                  <span className="w-3 h-3 bg-yellow-500 rounded-full"></span> Sedang
                </span>
                <span className="flex items-center gap-2 text-[var(--secondary-600)]">
                  <span className="w-3 h-3 bg-[var(--primary)] rounded-full"></span> Baik
                </span>
                <span className="flex items-center gap-2 text-[var(--secondary-600)]">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span> Sangat Baik
                </span>
              </div>
            </div>

            {/* Top Performers */}
            <div className="card-static bg-white p-6 rounded-2xl shadow-sm border border-[var(--secondary-200)]">
              <h3 className="text-lg font-bold text-[var(--primary-900)] mb-6 flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-500" />
                Top 5 Performers
              </h3>
              {topPerformers.length > 0 ? (
                <div className="space-y-3">
                  {topPerformers.map((entry, index) => (
                    <div
                      key={entry.id}
                      className="flex items-center gap-4 p-4 bg-[var(--background)] rounded-xl border border-[var(--secondary-100)] hover:border-[var(--primary-200)] hover:shadow-sm transition-all"
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${
                          index === 0
                            ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                            : index === 1
                            ? "bg-gray-200 text-gray-700 border border-gray-300"
                            : index === 2
                            ? "bg-orange-100 text-orange-700 border border-orange-200"
                            : "bg-[var(--primary-50)] text-[var(--primary)] border border-[var(--primary-100)]"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[var(--primary-900)] truncate">{entry.name}</p>
                        <p className="text-xs text-[var(--secondary)] truncate font-medium">{entry.position}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-[var(--primary-900)]">{entry.finalScore}</p>
                        <p className="text-[10px] text-[var(--secondary-500)] uppercase font-bold tracking-wide">Final Score</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-[var(--secondary-300)]">
                  <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-sm font-medium">Belum ada data kandidat</p>
                </div>
              )}
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="card-static bg-white p-6 rounded-2xl shadow-sm border border-[var(--secondary-200)]">
            <h3 className="text-lg font-bold text-[var(--primary-900)] mb-6">Breakdown Skor per Kandidat</h3>
            <div className="overflow-x-auto rounded-xl border border-[var(--secondary-100)]">
              <table className="w-full text-sm">
                <thead className="bg-[var(--secondary-50)] text-[var(--secondary-500)] uppercase text-xs font-bold border-b border-[var(--secondary-100)]">
                  <tr>
                    <th className="px-6 py-4 text-left">Kandidat</th>
                    <th className="px-6 py-4 text-left">Posisi</th>
                    <th className="px-6 py-4 text-center">CV Score</th>
                    <th className="px-6 py-4 text-center">Test Score</th>
                    <th className="px-6 py-4 text-center">Final Score</th>
                    <th className="px-6 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--secondary-50)]">
                  {leaderboard.length > 0 ? (
                    leaderboard.map((entry) => (
                      <tr key={entry.id} className="hover:bg-[var(--primary-50)]/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-xs font-bold shadow-sm">
                              {entry.avatar}
                            </div>
                            <span className="font-bold text-[var(--primary-900)]">{entry.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[var(--secondary)] font-medium">{entry.position}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-2.5 py-1 bg-[var(--secondary-100)] text-[var(--secondary-700)] rounded-lg font-bold text-xs border border-[var(--secondary-200)]">
                            {entry.cvScore}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-2.5 py-1 bg-[var(--secondary-100)] text-[var(--secondary-700)] rounded-lg font-bold text-xs border border-[var(--secondary-200)]">
                            {entry.testScore}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`px-3 py-1 rounded-full font-bold text-xs border ${
                              entry.finalScore >= 80
                                ? "bg-green-50 text-green-700 border-green-200"
                                : entry.finalScore >= 60
                                ? "bg-[var(--primary-50)] text-[var(--primary)] border-[var(--primary-200)]"
                                : "bg-yellow-50 text-yellow-700 border-yellow-200"
                            }`}
                          >
                            {entry.finalScore}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-2.5 py-1 bg-[var(--secondary-50)] text-[var(--secondary-600)] rounded-lg text-xs font-semibold border border-[var(--secondary-200)]">
                            {entry.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-[var(--secondary)] italic">
                        Belum ada data untuk ditampilkan
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
