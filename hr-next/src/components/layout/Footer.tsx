"use client";

import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-white py-4 border-t border-gray-100 mt-auto">
      <div className="flex flex-col items-center gap-2">
        {/* Logos Row */}
        <div className="flex items-center gap-6">
          <Image
            src="/images/logos/ptLogoText.png"
            alt="PT Logo"
            width={100}
            height={32}
            className="h-8 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity"
            unoptimized
          />
          <Image
            src="/images/logos/MBMlogo.png"
            alt="MBM Logo"
            width={80}
            height={32}
            className="h-7 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity"
            unoptimized
          />
          <Image
            src="/images/logos/greatness.png"
            alt="Greatness Logo"
            width={80}
            height={32}
            className="h-7 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity"
            unoptimized
          />
        </div>
      </div>
    </footer>
  );
}
