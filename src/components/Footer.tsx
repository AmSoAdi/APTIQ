import React, { useState } from 'react';
import { Download, ShieldCheck, Sparkles, Check, Loader2 } from 'lucide-react';
import { triggerZipExport } from '../services/api';

interface FooterProps {
  navigate: (route: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ navigate }) => {
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      await triggerZipExport();
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <footer className="w-full mt-24 border-t border-slate-800/80 bg-[#070A14] text-slate-400 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Col */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-400/40 flex items-center justify-center text-cyan-300 font-extrabold text-sm">
                A
              </div>
              <span className="text-lg font-bold text-white tracking-wider">APTIQ</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Full-stack AI learning, assessment, and critical thinking platform. Grounded knowledge, structured reasoning rubrics, and transfer practice.
            </p>
            <div className="pt-2">
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 border border-cyan-500/30 text-cyan-300 hover:border-cyan-400 hover:bg-slate-800 transition-all"
              >
                {downloading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : downloadSuccess ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>{downloadSuccess ? 'Downloaded APTIQ.zip' : 'Export Full Project (.zip)'}</span>
              </button>
            </div>
          </div>

          {/* Pillars Navigation */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">
              Core Pillars
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => navigate('quiz-studio')}
                  className="hover:text-cyan-300 transition-colors"
                >
                  AI Quiz Studio
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('test-arena')}
                  className="hover:text-cyan-300 transition-colors"
                >
                  Timed Test Arena
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('think-arena')}
                  className="hover:text-violet-300 transition-colors"
                >
                  Think Arena (Critical Thinking)
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('prompting-lab')}
                  className="hover:text-violet-300 transition-colors"
                >
                  Prompting Lab
                </button>
              </li>
            </ul>
          </div>

          {/* Tools & Analytics */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">
              Learning Tools
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => navigate('dashboard')}
                  className="hover:text-cyan-300 transition-colors"
                >
                  Learner Dashboard
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('progress')}
                  className="hover:text-cyan-300 transition-colors"
                >
                  Progress & Revision Loop
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('leaderboard')}
                  className="hover:text-cyan-300 transition-colors"
                >
                  Leaderboards & Challenges
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('settings')}
                  className="hover:text-cyan-300 transition-colors"
                >
                  Settings & Gemini Engine
                </button>
              </li>
            </ul>
          </div>

          {/* Standards & Transparency */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">
              Design & Honesty
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed mb-3">
              APTIQ evaluates argumentation and reasoning structure, not innate intelligence. When offline or without API keys, deterministic curricula activate automatically.
            </p>
            <div className="text-[11px] font-mono text-slate-600 space-y-1">
              <div>Version: 1.0.0 Production</div>
              <div>Runtime: Express + React + Vite</div>
              <div>AI: Gemini 3.8 Flash via @google/genai</div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>© {new Date().getFullYear()} APTIQ. Think beyond the answer.</div>
          <div className="flex items-center gap-4">
            <span className="text-slate-600">Privacy & Local Storage First</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-600">No Key Storage in Browser</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
