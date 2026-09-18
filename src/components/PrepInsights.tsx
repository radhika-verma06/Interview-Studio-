'use client';

import { BarChart3, CheckCircle2, Clock, Zap, Target } from 'lucide-react';
import type { Question } from '@/lib/api';
import { buildRevisionPlan } from '@/lib/interviewContent';
import type { SessionSetupState } from './SessionSetupSidebar';

interface PrepInsightsProps {
  setup: SessionSetupState;
  upcomingQuestion?: Question;
}

export default function PrepInsights({ setup, upcomingQuestion }: PrepInsightsProps) {
  const plan = buildRevisionPlan(setup, upcomingQuestion);
  const checklist = [
    { item: `Review ${plan.likelyTopics[0]}`, done: true },
    { item: `Prepare ${setup.role} example`, done: true },
    { item: "Name success metrics", done: true },
    { item: "Add one trade-off", done: true },
    { item: "Call out one risk", done: true },
    { item: "Practice answer out loud", done: false },
    { item: "Submit for coaching", done: false },
    { item: "Review feedback", done: false },
  ];
  const completed = checklist.filter((item) => item.done).length;
  const readiness = Math.round((completed / checklist.length) * 100);

  return (
    <div className="w-[320px] h-full flex flex-col border-l border-white/5 bg-black/20 backdrop-blur-md overflow-y-auto hidden xl:flex">
      <div className="p-8 border-b border-white/5 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white tracking-tight uppercase tracking-[0.1em]">Prep Insights</h2>
        <BarChart3 className="w-5 h-5 text-slate-600" />
      </div>

      <div className="p-8 space-y-12">
        {/* Readiness Score */}
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest leading-none">Readiness Score</span>
                <span className="text-sm font-mono font-black text-[#d4af37]">{readiness}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-[#d4af37] shadow-[0_0_10px_#d4af37] transition-all" style={{ width: `${readiness}%` }} />
            </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                <Clock className="w-4 h-4 text-slate-500" />
                <div className="text-[10px] text-slate-600 uppercase font-black">Est. Prep</div>
                <div className="text-sm font-bold text-white">12 min</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                <Target className="w-4 h-4 text-slate-500" />
                <div className="text-[10px] text-slate-600 uppercase font-black">Success Rate</div>
                <div className="text-sm font-bold text-white">{upcomingQuestion ? upcomingQuestion.difficulty : setup.difficulty}</div>
            </div>
        </div>

        {/* Checklist */}
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Revision Checklist</span>
                <span className="text-[10px] font-bold text-slate-700">{completed} / {checklist.length}</span>
            </div>
            <div className="space-y-3">
                {checklist.map((c, i) => (
                    <div key={i} className="flex items-center gap-3 group cursor-pointer">
                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${c.done ? 'bg-[#d4af37] border-[#d4af37]' : 'border-white/10 group-hover:border-white/30'}`}>
                            {c.done && <CheckCircle2 className="w-3 h-3 text-black" strokeWidth={3} />}
                        </div>
                        <span className={`text-[11px] font-medium transition-colors ${c.done ? 'text-slate-300' : 'text-slate-600 group-hover:text-slate-500'}`}>
                            {c.item}
                        </span>
                    </div>
                ))}
            </div>
        </div>

        {/* Focus Recommendation */}
        <div className="p-6 rounded-3xl bg-[#d4af37]/5 border border-[#d4af37]/20 relative overflow-hidden group">
            <Zap className="w-12 h-12 text-[#d4af37] absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform" />
            <div className="text-[10px] font-black text-[#d4af37] uppercase tracking-widest mb-3">Recommended Focus</div>
            <p className="text-xs text-white/80 leading-relaxed font-medium">
                Lead with {plan.likelyTopics[0]}, then anchor your answer in a concrete example and one measurable outcome.
            </p>
        </div>
      </div>
    </div>
  );
}
