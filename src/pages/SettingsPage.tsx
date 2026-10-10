import React, { useState, useEffect } from 'react';
import {
  Settings,
  Download,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  Check,
  Loader2,
  Cpu,
  Key,
  Info,
} from 'lucide-react';
import { getServerStatus, ServerStatus, triggerZipExport } from '../services/api';
import { resetToDemoData, getStoredUserStats } from '../services/storage';

export const SettingsPage: React.FC = () => {
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [downloadDone, setDownloadDone] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    checkBackend();
  }, []);

  const checkBackend = async () => {
    try {
      setCheckingStatus(true);
      const status = await getServerStatus();
      setServerStatus(status);
    } catch (e) {
      console.error(e);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleDownloadZip = async () => {
    try {
      setDownloadingZip(true);
      await triggerZipExport();
      setDownloadDone(true);
      setTimeout(() => setDownloadDone(false), 5000);
    } catch (e) {
      console.error('Download failed', e);
    } finally {
      setDownloadingZip(false);
    }
  };

  const handleResetData = () => {
    if (window.confirm('Reset all progress, streaks, and quiz attempts back to default seed data?')) {
      resetToDemoData();
      setResetSuccess(true);
      setTimeout(() => {
        setResetSuccess(false);
        window.location.reload();
      }, 1200);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-semibold">
            System & Diagnostics
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
            Exportable Architecture
          </span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Settings & Engine Status</h1>
        <p className="text-sm text-slate-400">
          Verify Gemini connectivity, export the entire application codebase as a ZIP archive, and manage your local data.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: AI Provider Integration Status */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#0E1326] border border-cyan-500/25 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-bold text-white">Gemini Engine Diagnostics</h3>
            </div>
            <button
              onClick={checkBackend}
              disabled={checkingStatus}
              className="text-xs font-mono text-cyan-300 hover:underline flex items-center gap-1"
            >
              {checkingStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Re-check</span>}
            </button>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-[#090C18] border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Target Model</span>
              <span className="text-white font-bold">{serverStatus?.model || 'gemini-3.8-flash'}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#090C18] border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">API Key Status</span>
              <span
                className={`font-bold ${
                  serverStatus?.hasApiKey ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {serverStatus?.hasApiKey
                  ? 'Configured & Active (Server-Side)'
                  : 'Not Present (Deterministic Fallback Active)'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#090C18] border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Architecture</span>
              <span className="text-cyan-300 font-bold">Express Proxy (@google/genai)</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#080B16] border border-slate-800/80 text-xs text-slate-400 space-y-2">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold font-mono">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Zero-Exposure Key Security</span>
            </div>
            <p className="leading-relaxed">
              Gemini credentials are kept strictly on the Node.js server and are never delivered to client-side bundles. When running locally, configure <code className="text-cyan-300">GEMINI_API_KEY</code> in your <code className="text-cyan-300">.env</code> file.
            </p>
          </div>
        </div>

        {/* Card 2: Export Complete Project (APTIQ.zip) */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#0E1326] border border-cyan-500/25 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Download className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">Export Project Archive</h3>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Download the complete, self-contained project package (<code className="text-cyan-300 font-mono">APTIQ.zip</code>) containing all client code, server routes, schemas, TypeScript configuration, and setup documentation.
          </p>

          <div className="p-4 rounded-2xl bg-[#090C18] border border-slate-800 text-xs space-y-2 font-mono text-slate-400">
            <div className="text-white font-semibold">Included in Archive:</div>
            <div>• Full React + Vite + TypeScript frontend</div>
            <div>• Server-side Express API routes & Gemini proxy</div>
            <div>• README.md with local execution instructions</div>
            <div>• .env.example template</div>
          </div>

          <button
            onClick={handleDownloadZip}
            disabled={downloadingZip}
            className="w-full py-3.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-cyan-400 to-sky-500 text-slate-950 hover:from-cyan-300 hover:to-sky-400 font-mono transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(103,232,249,0.35)] disabled:opacity-50"
          >
            {downloadingZip ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Compressing Project Files into APTIQ.zip...</span>
              </>
            ) : downloadDone ? (
              <>
                <Check className="w-4 h-4 text-emerald-950 stroke-[3]" />
                <span>Downloaded APTIQ.zip Successfully!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download Complete Project (APTIQ.zip)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Local Storage & Reset Section */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#0E1326] border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white">Local Data Management</h3>
            <p className="text-xs text-slate-400">
              Manage cached attempts, revision loop bookmarks, and stats stored in your browser.
            </p>
          </div>
          <button
            onClick={handleResetData}
            className="px-4 py-2 rounded-xl text-xs font-mono font-semibold bg-rose-950/60 border border-rose-500/40 text-rose-300 hover:bg-rose-900 transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>
        </div>

        {resetSuccess && (
          <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-xs text-emerald-200">
            Local data has been re-seeded to initial deterministic curriculum baseline.
          </div>
        )}

        <div className="text-xs text-slate-500 leading-relaxed">
          APTIQ respects your privacy: no tracking scripts, telemetry pixels, or unrequested remote analytics. All study attempts are stored client-side in LocalStorage.
        </div>
      </div>
    </div>
  );
};
