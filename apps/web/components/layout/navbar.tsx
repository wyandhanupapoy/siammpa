'use client';

import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, X, LayoutDashboard, Search, Newspaper, LogOut, User, LogIn, UserPlus, Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const navLinks = [
    { name: 'Berita', href: '/news', icon: Newspaper },
    { name: 'Lacak Aspirasi', href: '/aspirasi/tracking', icon: Search },
  ];

  const dashboardLink = { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard };

  return (
    <nav className={`sticky top-0 z-50 w-full transition-all duration-300 ${
      isScrolled ? 'bg-white/80 backdrop-blur-md border-b shadow-sm py-2' : 'bg-white border-b py-4'
    }`}>
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-3 group transition-transform hover:scale-[1.02]">
          <img src="/assets/images/logos/Logo_MPA.png" alt="Logo MPA" className="h-10 w-auto" />
          <div className="flex flex-col leading-tight">
            <span className="text-xl font-bold text-primary tracking-tight">SIAM MPA</span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase">HIMAKOM POLBAN</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href} 
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === link.href ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {link.name}
            </Link>
          ))}
          
          <div className="h-4 w-[1px] bg-border mx-2" />

          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <Link href="/dashboard/notifications" className="relative p-2 text-muted-foreground hover:text-primary transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </Link>
              <Link 
                href={dashboardLink.href} 
                className={`text-sm font-medium transition-colors hover:text-primary flex items-center gap-2 ${
                  pathname.startsWith('/dashboard') ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                {dashboardLink.name}
              </Link>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-full">
                <User className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-semibold">{user?.name.split(' ')[0]}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link href="/auth/login">
                <Button variant="ghost" size="sm" className="font-semibold">
                  Login
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button variant="default" size="sm" className="font-semibold shadow-md">
                  Daftar
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Navigation (Sheet) */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" className="shrink-0">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              }
            />
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader className="text-left border-b pb-4 mb-6">
                <SheetTitle className="flex items-center gap-2">
                  <img src="/assets/images/logos/Logo_MPA.png" alt="Logo" className="h-8 w-8" />
                  <span>SIAM MPA</span>
                </SheetTitle>
              </SheetHeader>
              
              <div className="flex flex-col gap-6">
                <div className="space-y-4">
                  <p className="text-xs font-bold text-primary uppercase tracking-widest pl-2 border-l-2 border-primary">Menu Utama</p>
                  <nav className="flex flex-col gap-1">
                    {navLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`flex items-center gap-4 px-4 py-4 rounded-xl text-base font-semibold transition-all active:scale-[0.98] ${
                          pathname === link.href 
                          ? 'bg-primary text-primary-foreground shadow-md' 
                          : 'hover:bg-muted text-foreground/80'
                        }`}
                      >
                        <link.icon className={`w-5 h-5 ${pathname === link.href ? 'text-primary-foreground' : 'text-primary'}`} />
                        {link.name}
                      </Link>
                    ))}
                  </nav>
                </div>

                <div className="space-y-4">
                  <p className="text-xs font-bold text-primary uppercase tracking-widest pl-2 border-l-2 border-primary">Akun & Sesi</p>
                  {isAuthenticated ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-4 px-4 py-4 bg-secondary/50 border border-border/50 rounded-xl mb-4">
                        <div className="bg-primary p-2.5 rounded-full shadow-inner">
                          <User className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-foreground">{user?.name}</span>
                          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-tight">{user?.nim}</span>
                        </div>
                      </div>
                      <Link
                        href="/dashboard"
                        className={`flex items-center gap-4 px-4 py-4 rounded-xl text-base font-semibold transition-all active:scale-[0.98] ${
                          pathname.startsWith('/dashboard') 
                          ? 'bg-primary text-primary-foreground shadow-md' 
                          : 'hover:bg-muted text-foreground/80'
                        }`}
                      >
                        <LayoutDashboard className={`w-5 h-5 ${pathname.startsWith('/dashboard') ? 'text-primary-foreground' : 'text-primary'}`} />
                        Dashboard
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-4 px-4 py-4 rounded-xl text-base font-semibold text-destructive hover:bg-destructive/10 transition-colors active:scale-[0.98]"
                      >
                        <LogOut className="w-5 h-5" />
                        Keluar
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      <Link href="/auth/login" className="w-full">
                        <Button variant="outline" size="lg" className="w-full gap-3 font-bold h-12 rounded-xl border-2">
                          <LogIn className="w-5 h-5 text-primary" />
                          Login
                        </Button>
                      </Link>
                      <Link href="/auth/register" className="w-full">
                        <Button size="lg" className="w-full gap-3 font-bold h-12 rounded-xl shadow-lg">
                          <UserPlus className="w-5 h-5" />
                          Daftar Akun
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
