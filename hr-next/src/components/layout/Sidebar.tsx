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
  User,
  Power,
  ClipboardCheck
} from "lucide-react";
import { useState, useEffect } from "react";
import Image from "next/image";

interface MenuItem {
  name: string;
  href: string;
  icon: any;
  roles?: string[];
}

const menuItems: MenuItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Job Positions", href: "/job-positions", icon: Briefcase },
  { name: "ATA Tracking", href: "/ata-tracking", icon: ClipboardCheck },
  { name: "Kandidat", href: "/candidates", icon: Users },
  { name: "Test Management", href: "/test-management", icon: ClipboardList },
  { name: "CV Scanner", href: "/cv-scanner", icon: FileText },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Laporan", href: "/reports", icon: FileBarChart },
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

  const filteredMenuItems = menuItems.filter((item) => {
    if (!item.roles) return true;
    if (!user) return false;
    return item.roles.includes(user.role);
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const NavContent = () => (
    <div className="flex flex-col h-full bg-white text-[var(--foreground)] border-r border-[var(--secondary-100)]">
      {/* Logo Section - Only Desktop */}
      <div className="hidden lg:flex p-6 items-center justify-center border-b border-[var(--secondary-50)]">
        <Image 
          src="/images/logos/ptLogoText.png" 
          alt="Company Logo" 
          width={150}
          height={40}
          className="h-10 w-auto object-contain"
          unoptimized
        />
      </div>

      {/* Navigation - Pushes Content Down */}
      <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
        <div className="text-xs font-semibold text-[var(--secondary-400)] uppercase tracking-widest px-3 mb-4">
          Main Menu
        </div>
        {filteredMenuItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`group flex items-center px-4 py-3 text-sm font-medium transition-all duration-200 rounded-xl relative overflow-hidden ${
                isActive
                  ? "bg-[var(--primary-50)] text-[var(--primary)] shadow-sm"
                  : "text-[var(--secondary)] hover:bg-[var(--secondary-50)] hover:text-[var(--primary-700)]"
              }`}
            >
              {isActive && (
                 <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--primary)]" />
              )}
              
              <Icon
                className={`mr-3 h-5 w-5 transition-colors ${
                  isActive ? "text-[var(--primary)]" : "text-[var(--secondary-400)] group-hover:text-[var(--primary)]"
                }`}
              />
              <span className="tracking-wide relative z-10">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile - Always at Bottom */}
      <div className="p-4 border-t border-[var(--secondary-100)] bg-[var(--secondary-50)]/30 mt-auto">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-10 h-10 rounded-full bg-[var(--primary)] flex items-center justify-center shadow-md shadow-teal-500/20 text-white font-bold text-sm">
            {user ? getInitials(user.name) : "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[var(--primary-900)] truncate leading-tight">
              {user?.name || "Guest"}
            </p>
            <p className="text-xs text-[var(--secondary)] truncate mt-0.5">
              {user?.role === "SUPER_USER" ? "Administrator" : "HR Staff"}
            </p>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="flex items-center justify-center w-full px-4 py-2.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 rounded-lg transition-all group"
        >
          <Power className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
          LOGOUT
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 z-50 bg-white">
        <NavContent />
      </aside>

      {/* Mobile Menu Trigger - Floating Clean */}
      <div className="lg:hidden fixed top-0 left-0 z-50 p-4">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 -ml-2 text-[var(--secondary-700)] hover:text-[var(--primary)] transition-colors"
          aria-label="Open Menu"
        >
          <Menu className="h-7 w-7" />
        </button>
      </div>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 flex z-50">
          <div
            className="fixed inset-0 bg-[var(--secondary-900)]/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-2xl transform transition-transform animate-slide-right">
            
            {/* Mobile Sidebar Header with Close Button */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--secondary-100)] bg-white">
               <div className="flex items-center justify-center flex-1">
                  <Image 
                    src="/images/logos/ptLogoText.png" 
                    alt="Company Logo" 
                    width={120}
                    height={32}
                    className="h-8 w-auto object-contain"
                    unoptimized
                  />
               </div>
               <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 -mr-2 text-[var(--secondary-400)] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                aria-label="Close Menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Reuse NavContent but without the Logo section since we added a custom header above */}
            <div className="flex-1 overflow-y-auto">
               <nav className="px-4 py-6 space-y-2">
                <div className="text-xs font-semibold text-[var(--secondary-400)] uppercase tracking-widest px-3 mb-4">
                  Main Menu
                </div>
                {filteredMenuItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  const Icon = item.icon;
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`group flex items-center px-4 py-3 text-sm font-medium transition-all duration-200 rounded-xl relative overflow-hidden ${
                        isActive
                          ? "bg-[var(--primary-50)] text-[var(--primary)] shadow-sm"
                          : "text-[var(--secondary)] hover:bg-[var(--secondary-50)] hover:text-[var(--primary-700)]"
                      }`}
                    >
                      {isActive && (
                         <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--primary)]" />
                      )}
                      
                      <Icon
                        className={`mr-3 h-5 w-5 transition-colors ${
                          isActive ? "text-[var(--primary)]" : "text-[var(--secondary-400)] group-hover:text-[var(--primary)]"
                        }`}
                      />
                      <span className="tracking-wide relative z-10">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Mobile User Profile */}
              <div className="p-4 border-t border-[var(--secondary-100)] bg-[var(--secondary-50)]/30 mt-auto">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[var(--primary)] flex items-center justify-center shadow-md shadow-teal-500/20 text-white font-bold text-sm">
                    {user ? getInitials(user.name) : "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[var(--primary-900)] truncate leading-tight">
                      {user?.name || "Guest"}
                    </p>
                    <p className="text-xs text-[var(--secondary)] truncate mt-0.5">
                      {user?.role === "SUPER_USER" ? "Administrator" : "HR Staff"}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center w-full px-4 py-2.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 rounded-lg transition-all group"
                >
                  <Power className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                  LOGOUT
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
