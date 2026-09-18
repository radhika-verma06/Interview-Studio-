'use client';

import { Mic, RefreshCw, Play, Info } from 'lucide-react';

interface AppHeaderProps {
  onStartInterview: () => void;
  onGenerateFresh: () => void;
  showQuestions: boolean;
  setShowQuestions: (val: boolean) => void;
}

export default function AppHeader({ onStartInterview, onGenerateFresh, showQuestions, setShowQuestions }: AppHeaderProps) {
  return (
    <header className="border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-50 py-4 px-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-full border-2 border-[#d4af37]/40 p-2 flex items-center justify-center bg-black/20 gold-glow relative">
            <div className="absolute inset-0 rounded-full border border-[#d4af37]/20 bg-[#d4af37]/5 animate-pulse" />
            <Mic className="w-7 h-7 text-[#d4af37] relative z-10" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white leading-none mb-1">
              Interview Studio
            </h1>
            <p className="text-xs text-[#d4af37] font-medium tracking-wide">
              Practice smarter with AI-powered interviews
            </p>
          </div>
        </div>

        <div className="flex items-center gap-10">
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">
                <Info className="w-3 h-3" /> Questions visible
             </div>
             <button 
                onClick={() => setShowQuestions(!showQuestions)}
                className={`w-11 h-6 rounded-full transition-all relative ${showQuestions ? 'bg-[#d4af37]' : 'bg-white/10'}`}
             >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-slate-900 transition-all ${showQuestions ? 'left-6' : 'left-1'}`} />
             </button>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={onStartInterview}
              className="px-8 py-3.5 rounded-xl bg-[#d4af37] text-black font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3 gold-glow hover:bg-[#c5a032] transition-colors"
            >
              <Play className="w-4 h-4 fill-current" /> Start Session
            </button>
            <button 
              onClick={onGenerateFresh}
              className="px-8 py-3.5 rounded-xl bg-transparent border border-white/10 text-slate-300 font-bold text-xs uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-white/5 transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Generate Fresh Set
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
