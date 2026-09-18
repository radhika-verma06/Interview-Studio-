'use client';

import { useState, useEffect, use, useCallback } from 'react';
import Link from 'next/link';
import { api, SummaryResponse } from '@/lib/api';
import { Target, Award, ArrowRight, CheckCircle2, AlertCircle, CalendarClock } from 'lucide-react';

export default function InterviewSummaryPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const [data, setData] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    try {
      const summary = await api.getSummary(sessionId);
      setData(summary);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchSummary();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchSummary]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-24">
        <h2 className="text-2xl font-bold text-white mb-4">Summary not found</h2>
        <Link href="/dashboard" className="text-teal-400 hover:underline">Return to Dashboard</Link>
      </div>
    );
  }

  const { session, stats, answers, drill_plan } = data;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-white mb-4">Interview Complete</h1>
        <p className="text-slate-400">Great job putting in the reps! Here is your performance summary for the {session.role} mock.</p>
      </div>

      {/* Main Score Card */}
      <div className="glass p-8 rounded-3xl mb-8 flex flex-col md:flex-row items-center justify-between relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-teal-500/10 blur-[80px] rounded-full pointer-events-none" />
        
        <div className="flex-1 mb-8 md:mb-0">
          <h2 className="text-xl text-slate-300 font-medium mb-2">Final Score</h2>
          <div className="flex items-baseline gap-2">
            <span className="text-6xl font-extrabold text-white">{Math.round(stats.avg_score)}</span>
            <span className="text-xl text-slate-500">/ 100</span>
          </div>
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-medium border border-emerald-500/20">
            <Award className="w-4 h-4" /> {stats.avg_score >= 80 ? 'Strong Performance' : stats.avg_score >= 60 ? 'Good Progress' : 'Keep Practising'}
          </div>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-4 w-full">
          <StatBox icon={<Target />} label="Best Score" value={`${stats.best_score}`} />
          <StatBox icon={<HashIcon />} label="Questions" value={`${stats.total_answered}`} />
          <StatBox icon={<ClockIcon />} label="Difficulty" value={session.difficulty} />
          <StatBox icon={<Award />} label="Role" value={session.role.split(' ')[0]} />
        </div>
      </div>

      {/* Detailed Question History */}
      <div className="space-y-6 mb-12">
        <h3 className="text-xl font-bold text-white mb-6">Question History</h3>
        {answers.map((answer, index) => (
          <div key={answer.id} className="glass p-6 rounded-2xl border-slate-700/50">
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-mono text-slate-500 uppercase">Question {index + 1}</span>
              <span className={`text-sm font-bold ${answer.overall_score >= 70 ? 'text-emerald-400' : 'text-orange-400'}`}>
                Score: {answer.overall_score}/100
              </span>
            </div>
            <h4 className="text-slate-200 font-medium mb-4">&quot;{answer.question_text || 'ML Technical Question'}&quot;</h4>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-slate-900/50 p-4 rounded-xl">
                <div className="text-xs font-semibold text-emerald-400 mb-2 uppercase flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Strengths
                </div>
                <div className="text-sm text-slate-400">{answer.strengths[0] || 'Good conceptual clarity.'}</div>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-xl">
                <div className="text-xs font-semibold text-orange-400 mb-2 uppercase flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Weakness
                </div>
                <div className="text-sm text-slate-400">{answer.detected_weak_area || 'Technical Depth.'}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="glass p-8 rounded-2xl border-slate-700/50 mb-12">
        <h3 className="text-xl font-bold text-white mb-6">Personalized Drill Plan</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="text-xs uppercase tracking-widest text-slate-500 font-bold">Focus Areas</div>
            {drill_plan.focus_areas.length > 0 ? (
              drill_plan.focus_areas.map((item) => (
                <div key={item.area} className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                  <div className="text-emerald-300 font-semibold mb-1">{item.area}</div>
                  <div className="text-sm text-slate-300">{item.action}</div>
                  <div className="text-xs text-slate-500 mt-2">{item.goal}</div>
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-400">No weak spots detected yet. Keep building your streak.</div>
            )}
          </div>

          <div className="space-y-4">
            <div className="text-xs uppercase tracking-widest text-slate-500 font-bold">Spaced Repetition Queue</div>
            {drill_plan.redo_queue.length > 0 ? (
              drill_plan.redo_queue.map((item) => (
                <div key={`${item.question_id}-${item.due_in}`} className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                  <div className="text-sm text-white">{item.question_text}</div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-orange-300">Score: {item.score}</span>
                    <span className="text-slate-400 inline-flex items-center gap-1">
                      <CalendarClock className="w-3.5 h-3.5" /> Revisit in {item.due_in}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-400">Queue will populate after a few answered questions.</div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link 
          href="/dashboard"
          className="px-8 py-4 rounded-xl border border-slate-700 font-semibold text-slate-300 hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
        >
          View Dashboard
        </Link>
        <Link 
          href="/interview/setup"
          className="px-8 py-4 rounded-xl bg-teal-600 hover:bg-teal-500 font-semibold text-white transition-colors flex items-center justify-center gap-2 teal-glow"
        >
          Practise Another <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

function StatBox({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl flex flex-col items-start gap-2">
      <div className="text-teal-500 p-2 rounded-lg bg-teal-500/10">
        {icon}
      </div>
      <div className="mt-1">
        <div className="text-xs text-slate-400 uppercase tracking-wider">{label}</div>
        <div className="text-lg font-bold text-white">{value}</div>
      </div>
    </div>
  );
}

function ClockIcon() { return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>; }
function HashIcon() { return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"></path></svg>; }
