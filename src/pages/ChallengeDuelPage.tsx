import React, { useState } from 'react';
import {
  Zap,
  Award,
  Clock,
  Brain,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Share2,
  Copy,
  Check,
  Search,
  RotateCcw,
} from 'lucide-react';
import {
  SharedChallengePayload,
  buildShareableChallengeUrl,
  parseChallengeFromHash,
  getLocalChallenges,
} from '../services/challengeService';

interface ChallengeDuelPageProps {
  payload?: SharedChallengePayload;
  error?: string;
  isLobby?: boolean;
  navigate: (route: string, state?: any) => void;
}

export const ChallengeDuelPage: React.FC<ChallengeDuelPageProps> = ({
  payload: initialPayload,
  error: initialError,
  isLobby,
  navigate,
}) => {
  const [activePayload, setActivePayload] = useState<SharedChallengePayload | undefined>(initialPayload);
  const [activeError, setActiveError] = useState<string | undefined>(initialError);
  const [manualInput, setManualInput] = useState('');
  const [showBrief, setShowBrief] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync if props update
  React.useEffect(() => {
    setActivePayload(initialPayload);
    setActiveError(initialError);
  }, [initialPayload, initialError]);

  const handleCopyLink = () => {
    if (activePayload) {
      const fullUrl = buildShareableChallengeUrl(activePayload);
      navigator.clipboard.writeText(fullUrl);
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleManualResolve = () => {
    const trimmed = manualInput.trim();
    if (!trimmed) return;
    const parsed = parseChallengeFromHash(trimmed);
    if (parsed.error) {
      setActiveError(parsed.error);
      setActivePayload(undefined);
    } else if (parsed.payload) {
      setActivePayload(parsed.payload);
      setActiveError(undefined);
      // update URL hash cleanly
      window.location.hash = `#challenge?code=${encodeURIComponent(parsed.payload.code)}`;
    }
  };

  const recentChallenges = getLocalChallenges();

  // If there's an error or no payload is loaded yet
  if (activeError || !activePayload) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-16 space-y-6">
        <div className="p-8 rounded-3xl bg-[#0E1326] border border-cyan-500/30 space-y-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-400/40 flex items-center justify-center text-cyan-400 mx-auto">
            {activeError ? <AlertTriangle className="w-6 h-6 text-amber-400" /> : <Zap className="w-6 h-6" />}
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">
              {activeError ? 'Challenge Link Issue' : 'Join a Peer Challenge'}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
              {activeError ||
                'Enter a challenge code (e.g. APTIQ-7X9KF) or paste a shared duel URL to load the assessment.'}
            </p>
          </div>

          {/* Manual Input Form */}
          <div className="max-w-md mx-auto space-y-3 pt-2 text-left">
            <label className="block text-xs font-mono text-slate-400">
              Enter Challenge Code or Paste Link:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleManualResolve()}
                placeholder="e.g. APTIQ-7X9KF or paste https://..."
                className="flex-1 px-3 py-2.5 rounded-xl bg-[#090C18] border border-slate-800 text-xs text-white focus:border-cyan-400 focus:outline-none font-mono"
              />
              <button
                onClick={handleManualResolve}
                className="px-4 py-2.5 rounded-xl text-xs font-mono font-bold bg-cyan-400 text-slate-950 hover:bg-cyan-300 transition-colors"
              >
                Load Duel
              </button>
            </div>
          </div>

          {/* Recent Challenges if available */}
          {recentChallenges.length > 0 && (
            <div className="pt-4 border-t border-slate-800/80 text-left space-y-2 max-w-md mx-auto">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Recent Saved Duels:</span>
              <div className="space-y-1.5">
                {recentChallenges.slice(0, 3).map((c) => (
                  <button
                    key={c.code}
                    onClick={() => {
                      setActivePayload(c);
                      setActiveError(undefined);
                      window.location.hash = `#challenge?code=${encodeURIComponent(c.code)}`;
                    }}
                    className="w-full p-2.5 rounded-xl bg-[#090C18] border border-slate-800 hover:border-cyan-500/40 text-left flex items-center justify-between transition-all"
                  >
                    <div>
                      <span className="text-xs font-bold text-white block">{c.quiz.title}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {c.code} · by {c.creatorName}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-cyan-300 font-bold">Load →</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate('leaderboard')}
              className="px-5 py-2.5 rounded-xl text-xs font-mono font-bold bg-slate-900 border border-slate-700 text-slate-200 hover:text-white transition-colors"
            >
              Browse Leaderboard & Duels
            </button>
            <button
              onClick={() => navigate('dashboard')}
              className="px-5 py-2.5 rounded-xl text-xs font-mono text-slate-400 hover:text-white"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { quiz, creatorName, creatorScore, creatorTimeSeconds, code } = activePayload;
  const timeFormatted = creatorTimeSeconds
    ? `${Math.floor(creatorTimeSeconds / 60)}m ${creatorTimeSeconds % 60}s`
    : '4m 05s';

  const handleAcceptDuel = () => {
    navigate('test-arena', {
      customQuestions: quiz.questions,
      customQuiz: quiz,
      duelInfo: {
        code,
        creatorName,
        creatorScore: creatorScore ?? 85,
        creatorTimeSeconds: creatorTimeSeconds ?? 245,
      },
      quizTitle: quiz.title,
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-12 space-y-8">
      {/* Top Banner */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-400/40 text-cyan-300 text-xs font-mono">
          <Zap className="w-3.5 h-3.5 text-cyan-400" />
          <span>Asynchronous Reasoning Duel</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          You've Been Challenged
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          A peer has issued a conceptual reasoning challenge. Complete the identical timed assessment and compare your first-principles accuracy.
        </p>
      </div>

      {/* Main Duel Invitation Card */}
      <div className="p-8 rounded-3xl bg-[#0E1326] border border-cyan-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(103,232,249,0.15)] space-y-6">
        {/* Challenger Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-950 to-violet-950 border border-cyan-400/40 flex items-center justify-center text-cyan-300 font-extrabold text-lg">
              {creatorName.charAt(0)}
            </div>
            <div>
              <span className="text-[11px] font-mono text-cyan-400 uppercase">Challenger</span>
              <h2 className="text-lg font-bold text-white">{creatorName}</h2>
              <span className="text-xs text-slate-400 font-mono">Duel Code: {code}</span>
            </div>
          </div>

          {/* Challenger Benchmark Stat Box */}
          <div className="p-3.5 rounded-2xl bg-[#090C18] border border-slate-800 flex items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-500 block">Target Benchmark</span>
              <span className="text-emerald-400 font-bold text-sm">
                {creatorScore !== undefined ? `${creatorScore}% Accuracy` : 'Benchmark Pending'}
              </span>
            </div>
            <div className="border-l border-slate-800 pl-4">
              <span className="text-slate-500 block">Target Time</span>
              <span className="text-cyan-300 font-bold text-sm">{timeFormatted}</span>
            </div>
          </div>
        </div>

        {/* Quiz Parameters */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-[#090C18] border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                {quiz.mode.toUpperCase()} MODE
              </span>
              <span className="text-xs font-mono text-slate-400">
                {quiz.questions.length} Questions · {quiz.timeLimitMinutes > 0 ? `${quiz.timeLimitMinutes}m Limit` : 'Untimed'}
              </span>
            </div>
            <h3 className="text-base font-bold text-white">{quiz.title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{quiz.description}</p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs font-mono text-center">
            <div className="p-3 rounded-xl bg-[#090C18] border border-slate-800">
              <span className="text-slate-500 block mb-0.5">Difficulty</span>
              <span className="text-amber-300 font-bold capitalize">{quiz.difficulty}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#090C18] border border-slate-800">
              <span className="text-slate-500 block mb-0.5">Scoring</span>
              <span className="text-white font-bold">Standard Rubric</span>
            </div>
            <div className="p-3 rounded-xl bg-[#090C18] border border-slate-800">
              <span className="text-slate-500 block mb-0.5">Source Type</span>
              <span className="text-cyan-300 font-bold capitalize">{quiz.sourceType}</span>
            </div>
          </div>
        </div>

        {/* Collapsible Curriculum Brief */}
        <div className="pt-2">
          <button
            onClick={() => setShowBrief(!showBrief)}
            className="text-xs font-mono text-cyan-300 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{showBrief ? 'Hide Curriculum Topics' : 'Preview Curriculum Topics'}</span>
          </button>

          {showBrief && (
            <div className="mt-3 p-4 rounded-xl bg-[#080B16] border border-slate-800 text-xs text-slate-300 space-y-2">
              <span className="text-white font-semibold block">Topics covered in this assessment:</span>
              <ul className="space-y-1 list-disc list-inside text-slate-400">
                {Array.from(new Set(quiz.questions.map((q) => q.topic))).map((t, idx) => (
                  <li key={idx}>{t}</li>
                ))}
              </ul>
              <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-800">
                Questions are held confidential until you begin your attempt in the Test Arena.
              </p>
            </div>
          )}
        </div>

        {/* Primary Action Button */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="px-3.5 py-2 rounded-xl text-xs font-mono text-slate-300 bg-[#090C18] border border-slate-800 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Full Link Copied' : 'Share Link'}</span>
            </button>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => navigate('dashboard')}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-mono text-slate-400 hover:text-white"
            >
              Decline
            </button>
            <button
              onClick={handleAcceptDuel}
              className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs sm:text-sm font-bold bg-cyan-400 text-slate-950 hover:bg-cyan-300 font-mono transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(103,232,249,0.35)]"
            >
              <Zap className="w-4 h-4" />
              <span>Accept Duel & Start Test</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Honest Architecture Disclosure */}
        <p className="text-[11px] text-slate-500 font-mono text-center pt-2">
          Note: Duel challenges execute deterministically in your browser. Benchmarks compare first-principles accuracy and time-to-solution without remote account credentials.
        </p>
      </div>
    </div>
  );
};
