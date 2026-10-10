import React, { useState } from 'react';
import {
  Upload,
  FileText,
  Sparkles,
  Zap,
  HelpCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  Sliders,
  ChevronRight,
  ArrowRight,
  Loader2,
  FileCheck,
} from 'lucide-react';
import { extractTextFromPdfFile, ExtractedPdfResult } from '../utils/pdfExtractor';
import { generateQuizWithAI } from '../services/api';
import { saveCustomQuiz } from '../services/storage';
import { Question, Quiz, QuestionMode, DifficultyLevel } from '../types';

interface QuizStudioPageProps {
  navigate: (route: string, state?: any) => void;
}

const SAMPLE_TEXTS = [
  {
    title: 'Epigenetics & Gene Expression',
    snippet:
      'Epigenetics involves molecular alterations to chromatin and DNA (such as histone acetylation and cytosine methylation) that regulate gene expression without modifying the underlying nucleotide sequence. Environmental stressors such as famine, toxic exposure, and prolonged cortisol spikes can alter epigenetic markers, which in some vertebrate studies are transmitted across transgenerational gametes.',
  },
  {
    title: 'Distributed Consensus & Raft Protocol',
    snippet:
      'The Raft consensus algorithm decomposes replicated state machine synchronization into distinct subproblems: leader election, log replication, and safety. A node can transition between Leader, Candidate, and Follower states. Leaders handle client read/writes and append log entries across a quorum of followers using term heartbeats. If a leader network-partitions, split votes can occur until randomized election timeouts break symmetry.',
  },
  {
    title: 'Cognitive Heuristics & Base Rate Neglect',
    snippet:
      'Base rate neglect occurs when individuals judge the conditional probability of a hypothesis (P(H|E)) by overweighting specific individuating evidence (E) while ignoring the statistical prior baseline frequency (P(H)) in the population. In clinical diagnostics, even an imaging test with 99% accuracy will yield predominantly false positives if the target disease prevalence is 1 in 10,000.',
  },
];

export const QuizStudioPage: React.FC<QuizStudioPageProps> = ({ navigate }) => {
  // Input modality
  const [inputTab, setInputTab] = useState<'pdf' | 'text' | 'topic'>('topic');

  // Input fields
  const [topic, setTopic] = useState('Cognitive Biases & Causal Reasoning');
  const [pastedText, setPastedText] = useState('');
  const [pdfFileResult, setPdfFileResult] = useState<ExtractedPdfResult | null>(null);
  const [pdfProcessing, setPdfProcessing] = useState(false);

  // Settings
  const [questionCount, setQuestionCount] = useState<number>(4);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [mode, setMode] = useState<QuestionMode>('apply');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(10);

  // Generation status
  const [generating, setGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [demoNotice, setDemoNotice] = useState<string | null>(null);

  // Result state
  const [generatedQuiz, setGeneratedQuiz] = useState<Quiz | null>(null);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setPdfProcessing(true);
      setErrorNotice(null);
      const res = await extractTextFromPdfFile(file);
      setPdfFileResult(res);
      if (res.error) {
        setErrorNotice(res.error);
      } else if (res.extractedText) {
        setTopic(file.name.replace(/\.[^/.]+$/, ''));
      }
    } catch (err: any) {
      setErrorNotice(`Failed to parse PDF: ${err?.message || 'File error'}`);
    } finally {
      setPdfProcessing(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setErrorNotice(null);
      setDemoNotice(null);

      // Determine text snippet based on tab
      let snippet = '';
      let effectiveTopic = topic.trim() || 'General Knowledge';

      if (inputTab === 'pdf') {
        if (!pdfFileResult || !pdfFileResult.extractedText) {
          throw new Error('Please upload a PDF with extractable text, or paste content in the text tab.');
        }
        snippet = pdfFileResult.extractedText;
      } else if (inputTab === 'text') {
        if (!pastedText.trim()) {
          throw new Error('Please paste study notes or select one of the sample texts.');
        }
        snippet = pastedText;
      }

      setGenerationStep('Ingesting domain concepts and establishing ground truth invariants...');
      await new Promise((r) => setTimeout(r, 600));

      setGenerationStep(
        mode === 'apply'
          ? 'Formulating novel scenario-based application questions (Apply Mode)...'
          : 'Formulating definition and fact-retrieval questions (Recall Mode)...'
      );

      const result = await generateQuizWithAI({
        topic: effectiveTopic,
        sourceSnippet: snippet,
        mode,
        questionCount,
        difficulty,
      });

      if (result.isDemoMode) {
        setDemoNotice(
          result.notice ||
            'Gemini API key is not active. High-rigor deterministic curriculum loaded.'
        );
      }

      const newQuiz: Quiz = {
        id: `quiz-${Date.now()}`,
        title: effectiveTopic,
        description: `${mode === 'apply' ? 'Application & Scenario' : 'Recall & Concept'} assessment generated across ${result.questions.length} questions.`,
        sourceType: inputTab,
        sourceTitle: inputTab === 'pdf' ? pdfFileResult?.fileName : effectiveTopic,
        sourceSnippet: snippet.slice(0, 500),
        questions: result.questions,
        createdAt: new Date().toISOString(),
        timeLimitMinutes,
        mode,
        difficulty,
      };

      setGeneratedQuiz(newQuiz);
      saveCustomQuiz(newQuiz);
    } catch (err: any) {
      setErrorNotice(err?.message || 'An error occurred while generating the quiz.');
    } finally {
      setGenerating(false);
      setGenerationStep('');
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-semibold">
            Pillar 01 Engine
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
            Source-Grounded Architecture
          </span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">AI Quiz Studio</h1>
        <p className="text-sm text-slate-400">
          Upload documents or specify topics. Generate structured, unambiguous assessments grounded in ground-truth material.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Inputs & Settings (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Input Method Selector */}
          <div className="p-6 rounded-2xl bg-[#0E1326] border border-cyan-500/20">
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold mb-3">
              1. Choose Content Source
            </label>

            <div className="grid grid-cols-3 gap-2 p-1 bg-[#090C18] rounded-xl border border-slate-800 mb-6">
              <button
                onClick={() => setInputTab('topic')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  inputTab === 'topic'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Topic Search
              </button>
              <button
                onClick={() => setInputTab('text')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  inputTab === 'text'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Paste Text
              </button>
              <button
                onClick={() => setInputTab('pdf')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  inputTab === 'pdf'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                PDF Upload
              </button>
            </div>

            {/* Tab 1: Topic */}
            {inputTab === 'topic' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-mono">
                    Subject or Subject Matter Invariant
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Distributed Consensus, Cognitive Biases, Cellular Respiration"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#090C18] border border-slate-800 text-sm text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="text-[11px] text-slate-500 font-mono self-center">Popular:</span>
                  {[
                    'Bayesian Probability',
                    'Systems Architecture',
                    'Amdahl’s Law',
                    'Logical Fallacies',
                  ].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTopic(t)}
                      className="px-2.5 py-1 rounded-md text-[11px] bg-slate-900 border border-slate-800 text-slate-300 hover:border-cyan-500/40 hover:text-cyan-200 transition-colors"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 2: Pasted Text */}
            {inputTab === 'text' && (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs text-slate-400 font-mono">
                      Source Passages or Textbook Notes
                    </label>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {pastedText.length} characters
                    </span>
                  </div>
                  <textarea
                    rows={6}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="Paste article excerpts, lecture slides, or documentation here..."
                    className="w-full px-4 py-3 rounded-xl bg-[#090C18] border border-slate-800 text-xs sm:text-sm text-white focus:border-cyan-400 focus:outline-none resize-none"
                  />
                </div>
                {/* Instant Sample Text Buttons */}
                <div>
                  <span className="text-[11px] text-slate-500 font-mono block mb-2">
                    Quick Sample Excerpts for Instant Testing:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {SAMPLE_TEXTS.map((sample) => (
                      <button
                        key={sample.title}
                        onClick={() => {
                          setPastedText(sample.snippet);
                          setTopic(sample.title);
                        }}
                        className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-left hover:border-cyan-500/40 transition-colors"
                      >
                        <div className="text-[11px] font-bold text-cyan-300 truncate">
                          {sample.title}
                        </div>
                        <div className="text-[10px] text-slate-400 line-clamp-1">
                          Click to load excerpt
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: PDF Upload */}
            {inputTab === 'pdf' && (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-slate-800 hover:border-cyan-500/40 rounded-2xl p-6 text-center transition-colors bg-[#090C18]">
                  <Upload className="w-8 h-8 text-cyan-400 mx-auto mb-2 opacity-80" />
                  <label className="cursor-pointer">
                    <span className="text-xs font-semibold text-cyan-300 hover:underline">
                      Upload PDF Document
                    </span>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handlePdfUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Text-based PDF documents supported (Lecture notes, research articles).
                  </p>
                </div>

                {pdfProcessing && (
                  <div className="flex items-center gap-2 text-xs text-cyan-300">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Extracting document text stream...</span>
                  </div>
                )}

                {pdfFileResult && (
                  <div className="p-4 rounded-xl bg-[#090C18] border border-cyan-500/30 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-white font-medium">
                        <FileCheck className="w-4 h-4 text-emerald-400" />
                        <span className="truncate max-w-[200px]">{pdfFileResult.fileName}</span>
                      </div>
                      <span className="text-slate-400 font-mono">
                        ~{pdfFileResult.pageCount} pages · {pdfFileResult.charCount} chars
                      </span>
                    </div>

                    {pdfFileResult.error && (
                      <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-[11px] text-rose-200 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <span>{pdfFileResult.error}</span>
                      </div>
                    )}

                    {pdfFileResult.warning && (
                      <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/30 text-[11px] text-amber-200 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <span>{pdfFileResult.warning}</span>
                      </div>
                    )}

                    {pdfFileResult.extractedText && (
                      <div className="text-[11px] text-slate-400 bg-slate-950 p-2.5 rounded border border-slate-900 max-h-24 overflow-y-auto">
                        <strong>Preview:</strong> {pdfFileResult.extractedText.slice(0, 300)}...
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. Assessment Parameters */}
          <div className="p-6 rounded-2xl bg-[#0E1326] border border-cyan-500/20 space-y-5">
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
              2. Assessment Parameters
            </label>

            {/* Recall Mode vs Apply Mode Choice */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-300 font-medium">Cognitive Mode</span>
                <span className="text-[11px] font-mono text-cyan-400">
                  {mode === 'apply' ? 'First-Principles Transfer' : 'Direct Fact Retention'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setMode('recall')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    mode === 'recall'
                      ? 'bg-cyan-950/70 border-cyan-400 text-white shadow-[0_0_12px_rgba(103,232,249,0.2)]'
                      : 'bg-[#090C18] border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="text-xs font-bold text-cyan-300 mb-0.5">Recall Mode</div>
                  <div className="text-[11px] text-slate-400">
                    Tests memory, definitions, formulas & explicit facts.
                  </div>
                </button>
                <button
                  onClick={() => setMode('apply')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    mode === 'apply'
                      ? 'bg-violet-950/70 border-violet-400 text-white shadow-[0_0_12px_rgba(167,139,250,0.2)]'
                      : 'bg-[#090C18] border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="text-xs font-bold text-violet-300 mb-0.5">Apply Mode</div>
                  <div className="text-[11px] text-slate-400">
                    Tests conceptual transfer to unfamiliar real-world anomalies.
                  </div>
                </button>
              </div>
            </div>

            {/* Questions count and Difficulty */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-mono">
                  Question Count
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[3, 4, 6, 8].map((n) => (
                    <button
                      key={n}
                      onClick={() => setQuestionCount(n)}
                      className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-all border ${
                        questionCount === n
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                          : 'bg-[#090C18] border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-mono">
                  Difficulty
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['easy', 'medium', 'hard', 'adaptive'] as DifficultyLevel[]).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={`py-1.5 rounded-lg text-[11px] font-mono font-bold capitalize transition-all border ${
                        difficulty === d
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                          : 'bg-[#090C18] border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Timed Limit */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-mono">
                Test Arena Time Limit
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { m: 0, label: 'Untimed' },
                  { m: 5, label: '5 min' },
                  { m: 10, label: '10 min' },
                  { m: 15, label: '15 min' },
                ].map((t) => (
                  <button
                    key={t.m}
                    onClick={() => setTimeLimitMinutes(t.m)}
                    className={`py-1.5 rounded-lg text-xs font-mono transition-all border ${
                      timeLimitMinutes === t.m
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                        : 'bg-[#090C18] border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Generate Button & Progress */}
          <div className="space-y-3">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full py-3.5 rounded-xl text-sm font-bold bg-cyan-400 text-slate-950 hover:bg-cyan-300 disabled:opacity-50 transition-all font-mono flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(103,232,249,0.35)]"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Assessment Questions...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Grounded Quiz</span>
                </>
              )}
            </button>

            {generationStep && (
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-cyan-300 flex items-center gap-2 animate-pulse font-mono">
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                <span>{generationStep}</span>
              </div>
            )}

            {errorNotice && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-200">
                {errorNotice}
              </div>
            )}

            {demoNotice && (
              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200">
                {demoNotice}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Generated Quiz Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl p-6 bg-[#0E1326] border border-slate-800 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                <span className="text-xs font-mono uppercase tracking-widest text-slate-400 font-semibold">
                  Assessment Preview
                </span>
                {generatedQuiz && (
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                    Ready to Test
                  </span>
                )}
              </div>

              {!generatedQuiz ? (
                <div className="py-20 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto">
                    <Zap className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-300">No Assessment Loaded</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                    Configure your source parameters on the left and click "Generate Grounded Quiz" to preview questions here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-[#090C18] border border-cyan-500/30">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300">
                      {generatedQuiz.mode.toUpperCase()}
                    </span>
                    <h3 className="text-sm font-bold text-white mt-1.5">{generatedQuiz.title}</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {generatedQuiz.questions.length} questions · {generatedQuiz.timeLimitMinutes > 0 ? `${generatedQuiz.timeLimitMinutes}m limit` : 'Untimed'}
                    </p>
                  </div>

                  {/* Question list preview */}
                  <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                    {generatedQuiz.questions.map((q, idx) => (
                      <div
                        key={q.id}
                        className="p-3.5 rounded-xl bg-[#090C18] border border-slate-800/80 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                          <span>Question {idx + 1}</span>
                          <span className="text-cyan-400 capitalize">{q.difficulty}</span>
                        </div>
                        <p className="text-slate-200 font-medium leading-relaxed">{q.prompt}</p>

                        <div className="space-y-1 text-[11px] pt-1">
                          {q.options.map((opt) => (
                            <div
                              key={opt.id}
                              className={`p-1.5 rounded px-2 ${
                                opt.id === q.correctAnswerId
                                  ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 font-semibold'
                                  : 'text-slate-400 bg-slate-900/50'
                              }`}
                            >
                              {opt.text}
                            </div>
                          ))}
                        </div>

                        {q.sourceReference?.passage && (
                          <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-900 font-mono">
                            <strong>Source:</strong> {q.sourceReference.passage}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {generatedQuiz && (
              <div className="pt-4 border-t border-slate-800 space-y-2">
                <button
                  onClick={() => navigate('test-arena', { quizId: generatedQuiz.id })}
                  className="w-full py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-400 to-sky-500 text-slate-950 font-mono hover:from-cyan-300 hover:to-sky-400 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(103,232,249,0.3)]"
                >
                  <Clock className="w-4 h-4" />
                  <span>Launch Exam in Test Arena</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
