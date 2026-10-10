import React, { useState } from 'react';
import {
  Brain,
  Sparkles,
  Award,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Loader2,
  RotateCcw,
  Scale,
  Search,
  Sliders,
} from 'lucide-react';
import {
  CURATED_THINK_CHALLENGES,
  saveThinkSubmission,
  getThinkSubmissions,
  addXP,
} from '../services/storage';
import { evaluateReasoningWithAI } from '../services/api';
import {
  ThinkArenaChallenge,
  ChallengeCategory,
  RubricScore,
  ThinkArenaSubmission,
} from '../types';

interface ThinkArenaPageProps {
  initialState?: {
    challengeId?: string;
  };
}

const CATEGORIES: { id: ChallengeCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All Challenges' },
  { id: 'unfamiliar_scenarios', label: 'Unfamiliar Scenarios' },
  { id: 'evidence_evaluation', label: 'Evidence Evaluation' },
  { id: 'identifying_assumptions', label: 'Identifying Assumptions' },
  { id: 'cause_and_effect', label: 'Cause & Effect' },
  { id: 'tradeoffs_resources', label: 'Trade-offs & Allocation' },
  { id: 'logic_deduction', label: 'Logic & Deduction' },
];

export const ThinkArenaPage: React.FC<ThinkArenaPageProps> = ({ initialState }) => {
  const challenges = CURATED_THINK_CHALLENGES;
  const submissions = getThinkSubmissions();

  const [activeCategory, setActiveCategory] = useState<ChallengeCategory | 'all'>('all');
  const [selectedChallenge, setSelectedChallenge] = useState<ThinkArenaChallenge>(() => {
    if (initialState?.challengeId) {
      const found = challenges.find((c) => c.id === initialState.challengeId);
      if (found) return found;
    }
    return challenges[0];
  });

  // User input fields
  const [evidenceAnalysis, setEvidenceAnalysis] = useState('');
  const [hiddenAssumptions, setHiddenAssumptions] = useState('');
  const [tradeoffsAndAlternatives, setTradeoffsAndAlternatives] = useState('');
  const [finalDecision, setFinalDecision] = useState('');

  // Evaluation status
  const [evaluating, setEvaluating] = useState(false);
  const [rubricResult, setRubricResult] = useState<RubricScore | null>(null);
  const [demoNotice, setDemoNotice] = useState<string | null>(null);

  const filteredChallenges =
    activeCategory === 'all'
      ? challenges
      : challenges.filter((c) => c.category === activeCategory);

  const handleSelectChallenge = (c: ThinkArenaChallenge) => {
    setSelectedChallenge(c);
    setEvidenceAnalysis('');
    setHiddenAssumptions('');
    setTradeoffsAndAlternatives('');
    setFinalDecision('');
    setRubricResult(null);
  };

  const handleEvaluate = async () => {
    try {
      setEvaluating(true);
      setDemoNotice(null);

      const res = await evaluateReasoningWithAI({
        scenario: selectedChallenge.scenario,
        category: selectedChallenge.categoryLabel,
        userAnalysis: {
          evidenceAnalysis,
          hiddenAssumptions,
          tradeoffsAndAlternatives,
          finalDecision,
        },
      });

      if (res.isDemoMode) {
        setDemoNotice('Evaluated via APTIQ Heuristic Evaluator (Gemini API key not active).');
      }

      setRubricResult(res.rubric);

      // Save submission
      const sub: ThinkArenaSubmission = {
        id: `sub-${Date.now()}`,
        challengeId: selectedChallenge.id,
        challengeTitle: selectedChallenge.title,
        userAnalysis: {
          evidenceAnalysis,
          hiddenAssumptions,
          tradeoffsAndAlternatives,
          finalDecision,
        },
        rubric: res.rubric,
        submittedAt: new Date().toISOString(),
      };
      saveThinkSubmission(sub);
      addXP(selectedChallenge.xpReward);
    } catch (err: any) {
      console.error(err);
    } finally {
      setEvaluating(false);
    }
  };

  // Helper to prefill intelligent sample response for demo exploration
  const handlePrefillInsight = () => {
    setEvidenceAnalysis(
      'The past exam overlap dropped from 78% to 0%. The portable scanner calibration token was acting as an uncalibrated proxy confounder. The 180% pull request surge was accompanied by a 65% drop in code review volume.'
    );
    setHiddenAssumptions(
      'Assuming that historical past paper mastery transfers symmetrically to open-ended synthesis. Assuming that rural emergency clinics possess the same image distribution as controlled urban teaching hospitals.'
    );
    setTradeoffsAndAlternatives(
      'Alternative: Implement a randomized adversarial stress test. Trade-off: High immediate computation vs long-term system stability.'
    );
    setFinalDecision(
      'De-escalate commitment to single-point metrics. Adopt a balanced paired-metric system combining velocity with integration reliability.'
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono uppercase tracking-widest text-violet-400 font-semibold">
            Pillar 02 Engine
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-500/40">
            6-Dimension Reasoning Rubric
          </span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Think Arena</h1>
        <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
          Navigate unfamiliar dilemmas, isolate confounding variables, spot unstated premises, and receive actionable rubric feedback on your reasoning structure.
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeCategory === cat.id
                ? 'bg-violet-950/80 text-violet-300 border border-violet-400/40 shadow-[0_0_10px_rgba(167,139,250,0.2)]'
                : 'text-slate-400 hover:text-white bg-[#0E1326]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Main Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Col: Challenge Dossier & Case Details (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Challenge Selector */}
          <div className="p-6 rounded-3xl bg-[#0E1326] border border-violet-500/30 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-mono text-violet-300 uppercase font-semibold">
                {selectedChallenge.categoryLabel}
              </span>
              <span className="text-xs font-mono text-amber-300 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-500/30">
                +{selectedChallenge.xpReward} XP
              </span>
            </div>

            <h2 className="text-xl font-bold text-white">{selectedChallenge.title}</h2>

            <div className="p-4 rounded-2xl bg-[#090C18] border border-slate-800 space-y-3">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                Scenario Brief
              </span>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
                {selectedChallenge.scenario}
              </p>
            </div>

            {/* Context Data Points */}
            {selectedChallenge.contextData && (
              <div className="space-y-2">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                  Observed Data Points
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {selectedChallenge.contextData.map((d, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl bg-[#090C18] border border-slate-800 text-xs flex items-center justify-between"
                    >
                      <span className="text-slate-400">{d.label}</span>
                      <span className="font-mono text-cyan-300 font-bold">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Guiding Questions */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-[11px] font-mono text-violet-300 uppercase tracking-wider block">
                Guiding Inquiries
              </span>
              <ul className="space-y-2 text-xs text-slate-300">
                {selectedChallenge.guidingQuestions.map((g, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-violet-400 font-mono font-bold shrink-0">0{idx + 1}.</span>
                    <span>{g}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Quick Challenge Switcher */}
          <div className="p-4 rounded-2xl bg-[#0E1326] border border-slate-800 space-y-2">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-2">
              Available Scenarios ({filteredChallenges.length})
            </span>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {filteredChallenges.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelectChallenge(c)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs transition-colors flex items-center justify-between border ${
                    selectedChallenge.id === c.id
                      ? 'bg-violet-950/60 border-violet-400 text-white font-semibold'
                      : 'bg-[#090C18] border-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="truncate pr-2">{c.title}</span>
                  <span className="text-[10px] font-mono text-violet-400 shrink-0 capitalize">
                    {c.difficulty}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Structured Reasoning Submission & Rubric Result (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {!rubricResult ? (
            /* Analysis Submission Form */
            <div className="p-6 sm:p-8 rounded-3xl bg-[#0E1326] border border-cyan-500/20 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white">Your Critical Analysis</h3>
                  <p className="text-xs text-slate-400">
                    Structure your argumentation across the four core analytical axes.
                  </p>
                </div>
                <button
                  onClick={handlePrefillInsight}
                  className="text-[11px] font-mono text-cyan-300 hover:underline px-2.5 py-1 rounded bg-slate-900 border border-slate-800"
                >
                  Sample Argument
                </button>
              </div>

              {/* Axis 1: Evidence Breakdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-300 flex items-center justify-between">
                  <span>1. Evidence Utilization & Confounders</span>
                  <span className="text-[11px] text-slate-500">What data is factual vs noise?</span>
                </label>
                <textarea
                  rows={3}
                  value={evidenceAnalysis}
                  onChange={(e) => setEvidenceAnalysis(e.target.value)}
                  placeholder="Isolate the verified facts from confounding factors or statistical anomalies..."
                  className="w-full p-3 rounded-xl bg-[#090C18] border border-slate-800 text-xs sm:text-sm text-white focus:border-cyan-400 focus:outline-none resize-none"
                />
              </div>

              {/* Axis 2: Hidden Assumptions */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-300 flex items-center justify-between">
                  <span>2. Unstated Assumptions & Biases</span>
                  <span className="text-[11px] text-slate-500">What is tacitly taken for granted?</span>
                </label>
                <textarea
                  rows={3}
                  value={hiddenAssumptions}
                  onChange={(e) => setHiddenAssumptions(e.target.value)}
                  placeholder="Identify what unproven premises or cognitive biases are shaping the problem..."
                  className="w-full p-3 rounded-xl bg-[#090C18] border border-slate-800 text-xs sm:text-sm text-white focus:border-cyan-400 focus:outline-none resize-none"
                />
              </div>

              {/* Axis 3: Trade-offs & Competing Alternatives */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-300 flex items-center justify-between">
                  <span>3. Trade-offs & Competing Hypotheses</span>
                  <span className="text-[11px] text-slate-500">What second-order penalties exist?</span>
                </label>
                <textarea
                  rows={3}
                  value={tradeoffsAndAlternatives}
                  onChange={(e) => setTradeoffsAndAlternatives(e.target.value)}
                  placeholder="Weigh alternative explanations and unavoidable resource/liability trade-offs..."
                  className="w-full p-3 rounded-xl bg-[#090C18] border border-slate-800 text-xs sm:text-sm text-white focus:border-cyan-400 focus:outline-none resize-none"
                />
              </div>

              {/* Axis 4: Final Synthesis */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-300 flex items-center justify-between">
                  <span>4. Final Synthesis & Decision</span>
                  <span className="text-[11px] text-slate-500">Justified conclusion</span>
                </label>
                <textarea
                  rows={3}
                  value={finalDecision}
                  onChange={(e) => setFinalDecision(e.target.value)}
                  placeholder="State your synthesized recommendation and justify why it withstands failure modes..."
                  className="w-full p-3 rounded-xl bg-[#090C18] border border-slate-800 text-xs sm:text-sm text-white focus:border-cyan-400 focus:outline-none resize-none"
                />
              </div>

              {/* Submit Action */}
              <div className="pt-2">
                <button
                  onClick={handleEvaluate}
                  disabled={evaluating}
                  className="w-full py-3.5 rounded-xl text-sm font-bold bg-gradient-to-r from-violet-500 to-indigo-500 text-white hover:from-violet-400 hover:to-indigo-400 font-mono transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(167,139,250,0.35)] disabled:opacity-50"
                >
                  {evaluating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Grading Reasoning against 6-Axis Rubric...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Submit for Rubric Evaluation</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Rubric Evaluation Results Screen */
            <div className="p-6 sm:p-8 rounded-3xl bg-[#0E1326] border border-violet-500/40 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <span className="text-xs font-mono uppercase tracking-widest text-violet-400 font-semibold">
                    Reasoning Evaluation Complete
                  </span>
                  <h3 className="text-xl font-bold text-white mt-0.5">
                    Total Score: {rubricResult.totalScore} / 30
                  </h3>
                </div>
                <button
                  onClick={() => setRubricResult(null)}
                  className="text-xs font-mono text-cyan-300 hover:underline flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Refine Argument</span>
                </button>
              </div>

              {demoNotice && (
                <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200">
                  {demoNotice}
                </div>
              )}

              {/* 6 Rubric Dimension Bars */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { name: 'Clarity', score: rubricResult.clarity },
                  { name: 'Evidence', score: rubricResult.evidence },
                  { name: 'Assumptions', score: rubricResult.assumptions },
                  { name: 'Alternatives', score: rubricResult.alternatives },
                  { name: 'Consistency', score: rubricResult.consistency },
                  { name: 'Conclusion', score: rubricResult.conclusion },
                ].map((item) => (
                  <div
                    key={item.name}
                    className="p-3.5 rounded-xl bg-[#090C18] border border-slate-800 space-y-1.5"
                  >
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-300">{item.name}</span>
                      <span className="text-violet-300 font-bold">{item.score} / 5</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-violet-400 h-full rounded-full"
                        style={{ width: `${(item.score / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Strengths & Blind Spots */}
              <div className="space-y-4 pt-2">
                <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-2">
                  <strong className="text-xs font-mono text-emerald-300 uppercase tracking-wider block">
                    Observed Strengths
                  </strong>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {rubricResult.feedbackComments.strengths.map((s, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 space-y-2">
                  <strong className="text-xs font-mono text-amber-300 uppercase tracking-wider block">
                    Unexamined Blind Spots
                  </strong>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {rubricResult.feedbackComments.blindSpots.map((b, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 text-xs text-slate-300 space-y-1">
                  <strong className="text-cyan-300 font-mono block">
                    Actionable Step to Elevate Mental Model:
                  </strong>
                  <p className="leading-relaxed">
                    {rubricResult.feedbackComments.actionableImprovement}
                  </p>
                </div>
              </div>

              {/* Disclaimer */}
              <p className="text-[11px] text-slate-500 text-center font-mono pt-2">
                Note: APTIQ measures reasoning structure & argumentation rigor, not innate intelligence.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
