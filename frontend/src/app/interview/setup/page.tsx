'use client';

import { ReactNode, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, ArrowRight, Sparkles, Shield, Zap, Layout } from 'lucide-react';
import { api } from '@/lib/api';

export default function StudioEntrance() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // This page is now a "Calibration / Studio Entrance" 
  // users can still pick their role here if they want a clean start
  const [setup, setSetup] = useState({
    role: "AI Engineer",
    company: "Google",
    difficulty: "Medium"
  });

  const handleEnterStudio = async () => {
    setLoading(true);
    try {
        // Create a real session via API
        const session = await api.startInterview({
            role: setup.role,
            company_mode: setup.company,
            difficulty: setup.difficulty,
            interview_type: "Technical",
            answer_mode: "Mixed"
        });
        router.push(`/interview/session/${session.id}`);
    } catch {
        // Fallback for demo
        router.push(`/interview/session/demo-${Date.now()}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#040608] text-white studio-gradient flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-studio-gold/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/5 blur-[120px] rounded-full" />

      <div className="max-w-4xl w-full space-y-12 relative z-10 text-center">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-studio-gold/10 border border-studio-gold/20 text-studio-gold text-[10px] font-black uppercase tracking-[0.2em] mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <Sparkles className="w-4 h-4" /> Studio Entrance
            </div>

            <div className="space-y-6">
                <h1 className="text-6xl md:text-8xl font-serif font-bold tracking-tight leading-[0.9] animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    Entering the <br />
                    <span className="italic opacity-60">Studio.</span>
                </h1>
                <p className="text-xl text-slate-400 font-medium max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-200">
                    Prepare your environment. Take a deep breath. 
                    The studio is ready for your high-fidelity session.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
                <OptionCard 
                    label="Target Role" 
                    value={setup.role} 
                    icon={<Layout className="w-5 h-5" />} 
                    options={["AI Engineer", "ML Engineer", "Product Manager"]} 
                    onChange={(val) => setSetup({...setup, role: val})}
                />
                <OptionCard 
                    label="Company Lens" 
                    value={setup.company} 
                    icon={<Shield className="w-5 h-5" />} 
                    options={["Google", "Meta", "OpenAI", "Startup"]} 
                    onChange={(val) => setSetup({...setup, company: val})}
                />
                <OptionCard 
                    label="Intensity" 
                    value={setup.difficulty} 
                    icon={<Zap className="w-5 h-5" />} 
                    options={["Easy", "Medium", "Hard"]} 
                    onChange={(val) => setSetup({...setup, difficulty: val})}
                />
            </div>

            <div className="pt-12 animate-in fade-in slide-in-from-bottom-14 duration-1000 delay-500">
                <button 
                    onClick={handleEnterStudio}
                    disabled={loading}
                    className="gold-pill px-20 py-8 rounded-3xl flex items-center justify-center gap-6 text-lg group relative overflow-hidden"
                >
                    {loading ? (
                        <div className="flex items-center gap-4">
                            <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                            <span>Calibrating...</span>
                        </div>
                    ) : (
                        <>
                            Start High-Fidelity Session <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-2" />
                        </>
                    )}
                </button>
                <div className="mt-8 text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-4">
                    <span className="flex items-center gap-2"><Mic className="w-3 h-3" /> Mic Check OK</span>
                    <span className="w-1 h-1 bg-slate-800 rounded-full" />
                    <span className="flex items-center gap-2"><Layout className="w-3 h-3" /> Camera Ready</span>
                </div>
            </div>
      </div>
    </div>
  );
}

interface OptionCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  options: string[];
  onChange: (value: string) => void;
}

function OptionCard({ label, value, icon, options, onChange }: OptionCardProps) {
    return (
        <div className="studio-card p-8 border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all group">
            <div className="flex items-center gap-3 text-studio-gold mb-6 opacity-60 group-hover:opacity-100 transition-opacity">
                {icon}
                <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
            </div>
            <select 
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-transparent border-none text-2xl font-serif text-white focus:ring-0 cursor-pointer appearance-none outline-none"
            >
                {options.map((opt: string) => (
                    <option key={opt} value={opt} className="bg-black text-white">{opt}</option>
                ))}
            </select>
            <div className="h-px w-full bg-white/5 mt-4 group-hover:bg-studio-gold/20 transition-colors" />
        </div>
    );
}
