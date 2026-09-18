'use client';

import { useState } from 'react';
import { Settings, Info, Plus, X } from 'lucide-react';

export interface SessionSetupState {
  role: string;
  companyPack: string;
  targetCompany: string;
  customCompany: string;
  difficulty: string;
  type: string;
  freshEachRun: boolean;
}

interface SessionSetupSidebarProps {
  setup: SessionSetupState;
  setSetup: (setup: SessionSetupState) => void;
}

export default function SessionSetupSidebar({ setup, setSetup }: SessionSetupSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const roles = ["Software Engineer", "Product Manager", "Data Analyst", "AI Engineer", "Consultant", "UX Researcher", "Marketing", "Sales", "Operations"];
  const companyPacks = ["Big Tech", "Startups", "Fintech", "Consulting", "AI Labs"];
  const topTargets = ["Google", "Amazon", "Microsoft", "OpenAI", "Atlassian", "Meta", "Apple", "Netflix", "Tesla", "Canva"];
  const difficulties = ["Easy", "Medium", "Hard", "Mixed"];
  const types = ["Behavioral", "Technical", "Case", "Resume-based", "System Design"];
  
  const update = <K extends keyof SessionSetupState>(key: K, val: SessionSetupState[K]) =>
    setSetup({ ...setup, [key]: val });

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed bottom-6 left-6 z-40 bg-[#d4af37] text-black p-4 rounded-full shadow-lg gold-glow hover:scale-105 transition-transform"
      >
        <Settings className="w-6 h-6" />
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className={`fixed inset-y-0 left-0 z-50 w-[320px] h-full flex flex-col border-r border-white/5 bg-[#040608]/95 lg:bg-black/20 backdrop-blur-md overflow-y-auto transform transition-transform duration-300 lg:relative lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white tracking-tight uppercase tracking-[0.1em]">Session Setup</h2>
          <button className="lg:hidden" onClick={() => setIsOpen(false)}>
            <X className="w-5 h-5 text-slate-400" />
          </button>
          <Settings className="hidden lg:block w-5 h-5 text-slate-600" />
        </div>

      <div className="p-8 space-y-10 pb-20">
        {/* Role Selector */}
        <SetupSection label="Target Role">
          <select 
            value={setup.role} 
            onChange={(e) => update('role', e.target.value)}
            className="w-full bg-slate-900/40 border border-white/5 rounded-xl px-4 py-3.5 text-sm text-slate-300 outline-none focus:border-[#d4af37]/40 appearance-none cursor-pointer"
          >
            {roles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </SetupSection>

        {/* Company Focus */}
        <SetupSection label="Company Focus">
            <div className="space-y-6">
                <div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-3 font-bold">Company Packs</div>
                    <div className="flex flex-wrap gap-2">
                        {companyPacks.map(p => (
                            <button 
                                key={p} 
                                onClick={() => update('companyPack', p)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${setup.companyPack === p ? 'bg-[#d4af37] text-black border-[#d4af37]' : 'bg-white/5 text-slate-400 border-white/5 hover:border-white/10'}`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-3 font-bold">Top Targets</div>
                    <div className="flex flex-wrap gap-1.5">
                        {topTargets.map(t => (
                            <button 
                                key={t} 
                                onClick={() => update('targetCompany', t)}
                                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${setup.targetCompany === t ? 'bg-white/10 text-white border-[#d4af37]' : 'bg-transparent text-slate-600 border-white/5 hover:border-white/10'}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="relative">
                    <input 
                        type="text"
                        placeholder="Custom company..."
                        value={setup.customCompany}
                        onChange={(e) => update('customCompany', e.target.value)}
                        className="w-full bg-slate-900/40 border border-white/5 rounded-xl px-4 py-3.5 text-sm text-slate-300 outline-none focus:border-[#d4af37]/40 pl-10"
                    />
                    <Plus className="w-4 h-4 text-slate-600 absolute left-4 top-4" />
                </div>
            </div>
        </SetupSection>

        {/* Difficulty */}
        <SetupSection label="Difficulty">
           <div className="grid grid-cols-2 gap-2">
              {difficulties.map(d => (
                 <button 
                  key={d}
                  onClick={() => update('difficulty', d)}
                  className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${setup.difficulty === d ? 'bg-[#d4af37]/20 text-[#d4af37] border-[#d4af37]/40' : 'bg-white/5 text-slate-500 border-white/5'}`}
                 >
                  {d}
                 </button>
              ))}
           </div>
        </SetupSection>

        {/* Interview Type */}
        <SetupSection label="Interview Type">
           <select 
                value={setup.type} 
                onChange={(e) => update('type', e.target.value)}
                className="w-full bg-slate-900/40 border border-white/5 rounded-xl px-4 py-3.5 text-sm text-slate-300 outline-none focus:border-[#d4af37]/40 appearance-none cursor-pointer"
           >
                {types.map(t => <option key={t} value={t}>{t}</option>)}
           </select>
        </SetupSection>

        {/* Fresh Toggle */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
           <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Fresh Set Each Run</span>
              <Info className="w-3.5 h-3.5 text-slate-700" />
           </div>
           <button 
                onClick={() => update('freshEachRun', !setup.freshEachRun)}
                className={`w-10 h-5 rounded-full transition-all relative ${setup.freshEachRun ? 'bg-[#d4af37]' : 'bg-white/10'}`}
           >
                <div className={`absolute top-1 w-3 h-3 rounded-full bg-slate-900 transition-all ${setup.freshEachRun ? 'left-6' : 'left-1'}`} />
           </button>
        </div>
      </div>
    </>
  );
}

function SetupSection({ label, children }: { label: string, children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-black text-[#d4af37] uppercase tracking-[0.2em]">{label}</span>
        <Info className="w-3.5 h-3.5 text-slate-800" />
      </div>
      {children}
    </div>
  );
}
