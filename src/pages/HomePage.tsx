import React, { useState } from 'react';
import {
  ArrowRight,
  Brain,
  Cpu,
  Zap,
  Terminal,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Clock,
  Sparkles,
  Flame,
  Award,
} from 'lucide-react';
import { DualPrismVisual } from '../components/DualPrismVisual';
import { RecallVsApplySimulator } from '../components/RecallVsApplySimulator';
import { addXP, getStoredUserStats } from '../services/storage';

interface HomePageProps {
  navigate: (route: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ navigate }) => {
  const [dailyCompleted, setDailyCompleted] = useState(false);
  const [dailySelectedAnswer, setDailySelectedAnswer] = useState<number | null>(null);

  const handleDailyAnswer = (idx: number) => {
    setDailySelectedAnswer(idx);
    if (idx === 1 && !dailyCompleted) {
      setDailyCompleted(true);
      addXP(50);
    }
  };

  return (
    <div className="w-full min-h-screen">
      {/* 1. CINEMATIC HERO SECTION */}
      <section className="relative pt-12 pb-20 px-4 max-w-7xl mx-auto overflow-hidden">
        {/* Glow light accents */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-cyan-500/10 via-violet-500/10 to-transparent blur-[120px] pointer-events-none -z-10" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Hero Copy (7 cols) */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Tagline Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0E1428] border border-cyan-400/30 text-xs font-mono text-cyan-300">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Intelligence in Motion · APTIQ Platform</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
              Don't just know the answer.{' '}
              <span className="bg-gradient-to-r from-cyan-300 via-sky-200 to-violet-400 bg-clip-text text-transparent">
                Understand why.
              </span>
            </h1>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Most platforms reward memory. APTIQ trains critical thinking. Learn smarter, reason deeper, and solve unfamiliar problems using structured feedback and grounded AI.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                onClick={() => navigate('quiz-studio')}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-cyan-400 to-sky-500 text-slate-950 hover:from-cyan-300 hover:to-sky-400 shadow-[0_0_25px_rgba(103,232,249,0.35)] transition-all flex items-center justify-center gap-2 font-mono group"
              >
                <span>Start Learning</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                onClick={() => navigate('think-arena')}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-semibold text-sm bg-[#0E1428] text-violet-300 border border-violet-500/40 hover:bg-violet-950/40 hover:border-violet-400 transition-all flex items-center justify-center gap-2 font-mono"
              >
                <Brain className="w-4 h-4 text-violet-400" />
                <span>Enter Think Arena</span>
              </button>
            </div>

            {/* Highlights row */}
            <div className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-800/80 max-w-lg mx-auto lg:mx-0 text-left">
              <div>
                <div className="text-lg font-bold text-white font-mono">Pillar 1</div>
                <div className="text-xs text-slate-400">Recall & Test Arena</div>
              </div>
              <div>
                <div className="text-lg font-bold text-white font-mono">Pillar 2</div>
                <div className="text-xs text-slate-400">Critical Reasoning</div>
              </div>
              <div>
                <div className="text-lg font-bold text-cyan-300 font-mono">Zero Slop</div>
                <div className="text-xs text-slate-400">Grounded Citations</div>
              </div>
            </div>
          </div>

          {/* Hero Visual Composition (5 cols) */}
          <div className="lg:col-span-5 flex justify-center">
            <DualPrismVisual
              onExploreQuizStudio={() => navigate('quiz-studio')}
              onExploreThinkArena={() => navigate('think-arena')}
            />
          </div>
        </div>
      </section>

      {/* 2. RECALL MODE VS APPLY MODE INTERACTIVE SIMULATOR */}
      <RecallVsApplySimulator />

      {/* 3. FOUR CORE ENGINE SHOWCASES */}
      <section className="py-16 px-4 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-bold">
            Full-Stack Learning Architecture
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mt-1 mb-3">
            Designed for Intellectual Depth
          </h2>
          <p className="text-slate-400 text-sm">
            Four specialized workspaces working in concert to advance your knowledge, diagnosis, and mental models.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: AI Quiz Studio */}
          <div
            onClick={() => navigate('quiz-studio')}
            className="p-8 rounded-3xl bg-gradient-to-b from-[#0E1428] to-[#0A0D1B] border border-cyan-500/20 hover:border-cyan-400/50 transition-all cursor-pointer group shadow-lg"
          >
            <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-300 mb-6 group-hover:scale-105 transition-transform">
              <Cpu className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
              <span>01. Quiz Studio</span>
              <span>·</span>
              <span>Document Ingestion</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-200 transition-colors">
              PDF & Source-Grounded Generation
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
              Upload course PDFs, research papers, or paste custom topics. APTIQ extracts document text and uses Gemini to synthesize structured questions strictly grounded in your material.
            </p>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-300 group-hover:translate-x-1 transition-transform">
              <span>Open Quiz Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 2: Test Arena */}
          <div
            onClick={() => navigate('test-arena')}
            className="p-8 rounded-3xl bg-gradient-to-b from-[#0E1428] to-[#0A0D1B] border border-cyan-500/20 hover:border-cyan-400/50 transition-all cursor-pointer group shadow-lg"
          >
            <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-300 mb-6 group-hover:scale-105 transition-transform">
              <Zap className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
              <span>02. Test Arena</span>
              <span>·</span>
              <span>Exam Simulation</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-200 transition-colors">
              High-Stakes Countdown Testing
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
              Distraction-free exam simulation with real synchronized countdown timers, question mark-for-review toggles, instantaneous scoring, and detailed misconception breakdowns.
            </p>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-300 group-hover:translate-x-1 transition-transform">
              <span>Enter Test Arena</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 3: Think Arena */}
          <div
            onClick={() => navigate('think-arena')}
            className="p-8 rounded-3xl bg-gradient-to-b from-[#140F2D] to-[#0B091E] border border-violet-500/25 hover:border-violet-400/60 transition-all cursor-pointer group shadow-lg"
          >
            <div className="w-12 h-12 rounded-2xl bg-violet-950/80 border border-violet-500/40 flex items-center justify-center text-violet-300 mb-6 group-hover:scale-105 transition-transform">
              <Brain className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-violet-400 mb-1">
              <span>03. Think Arena</span>
              <span>·</span>
              <span>The Second Pillar</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-violet-200 transition-colors">
              Critical Thinking & 6-Axis Rubric
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
              Navigate messy real-world dilemmas, evaluate confounding evidence, and uncover unstated premises. Submissions are scored on Clarity, Evidence, Assumptions, and Logical Consistency.
            </p>
            <div className="flex items-center gap-2 text-xs font-mono text-violet-300 group-hover:translate-x-1 transition-transform">
              <span>Enter Think Arena</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 4: Prompting Lab */}
          <div
            onClick={() => navigate('prompting-lab')}
            className="p-8 rounded-3xl bg-gradient-to-b from-[#140F2D] to-[#0B091E] border border-violet-500/25 hover:border-violet-400/60 transition-all cursor-pointer group shadow-lg"
          >
            <div className="w-12 h-12 rounded-2xl bg-violet-950/80 border border-violet-500/40 flex items-center justify-center text-violet-300 mb-6 group-hover:scale-105 transition-transform">
              <Terminal className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-violet-400 mb-1">
              <span>04. Prompting Lab</span>
              <span>·</span>
              <span>Cognitive Architecture</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-violet-200 transition-colors">
              Prompt Engineering & Ambiguity Elimination
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
              Learn how to write unambiguous, bounded prompts for AI tools. Identifies vague goals, missing constraints, and produces optimized side-by-side prompt diffs with version tracking.
            </p>
            <div className="flex items-center gap-2 text-xs font-mono text-violet-300 group-hover:translate-x-1 transition-transform">
              <span>Launch Prompting Lab</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </section>

      {/* 4. INTERACTIVE DAILY CHALLENGE WIDGET */}
      <section className="py-12 px-4 max-w-4xl mx-auto">
        <div className="rounded-3xl p-6 sm:p-8 bg-[#0E1326] border border-cyan-500/30 relative overflow-hidden">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40">
                <Flame className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-semibold">
                  Daily Challenge
                </span>
                <h3 className="text-lg font-bold text-white">Spot the Hidden Assumption</h3>
              </div>
            </div>
            <span className="text-xs font-mono text-cyan-300 bg-cyan-950 px-2.5 py-1 rounded-md border border-cyan-500/30">
              +50 XP Reward
            </span>
          </div>

          <p className="text-sm text-slate-300 mb-6 leading-relaxed bg-[#080B16] p-4 rounded-xl border border-slate-800">
            <strong>Claim:</strong> "Sales of warm wool coats increased 300% in December compared to July. Therefore, our newly launched social media ad campaign in December was a triumphant success."
            <br />
            <span className="text-xs text-slate-400 mt-2 block">
              Which unexamined variable fatally compromises this causal claim?
            </span>
          </p>

          <div className="space-y-3 mb-6">
            {[
              { id: 0, text: 'The social media ad campaign was displayed on mobile screens instead of desktops.' },
              { id: 1, text: 'Seasonal temperature variations (winter seasonality naturally spikes heavy coat demand regardless of advertising).' },
              { id: 2, text: 'Wool raw material supplier costs rose by 5% during the quarter.' },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleDailyAnswer(opt.id)}
                className={`w-full text-left p-3.5 rounded-xl text-xs sm:text-sm transition-all border ${
                  dailySelectedAnswer === opt.id
                    ? opt.id === 1
                      ? 'bg-emerald-950/60 border-emerald-400 text-emerald-200'
                      : 'bg-rose-950/60 border-rose-400 text-rose-200'
                    : 'bg-[#0A0E1D] border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{opt.text}</span>
                  {dailySelectedAnswer === opt.id && (
                    <span className="shrink-0 ml-2">
                      {opt.id === 1 ? '✓ Correct (+50 XP)' : '✗ Seasonal Confunder'}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {dailyCompleted && (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-200 flex items-center justify-between">
              <div>
                <strong>Causal Deduction Complete:</strong> You identified the seasonal confounder. Attributing the 300% coat surge to ad spend commits the post hoc fallacy.
              </div>
              <button
                onClick={() => navigate('dashboard')}
                className="ml-4 shrink-0 px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400 transition-colors"
              >
                View Dashboard
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 5. FINAL INVITATION CTA */}
      <section className="py-20 px-4 max-w-4xl mx-auto text-center">
        <div className="p-10 rounded-3xl bg-gradient-to-b from-[#0E1428] to-[#080B17] border border-cyan-500/30 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 max-w-xl mx-auto space-y-4">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">
              Ready to transcend rote memorization?
            </h2>
            <p className="text-slate-400 text-sm">
              Generate your first grounded quiz from lecture notes or tackle an unfamiliar dilemma in the Think Arena now.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button
                onClick={() => navigate('quiz-studio')}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm bg-cyan-400 text-slate-950 hover:bg-cyan-300 shadow-[0_0_20px_rgba(103,232,249,0.4)] transition-all font-mono"
              >
                Create a Quiz Now
              </button>
              <button
                onClick={() => navigate('think-arena')}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm bg-slate-900 text-violet-300 border border-violet-500/40 hover:bg-violet-950/40 transition-all font-mono"
              >
                Open Think Arena
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
