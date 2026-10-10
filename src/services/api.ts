/**
 * APTIQ Frontend API Client
 * Secure communication with Express backend
 */

import { Question, RubricScore, PromptVersion } from '../types';

export interface ServerStatus {
  hasApiKey: boolean;
  model: string;
  environment: string;
  serverTime: string;
}

export async function getServerStatus(): Promise<ServerStatus> {
  try {
    const res = await fetch('/api/status');
    if (!res.ok) throw new Error('Status check failed');
    return await res.json();
  } catch (e) {
    return {
      hasApiKey: false,
      model: 'gemini-3.8-flash',
      environment: 'development',
      serverTime: new Date().toISOString(),
    };
  }
}

export interface QuizGenerationParams {
  topic?: string;
  sourceSnippet?: string;
  mode: 'recall' | 'apply' | 'mixed';
  questionCount: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'adaptive';
}

export interface QuizGenerationResult {
  isDemoMode: boolean;
  notice?: string;
  errorNotice?: string;
  questions: Question[];
}

export async function generateQuizWithAI(params: QuizGenerationParams): Promise<QuizGenerationResult> {
  const res = await fetch('/api/gemini/generate-quiz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    throw new Error(`Generation failed with HTTP status ${res.status}`);
  }
  return await res.json();
}

export interface AdaptiveQuestionParams {
  topic?: string;
  sourceSnippet?: string;
  mode?: 'recall' | 'apply' | 'mixed';
  targetDifficulty: 'easy' | 'medium' | 'hard';
  previousQuestions?: Array<{ prompt: string }>;
}

export interface AdaptiveQuestionResult {
  isDemoMode: boolean;
  notice?: string;
  errorNotice?: string;
  question: Question;
}

export async function generateAdaptiveQuestionWithAI(
  params: AdaptiveQuestionParams
): Promise<AdaptiveQuestionResult> {
  const res = await fetch('/api/gemini/generate-adaptive-question', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    throw new Error(`Adaptive question generation failed with HTTP status ${res.status}`);
  }
  return await res.json();
}

export interface ReasoningEvaluationResult {
  isDemoMode: boolean;
  notice?: string;
  errorNotice?: string;
  rubric: RubricScore;
}

export async function evaluateReasoningWithAI(payload: {
  scenario: string;
  category: string;
  userAnalysis: {
    evidenceAnalysis: string;
    hiddenAssumptions: string;
    tradeoffsAndAlternatives: string;
    finalDecision: string;
  };
}): Promise<ReasoningEvaluationResult> {
  const res = await fetch('/api/gemini/evaluate-reasoning', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Evaluation failed with HTTP status ${res.status}`);
  }
  return await res.json();
}

export interface PromptEvaluationResult {
  isDemoMode: boolean;
  evaluation: NonNullable<PromptVersion['evaluation']>;
}

export async function evaluatePromptWithAI(payload: {
  prompt: string;
  objective: string;
  context?: string;
  constraints?: string[];
  outputFormat?: string;
}): Promise<PromptEvaluationResult> {
  const res = await fetch('/api/gemini/evaluate-prompt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Prompt evaluation failed with HTTP status ${res.status}`);
  }
  return await res.json();
}

export interface MistakeAnalysisResult {
  isDemoMode: boolean;
  explanation: {
    whyIncorrect: string;
    whyCorrect: string;
    underlyingMisconception: string;
    followUpQuestion: Question;
  };
}

export async function explainMistakeWithAI(payload: {
  question: Question;
  selectedOptionId: string;
}): Promise<MistakeAnalysisResult> {
  const res = await fetch('/api/gemini/explain-mistake', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Mistake analysis failed with HTTP status ${res.status}`);
  }
  return await res.json();
}

export async function triggerZipExport(): Promise<void> {
  const response = await fetch('/api/export-zip');
  if (!response.ok) throw new Error('Export failed');
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'APTIQ.zip';
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
