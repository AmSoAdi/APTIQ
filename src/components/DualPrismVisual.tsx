import React, { useState } from 'react';
import { Sparkles, Brain, CheckCircle2, ArrowRight } from 'lucide-react';

interface DualPrismVisualProps {
  onExploreThinkArena?: () => void;
  onExploreQuizStudio?: () => void;
}

export const DualPrismVisual: React.FC<DualPrismVisualProps> = ({
  onExploreThinkArena,
  onExploreQuizStudio,
}) => {
  const [activePillar, setActivePillar] = useState<'both' | 'pillar1' | 'pillar2'>('both');

  return (
    <div className="relative w-full max-w-2xl mx-auto rounded-3xl p-6 md:p-8 bg-gradient-to-b from-[#0E1428]/90 via-[#0B0F20]/90 to-[#070A15]/95 border border-cyan-500/20 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_40px_-10px_rgba(103,232,249,0.15)] overflow-hidden">
      {/* Background ambient light orbs */}
      <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-violet-600/15 blur-3xl pointer-events-none" />

      {/* Perspective Geometric Canvas Overlay */}
      <div className="relative flex flex-col items-center justify-center">
        {/* Abstract Dual-Prism Convergence Graphic */}
        <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
          {/* Outer Pulsing Orbital Rings */}
          <div className="absolute inset-0 rounded-full border border-cyan-400/20 animate-[spin_40s_linear_infinite]" />
          <div className="absolute inset-4 rounded-full border border-dashed border-violet-400/25 animate-[spin_25s_linear_infinite_reverse]" />
          <div className="absolute inset-10 rounded-full border border-cyan-300/15" />

          {/* Isometric Converging Perspective Polyhedron (SVG) */}
          <svg
            className="w-48 h-48 md:w-60 md:h-60 relative z-10 transition-transform duration-700 hover:rotate-3"
            viewBox="0 0 200 200"
            fill="none"
          >
            <defs>
              <linearGradient id="prismGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#67E8F9" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#0891B2" stopOpacity="0.3" />
              </linearGradient>
              <linearGradient id="prismGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#C084FC" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#6D28D9" stopOpacity="0.3" />
              </linearGradient>
              <linearGradient id="coreBeam" x1="50%" y1="0%" x2="50%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#67E8F9" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#A78BFA" stopOpacity="0.1" />
              </linearGradient>
            </defs>

            {/* Pillar 1: Knowledge & Assessment Facet (Cyan) */}
            <path
              d="M100 25 L40 75 L100 125 L100 25 Z"
              fill="url(#prismGrad1)"
              className={`transition-opacity duration-300 ${
                activePillar === 'pillar2' ? 'opacity-30' : 'opacity-90'
              }`}
            />
            {/* Pillar 2: Critical Reasoning Facet (Violet) */}
            <path
              d="M100 25 L160 75 L100 125 L100 25 Z"
              fill="url(#prismGrad2)"
              className={`transition-opacity duration-300 ${
                activePillar === 'pillar1' ? 'opacity-30' : 'opacity-90'
              }`}
            />
            {/* Bottom Reflective Planes */}
            <path
              d="M40 75 L100 125 L100 175 L40 125 Z"
              fill="#0E172E"
              stroke="#67E8F9"
              strokeWidth="0.75"
              strokeOpacity="0.4"
            />
            <path
              d="M160 75 L100 125 L100 175 L160 125 Z"
              fill="#141029"
              stroke="#C084FC"
              strokeWidth="0.75"
              strokeOpacity="0.4"
            />

            {/* Convergence Core Node */}
            <circle cx="100" cy="125" r="5" fill="#FFFFFF" className="animate-pulse" />
            <circle cx="100" cy="125" r="14" stroke="#67E8F9" strokeWidth="1" strokeDasharray="2 2" />

            {/* Perspective Ray Lines */}
            <line x1="100" y1="25" x2="100" y2="125" stroke="url(#coreBeam)" strokeWidth="2" />
            <line x1="40" y1="75" x2="160" y2="75" stroke="#FFFFFF" strokeWidth="0.75" strokeOpacity="0.3" strokeDasharray="3 3" />
          </svg>

          {/* Floating Data Labels */}
          <div
            onClick={() => setActivePillar('pillar1')}
            className={`absolute -left-2 top-14 px-3 py-1.5 rounded-xl border text-xs font-mono cursor-pointer transition-all ${
              activePillar === 'pillar1'
                ? 'bg-cyan-950/90 border-cyan-400 text-cyan-200 scale-105 shadow-[0_0_15px_rgba(103,232,249,0.3)]'
                : 'bg-[#0E1428]/80 border-cyan-500/30 text-cyan-400/90 hover:border-cyan-400/60'
            }`}
          >
            <div className="font-semibold tracking-wide">Pillar 1: Knowledge</div>
            <div className="text-[10px] text-slate-400">Recall & Assessment</div>
          </div>

          <div
            onClick={() => setActivePillar('pillar2')}
            className={`absolute -right-2 top-14 px-3 py-1.5 rounded-xl border text-xs font-mono cursor-pointer transition-all ${
              activePillar === 'pillar2'
                ? 'bg-violet-950/90 border-violet-400 text-violet-200 scale-105 shadow-[0_0_15px_rgba(167,139,250,0.3)]'
                : 'bg-[#150F28]/80 border-violet-500/30 text-violet-400/90 hover:border-violet-400/60'
            }`}
          >
            <div className="font-semibold tracking-wide">Pillar 2: Reasoning</div>
            <div className="text-[10px] text-slate-400">Critical Thinking</div>
          </div>
        </div>

        {/* Dual Pillar Interactive Synthesis Cards */}
        <div className="w-full mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            onClick={() => setActivePillar('pillar1')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              activePillar === 'pillar1' || activePillar === 'both'
                ? 'bg-[#0E172E]/90 border-cyan-400/40 shadow-sm'
                : 'bg-[#0A0E1D]/50 border-slate-800 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                Learn & Assess
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Pillar 01</span>
            </div>
            <h4 className="text-sm font-bold text-white mb-1">Factual & Principle Mastery</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload PDF or paste topics. Generate grounded quizzes, simulate timed exams, and flag misconceptions.
            </p>
          </div>

          <div
            onClick={() => setActivePillar('pillar2')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              activePillar === 'pillar2' || activePillar === 'both'
                ? 'bg-[#140F2B]/90 border-violet-400/40 shadow-sm'
                : 'bg-[#0A0E1D]/50 border-slate-800 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-violet-300 uppercase tracking-wider">
                Think & Reason
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Pillar 02</span>
            </div>
            <h4 className="text-sm font-bold text-white mb-1">Unfamiliar Scenario Solving</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dissect evidence, spot unexamined assumptions, resolve trade-offs, and earn rubric-graded feedback.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
