import React, { useState } from 'react';
import {
  Terminal,
  Sparkles,
  ArrowRight,
  RotateCcw,
  History,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Loader2,
} from 'lucide-react';
import { evaluatePromptWithAI } from '../services/api';
import { savePromptVersion, getPromptVersions, addXP } from '../services/storage';
import { PromptVersion } from '../types';

const PRACTICE_EXERCISES = [
  {
    title: 'The Vague Research Request',
    rawPrompt: 'Tell me about distributed systems and what makes them good or bad.',
    objective: 'Systems Architecture Synthesis',
    context: 'Undergraduate Computer Science course reviewing consensus protocols.',
    constraints: ['Limit to 400 words', 'Focus on CAP theorem & network partitions'],
    outputFormat: 'Structured markdown with 4 comparative tables',
  },
  {
    title: 'Unconstrained Code Review',
    rawPrompt: 'Review this Python code and fix any bugs.',
    objective: 'Security Audit & Complexity Optimization',
    context: 'Production fintech API handling concurrent ledger transfers.',
    constraints: ['Identify race conditions', 'Propose idempotency keys', 'No boilerplate comments'],
    outputFormat: 'Checklist with diff snippets',
  },
  {
    title: 'Ambiguous Data Analysis',
    rawPrompt: 'Analyze this customer churn spreadsheet and tell me why people leave.',
    objective: 'Causal Inference & Retention Strategy',
    context: 'SaaS B2B product with 12,000 monthly active accounts.',
    constraints: ['Separate correlation from causation', 'Highlight cohort survivor bias'],
    outputFormat: 'Executive Summary with Risk Matrix',
  },
];

export const PromptingLabPage: React.FC = () => {
  const [prompt, setPrompt] = useState(
    'Tell me how to design a reliable microservices backend that will never crash.'
  );
  const [objective, setObjective] = useState('High-Availability Architecture');
  const [context, setContext] = useState('Fintech ledger with strict ACID transactional requirements.');
  const [constraintsText, setConstraintsText] = useState('Zero data loss, Idempotent retries, No single point of failure');
  const [outputFormat, setOutputFormat] = useState('Structured architectural trade-offs matrix');

  const [evaluating, setEvaluating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<PromptVersion | null>(null);
  const [history, setHistory] = useState<PromptVersion[]>(getPromptVersions());

  const handleEvaluate = async () => {
    try {
      setEvaluating(true);
      const constraints = constraintsText.split(',').map((s) => s.trim()).filter(Boolean);

      const res = await evaluatePromptWithAI({
        prompt,
        objective,
        context,
        constraints,
        outputFormat,
      });

      const newVersion: PromptVersion = {
        id: `ver-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        rawPrompt: prompt,
        objective,
        context,
        constraints,
        outputFormat,
        evaluation: res.evaluation,
      };

      savePromptVersion(newVersion);
      setCurrentVersion(newVersion);
      setHistory(getPromptVersions());
      addXP(40);
    } catch (err) {
      console.error(err);
    } finally {
      setEvaluating(false);
    }
  };

  const handleLoadExercise = (ex: typeof PRACTICE_EXERCISES[0]) => {
    setPrompt(ex.rawPrompt);
    setObjective(ex.objective);
    setContext(ex.context);
    setConstraintsText(ex.constraints.join(', '));
    setOutputFormat(ex.outputFormat);
    setCurrentVersion(null);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-semibold">
            Cognitive Engineering Lab
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
            Ambiguity Elimination Studio
          </span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Prompting Lab</h1>
        <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
          Master the art of prompting. Transform ambiguous, hallucinatory instructions into bounded, deterministic directives with side-by-side diffs.
        </p>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Prompt Builder & Controls (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-[#0E1326] border border-cyan-500/20 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-mono text-cyan-400 font-semibold uppercase">
                1. Prompt Specification Editor
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                {prompt.length} chars
              </span>
            </div>

            {/* Raw Prompt Textarea */}
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">
                Raw Prompt Input
              </label>
              <textarea
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Type your prompt here..."
                className="w-full p-3.5 rounded-xl bg-[#090C18] border border-slate-800 text-xs sm:text-sm text-white focus:border-cyan-400 focus:outline-none resize-none"
              />
            </div>

            {/* Objective & Context */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  Primary Objective
                </label>
                <input
                  type="text"
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  placeholder="e.g. Synthesis, Security Audit"
                  className="w-full px-3 py-2 rounded-xl bg-[#090C18] border border-slate-800 text-xs text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  Target Domain Context
                </label>
                <input
                  type="text"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="e.g. Fintech ledger, Medical clinic"
                  className="w-full px-3 py-2 rounded-xl bg-[#090C18] border border-slate-800 text-xs text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Negative Constraints & Format */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  Constraints (comma-separated)
                </label>
                <input
                  type="text"
                  value={constraintsText}
                  onChange={(e) => setConstraintsText(e.target.value)}
                  placeholder="e.g. No boilerplate, Under 200 words"
                  className="w-full px-3 py-2 rounded-xl bg-[#090C18] border border-slate-800 text-xs text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  Desired Output Structure
                </label>
                <input
                  type="text"
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value)}
                  placeholder="e.g. JSON schema, Markdown table"
                  className="w-full px-3 py-2 rounded-xl bg-[#090C18] border border-slate-800 text-xs text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Action button */}
            <div className="pt-2">
              <button
                onClick={handleEvaluate}
                disabled={evaluating}
                className="w-full py-3.5 rounded-xl text-xs sm:text-sm font-bold bg-cyan-400 text-slate-950 hover:bg-cyan-300 font-mono transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(103,232,249,0.35)] disabled:opacity-50"
              >
                {evaluating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing Ambiguity & Synthesizing Optimized Diff...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Evaluate & Optimize Prompt</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Practice Challenges Section */}
          <div className="p-6 rounded-3xl bg-[#0E1326] border border-slate-800 space-y-3">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
              Curated Practice Drills
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PRACTICE_EXERCISES.map((ex) => (
                <button
                  key={ex.title}
                  onClick={() => handleLoadExercise(ex)}
                  className="p-3 rounded-xl bg-[#090C18] border border-slate-800/90 text-left hover:border-cyan-500/40 transition-colors"
                >
                  <div className="text-xs font-bold text-white mb-1 truncate">{ex.title}</div>
                  <div className="text-[11px] text-slate-400 line-clamp-2">{ex.rawPrompt}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Side-by-Side Comparison & Evaluation (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {!currentVersion?.evaluation ? (
            /* Empty state */
            <div className="p-12 rounded-3xl bg-[#0E1326] border border-slate-800 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto">
                <Terminal className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">No Evaluation Generated Yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Click "Evaluate & Optimize Prompt" on the left to see ambiguity scores, missing boundary conditions, and the enhanced prompt.
              </p>
            </div>
          ) : (
            /* Results Panel */
            <div className="p-6 sm:p-8 rounded-3xl bg-[#0E1326] border border-cyan-500/30 space-y-6">
              {/* Score & Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-semibold">
                    Clarity Score
                  </span>
                  <div className="text-3xl font-extrabold text-white font-mono mt-0.5">
                    {currentVersion.evaluation.clarityScore} / 100
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-500/30">
                    +40 XP Earned
                  </span>
                </div>
              </div>

              {/* Detected Ambiguities */}
              <div className="p-4 rounded-2xl bg-amber-950/25 border border-amber-500/30 space-y-2">
                <strong className="text-xs font-mono text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Detected Ambiguities</span>
                </strong>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {currentVersion.evaluation.ambiguitiesFound.map((amb, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-amber-400 font-mono">•</span>
                      <span>{amb}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Side-by-Side Before vs After Comparison */}
              <div className="space-y-3">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
                  Before vs After Comparison
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Before */}
                  <div className="p-3.5 rounded-xl bg-[#090C18] border border-rose-500/30 space-y-2">
                    <span className="text-[10px] font-mono text-rose-300 font-bold uppercase">
                      Before (Vague Input)
                    </span>
                    <p className="text-xs text-slate-300 line-clamp-5 leading-relaxed font-mono">
                      "{currentVersion.rawPrompt}"
                    </p>
                  </div>

                  {/* After */}
                  <div className="p-3.5 rounded-xl bg-[#0A1224] border border-emerald-500/40 space-y-2 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-emerald-300 font-bold uppercase">
                        After (Optimized)
                      </span>
                      <button
                        onClick={() => handleCopy(currentVersion.evaluation!.optimizedPrompt)}
                        className="text-[10px] font-mono text-cyan-300 hover:text-white flex items-center gap-1"
                      >
                        {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <p className="text-xs text-slate-200 line-clamp-5 leading-relaxed font-mono">
                      {currentVersion.evaluation.optimizedPrompt}
                    </p>
                  </div>
                </div>
              </div>

              {/* Rationale */}
              <div className="p-4 rounded-xl bg-[#090C18] border border-slate-800 text-xs text-slate-300 space-y-1">
                <strong className="text-cyan-300 font-mono block">Why This Outperforms:</strong>
                <p className="leading-relaxed">{currentVersion.evaluation.rationale}</p>
              </div>
            </div>
          )}

          {/* Prompt Version History */}
          {history.length > 0 && (
            <div className="p-6 rounded-3xl bg-[#0E1326] border border-slate-800 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Version History ({history.length})</span>
                </span>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {history.slice(0, 5).map((v) => (
                  <div
                    key={v.id}
                    onClick={() => setCurrentVersion(v)}
                    className="p-3 rounded-xl bg-[#090C18] border border-slate-800 hover:border-cyan-500/40 transition-colors cursor-pointer flex items-center justify-between text-xs"
                  >
                    <span className="text-white font-medium truncate max-w-[240px]">
                      {v.objective || v.rawPrompt}
                    </span>
                    <span className="text-slate-500 font-mono text-[11px] shrink-0">
                      Score: {v.evaluation?.clarityScore || '—'} · {v.timestamp}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
