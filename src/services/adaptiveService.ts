/**
 * APTIQ Adaptive Difficulty Engine
 *
 * Provides real-time adaptive transitions for Apply Mode assessments.
 * Tracks consecutive performance streaks, computes difficulty adjustments (Easy <-> Medium <-> Hard),
 * generates explanatory diagnostic banners, and supplies curriculum questions via Gemini or deterministic fallbacks.
 */

import { Question, DifficultyLevel } from '../types';

export type AdaptiveDifficulty = 'easy' | 'medium' | 'hard';

export interface AdaptiveStepResult {
  nextDifficulty: AdaptiveDifficulty;
  changed: boolean;
  direction: 'promoted' | 'demoted' | 'maintained';
  reason: string;
  consecutiveCorrect: number;
  consecutiveIncorrect: number;
  recentAccuracyPct: number;
}

export interface AdaptiveSessionState {
  currentDifficulty: AdaptiveDifficulty;
  history: Array<{
    questionId: string;
    difficulty: AdaptiveDifficulty;
    isCorrect: boolean;
  }>;
  consecutiveCorrect: number;
  consecutiveIncorrect: number;
}

/**
 * Initializes a new adaptive session starting at 'medium' difficulty.
 */
export function createAdaptiveSession(initialDifficulty: AdaptiveDifficulty = 'medium'): AdaptiveSessionState {
  return {
    currentDifficulty: initialDifficulty,
    history: [],
    consecutiveCorrect: 0,
    consecutiveIncorrect: 0,
  };
}

/**
 * Difficulty Progression Rules & Thresholds:
 *
 * Levels: Easy <-> Medium <-> Hard
 *
 * PROMOTION THRESHOLDS:
 * - Easy -> Medium: 1 correct answer (shows baseline mastery of core definitions/heuristics).
 * - Medium -> Hard: 2 consecutive correct answers OR >= 80% accuracy over the last 3 questions.
 * - At Hard: Maintains Hard if answered correctly, reinforcing cognitive mastery.
 *
 * DEMOTION THRESHOLDS:
 * - Hard -> Medium: 1 incorrect answer (protects learner confidence, recalibrates cognitive load).
 * - Medium -> Easy: 2 consecutive incorrect answers OR 0% accuracy over the last 2 questions.
 * - At Easy: Maintains Easy if answered incorrectly, providing additional foundational grounding.
 *
 * STABILITY / MAINTENANCE:
 * - Single errors at Medium or mixed results at Medium keep difficulty steady.
 */
export function evaluateAdaptiveDifficulty(
  session: AdaptiveSessionState,
  lastAnswerIsCorrect: boolean,
  lastQuestionId: string
): { updatedSession: AdaptiveSessionState; stepResult: AdaptiveStepResult } {
  const current = session.currentDifficulty;
  const newConsecutiveCorrect = lastAnswerIsCorrect ? session.consecutiveCorrect + 1 : 0;
  const newConsecutiveIncorrect = !lastAnswerIsCorrect ? session.consecutiveIncorrect + 1 : 0;

  const newHistory = [
    ...session.history,
    {
      questionId: lastQuestionId,
      difficulty: current,
      isCorrect: lastAnswerIsCorrect,
    },
  ];

  // Calculate recent accuracy over up to the last 3 questions
  const recentWindow = newHistory.slice(-3);
  const recentCorrectCount = recentWindow.filter((h) => h.isCorrect).length;
  const recentAccuracyPct = Math.round((recentCorrectCount / recentWindow.length) * 100);

  let nextDifficulty: AdaptiveDifficulty = current;
  let direction: 'promoted' | 'demoted' | 'maintained' = 'maintained';
  let reason = '';

  if (lastAnswerIsCorrect) {
    if (current === 'easy') {
      nextDifficulty = 'medium';
      direction = 'promoted';
      reason = 'Correct response on foundational scenario. Elevating to Medium complexity with multi-variable trade-offs.';
    } else if (current === 'medium') {
      if (newConsecutiveCorrect >= 2 || (recentWindow.length >= 3 && recentAccuracyPct >= 75)) {
        nextDifficulty = 'hard';
        direction = 'promoted';
        reason = `Mastery demonstrated (${newConsecutiveCorrect} consecutive correct). Escalating to Hard difficulty: counter-intuitive boundary conditions and deep transfer.`;
      } else {
        nextDifficulty = 'medium';
        direction = 'maintained';
        reason = `Solid progress (${newConsecutiveCorrect} correct in a row). Maintaining Medium difficulty to consolidate conceptual model.`;
      }
    } else {
      // already hard
      nextDifficulty = 'hard';
      direction = 'maintained';
      reason = 'Exceptional first-principles rigor! Maintaining Hard tier to test edge-case anomalies.';
    }
  } else {
    // Incorrect answer
    if (current === 'hard') {
      nextDifficulty = 'medium';
      direction = 'demoted';
      reason = 'Cognitive barrier encountered on Hard challenge. Recalibrating down to Medium difficulty to reinforce intermediate trade-offs.';
    } else if (current === 'medium') {
      if (newConsecutiveIncorrect >= 2) {
        nextDifficulty = 'easy';
        direction = 'demoted';
        reason = 'Consecutive errors detected at Medium difficulty. Adjusting to Easy tier to reinforce fundamental principles before re-escalating.';
      } else {
        nextDifficulty = 'medium';
        direction = 'maintained';
        reason = 'First incorrect response at Medium level. Holding difficulty steady to allow self-correction on the next challenge.';
      }
    } else {
      // already easy
      nextDifficulty = 'easy';
      direction = 'maintained';
      reason = 'Misconception identified. Holding at Easy tier with focused foundational scenarios to rebuild confidence.';
    }
  }

  const updatedSession: AdaptiveSessionState = {
    currentDifficulty: nextDifficulty,
    history: newHistory,
    consecutiveCorrect: newConsecutiveCorrect,
    consecutiveIncorrect: newConsecutiveIncorrect,
  };

  const stepResult: AdaptiveStepResult = {
    nextDifficulty,
    changed: nextDifficulty !== current,
    direction,
    reason,
    consecutiveCorrect: newConsecutiveCorrect,
    consecutiveIncorrect: newConsecutiveIncorrect,
    recentAccuracyPct,
  };

  return { updatedSession, stepResult };
}

/**
 * Deterministic Curated Adaptive Curriculum Library
 * Provides rich, tiered multi-difficulty questions across topics.
 * Enables 100% offline and API-key-free adaptation in demo mode.
 */
export const DETERMINISTIC_ADAPTIVE_BANKS: Record<string, Record<AdaptiveDifficulty, Question[]>> = {
  default: {
    easy: [
      {
        id: 'det-easy-1',
        type: 'multiple_choice',
        mode: 'apply',
        prompt:
          'A medical researcher notes that people who regularly take daily vitamin supplements report fewer annual sick days. A pharmaceutical marketer claims: "Supplements directly prevent viruses." What baseline flaw makes this conclusion premature?',
        options: [
          { id: 'opt-e1-a', text: 'Daily vitamins are toxic to human gastrointestinal bacteria.' },
          { id: 'opt-e1-b', text: 'Healthy user bias: people who take supplements often also exercise, eat balanced diets, and have higher healthcare access.' },
          { id: 'opt-e1-c', text: 'Sick days are mathematically impossible to measure accurately.' },
          { id: 'opt-e1-d', text: 'Correlation is always identical to direct physical causation.' },
        ],
        correctAnswerId: 'opt-e1-b',
        explanation:
          'Healthy user bias (a form of confounding) occurs when lifestyle choices cluster together. Supplement takers typically exhibit other protective health habits that independently reduce sick days.',
        misconceptionAlert: 'Assuming that an observed statistical correlation implies a single direct mechanism.',
        topic: 'Causal Inference',
        difficulty: 'easy',
        sourceReference: {
          section: 'Observational Studies & Selection Bias',
          passage: 'Self-selected treatment groups differ systematically from non-treatment groups across unmeasured confounders.',
        },
      },
      {
        id: 'det-easy-2',
        type: 'multiple_choice',
        mode: 'apply',
        prompt:
          'A team lead purchases a $2,000 project management software tool that turns out to be confusing and slows the team down by 30%. The lead insists: "We must keep using it for 6 months because we already paid the non-refundable $2,000." What cognitive trap is being demonstrated?',
        options: [
          { id: 'opt-e2-a', text: 'Hindsight bias' },
          { id: 'opt-e2-b', text: 'Sunk cost fallacy' },
          { id: 'opt-c2-c', text: 'Pareto principle' },
          { id: 'opt-d2-d', text: 'Availability heuristic' },
        ],
        correctAnswerId: 'opt-e2-b',
        explanation:
          'The $2,000 is an unrecoverable sunk cost. The rational decision rule evaluates only marginal future costs and benefits: continuing to use tool wastes team labor and compounds losses.',
        misconceptionAlert: 'Believing that abandoning an unproductive investment is wasteful, when continuing it actually wastes more.',
        topic: 'Cognitive Biases',
        difficulty: 'easy',
        sourceReference: {
          section: 'Resource Allocation and Decision Theory',
          passage: 'Rational decision-making evaluates future incremental cash flows, ignoring unrecoverable past outlays.',
        },
      },
    ],
    medium: [
      {
        id: 'det-med-1',
        type: 'multiple_choice',
        mode: 'apply',
        prompt:
          'In evaluating conflicting experimental data in a biological assay, increasing the sample size from N=50 to N=50,000 dramatically reduces the standard error of the mean. However, the measured value remains 20% off from the known ground truth. What does this divergence demonstrate?',
        options: [
          { id: 'opt-m1-a', text: 'Random sampling variance increases with sample size.' },
          { id: 'opt-m1-b', text: 'Increasing sample size shrinks random sampling error (variance), but systematic calibration skew (bias) is invariant to sample size.' },
          { id: 'opt-m1-c', text: 'The law of large numbers fails for sample sizes greater than 1,000.' },
          { id: 'opt-m1-d', text: 'Large samples always introduce non-linear quantum measurement anomalies.' },
        ],
        correctAnswerId: 'opt-m1-b',
        explanation:
          'Precision reflects the tightness of measurement clustering, which scales with 1/sqrt(N). Accuracy reflects alignment with ground truth. A large sample with a systematic instrument bias simply produces a tighter, more confident erroneous estimate.',
        misconceptionAlert: 'Believing "Big Data" inherently corrects for systematic sampling or calibration skew.',
        topic: 'Scientific Methodology',
        difficulty: 'medium',
        sourceReference: {
          section: 'Epistemology of Measurement',
          passage: 'Variance shrinks with observation frequency, but systematic bias persists unaltered regardless of scale.',
        },
      },
      {
        id: 'det-med-2',
        type: 'multiple_choice',
        mode: 'apply',
        prompt:
          'A factory assembly line has 4 stations. Station A produces 100 units/hr, Station B produces 60 units/hr, Station C produces 90 units/hr, and Station D finishes 110 units/hr. The plant manager invests $500,000 to upgrade Station A to 150 units/hr. What is the expected increase in finished product throughput for the entire factory?',
        options: [
          { id: 'opt-m2-a', text: '50% increase across the whole line' },
          { id: 'opt-m2-b', text: '0% increase, because overall system throughput is strictly bounded by Station B (60 units/hr)' },
          { id: 'opt-m2-c', text: '25% increase distributed across downstream stations' },
          { id: 'opt-m2-d', text: 'Negative 10% due to machine vibration interference' },
        ],
        correctAnswerId: 'opt-m2-b',
        explanation:
          'According to the Theory of Constraints (Goldratt), any optimization made at a non-bottleneck workstation creates excess work-in-progress inventory without yielding a single additional finished unit of system throughput.',
        misconceptionAlert: 'Assuming that localized productivity gains automatically translate into global system gains.',
        topic: 'Systems Architecture',
        difficulty: 'medium',
        sourceReference: {
          section: 'Theory of Constraints',
          passage: 'System throughput is strictly constrained by the single slowest interdependent step.',
        },
      },
    ],
    hard: [
      {
        id: 'det-hard-1',
        type: 'multiple_choice',
        mode: 'apply',
        prompt:
          'A high-frequency algorithmic market-making fund deploys automated risk limiters. For 3 years, the fund experiences zero daily drawdowns exceeding 1.5%. In year 4, a correlated liquidity shock across sovereign bonds triggers a catastrophic 35% liquidation. Which structural failure mode best accounts for the discrepancy between backtested volatility and observed tail risk?',
        options: [
          { id: 'opt-h1-a', text: 'Linear Gaussian risk models (VaR) extrapolate thin-tailed normal distributions that severely underprice endogenous feedback loops and fat-tailed systemic liquidity evaporation.' },
          { id: 'opt-h1-b', text: 'The fund failed to run Monte Carlo simulations with sufficient CPU thread parallelism.' },
          { id: 'opt-h1-c', text: 'Market makers are legally insulated from liquidity shortfalls by federal central clearing.' },
          { id: 'opt-h1-d', text: 'Standard deviation automatically converges to zero as trading horizons extend beyond 1,000 days.' },
        ],
        correctAnswerId: 'opt-h1-a',
        explanation:
          'Standard financial models frequently assume independent, identically distributed normal returns. In crisis conditions, collective deleveraging creates endogenous positive feedback: selling induces margin calls, forcing further selling. Tail events occur orders of magnitude more frequently than Gaussian models predict.',
        misconceptionAlert: 'Treating historical absence of volatility during benign regimes as mathematical evidence of structural safety.',
        topic: 'Complex Systems & Tail Risk',
        difficulty: 'hard',
        sourceReference: {
          section: 'Mandelbrot & Taleb: The Epistemology of Extreme Events',
          passage: 'In fat-tailed regimes, a single observation can disproportionately dominate total cumulative variance.',
        },
      },
      {
        id: 'det-hard-2',
        type: 'multiple_choice',
        mode: 'apply',
        prompt:
          'In a distributed consensus protocol operating across an asynchronous network with crash-recovery failures, can a system simultaneously guarantee deterministic termination, strict linearizable consistency, and 100% availability during network partitions? Why or why not?',
        options: [
          { id: 'opt-h2-a', text: 'Yes, provided nodes utilize Byzantine fault-tolerant elliptic curve signatures.' },
          { id: 'opt-h2-b', text: 'No: the Fischer-Lynch-Paterson (FLP) impossibility result proves deterministic consensus is impossible in an asynchronous system with even one crash failure, and the CAP theorem requires choosing between C and A under partitions.' },
          { id: 'opt-h2-c', text: 'Yes, because Paxos and Raft eliminate all network latency through leader election heartbeats.' },
          { id: 'opt-h2-d', text: 'No, but only if the clock drift exceeds 1 millisecond per synchronized CPU core.' },
        ],
        correctAnswerId: 'opt-h2-b',
        explanation:
          'The FLP impossibility theorem (1985) establishes that no deterministic asynchronous protocol can guarantee consensus if even a single process is subject to unannounced crashes. Compounded by Brewer’s CAP theorem, network partitions force an absolute trade-off between consistency and availability.',
        misconceptionAlert: 'Believing modern consensus algorithms break fundamental theoretical computer science boundary constraints.',
        topic: 'Distributed Systems',
        difficulty: 'hard',
        sourceReference: {
          section: 'Foundations of Distributed Computing',
          passage: 'FLP Impossibility Result (Fischer, Lynch, Paterson 1985); Brewer CAP Theorem (2000).',
        },
      },
    ],
  },
};

/**
 * Retrieves a deterministic adaptive question matching topic and target difficulty.
 * Avoids returning any question ID already in usedQuestionIds.
 */
export function getDeterministicAdaptiveQuestion(
  topic: string,
  targetDifficulty: AdaptiveDifficulty,
  usedQuestionIds: Set<string> = new Set()
): Question {
  const bank = DETERMINISTIC_ADAPTIVE_BANKS.default[targetDifficulty] || [];
  const candidate = bank.find((q) => !usedQuestionIds.has(q.id));

  if (candidate) {
    return {
      ...candidate,
      topic: topic || candidate.topic,
      difficulty: targetDifficulty,
    };
  }

  // If all specific pool questions have been consumed, generate a dynamically framed question
  // based on the topic and target difficulty invariants.
  return generateDynamicFallbackQuestion(topic, targetDifficulty, usedQuestionIds.size + 1);
}

function generateDynamicFallbackQuestion(
  topic: string,
  difficulty: AdaptiveDifficulty,
  index: number
): Question {
  const cleanTopic = topic || 'Critical Reasoning';

  if (difficulty === 'easy') {
    return {
      id: `dyn-easy-${index}-${Date.now()}`,
      type: 'multiple_choice',
      mode: 'apply',
      prompt: `In evaluating a basic real-world scenario involving ${cleanTopic}, what is the most direct indicator that a simple correlation is being mistaken for true causation?`,
      options: [
        { id: 'opt-dyn-e1', text: 'Both variables change together without an identified causal mechanism or control for confounders.' },
        { id: 'opt-dyn-e2', text: 'The measurement instruments were calibrated by independent technicians.' },
        { id: 'opt-dyn-e3', text: 'The dataset contains more than one hundred verified observations.' },
        { id: 'opt-dyn-e4', text: 'The hypothesis was published in a trade newsletter.' },
      ],
      correctAnswerId: 'opt-dyn-e1',
      explanation:
        'A correlation simply records co-occurrence. Without isolating confounders or demonstrating a plausible physical mechanism, claiming causation is an unfounded leap.',
      misconceptionAlert: 'Assuming that statistical association guarantees physical cause and effect.',
      topic: cleanTopic,
      difficulty: 'easy',
      sourceReference: {
        section: 'Causal Foundations',
        passage: 'Joint variation without isolation of confounding variables cannot establish direction of causality.',
      },
    };
  }

  if (difficulty === 'hard') {
    return {
      id: `dyn-hard-${index}-${Date.now()}`,
      type: 'multiple_choice',
      mode: 'apply',
      prompt: `When stress-testing a complex non-linear system in ${cleanTopic}, an engineer introduces a 5% input perturbation. Instead of a 5% output deviation, the system undergoes an abrupt phase transition and cascades into failure. What systemic dynamic is responsible?`,
      options: [
        { id: 'opt-dyn-h1', text: 'Linear scaling: all complex systems respond in exact proportion to inputs.' },
        { id: 'opt-dyn-h2', text: 'Tipping point and reinforcing feedback loops crossing critical boundary thresholds.' },
        { id: 'opt-dyn-h3', text: 'Thermal background dissipation neutralizing all sub-system dependencies.' },
        { id: 'opt-dyn-h4', text: 'Standard Poisson arrival distribution error with zero variance.' },
      ],
      correctAnswerId: 'opt-dyn-h2',
      explanation:
        'Complex non-linear systems possess bifurcation points and positive feedback loops. Near critical thresholds, minor perturbations trigger self-reinforcing dynamics that result in discontinuous macro-scale shifts.',
      misconceptionAlert: 'Extrapolating linear intuition onto non-linear multi-loop architectures.',
      topic: cleanTopic,
      difficulty: 'hard',
      sourceReference: {
        section: 'Non-linear Dynamics & Bifurcations',
        passage: 'Complex adaptive systems exhibit threshold effects where marginal input variations produce catastrophic regime changes.',
      },
    };
  }

  // Medium
  return {
    id: `dyn-med-${index}-${Date.now()}`,
    type: 'multiple_choice',
    mode: 'apply',
    prompt: `When balancing competing operational objectives in ${cleanTopic}, an organization attempts to optimize two interdependent performance metrics simultaneously. Why does optimizing Metric A in isolation frequently degrade Metric B?`,
    options: [
      { id: 'opt-dyn-m1', text: 'All operational metrics are completely independent in well-structured organizations.' },
      { id: 'opt-dyn-m2', text: 'Coupled systems share constrained bottleneck resources; optimizing one subsystem shifts load and exposes latent friction in the other.' },
      { id: 'opt-dyn-m3', text: 'Computer databases cannot store two performance indicators concurrently.' },
      { id: 'opt-dyn-m4', text: 'Pareto frontiers only exist in theoretical macroeconomic models.' },
    ],
    correctAnswerId: 'opt-dyn-m2',
    explanation:
      'In tightly coupled architectures, subsystems share common resource pools. Maximizing local efficiency without considering global constraints starves downstream processes and shifts systemic bottlenecks.',
    misconceptionAlert: 'Believing local component optimization equates to global systemic health.',
    topic: cleanTopic,
    difficulty: 'medium',
    sourceReference: {
      section: 'System Dynamics & Coupled Constraints',
      passage: 'Subsystem optimization without global coordination typically generates negative second-order externalities.',
    },
  };
}
