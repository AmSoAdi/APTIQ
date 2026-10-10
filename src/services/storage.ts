/**
 * APTIQ Persistence Layer & Local Data Store
 */

import {
  UserStats,
  QuizAttempt,
  SavedMistake,
  ThinkArenaChallenge,
  ThinkArenaSubmission,
  PromptVersion,
  Achievement,
  Quiz,
  Question,
} from '../types';

const STORAGE_KEYS = {
  USER_STATS: 'aptiq_user_stats',
  SAVED_MISTAKES: 'aptiq_saved_mistakes',
  QUIZ_ATTEMPTS: 'aptiq_quiz_attempts',
  CUSTOM_QUIZZES: 'aptiq_custom_quizzes',
  THINK_SUBMISSIONS: 'aptiq_think_submissions',
  PROMPT_VERSIONS: 'aptiq_prompt_versions',
  USER_PROFILE: 'aptiq_user_profile',
  ACTIVE_TEST_SESSION: 'aptiq_active_test_session',
};

// Initial Default User Stats
export const INITIAL_USER_STATS: UserStats = {
  xp: 1450,
  level: 4,
  streakDays: 6,
  lastActiveDate: new Date().toISOString().split('T')[0],
  quizzesCompleted: 14,
  testsCompleted: 9,
  thinkArenaCompleted: 5,
  promptsRefined: 8,
  totalTimeMinutes: 142,
  recallAccuracy: 88,
  applyAccuracy: 74,
  topicMastery: {
    'Cognitive Biases': { correct: 18, total: 22 },
    'Systems Architecture': { correct: 14, total: 18 },
    'Causal Inference': { correct: 12, total: 17 },
    'Thermodynamics': { correct: 15, total: 20 },
    'Logical Fallacies': { correct: 19, total: 21 },
  },
  dailyChallengeCompletedDate: '',
};

// Curated Think Arena Challenges across 8 Categories
export const CURATED_THINK_CHALLENGES: ThinkArenaChallenge[] = [
  {
    id: 'think-01',
    title: 'The Exam Memorizer vs The Concept Architect',
    category: 'unfamiliar_scenarios',
    categoryLabel: 'Unfamiliar Scenarios',
    difficulty: 'advanced',
    scenario:
      'Student A memorised all 300 past exam questions from previous years with 98% accuracy. Student B studied the first-principles mechanisms, failure modes, and boundary conditions, scoring 82% on the same past exams. The university announces a surprise curriculum reform: the final exam will feature entirely novel real-world case studies not found in any prior textbook.',
    contextData: [
      { label: 'Past Paper Overlap in Old Exams', value: '78%' },
      { label: 'Past Paper Overlap in New Exam', value: '0%' },
      { label: 'Time Allowed per Case', value: '25 minutes' },
    ],
    guidingQuestions: [
      'What specific failure modes will Student A encounter when confronting questions with altered variables or novel contexts?',
      'Under what specific scenario could Student A still outperform Student B on the reformed exam?',
      'What underlying assumptions are we making about Student B’s working memory versus conceptual synthesis under pressure?',
    ],
    sampleResponses: {
      memorizerApproach:
        'Student A fails because they only know past answers, while Student B easily gets an A+.',
      thinkerApproach:
        'Student A’s pattern-matching will likely trigger negative transfer (applying memorised heuristics to structurally different problems). However, Student A may prevail if the novel exam is time-constrained and rewards rapid calculation over open-ended synthesis.',
    },
    xpReward: 180,
  },
  {
    id: 'think-02',
    title: 'The AI Diagnostic Outlier Anomaly',
    category: 'evidence_evaluation',
    categoryLabel: 'Evidence Evaluation',
    difficulty: 'mastery',
    scenario:
      'A hospital tests an AI diagnostic assistant on 10,000 chest X-rays. In lab trials, the model achieved 96% sensitivity for pulmonary pneumonia. However, in emergency department trials across three rural clinics, pneumonia false positives spiked by 41%. A biomedical engineer discovers that in the training dataset, patients with severe pneumonia were imaged with a portable bedside scanner bearing a distinctive metallic calibration token in the top-right corner.',
    contextData: [
      { label: 'Training Set Accuracy', value: '96.2%' },
      { label: 'Clinical Trial False Positive Spike', value: '+41%' },
      { label: 'Confounding Marker Identified', value: 'Portable bedside calibration token' },
    ],
    guidingQuestions: [
      'What causal link did the neural network learn instead of true pulmonary pathology?',
      'Why did false positives spike in rural clinics rather than false negatives?',
      'Propose two distinct data interventions to eliminate this bias without discarding the existing images.',
    ],
    xpReward: 220,
  },
  {
    id: 'think-03',
    title: 'Autonomous Vehicle Resource Dilemma: The Sensor Glitch',
    category: 'tradeoffs_resources',
    categoryLabel: 'Trade-offs & Allocation',
    difficulty: 'advanced',
    scenario:
      'An autonomous fleet operating in heavy fog encounters contradictory sensor streams: LiDAR detects an obstacle 12 meters ahead, but Radar and Vision detect an empty lane. Stopping abruptly risks being rear-ended by high-speed trailing commercial trucks. Continuing at speed risks collision with a pedestrian if LiDAR is correct.',
    contextData: [
      { label: 'LiDAR Confidence', value: '62% (Fog particle backscatter risk)' },
      { label: 'Radar Velocity Echo', value: '0 m/s relative distance' },
      { label: 'Trailing Truck Distance', value: '18 meters at 85 km/h' },
    ],
    guidingQuestions: [
      'What hidden trade-off is implicitly made between false positives and false negatives under environmental noise?',
      'How does the presence of trailing human drivers alter the ethical liability matrix?',
      'What intermediate maneuver minimizes kinetic harm without binary stay/stop decisions?',
    ],
    xpReward: 200,
  },
  {
    id: 'think-04',
    title: 'The Productivity Paradox & Metric Gaming',
    category: 'cause_and_effect',
    categoryLabel: 'Cause & Effect',
    difficulty: 'intermediate',
    scenario:
      'A software engineering director introduces a compensation bonus tied directly to the number of pull requests merged per developer each month. Within 60 days, total merged pull requests jump by 180%. However, critical production outages simultaneously increase by 300%, and customer satisfaction drops.',
    contextData: [
      { label: 'Pull Requests Volume Change', value: '+180%' },
      { label: 'Production Incidents Change', value: '+300%' },
      { label: 'Average Lines of Code per PR', value: '-65%' },
    ],
    guidingQuestions: [
      'Identify Goodhart’s Law dynamics at play here.',
      'What incentives did developers internalize regarding code review rigor and integration testing?',
      'Design a balanced counter-metric system that prevents gaming while preserving delivery velocity.',
    ],
    xpReward: 160,
  },
  {
    id: 'think-05',
    title: 'The "Silent Majority" Survey Assumption',
    category: 'identifying_assumptions',
    categoryLabel: 'Identifying Assumptions',
    difficulty: 'intermediate',
    scenario:
      'A city council issues an online voluntary survey on a proposed bike lane project through a historical district. 82% of the 4,200 respondents strongly oppose the bike lanes. The council claims: "The public has spoken decisively against the project." A local policy researcher argues the survey reveals almost nothing about general public sentiment.',
    contextData: [
      { label: 'Survey Modality', value: 'Voluntary self-selected web form' },
      { label: 'Median Respondent Age', value: '58 (City median is 34)' },
      { label: 'Opposition Rate', value: '82%' },
    ],
    guidingQuestions: [
      'What unexamined assumptions are embedded in the city council’s conclusion?',
      'How does self-selection bias distort the vocal minority into an apparent majority?',
      'What sampling methodology would provide genuine statistical confidence?',
    ],
    xpReward: 150,
  },
];

// Curated Starter Quizzes
export const CURATED_STARTER_QUIZZES: Quiz[] = [
  {
    id: 'quiz-cognitive-biases',
    title: 'Cognitive Architecture & Decision Fallacies',
    description: 'Test your understanding of heuristic shortcuts, confirmation bias, and probability perception.',
    sourceType: 'topic',
    sourceTitle: 'Foundations of Behavioral Economics and Critical Reasoning',
    timeLimitMinutes: 10,
    mode: 'apply',
    difficulty: 'medium',
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: 'q-cb-1',
        type: 'multiple_choice',
        mode: 'apply',
        prompt:
          'A senior venture capitalist refuses to write off an unprofitable startup after investing $5M, arguing: "We have invested too much capital to quit now; another $1M will validate the initial thesis." Which cognitive bias is directly driving this decision, and what is the economically rational response?',
        options: [
          { id: 'opt-a', text: 'Availability heuristic; disregard recent losses.' },
          { id: 'opt-b', text: 'Sunk cost fallacy; evaluate future marginal return independent of past unrecoverable investments.' },
          { id: 'opt-c', text: 'Anchoring bias; renegotiate the valuation with founders.' },
          { id: 'opt-d', text: 'Hindsight bias; review original due diligence materials.' },
        ],
        correctAnswerId: 'opt-b',
        explanation:
          'The sunk cost fallacy occurs when past, irrecoverable expenses influence ongoing decisions. Rational choice theory dictates that previous expenditures are sunk and future capital allocation should be judged strictly on prospective risk-adjusted return.',
        topic: 'Cognitive Biases',
        difficulty: 'medium',
        misconceptionAlert:
          'Confusing perseverance with rationality. Sunk costs cannot be retrieved, so pouring additional capital into negative expected return compounds losses.',
        sourceReference: {
          section: 'Section 4: Heuristics in Resource Allocation',
          passage: 'A sunk cost is money that has already been spent and cannot be recovered. Prospective costs are future costs that may be avoided.',
        },
      },
      {
        id: 'q-cb-2',
        type: 'multiple_choice',
        mode: 'recall',
        prompt:
          'What distinguishes the "Confirmation Bias" from the "Dunning-Kruger Effect" in cognitive evaluation?',
        options: [
          { id: 'opt-a', text: 'Confirmation bias relates to memory duration, while Dunning-Kruger relates to IQ.' },
          { id: 'opt-b', text: 'Confirmation bias is the tendency to seek and overweight evidence validating existing beliefs; Dunning-Kruger is the metacognitive inability of novices to recognize their own incompetence.' },
          { id: 'opt-c', text: 'Confirmation bias only occurs in groups; Dunning-Kruger is solely individual.' },
          { id: 'opt-d', text: 'They are identical psychological constructs applied to different age groups.' },
        ],
        correctAnswerId: 'opt-b',
        explanation:
          'Confirmation bias filters incoming data to protect an existing hypothesis. The Dunning-Kruger effect is a metacognitive deficiency wherein individuals with low mastery overestimate their competence due to lack of domain insight.',
        topic: 'Cognitive Biases',
        difficulty: 'easy',
        sourceReference: {
          section: 'Metacognition and Evidence Processing',
          passage: 'Confirmation bias leads people to seek congruent data; Dunning-Kruger stems from a lack of metacognitive awareness.',
        },
      },
      {
        id: 'q-cb-3',
        type: 'multiple_choice',
        mode: 'apply',
        prompt:
          'An epidemiologist notes: "Cities with more fire hydrants experience higher rates of structural fires." A politician proposes removing hydrants to reduce fires. What error in reasoning is occurring, and what is the confounding variable?',
        options: [
          { id: 'opt-a', text: 'Post hoc ergo propter hoc; fire engines arrive before hydrants are opened.' },
          { id: 'opt-b', text: 'Confusing correlation with causation; city population and building density drive both hydrant count and fire frequency.' },
          { id: 'opt-c', text: 'Base rate neglect; hydrants have high false positive rates.' },
          { id: 'opt-d', text: 'Survivorship bias; destroyed buildings are omitted from the hydrant tally.' },
        ],
        correctAnswerId: 'opt-b',
        explanation:
          'Correlation does not imply causation. High urban density and population require both larger infrastructure (fire hydrants) and inherently create more human activity, leading to higher absolute fire numbers.',
        topic: 'Causal Inference',
        difficulty: 'medium',
        misconceptionAlert:
          'Assuming that co-occurring statistical trends reflect direct causality without screening for common cause variables.',
        sourceReference: {
          section: 'Chapter 2: Confounding Variables in Observational Studies',
          passage: 'When variable Z influences both X and Y, an illusory statistical correlation emerges between X and Y.',
        },
      },
      {
        id: 'q-cb-4',
        type: 'multiple_choice',
        mode: 'apply',
        prompt:
          'During World War II, engineers inspected returning bombers and reinforced bullet-riddled wings and fuselage sections. Mathematician Abraham Wald warned this was a catastrophic error. Why?',
        options: [
          { id: 'opt-a', text: 'Armor on wings increases weight and reduces fuel economy.' },
          { id: 'opt-b', text: 'Survivorship bias: planes hit in the engine or cockpit crashed and never returned; armor was needed where returning planes had NO holes.' },
          { id: 'opt-c', text: 'Radar technology made armor obsolete.' },
          { id: 'opt-d', text: 'German ammunition targeted cockpits only.' },
        ],
        correctAnswerId: 'opt-b',
        explanation:
          'Wald recognized survivorship bias: the sample only included aircraft that survived being shot. Hits on the fuselage were survivable; hits in the missing areas (like engines) caused total destruction, so those unhit areas were the vulnerable points.',
        topic: 'Logical Fallacies',
        difficulty: 'hard',
        sourceReference: {
          section: 'Historical Case Studies: Abraham Wald and Selection Bias',
          passage: 'The holes in returning planes represented damage the aircraft could withstand. The undamaged areas showed where fatal damage occurred.',
        },
      },
    ],
  },
  {
    id: 'quiz-systems-thinking',
    title: 'Systems Architecture & Unintended Consequences',
    description: 'Evaluate feedback loops, bottleneck theory, and second-order effects in complex environments.',
    sourceType: 'topic',
    sourceTitle: 'Principles of Complex Adaptive Systems',
    timeLimitMinutes: 12,
    mode: 'apply',
    difficulty: 'hard',
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: 'q-sys-1',
        type: 'multiple_choice',
        mode: 'apply',
        prompt:
          'A municipality widens a congested 4-lane highway to 8 lanes to permanently eliminate rush-hour traffic jams. Two years later, average commute times are identical or slightly longer. What systemic phenomenon explains this result?',
        options: [
          { id: 'opt-a', text: 'Braess’s Paradox' },
          { id: 'opt-b', text: 'Induced Demand (the triple convergence effect)' },
          { id: 'opt-c', text: 'Pareto Inefficiency' },
          { id: 'opt-d', text: 'Gresham’s Law of Transportation' },
        ],
        correctAnswerId: 'opt-b',
        explanation:
          'Induced demand occurs because increasing roadway capacity reduces perceived travel cost initially, incentivizing previously latent drivers to switch routes, modes, and departure times until equilibrium congestion is restored.',
        topic: 'Systems Architecture',
        difficulty: 'medium',
        sourceReference: {
          section: 'Urban Feedback Dynamics',
          passage: 'Increased supply in non-toll transit generates rapid consumption of capacity until congestion costs equalize.',
        },
      },
      {
        id: 'q-sys-2',
        type: 'multiple_choice',
        mode: 'recall',
        prompt:
          'In Goldratt’s Theory of Constraints, what is the impact of optimizing a non-bottleneck workstation?',
        options: [
          { id: 'opt-a', text: 'It proportionally increases overall system throughput.' },
          { id: 'opt-b', text: 'It creates excess inventory and work-in-progress without increasing system throughput.' },
          { id: 'opt-c', text: 'It automatically eliminates the bottleneck elsewhere.' },
          { id: 'opt-d', text: 'It decreases total operating expenses.' },
        ],
        correctAnswerId: 'opt-b',
        explanation:
          'An hour saved at a non-bottleneck is a mirage. Producing faster than the bottleneck simply accumulates inventory before the bottleneck or starves downstream processes, increasing holding costs without yielding extra completed output.',
        topic: 'Systems Architecture',
        difficulty: 'medium',
        sourceReference: {
          section: 'Operations Research & Bottleneck Dynamics',
          passage: 'System throughput is bounded strictly by the single limiting constraint.',
        },
      },
      {
        id: 'q-sys-3',
        type: 'multiple_choice',
        mode: 'apply',
        prompt:
          'In a distributed database, network partitions can sever communication between clusters. According to the CAP theorem, if an architecture prioritizes Consistency (C) and Partition Tolerance (P), what trade-off must it accept during a network partition?',
        options: [
          { id: 'opt-a', text: 'Data loss across all non-primary nodes.' },
          { id: 'opt-b', text: 'Unavailable responses (errors or timeouts) for nodes that cannot guarantee recent writes.' },
          { id: 'opt-c', text: 'Infinite latency for all read requests forever.' },
          { id: 'opt-d', text: 'Automatic downgrade to single-threaded CPU processing.' },
        ],
        correctAnswerId: 'opt-b',
        explanation:
          'Under network partition (P), a CP system refuses to serve potentially stale or uncoordinated data. To maintain global consistency, it sacrifices availability (A), returning an error or refusing writes rather than serving diverging state.',
        topic: 'Systems Architecture',
        difficulty: 'hard',
        sourceReference: {
          section: 'Distributed Consistency Theorems',
          passage: 'In the presence of a network partition, one must choose between consistency (refusing stale reads) or availability (answering with potentially stale data).',
        },
      },
    ],
  },
];

// Helper to access LocalStorage safely
export function getStoredUserStats(): UserStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_STATS);
    if (!raw) {
      saveUserStats(INITIAL_USER_STATS);
      return INITIAL_USER_STATS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_USER_STATS;
  }
}

export function saveUserStats(stats: UserStats): void {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_STATS, JSON.stringify(stats));
  } catch (err) {
    console.error('Failed to save user stats', err);
  }
}

export function addXP(amount: number): UserStats {
  const current = getStoredUserStats();
  const newXP = current.xp + amount;
  // Level threshold: 500 XP per level
  const newLevel = Math.max(1, Math.floor(newXP / 500) + 1);
  const updated: UserStats = {
    ...current,
    xp: newXP,
    level: newLevel,
  };
  saveUserStats(updated);
  return updated;
}

export function updateStreak(): UserStats {
  const current = getStoredUserStats();
  const today = new Date().toISOString().split('T')[0];
  if (current.lastActiveDate === today) {
    return current;
  }

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  let newStreak = current.streakDays;
  if (current.lastActiveDate === yesterday) {
    newStreak += 1;
  } else if (current.lastActiveDate < yesterday) {
    newStreak = 1; // reset streak if missed a day
  }

  const updated: UserStats = {
    ...current,
    streakDays: newStreak,
    lastActiveDate: today,
  };
  saveUserStats(updated);
  return updated;
}

// Saved Mistakes Revision Loop
export function getSavedMistakes(): SavedMistake[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SAVED_MISTAKES);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveMistake(question: Question, attemptId?: string, misconceptionExplanation?: string): SavedMistake {
  const mistakes = getSavedMistakes();
  const existing = mistakes.find((m) => m.question.id === question.id);
  if (existing) {
    existing.timesPracticed += 1;
    if (misconceptionExplanation) {
      existing.misconceptionExplanation = misconceptionExplanation;
    }
    localStorage.setItem(STORAGE_KEYS.SAVED_MISTAKES, JSON.stringify(mistakes));
    return existing;
  }

  const newMistake: SavedMistake = {
    id: `mistake-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    question,
    attemptId,
    savedAt: new Date().toISOString(),
    timesPracticed: 0,
    mastered: false,
    misconceptionExplanation,
  };

  mistakes.unshift(newMistake);
  localStorage.setItem(STORAGE_KEYS.SAVED_MISTAKES, JSON.stringify(mistakes));
  return newMistake;
}

export function markMistakeMastered(mistakeId: string, mastered: boolean = true): void {
  const mistakes = getSavedMistakes();
  const updated = mistakes.map((m) => (m.id === mistakeId ? { ...m, mastered } : m));
  localStorage.setItem(STORAGE_KEYS.SAVED_MISTAKES, JSON.stringify(updated));
}

export function removeSavedMistake(mistakeId: string): void {
  const mistakes = getSavedMistakes();
  const filtered = mistakes.filter((m) => m.id !== mistakeId);
  localStorage.setItem(STORAGE_KEYS.SAVED_MISTAKES, JSON.stringify(filtered));
}

// Quiz Attempts
export function getQuizAttempts(): QuizAttempt[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.QUIZ_ATTEMPTS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function recordQuizAttempt(attempt: QuizAttempt): void {
  const attempts = getQuizAttempts();
  attempts.unshift(attempt);
  localStorage.setItem(STORAGE_KEYS.QUIZ_ATTEMPTS, JSON.stringify(attempts));

  // Update user stats
  const stats = getStoredUserStats();
  const newTests = stats.testsCompleted + 1;
  const newQuizzes = stats.quizzesCompleted + 1;
  const timeAddedMinutes = Math.max(1, Math.round(attempt.timeSpentSeconds / 60));

  // Update topic mastery
  const topicMastery = { ...stats.topicMastery };
  if (!topicMastery[attempt.topic]) {
    topicMastery[attempt.topic] = { correct: 0, total: 0 };
  }
  topicMastery[attempt.topic].correct += attempt.correctCount;
  topicMastery[attempt.topic].total += attempt.totalQuestions;

  // Update accuracy ratios
  const isRecall = attempt.mode === 'recall';
  const newRecall = isRecall
    ? Math.round((stats.recallAccuracy * 0.7) + (attempt.score * 0.3))
    : stats.recallAccuracy;
  const newApply = !isRecall
    ? Math.round((stats.applyAccuracy * 0.7) + (attempt.score * 0.3))
    : stats.applyAccuracy;

  // Reward XP based on score and question count
  const earnedXp = Math.round(attempt.score * 1.5) + (attempt.correctCount * 10);

  const updatedStats: UserStats = {
    ...stats,
    xp: stats.xp + earnedXp,
    level: Math.max(1, Math.floor((stats.xp + earnedXp) / 500) + 1),
    testsCompleted: newTests,
    quizzesCompleted: newQuizzes,
    totalTimeMinutes: stats.totalTimeMinutes + timeAddedMinutes,
    recallAccuracy: newRecall,
    applyAccuracy: newApply,
    topicMastery,
  };

  saveUserStats(updatedStats);
}

// Custom Quizzes generated by user
export function getStoredQuizzes(): Quiz[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_QUIZZES);
    const custom = raw ? JSON.parse(raw) : [];
    return [...CURATED_STARTER_QUIZZES, ...custom];
  } catch {
    return CURATED_STARTER_QUIZZES;
  }
}

export function saveCustomQuiz(quiz: Quiz): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_QUIZZES);
    const custom: Quiz[] = raw ? JSON.parse(raw) : [];
    custom.unshift(quiz);
    localStorage.setItem(STORAGE_KEYS.CUSTOM_QUIZZES, JSON.stringify(custom));
  } catch (err) {
    console.error('Failed to save custom quiz', err);
  }
}

// Think Arena Submissions
export function getThinkSubmissions(): ThinkArenaSubmission[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.THINK_SUBMISSIONS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveThinkSubmission(submission: ThinkArenaSubmission): void {
  const subs = getThinkSubmissions();
  subs.unshift(submission);
  localStorage.setItem(STORAGE_KEYS.THINK_SUBMISSIONS, JSON.stringify(subs));

  const stats = getStoredUserStats();
  const earnedXp = submission.rubric.totalScore * 7;
  const updated: UserStats = {
    ...stats,
    thinkArenaCompleted: stats.thinkArenaCompleted + 1,
    xp: stats.xp + earnedXp,
    level: Math.max(1, Math.floor((stats.xp + earnedXp) / 500) + 1),
  };
  saveUserStats(updated);
}

// Prompt Versions
export function getPromptVersions(): PromptVersion[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROMPT_VERSIONS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function savePromptVersion(ver: PromptVersion): void {
  const versions = getPromptVersions();
  versions.unshift(ver);
  localStorage.setItem(STORAGE_KEYS.PROMPT_VERSIONS, JSON.stringify(versions));

  const stats = getStoredUserStats();
  const updated: UserStats = {
    ...stats,
    promptsRefined: stats.promptsRefined + 1,
    xp: stats.xp + 40,
  };
  saveUserStats(updated);
}

// Clear or Reset to deterministic demo data
export function resetToDemoData(): void {
  localStorage.setItem(STORAGE_KEYS.USER_STATS, JSON.stringify(INITIAL_USER_STATS));
  localStorage.removeItem(STORAGE_KEYS.SAVED_MISTAKES);
  localStorage.removeItem(STORAGE_KEYS.QUIZ_ATTEMPTS);
  localStorage.removeItem(STORAGE_KEYS.CUSTOM_QUIZZES);
  localStorage.removeItem(STORAGE_KEYS.THINK_SUBMISSIONS);
  localStorage.removeItem(STORAGE_KEYS.PROMPT_VERSIONS);
}
