"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem("hr_user");
    if (!userData) {
      router.push("/");
      return;
    }
    setUser(JSON.parse(userData));
  }, [router]);

  if (!user) return null;

  const stats = [
    {
      title: "Total Kandidat",
      value: "156",
      subtitle: "12 baru minggu ini",
      icon: Users,
      gradient: "from-blue-500 to-blue-600",
      subtitleColor: "text-green-600",
    },
    {
      title: "Posisi Aktif",
      value: "8",
      subtitle: "3 test links aktif",
      icon: Briefcase,
      gradient: "from-green-500 to-green-600",
      subtitleColor: "text-blue-600",
    },
    {
      title: "Test Diambil",
      value: "89",
      subtitle: "72 selesai",
      icon: Brain,
      gradient: "from-purple-500 to-purple-600",
      subtitleColor: "text-purple-600",
    },
    {
      title: "Completion Rate",
      value: "81%",
      subtitle: "17 pending",
      icon: Target,
      gradient: "from-orange-500 to-orange-600",
      subtitleColor: "text-orange-600",
    },
  ];

  const recentActivity = [
    {
      text: "Ahmad Rizki completed CFIT test",
      time: "2 hours ago",
      color: "bg-green-500",
    },
    {
      text: "New candidate application received",
      time: "4 hours ago",
      color: "bg-blue-500",
    },
    {
      text: "Test link generated for Siti Nurhaliza",
      time: "Yesterday",
      color: "bg-yellow-500",
    },
    {
      text: "DISC test completed by Budi Santoso",
      time: "Yesterday",
      color: "bg-purple-500",
    },
    {
      text: "New position created: UI/UX Designer",
      time: "2 days ago",
      color: "bg-indigo-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:ml-64">
        <Header
          title="Dashboard HR"
          subtitle="Kelola kandidat, analisis DISC, dan temukan talenta terbaik"
          userName={user.name}
          userEmail={user.email}
        />
        <main className="p-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat) => (
              <div
                key={stat.title}
                className="bg-white overflow-hidden shadow border border-gray-200 hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div
                        className={`w-10 h-10 bg-gradient-to-br ${stat.gradient} flex items-center justify-center`}
                      >
                        <stat.icon className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div className="ml-4 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          {stat.title}
                        </dt>
                        <dd className="text-2xl font-bold text-gray-900">
                          {stat.value}
                        </dd>
                      </dl>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center text-sm">
                      <span className={`${stat.subtitleColor} font-medium`}>
                        {stat.subtitle}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Kandidat Growth */}
            <div className="bg-white shadow border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Kandidat Growth
              </h3>
              <div className="h-64 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2" />
                  <p>Real-time data akan ditampilkan di sini</p>
                </div>
              </div>
            </div>

            {/* Test Performance */}
            <div className="bg-white shadow border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Test Performance
              </h3>
              <div className="h-64 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <BarChart3 className="w-8 h-8 mx-auto mb-2" />
                  <p>Analytics data integration dalam progress</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions and Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <div className="bg-white shadow border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => router.push("/test-management")}
                  className="w-full btn-secondary text-left flex items-center gap-3 hover:translate-x-1 transition-transform"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <ClipboardList size={16} className="text-white" />
                  </div>
                  <span>Manage Test Categories</span>
                </button>
                <button
                  onClick={() => router.push("/candidates")}
                  className="w-full btn-secondary text-left flex items-center gap-3 hover:translate-x-1 transition-transform"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                    <Users size={16} className="text-white" />
                  </div>
                  <span>View Candidates</span>
                </button>
                <button
                  onClick={() => router.push("/cv-scanner")}
                  className="w-full btn-secondary text-left flex items-center gap-3 hover:translate-x-1 transition-transform"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                    <Brain size={16} className="text-white" />
                  </div>
                  <span>CV Scanner</span>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white shadow border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Recent Activity
              </h3>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center gap-3 text-sm">
                    <div className={`w-2 h-2 ${activity.color}`} />
                    <span className="text-gray-600 flex-1">{activity.text}</span>
                    <span className="text-gray-400 whitespace-nowrap">
                      {activity.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
