import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/navbar";
import Providers from "@/components/providers";
import { Plus, MessageSquarePlus } from "lucide-react";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "SIAM MPA HIMAKOM POLBAN",
    template: "%s | SIAM MPA"
  },
  description: "Platform resmi aspirasi Mahasiswa JTK POLBAN. Sampaikan keluhan, saran, dan aspirasi Anda secara aman, transparan, dan terukur bersama MPA HIMAKOM POLBAN.",
  keywords: ["aspirasi", "mahasiswa", "polban", "himakom", "jtk", "mpa", "siam"],
  authors: [{ name: "MPA HIMAKOM POLBAN" }],
  openGraph: {
    title: "SIAM MPA HIMAKOM POLBAN",
    description: "Suaramu, Perubahan Kita. Sampaikan aspirasimu secara anonim dan aman.",
    type: "website",
    locale: "id_ID",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-slate-50`}
      >
        <Providers>
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
          
          {/* Floating Action Button for Reporting */}
          <Link 
            href="/aspirasi/buat" 
            className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-50 group"
          >
            <div className="flex items-center gap-3 bg-primary text-white p-4 md:p-5 rounded-full shadow-2xl hover:shadow-primary/40 hover:scale-105 transition-all duration-300">
              <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 font-black uppercase text-xs tracking-widest whitespace-nowrap">
                Sampaikan Aspirasi
              </span>
              <MessageSquarePlus className="w-6 h-6" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-bounce"></div>
          </Link>
        </Providers>
      </body>
    </html>
  );
}
