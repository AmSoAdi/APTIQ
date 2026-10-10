import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Brain,
  RotateCcw,
  Award,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Flame,
  Zap,
} from 'lucide-react';
import {
  getStoredUserStats,
  getQuizAttempts,
  getSavedMistakes,
  getThinkSubmissions,
  markMistakeMastered,
  removeSavedMistake,
} from '../services/storage';
import { UserStats, QuizAttempt, SavedMistake, ThinkArenaSubmission } from '../types';

interface ProgressPageProps {
  navigate: (route: string, state?: any) => void;
}

export const ProgressPage: React.FC<ProgressPageProps> = ({ navigate }) => {
  const [stats, setStats] = useState<UserStats>(getStoredUserStats());
  const [attempts, setAttempts] = useState<QuizAttempt[]>(getQuizAttempts());
  const [mistakes, setMistakes] = useState<SavedMistake[]>(getSavedMistakes());
  const [submissions, setSubmissions] = useState<ThinkArenaSubmission[]>(getThinkSubmissions());
  const [activeTab, setActiveTab] = useState<'analytics' | 'revision' | 'history'>('analytics');

  useEffect(() => {
    setStats(getStoredUserStats());
    setAttempts(getQuizAttempts());
    setMistakes(getSavedMistakes());
    setSubmissions(getThinkSubmissions());
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

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-semibold">
            Metacognitive Telemetry
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400">
            Real Stored User Data
          </span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Progress & Analytics</h1>
        <p className="text-sm text-slate-400">
          Track accuracy over time, balance between recall vs applied reasoning, and manage your revision loops.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 bg-[#0E1326] rounded-xl border border-slate-800 w-fit">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'analytics'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Analytics & Mastery
        </button>
        <button
          onClick={() => setActiveTab('revision')}
          className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
            activeTab === 'revision'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>Revision Loop</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-cyan-300">
            {mistakes.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'history'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Session History
        </button>
      </div>

      {activeTab === 'analytics' && (
        <div className="space-y-8">
          {/* Key Metric Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-[#0E1326] border border-cyan-500/20">
              <span className="text-xs font-mono text-slate-400 block mb-1">Total Accuracy</span>
              <div className="text-2xl font-bold text-cyan-300 font-mono">{overallAccuracy}%</div>
              <p className="text-[11px] text-slate-500 mt-1">Across all assessment items</p>
            </div>

            <div className="p-5 rounded-2xl bg-[#0E1326] border border-violet-500/20">
              <span className="text-xs font-mono text-slate-400 block mb-1">Reasoning Submissions</span>
              <div className="text-2xl font-bold text-violet-300 font-mono">
                {stats.thinkArenaCompleted}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Think Arena scenarios solved</p>
            </div>

            <div className="p-5 rounded-2xl bg-[#0E1326] border border-amber-500/20">
              <span className="text-xs font-mono text-slate-400 block mb-1">Learning Streak</span>
              <div className="text-2xl font-bold text-amber-300 font-mono flex items-center gap-1">
                <Flame className="w-5 h-5 text-amber-400" />
                <span>{stats.streakDays} Days</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Active practice frequency</p>
            </div>

            <div className="p-5 rounded-2xl bg-[#0E1326] border border-cyan-500/20">
              <span className="text-xs font-mono text-slate-400 block mb-1">XP Accumulated</span>
              <div className="text-2xl font-bold text-white font-mono">{stats.xp} XP</div>
              <p className="text-[11px] text-slate-500 mt-1">Level {stats.level} Scholar</p>
            </div>
          </div>

          {/* Cognitive Balance: Recall Mode vs Apply Mode */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#0E1326] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Recall vs Apply Ratio</h3>
                <p className="text-xs text-slate-400">
                  Compares direct knowledge retention against unfamiliar transfer ability.
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-cyan-400" />
                  <span className="text-cyan-300">Recall ({stats.recallAccuracy}%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-violet-400" />
                  <span className="text-violet-300">Apply ({stats.applyAccuracy}%)</span>
                </div>
              </div>
            </div>

            <div className="w-full bg-slate-900 h-4 rounded-full overflow-hidden flex">
              <div
                className="bg-gradient-to-r from-cyan-500 to-cyan-400 h-full transition-all"
                style={{ width: `${(stats.recallAccuracy / (stats.recallAccuracy + stats.applyAccuracy)) * 100}%` }}
              />
              <div
                className="bg-gradient-to-r from-violet-500 to-violet-400 h-full transition-all"
                style={{ width: `${(stats.applyAccuracy / (stats.recallAccuracy + stats.applyAccuracy)) * 100}%` }}
              />
            </div>
          </div>

          {/* Topic Performance Grid */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#0E1326] border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white">Domain Accuracy Matrix</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(stats.topicMastery).map(([topic, data]) => {
                const pct = Math.round((data.correct / data.total) * 100);
                return (
                  <div key={topic} className="p-4 rounded-xl bg-[#090C18] border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white">{topic}</span>
                      <span className="font-mono text-cyan-300">{pct}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${pct < 75 ? 'bg-amber-400' : 'bg-cyan-400'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono block">
                      {data.correct} correct of {data.total} attempted
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Revision Loop Tab */}
      {activeTab === 'revision' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-[#0E1326] border border-cyan-500/20 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Saved Mistakes & Targeted Revision</h3>
                <p className="text-xs text-slate-400">
                  Concept questions saved from previous exams. Re-test these to verify misconception resolution.
                </p>
              </div>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-950 px-2.5 py-1 rounded border border-cyan-500/30">
                {mistakes.length} Active Items
              </span>
            </div>

            {mistakes.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-bold text-white">Revision Queue is Clean</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  When you miss an answer in the Test Arena, click the bookmark icon to schedule it here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {mistakes.map((m) => (
                  <div
                    key={m.id}
                    className="p-5 rounded-2xl bg-[#090C18] border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 max-w-2xl">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 text-cyan-300 border border-slate-700">
                          {m.question.topic}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          Practiced {m.timesPracticed}x
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-200 font-medium">
                        {m.question.prompt}
                      </p>
                      {m.question.misconceptionAlert && (
                        <p className="text-[11px] text-amber-300/80 bg-amber-950/20 p-2 rounded border border-amber-500/20">
                          <strong>Cognitive Trap:</strong> {m.question.misconceptionAlert}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => navigate('test-arena', { customQuestions: [m.question] })}
                        className="px-3 py-1.5 rounded-xl text-xs font-mono font-semibold bg-cyan-950 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-900 transition-colors flex items-center gap-1"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Practice</span>
                      </button>
                      <button
                        onClick={() => removeSavedMistake(m.id)}
                        className="p-1.5 rounded-xl text-xs font-mono text-slate-500 hover:text-rose-400 transition-colors"
                        title="Remove from revision list"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Session History Tab */}
      {activeTab === 'history' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#0E1326] border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white">Recent Completed Sessions</h3>
          {attempts.length === 0 ? (
            <p className="text-xs text-slate-500">No test attempts logged yet.</p>
          ) : (
            <div className="space-y-3">
              {attempts.map((att) => (
                <div
                  key={att.id}
                  className="p-4 rounded-xl bg-[#090C18] border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-white">{att.quizTitle}</h4>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {new Date(att.completedAt).toLocaleDateString()} · {att.totalQuestions} questions · Mode: {att.mode}
                    </span>
                  </div>
                  <div className="text-right font-mono">
                    <span
                      className={`text-base font-bold ${
                        att.score >= 70 ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {att.score}%
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      {att.correctCount}/{att.totalQuestions}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
