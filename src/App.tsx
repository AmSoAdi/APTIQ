import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { DashboardPage } from './pages/DashboardPage';
import { QuizStudioPage } from './pages/QuizStudioPage';
import { TestArenaPage } from './pages/TestArenaPage';
import { ThinkArenaPage } from './pages/ThinkArenaPage';
import { PromptingLabPage } from './pages/PromptingLabPage';
import { ProgressPage } from './pages/ProgressPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { SettingsPage } from './pages/SettingsPage';
import { ChallengeDuelPage } from './pages/ChallengeDuelPage';
import {
  parseChallengeFromHash,
  getActiveDuelSession,
  saveActiveDuelSession,
} from './services/challengeService';

const VALID_ROUTES = [
  'home',
  'dashboard',
  'quiz-studio',
  'test-arena',
  'think-arena',
  'prompting-lab',
  'progress',
  'leaderboard',
  'settings',
  'challenge',
];

/**
 * Resolves current route and state synchronously from window.location
 */
function resolveCurrentLocation(): { route: string; state: any } {
  if (typeof window === 'undefined') {
    return { route: 'home', state: null };
  }

  const rawHash = window.location.hash || '';
  const rawSearch = window.location.search || '';

  // Clean hash of leading '#' and '/'
  const cleanHash = rawHash.replace(/^#+/, '').replace(/^\/+/, '').trim();

  // Check if hash or search refers to challenge/duel
  const isChallenge =
    cleanHash.startsWith('challenge') ||
    cleanHash.includes('challenge?') ||
    cleanHash.includes('challenge=') ||
    cleanHash.includes('challenge/') ||
    rawSearch.includes('challenge') ||
    rawSearch.includes('code=') ||
    rawSearch.includes('data=');

  if (isChallenge) {
    const parsed = parseChallengeFromHash(rawHash || rawSearch);
    return {
      route: 'challenge',
      state: {
        payload: parsed.payload,
        error: parsed.error,
        isLobby: parsed.isLobby,
      },
    };
  }

  // Extract base route name from clean hash
  const routeName = cleanHash.split('?')[0].split('&')[0];
  if (VALID_ROUTES.includes(routeName)) {
    // If the route is test-arena, check if there is an active duel session saved across refresh
    if (routeName === 'test-arena') {
      const activeSession = getActiveDuelSession();
      if (activeSession) {
        return { route: 'test-arena', state: activeSession };
      }
    }
    return { route: routeName, state: null };
  }

  return { route: 'home', state: null };
}

export default function App() {
  // Synchronously resolve route and state from URL on initial load to prevent home flash
  const [initialResolved] = useState(() => resolveCurrentLocation());
  const [currentRoute, setCurrentRoute] = useState<string>(initialResolved.route);
  const [routeState, setRouteState] = useState<any>(initialResolved.state);

  // Synchronize route state with hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const resolved = resolveCurrentLocation();
      setCurrentRoute(resolved.route);
      setRouteState((prevState: any) => {
        // Only override if new state has payload or error, or if navigating to different route
        if (resolved.state) return resolved.state;
        return prevState;
      });
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (route: string, state?: any) => {
    if (route === 'test-arena' && state) {
      saveActiveDuelSession(state);
    }

    setCurrentRoute(route);
    setRouteState(state || null);

    if (route === 'challenge' && state?.payload?.code) {
      window.location.hash = `#challenge?code=${encodeURIComponent(state.payload.code)}`;
    } else {
      window.location.hash = route;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#090C18] text-[#F1F5F9] flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Global Responsive Navigation */}
      <Navbar currentRoute={currentRoute} navigate={navigate} />

      {/* Main Page Content */}
      <main className="flex-1 w-full">
        {currentRoute === 'home' && <HomePage navigate={navigate} />}
        {currentRoute === 'dashboard' && <DashboardPage navigate={navigate} />}
        {currentRoute === 'quiz-studio' && <QuizStudioPage navigate={navigate} />}
        {currentRoute === 'test-arena' && (
          <TestArenaPage navigate={navigate} initialState={routeState} />
        )}
        {currentRoute === 'think-arena' && (
          <ThinkArenaPage initialState={routeState} />
        )}
        {currentRoute === 'prompting-lab' && <PromptingLabPage />}
        {currentRoute === 'progress' && <ProgressPage navigate={navigate} />}
        {currentRoute === 'leaderboard' && <LeaderboardPage navigate={navigate} />}
        {currentRoute === 'challenge' && (
          <ChallengeDuelPage
            payload={routeState?.payload}
            error={routeState?.error}
            isLobby={routeState?.isLobby}
            navigate={navigate}
          />
        )}
        {currentRoute === 'settings' && <SettingsPage />}
      </main>

      {/* Global Footer */}
      <Footer navigate={navigate} />
    </div>
  );
}
