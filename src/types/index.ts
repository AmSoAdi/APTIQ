/**
 * APTIQ Core Types
 */

export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer';
export type QuestionMode = 'recall' | 'apply';
export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'adaptive';

export interface AnswerOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  mode: QuestionMode; // recall vs apply
  prompt: string;
  options: AnswerOption[];
  correctAnswerId: string;
  explanation: string;
  sourceReference?: {
    passage?: string;
    section?: string;
    page?: number;
  };
  topic: string;
  difficulty: DifficultyLevel;
  misconceptionAlert?: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  sourceType: 'pdf' | 'text' | 'topic';
  sourceTitle?: string;
  sourceSnippet?: string;
  questions: Question[];
  createdAt: string;
  timeLimitMinutes: number; // 0 for untimed
  mode: QuestionMode | 'mixed';
  difficulty: DifficultyLevel;
}

export interface UserAnswer {
  questionId: string;
  selectedOptionId: string;
  timeSpentSeconds: number;
  isMarkedForReview?: boolean;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  quizTitle: string;
  startedAt: string;
  completedAt: string;
  timeSpentSeconds: number;
  answers: Record<string, UserAnswer>;
  score: number; // percentage 0-100
  totalQuestions: number;
  correctCount: number;
  mode: QuestionMode | 'mixed';
  topic: string;
}

export interface SavedMistake {
  id: string;
  question: Question;
  attemptId?: string;
  savedAt: string;
  timesPracticed: number;
  mastered: boolean;
  notes?: string;
  misconceptionExplanation?: string;
}

export type ChallengeCategory =
  | 'logic_deduction'
  | 'evidence_evaluation'
  | 'identifying_assumptions'
  | 'cause_and_effect'
  | 'everyday_decisions'
  | 'tradeoffs_resources'
  | 'bias_misinformation'
  | 'unfamiliar_scenarios';

export interface ThinkArenaChallenge {
  id: string;
  title: string;
  category: ChallengeCategory;
  categoryLabel: string;
  difficulty: 'intermediate' | 'advanced' | 'mastery';
  scenario: string;
  contextData?: {
    label: string;
    value: string;
  }[];
  guidingQuestions: string[];
  sampleResponses?: {
    memorizerApproach: string;
    thinkerApproach: string;
  };
  xpReward: number;
}

export interface RubricScore {
  clarity: number; // 1-5
  evidence: number; // 1-5
  assumptions: number; // 1-5
  alternatives: number; // 1-5
  consistency: number; // 1-5
  conclusion: number; // 1-5
  totalScore: number; // 6-30
  feedbackComments: {
    strengths: string[];
    blindSpots: string[];
    actionableImprovement: string;
  };
}

export interface ThinkArenaSubmission {
  id: string;
  challengeId: string;
  challengeTitle: string;
  userAnalysis: {
    evidenceAnalysis: string;
    hiddenAssumptions: string;
    tradeoffsAndAlternatives: string;
    finalDecision: string;
  };
  rubric: RubricScore;
  submittedAt: string;
}

export interface PromptVersion {
  id: string;
  timestamp: string;
  rawPrompt: string;
  objective: string;
  context: string;
  constraints: string[];
  outputFormat: string;
  evaluation?: {
    clarityScore: number; // 0-100
    ambiguitiesFound: string[];
    suggestedImprovements: string[];
    optimizedPrompt: string;
    rationale: string;
  };
}

export interface UserStats {
  xp: number;
  level: number;
  streakDays: number;
  lastActiveDate: string;
  quizzesCompleted: number;
  testsCompleted: number;
  thinkArenaCompleted: number;
  promptsRefined: number;
  totalTimeMinutes: number;
  recallAccuracy: number;
  applyAccuracy: number;
  topicMastery: Record<string, { correct: number; total: number }>;
  dailyChallengeCompletedDate?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  iconName: string;
  unlockedAt?: string;
  progress: number; // 0 - 100
  category: 'accuracy' | 'streak' | 'reasoning' | 'prompting' | 'mastery';
}

export interface LeaderboardUser {
  id: string;
  name: string;
  avatarSeed: string;
  xp: number;
  rank: number;
  streak: number;
  accuracy: number;
  badge: string;
  isCurrentUser?: boolean;
}
