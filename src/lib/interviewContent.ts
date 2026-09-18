import type { AnswerResponse, InterviewSession, Question } from './api';
import type { SessionSetupState } from '@/components/SessionSetupSidebar';

export interface RevisionPlan {
  headline: string;
  brief: string;
  likelyTopics: string[];
  answerFramework: string[];
  companySignals: string[];
  warmupDrill: {
    prompt: string;
    steps: string[];
  };
  mistakeWatchlist: string[];
}

const roleFocus: Record<string, string[]> = {
  'AI Engineer': [
    'model-product fit',
    'retrieval and evaluation',
    'latency, cost, and reliability trade-offs',
    'safety, privacy, and failure modes',
  ],
  'ML Engineer': [
    'modeling fundamentals',
    'feature quality and data leakage',
    'offline versus online evaluation',
    'deployment and monitoring',
  ],
  'Software Engineer': [
    'data structures and system trade-offs',
    'API design',
    'operability and testing',
    'scalability bottlenecks',
  ],
  'Product Manager': [
    'user problem framing',
    'success metrics',
    'trade-offs and prioritization',
    'launch and iteration strategy',
  ],
  'Data Analyst': [
    'metric definitions',
    'experiment design',
    'data quality checks',
    'business interpretation',
  ],
  Consultant: [
    'problem decomposition',
    'hypothesis-led analysis',
    'executive communication',
    'risk and implementation planning',
  ],
  'UX Researcher': [
    'research planning',
    'participant selection',
    'synthesis and insight quality',
    'influencing product decisions',
  ],
  Marketing: [
    'audience segmentation',
    'channel strategy',
    'creative testing',
    'pipeline and attribution',
  ],
  Sales: [
    'discovery',
    'qualification',
    'objection handling',
    'closing and next steps',
  ],
  Operations: [
    'process mapping',
    'root-cause analysis',
    'service-level metrics',
    'change management',
  ],
};

const companySignals: Record<string, string[]> = {
  Google: ['structured reasoning', 'technical depth', 'scalable systems', 'measurable impact'],
  Meta: ['speed of execution', 'experimentation', 'ambiguity tolerance', 'impact at scale'],
  OpenAI: ['safety-aware product judgment', 'eval-driven iteration', 'research-to-product thinking', 'responsible deployment'],
  Atlassian: ['team collaboration', 'workflow clarity', 'enterprise reliability', 'customer empathy'],
  Canva: ['creator empathy', 'fast product iteration', 'design quality', 'simple experiences at scale'],
  Amazon: ['customer obsession', 'ownership', 'operational rigor', 'clear metrics'],
  Microsoft: ['platform thinking', 'enterprise trust', 'cross-functional collaboration', 'accessibility'],
  Apple: ['craft', 'privacy', 'simplicity', 'hardware/software integration'],
  Netflix: ['high judgment', 'personal ownership', 'experimentation', 'quality bar'],
  Tesla: ['first-principles thinking', 'execution intensity', 'systems constraints', 'manufacturing awareness'],
  Startup: ['resourcefulness', 'speed', 'scope control', 'learning loops'],
  General: ['clear structure', 'specific examples', 'trade-off awareness', 'measurable outcomes'],
};

const fallbackQuestions: Record<string, Omit<Question, 'id'>[]> = {
  'AI Engineer': [
    {
      role: 'AI Engineer',
      category: 'RAG Systems',
      difficulty: 'Medium',
      company_mode: 'General',
      question_text:
        'Design a retrieval-augmented assistant for interview preparation. How would you evaluate answer quality and reduce hallucinations?',
      ideal_answer:
        'Cover data ingestion, retrieval, ranking, prompt construction, evaluation sets, human review, latency/cost trade-offs, and guardrails for unsupported claims.',
    },
    {
      role: 'AI Engineer',
      category: 'Evaluation',
      difficulty: 'Medium',
      company_mode: 'General',
      question_text:
        'A model gives confident but shallow feedback to users. How would you diagnose and improve the feedback system?',
      ideal_answer:
        'Define quality rubrics, inspect examples, add structured critiques, compare model outputs to expert feedback, track calibration, and test with real users.',
    },
  ],
  'ML Engineer': [
    {
      role: 'ML Engineer',
      category: 'System Design',
      difficulty: 'Medium',
      company_mode: 'General',
      question_text:
        'Design a model monitoring system for a production classifier. What metrics, alerts, and retraining triggers would you use?',
      ideal_answer:
        'Cover data drift, prediction drift, calibration, business KPIs, latency, errors, alert thresholds, retraining criteria, and human review loops.',
    },
    {
      role: 'ML Engineer',
      category: 'Fundamentals',
      difficulty: 'Medium',
      company_mode: 'General',
      question_text:
        'Explain precision, recall, and F1. How would you choose the right threshold for a high-risk application?',
      ideal_answer:
        'Explain metric trade-offs, cost of false positives/false negatives, validation curves, calibration, stakeholder risk tolerance, and monitoring after launch.',
    },
  ],
  'Software Engineer': [
    {
      role: 'Software Engineer',
      category: 'System Design',
      difficulty: 'Medium',
      company_mode: 'General',
      question_text:
        'Design a URL shortener. Walk through the API, data model, scaling plan, and operational risks.',
      ideal_answer:
        'Cover key generation, redirects, persistence, caching, rate limits, analytics, abuse prevention, availability, and trade-offs.',
    },
  ],
  'Product Manager': [
    {
      role: 'Product Manager',
      category: 'Product Sense',
      difficulty: 'Medium',
      company_mode: 'General',
      question_text:
        'How would you improve an AI mock interview product for job seekers preparing for senior roles?',
      ideal_answer:
        'Clarify users, pain points, segmentation, success metrics, solution ideas, prioritization, launch plan, risks, and learning loop.',
    },
  ],
  'Data Analyst': [
    {
      role: 'Data Analyst',
      category: 'Experimentation',
      difficulty: 'Medium',
      company_mode: 'General',
      question_text:
        'A new onboarding flow increased activation but reduced paid conversion. How would you investigate?',
      ideal_answer:
        'Validate metric definitions, segment users, inspect funnel stages, check experiment design, quantify trade-offs, and recommend next tests.',
    },
  ],
  Consultant: [
    {
      role: 'Consultant',
      category: 'Case',
      difficulty: 'Medium',
      company_mode: 'General',
      question_text:
        'A SaaS company has flat revenue despite growing signups. How would you structure the analysis?',
      ideal_answer:
        'Break down acquisition, activation, conversion, retention, pricing, and expansion. Form hypotheses and identify data needed for each branch.',
    },
  ],
  General: [
    {
      role: 'General',
      category: 'Behavioral',
      difficulty: 'Medium',
      company_mode: 'General',
      question_text:
        'Tell me about a time you had to make a difficult trade-off with incomplete information.',
      ideal_answer:
        'Use STAR, explain constraints, alternatives, decision criteria, outcome, and what you learned.',
    },
  ],
};

export function setupFromSession(session: InterviewSession): SessionSetupState {
  return {
    role: session.role,
    companyPack: companyPackFor(session.company_mode),
    targetCompany: knownCompany(session.company_mode) ? session.company_mode : 'Google',
    customCompany: knownCompany(session.company_mode) ? '' : session.company_mode,
    difficulty: session.difficulty,
    type: session.interview_type,
    freshEachRun: true,
  };
}

export function resolvedCompany(setup: SessionSetupState): string {
  return setup.customCompany.trim() || setup.targetCompany || setup.companyPack || 'General';
}

export function createFallbackQuestion(setup: SessionSetupState, index = 0): Question {
  const bank = fallbackQuestions[setup.role] ?? fallbackQuestions.General;
  const template = bank[index % bank.length];

  return {
    id: -1 * (index + 1),
    ...template,
    role: setup.role,
    difficulty: setup.difficulty === 'Mixed' ? template.difficulty : setup.difficulty,
    company_mode: resolvedCompany(setup),
  };
}

export function buildRevisionPlan(setup: SessionSetupState, question?: Question): RevisionPlan {
  const company = resolvedCompany(setup);
  const topics = roleFocus[setup.role] ?? roleFocus['AI Engineer'];
  const signals = companySignals[company] ?? companySignals.General;
  const category = question?.category ?? setup.type;

  return {
    headline: `${setup.role} ${setup.type} prep for ${company}`,
    brief:
      question
        ? `Your first interview question is likely to test ${category}. Use this page to rehearse the concepts, story structure, and trade-offs before the timer starts.`
        : `Use this page to prepare a focused answer strategy for a ${setup.difficulty} ${setup.type.toLowerCase()} interview.`,
    likelyTopics: question ? [category, ...topics.filter((topic) => topic.toLowerCase() !== category.toLowerCase()).slice(0, 3)] : topics,
    answerFramework: [
      'Clarify the goal and constraints before proposing a solution.',
      'State your approach in 2-3 steps so the interviewer can follow your map.',
      'Discuss trade-offs: quality, latency, cost, risk, user experience, and maintenance.',
      'Close with measurement: how you would know the answer or system worked.',
    ],
    companySignals: signals,
    warmupDrill: {
      prompt: question?.question_text ?? `Give a 90-second answer for a ${setup.role} ${setup.type.toLowerCase()} question.`,
      steps: [
        'Say the answer out loud once without stopping.',
        'Repeat it with one concrete example and one measurable outcome.',
        'Add one risk or failure mode, then explain how you would mitigate it.',
      ],
    },
    mistakeWatchlist: [
      'Jumping straight to a solution without clarifying assumptions.',
      'Listing concepts without explaining why they matter.',
      'Ignoring edge cases, failure modes, or operational ownership.',
      'Ending without a metric, learning loop, or next step.',
    ],
  };
}

export function createLocalFeedback(question: Question, transcript: string, durationSeconds: number): AnswerResponse {
  const words = transcript.trim().split(/\s+/).filter(Boolean);
  const lower = transcript.toLowerCase();
  const hasStructure = ['first', 'second', 'finally', 'step', 'trade-off', 'tradeoff'].some((term) => lower.includes(term));
  const hasMetric = ['metric', 'measure', 'latency', 'accuracy', 'conversion', 'retention', 'cost', 'score'].some((term) => lower.includes(term));
  const hasExample = ['for example', 'in my project', 'when i', 'we built', 'i led'].some((term) => lower.includes(term));
  const base = Math.min(55 + Math.floor(words.length / 8), 78);
  const overall = Math.min(base + (hasStructure ? 8 : 0) + (hasMetric ? 7 : 0) + (hasExample ? 7 : 0), 95);

  return {
    id: Date.now(),
    session_id: 'local',
    question_id: question.id,
    transcript,
    overall_score: overall,
    concept_score: hasMetric ? 8 : 6,
    depth_score: hasStructure ? 8 : 6,
    clarity_score: words.length > 45 ? 8 : 6,
    examples_score: hasExample ? 8 : 5,
    interview_readiness_score: Math.max(6, Math.round(overall / 10)),
    strengths: [
      hasStructure ? 'You gave the answer a clear structure.' : 'You started addressing the prompt directly.',
      hasMetric ? 'You included a way to measure success.' : 'You can make this stronger by naming success metrics.',
    ],
    weaknesses: [
      hasExample ? 'The example could be tied more tightly to the interview question.' : 'Add a specific example from a project or realistic product scenario.',
      durationSeconds < 30 ? 'The answer may be too short for a mock interview response.' : 'Watch for extra detail that does not support the core answer.',
    ],
    improvement_suggestions: [
      'Use a crisp opening: goal, constraints, approach.',
      'Add one trade-off and one measurable success metric.',
      'End with how you would validate or iterate after launch.',
    ],
    ideal_answer: question.ideal_answer ?? 'A strong answer states assumptions, proposes a structured approach, discusses trade-offs, and closes with measurement.',
    improved_answer:
      'I would start by clarifying the goal and constraints, then propose a structured approach, call out the key trade-offs, and define success metrics so the decision can be evaluated after implementation.',
    follow_up_question: `What is the biggest risk in your answer to this ${question.category} question, and how would you reduce it?`,
    detected_weak_area: question.category,
    question_text: question.question_text,
  };
}

function knownCompany(company: string): boolean {
  return Object.prototype.hasOwnProperty.call(companySignals, company);
}

function companyPackFor(company: string): string {
  if (['Google', 'Amazon', 'Microsoft', 'Meta', 'Apple', 'Netflix'].includes(company)) return 'Big Tech';
  if (['OpenAI'].includes(company)) return 'AI Labs';
  if (['Canva', 'Atlassian'].includes(company)) return 'Startups';
  return 'Big Tech';
}
