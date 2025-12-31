"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Bell } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
}

export default function Header({
  title,
  subtitle,
  onRefresh,
}: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    
    // Set formatted date
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    setCurrentDate(date.toLocaleDateString('id-ID', options));

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header 
      className={`bg-white/80 sticky top-0 z-30 transition-all duration-300 backdrop-blur-md ${
        scrolled ? "border-b border-gray-200 shadow-sm" : ""
      }`}
    >
      <div className="px-4 pl-14 lg:px-8 py-4">
        <div className="flex justify-between items-end">
          {/* Page Title */}
          <div>
             <h1 className="text-2xl font-bold text-[var(--primary-900)] tracking-tight">{title}</h1>
             {subtitle && (
                <p className="text-sm text-[var(--secondary)] mt-1 font-medium">{subtitle}</p>
             )}
          </div>

          {/* Right side data/actions */}
          <div className="flex items-center gap-4">
            {/* Refresh Button */}
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-2 text-[var(--secondary)] hover:text-[var(--primary)] hover:bg-[var(--primary-50)] rounded-full transition-colors"
                title="Refresh Data"
              >
                <RefreshCw size={20} />
              </button>
            )}

            {/* Notification placeholder */}
            <div className="hidden md:flex flex-col items-end border-l border-gray-200 pl-4 ml-2">
               <span className="text-xs font-bold text-[var(--primary-600)] uppercase tracking-wider">{currentDate}</span>
               <span className="text-[10px] text-[var(--secondary)] font-medium">HR Recruitment System</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
