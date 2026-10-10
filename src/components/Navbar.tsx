import React, { useState, useEffect } from 'react';
import {
  Compass,
  Cpu,
  Brain,
  Terminal,
  Award,
  BarChart3,
  Settings,
  Flame,
  Zap,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';
import { getStoredUserStats, updateStreak } from '../services/storage';
import { getServerStatus, ServerStatus } from '../services/api';

interface NavbarProps {
  currentRoute: string;
  navigate: (route: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentRoute, navigate }) => {
  const [stats, setStats] = useState(getStoredUserStats());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);

  useEffect(() => {
    const updated = updateStreak();
    setStats(updated);

    getServerStatus().then((s) => setServerStatus(s));

    const interval = setInterval(() => {
      setStats(getStoredUserStats());
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'home', label: 'Home', icon: Compass },
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'quiz-studio', label: 'Quiz Studio', icon: Cpu },
    { id: 'test-arena', label: 'Test Arena', icon: Zap },
    { id: 'think-arena', label: 'Think Arena', icon: Brain },
    { id: 'prompting-lab', label: 'Prompting Lab', icon: Terminal },
    { id: 'leaderboard', label: 'Leaderboard', icon: Award },
    { id: 'progress', label: 'Progress', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNav = (id: string) => {
    navigate(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full px-4 py-3 backdrop-blur-xl bg-[#090C18]/85 border-b border-cyan-500/10 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Wordmark & Converging Perspective Logo */}
        <button
          onClick={() => handleNav('home')}
          className="flex items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-lg group"
        >
          <div className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-[#0E1326] to-[#171E38] border border-cyan-400/30 group-hover:border-cyan-400/60 transition-all duration-300 shadow-[0_0_15px_-3px_rgba(103,232,249,0.2)]">
            {/* Geometric Converging Perspectives Symbol */}
            <svg
              className="w-6 h-6 text-cyan-300 transition-transform duration-300 group-hover:scale-110"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Converging Angles forming Stylized 'A' */}
              <path d="M12 2L3 20h4l5-10 5 10h4L12 2z" className="text-cyan-400" />
              <path d="M8 14h8" className="text-violet-400" strokeWidth="1.5" />
              <circle cx="12" cy="7" r="1.5" fill="#67E8F9" className="text-cyan-300" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-white via-cyan-100 to-cyan-300 bg-clip-text text-transparent">
                APTIQ
              </span>
              <span className="text-[10px] uppercase font-mono tracking-widest text-cyan-400/80 hidden sm:inline">
                Intelligence in Motion
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden md:block">
              Think beyond the answer
            </p>
          </div>
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1 p-1 rounded-full bg-[#0E1326]/80 border border-slate-800/80 shadow-inner">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentRoute === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`relative px-3.5 py-1.5 text-xs font-medium rounded-full transition-all duration-200 flex items-center gap-1.5 ${
                  isActive
                    ? 'text-cyan-200 bg-cyan-950/60 border border-cyan-400/40 shadow-[0_0_12px_rgba(103,232,249,0.25)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right Status Indicators: XP, Streak & Gemini Badge */}
        <div className="flex items-center gap-3">
          {/* Streak Indicator */}
          <div
            title={`Active streak: ${stats.streakDays} consecutive days`}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0E1326] border border-amber-500/30 text-amber-300 text-xs font-medium cursor-help"
          >
            <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>{stats.streakDays}d</span>
          </div>

          {/* XP & Level Badge */}
          <div
            onClick={() => handleNav('progress')}
            className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-[#0E1326] border border-violet-500/30 text-xs cursor-pointer hover:border-violet-400/60 transition-colors"
          >
            <div className="w-2 h-2 rounded-full bg-violet-400" />
            <span className="text-violet-300 font-semibold">Lvl {stats.level}</span>
            <span className="text-slate-400 font-mono text-[11px]">{stats.xp} XP</span>
          </div>

          {/* AI Status Badge */}
          <div
            onClick={() => handleNav('settings')}
            title={serverStatus?.hasApiKey ? 'Gemini 3.8 Flash model connected' : 'Local deterministic curriculum active'}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0E1326] border border-slate-800 text-[11px] font-mono cursor-pointer hover:border-cyan-500/40 transition-colors"
          >
            <Sparkles
              className={`w-3 h-3 ${serverStatus?.hasApiKey ? 'text-cyan-400' : 'text-amber-400'}`}
            />
            <span className="text-slate-300">
              {serverStatus?.hasApiKey ? 'Gemini AI' : 'Demo Engine'}
            </span>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-3 pt-3 border-t border-slate-800/80 px-2 space-y-1">
          <div className="grid grid-cols-2 gap-2 mb-3 pb-2 border-b border-slate-800/60 text-xs">
            <div className="flex items-center gap-1.5 p-2 rounded bg-slate-900/80 text-violet-300">
              <span>Level {stats.level}</span>
              <span className="text-slate-400">({stats.xp} XP)</span>
            </div>
            <div className="flex items-center gap-1.5 p-2 rounded bg-slate-900/80 text-cyan-300">
              <span>{serverStatus?.hasApiKey ? 'Gemini Live' : 'Demo Mode'}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentRoute === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg text-left transition-colors ${
                    isActive
                      ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4 text-cyan-400" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};
