import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner"; // Import Toaster
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "HR Recruitment System",
  description: "Professional HR Recruitment and DISC Assessment System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        
        {/* Tambahkan Toaster di bawah children */}
        <Toaster 
          richColors 
          position="top-right" 
          closeButton 
          theme="light" // Bisa diubah ke "dark" atau "system"
        />
      </body>
    </html>
  );
}