'use client';

import { AlertCircle, CheckCircle2, Gauge, MessageSquareQuote, Radio } from 'lucide-react';
import type { LiveInterviewCoach } from '@/lib/liveInterview';

interface LiveInterviewCoachPanelProps {
  coach: LiveInterviewCoach;
  silenceSeconds: number;
  isVoiceActive: boolean;
}

export default function LiveInterviewCoachPanel({ coach, silenceSeconds, isVoiceActive }: LiveInterviewCoachPanelProps) {
  const silenceRisk = silenceSeconds >= 10;

  return (
    <div className="studio-card border border-sky-400/20 bg-sky-400/[0.035] p-6">
      <div className="mb-6 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-lg border border-sky-300/20 bg-sky-300/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-sky-200">
            <Radio className={`h-3.5 w-3.5 ${isVoiceActive ? 'animate-pulse' : ''}`} />
            Live interviewer
          </div>
          <h4 className="mt-4 text-2xl font-serif text-white">Real-time readiness signal</h4>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            {coach.wordCount ? `${coach.wordCount} words captured. ${coach.pace}` : 'Start answering and the interviewer will react live.'}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-right">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Live score</div>
          <div className="mt-1 text-3xl font-black text-white">{coach.overall}</div>
          <div className="text-[10px] font-black uppercase tracking-widest text-sky-200">{coach.readiness}</div>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-5">
        {coach.metrics.map((item) => (
          <div key={item.id} className="rounded-2xl border border-white/10 bg-black/25 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</span>
              <span className={`text-xs font-black ${item.score >= 75 ? 'text-emerald-300' : item.score >= 55 ? 'text-amber-300' : 'text-rose-300'}`}>
                {item.score}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full ${item.score >= 75 ? 'bg-emerald-300' : item.score >= 55 ? 'bg-amber-300' : 'bg-rose-300'}`}
                style={{ width: `${item.score}%` }}
              />
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">{item.detail}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className={`rounded-2xl border p-5 ${silenceRisk ? 'border-rose-400/30 bg-rose-400/[0.06]' : 'border-[#d4af37]/20 bg-[#d4af37]/5'}`}>
          <div className={`mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] ${silenceRisk ? 'text-rose-200' : 'text-[#d4af37]'}`}>
            {silenceRisk ? <AlertCircle className="h-4 w-4" /> : <Gauge className="h-4 w-4" />}
            {silenceRisk ? 'Silence detected' : 'Next nudge'}
          </div>
          <p className="text-sm font-medium leading-7 text-white">
            {silenceRisk ? 'Keep going. Say the metric, the trade-off, or the next step out loud.' : coach.nudge}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
          <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-sky-200">
            <MessageSquareQuote className="h-4 w-4" />
            Adaptive follow-up
          </div>
          <p className="text-sm font-medium leading-7 text-slate-200">{coach.followUp}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <SignalList
          icon={<CheckCircle2 className="h-4 w-4" />}
          title="Signals detected"
          items={coach.strengths}
          empty="No strong signal yet."
          tone="good"
        />
        <SignalList
          icon={<AlertCircle className="h-4 w-4" />}
          title="Missing signals"
          items={coach.missingSignals}
          empty="Coverage looks balanced."
          tone="warn"
        />
      </div>
    </div>
  );
}

function SignalList({
  icon,
  title,
  items,
  empty,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
  empty: string;
  tone: 'good' | 'warn';
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
      <div className={`mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] ${tone === 'good' ? 'text-emerald-300' : 'text-amber-300'}`}>
        {icon}
        {title}
      </div>
      <div className="flex flex-wrap gap-2">
        {(items.length ? items : [empty]).map((item) => (
          <span key={item} className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-300">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
