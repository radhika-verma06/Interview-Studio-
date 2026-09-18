'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Mic, ChevronLeft, ArrowRight, Bookmark, ChevronsRight, Layers, Send, Sparkles, TrendingUp, Brain, CheckCircle2, AlertTriangle, MessageSquareQuote } from 'lucide-react';
import NotesPanel from './NotesPanel';
import VoiceRecorder from './VoiceRecorder';
import { AnswerResponse, Question } from '@/lib/api';
import LiveInterviewCoachPanel from './LiveInterviewCoachPanel';
import { analyseLiveAnswer } from '@/lib/liveInterview';

interface InterviewModeProps {
  questions: Question[];
  currentIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onRegenerate: () => void;
  onMarkRevision: () => void;
  isMarked: boolean;
  notes: string;
  setNotes: (val: string) => void;
  timer: number;
  isVoiceActive: boolean;
  onToggleVoice: () => void;
  onSubmit: (answer: string) => void;
  onDrillFollowUp: () => void;
  followUpUsed?: boolean;
  currentFeedback?: AnswerResponse;
  isProcessing?: boolean;
  notice?: string;
  onRetryQuestion?: () => void;
}

export default function InterviewMode({ 
  questions, 
  currentIndex, 
  onNext, 
  onPrev, 
  onSkip, 
  onRegenerate, 
  onMarkRevision,
  isMarked,
  notes,
  setNotes,
  timer,
  isVoiceActive,
  onToggleVoice,
  onSubmit,
  onDrillFollowUp,
  followUpUsed = false,
  currentFeedback,
  isProcessing = false,
  notice,
  onRetryQuestion
}: InterviewModeProps) {
  const currentQuestion = questions[currentIndex];
  const [lastAnswerChangeAt, setLastAnswerChangeAt] = useState(0);
  const timerRef = useRef(timer);

  const liveCoach = useMemo(
    () => analyseLiveAnswer(notes, currentQuestion, timer),
    [currentQuestion, notes, timer],
  );

  useEffect(() => {
    timerRef.current = timer;
  }, [timer]);

  useEffect(() => {
    setLastAnswerChangeAt(timerRef.current);
  }, [currentIndex, notes]);

  const silenceSeconds = Math.max(0, timer - lastAnswerChangeAt);

  if (!currentQuestion) {
    return (
      <div className="animate-in fade-in zoom-in-95 duration-500 max-w-4xl mx-auto mt-4">
        <div className="studio-card p-12 border border-amber-500/20 bg-amber-500/[0.04] space-y-6">
          <div className="inline-flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-amber-200">
            <Sparkles className="h-3.5 w-3.5" />
            Question not loaded
          </div>
          <div>
            <h3 className="text-3xl font-serif text-white">No interview question is available yet.</h3>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">
              The session is running, but the question fetch did not return a prompt. Retry the question load or generate a fresh local prompt so the mock interview can continue.
            </p>
          </div>
          {notice && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100">
              {notice}
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={onRetryQuestion}
              disabled={isProcessing}
              className="rounded-xl bg-[#d4af37] px-6 py-3 text-xs font-black uppercase tracking-widest text-black transition-all hover:bg-[#c5a032] disabled:opacity-40"
            >
              Retry Question
            </button>
            <button
              onClick={onRegenerate}
              disabled={isProcessing}
              className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-xs font-black uppercase tracking-widest text-slate-300 transition-all hover:bg-white/10 disabled:opacity-40"
            >
              Generate Backup
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in zoom-in-95 duration-500 max-w-4xl mx-auto flex flex-col h-full mt-4">
      <div className="flex-1 space-y-8">
        {/* Main Question Card */}
        <div className="studio-card p-16 relative overflow-hidden group min-h-[420px] flex flex-col border border-white/10 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent">
            
            <div className="flex justify-between items-start mb-12">
                <div className="flex items-center gap-6">
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Question {currentIndex + 1} of {questions.length}</span>
                        <div className="px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest border border-indigo-500/20 flex items-center gap-2">
                            <Layers className="w-3.5 h-3.5" /> {currentQuestion.category || "General"}
                        </div>
                    </div>
                </div>
                <div 
                  onClick={onToggleVoice}
                  className={`w-20 h-20 rounded-full border flex items-center justify-center transition-all cursor-pointer relative group-hover:scale-110 ${isVoiceActive ? 'bg-rose-500/10 border-rose-500/40 text-rose-500 gold-glow shadow-[0_0_20px_rgba(244,63,94,0.3)]' : 'bg-[#d4af37]/5 border-[#d4af37]/30 text-[#d4af37]'}`}
                >
                    <Mic className={`w-8 h-8 ${isVoiceActive ? 'animate-pulse' : ''}`} />
                    <div className={`absolute inset-0 rounded-full border-2 border-dashed transition-all duration-[10s] ${isVoiceActive ? 'border-rose-500/20 animate-spin' : 'border-[#d4af37]/20 animate-spin'}`} />
                </div>
            </div>

            <h3 className="text-3xl md:text-5xl font-serif text-white leading-[1.3] mb-12 flex-1 pr-20 font-medium">
                {currentQuestion.question_text}
            </h3>
        </div>

        {/* Voice Recorder Overlay (Conditional) */}
        {isVoiceActive && (
          <div className="animate-in slide-in-from-top-4 duration-300">
            <VoiceRecorder 
              initialTranscript={notes}
              onLiveTranscript={setNotes}
              onTranscriptComplete={setNotes} 
            />
          </div>
        )}

        <LiveInterviewCoachPanel
          coach={liveCoach}
          silenceSeconds={silenceSeconds}
          isVoiceActive={isVoiceActive}
        />

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <button 
                  onClick={onPrev}
                  disabled={currentIndex === 0 || isProcessing}
                  className="px-6 py-4 rounded-xl bg-white/5 text-slate-400 hover:text-white border border-white/5 transition-all disabled:opacity-20 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest"
                >
                    <ChevronLeft className="w-5 h-5" /> Previous
                </button>
                <button 
                  onClick={onRegenerate}
                  disabled={isProcessing}
                  className="px-8 py-4 rounded-xl bg-white/5 text-slate-400 hover:text-white border border-white/5 transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-3 disabled:opacity-30"
                >
                    <Layers className="w-5 h-5" /> Regenerate
                </button>
                <button 
                  onClick={onSkip}
                  disabled={isProcessing}
                  className="px-8 py-4 rounded-xl bg-white/5 text-slate-400 hover:text-white border border-white/5 transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-3 disabled:opacity-30"
                >
                    <ChevronsRight className="w-5 h-5" /> Skip
                </button>
                <button 
                  onClick={onMarkRevision}
                  disabled={isProcessing}
                  className={`px-8 py-4 rounded-xl border transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-3 ${isMarked ? 'bg-[#d4af37] text-black border-[#d4af37]' : 'bg-white/5 text-slate-500 hover:text-white border-white/5'}`}
                >
                    <Bookmark className="w-5 h-5" /> Mark [M]
                </button>
            </div>

            <div className="flex items-center gap-4">
                <button 
                    onClick={() => onSubmit(notes)}
                    disabled={isProcessing || !notes || notes.trim().length < 10}
                    className="px-10 py-5 rounded-xl bg-white/5 border border-white/10 text-white font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-white/10 transition-all disabled:opacity-30"
                >
                    <Send className="w-4 h-4" /> Submit Answer
                </button>
                <button 
                    onClick={onNext}
                    disabled={isProcessing}
                    className="px-14 py-5 rounded-xl bg-[#d4af37] text-black font-black text-sm uppercase tracking-[0.2em] flex items-center gap-3 gold-glow hover:bg-[#c5a032] transition-all hover:scale-[1.02] disabled:opacity-40"
                >
                    Next Question <ArrowRight className="w-5 h-5" />
                </button>
            </div>
        </div>

        {/* Answer / Notes Panel */}
        <NotesPanel 
            value={notes}
            onChange={setNotes}
            onClear={() => setNotes('')}
        />

        {notice && (
          <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-200 text-sm">
            {notice}
          </div>
        )}

        {isProcessing && !currentFeedback && (
          <div className="studio-card p-8 border border-white/10 bg-white/[0.02] animate-pulse space-y-3">
            <div className="h-3 w-40 rounded bg-white/10" />
            <div className="h-3 w-full rounded bg-white/10" />
            <div className="h-3 w-2/3 rounded bg-white/10" />
          </div>
        )}

        {currentFeedback && (
          <div className="studio-card p-8 border border-emerald-500/20 bg-emerald-500/[0.03] space-y-7">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">Interviewer verdict</div>
                <div className="mt-2 text-sm font-medium text-slate-400">
                  {currentFeedback.overall_score >= 85
                    ? 'Strong hire signal. Keep the same structure and sharpen only the edge cases.'
                    : currentFeedback.overall_score >= 70
                      ? 'Promising, but not senior-level yet. The follow-up will test whether the answer holds under pressure.'
                      : 'Weak interview signal. You need more structure, evidence, and measurable reasoning before moving on.'}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-emerald-300 font-black">
                <TrendingUp className="w-4 h-4" />
                <span>{currentFeedback.overall_score}/100</span>
              </div>
            </div>

            <div className="grid md:grid-cols-5 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-black/30 border border-white/10">Accuracy: {currentFeedback.concept_score}/10</div>
              <div className="p-3 rounded-xl bg-black/30 border border-white/10">Depth: {currentFeedback.depth_score}/10</div>
              <div className="p-3 rounded-xl bg-black/30 border border-white/10">Clarity: {currentFeedback.clarity_score}/10</div>
              <div className="p-3 rounded-xl bg-black/30 border border-white/10">Examples: {currentFeedback.examples_score}/10</div>
              <div className="p-3 rounded-xl bg-black/30 border border-white/10">Ready: {currentFeedback.interview_readiness_score}/10</div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FeedbackList
                icon={<CheckCircle2 className="h-4 w-4" />}
                title="What worked"
                tone="good"
                items={currentFeedback.strengths}
              />
              <FeedbackList
                icon={<AlertTriangle className="h-4 w-4" />}
                title="What cost you points"
                tone="warn"
                items={currentFeedback.weaknesses}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#d4af37]">
                  <Brain className="h-4 w-4" />
                  Expected coverage
                </div>
                <p className="text-sm leading-7 text-slate-300">{currentFeedback.ideal_answer}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-sky-300">
                  <MessageSquareQuote className="h-4 w-4" />
                  Stronger version
                </div>
                <p className="text-sm leading-7 text-slate-300">{currentFeedback.improved_answer}</p>
              </div>
            </div>

            {!!currentFeedback.retrieved_context?.length && (
              <div className="rounded-2xl border border-sky-400/20 bg-sky-400/[0.04] p-5">
                <div className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-sky-200">
                  <Brain className="h-4 w-4" />
                  Retrieved evidence used
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {currentFeedback.retrieved_context.slice(0, 4).map((item) => (
                    <div key={`${item.title}-${item.content.slice(0, 24)}`} className="rounded-xl border border-white/10 bg-black/25 p-4">
                      <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-sky-200">{item.source_type} · {item.title}</div>
                      <p className="line-clamp-4 text-xs leading-6 text-slate-300">{item.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-[#d4af37]/20 bg-[#d4af37]/5 p-6">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d4af37]">Interviewer follow-up</div>
                  <p className="mt-3 text-base font-medium leading-7 text-white">{currentFeedback.follow_up_question}</p>
                </div>
                <button
                  onClick={onDrillFollowUp}
                  disabled={followUpUsed || isProcessing}
                  className="shrink-0 rounded-xl bg-[#d4af37] px-6 py-3 text-xs font-black uppercase tracking-widest text-black transition-all hover:bg-[#c5a032] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {followUpUsed ? 'Follow-up added' : 'Answer Follow-up'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="text-center pt-8">
            <div className="inline-flex items-center gap-2 text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                <Sparkles className="w-3 h-3 text-[#d4af37]" />
                Speak or type your answer. The live interviewer reacts immediately; Submit locks in scored feedback.
            </div>
        </div>
      </div>
    </div>
  );
}

function FeedbackList({
  icon,
  title,
  items,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
  tone: 'good' | 'warn';
}) {
  const color = tone === 'good' ? 'text-emerald-300' : 'text-amber-300';

  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
      <div className={`mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] ${color}`}>
        {icon}
        {title}
      </div>
      <div className="space-y-3">
        {(items.length ? items : ['No signal captured yet.']).map((item) => (
          <div key={item} className="flex gap-3 text-sm leading-6 text-slate-300">
            <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${tone === 'good' ? 'bg-emerald-300' : 'bg-amber-300'}`} />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
