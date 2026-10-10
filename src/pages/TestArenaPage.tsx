import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Flag,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  BookOpen,
  ArrowRight,
  BookmarkPlus,
  Loader2,
  Check,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Layers,
} from 'lucide-react';
import {
  getStoredQuizzes,
  recordQuizAttempt,
  saveMistake,
  getSavedMistakes,
  addXP,
} from '../services/storage';
import {
  explainMistakeWithAI,
  MistakeAnalysisResult,
  generateAdaptiveQuestionWithAI,
} from '../services/api';
import {
  createAdaptiveSession,
  evaluateAdaptiveDifficulty,
  getDeterministicAdaptiveQuestion,
  AdaptiveSessionState,
  AdaptiveStepResult,
  AdaptiveDifficulty,
} from '../services/adaptiveService';
import { Quiz, Question, UserAnswer, QuizAttempt, DifficultyLevel } from '../types';

interface TestArenaPageProps {
  navigate: (route: string, state?: any) => void;
  initialState?: {
    quizId?: string;
    customQuestions?: Question[];
    customQuiz?: Quiz;
    duelInfo?: {
      code: string;
      creatorName: string;
      creatorScore: number;
      creatorTimeSeconds: number;
    };
    quizTitle?: string;
  };
}

export const TestArenaPage: React.FC<TestArenaPageProps> = ({ navigate, initialState }) => {
  const quizzes = getStoredQuizzes();

  const [duelInfo, setDuelInfo] = useState<any>(initialState?.duelInfo || null);

  // Active quiz state
  const [activeQuiz, setActiveQuiz] = useState<Quiz>(() => {
    if (initialState?.customQuiz) {
      return initialState.customQuiz;
    }
    if (initialState?.customQuestions && initialState.customQuestions.length > 0) {
      return {
        id: `custom-session-${Date.now()}`,
        title:
          initialState.quizTitle ||
          (initialState.duelInfo
            ? `Peer Duel: ${initialState.duelInfo.code}`
            : 'Targeted Revision Session'),
        description: initialState.duelInfo
          ? `Asynchronous duel challenged by ${initialState.duelInfo.creatorName}.`
          : 'Focused practice on previously identified misconceptions.',
        sourceType: 'topic',
        questions: initialState.customQuestions,
        createdAt: new Date().toISOString(),
        timeLimitMinutes: Math.max(3, Math.round(initialState.customQuestions.length * 2)),
        mode: 'apply',
        difficulty: 'medium',
      };
    }
    if (initialState?.quizId) {
      const found = quizzes.find((q) => q.id === initialState.quizId);
      if (found) return found;
    }
    return quizzes[0];
  });

  // Test session state
  const [testState, setTestState] = useState<'lobby' | 'active' | 'review'>('lobby');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, UserAnswer>>({});
  const [remainingSeconds, setRemainingSeconds] = useState<number>(activeQuiz.timeLimitMinutes * 60);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [completedAttempt, setCompletedAttempt] = useState<QuizAttempt | null>(null);

  // Adaptive difficulty engine state
  const [adaptiveSession, setAdaptiveSession] = useState<AdaptiveSessionState>(() =>
    createAdaptiveSession(
      activeQuiz.difficulty === 'easy' || activeQuiz.difficulty === 'hard'
        ? (activeQuiz.difficulty as AdaptiveDifficulty)
        : 'medium'
    )
  );
  const [adaptiveStepNotification, setAdaptiveStepNotification] = useState<AdaptiveStepResult | null>(null);
  const [loadingAdaptiveQuestion, setLoadingAdaptiveQuestion] = useState<boolean>(false);
  const [adaptiveNotice, setAdaptiveNotice] = useState<string | null>(null);

  // Mistake Explanation Modal state
  const [activeMistakeQuestion, setActiveMistakeQuestion] = useState<Question | null>(null);
  const [mistakeAnalysis, setMistakeAnalysis] = useState<MistakeAnalysisResult | null>(null);
  const [analyzingMistake, setAnalyzingMistake] = useState<boolean>(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  // Follow-up practice inside mistake modal
  const [followUpAnswered, setFollowUpAnswered] = useState<string | null>(null);

  // Real Timer with Ref to avoid closure stale state
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Is current quiz in adaptive mode? (Apply Mode where difficulty is 'adaptive' or default Apply Mode)
  const isAdaptiveMode =
    activeQuiz.mode === 'apply' &&
    (activeQuiz.difficulty === 'adaptive' || activeQuiz.difficulty === 'medium' || activeQuiz.difficulty === 'hard');

  // Synchronize when initialState changes (e.g. from Duel accept, Revision list, or Library)
  useEffect(() => {
    if (initialState) {
      if (initialState.customQuiz) {
        const cq = initialState.customQuiz;
        setActiveQuiz(cq);
        setRemainingSeconds(cq.timeLimitMinutes * 60);
        setAnswers({});
        setCurrentIndex(0);
        setTestState(initialState.duelInfo ? 'active' : 'lobby');
        setCompletedAttempt(null);
        setDuelInfo(initialState.duelInfo || null);
        setAdaptiveSession(
          createAdaptiveSession(
            cq.difficulty === 'easy' || cq.difficulty === 'hard'
              ? (cq.difficulty as AdaptiveDifficulty)
              : 'medium'
          )
        );
        setAdaptiveStepNotification(null);
      } else if (initialState.customQuestions && initialState.customQuestions.length > 0) {
        const customQuiz: Quiz = {
          id: `custom-session-${Date.now()}`,
          title:
            initialState.quizTitle ||
            (initialState.duelInfo
              ? `Peer Duel: ${initialState.duelInfo.code}`
              : 'Targeted Revision Session'),
          description: initialState.duelInfo
            ? `Asynchronous duel challenged by ${initialState.duelInfo.creatorName}.`
            : 'Focused practice on previously identified misconceptions.',
          sourceType: 'topic',
          questions: initialState.customQuestions,
          createdAt: new Date().toISOString(),
          timeLimitMinutes: Math.max(3, Math.round(initialState.customQuestions.length * 2)),
          mode: 'apply',
          difficulty: 'medium',
        };
        setActiveQuiz(customQuiz);
        setRemainingSeconds(customQuiz.timeLimitMinutes * 60);
        setAnswers({});
        setCurrentIndex(0);
        setTestState(initialState.duelInfo ? 'active' : 'lobby');
        setCompletedAttempt(null);
        setDuelInfo(initialState.duelInfo || null);
        setAdaptiveSession(createAdaptiveSession('medium'));
        setAdaptiveStepNotification(null);
      } else if (initialState.quizId) {
        const found = quizzes.find((q) => q.id === initialState.quizId);
        if (found) {
          setActiveQuiz(found);
          setRemainingSeconds(found.timeLimitMinutes * 60);
          setAnswers({});
          setCurrentIndex(0);
          setTestState('lobby');
          setCompletedAttempt(null);
          setDuelInfo(null);
          setAdaptiveSession(
            createAdaptiveSession(
              found.difficulty === 'easy' || found.difficulty === 'hard'
                ? (found.difficulty as AdaptiveDifficulty)
                : 'medium'
            )
          );
          setAdaptiveStepNotification(null);
        }
      }
    }
  }, [initialState]);

  // Initialize bookmarked IDs
  useEffect(() => {
    const existing = getSavedMistakes().map((m) => m.question.id);
    setBookmarkedIds(new Set(existing));
  }, []);

  // Timer runner
  useEffect(() => {
    if (testState === 'active' && activeQuiz.timeLimitMinutes > 0) {
      timerRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleFinalSubmit(); // Automatic submission on expiry!
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [testState]);

  const startTest = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setRemainingSeconds(quiz.timeLimitMinutes > 0 ? quiz.timeLimitMinutes * 60 : 0);
    setAnswers({});
    setCurrentIndex(0);
    setTestState('active');
    setCompletedAttempt(null);
    setAdaptiveSession(
      createAdaptiveSession(
        quiz.difficulty === 'easy' || quiz.difficulty === 'hard'
          ? (quiz.difficulty as AdaptiveDifficulty)
          : 'medium'
      )
    );
    setAdaptiveStepNotification(null);
    setAdaptiveNotice(null);
  };

  /**
   * Handle learner selecting an option.
   * In standard mode: records the selection.
   * Note: The answer is NOT revealed until exam submission.
   */
  const handleSelectOption = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        questionId,
        selectedOptionId: optionId,
        timeSpentSeconds: 15,
        isMarkedForReview: prev[questionId]?.isMarkedForReview || false,
      },
    }));
  };

  const toggleMarkForReview = (questionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        questionId,
        selectedOptionId: prev[questionId]?.selectedOptionId || '',
        timeSpentSeconds: 15,
        isMarkedForReview: !prev[questionId]?.isMarkedForReview,
      },
    }));
  };

  /**
   * Adaptive navigation:
   * When learner advances to the next question in an adaptive Apply Mode assessment,
   * we evaluate their performance on current/recent questions, determine the next difficulty
   * (Easy <-> Medium <-> Hard), and dynamically adapt the upcoming question.
   */
  const handleNextQuestion = async () => {
    const totalQ = activeQuiz.questions.length;
    if (currentIndex >= totalQ - 1) return;

    const currentQ = activeQuiz.questions[currentIndex];
    const userSelected = answers[currentQ.id]?.selectedOptionId;

    // In adaptive Apply Mode, evaluate transition
    if (isAdaptiveMode && userSelected) {
      const isCorrect = userSelected === currentQ.correctAnswerId;
      const { updatedSession, stepResult } = evaluateAdaptiveDifficulty(
        adaptiveSession,
        isCorrect,
        currentQ.id
      );
      setAdaptiveSession(updatedSession);
      setAdaptiveStepNotification(stepResult);

      const nextIdx = currentIndex + 1;
      const nextQ = activeQuiz.questions[nextIdx];

      // If next question difficulty doesn't match the newly evaluated target difficulty,
      // dynamically request or curate a question at the target difficulty!
      if (nextQ && nextQ.difficulty !== stepResult.nextDifficulty) {
        try {
          setLoadingAdaptiveQuestion(true);
          const usedIds = new Set(activeQuiz.questions.map((q) => q.id));

          // Try Gemini server endpoint first
          const prevPrompts = activeQuiz.questions.map((q) => ({ prompt: q.prompt }));
          let adaptedQ: Question | null = null;

          try {
            const apiRes = await generateAdaptiveQuestionWithAI({
              topic: currentQ.topic || activeQuiz.title,
              sourceSnippet: activeQuiz.sourceSnippet || '',
              mode: 'apply',
              targetDifficulty: stepResult.nextDifficulty,
              previousQuestions: prevPrompts,
            });

            if (apiRes && apiRes.question) {
              adaptedQ = apiRes.question;
              if (apiRes.isDemoMode) {
                setAdaptiveNotice(
                  `Deterministic adaptation: Adjusted to ${stepResult.nextDifficulty.toUpperCase()} tier.`
                );
              } else {
                setAdaptiveNotice(
                  `AI Adaptive Engine: Generated new ${stepResult.nextDifficulty.toUpperCase()} question grounded in ${currentQ.topic}.`
                );
              }
            }
          } catch (apiErr) {
            console.warn('API adaptive generation failed, using deterministic pool:', apiErr);
          }

          // Fallback to deterministic multi-tier question bank if API call failed
          if (!adaptedQ) {
            adaptedQ = getDeterministicAdaptiveQuestion(
              currentQ.topic || activeQuiz.title,
              stepResult.nextDifficulty,
              usedIds
            );
          }

          if (adaptedQ) {
            // Replace the upcoming question at nextIdx with the adapted question
            setActiveQuiz((prev) => {
              const updatedQuestions = [...prev.questions];
              updatedQuestions[nextIdx] = adaptedQ!;
              return {
                ...prev,
                questions: updatedQuestions,
              };
            });
          }
        } catch (adaptErr) {
          console.error('Failed to adapt question:', adaptErr);
          // Gracefully continue without breaking progress
        } finally {
          setLoadingAdaptiveQuestion(false);
        }
      }
    }

    setCurrentIndex((prev) => Math.min(totalQ - 1, prev + 1));
  };

  const handlePrevQuestion = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleFinalSubmit = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setShowSubmitModal(false);

    // Calculate score
    const questions = activeQuiz.questions;
    let correctCount = 0;
    questions.forEach((q) => {
      if (answers[q.id]?.selectedOptionId === q.correctAnswerId) {
        correctCount += 1;
      }
    });

    const scorePct = Math.round((correctCount / questions.length) * 100);
    const totalTime =
      activeQuiz.timeLimitMinutes > 0
        ? activeQuiz.timeLimitMinutes * 60 - remainingSeconds
        : 60;

    const attempt: QuizAttempt = {
      id: `attempt-${Date.now()}`,
      quizId: activeQuiz.id,
      quizTitle: activeQuiz.title,
      startedAt: new Date(Date.now() - totalTime * 1000).toISOString(),
      completedAt: new Date().toISOString(),
      timeSpentSeconds: Math.max(10, totalTime),
      answers,
      score: scorePct,
      totalQuestions: questions.length,
      correctCount,
      mode: activeQuiz.mode,
      topic: activeQuiz.questions[0]?.topic || 'General',
    };

    recordQuizAttempt(attempt);
    setCompletedAttempt(attempt);
    setTestState('review');
  };

  const handleExplainMistake = async (question: Question) => {
    try {
      setActiveMistakeQuestion(question);
      setMistakeAnalysis(null);
      setFollowUpAnswered(null);
      setAnalyzingMistake(true);

      const userSelected = answers[question.id]?.selectedOptionId || '';
      const result = await explainMistakeWithAI({
        question,
        selectedOptionId: userSelected,
      });
      setMistakeAnalysis(result);
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzingMistake(false);
    }
  };

  const handleBookmarkMistake = (question: Question) => {
    saveMistake(question, completedAttempt?.id);
    setBookmarkedIds((prev) => new Set([...prev, question.id]));
  };

  // Format MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentQ = activeQuiz.questions[currentIndex];
  const answeredCount = Object.values(answers).filter((a) => Boolean(a.selectedOptionId)).length;
  const isTimeLow = activeQuiz.timeLimitMinutes > 0 && remainingSeconds <= 60;

  // 1. LOBBY SCREEN (Choose or Start test)
  if (testState === 'lobby') {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 py-8 space-y-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-semibold">
              Assessment Arena
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              Exam Simulation
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Test Arena</h1>
          <p className="text-sm text-slate-400">
            Timed assessments under realistic conditions with adaptive difficulty transitions and instant post-exam mistake diagnostics.
          </p>
        </div>

        {/* Selected Test Card Hero */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#0E1326] border border-cyan-500/30 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <span className="text-xs font-mono text-cyan-300 uppercase">Selected Assessment</span>
              <h2 className="text-xl font-bold text-white mt-0.5">{activeQuiz.title}</h2>
              <p className="text-xs text-slate-400 mt-1">{activeQuiz.description}</p>
            </div>
            <button
              onClick={() => startTest(activeQuiz)}
              className="px-6 py-3 rounded-xl text-sm font-bold bg-cyan-400 text-slate-950 hover:bg-cyan-300 font-mono transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(103,232,249,0.35)]"
            >
              <Clock className="w-4 h-4" />
              <span>Begin Timed Exam</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-3 rounded-xl bg-[#090C18] border border-slate-800">
              <span className="text-slate-500 block mb-0.5">Questions</span>
              <span className="text-white font-bold text-sm">{activeQuiz.questions.length} Total</span>
            </div>
            <div className="p-3 rounded-xl bg-[#090C18] border border-slate-800">
              <span className="text-slate-500 block mb-0.5">Time Limit</span>
              <span className="text-cyan-300 font-bold text-sm">
                {activeQuiz.timeLimitMinutes > 0 ? `${activeQuiz.timeLimitMinutes} Minutes` : 'Untimed'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#090C18] border border-slate-800">
              <span className="text-slate-500 block mb-0.5">Cognitive Mode</span>
              <span className="text-violet-300 font-bold text-sm capitalize">{activeQuiz.mode}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#090C18] border border-slate-800">
              <span className="text-slate-500 block mb-0.5">Difficulty</span>
              <span className="text-amber-300 font-bold text-sm capitalize flex items-center gap-1.5">
                {isAdaptiveMode ? (
                  <>
                    <Activity className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Adaptive Dynamic</span>
                  </>
                ) : (
                  activeQuiz.difficulty
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Other Curricula in Library */}
        <div className="space-y-4">
          <h3 className="text-sm font-mono uppercase tracking-wider text-slate-300 font-semibold">
            Or Choose from Library
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quizzes.map((q) => (
              <div
                key={q.id}
                onClick={() => setActiveQuiz(q)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                  activeQuiz.id === q.id
                    ? 'bg-cyan-950/40 border-cyan-400/80 shadow-[0_0_15px_rgba(103,232,249,0.15)]'
                    : 'bg-[#0E1326] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#090C18] text-cyan-300 border border-cyan-500/30">
                    {q.mode.toUpperCase()}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {q.questions.length} Qs · {q.timeLimitMinutes}m
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white mb-1">{q.title}</h4>
                <p className="text-xs text-slate-400 line-clamp-2">{q.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 2. ACTIVE TEST ARENA (Live exam session)
  if (testState === 'active') {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Arena Top Toolbar: Timer & Progress */}
        <div className="sticky top-16 z-40 p-4 rounded-2xl bg-[#0E1326]/95 backdrop-blur-md border border-cyan-500/30 flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-cyan-300 font-bold hidden sm:inline">
              {activeQuiz.title}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Q {currentIndex + 1} of {activeQuiz.questions.length}
            </span>

            {/* Current Active Adaptive Difficulty Badge */}
            {isAdaptiveMode && (
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#090C18] border border-cyan-500/40 text-[11px] font-mono">
                <span className="text-slate-400">Tier:</span>
                <span
                  className={`font-bold uppercase ${
                    (currentQ.difficulty || adaptiveSession.currentDifficulty) === 'hard'
                      ? 'text-rose-400'
                      : (currentQ.difficulty || adaptiveSession.currentDifficulty) === 'medium'
                      ? 'text-amber-300'
                      : 'text-emerald-400'
                  }`}
                >
                  {currentQ.difficulty || adaptiveSession.currentDifficulty}
                </span>
              </div>
            )}
          </div>

          {/* Countdown Clock with Pulse warning */}
          <div className="flex items-center gap-3">
            {activeQuiz.timeLimitMinutes > 0 && (
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-sm font-bold border transition-colors ${
                  isTimeLow
                    ? 'bg-rose-950 border-rose-500 text-rose-300 animate-pulse'
                    : 'bg-[#090C18] border-cyan-500/40 text-cyan-300'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>{formatTime(remainingSeconds)}</span>
              </div>
            )}

            <button
              onClick={() => setShowSubmitModal(true)}
              className="px-4 py-1.5 rounded-xl text-xs font-bold bg-cyan-400 text-slate-950 hover:bg-cyan-300 transition-colors font-mono shadow-[0_0_12px_rgba(103,232,249,0.3)]"
            >
              Submit Exam
            </button>
          </div>
        </div>

        {/* Adaptive Difficulty Transition Banner */}
        {isAdaptiveMode && adaptiveStepNotification && (
          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs font-mono transition-all animate-fadeIn ${
              adaptiveStepNotification.direction === 'promoted'
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                : adaptiveStepNotification.direction === 'demoted'
                ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                : 'bg-cyan-950/30 border-cyan-500/40 text-cyan-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {adaptiveStepNotification.direction === 'promoted' ? (
                <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : adaptiveStepNotification.direction === 'demoted' ? (
                <TrendingDown className="w-4 h-4 text-amber-400 shrink-0" />
              ) : (
                <Minus className="w-4 h-4 text-cyan-400 shrink-0" />
              )}
              <div>
                <span className="font-bold uppercase tracking-wider mr-2">
                  {adaptiveStepNotification.direction === 'promoted'
                    ? '▲ Difficulty Escalated'
                    : adaptiveStepNotification.direction === 'demoted'
                    ? '▼ Difficulty Recalibrated'
                    : '◆ Difficulty Maintained'}
                  : {adaptiveStepNotification.nextDifficulty.toUpperCase()}
                </span>
                <span className="text-[11px] opacity-90">{adaptiveStepNotification.reason}</span>
              </div>
            </div>
            <button
              onClick={() => setAdaptiveStepNotification(null)}
              className="text-slate-400 hover:text-white shrink-0 text-xs px-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Question Area & Navigation Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Question Display (8 cols) */}
          <div className="lg:col-span-8 p-6 sm:p-8 rounded-3xl bg-[#0E1326] border border-cyan-500/20 space-y-6 relative">
            {loadingAdaptiveQuestion && (
              <div className="absolute inset-0 bg-[#0E1326]/80 backdrop-blur-sm z-30 rounded-3xl flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                <span className="text-xs font-mono text-cyan-300">
                  Synthesizing next challenge at target difficulty...
                </span>
              </div>
            )}

            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-cyan-400 uppercase">
                  {currentQ.topic} · Mode: {currentQ.mode}
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${
                    currentQ.difficulty === 'hard'
                      ? 'bg-rose-950/60 border-rose-500/50 text-rose-300'
                      : currentQ.difficulty === 'medium'
                      ? 'bg-amber-950/60 border-amber-500/50 text-amber-300'
                      : 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                  }`}
                >
                  {currentQ.difficulty || 'medium'}
                </span>
              </div>
              <button
                onClick={() => toggleMarkForReview(currentQ.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono transition-colors border ${
                  answers[currentQ.id]?.isMarkedForReview
                    ? 'bg-amber-950/60 border-amber-400 text-amber-300'
                    : 'bg-[#090C18] border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>
                  {answers[currentQ.id]?.isMarkedForReview
                    ? 'Marked for Review'
                    : 'Mark for Review'}
                </span>
              </button>
            </div>

            {/* Prompt */}
            <p className="text-base sm:text-lg font-medium text-white leading-relaxed">
              {currentQ.prompt}
            </p>

            {/* Options */}
            <div className="space-y-3 pt-2">
              {currentQ.options.map((opt) => {
                const isSelected = answers[currentQ.id]?.selectedOptionId === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectOption(currentQ.id, opt.id)}
                    className={`w-full text-left p-4 rounded-2xl text-xs sm:text-sm transition-all border flex items-center justify-between ${
                      isSelected
                        ? 'bg-cyan-950/70 border-cyan-400 text-cyan-100 shadow-[0_0_15px_rgba(103,232,249,0.15)] font-medium'
                        : 'bg-[#090C18] border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span>{opt.text}</span>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ml-3 ${
                        isSelected
                          ? 'border-cyan-400 bg-cyan-400 text-slate-950'
                          : 'border-slate-700'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Bottom Nav Controls */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-800">
              <button
                disabled={currentIndex === 0}
                onClick={handlePrevQuestion}
                className="px-4 py-2 rounded-xl text-xs font-mono text-slate-300 bg-[#090C18] border border-slate-800 hover:border-slate-700 disabled:opacity-40 transition-colors flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <div className="text-[11px] font-mono text-slate-500">
                {answers[currentQ.id]?.selectedOptionId ? (
                  <span className="text-cyan-300">Answer selected</span>
                ) : (
                  <span>Select an option to proceed</span>
                )}
              </div>

              <button
                disabled={currentIndex === activeQuiz.questions.length - 1}
                onClick={handleNextQuestion}
                className="px-4 py-2 rounded-xl text-xs font-mono text-slate-300 bg-[#090C18] border border-slate-800 hover:border-slate-700 disabled:opacity-40 transition-colors flex items-center gap-1.5"
              >
                <span>{isAdaptiveMode ? 'Next (Adaptive)' : 'Next'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Question Navigator Palette (4 cols) */}
          <div className="lg:col-span-4 p-6 rounded-3xl bg-[#0E1326] border border-slate-800 space-y-6">
            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold mb-1">
                Question Navigator
              </h3>
              <p className="text-[11px] text-slate-500">
                {answeredCount} of {activeQuiz.questions.length} answered
              </p>
            </div>

            {/* Palette Grid */}
            <div className="grid grid-cols-4 gap-2">
              {activeQuiz.questions.map((q, idx) => {
                const ans = answers[q.id];
                const isAnswered = Boolean(ans?.selectedOptionId);
                const isMarked = Boolean(ans?.isMarkedForReview);
                const isCurrent = currentIndex === idx;

                let bgClass = 'bg-[#090C18] text-slate-400 border-slate-800';
                if (isCurrent) {
                  bgClass = 'ring-2 ring-cyan-400 text-white bg-slate-900 border-cyan-400';
                } else if (isMarked) {
                  bgClass = 'bg-amber-950/60 text-amber-300 border-amber-400/80';
                } else if (isAnswered) {
                  bgClass = 'bg-cyan-950/60 text-cyan-300 border-cyan-500/50';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`py-2 rounded-xl text-xs font-mono font-bold border transition-all relative ${bgClass}`}
                  >
                    <span>{idx + 1}</span>
                    <span className="block text-[8px] font-normal uppercase opacity-75">
                      {(q.difficulty || 'med').slice(0, 3)}
                    </span>
                    {isMarked && (
                      <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="pt-4 border-t border-slate-800/80 space-y-2 text-[11px] font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-cyan-950 border border-cyan-500/50" />
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-amber-950 border border-amber-400" />
                <span>Marked for Review</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-[#090C18] border border-slate-800" />
                <span>Unanswered</span>
              </div>
            </div>

            {/* Adaptive System Info Card */}
            {isAdaptiveMode && (
              <div className="p-3.5 rounded-2xl bg-[#090C18] border border-cyan-500/20 text-[11px] font-mono space-y-1.5">
                <div className="flex items-center justify-between text-cyan-300 font-bold">
                  <span className="flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" />
                    <span>Adaptive Engine Active</span>
                  </span>
                  <span className="uppercase text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-500/40">
                    Live
                  </span>
                </div>
                <p className="text-slate-400 text-[10px] leading-relaxed">
                  Difficulty automatically promotes on streaks and recalibrates on cognitive errors. Answers are verified upon submission.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Submit Confirmation Modal */}
        {showSubmitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="p-6 rounded-3xl bg-[#0E1326] border border-cyan-500/30 max-w-md w-full space-y-4">
              <h3 className="text-lg font-bold text-white">Confirm Test Submission</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                You have answered <strong>{answeredCount}</strong> of{' '}
                <strong>{activeQuiz.questions.length}</strong> questions.
                {answeredCount < activeQuiz.questions.length && (
                  <span className="text-amber-300 block mt-1">
                    Warning: You still have {activeQuiz.questions.length - answeredCount} unanswered questions!
                  </span>
                )}
              </p>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-mono text-slate-400 hover:text-white"
                >
                  Continue Test
                </button>
                <button
                  onClick={handleFinalSubmit}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-400 text-slate-950 font-mono hover:bg-cyan-300 transition-colors"
                >
                  Submit & View Results
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 3. RESULTS & REVIEW SCREEN
  if (testState === 'review' && completedAttempt) {
    const isPassing = completedAttempt.score >= 70;

    return (
      <div className="w-full max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Scorecard Hero */}
        <div className="p-8 rounded-3xl bg-[#0E1326] border border-cyan-500/30 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-semibold">
                Exam Session Finished
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                {completedAttempt.quizTitle}
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Completed in {Math.round(completedAttempt.timeSpentSeconds / 60)} minutes
              </p>
            </div>

            {/* Score Ring / Badge */}
            <div className="flex items-center gap-4">
              <div className="text-right font-mono">
                <div
                  className={`text-4xl font-black ${
                    isPassing ? 'text-emerald-300' : 'text-amber-300'
                  }`}
                >
                  {completedAttempt.score}%
                </div>
                <div className="text-xs text-slate-400">
                  {completedAttempt.correctCount} of {completedAttempt.totalQuestions} Correct
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 text-xs font-mono">
            <div>
              <span className="text-slate-500 block">Mode</span>
              <span className="text-white font-bold capitalize">
                {completedAttempt.mode} {isAdaptiveMode && '(Adaptive)'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">XP Earned</span>
              <span className="text-cyan-300 font-bold">
                +{Math.round(completedAttempt.score * 1.5) + completedAttempt.correctCount * 10} XP
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Time Taken</span>
              <span className="text-slate-300 font-bold">
                {formatTime(completedAttempt.timeSpentSeconds)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Mastery Evaluation</span>
              <span className={isPassing ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                {isPassing ? 'Concept Mastered' : 'Needs Targeted Revision'}
              </span>
            </div>
          </div>

          {/* Adaptive Progression Summary */}
          {isAdaptiveMode && (
            <div className="mt-6 pt-4 border-t border-slate-800/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span className="text-cyan-300 font-bold">Adaptive Trajectory:</span>
                  <div className="flex items-center gap-1.5">
                    {activeQuiz.questions.map((q, idx) => (
                      <span
                        key={q.id}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          q.difficulty === 'hard'
                            ? 'bg-rose-950/60 border-rose-500/60 text-rose-300'
                            : q.difficulty === 'medium'
                            ? 'bg-amber-950/60 border-amber-500/60 text-amber-300'
                            : 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300'
                        }`}
                      >
                        Q{idx + 1}:{q.difficulty}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="text-slate-400 text-[11px]">
                  Final Calibrated Tier:{' '}
                  <strong className="text-cyan-300 uppercase">
                    {adaptiveSession.currentDifficulty}
                  </strong>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Head-to-Head Duel Comparison Card (Rendered if test was an asynchronous duel) */}
        {duelInfo && (
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#120F2B] to-[#0A0E22] border border-cyan-400/50 shadow-[0_0_35px_rgba(103,232,249,0.18)] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-cyan-950 border border-cyan-400/60 text-cyan-300">
                  <Zap className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-widest text-cyan-300 font-bold">
                    Head-to-Head Duel Outcome
                  </span>
                  <h3 className="text-xl font-extrabold text-white">
                    {completedAttempt.score > duelInfo.creatorScore ||
                    (completedAttempt.score === duelInfo.creatorScore &&
                      completedAttempt.timeSpentSeconds <= duelInfo.creatorTimeSeconds)
                      ? '🏆 Victory Over Challenger!'
                      : completedAttempt.score === duelInfo.creatorScore
                      ? '⚔️ Honorable Standoff'
                      : '🎯 Benchmark Unmet'}
                  </h3>
                </div>
              </div>

              <span className="text-xs font-mono text-slate-400 bg-[#090C18] px-3 py-1.5 rounded-xl border border-slate-800">
                Code: {duelInfo.code}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Your Performance */}
              <div className="p-5 rounded-2xl bg-[#090C18] border border-cyan-500/40 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-cyan-300 font-bold">Your Result</span>
                  <span className="text-emerald-400 font-bold text-lg">{completedAttempt.score}%</span>
                </div>
                <div className="text-xs text-slate-400 font-mono flex justify-between">
                  <span>Completion Time:</span>
                  <span className="text-white font-bold">{formatTime(completedAttempt.timeSpentSeconds)}</span>
                </div>
                <div className="text-xs text-slate-400 font-mono flex justify-between">
                  <span>Questions Correct:</span>
                  <span className="text-white font-bold">
                    {completedAttempt.correctCount} / {completedAttempt.totalQuestions}
                  </span>
                </div>
              </div>

              {/* Challenger Performance */}
              <div className="p-5 rounded-2xl bg-[#090C18] border border-violet-500/40 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-violet-300 font-bold">{duelInfo.creatorName}</span>
                  <span className="text-violet-200 font-bold text-lg">{duelInfo.creatorScore}%</span>
                </div>
                <div className="text-xs text-slate-400 font-mono flex justify-between">
                  <span>Benchmark Time:</span>
                  <span className="text-white font-bold">{formatTime(duelInfo.creatorTimeSeconds)}</span>
                </div>
                <div className="text-xs text-slate-400 font-mono flex justify-between">
                  <span>Status:</span>
                  <span className="text-slate-300">Challenger Baseline</span>
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-300 leading-relaxed bg-[#070A16] p-4 rounded-xl border border-slate-800">
              <strong>Duel Summary:</strong>{' '}
              {completedAttempt.score > duelInfo.creatorScore
                ? `You scored ${completedAttempt.score}%, outperforming ${duelInfo.creatorName}'s score of ${duelInfo.creatorScore}%. Your first-principles transfer on this curriculum was superior.`
                : completedAttempt.score === duelInfo.creatorScore
                ? `You tied ${duelInfo.creatorName} with identical accuracy of ${completedAttempt.score}%.`
                : `${duelInfo.creatorName} retained higher accuracy (${duelInfo.creatorScore}% vs ${completedAttempt.score}%). Review your misconceptions below, reinforce with follow-up practice, and issue a return duel.`}
            </div>
          </div>
        )}

        {/* Detailed Question Review List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-cyan-400" />
              <span>Question-by-Question Review & Explanations</span>
            </h2>
            <button
              onClick={() => startTest(activeQuiz)}
              className="text-xs font-mono text-cyan-300 hover:underline flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retake Test</span>
            </button>
          </div>

          <div className="space-y-4">
            {activeQuiz.questions.map((q, idx) => {
              const userAns = completedAttempt.answers[q.id]?.selectedOptionId;
              const isCorrect = userAns === q.correctAnswerId;
              const isBookmarked = bookmarkedIds.has(q.id);

              return (
                <div
                  key={q.id}
                  className={`p-6 rounded-2xl border transition-all ${
                    isCorrect
                      ? 'bg-[#0A1121] border-emerald-500/30'
                      : 'bg-[#140C1A] border-rose-500/35'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-400">Question {idx + 1}</span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                          isCorrect
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {isCorrect ? 'Correct' : 'Incorrect'}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${
                          q.difficulty === 'hard'
                            ? 'bg-rose-950/60 border-rose-500/50 text-rose-300'
                            : q.difficulty === 'medium'
                            ? 'bg-amber-950/60 border-amber-500/50 text-amber-300'
                            : 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                        }`}
                      >
                        Tier: {q.difficulty}
                      </span>
                    </div>

                    {/* Action buttons: Explain Mistake & Bookmark */}
                    <div className="flex items-center gap-2">
                      {!isCorrect && (
                        <button
                          onClick={() => handleExplainMistake(q)}
                          className="px-3 py-1 rounded-lg text-xs font-mono font-semibold bg-violet-950/80 border border-violet-400/50 text-violet-200 hover:bg-violet-900 transition-colors flex items-center gap-1.5 shadow-[0_0_10px_rgba(167,139,250,0.2)]"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                          <span>Explain My Mistake (AI)</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleBookmarkMistake(q)}
                        disabled={isBookmarked}
                        className={`p-1.5 rounded-lg border text-xs transition-colors ${
                          isBookmarked
                            ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
                            : 'bg-[#090C18] border-slate-800 text-slate-400 hover:text-white'
                        }`}
                        title="Save to Revision List"
                      >
                        <BookmarkPlus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm sm:text-base font-semibold text-white mb-4 leading-relaxed">
                    {q.prompt}
                  </p>

                  {/* Options with marked state */}
                  <div className="space-y-2 mb-4">
                    {q.options.map((opt) => {
                      const isOptionSelected = userAns === opt.id;
                      const isOptionCorrect = opt.id === q.correctAnswerId;

                      let optClass = 'bg-[#080B16] border-slate-800 text-slate-400';
                      if (isOptionCorrect) {
                        optClass = 'bg-emerald-950/50 border-emerald-500 text-emerald-200 font-medium';
                      } else if (isOptionSelected && !isOptionCorrect) {
                        optClass = 'bg-rose-950/50 border-rose-500 text-rose-200 font-medium';
                      }

                      return (
                        <div
                          key={opt.id}
                          className={`p-3 rounded-xl border text-xs flex items-center justify-between ${optClass}`}
                        >
                          <span>{opt.text}</span>
                          <span className="text-[11px] font-mono shrink-0 ml-2">
                            {isOptionCorrect && '✓ Correct Key'}
                            {isOptionSelected && !isOptionCorrect && '✗ Your Choice'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation & Source Grounding */}
                  <div className="p-4 rounded-xl bg-[#090C18] border border-slate-800 text-xs space-y-2">
                    <div>
                      <strong className="text-cyan-300 font-mono block mb-0.5">
                        First-Principles Explanation:
                      </strong>
                      <p className="text-slate-300 leading-relaxed">{q.explanation}</p>
                    </div>

                    {q.misconceptionAlert && (
                      <div className="text-amber-300/90 pt-1">
                        <strong>Cognitive Trap:</strong> {q.misconceptionAlert}
                      </div>
                    )}

                    {q.sourceReference?.passage && (
                      <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-900 font-mono">
                        <strong>Grounding Passage:</strong> "{q.sourceReference.passage}"
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. EXPLAIN MY MISTAKE MODAL */}
        {activeMistakeQuestion && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <div className="p-6 sm:p-8 rounded-3xl bg-[#0E1326] border border-violet-500/40 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-violet-400" />
                  <h3 className="text-lg font-bold text-white">Diagnostic: Explain My Mistake</h3>
                </div>
                <button
                  onClick={() => setActiveMistakeQuestion(null)}
                  className="text-slate-400 hover:text-white font-mono text-xs"
                >
                  Close ✕
                </button>
              </div>

              {analyzingMistake ? (
                <div className="py-12 text-center space-y-3">
                  <Loader2 className="w-8 h-8 text-violet-400 animate-spin mx-auto" />
                  <p className="text-xs text-slate-300 font-mono">
                    Deconstructing error taxonomy and cognitive trap...
                  </p>
                </div>
              ) : mistakeAnalysis ? (
                <div className="space-y-5 text-xs">
                  {/* Misconception Alert */}
                  <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/40 text-rose-200 space-y-1">
                    <strong className="text-rose-300 uppercase tracking-wider block font-mono text-[11px]">
                      The Core Misconception
                    </strong>
                    <p className="text-xs leading-relaxed">
                      {mistakeAnalysis.explanation.underlyingMisconception}
                    </p>
                  </div>

                  {/* Why Choice Failed vs Why Correct Works */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-[#090C18] border border-slate-800 space-y-1">
                      <strong className="text-rose-400 font-mono block">Why Your Choice Failed:</strong>
                      <p className="text-slate-300 leading-relaxed">
                        {mistakeAnalysis.explanation.whyIncorrect}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[#090C18] border border-slate-800 space-y-1">
                      <strong className="text-emerald-400 font-mono block">Why The Key Is Valid:</strong>
                      <p className="text-slate-300 leading-relaxed">
                        {mistakeAnalysis.explanation.whyCorrect}
                      </p>
                    </div>
                  </div>

                  {/* Instant Follow-up Practice Question */}
                  {mistakeAnalysis.explanation.followUpQuestion && (
                    <div className="p-5 rounded-2xl bg-[#140F2D] border border-violet-500/40 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono text-violet-300 uppercase font-semibold">
                          Follow-up Reinforcement Question
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">+25 XP</span>
                      </div>
                      <p className="text-sm font-semibold text-white">
                        {mistakeAnalysis.explanation.followUpQuestion.prompt}
                      </p>

                      <div className="space-y-2">
                        {mistakeAnalysis.explanation.followUpQuestion.options.map((opt) => {
                          const isFollowUpKey =
                            opt.id === mistakeAnalysis.explanation.followUpQuestion.correctAnswerId;
                          const hasAnswered = followUpAnswered !== null;

                          return (
                            <button
                              key={opt.id}
                              disabled={hasAnswered}
                              onClick={() => {
                                setFollowUpAnswered(opt.id);
                                if (isFollowUpKey) addXP(25);
                              }}
                              className={`w-full text-left p-3 rounded-xl border text-xs transition-all ${
                                hasAnswered
                                  ? isFollowUpKey
                                    ? 'bg-emerald-950/50 border-emerald-500 text-emerald-200'
                                    : opt.id === followUpAnswered
                                    ? 'bg-rose-950/50 border-rose-500 text-rose-200'
                                    : 'bg-[#090C18] border-slate-800 text-slate-500'
                                  : 'bg-[#090C18] border-slate-800 text-slate-300 hover:border-violet-400'
                              }`}
                            >
                              {opt.text}
                            </button>
                          );
                        })}
                      </div>

                      {followUpAnswered && (
                        <p className="text-xs text-slate-300 pt-2 border-t border-slate-800">
                          <strong>Diagnostic Result:</strong>{' '}
                          {followUpAnswered ===
                          mistakeAnalysis.explanation.followUpQuestion.correctAnswerId
                            ? 'Excellent! You have successfully resolved the conceptual trap.'
                            : 'Review the underlying mechanism again in the Revision Loop.'}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : null}

              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setActiveMistakeQuestion(null)}
                  className="px-5 py-2 rounded-xl text-xs font-mono font-bold bg-slate-900 border border-slate-800 text-white hover:bg-slate-800"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
};
