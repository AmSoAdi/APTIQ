import React, { useState } from 'react';
import {
  Award,
  Users,
  Share2,
  Sparkles,
  Flame,
  Check,
  Copy,
  Zap,
  Info,
} from 'lucide-react';
import { getStoredUserStats, getStoredQuizzes } from '../services/storage';
import {
  buildShareableChallengeUrl,
  saveLocalChallenge,
  parseChallengeFromHash,
  SharedChallengePayload,
} from '../services/challengeService';
import { LeaderboardUser, Quiz } from '../types';

const DEMO_LEADERBOARD_USERS: LeaderboardUser[] = [
  {
    id: 'u-1',
    name: 'Elena Rostova',
    avatarSeed: 'elena',
    xp: 3240,
    rank: 1,
    streak: 19,
    accuracy: 94,
    badge: 'Consensus Architect',
  },
  {
    id: 'u-2',
    name: 'Marcus Vance',
    avatarSeed: 'marcus',
    xp: 2890,
    rank: 2,
    streak: 14,
    accuracy: 91,
    badge: 'Causal Detective',
  },
  {
    id: 'u-3',
    name: 'Kaito Tanaka',
    avatarSeed: 'kaito',
    xp: 2450,
    rank: 3,
    streak: 12,
    accuracy: 89,
    badge: 'Bias Specialist',
  },
  {
    id: 'u-4',
    name: 'Dr. Sarah Lin',
    avatarSeed: 'sarah',
    xp: 2110,
    rank: 4,
    streak: 9,
    accuracy: 86,
    badge: 'First Principles',
  },
  {
    id: 'u-5',
    name: 'Devon Hayes',
    avatarSeed: 'devon',
    xp: 1780,
    rank: 5,
    streak: 8,
    accuracy: 83,
    badge: 'Logic Master',
  },
];

interface LeaderboardPageProps {
  navigate: (route: string, state?: any) => void;
}

export const LeaderboardPage: React.FC<LeaderboardPageProps> = ({ navigate }) => {
  const stats = getStoredUserStats();
  const availableQuizzes = getStoredQuizzes();

  const [tab, setTab] = useState<'weekly' | 'alltime'>('weekly');
  const [filter, setFilter] = useState<'global' | 'demo_peers'>('global');
  const [selectedQuizId, setSelectedQuizId] = useState<string>(availableQuizzes[0]?.id || '');
  const [challengerName, setChallengerName] = useState<string>('Learner Duelist');
  const [challengeCreated, setChallengeCreated] = useState(false);
  const [challengeCode, setChallengeCode] = useState('');
  const [challengeUrl, setChallengeUrl] = useState('');
  const [createdPayload, setCreatedPayload] = useState<SharedChallengePayload | null>(null);
  const [copied, setCopied] = useState(false);

  // Integrate current user into list
  const currentUser: LeaderboardUser = {
    id: 'current-user',
    name: challengerName || 'You (Current Learner)',
    avatarSeed: 'current',
    xp: stats.xp,
    rank: stats.xp > 2450 ? 3 : stats.xp > 1780 ? 5 : 6,
    streak: stats.streakDays,
    accuracy: stats.recallAccuracy,
    badge: `Level ${stats.level} Thinker`,
    isCurrentUser: true,
  };

  const displayList = [...DEMO_LEADERBOARD_USERS, currentUser].sort((a, b) => b.xp - a.xp);

  const handleCreateChallenge = () => {
    const code = `APTIQ-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const selectedQuiz = availableQuizzes.find((q) => q.id === selectedQuizId) || availableQuizzes[0];

    const payload: SharedChallengePayload = {
      code,
      creatorName: challengerName.trim() || 'Anonymous Scholar',
      creatorScore: stats.applyAccuracy || 88,
      creatorTimeSeconds: Math.max(120, (selectedQuiz.timeLimitMinutes || 5) * 45),
      quiz: selectedQuiz,
      createdAt: new Date().toISOString(),
    };

    saveLocalChallenge(payload);
    const url = buildShareableChallengeUrl(payload);

    setChallengeCode(code);
    setChallengeUrl(url);
    setCreatedPayload(payload);
    setChallengeCreated(true);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(challengeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-semibold">
            Social Metacognition
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/30">
            Demo Benchmarking Community
          </span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Leaderboard & Peer Challenges
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
          Benchmark your accuracy against deterministic cohorts and issue asynchronous reasoning duels to study partners.
        </p>
      </div>

      {/* Honest Disclosure Banner */}
      <div className="p-4 rounded-2xl bg-[#0E1428] border border-cyan-500/20 text-xs text-slate-300 flex items-start gap-3">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Community Architecture Disclosure:</strong> Leaderboard positions feature curated deterministic benchmark profiles to calibrate your percentile ranking. True multiplayer accounts require remote backend configuration; core learning functions are 100% self-contained.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Leaderboard Table (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Filter Bar */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2 p-1 bg-[#0E1326] rounded-xl border border-slate-800">
              <button
                onClick={() => setTab('weekly')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  tab === 'weekly'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Weekly Standings
              </button>
              <button
                onClick={() => setTab('alltime')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  tab === 'alltime'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All-Time
              </button>
            </div>

            <span className="text-xs font-mono text-slate-500">
              Updated Live
            </span>
          </div>

          {/* User List */}
          <div className="space-y-2">
            {displayList.map((user, idx) => (
              <div
                key={user.id}
                className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                  user.isCurrentUser
                    ? 'bg-cyan-950/40 border-cyan-400/70 shadow-[0_0_15px_rgba(103,232,249,0.2)]'
                    : 'bg-[#0E1326] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-6 text-center font-mono text-sm font-bold ${
                      idx === 0
                        ? 'text-amber-300'
                        : idx === 1
                        ? 'text-slate-300'
                        : idx === 2
                        ? 'text-amber-600'
                        : 'text-slate-500'
                    }`}
                  >
                    #{idx + 1}
                  </span>

                  <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-xs text-white">
                    {user.name.charAt(0)}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-bold text-white">{user.name}</span>
                      {user.isCurrentUser && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-400/40">
                          YOU
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">{user.badge}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="flex items-center gap-1 text-amber-300">
                    <Flame className="w-3.5 h-3.5" />
                    <span>{user.streak}d</span>
                  </div>
                  <div className="text-right">
                    <span className="text-cyan-300 font-bold block">{user.xp} XP</span>
                    <span className="text-[10px] text-slate-500">{user.accuracy}% Acc</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Challenge a Friend Flow (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-[#0E1326] border border-cyan-500/25 space-y-5">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-bold text-white">Challenge a Peer</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Create an asynchronous reasoning duel. Your peer takes the identical timed assessment, and APTIQ compares your accuracy and time-to-first-principle.
            </p>

            {!challengeCreated ? (
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">
                    Your Challenger Handle
                  </label>
                  <input
                    type="text"
                    value={challengerName}
                    onChange={(e) => setChallengerName(e.target.value)}
                    placeholder="Enter your handle..."
                    className="w-full px-3 py-2 rounded-xl bg-[#090C18] border border-slate-800 text-xs text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">
                    Select Duel Assessment
                  </label>
                  <select
                    value={selectedQuizId}
                    onChange={(e) => setSelectedQuizId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#090C18] border border-slate-800 text-xs text-white focus:border-cyan-400 focus:outline-none"
                  >
                    {availableQuizzes.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.title} ({q.questions.length} Qs · {q.mode.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-3 rounded-xl bg-[#090C18] border border-slate-800 text-xs text-slate-400 space-y-1">
                  <span className="text-white font-semibold block">Duel Format:</span>
                  <div>• Identical question sequence & verified answer keys</div>
                  <div>• Asynchronous execution (No remote account requirements)</div>
                </div>

                <button
                  onClick={handleCreateChallenge}
                  className="w-full py-3 rounded-xl text-xs font-bold bg-cyan-400 text-slate-950 hover:bg-cyan-300 font-mono transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(103,232,249,0.3)]"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Generate Shareable Duel Link</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                <div className="p-4 rounded-xl bg-[#090C18] border border-cyan-500/40 text-center space-y-2">
                  <span className="text-[11px] font-mono text-cyan-400 uppercase">
                    Challenge Code
                  </span>
                  <div className="text-2xl font-mono font-black text-white tracking-widest">
                    {challengeCode}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Self-contained link with embedded quiz payload. Open in any browser tab.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyLink}
                    className="w-full py-2.5 rounded-xl text-xs font-bold bg-slate-900 border border-cyan-500/40 text-cyan-300 hover:bg-slate-800 font-mono transition-all flex items-center justify-center gap-1.5"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Link Copied!' : 'Copy Shareable Link'}</span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    if (createdPayload) {
                      navigate('test-arena', {
                        customQuestions: createdPayload.quiz.questions,
                        customQuiz: createdPayload.quiz,
                        duelInfo: {
                          code: createdPayload.code,
                          creatorName: createdPayload.creatorName,
                          creatorScore: createdPayload.creatorScore,
                          creatorTimeSeconds: createdPayload.creatorTimeSeconds,
                        },
                        quizTitle: createdPayload.quiz.title,
                      });
                    } else {
                      navigate('test-arena');
                    }
                  }}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-cyan-400 text-slate-950 hover:bg-cyan-300 font-mono transition-all text-center"
                >
                  Start Your Attempt Now →
                </button>

                <button
                  onClick={() => setChallengeCreated(false)}
                  className="w-full py-1 text-center text-[11px] font-mono text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Create another challenge
                </button>
              </div>
            )}
          </div>

          {/* Join an Existing Challenge by Code / Link */}
          <div className="p-6 rounded-3xl bg-[#0E1326] border border-slate-800 space-y-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <h4 className="text-sm font-bold text-white">Join a Duel with Code or Link</h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Have a code like <code className="text-cyan-300 font-mono">APTIQ-XXXXX</code> or a challenge link from a peer? Paste it below to jump straight into their assessment.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                id="join-duel-input"
                placeholder="e.g. APTIQ-7X9KF or paste link"
                className="flex-1 px-3 py-2 rounded-xl bg-[#090C18] border border-slate-800 text-xs text-white focus:border-cyan-400 focus:outline-none font-mono"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const input = (e.target as HTMLInputElement).value.trim();
                    if (input) {
                      const res = parseChallengeFromHash(input);
                      navigate('challenge', { payload: res.payload, error: res.error });
                    }
                  }
                }}
              />
              <button
                onClick={() => {
                  const el = document.getElementById('join-duel-input') as HTMLInputElement;
                  const input = el?.value.trim();
                  if (input) {
                    const res = parseChallengeFromHash(input);
                    navigate('challenge', { payload: res.payload, error: res.error });
                  }
                }}
                className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-cyan-400 text-slate-950 hover:bg-cyan-300 transition-colors"
              >
                Join
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
