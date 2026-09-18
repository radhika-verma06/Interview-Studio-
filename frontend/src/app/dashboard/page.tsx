'use client';

import { useState, useEffect, useCallback, ReactNode } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Target, Clock, Hash, ArrowRight, PlayCircle, Award } from 'lucide-react';

interface DashboardSession {
  id: string;
  role: string;
  company_mode: string;
  started_at: string;
  difficulty: string;
  overall_score: number;
}

interface DashboardData {
  total_interviews: number;
  avg_score: number;
  best_score: number;
  recent_sessions: DashboardSession[];
  skill_breakdown?: Record<string, number>;
}

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  trend: string;
}

interface ActionCardProps {
  title: string;
  description: string;
  type: 'weakness' | 'suggestion';
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    try {
      const dbData = await api.getDashboard() as DashboardData;
      setData(dbData);
    } catch (e) {
      console.error(e);
      // Fallback mock data if backend not connected yet
      setData({
        total_interviews: 0,
        avg_score: 0,
        best_score: 0,
        recent_sessions: []
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchDashboard();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#d4af37]/20 border-t-[#d4af37] rounded-full animate-spin"></div>
      </div>
    );
  }

  const recentSessions = data?.recent_sessions ?? [];
  const skillBreakdown = data?.skill_breakdown || {};
  const skills = Object.entries(skillBreakdown);
  skills.sort((a, b) => a[1] - b[1]);
  
  const weakestSkill = skills.length > 0 ? skills[0][0] : "Fundamentals";
  const strongestSkill = skills.length > 0 ? skills[skills.length - 1][0] : "System Design";

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-slate-400">Track your progress and continue your interview preparation.</p>
        </div>
        <Link 
          href="/interview/setup"
          className="px-6 py-3 bg-[#d4af37] hover:bg-[#c5a032] text-black rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all gold-glow"
        >
          <PlayCircle className="w-5 h-5" /> Start New Session
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <StatCard icon={<Hash />} label="Total Interviews" value={`${data?.total_interviews ?? 0}`} trend="+2 this week" />
        <StatCard icon={<Target />} label="Average Score" value={data?.avg_score ? `${Math.round(data.avg_score)}/100` : "--"} trend="Keep it up!" />
        <StatCard icon={<Award />} label="Best Score" value={data?.best_score ? `${Math.round(data.best_score)}/100` : "--"} trend="Top Performance" />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white uppercase tracking-widest text-xs">Recent Sessions</h2>
            <Link href="/history" className="text-[10px] font-black uppercase tracking-widest text-[#d4af37] hover:text-[#c5a032]">View All</Link>
          </div>
          
          <div className="glass rounded-2xl overflow-hidden border-slate-700/50">
            {recentSessions.length > 0 ? (
              <div className="divide-y divide-slate-800">
                {recentSessions.map((session) => (
                  <div key={session.id} className="p-6 hover:bg-slate-800/50 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold text-white">{session.role} Interview</span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                          {session.company_mode}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {new Date(session.started_at).toLocaleDateString()}</span>
                        <span>{session.difficulty}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-end">
                        <span className="text-xs text-slate-500 uppercase">Score</span>
                        <span className="font-bold text-lg text-[#d4af37]">{Math.round(session.overall_score)}</span>
                      </div>
                      <Link href={`/interview/summary/${session.id}`} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors">
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4 text-slate-500">
                  <Clock className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">No completed sessions yet</h3>
                <p className="text-slate-400 mb-6">Start your first mock interview to get baseline metrics.</p>
                <Link href="/interview/setup" className="text-[#d4af37] hover:text-[#c5a032] text-[10px] uppercase font-black tracking-widest">Start Practising →</Link>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white uppercase tracking-widest text-xs">Recommended Actions</h2>
          <div className="glass rounded-2xl p-6 border-slate-700/50 space-y-4">
            <ActionCard 
              title={`Practise ${weakestSkill}`}
              description="Your lowest scoring category."
              type="weakness"
            />
            <ActionCard 
              title={`${strongestSkill} Mocks`}
              description="Recommended to solidify your strengths."
              type="suggestion"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, trend }: StatCardProps) {
  return (
    <div className="glass p-6 rounded-2xl border-slate-700/50 relative overflow-hidden group">
      <div className="absolute -right-4 -top-4 text-slate-800/30 w-32 h-32 transform group-hover:scale-110 transition-transform duration-500">
        {icon}
      </div>
      <div className="relative z-10 flex flex-col items-start gap-4">
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[#d4af37] inline-block">
          {icon}
        </div>
        <div>
          <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{label}</h3>
          <div className="text-3xl font-bold text-white mb-2">{value}</div>
          <div className="text-[10px] font-black tracking-widest uppercase text-[#d4af37]/70">{trend}</div>
        </div>
      </div>
    </div>
  );
}

function ActionCard({ title, description, type }: ActionCardProps) {
  const isWeakness = type === 'weakness';
  return (
    <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer group flex items-start gap-4">
      <div className={`p-2 rounded-lg mt-1 ${isWeakness ? 'bg-orange-500/10 text-orange-400' : 'bg-blue-500/10 text-blue-400'}`}>
        <Target className="w-5 h-5" />
      </div>
      <div>
        <h4 className="font-semibold text-slate-200 group-hover:text-[#d4af37] transition-colors">{title}</h4>
        <p className="text-[10px] uppercase font-bold tracking-widest text-[#d4af37]/60 mt-1">{description}</p>
      </div>
    </div>
  );
}
