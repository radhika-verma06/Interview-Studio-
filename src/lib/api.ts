// Define the base URL for the backend API
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export interface InterviewSetup {
  role: string;
  company_mode: string;
  difficulty: string;
  interview_type: string;
  answer_mode: string;
}

export interface InterviewSession {
  id: string;
  user_id: number;
  role: string;
  company_mode: string;
  difficulty: string;
  interview_type: string;
  answer_mode: string;
  status: string;
  overall_score: number;
  started_at: string;
  completed_at: string | null;
}

export interface Question {
  id: number;
  role: string;
  category: string;
  difficulty: string;
  company_mode: string | null;
  question_text: string;
  ideal_answer: string | null;
}

export interface AnswerResponse {
  id: number;
  session_id: string;
  question_id: number;
  transcript: string;
  overall_score: number;
  concept_score: number;
  depth_score: number;
  clarity_score: number;
  examples_score: number;
  interview_readiness_score: number;
  strengths: string[];
  weaknesses: string[];
  improvement_suggestions: string[];
  ideal_answer: string;
  improved_answer: string;
  follow_up_question: string;
  detected_weak_area: string;
  question_text?: string;
  retrieved_context?: RetrievedContext[];
}

export interface RetrievedContext {
  title: string;
  source_type: string;
  content: string;
}

export interface KnowledgeDocumentInput {
  session_id?: string;
  title: string;
  source_type: string;
  content: string;
}

export interface KnowledgeUploadInput {
  session_id?: string;
  title?: string;
  source_type: string;
  file: File;
}

export interface KnowledgeDocument {
  id: number;
  session_id: string | null;
  title: string;
  source_type: string;
  created_at: string;
}

export interface FollowUpQuestionInput {
  question_text: string;
  category: string;
  difficulty?: string;
  ideal_answer?: string;
}

export interface SummaryAnswer {
  id: number;
  question_id: number;
  question_text: string;
  overall_score: number;
  strengths: string[];
  weaknesses: string[];
  detected_weak_area: string;
  improvement_suggestions: string[];
  follow_up_question: string;
}

export interface DrillFocusArea {
  area: string;
  action: string;
  goal: string;
}

export interface DrillQueueItem {
  question_id: number;
  question_text: string;
  score: number;
  due_in: string;
}

export interface SummaryResponse {
  session: InterviewSession;
  stats: {
    avg_score: number;
    best_score: number;
    total_answered: number;
  };
  answers: SummaryAnswer[];
  drill_plan: {
    focus_areas: DrillFocusArea[];
    redo_queue: DrillQueueItem[];
  };
}

export const api = {
  // Start a new interview session
  async startInterview(setup: InterviewSetup): Promise<InterviewSession> {
    const res = await fetch(`${API_BASE_URL}/interviews/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(setup),
    });
    if (!res.ok) throw new Error('Failed to start interview');
    return res.json();
  },

  // Get an existing interview session
  async getInterview(sessionId: string): Promise<InterviewSession | null> {
    const res = await fetch(`${API_BASE_URL}/interviews/${sessionId}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Failed to fetch interview session');
    return res.json();
  },

  // Get the next available question for the session
  async getNextQuestion(sessionId: string, excludeQuestionIds: number[] = []): Promise<Question> {
    const params = new URLSearchParams();
    const visibleIds = excludeQuestionIds.filter((id) => id > 0);
    if (visibleIds.length) {
      params.set('exclude_ids', visibleIds.join(','));
    }
    const query = params.toString();
    const res = await fetch(`${API_BASE_URL}/interviews/${sessionId}/question${query ? `?${query}` : ''}`);
    if (!res.ok) throw new Error('Failed to get next question');
    return res.json();
  },

  // Regenerate the current question with a backend-selected alternate
  async regenerateQuestion(sessionId: string, currentQuestionId: number): Promise<Question> {
    const res = await fetch(
      `${API_BASE_URL}/interviews/${sessionId}/question/regenerate?current_question_id=${currentQuestionId}`,
      { method: 'POST' },
    );
    if (!res.ok) throw new Error('Failed to regenerate question');
    return res.json();
  },

  // Persist an interviewer follow-up probe as a real question in the session
  async createFollowUpQuestion(sessionId: string, input: FollowUpQuestionInput): Promise<Question> {
    const res = await fetch(`${API_BASE_URL}/interviews/${sessionId}/question/follow-up`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error('Failed to create follow-up question');
    return res.json();
  },

  // Add resume, JD, company notes, or project notes to the local RAG knowledge base
  async createKnowledgeDocument(input: KnowledgeDocumentInput): Promise<KnowledgeDocument> {
    const res = await fetch(`${API_BASE_URL}/knowledge/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error('Failed to save interview context');
    return res.json();
  },

  async uploadKnowledgeDocument(input: KnowledgeUploadInput): Promise<KnowledgeDocument> {
    const formData = new FormData();
    formData.append('file', input.file, input.file.name);
    formData.append('source_type', input.source_type);
    if (input.session_id) formData.append('session_id', input.session_id);
    if (input.title) formData.append('title', input.title);

    const res = await fetch(`${API_BASE_URL}/knowledge/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to upload interview context');
    return res.json();
  },

  async searchKnowledge(query: string, sessionId?: string): Promise<RetrievedContext[]> {
    const params = new URLSearchParams({ query });
    if (sessionId) params.set('session_id', sessionId);
    const res = await fetch(`${API_BASE_URL}/knowledge/search?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to search interview context');
    return res.json();
  },

  // Submit an answer (text or transcript) for evaluation
  async submitAnswer(sessionId: string, questionId: number, transcript: string, durationSeconds: number): Promise<AnswerResponse> {
    const res = await fetch(`${API_BASE_URL}/interviews/${sessionId}/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question_id: questionId, transcript, duration_seconds: durationSeconds }),
    });
    if (!res.ok) throw new Error('Failed to submit answer');
    return res.json();
  },

  // Complete the interview session
  async completeInterview(sessionId: string): Promise<{ message: string; session_id: string }> {
    const res = await fetch(`${API_BASE_URL}/interviews/${sessionId}/complete`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to complete interview');
    return res.json();
  },

  // Get session summary
  async getSummary(sessionId: string): Promise<SummaryResponse> {
    const res = await fetch(`${API_BASE_URL}/interviews/${sessionId}/summary`);
    if (!res.ok) throw new Error('Failed to fetch summary');
    return res.json();
  },

  // Get dashboard data
  async getDashboard() {
    const res = await fetch(`${API_BASE_URL}/dashboard`);
    if (!res.ok) throw new Error('Failed to fetch dashboard');
    return res.json();
  },

  // Transcribe audio using the backend endpoint
  async transcribeAudio(audioBlob: Blob): Promise<{ transcript: string }> {
    const formData = new FormData();
    formData.append('audio_file', audioBlob, 'recording.webm');
    const res = await fetch(`${API_BASE_URL}/transcribe`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
        throw new Error('Failed to transcribe audio');
    }
    return res.json();
  }
};
