'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';
import { LayoutDashboard, FileText, BarChart2, ShieldCheck, ClipboardList, Newspaper, FolderTree, User } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/protected-route';

const sidebarItems = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard, roles: ['KOMISI_ASPIRASI', 'KETUA_KOMISI', 'KETUA_MPA', 'ADMIN', 'MAHASISWA', 'EKSEKUTIF_BPH'] },
  { name: 'Daftar Aspirasi', href: '/dashboard/aspirasi', icon: FileText, roles: ['KOMISI_ASPIRASI', 'KETUA_KOMISI', 'KETUA_MPA', 'ADMIN'] },
  { name: 'Topik & Kajian', href: '/dashboard/topik', icon: FolderTree, roles: ['KOMISI_ASPIRASI', 'KETUA_KOMISI', 'KETUA_MPA', 'ADMIN'] },
  { name: 'Disposisi BPH', href: '/dashboard/bph', icon: FileText, roles: ['EKSEKUTIF_BPH'] },
  { name: 'Aspirasi Saya', href: '/dashboard/aspirasi-saya', icon: FileText, roles: ['MAHASISWA'] },
  { name: 'Berita Aspirasi', href: '/admin/news', icon: Newspaper, roles: ['KOMISI_ASPIRASI', 'KETUA_KOMISI', 'KETUA_MPA', 'ADMIN'] },
  { name: 'Kuesioner', href: '/dashboard/kuesioner', icon: ClipboardList, roles: ['KOMISI_ASPIRASI', 'KETUA_KOMISI', 'KETUA_MPA', 'ADMIN'] },
  { name: 'SLA Monitor', href: '/dashboard/sla', icon: BarChart2, roles: ['KOMISI_ASPIRASI', 'KETUA_KOMISI', 'KETUA_MPA', 'ADMIN'] },
  { name: 'Profil Saya', href: '/dashboard/profile', icon: User, roles: ['KOMISI_ASPIRASI', 'KETUA_KOMISI', 'KETUA_MPA', 'ADMIN', 'MAHASISWA', 'EKSEKUTIF_BPH'] },
  { name: 'Admin Panel', href: '/admin', icon: ShieldCheck, roles: ['ADMIN'] },
];


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const filteredItems = sidebarItems.filter(item => 
    !item.roles || (user && user.roles.some(role => item.roles.includes(role)))
  );

  const isStaff = user?.roles.some(role => ['ADMIN', 'KETUA_KOMISI', 'KOMISI_ASPIRASI', 'KETUA_MPA'].includes(role));
  const isBPH = user?.roles.includes('EKSEKUTIF_BPH');

  return (
    <ProtectedRoute allowedRoles={['KOMISI_ASPIRASI', 'KETUA_KOMISI', 'KETUA_MPA', 'ADMIN', 'MAHASISWA', 'EKSEKUTIF_BPH']}>
      <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
        {/* Sidebar - Desktop */}
        <aside className="hidden md:flex w-64 border-r bg-white flex-col shrink-0">
          <div className="p-6 border-b">
            <h2 className="text-lg font-bold text-primary">{isStaff ? 'Menu Komisi' : isBPH ? 'Portal BPH' : 'Portal Mahasiswa'}</h2>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {filteredItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  pathname === item.href
                    ? 'bg-primary text-primary-foreground shadow-sm translate-x-1'
                    : 'text-muted-foreground hover:bg-slate-100 hover:text-foreground'
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Mobile Navigation Bar (Horizontal Scroll) */}
        <div className="md:hidden bg-white border-b sticky top-0 z-30 overflow-x-auto no-scrollbar py-2 px-4 flex gap-2">
          {filteredItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors shrink-0',
                pathname === item.href
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-slate-100 text-muted-foreground hover:bg-slate-200'
              )}
            >
              <item.icon className="w-3.5 h-3.5" />
              {item.name}
            </Link>
          ))}
        </div>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
