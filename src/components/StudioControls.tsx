'use client';

import { RefreshCw, Save, XCircle, Mic, Info, Activity } from 'lucide-react';
import type { LiveInterviewCoach } from '@/lib/liveInterview';

interface StudioControlsProps {
  timer: number;
  currentIndex: number;
  totalQuestions: number;
  status: string;
  onRegenerate: () => void;
  onSave: () => void;
  onEnd: () => void;
  onVoiceMode: () => void;
  actionsDisabled?: boolean;
  liveCoach?: LiveInterviewCoach;
  isVoiceActive?: boolean;
}

export default function StudioControls({ 
  timer, 
  currentIndex, 
  totalQuestions, 
  status,
  onRegenerate,
  onSave,
  onEnd,
  onVoiceMode,
  actionsDisabled = false,
  liveCoach,
  isVoiceActive = false
}: StudioControlsProps) {
  const safeTotal = Math.max(totalQuestions, 1);
  const visibleIndex = totalQuestions > 0 ? currentIndex + 1 : 0;

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-[320px] h-full flex flex-col border-l border-white/5 bg-black/20 backdrop-blur-md overflow-y-auto hidden xl:flex">
      <div className="p-8 border-b border-white/5 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white tracking-tight uppercase tracking-[0.1em]">Studio Controls</h2>
        <div className="flex gap-1">
            <div className="w-1 h-3 bg-[#d4af37]/40 rounded-full animate-pulse" />
            <div className="w-1 h-4 bg-[#d4af37] rounded-full animate-pulse delay-75" />
            <div className="w-1 h-2 bg-[#d4af37]/60 rounded-full animate-pulse delay-150" />
        </div>
      </div>

      <div className="p-8 space-y-12 pb-20">
        {/* Timer */}
        <div className="studio-card p-6 border border-white/5 bg-white/[0.01]">
            <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Session Timer</span>
                <Info className="w-3 h-3 text-slate-800" />
            </div>
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-3xl font-mono font-black text-white">{formatTime(timer)}</div>
                    <div className="text-[10px] text-slate-700 mt-1 uppercase font-bold">Estimated 45 min session</div>
                </div>
                <div className="w-12 h-12 rounded-full border-2 border-dashed border-[#d4af37]/20 flex items-center justify-center relative">
                    <Mic className="w-4 h-4 text-[#d4af37] opacity-40" />
                    <div className="absolute inset-0 rounded-full border-t-2 border-[#d4af37] animate-spin duration-[4s]" />
                </div>
            </div>
        </div>

        {/* Progress Navigation */}
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Question Progress</span>
                <span className="text-xs font-mono font-black text-white">{visibleIndex} / {totalQuestions}</span>
            </div>
            <div className="flex justify-between px-1">
                {Array.from({ length: safeTotal }).map((_, i) => (
                    <div 
                        key={i} 
                        className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                            i === currentIndex ? 'bg-[#d4af37] text-black border-[#d4af37] shadow-[0_0_15px_#d4af37] scale-110' : 
                            i < currentIndex ? 'bg-white/5 text-slate-400 border-white/20' : 
                            'bg-transparent text-slate-800 border-white/5'
                        }`}
                    >
                        {i + 1}
                    </div>
                ))}
            </div>
        </div>

        {/* Response Status */}
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Response Status</span>
                <Info className="w-3 h-3 text-slate-800" />
            </div>
            <div className="flex items-center gap-6">
                <StatusDot label="Not Started" active={status === "Resting..."} />
                <StatusDot label="Live" color="bg-[#d4af37]" active={status === "Listening..." || status === "Drafting..."} />
                <StatusDot label="Scoring" color="bg-sky-400" active={status === "Analysing..."} />
                <StatusDot label="Answered" color="bg-teal-500" active={status === "Complete"} />
            </div>
        </div>

        {liveCoach && (
          <div className="studio-card p-6 border border-sky-400/20 bg-sky-400/[0.03]">
              <div className="mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-sky-200" />
                      <span className="text-[10px] font-black text-sky-200 uppercase tracking-widest">Live Readiness</span>
                  </div>
                  <span className="rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {liveCoach.wordCount} words
                  </span>
              </div>
              <div className="flex items-end justify-between gap-4">
                  <div>
                    <div className="text-4xl font-black text-white">{liveCoach.overall}</div>
                    <div className="mt-1 text-[10px] font-black uppercase tracking-widest text-sky-200">{liveCoach.readiness}</div>
                  </div>
                  <div className={`h-12 w-12 rounded-full border flex items-center justify-center ${isVoiceActive ? 'border-rose-400/40 bg-rose-400/10 text-rose-300' : 'border-sky-400/30 bg-sky-400/10 text-sky-200'}`}>
                    <Mic className={`h-5 w-5 ${isVoiceActive ? 'animate-pulse' : ''}`} />
                  </div>
              </div>
              <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-sky-300" style={{ width: `${liveCoach.overall}%` }} />
              </div>
              <p className="mt-4 text-xs leading-6 text-slate-400">{liveCoach.nudge}</p>
          </div>
        )}

        {/* Current status info */}
        <div className="p-6 rounded-3xl bg-white/[0.01] border border-white/5 relative overflow-hidden group">
            <div className="text-[10px] font-black text-[#d4af37] uppercase tracking-widest mb-3">Current</div>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
                {liveCoach?.followUp ?? 'Take your time and structure your answer. We are focusing on high-quality delivery.'}
            </p>
        </div>

        {/* Session Actions */}
        <div className="space-y-4">
            <div className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-6">Session Actions</div>
            <ActionItem icon={<RefreshCw className="w-4 h-4" />} label="Regenerate Question" shortcut="R" onClick={onRegenerate} disabled={actionsDisabled} />
            <ActionItem icon={<Save className="w-4 h-4" />} label="Save Note" shortcut="S" onClick={onSave} disabled={actionsDisabled} />
            <ActionItem icon={<XCircle className="w-4 h-4" />} label="End Session" shortcut="E" onClick={onEnd} />
            <div className="pt-4">
                <button 
                  onClick={onVoiceMode}
                  disabled={actionsDisabled}
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-[#d4af37]/5 border border-[#d4af37]/20 text-[#d4af37] hover:bg-[#d4af37]/10 transition-all font-black uppercase text-[10px] tracking-widest disabled:opacity-30"
                >
                   <div className="flex items-center gap-3">
                      <Mic className="w-4 h-4" />
                      {isVoiceActive ? 'Stop Voice Mode' : 'Start Voice Mode'}
                   </div>
                   <span className="bg-black/40 px-2 py-1 rounded border border-[#d4af37]/20">V</span>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}

function StatusDot({ label, color = "bg-slate-700", active }: { label: string, color?: string, active?: boolean }) {
    return (
        <div className={`flex items-center gap-2 ${active ? 'opacity-100' : 'opacity-30'}`}>
            <div className={`w-2 h-2 rounded-full ${color} ${active ? 'shadow-[0_0_8px_currentColor]' : ''}`} />
            <span className="text-[10px] font-bold tracking-tight text-slate-300">{label}</span>
        </div>
    );
}

function ActionItem({ icon, label, shortcut, onClick, disabled = false }: { icon: React.ReactNode, label: string, shortcut: string, onClick: () => void, disabled?: boolean }) {
    return (
        <button 
            onClick={onClick}
            disabled={disabled}
            className="w-full flex items-center justify-between border-b border-white/5 pb-4 group hover:border-white/10 transition-all disabled:opacity-30"
        >
            <div className="flex items-center gap-4 text-slate-600 group-hover:text-slate-300 transition-colors">
                {icon}
                <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
            </div>
            <span className="text-[10px] font-mono font-black text-slate-800 uppercase group-hover:text-slate-600">{shortcut}</span>
        </button>
    );
}
