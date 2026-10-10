import React, { useState } from 'react';
import { Check, X, ArrowRight, ShieldCheck, Zap, HelpCircle } from 'lucide-react';

export const RecallVsApplySimulator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'compare' | 'scenario'>('compare');
  const [selectedRecallAnswer, setSelectedRecallAnswer] = useState<number | null>(null);
  const [selectedApplyAnswer, setSelectedApplyAnswer] = useState<number | null>(null);

  return (
    <section className="w-full my-16 max-w-5xl mx-auto px-4">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-mono mb-3">
          <Zap className="w-3.5 h-3.5 text-cyan-400" />
          <span>Interactive Architectural Demonstration</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-3">
          Recall Mode <span className="text-slate-500">vs</span> Apply Mode
        </h2>
        <p className="text-slate-400 text-sm md:text-base leading-relaxed">
          Standard quizzes check whether you remembered a term. APTIQ verifies whether you can transfer that principle to an unfamiliar, messy real-world anomaly.
        </p>

        {/* Tab Switcher */}
        <div className="flex items-center justify-center gap-2 mt-6 p-1 bg-[#0E1428] rounded-xl border border-slate-800 w-fit mx-auto">
          <button
            onClick={() => setActiveTab('compare')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'compare'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Live Question Comparison
          </button>
          <button
            onClick={() => setActiveTab('scenario')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'scenario'
                ? 'bg-violet-500/20 text-violet-300 border border-violet-400/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Memorizer vs Thinker Case Study
          </button>
        </div>
      </div>

      {activeTab === 'compare' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Recall Mode */}
          <div className="rounded-2xl p-6 bg-[#0E1428]/80 border border-cyan-500/20 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                <div>
                  <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-bold">
                    Recall Mode
                  </span>
                  <h3 className="text-base font-bold text-white mt-0.5">Direct Definition & Fact Retrieval</h3>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                  Target: Memory
                </span>
              </div>

              <p className="text-xs font-medium text-slate-300 mb-4 bg-[#090C18] p-3 rounded-xl border border-slate-800">
                <strong>Question:</strong> What is Amdahl’s Law in computer science?
              </p>

              <div className="space-y-2 mb-4">
                {[
                  { id: 0, text: 'A formula predicting the maximum theoretical speedup of a system when only part of the code is parallelized.' },
                  { id: 1, text: 'A rule stating that CPU transistor count doubles every 18 months.' },
                  { id: 2, text: 'An algorithmic complexity theorem defining non-deterministic polynomial time.' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedRecallAnswer(opt.id)}
                    className={`w-full text-left p-3 rounded-xl text-xs transition-all border ${
                      selectedRecallAnswer === opt.id
                        ? opt.id === 0
                          ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                          : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                        : 'bg-[#0A0E1D] border-slate-800/80 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span>{opt.text}</span>
                      {selectedRecallAnswer === opt.id && (
                        <span>
                          {opt.id === 0 ? (
                            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <X className="w-4 h-4 text-rose-400 shrink-0" />
                          )}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {selectedRecallAnswer !== null && (
              <div className="mt-2 p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
                <span className="font-semibold text-cyan-300">Assessment Insight:</span>{' '}
                <span className="text-slate-300">
                  {selectedRecallAnswer === 0
                    ? 'Correct definition retrieved. You have stored the formula definition in working memory.'
                    : 'Incorrect. You confused Amdahl’s Law with Moore’s Law or Cook’s Theorem.'}
                </span>
              </div>
            )}
          </div>

          {/* Card 2: Apply Mode */}
          <div className="rounded-2xl p-6 bg-[#130F26]/80 border border-violet-500/25 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                <div>
                  <span className="text-xs font-mono uppercase tracking-widest text-violet-400 font-bold">
                    Apply Mode
                  </span>
                  <h3 className="text-base font-bold text-white mt-0.5">First-Principles Real-World Transfer</h3>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-500/30">
                  Target: Reasoning
                </span>
              </div>

              <p className="text-xs font-medium text-slate-300 mb-4 bg-[#090C18] p-3 rounded-xl border border-slate-800">
                <strong>Unfamiliar Scenario:</strong> A payment gateway spends 70% of total latency writing synchronously to a single ACID disk log. The CEO wants to purchase a 64-core server to make transactions 10x faster. What will happen?
              </p>

              <div className="space-y-2 mb-4">
                {[
                  { id: 0, text: 'Throughput increases by 10x because 64 cores distribute the threads evenly.' },
                  { id: 1, text: 'Maximum possible speedup is capped at ~1.42x because the serial disk log bottleneck remains unaffected by core count (Amdahl’s constraint).' },
                  { id: 2, text: 'The server crashes due to CPU cache thrashing immediately.' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedApplyAnswer(opt.id)}
                    className={`w-full text-left p-3 rounded-xl text-xs transition-all border ${
                      selectedApplyAnswer === opt.id
                        ? opt.id === 1
                          ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                          : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                        : 'bg-[#0A0E1D] border-slate-800/80 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span>{opt.text}</span>
                      {selectedApplyAnswer === opt.id && (
                        <span>
                          {opt.id === 1 ? (
                            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <X className="w-4 h-4 text-rose-400 shrink-0" />
                          )}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {selectedApplyAnswer !== null && (
              <div className="mt-2 p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
                <span className="font-semibold text-violet-300">Reasoning Insight:</span>{' '}
                <span className="text-slate-300">
                  {selectedApplyAnswer === 1
                    ? 'Excellent structural deduction! Speedup = 1 / ((1 - 0.7) + (0.7 / 64)) ≈ 1.41x. Extra cores cannot accelerate serial bottleneck latency.'
                    : 'Common failure mode: Intuitive linear scaling assumption. Extra compute does not accelerate serialized bottlenecks.'}
                </span>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Scenario Comparison: The Exam Memorizer vs Concept Architect */
        <div className="rounded-3xl p-6 md:p-8 bg-[#0D1224] border border-cyan-500/20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-violet-400 font-semibold">
                Case Study in Transfer Learning
              </span>
              <h3 className="text-2xl font-bold text-white mt-1 mb-4">
                The Memorizer vs The Concept Architect
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed mb-4">
                Consider two learners preparing for an advanced systems engineering evaluation:
              </p>
              <ul className="space-y-3 text-xs text-slate-400">
                <li className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded bg-rose-950 border border-rose-500/40 flex items-center justify-center shrink-0 mt-0.5 text-rose-400 font-bold">
                    A
                  </div>
                  <span>
                    <strong className="text-white">Student A (The Memorizer):</strong> Memorises 400 past exam solutions word-for-word. Achieves 98% on practice tests containing identical questions.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded bg-cyan-950 border border-cyan-500/40 flex items-center justify-center shrink-0 mt-0.5 text-cyan-400 font-bold">
                    B
                  </div>
                  <span>
                    <strong className="text-white">Student B (The Architect):</strong> Learns the boundary conditions, causal invariants, and failure thresholds. Achieves 84% on past papers.
                  </span>
                </li>
              </ul>

              <div className="mt-6 p-4 rounded-2xl bg-[#090C18] border border-cyan-400/30">
                <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider mb-1">
                  What happens when the real exam introduces novel variables?
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Student A suffers <strong>negative transfer</strong>: they latch onto surface keywords and apply previously memorized answers that no longer match the altered conditions. Student B synthesizes the new variables and solves the problem from first principles.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-rose-300">Student A on Novel Problems</span>
                  <span className="text-xs font-mono text-rose-400">Fragile (32% Accuracy)</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full" style={{ width: '32%' }} />
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  High recall, low transfer. Fails when prompt variables invert.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-cyan-300">Student B on Novel Problems</span>
                  <span className="text-xs font-mono text-cyan-400">Robust (91% Accuracy)</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-cyan-400 h-full rounded-full" style={{ width: '91%' }} />
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  Understands underlying mechanics. Adaptable across domains.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-r from-violet-950/40 to-cyan-950/40 border border-violet-500/30 text-xs text-slate-300">
                <strong className="text-violet-300 font-semibold block mb-1">APTIQ’s Solution</strong>
                Every quiz can be toggled into <strong>Apply Mode</strong>, training your brain to decouple deep causal structure from superficial phrasing.
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
