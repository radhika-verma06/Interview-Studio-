'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { LogOut, User as UserIcon, LayoutDashboard, Home, Mic } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-white/5 bg-[#05070a] py-3">
      <div className="container mx-auto px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#d4af37] to-[#8b5e3c] flex items-center justify-center gold-glow">
            <Mic className="w-5 h-5 text-[#05070a]" strokeWidth={2.5} />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white block leading-none">Interview Studio</span>
            <span className="text-[8px] uppercase tracking-[0.2em] text-[#d4af37]/60 font-black">Professional Mock AI</span>
          </div>
        </Link>

        <nav className="flex items-center gap-8">
          <Link href="/" className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-[#d4af37] transition-all flex items-center gap-2">
            <Home className="w-3.5 h-3.5" /> Home
          </Link>
          
          {user ? (
            <>
              <Link href="/dashboard" className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-[#d4af37] transition-all flex items-center gap-2">
                <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
              </Link>
              <div className="h-4 w-px bg-white/5" />
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
                  <UserIcon className="w-3 h-3 text-[#d4af37]" />
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{user.name}</span>
                </div>
                <button 
                  onClick={logout}
                  className="p-2 text-slate-600 hover:text-rose-500 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-[#d4af37] transition-all">
                Log In
              </Link>
              <Link 
                href="/signup" 
                className="px-5 py-2.5 rounded-xl bg-[#d4af37] hover:bg-[#f9d71c] text-[10px] font-black text-[#05070a] uppercase tracking-widest transition-all gold-glow"
              >
                Sign Up
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
