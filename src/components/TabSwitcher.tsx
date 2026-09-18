'use client';

import { BookOpen, Podcast, Sparkles } from 'lucide-react';

interface TabSwitcherProps {
  activeTab: 'revisionPrep' | 'interviewMode';
  setActiveTab: (tab: 'revisionPrep' | 'interviewMode') => void;
}

export default function TabSwitcher({ activeTab, setActiveTab }: TabSwitcherProps) {
  return (
    <div className="flex items-center gap-10 border-b border-white/5 pb-2">
      <button
        onClick={() => setActiveTab('revisionPrep')}
        className={`flex items-center gap-3 pb-3 -mb-[9px] transition-all relative group ${
          activeTab === 'revisionPrep' 
            ? 'text-white' 
            : 'text-slate-600 hover:text-slate-400'
        }`}
      >
        <BookOpen className={`w-4 h-4 transition-colors ${activeTab === 'revisionPrep' ? 'text-[#d4af37]' : ''}`} />
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Revision Prep</span>
        {activeTab === 'revisionPrep' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#d4af37] gold-glow" />}
      </button>

      <button
        onClick={() => setActiveTab('interviewMode')}
        className={`flex items-center gap-3 pb-3 -mb-[9px] transition-all relative group ${
          activeTab === 'interviewMode' 
            ? 'text-white' 
            : 'text-slate-600 hover:text-slate-400'
        }`}
      >
        <Podcast className={`w-4 h-4 transition-colors ${activeTab === 'interviewMode' ? 'text-[#d4af37]' : ''}`} />
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Interview Mode</span>
        {activeTab === 'interviewMode' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#d4af37] gold-glow" />}
      </button>

      <div className="ml-auto flex items-center gap-2 text-[10px] text-slate-700 font-bold italic tracking-tight">
         <Sparkles className="w-3 h-3 text-[#d4af37] opacity-60" />
         Only one question is shown at a time for focus.
      </div>
    </div>
  );
}
