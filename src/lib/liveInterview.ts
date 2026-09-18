import type { Question } from './api';

export interface LiveMetric {
  id: string;
  label: string;
  score: number;
  detail: string;
}

export interface LiveInterviewCoach {
  overall: number;
  readiness: string;
  metrics: LiveMetric[];
  strengths: string[];
  missingSignals: string[];
  nudge: string;
  followUp: string;
  pace: string;
  wordCount: number;
}

const STRUCTURE_TERMS = ['first', 'second', 'third', 'finally', 'step', 'approach', 'framework', 'start by', 'then'];
const METRIC_TERMS = ['metric', 'measure', 'latency', 'accuracy', 'conversion', 'retention', 'cost', 'precision', 'recall', 'revenue', 'success', 'kpi'];
const EXAMPLE_TERMS = ['for example', 'in my', 'when i', 'we built', 'i led', 'project', 'launched', 'implemented'];
const TRADEOFF_TERMS = ['trade-off', 'tradeoff', 'risk', 'edge case', 'failure', 'constraint', 'privacy', 'security', 'scale', 'cost'];
const CLOSURE_TERMS = ['validate', 'monitor', 'iterate', 'next step', 'decision', 'learn', 'experiment', 'guardrail'];

function hasAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function metric(id: string, label: string, score: number, detail: string): LiveMetric {
  return { id, label, score: clampScore(score), detail };
}

export function analyseLiveAnswer(answer: string, question: Question | undefined, elapsedSeconds: number): LiveInterviewCoach {
  const cleanAnswer = answer.trim();
  const lower = cleanAnswer.toLowerCase();
  const words = cleanAnswer.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const hasStructure = hasAny(lower, STRUCTURE_TERMS);
  const hasMetrics = hasAny(lower, METRIC_TERMS);
  const hasExample = hasAny(lower, EXAMPLE_TERMS);
  const hasTradeoff = hasAny(lower, TRADEOFF_TERMS);
  const hasClosure = hasAny(lower, CLOSURE_TERMS);
  const questionTerms = (question?.question_text.toLowerCase().match(/[a-z][a-z0-9-]{4,}/g) ?? [])
    .filter((term) => !['would', 'should', 'about', 'interview', 'question'].includes(term));
  const matchedQuestionTerms = new Set(questionTerms.filter((term) => lower.includes(term))).size;

  const structureScore = 25 + (hasStructure ? 45 : 0) + Math.min(wordCount, 80) * 0.25;
  const relevanceScore = 35 + Math.min(matchedQuestionTerms * 10, 35) + (wordCount > 30 ? 15 : 0);
  const evidenceScore = 20 + (hasExample ? 45 : 0) + (hasMetrics ? 25 : 0) + Math.min(wordCount, 100) * 0.08;
  const tradeoffScore = 25 + (hasTradeoff ? 50 : 0) + (hasClosure ? 15 : 0);
  const closingScore = 25 + (hasClosure ? 45 : 0) + (hasMetrics ? 15 : 0) + (wordCount > 75 ? 10 : 0);

  const metrics = [
    metric('structure', 'Structure', structureScore, hasStructure ? 'Clear answer map detected.' : 'Open with goal, constraints, approach.'),
    metric('relevance', 'Relevance', relevanceScore, matchedQuestionTerms > 1 ? 'Answer is tracking the prompt.' : 'Anchor harder to the actual question.'),
    metric('evidence', 'Evidence', evidenceScore, hasExample && hasMetrics ? 'Example and measurement are present.' : 'Add one concrete example and metric.'),
    metric('tradeoffs', 'Trade-offs', tradeoffScore, hasTradeoff ? 'Risk or constraint is being handled.' : 'Name the main risk or trade-off.'),
    metric('close', 'Close', closingScore, hasClosure ? 'You are closing with validation.' : 'End with validation or next step.'),
  ];

  const overall = clampScore(metrics.reduce((sum, item) => sum + item.score, 0) / metrics.length);
  const strengths = [
    hasStructure ? 'Structured delivery' : '',
    hasMetrics ? 'Measurable reasoning' : '',
    hasExample ? 'Concrete evidence' : '',
    hasTradeoff ? 'Trade-off awareness' : '',
    hasClosure ? 'Validation loop' : '',
  ].filter(Boolean);

  const missingSignals = [
    !hasStructure ? 'answer map' : '',
    !hasMetrics ? 'metrics' : '',
    !hasExample ? 'specific example' : '',
    !hasTradeoff ? 'risk or trade-off' : '',
    !hasClosure ? 'validation close' : '',
  ].filter(Boolean);

  const paceWpm = elapsedSeconds > 15 ? Math.round((wordCount / elapsedSeconds) * 60) : 0;
  const pace =
    paceWpm === 0
      ? 'Calibrating pace'
      : paceWpm < 85
        ? `${paceWpm} wpm. Too slow for interview energy.`
        : paceWpm > 180
          ? `${paceWpm} wpm. Slow down and add signposts.`
          : `${paceWpm} wpm. Good interview pace.`;

  let nudge = 'Start with a direct one-sentence answer, then explain the reasoning.';
  if (wordCount > 25 && !hasStructure) nudge = 'Pause and add structure: goal, constraints, approach, trade-off, metric.';
  else if (wordCount > 35 && !hasExample) nudge = 'Make it real: add one project or product example now.';
  else if (wordCount > 45 && !hasMetrics) nudge = 'Add the metric an interviewer would use to judge success.';
  else if (wordCount > 60 && !hasTradeoff) nudge = 'Pressure-test it: name the failure mode or trade-off.';
  else if (wordCount > 80 && !hasClosure) nudge = 'Close the answer with how you would validate or iterate.';
  else if (overall >= 78) nudge = 'Good signal. Tighten the ending and stop before you ramble.';

  const category = question?.category || 'this area';
  const followUp =
    !hasMetrics
      ? `What exact metric would prove your ${category} answer worked, and what guardrail would stop a bad launch?`
      : !hasExample
        ? `Give me one concrete example from a project or realistic scenario that proves this approach works.`
        : !hasTradeoff
          ? `What breaks first in your approach, and how would you detect it before users notice?`
          : `Now go one level deeper: what would you change if the constraints doubled?`;

  return {
    overall,
    readiness: overall >= 82 ? 'hire signal' : overall >= 68 ? 'borderline signal' : 'needs work',
    metrics,
    strengths,
    missingSignals,
    nudge,
    followUp,
    pace,
    wordCount,
  };
}
