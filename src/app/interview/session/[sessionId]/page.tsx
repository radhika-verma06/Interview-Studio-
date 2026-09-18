'use client';

import { useState, useEffect, useRef, use, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { api, AnswerResponse, Question } from '@/lib/api';
import { createFallbackQuestion, createLocalFeedback, resolvedCompany, setupFromSession } from '@/lib/interviewContent';
import { analyseLiveAnswer } from '@/lib/liveInterview';

// Components
import AppHeader from '@/components/AppHeader';
import SessionSetupSidebar, { SessionSetupState } from '@/components/SessionSetupSidebar';
import TabSwitcher from '@/components/TabSwitcher';
import RevisionPrep from '@/components/RevisionPrep';
import PrepInsights from '@/components/PrepInsights';
import InterviewMode from '@/components/InterviewMode';
import StudioControls from '@/components/StudioControls';

const DEFAULT_SETUP: SessionSetupState = {
  role: "AI Engineer",
  companyPack: "Big Tech",
  targetCompany: "Google",
  customCompany: "",
  difficulty: "Medium",
  type: "Technical",
  freshEachRun: true,
};

const KNOWN_COMPANIES = ["Google", "Amazon", "Microsoft", "OpenAI", "Atlassian", "Meta", "Apple", "Netflix", "Tesla", "Canva"];

function mergeSetupFromQuestion(setup: SessionSetupState, question: Question): SessionSetupState {
  const company = question.company_mode || resolvedCompany(setup);
  const isKnownCompany = KNOWN_COMPANIES.includes(company);

  return {
    ...setup,
    role: question.role === "General" ? setup.role : question.role,
    targetCompany: isKnownCompany ? company : setup.targetCompany,
    customCompany: isKnownCompany ? "" : company,
    difficulty: question.difficulty || setup.difficulty,
    type: question.category || setup.type,
  };
}

export default function InterviewStudioPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const router = useRouter();

  // State for Setup
  const [setup, setSetup] = useState<SessionSetupState>(DEFAULT_SETUP);

  // State for UI
  const [activeTab, setActiveTab] = useState<'revisionPrep' | 'interviewMode'>('revisionPrep');
  const [showQuestions, setShowQuestions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  // State for Interview
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [notesByQuestion, setNotesByQuestion] = useState<Record<number, string>>({});
  const [feedbackByQuestion, setFeedbackByQuestion] = useState<Record<number, AnswerResponse>>({});
  const [markedForRevision, setMarkedForRevision] = useState<Record<number, boolean>>({});
  const [followUpUsedByQuestion, setFollowUpUsedByQuestion] = useState<Record<number, boolean>>({});
  const [timer, setTimer] = useState(0);
  const [status, setStatus] = useState("Resting...");
  const [regenerating, setRegenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);
  const [questionNotice, setQuestionNotice] = useState<string | null>(null);
  const [ragNotice, setRagNotice] = useState<string | null>(null);
  const [savingContext, setSavingContext] = useState(false);
  const [questionSource, setQuestionSource] = useState<'backend' | 'local'>('backend');

  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  const currentQuestion = questions[currentIndex];
  const currentNotes = notesByQuestion[currentIndex] || '';
  const liveCoach = useMemo(
    () => analyseLiveAnswer(currentNotes, currentQuestion, timer),
    [currentNotes, currentQuestion, timer],
  );

  const loadFirstQuestion = useCallback(async (activeSetup: SessionSetupState, showFullScreen = false) => {
    if (showFullScreen) {
      setLoading(true);
    }
    setQuestionLoading(true);
    try {
        const firstQuestion = await api.getNextQuestion(sessionId);
        setQuestions([firstQuestion]);
        setSetup((prev) => mergeSetupFromQuestion(prev, firstQuestion));
        setCurrentIndex(0);
        setQuestionSource('backend');
        setQuestionNotice(null);
    } catch (e) {
        console.warn('Question fetch failed, using local prompt.', e);
        setQuestions([createFallbackQuestion(activeSetup, 0)]);
        setCurrentIndex(0);
        setQuestionSource('local');
        setQuestionNotice('The backend did not return a question, so this session is using a local realistic mock-interview prompt. You can still practice and get coaching.');
    } finally {
        setQuestionLoading(false);
        if (showFullScreen) {
          setLoading(false);
        }
    }
  }, [sessionId]);

  const bootSession = useCallback(async () => {
    setLoading(true);
    let activeSetup = DEFAULT_SETUP;
    try {
      const session = await api.getInterview(sessionId);
      if (session) {
        activeSetup = setupFromSession(session);
        setSetup(activeSetup);
      }
    } catch (e) {
      console.warn('Session setup fetch failed, using available question data.', e);
      if (!sessionId.startsWith('demo-')) {
        setQuestionNotice('Could not load the saved session setup, so the studio is using the default interview profile.');
      }
    }

    await loadFirstQuestion(activeSetup);
    setLoading(false);
  }, [loadFirstQuestion, sessionId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void bootSession();
    }, 0);
    return () => {
      clearTimeout(timer);
      if (timerInterval.current) clearInterval(timerInterval.current);
    };
  }, [bootSession]);

  const playSound = (url: string) => {
    new Audio(url).play().catch(() => {});
  };

  const handleStartInterviewMode = () => {
    if (!questions[currentIndex]) {
      setQuestions([createFallbackQuestion(setup, currentIndex)]);
      setCurrentIndex(0);
      setQuestionSource('local');
      setQuestionNotice('A backup prompt was generated so the interview can start immediately.');
    }
    setActiveTab('interviewMode');
    setStatus("Resting...");
    if (timerInterval.current) clearInterval(timerInterval.current);
    setTimer(0);
    timerInterval.current = setInterval(() => setTimer(prev => prev + 1), 1000);
    
    playSound('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
  };

  const handleGenerateFresh = async () => {
    setLoading(true);
    setNotesByQuestion({});
    setFeedbackByQuestion({});
    setMarkedForRevision({});
    setFollowUpUsedByQuestion({});
    setSessionNotice(null);
    setQuestionNotice(null);
    setActiveTab('revisionPrep');
    try {
      const session = await api.startInterview({
        role: setup.role,
        company_mode: resolvedCompany(setup),
        difficulty: setup.difficulty,
        interview_type: setup.type,
        answer_mode: "Mixed",
      });
      router.push(`/interview/session/${session.id}`);
      playSound('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    } catch (error) {
      console.error(error);
      await loadFirstQuestion(setup);
      setLoading(false);
      playSound('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    }
  };

  const handleSaveContext = async (payload: { title: string; source_type: string; content: string }) => {
    setSavingContext(true);
    setRagNotice(null);
    try {
      await api.createKnowledgeDocument({
        session_id: sessionId,
        ...payload,
      });
      setRagNotice('Context saved. I regenerated the upcoming prompt using retrieved resume/JD/company context.');
      setQuestionNotice('RAG context is active for this session. Questions and feedback can now use your saved context.');
      await loadFirstQuestion(setup);
    } catch (error) {
      console.error(error);
      setRagNotice('Could not save context. Check that the backend has been restarted with the latest code.');
    } finally {
      setSavingContext(false);
    }
  };

  const handleUploadContext = async (payload: { file: File; title: string; source_type: string }) => {
    setSavingContext(true);
    setRagNotice(`Uploading ${payload.title}...`);
    try {
      await api.uploadKnowledgeDocument({
        session_id: sessionId,
        ...payload,
      });
      setRagNotice(`${payload.title} uploaded. I regenerated the next prompt from the retrieved file context.`);
      setQuestionNotice('RAG context is active for this session. Questions and feedback can now use your uploaded file.');
      await loadFirstQuestion(setup);
    } catch (error) {
      console.error(error);
      setRagNotice('Could not read that file. For PDFs, try exporting text or paste the content into the box.');
      throw error;
    } finally {
      setSavingContext(false);
    }
  };

  const loadNextQuestion = async () => {
    if (questionSource === 'local') {
      setQuestions((prev) => [...prev, createFallbackQuestion(setup, prev.length)]);
      setCurrentIndex((prev) => prev + 1);
      setStatus("Resting...");
      return;
    }

    try {
      const nextQuestion = await api.getNextQuestion(sessionId, questions.map((question) => question.id));
      setQuestions((prev) => [...prev, nextQuestion]);
      setCurrentIndex((prev) => prev + 1);
      setStatus("Resting...");
      playSound('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
    } catch (error) {
      console.error(error);
      setQuestions((prev) => [...prev, createFallbackQuestion(setup, prev.length)]);
      setQuestionSource('local');
      setQuestionNotice('The backend ran out of matching questions, so I generated a backup prompt to keep the mock interview moving.');
      setCurrentIndex((prev) => prev + 1);
      setStatus("Resting...");
    }
  };

  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setStatus("Resting...");
        playSound('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
    } else {
        await loadNextQuestion();
    }
  };

  const handleDrillFollowUp = async () => {
    const currentQuestion = questions[currentIndex];
    const currentFeedback = feedbackByQuestion[currentIndex];
    if (!currentQuestion || !currentFeedback?.follow_up_question || followUpUsedByQuestion[currentIndex]) {
      return;
    }

    const fallbackFollowUpQuestion: Question = {
      id: -1000 - questions.length,
      role: setup.role,
      category: currentFeedback.detected_weak_area || currentQuestion.category,
      difficulty: currentQuestion.difficulty,
      company_mode: currentQuestion.company_mode,
      question_text: currentFeedback.follow_up_question,
      ideal_answer:
        currentFeedback.improvement_suggestions.join(' ') ||
        currentFeedback.ideal_answer ||
        'A strong follow-up answer addresses the weakness directly, gives evidence, and names the trade-off.',
    };

    let followUpQuestion = fallbackFollowUpQuestion;
    setRegenerating(true);
    try {
      followUpQuestion = await api.createFollowUpQuestion(sessionId, {
        question_text: fallbackFollowUpQuestion.question_text,
        category: fallbackFollowUpQuestion.category,
        difficulty: fallbackFollowUpQuestion.difficulty,
        ideal_answer: fallbackFollowUpQuestion.ideal_answer ?? undefined,
      });
    } catch (error) {
      console.warn('Could not persist follow-up question, using local probe.', error);
      setSessionNotice('The follow-up probe is running locally because the backend follow-up endpoint was unavailable.');
    } finally {
      setRegenerating(false);
    }

    setQuestions((prev) => [...prev, followUpQuestion]);
    setFollowUpUsedByQuestion((prev) => ({ ...prev, [currentIndex]: true }));
    setCurrentIndex(questions.length);
    setStatus("Resting...");
    setSessionNotice(null);
    playSound('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
        setStatus("Resting...");
    }
  };

  const handleSkip = async () => {
    await handleNext();
  };

  const handleRegenerateCurrent = async () => {
    const currentQuestion = questions[currentIndex];
    if (regenerating || submitting) return;

    setRegenerating(true);
    setSessionNotice(null);
    try {
      if (!currentQuestion || questionSource === 'local' || currentQuestion.id < 0) {
        const replacement = createFallbackQuestion(setup, currentIndex + 1);
        setQuestions((prev) => {
          const updated = [...prev];
          updated[currentIndex] = replacement;
          return updated.length ? updated : [replacement];
        });
        setQuestionSource('local');
        setQuestionNotice('Generated a fresh backup prompt for this interview.');
        setStatus("Resting...");
        return;
      }

      const replacement = await api.regenerateQuestion(sessionId, currentQuestion.id);
      setQuestions((prev) => {
        const updated = [...prev];
        updated[currentIndex] = replacement;
        return updated;
      });
      setNotesByQuestion((prev) => ({ ...prev, [currentIndex]: '' }));
      setFeedbackByQuestion((prev) => {
        const updated = { ...prev };
        delete updated[currentIndex];
        return updated;
      });
      setStatus("Resting...");
      playSound('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    } catch (error) {
      console.error(error);
      setSessionNotice('No alternate question available yet. Try Next Question or adjust your setup.');
    } finally {
      setRegenerating(false);
    }
  };

  const handleMarkRevision = () => {
    setMarkedForRevision((prev) => ({ ...prev, [currentIndex]: !prev[currentIndex] }));
  };

  const handleSubmitAnswer = async (answer: string) => {
    const currentQuestion = questions[currentIndex];
    if (!currentQuestion || !answer.trim() || regenerating || submitting) {
      return;
    }

    setSubmitting(true);
    setSessionNotice(null);
    setStatus("Analysing...");
    playSound('https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3');
    
    try {
      if (currentQuestion.id < 0 || questionSource === 'local') {
        const result = createLocalFeedback(currentQuestion, answer, timer);
        setFeedbackByQuestion((prev) => ({ ...prev, [currentIndex]: result }));
        setStatus("Complete");
        playSound('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
        return;
      }

      const result = await api.submitAnswer(sessionId, currentQuestion.id, answer, timer);
      setFeedbackByQuestion((prev) => ({ ...prev, [currentIndex]: result }));
      setStatus("Complete");
      playSound('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
    } catch (error) {
      console.error(error);
      const result = createLocalFeedback(currentQuestion, answer, timer);
      setFeedbackByQuestion((prev) => ({ ...prev, [currentIndex]: result }));
      setSessionNotice('The backend evaluation was unavailable, so I generated local coaching for this answer.');
      setStatus("Complete");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleVoiceMode = () => {
    setIsVoiceActive(!isVoiceActive);
    playSound('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
  };

  const handleEndSession = async () => {
    try {
      await api.completeInterview(sessionId);
    } catch (error) {
      console.error(error);
    } finally {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
      router.push(`/interview/summary/${sessionId}`);
    }
  };

  if (loading) {
    return (
        <div className="min-h-screen bg-[#040608] flex items-center justify-center">
            <div className="flex flex-col items-center gap-10">
                <div className="w-24 h-24 border-4 border-[#d6b24d]/10 border-t-[#d6b24d] rounded-full animate-spin gold-glow" />
                <div className="text-center space-y-3">
                    <p className="text-[#d6b24d] font-serif text-3xl italic animate-pulse">Studio Warmup...</p>
                    <p className="text-slate-600 font-mono tracking-widest text-[10px] uppercase">Calibrating Audio & Visuals</p>
                </div>
            </div>
        </div>
    );
  }

  const displayStatus =
    regenerating || questionLoading || submitting
      ? "Analysing..."
      : feedbackByQuestion[currentIndex]
        ? "Complete"
        : activeTab === 'interviewMode' && currentNotes.trim()
          ? isVoiceActive ? "Listening..." : "Drafting..."
          : status;

  return (
    <div className="min-h-screen flex flex-col bg-[#040608] studio-gradient relative">
      <AppHeader 
        onStartInterview={handleStartInterviewMode}
        onGenerateFresh={handleGenerateFresh}
        showQuestions={showQuestions}
        setShowQuestions={setShowQuestions}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <SessionSetupSidebar setup={setup} setSetup={setSetup} />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto px-10 py-12 scrollbar-none">
            <div className="max-w-6xl mx-auto space-y-12">
                <TabSwitcher activeTab={activeTab} setActiveTab={setActiveTab} />
                
                {activeTab === 'revisionPrep' ? (
                    <RevisionPrep
                      setup={setup}
                      upcomingQuestion={questions[currentIndex] ?? questions[0]}
                      questionNotice={questionNotice}
                      ragNotice={ragNotice}
                      isSavingContext={savingContext}
                      onSaveContext={handleSaveContext}
                      onUploadContext={handleUploadContext}
                      onStartInterview={handleStartInterviewMode}
                    />
                ) : (
                    <InterviewMode 
                        questions={questions}
                        currentIndex={currentIndex}
                        onNext={() => void handleNext()}
                        onPrev={handlePrev}
                        onSkip={() => void handleSkip()}
                        onRegenerate={() => void handleRegenerateCurrent()}
                        onMarkRevision={handleMarkRevision}
                        isMarked={!!markedForRevision[currentIndex]}
                        notes={currentNotes}
                        setNotes={(val) => setNotesByQuestion((prev) => ({ ...prev, [currentIndex]: val }))}
                        timer={timer}
                        isVoiceActive={isVoiceActive}
                        onToggleVoice={handleToggleVoiceMode}
                        onSubmit={(answer) => void handleSubmitAnswer(answer)}
                        onDrillFollowUp={handleDrillFollowUp}
                        followUpUsed={!!followUpUsedByQuestion[currentIndex]}
                        currentFeedback={feedbackByQuestion[currentIndex]}
                        isProcessing={regenerating || submitting || questionLoading}
                        notice={sessionNotice ?? undefined}
                        onRetryQuestion={() => void loadFirstQuestion(setup)}
                    />
                )}
            </div>
        </main>

        {/* Right Sidebar */}
        {activeTab === 'revisionPrep' ? (
            <PrepInsights setup={setup} upcomingQuestion={questions[currentIndex] ?? questions[0]} />
        ) : (
            <StudioControls 
                timer={timer}
                currentIndex={currentIndex}
                totalQuestions={questions.length}
                status={displayStatus}
                liveCoach={liveCoach}
                isVoiceActive={isVoiceActive}
                onRegenerate={() => void handleRegenerateCurrent()}
                onSave={() => void handleSubmitAnswer(currentNotes)}
                onEnd={() => void handleEndSession()}
                onVoiceMode={handleToggleVoiceMode}
                actionsDisabled={regenerating || submitting}
            />
        )}
      </div>
    </div>
  );
}
