'use client';

import { useState } from 'react';
import { ArrowRight, Building2, CheckCircle2, ClipboardList, FileText, Layers, Radar, Target, TimerReset, Upload } from 'lucide-react';
import type { Question } from '@/lib/api';
import { buildRevisionPlan } from '@/lib/interviewContent';
import type { SessionSetupState } from './SessionSetupSidebar';

interface RevisionPrepProps {
  setup: SessionSetupState;
  upcomingQuestion?: Question;
  questionNotice?: string | null;
  ragNotice?: string | null;
  isSavingContext?: boolean;
  onSaveContext: (payload: { title: string; source_type: string; content: string }) => Promise<void>;
  onUploadContext: (payload: { file: File; title: string; source_type: string }) => Promise<void>;
  onStartInterview: () => void;
}

export default function RevisionPrep({
  setup,
  upcomingQuestion,
  questionNotice,
  ragNotice,
  isSavingContext = false,
  onSaveContext,
  onUploadContext,
  onStartInterview,
}: RevisionPrepProps) {
  const plan = buildRevisionPlan(setup, upcomingQuestion);
  const [contextTitle, setContextTitle] = useState('Resume / job description');
  const [sourceType, setSourceType] = useState('resume');
  const [contextContent, setContextContent] = useState('');
  const canSaveContext = contextContent.trim().length >= 80 && !isSavingContext;

  const detectSourceType = (fileName: string) => {
    const lowerName = fileName.toLowerCase();
    if (lowerName.includes('job') || lowerName.includes('jd')) return 'job_description';
    if (lowerName.includes('resume') || lowerName.includes('cv')) return 'resume';
    if (lowerName.includes('company')) return 'company_notes';
    if (lowerName.includes('project')) return 'project_notes';
    return sourceType;
  };

  const handleFile = async (file?: File) => {
    if (!file || isSavingContext) return;
    const detectedSourceType = detectSourceType(file.name);
    setContextTitle(file.name);
    setSourceType(detectedSourceType);

    try {
      await onUploadContext({
        file,
        title: file.name,
        source_type: detectedSourceType,
      });
      setContextContent('');
    } catch {
      if (/\.(txt|md|csv|json)$/i.test(file.name)) {
        const text = await file.text();
        setContextContent(text);
      }
    }
  };

  const handleSaveContext = async () => {
    if (!canSaveContext) return;
    await onSaveContext({
      title: contextTitle.trim() || 'Interview context',
      source_type: sourceType,
      content: contextContent,
    });
    setContextContent('');
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8 pb-12 mt-6">
      <div className="max-w-4xl">
        <div className="inline-flex items-center gap-2 rounded-lg border border-[#d4af37]/20 bg-[#d4af37]/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-[#d4af37]">
          <Radar className="h-3.5 w-3.5" />
          Live interview briefing
        </div>
        <h2 className="mt-5 text-4xl font-serif text-white md:text-5xl">{plan.headline}</h2>
        <p className="mt-4 max-w-3xl text-sm font-medium leading-7 text-slate-400">{plan.brief}</p>
        {questionNotice && (
          <div className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            {questionNotice}
          </div>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="studio-card p-8 border border-white/10 bg-black/50">
          <div className="mb-5 flex items-center gap-3 text-[#d4af37]">
            <Target className="h-5 w-5" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Question preview</span>
          </div>
          <p className="text-2xl font-serif leading-snug text-white">
            {upcomingQuestion?.question_text ?? plan.warmupDrill.prompt}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {(upcomingQuestion ? [upcomingQuestion.category, upcomingQuestion.difficulty, upcomingQuestion.company_mode ?? 'General'] : [setup.type, setup.difficulty, setup.role]).map((tag) => (
              <span key={tag} className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <PrepBlock
          icon={<TimerReset className="h-5 w-5" />}
          title="90-second warmup"
          items={plan.warmupDrill.steps}
          lead={plan.warmupDrill.prompt}
        />
      </div>

      <div className="studio-card border border-sky-500/20 bg-sky-500/[0.03] p-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-lg border border-sky-400/20 bg-sky-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-sky-200">
              <FileText className="h-3.5 w-3.5" />
              RAG context
            </div>
            <h3 className="mt-4 text-2xl font-serif text-white">Personalize the interviewer</h3>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
              Paste a resume, job description, company notes, or project notes. The bot will retrieve relevant snippets to create sharper questions and grounded feedback.
            </p>
          </div>
          <label className={`inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:bg-white/10 ${isSavingContext ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
            <Upload className="h-4 w-4" />
            {isSavingContext ? 'Uploading...' : 'Upload File'}
            <input
              type="file"
              accept=".txt,.md,.csv,.json,.docx,.pdf"
              className="hidden"
              disabled={isSavingContext}
              onChange={(event) => void handleFile(event.target.files?.[0])}
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_220px]">
          <input
            value={contextTitle}
            onChange={(event) => setContextTitle(event.target.value)}
            className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-slate-200 outline-none focus:border-sky-400/40"
            placeholder="Context title"
          />
          <select
            value={sourceType}
            onChange={(event) => setSourceType(event.target.value)}
            className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-slate-200 outline-none focus:border-sky-400/40"
          >
            <option value="resume">Resume</option>
            <option value="job_description">Job description</option>
            <option value="company_notes">Company notes</option>
            <option value="project_notes">Project notes</option>
            <option value="notes">Other notes</option>
          </select>
        </div>

        <textarea
          value={contextContent}
          onChange={(event) => setContextContent(event.target.value)}
          className="mt-4 h-44 w-full resize-none rounded-2xl border border-white/10 bg-black/30 p-5 text-sm leading-7 text-slate-200 outline-none placeholder:text-slate-700 focus:border-sky-400/40"
          placeholder="Paste your resume, target job description, company notes, or project stories here..."
        />

        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-xs text-slate-500">
            {ragNotice || 'Upload or paste at least 80 characters. Saved context is chunked locally and retrieved during questions and scoring.'}
          </div>
          <button
            onClick={() => void handleSaveContext()}
            disabled={!canSaveContext}
            className="rounded-xl bg-sky-300 px-6 py-3 text-xs font-black uppercase tracking-widest text-black transition-all hover:bg-sky-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSavingContext ? 'Saving...' : 'Save Context'}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
        <PrepBlock icon={<Layers className="h-5 w-5" />} title="Likely topics" items={plan.likelyTopics} />
        <PrepBlock icon={<ClipboardList className="h-5 w-5" />} title="Answer framework" items={plan.answerFramework} />
        <PrepBlock icon={<Building2 className="h-5 w-5" />} title="Company signals" items={plan.companySignals} />
        <PrepBlock icon={<CheckCircle2 className="h-5 w-5" />} title="Mistakes to avoid" items={plan.mistakeWatchlist} />
      </div>

      <div className="flex justify-start pt-4">
          <button 
            onClick={onStartInterview}
            className="px-10 py-5 rounded-xl bg-[#d4af37] text-black font-black text-sm uppercase tracking-[0.16em] flex items-center justify-center gap-4 gold-glow hover:bg-[#c5a032] transition-all hover:scale-[1.02] active:scale-95"
          >
            Start Interview Mode <ArrowRight className="w-5 h-5" />
          </button>
      </div>
    </div>
  );
}

function PrepBlock({ icon, title, items, lead }: { icon: React.ReactNode; title: string; items: string[]; lead?: string }) {
  return (
    <div className="studio-card p-6 border border-white/5 bg-white/[0.015]">
      <div className="mb-5 flex items-center gap-3 text-[#d4af37]">
        {icon}
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{title}</span>
      </div>
      {lead && <p className="mb-5 text-sm font-medium leading-6 text-white/80">{lead}</p>}
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item} className="flex gap-3 text-sm leading-6 text-slate-400">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#d4af37]" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
