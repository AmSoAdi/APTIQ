import React, { useState, useEffect } from 'react';
import {
  Flame,
  Award,
  Zap,
  Brain,
  Terminal,
  BookOpen,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Clock,
  Sparkles,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import {
  getStoredUserStats,
  getQuizAttempts,
  getSavedMistakes,
  getStoredQuizzes,
  CURATED_THINK_CHALLENGES,
} from '../services/storage';
import { UserStats, QuizAttempt, SavedMistake, Quiz } from '../types';

interface DashboardPageProps {
  navigate: (route: string, state?: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ navigate }) => {
  const [stats, setStats] = useState<UserStats>(getStoredUserStats());
  const [attempts, setAttempts] = useState<QuizAttempt[]>(getQuizAttempts());
  const [mistakes, setMistakes] = useState<SavedMistake[]>(getSavedMistakes());
  const [quizzes, setQuizzes] = useState<Quiz[]>(getStoredQuizzes());

  useEffect(() => {
    setStats(getStoredUserStats());
    setAttempts(getQuizAttempts());
    setMistakes(getSavedMistakes());
    setQuizzes(getStoredQuizzes());
  }, []);

  const totalQuestionsAnswered = Object.values(stats.topicMastery).reduce(
    (acc, cur) => acc + cur.total,
    0
  );
  const totalCorrect = Object.values(stats.topicMastery).reduce(
    (acc, cur) => acc + cur.correct,
    0
  );
  const overallAccuracy =
    totalQuestionsAnswered > 0 ? Math.round((totalCorrect / totalQuestionsAnswered) * 100) : 82;

  // Level progress percentage (500 XP per level)
  const currentLevelBaseXP = (stats.level - 1) * 500;
  const xpIntoCurrentLevel = stats.xp - currentLevelBaseXP;
  const levelProgressPct = Math.min(100, Math.max(0, Math.round((xpIntoCurrentLevel / 500) * 100)));

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Top Banner with Welcome & Honest Demo Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-semibold">
              Personal Learning Command
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400">
              Deterministic Demo Data Disclosed
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome back, Learner
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Strengthen your conceptual models and tackle unfamiliar scenarios.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('quiz-studio')}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-400 text-slate-950 hover:bg-cyan-300 transition-all font-mono flex items-center gap-1.5 shadow-[0_0_15px_rgba(103,232,249,0.3)]"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Generate Quiz</span>
          </button>
          <button
            onClick={() => navigate('think-arena')}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#140F2D] text-violet-300 border border-violet-500/40 hover:bg-violet-950/60 transition-all font-mono flex items-center gap-1.5"
          >
            <Brain className="w-3.5 h-3.5 text-violet-400" />
            <span>Think Arena</span>
          </button>
        </div>
      </div>

      {/* 1. KEY PERFORMANCE METRICS BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Streak */}
        <div className="p-5 rounded-2xl bg-[#0E1428] border border-cyan-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-400">Consistency</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono flex items-baseline gap-1.5">
            {stats.streakDays}
            <span className="text-xs font-sans text-amber-300 font-normal">days streak</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Persisted in browser local storage
          </p>
        </div>

        {/* Level & XP */}
        <div className="p-5 rounded-2xl bg-[#0E1428] border border-violet-500/25">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-400">Mastery Level</span>
            <Award className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-2xl font-bold text-violet-200 font-mono flex items-baseline gap-1.5">
            Level {stats.level}
            <span className="text-xs font-sans text-slate-400 font-normal">({stats.xp} XP)</span>
          </div>
          {/* Progress bar to next level */}
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-violet-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${levelProgressPct}%` }}
            />
          </div>
        </div>

        {/* Overall Accuracy */}
        <div className="p-5 rounded-2xl bg-[#0E1428] border border-cyan-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-400">Total Accuracy</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-200 font-mono flex items-baseline gap-1.5">
            {overallAccuracy}%
            <span className="text-xs font-sans text-slate-400 font-normal">
              ({totalCorrect}/{totalQuestionsAnswered} answered)
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Across {stats.quizzesCompleted} completed sessions
          </p>
        </div>

        {/* Recall vs Apply Balance */}
        <div className="p-5 rounded-2xl bg-[#0E1428] border border-cyan-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-400">Cognitive Balance</span>
            <Brain className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-center justify-between text-xs font-mono pt-1">
            <span className="text-cyan-300">Recall: {stats.recallAccuracy}%</span>
            <span className="text-violet-300">Apply: {stats.applyAccuracy}%</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 flex overflow-hidden">
            <div
              className="bg-cyan-400 h-full"
              style={{ width: `${(stats.recallAccuracy / (stats.recallAccuracy + stats.applyAccuracy)) * 100}%` }}
            />
            <div
              className="bg-violet-400 h-full"
              style={{ width: `${(stats.applyAccuracy / (stats.recallAccuracy + stats.applyAccuracy)) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. MAIN GRID: REVISION LOOP & FEATURED CHALLENGE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Col: Recommended Revision & Continue Learning (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Recommended Revision Loop */}
          <div className="rounded-2xl p-6 bg-[#0E1326] border border-cyan-500/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Recommended Revision Loop</h3>
              </div>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                {mistakes.length} Saved Items
              </span>
            </div>

            {mistakes.length === 0 ? (
              <div className="p-6 rounded-xl bg-[#090C18] border border-slate-800 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                <p className="text-xs font-medium text-slate-300">No active mistake bookmarks</p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                  When you make a mistake in Test Arena, click "Save to Revision List" to practice targeted misconceptions here.
                </p>
                <button
                  onClick={() => navigate('quiz-studio')}
                  className="mt-4 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-cyan-950 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-900 transition-colors"
                >
                  Take a Practice Quiz
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {mistakes.slice(0, 3).map((m) => (
                  <div
                    key={m.id}
                    className="p-4 rounded-xl bg-[#090C18] border border-slate-800/80 hover:border-cyan-500/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 text-cyan-300 border border-slate-700">
                        {m.question.topic}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Practiced {m.timesPracticed}x
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 font-medium line-clamp-2 mb-2">
                      {m.question.prompt}
                    </p>
                    {m.question.misconceptionAlert && (
                      <p className="text-[11px] text-amber-300/80 bg-amber-950/20 p-2 rounded border border-amber-500/20 mb-2">
                        <strong>Trap:</strong> {m.question.misconceptionAlert}
                      </p>
                    )}
                    <button
                      onClick={() => navigate('test-arena', { customQuestions: [m.question] })}
                      className="text-xs font-mono text-cyan-300 hover:text-cyan-200 flex items-center gap-1"
                    >
                      <span>Practice this concept now</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {mistakes.length > 3 && (
                  <button
                    onClick={() => navigate('progress')}
                    className="w-full py-2 text-center text-xs text-slate-400 hover:text-cyan-300 font-mono transition-colors"
                  >
                    View all {mistakes.length} saved mistakes →
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Available Quizzes to Launch */}
          <div className="rounded-2xl p-6 bg-[#0E1326] border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-cyan-400" />
                <span>Curriculum Library & Quizzes</span>
              </h3>
              <button
                onClick={() => navigate('quiz-studio')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1"
              >
                <span>+ Custom Quiz</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {quizzes.slice(0, 4).map((q) => (
                <div
                  key={q.id}
                  onClick={() => navigate('test-arena', { quizId: q.id })}
                  className="p-4 rounded-xl bg-[#090C18] border border-slate-800 hover:border-cyan-500/40 cursor-pointer transition-all group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                      {q.mode.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {q.questions.length} Questions
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors mb-1">
                    {q.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2">
                    {q.description}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-cyan-400 font-mono pt-2 border-t border-slate-900">
                    <span>{q.timeLimitMinutes}m Limit</span>
                    <span className="group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                      Launch <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Topic Mastery & Think Arena Shortcut (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Topic-Wise Strengths & Weaknesses */}
          <div className="rounded-2xl p-6 bg-[#0E1326] border border-slate-800">
            <h3 className="text-base font-bold text-white mb-1">Topic Mastery Radar</h3>
            <p className="text-xs text-slate-400 mb-4">
              Identifies domains where conceptual transfer is high versus vulnerable.
            </p>

            <div className="space-y-3">
              {Object.entries(stats.topicMastery).map(([topic, data]) => {
                const pct = Math.round((data.correct / data.total) * 100);
                const isWeak = pct < 75;
                return (
                  <div key={topic} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium">{topic}</span>
                      <span
                        className={`font-mono text-xs ${
                          isWeak ? 'text-amber-400' : 'text-cyan-400'
                        }`}
                      >
                        {pct}% ({data.correct}/{data.total})
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isWeak ? 'bg-amber-400' : 'bg-cyan-400'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => navigate('quiz-studio')}
              className="w-full mt-4 py-2 px-3 rounded-lg text-xs font-mono bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/30 transition-all text-center"
            >
              Generate Practice for Weakest Topics →
            </button>
          </div>

          {/* Quick Think Arena Challenge */}
          <div className="rounded-2xl p-6 bg-gradient-to-b from-[#140F2D] to-[#0A0D1E] border border-violet-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono uppercase tracking-widest text-violet-400 font-bold">
                Pillar 02 Spotlight
              </span>
              <span className="text-xs font-mono text-violet-300">
                +180 XP
              </span>
            </div>
            <h3 className="text-base font-bold text-white mb-2">
              The Exam Memorizer vs The Concept Architect
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              When a surprise curriculum reform introduces novel problems, analyze why the 98% memorizer’s heuristics break down under negative transfer.
            </p>
            <button
              onClick={() => navigate('think-arena', { challengeId: 'think-01' })}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-violet-500 text-white hover:bg-violet-400 font-mono transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(167,139,250,0.3)]"
            >
              <Brain className="w-3.5 h-3.5" />
              <span>Solve in Think Arena</span>
            </button>
          </div>

          {/* Prompting Lab Fast Card */}
          <div className="rounded-2xl p-5 bg-[#0E1326] border border-slate-800 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                <span>Prompting Lab</span>
              </span>
              <p className="text-[11px] text-slate-400">
                Refine AI prompts, eliminate ambiguities & inspect versions.
              </p>
            </div>
            <button
              onClick={() => navigate('prompting-lab')}
              className="px-3 py-1.5 rounded-lg text-xs font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-500/30 hover:bg-cyan-900 transition-colors"
            >
              Open Lab
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
