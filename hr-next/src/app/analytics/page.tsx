"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
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
      { label: "0-40", count: 0, color: "bg-red-500" },
      { label: "41-60", count: 0, color: "bg-yellow-500" },
      { label: "61-80", count: 0, color: "bg-blue-500" },
      { label: "81-100", count: 0, color: "bg-green-500" },
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
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="px-6 h-16 flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-blue-600" />
                Analytics Dashboard
              </h1>
              <p className="text-xs text-gray-500">Insight & Visualisasi Data Rekrutmen</p>
            </div>
            <button
              onClick={fetchData}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Kandidat</p>
                  <p className="text-3xl font-bold text-gray-900">{stats?.total_candidates || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-xl">
                  <Briefcase className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Posisi Aktif</p>
                  <p className="text-3xl font-bold text-gray-900">{stats?.active_jobs || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Brain className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Test Diambil</p>
                  <p className="text-3xl font-bold text-gray-900">{stats?.test_taken || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-xl">
                  <Target className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Completion Rate</p>
                  <p className="text-3xl font-bold text-gray-900">{stats?.completion_rate || "0%"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Score Distribution Bar Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Distribusi Skor Kandidat
              </h3>
              <div className="space-y-4">
                {scoreDistribution.map((range) => (
                  <div key={range.label} className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-600 w-16">{range.label}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-8 overflow-hidden">
                      <div
                        className={`h-full ${range.color} rounded-full flex items-center justify-end pr-3 transition-all duration-500`}
                        style={{ width: `${(range.count / maxCount) * 100}%` }}
                      >
                        {range.count > 0 && (
                          <span className="text-white text-xs font-bold">{range.count}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-center gap-6 text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-red-500 rounded"></span> Rendah
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-yellow-500 rounded"></span> Sedang
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-blue-500 rounded"></span> Baik
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-green-500 rounded"></span> Sangat Baik
                </span>
              </div>
            </div>

            {/* Top Performers */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-500" />
                Top 5 Performers
              </h3>
              {topPerformers.length > 0 ? (
                <div className="space-y-3">
                  {topPerformers.map((entry, index) => (
                    <div
                      key={entry.id}
                      className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0
                            ? "bg-yellow-100 text-yellow-700"
                            : index === 1
                            ? "bg-gray-200 text-gray-700"
                            : index === 2
                            ? "bg-orange-100 text-orange-700"
                            : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{entry.name}</p>
                        <p className="text-xs text-gray-500 truncate">{entry.position}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">{entry.finalScore}</p>
                        <p className="text-[10px] text-gray-500 uppercase">Final Score</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-400">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Belum ada data kandidat</p>
                </div>
              )}
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Breakdown Skor per Kandidat</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3 text-left">Kandidat</th>
                    <th className="px-4 py-3 text-left">Posisi</th>
                    <th className="px-4 py-3 text-center">CV Score</th>
                    <th className="px-4 py-3 text-center">Test Score</th>
                    <th className="px-4 py-3 text-center">Final Score</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {leaderboard.length > 0 ? (
                    leaderboard.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                              {entry.avatar}
                            </div>
                            <span className="font-medium text-gray-900">{entry.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{entry.position}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded font-medium">
                            {entry.cvScore}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded font-medium">
                            {entry.testScore}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`px-3 py-1 rounded-full font-bold ${
                              entry.finalScore >= 80
                                ? "bg-green-100 text-green-700"
                                : entry.finalScore >= 60
                                ? "bg-blue-100 text-blue-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {entry.finalScore}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                            {entry.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                        Belum ada data untuk ditampilkan
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
