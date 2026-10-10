/**
 * APTIQ Challenge & Duel Service
 * Handles encoding, decoding, local persistence, URL generation, and reconstruction of shared quiz challenges.
 */

import { Quiz, Question, QuestionMode, DifficultyLevel, QuestionType } from '../types';
import { CURATED_STARTER_QUIZZES } from './storage';

export interface SharedChallengePayload {
  code: string;
  creatorName: string;
  creatorScore?: number;
  creatorTimeSeconds?: number;
  quiz: Quiz;
  createdAt: string;
}

/**
 * Compact V2 schema for smaller, resilient URLs
 */
interface CompactChallengeV2 {
  v: 2;
  c: string; // code
  n: string; // creatorName
  s?: number; // creatorScore
  t?: number; // creatorTimeSeconds
  a?: string; // createdAt
  q: {
    i: string; // quiz id
    t: string; // quiz title
    d: string; // quiz description
    m: QuestionMode | 'mixed';
    f: DifficultyLevel;
    l: number; // timeLimitMinutes
    s?: 'pdf' | 'text' | 'topic';
    u?: string; // sourceSnippet
    qs: Array<{
      i: string; // question id
      y?: QuestionType; // question type
      p: string; // prompt
      o: Array<{ i: string; t: string }>; // options [id, text]
      c: string; // correctAnswerId
      e: string; // explanation
      m?: QuestionMode;
      k?: string; // topic
      f?: DifficultyLevel;
      r?: string; // misconceptionAlert
    }>;
  };
}

const STORAGE_KEY = 'aptiq_shared_challenges';
const ACTIVE_DUEL_SESSION_KEY = 'aptiq_active_duel_session';

/**
 * Universal isomorphic UTF-8 URL-safe Base64 encoding
 */
export function base64UrlEncode(str: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'utf-8').toString('base64url');
  }
  const utf8Bytes = encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
    String.fromCharCode(parseInt(p1, 16))
  );
  return btoa(utf8Bytes)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Universal isomorphic UTF-8 URL-safe Base64 decoding
 */
export function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(base64, 'base64').toString('utf-8');
  }
  const binary = atob(base64);
  const bytes = binary.split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('');
  return decodeURIComponent(bytes);
}

/**
 * Transforms a full SharedChallengePayload into the compact V2 structure
 */
function toCompactPayload(payload: SharedChallengePayload): CompactChallengeV2 {
  return {
    v: 2,
    c: payload.code,
    n: payload.creatorName,
    s: payload.creatorScore,
    t: payload.creatorTimeSeconds,
    a: payload.createdAt,
    q: {
      i: payload.quiz.id,
      t: payload.quiz.title,
      d: payload.quiz.description,
      m: payload.quiz.mode,
      f: payload.quiz.difficulty,
      l: payload.quiz.timeLimitMinutes,
      s: payload.quiz.sourceType,
      u: payload.quiz.sourceSnippet,
      qs: payload.quiz.questions.map((q) => ({
        i: q.id,
        y: q.type,
        p: q.prompt,
        o: q.options.map((o) => ({ i: o.id, t: o.text })),
        c: q.correctAnswerId,
        e: q.explanation,
        m: q.mode,
        k: q.topic,
        f: q.difficulty,
        r: q.misconceptionAlert,
      })),
    },
  };
}

/**
 * Expands a compact V2 payload back into the full SharedChallengePayload
 */
function fromCompactPayload(compact: CompactChallengeV2): SharedChallengePayload | null {
  try {
    if (!compact.c || !compact.q || !Array.isArray(compact.q.qs) || compact.q.qs.length === 0) {
      return null;
    }
    return {
      code: compact.c,
      creatorName: compact.n || 'Anonymous Challenger',
      creatorScore: compact.s,
      creatorTimeSeconds: compact.t,
      createdAt: compact.a || new Date().toISOString(),
      quiz: {
        id: compact.q.i || `duel-quiz-${compact.c}`,
        title: compact.q.t || 'Peer Duel Assessment',
        description: compact.q.d || 'Asynchronous reasoning challenge.',
        mode: compact.q.m || 'apply',
        difficulty: compact.q.f || 'medium',
        timeLimitMinutes: compact.q.l || 5,
        sourceType: compact.q.s || 'topic',
        sourceSnippet: compact.q.u,
        createdAt: compact.a || new Date().toISOString(),
        questions: compact.q.qs.map((q, idx) => ({
          id: q.i || `q-${idx + 1}`,
          type: q.y || 'multiple_choice',
          prompt: q.p,
          options: (q.o || []).map((o, optIdx) => ({
            id: o.i || `opt-${optIdx + 1}`,
            text: o.t,
          })),
          correctAnswerId: q.c,
          explanation: q.e || '',
          mode: q.m || (compact.q.m === 'mixed' ? 'apply' : compact.q.m) || 'apply',
          topic: q.k || 'General Reasoning',
          difficulty: q.f || compact.q.f || 'medium',
          misconceptionAlert: q.r,
        })),
      },
    };
  } catch {
    return null;
  }
}

/**
 * Encodes a challenge payload into a URL-safe compact representation.
 * Uses compact V2 format for minimal URL length.
 */
export function encodeChallengePayload(payload: SharedChallengePayload): string {
  const compact = toCompactPayload(payload);
  const json = JSON.stringify(compact);
  return base64UrlEncode(json);
}

/**
 * Validates and decodes a challenge payload from a URL-safe representation.
 * Supports both V2 (compact) and V1 (full JSON) structures.
 */
export function decodeChallengePayload(encoded: string): SharedChallengePayload | null {
  try {
    const trimmed = encoded.trim();
    if (!trimmed) return null;

    const json = base64UrlDecode(trimmed);
    const parsed = JSON.parse(json);

    if (!parsed || typeof parsed !== 'object') return null;

    // 1. Detect V2 compact schema
    if (parsed.v === 2 && parsed.q && Array.isArray(parsed.q.qs)) {
      const expanded = fromCompactPayload(parsed as CompactChallengeV2);
      if (expanded) return expanded;
    }

    // 2. Fall back to V1 legacy full schema
    if (parsed.code && parsed.quiz && Array.isArray(parsed.quiz.questions) && parsed.quiz.questions.length > 0) {
      for (const q of parsed.quiz.questions) {
        if (!q.id || !q.prompt || !Array.isArray(q.options) || !q.correctAnswerId) {
          return null;
        }
      }
      return parsed as SharedChallengePayload;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Extracts challenge parameters from any string format:
 * - Full URLs: https://domain/#challenge?code=...&data=... or ?code=...&data=...
 * - Hash paths: #challenge?code=... / #/challenge?code=... / #challenge/APTIQ-12345
 * - Direct codes: APTIQ-12345
 * - Direct encoded payloads
 */
export function parseChallengeFromHash(input: string): {
  code?: string;
  payload?: SharedChallengePayload;
  error?: string;
  isLobby?: boolean;
} {
  const raw = (input || '').trim();
  if (!raw) {
    return { error: 'No challenge reference provided.' };
  }

  // 1. If full URL, parse query and hash parts
  let hashPart = raw;
  let searchPart = '';
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    try {
      const url = new URL(raw);
      hashPart = url.hash;
      searchPart = url.search;
    } catch {
      // ignore URL constructor error and proceed with raw
    }
  }

  // Normalize hash (remove leading # and /)
  const cleanHash = hashPart.replace(/^#+/, '').replace(/^\/+/, '').trim();

  // Check if this is a challenge route or contains query params
  const isChallengeRoute =
    cleanHash.startsWith('challenge') ||
    cleanHash.includes('challenge?') ||
    cleanHash.includes('challenge=') ||
    cleanHash.includes('challenge/') ||
    searchPart.includes('challenge') ||
    searchPart.includes('code=') ||
    searchPart.includes('data=');

  // If input is purely a challenge code (e.g. APTIQ-7X9KF)
  if (!isChallengeRoute && /^APTIQ-[A-Z0-9]{3,8}$/i.test(cleanHash)) {
    const code = cleanHash.toUpperCase();
    const local = getLocalChallengeByCode(code);
    if (local) {
      return { code, payload: local };
    }
    const fallback = createCuratedDuelFallback(code);
    return { code, payload: fallback };
  }

  // Try extracting parameters from searchPart first, then hashPart
  let params = new URLSearchParams(searchPart.startsWith('?') ? searchPart.slice(1) : searchPart);
  const hashQueryIdx = cleanHash.indexOf('?');
  if (hashQueryIdx !== -1) {
    const hashParams = new URLSearchParams(cleanHash.slice(hashQueryIdx + 1));
    // Combine parameters, prioritizing hash query
    hashParams.forEach((val, key) => params.set(key, val));
  }

  const dataParam = params.get('data') || params.get('d');
  const codeParam = (params.get('code') || params.get('c'))?.trim();

  // If base64 payload is provided
  if (dataParam) {
    const decoded = decodeChallengePayload(dataParam);
    if (decoded) {
      saveLocalChallenge(decoded);
      return { code: decoded.code, payload: decoded };
    }
    return { error: 'The challenge data in this link is corrupted or malformed.' };
  }

  // If only code is provided in query params
  if (codeParam) {
    const upperCode = codeParam.toUpperCase();
    const local = getLocalChallengeByCode(upperCode);
    if (local) {
      return { code: upperCode, payload: local };
    }
    const fallback = createCuratedDuelFallback(upperCode);
    return { code: upperCode, payload: fallback };
  }

  // Direct assignment or subpath: e.g. challenge=APTIQ-XXXXX or challenge/APTIQ-XXXXX or challenge=<data>
  const matchDirect = cleanHash.match(/^challenge[=/](.+)$/);
  if (matchDirect && matchDirect[1]) {
    const val = decodeURIComponent(matchDirect[1]).trim();

    // Check if it's base64 data
    const decoded = decodeChallengePayload(val);
    if (decoded) {
      saveLocalChallenge(decoded);
      return { code: decoded.code, payload: decoded };
    }

    // Check if it's a code
    const upperVal = val.toUpperCase();
    const local = getLocalChallengeByCode(upperVal);
    if (local) {
      return { code: upperVal, payload: local };
    }
    const fallback = createCuratedDuelFallback(upperVal);
    return { code: upperVal, payload: fallback };
  }

  // If the user visited bare #challenge with no params
  if (cleanHash === 'challenge' || cleanHash === '') {
    // Check if there is a recently saved local challenge
    const recent = getLocalChallenges();
    if (recent.length > 0) {
      return { isLobby: true, payload: recent[0], code: recent[0].code };
    }
    const starterFallback = createCuratedDuelFallback('APTIQ-STARTER');
    return { isLobby: true, payload: starterFallback, code: 'APTIQ-STARTER' };
  }

  // If nothing matched
  return { error: 'Invalid challenge link format.' };
}

/**
 * Builds the complete shareable URL for a challenge
 */
export function buildShareableChallengeUrl(payload: SharedChallengePayload, origin?: string): string {
  let base = origin;
  if (!base && typeof window !== 'undefined') {
    const pathname = window.location.pathname.replace(/\/index\.html$/, '').replace(/\/$/, '');
    base = `${window.location.origin}${pathname}`;
  }
  if (!base) {
    base = 'https://aptiq.app';
  }
  const encoded = encodeChallengePayload(payload);
  return `${base}/#challenge?code=${encodeURIComponent(payload.code)}&data=${encoded}`;
}

/**
 * Local storage management for challenges
 */
export function getLocalChallenges(): SharedChallengePayload[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalChallenge(challenge: SharedChallengePayload): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const current = getLocalChallenges();
    const filtered = current.filter((c) => c.code.toUpperCase() !== challenge.code.toUpperCase());
    filtered.unshift(challenge);
    // Keep last 25 challenges
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, 25)));
  } catch (err) {
    console.error('Failed to save local challenge', err);
  }
}

export function getLocalChallengeByCode(code: string): SharedChallengePayload | null {
  const challenges = getLocalChallenges();
  const found = challenges.find((c) => c.code.toUpperCase() === code.toUpperCase());
  return found || null;
}

/**
 * Session storage management for active duel in test arena across page refreshes
 */
export function saveActiveDuelSession(sessionData: any): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(ACTIVE_DUEL_SESSION_KEY, JSON.stringify(sessionData));
  } catch (err) {
    console.error('Failed to save active duel session', err);
  }
}

export function getActiveDuelSession(): any | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(ACTIVE_DUEL_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearActiveDuelSession(): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.removeItem(ACTIVE_DUEL_SESSION_KEY);
  } catch {}
}

/**
 * Creates a deterministic duel based on a challenge code if opened on a new device without payload
 */
export function createCuratedDuelFallback(code: string): SharedChallengePayload {
  const starterQuiz = CURATED_STARTER_QUIZZES[0];
  const cleanCode = code.toUpperCase();
  return {
    code: cleanCode,
    creatorName: 'Elena Rostova (Benchmark Challenger)',
    creatorScore: 92,
    creatorTimeSeconds: 245,
    quiz: {
      ...starterQuiz,
      id: `duel-quiz-${cleanCode}`,
      title: `Peer Duel: ${starterQuiz.title}`,
      description: `Asynchronous reasoning challenge created under code ${cleanCode}.`,
    },
    createdAt: new Date().toISOString(),
  };
}
