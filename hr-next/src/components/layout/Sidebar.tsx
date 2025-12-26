"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  FileText,
  BarChart3,
  FileBarChart,
  Settings,
  LogOut,
  Menu,
  X,
  Briefcase,
  Shield,
} from "lucide-react";
import { useState, useEffect } from "react";

interface MenuItem {
  name: string;
  href: string;
  icon: any;
  roles?: string[]; // If undefined, visible to all
}

const menuItems: MenuItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Job Positions", href: "/job-positions", icon: Briefcase },
  { name: "Kandidat", href: "/candidates", icon: Users },
  { name: "Test Management", href: "/test-management", icon: ClipboardList },
  { name: "CV Scanner", href: "/cv-scanner", icon: FileText },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Laporan", href: "/reports", icon: FileBarChart },
  { name: "Settings", href: "/settings", icon: Settings, roles: ["SUPER_USER"] },
];

interface UserData {
  name: string;
  email: string;
  role: string;
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem("hr_user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("hr_user");
    localStorage.removeItem("hr_token");
    router.push("/");
  };

  // Filter menus based on user role
  const filteredMenuItems = menuItems.filter((item) => {
    if (!item.roles) return true; // No role restriction
    if (!user) return false;
    return item.roles.includes(user.role);
  });

  // Get user initials
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Get role display name and color
  const getRoleInfo = (role: string) => {
    switch (role) {
      case "SUPER_USER":
        return { name: "Administrator", color: "bg-purple-100 text-purple-700" };
      case "HR":
        return { name: "HR Staff", color: "bg-blue-100 text-blue-700" };
      default:
        return { name: role, color: "bg-gray-100 text-gray-700" };
    }
  };

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-6">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center rounded-lg">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <div className="ml-3">
            <h1 className="text-lg font-bold text-gray-900">HR System</h1>
            <p className="text-xs text-gray-500">Dashboard</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-8 flex-1 px-4 space-y-1">
          {filteredMenuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`group flex items-center px-3 py-3 text-sm font-medium transition-colors rounded-lg ${
                  isActive
                    ? "bg-blue-50 border-l-4 border-blue-600 text-blue-700"
                    : "text-gray-700 hover:text-blue-700 hover:bg-blue-50"
                }`}
              >
                <Icon
                  className={`mr-3 h-5 w-5 ${
                    isActive
                      ? "text-blue-500"
                      : "text-gray-400 group-hover:text-blue-500"
                  }`}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Profile */}
      <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
        <div className="flex items-center w-full">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center rounded-full">
            <span className="text-white text-sm font-semibold">
              {user ? getInitials(user.name) : "?"}
            </span>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-gray-700">{user?.name || "Loading..."}</p>
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-500 truncate max-w-[100px]">{user?.email}</p>
              {user && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getRoleInfo(user.role).color}`}>
                  {getRoleInfo(user.role).name}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Logout */}
      <div className="border-t border-gray-200 p-4">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-3 py-2 text-gray-700 hover:text-red-600 hover:bg-red-50 transition-colors rounded-lg"
        >
          <LogOut className="mr-3 h-5 w-5" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 z-50">
        <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
          <NavContent />
        </div>
      </aside>

      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-0 left-0 z-50 p-3 bg-gray-50">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="h-12 w-12 inline-flex items-center justify-center text-gray-500 hover:text-gray-900 focus:outline-none"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 flex z-50">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Sidebar */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            {/* Close button */}
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="ml-1 flex items-center justify-center h-10 w-10 text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <NavContent />
          </div>
        </div>
      )}
    </>
  );
}
