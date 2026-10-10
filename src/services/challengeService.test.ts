/**
 * APTIQ Challenge & Duel Link Test Suite
 * Validates challenge link creation, encoding/decoding, URL parsing,
 * quiz reconstruction, resilience against corrupt inputs, and security.
 */

import {
  base64UrlEncode,
  encodeChallengePayload,
  decodeChallengePayload,
  parseChallengeFromHash,
  buildShareableChallengeUrl,
  saveLocalChallenge,
  saveActiveDuelSession,
  getActiveDuelSession,
  clearActiveDuelSession,
  SharedChallengePayload,
} from './challengeService';
import { Quiz } from '../types';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`PASS: ${testName}`);
  } else {
    console.error(`FAIL: ${testName}${detail ? ` — ${detail}` : ''}`);
    process.exitCode = 1;
  }
}

console.log('--- Starting APTIQ Challenge Link & Duel Service Tests ---');

// Mock localStorage and sessionStorage for Node.js test environment
const mockStorage: Record<string, string> = {};
const mockSessionStorage: Record<string, string> = {};

(global as any).localStorage = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, val: string) => {
    mockStorage[key] = val;
  },
  removeItem: (key: string) => {
    delete mockStorage[key];
  },
  clear: () => {
    for (const k in mockStorage) delete mockStorage[k];
  },
};

(global as any).sessionStorage = {
  getItem: (key: string) => mockSessionStorage[key] || null,
  setItem: (key: string, val: string) => {
    mockSessionStorage[key] = val;
  },
  removeItem: (key: string) => {
    delete mockSessionStorage[key];
  },
  clear: () => {
    for (const k in mockSessionStorage) delete mockSessionStorage[k];
  },
};

// Sample Quiz for Testing
const sampleQuiz: Quiz = {
  id: 'test-quiz-101',
  title: 'Causal Inference & Systems Reasoning',
  description: 'Distinguish correlation from true causation under noisy observations.',
  mode: 'apply',
  difficulty: 'medium',
  timeLimitMinutes: 6,
  sourceType: 'topic',
  createdAt: new Date().toISOString(),
  questions: [
    {
      id: 'q-1',
      type: 'multiple_choice',
      prompt: 'If an ice cream sales spike correlates with swimming pool accidents, what is the confounding variable?',
      options: [
        { id: 'opt-a', text: 'Sugar intake increases impulsivity' },
        { id: 'opt-b', text: 'High outdoor summer temperature' },
        { id: 'opt-c', text: 'Water chlorination levels' },
        { id: 'opt-d', text: 'Decreased lifeguard vigilance' },
      ],
      correctAnswerId: 'opt-b',
      explanation: 'High summer temperatures drive both higher ice cream consumption and more pool visits.',
      mode: 'apply',
      topic: 'Confounding Variables',
      difficulty: 'medium',
      misconceptionAlert: 'Do not confuse symptom correlation with root mechanism.',
    },
    {
      id: 'q-2',
      type: 'multiple_choice',
      prompt: 'Special unicode characters: — “quotes” and emoji 🏆. What is 2 + 2?',
      options: [
        { id: 'opt-2a', text: '4 (Exact result)' },
        { id: 'opt-2b', text: '5 (Approximation)' },
      ],
      correctAnswerId: 'opt-2a',
      explanation: 'Basic arithmetic identity 2 + 2 = 4.',
      mode: 'recall',
      topic: 'Basic Logic',
      difficulty: 'easy',
    },
  ],
};

const samplePayload: SharedChallengePayload = {
  code: 'APTIQ-9Z4KM',
  creatorName: 'Marcus Vance',
  creatorScore: 95,
  creatorTimeSeconds: 210,
  quiz: sampleQuiz,
  createdAt: '2026-10-09T18:00:00.000Z',
};

// 1. Encoding & Decoding Fidelity
console.log('\n[Suite 1: Encoding & Decoding Fidelity]');
const encoded = encodeChallengePayload(samplePayload);
assert(typeof encoded === 'string' && encoded.length > 50, 'Challenge payload encodes to URL-safe string');
assert(!/[+/=]/.test(encoded), 'Encoded payload uses URL-safe Base64 without +, /, or = padding');

const decoded = decodeChallengePayload(encoded);
assert(decoded !== null, 'Decoded payload is non-null');
assert(decoded?.code === samplePayload.code, 'Decoded code matches original code');
assert(decoded?.creatorName === samplePayload.creatorName, 'Decoded creatorName matches original');
assert(decoded?.creatorScore === samplePayload.creatorScore, 'Decoded creatorScore matches original');
assert(decoded?.creatorTimeSeconds === samplePayload.creatorTimeSeconds, 'Decoded creatorTimeSeconds matches original');
assert(decoded?.quiz.title === sampleQuiz.title, 'Decoded quiz title matches original');
assert(decoded?.quiz.timeLimitMinutes === sampleQuiz.timeLimitMinutes, 'Decoded timeLimitMinutes matches original');
assert(decoded?.quiz.mode === sampleQuiz.mode, 'Decoded quiz mode matches original');
assert(decoded?.quiz.difficulty === sampleQuiz.difficulty, 'Decoded quiz difficulty matches original');
assert(decoded?.quiz.questions.length === sampleQuiz.questions.length, 'Decoded question count matches original');
assert(decoded?.quiz.questions[0].prompt === sampleQuiz.questions[0].prompt, 'First question prompt matches');
assert(decoded?.quiz.questions[0].correctAnswerId === sampleQuiz.questions[0].correctAnswerId, 'First question correctAnswerId matches');
assert(decoded?.quiz.questions[0].explanation === sampleQuiz.questions[0].explanation, 'First question explanation matches');
assert(decoded?.quiz.questions[0].options.length === sampleQuiz.questions[0].options.length, 'First question options count matches');
assert(Boolean(decoded?.quiz.questions[1].prompt.includes('— “quotes” and emoji 🏆')), 'Unicode, curly quotes, and emojis preserved intact');

// 2. Backward Compatibility with V1 Full JSON Schema
console.log('\n[Suite 2: Backward Compatibility with V1 Full Schema]');
const v1FullJson = JSON.stringify(samplePayload);
const v1Encoded = base64UrlEncode(v1FullJson);
const decodedV1 = decodeChallengePayload(v1Encoded);
assert(decodedV1 !== null, 'V1 full schema decodes successfully');
assert(decodedV1?.code === samplePayload.code, 'V1 decoded code matches');
assert(decodedV1?.quiz.questions.length === 2, 'V1 question count preserved');

// 3. Shareable URL Building
console.log('\n[Suite 3: Shareable URL Generation]');
const origin = 'https://ais-dev-test.run.app';
const shareUrl = buildShareableChallengeUrl(samplePayload, origin);
assert(shareUrl.startsWith('https://ais-dev-test.run.app/#challenge?code=APTIQ-9Z4KM&data='), 'Shareable URL matches expected hash format');
assert(!shareUrl.includes('// #'), 'URL has no malformed double slashes');

// 4. URL & Hash Parsing Variations
console.log('\n[Suite 4: URL & Hash Parsing Variations]');

// Format A: Standard hash with query params
const parsedA = parseChallengeFromHash(`#challenge?code=APTIQ-9Z4KM&data=${encoded}`);
assert(!parsedA.error, 'Standard hash parsed without error');
assert(parsedA.payload?.code === 'APTIQ-9Z4KM', 'Standard hash extracted payload');

// Format B: Leading slash in hash (#/challenge?code=...)
const parsedB = parseChallengeFromHash(`#/challenge?code=APTIQ-9Z4KM&data=${encoded}`);
assert(!parsedB.error, 'Hash with leading slash parsed without error');
assert(parsedB.payload?.code === 'APTIQ-9Z4KM', 'Leading slash hash extracted payload');

// Format C: Full URL
const parsedC = parseChallengeFromHash(`https://aptiq.app/app/#challenge?code=APTIQ-9Z4KM&data=${encoded}`);
assert(!parsedC.error, 'Full URL parsed without error');
assert(parsedC.payload?.code === 'APTIQ-9Z4KM', 'Full URL extracted payload');

// Format D: Search query params (?code=...&data=...)
const parsedD = parseChallengeFromHash(`?code=APTIQ-9Z4KM&data=${encoded}`);
assert(!parsedD.error, 'Search parameters parsed without error');
assert(parsedD.payload?.code === 'APTIQ-9Z4KM', 'Search parameters extracted payload');

// Format E: Direct assignment (#challenge=<data>)
const parsedE = parseChallengeFromHash(`#challenge=${encoded}`);
assert(!parsedE.error, 'Direct assignment parsed without error');
assert(parsedE.payload?.code === 'APTIQ-9Z4KM', 'Direct assignment extracted payload');

// Format F: Bare challenge code (#challenge?code=APTIQ-SAVED)
saveLocalChallenge(samplePayload);
const parsedF = parseChallengeFromHash('#challenge?code=APTIQ-9Z4KM');
assert(!parsedF.error, 'Code lookup without data succeeds for saved local challenge');
assert(parsedF.payload?.creatorName === 'Marcus Vance', 'Locally saved creator recovered');

// Format G: Code-only input (APTIQ-9Z4KM)
const parsedG = parseChallengeFromHash('APTIQ-9Z4KM');
assert(!parsedG.error, 'Direct code input parsed successfully');
assert(parsedG.code === 'APTIQ-9Z4KM', 'Direct code recovered');

// Format H: Bare #challenge route (No query params)
const parsedH = parseChallengeFromHash('#challenge');
assert(!parsedH.error, 'Bare #challenge route does not return error');
assert(parsedH.isLobby === true, 'Bare #challenge route identified as lobby');

// 5. Unfamiliar Code Deterministic Fallback
console.log('\n[Suite 5: Unfamiliar Code Deterministic Fallback]');
const parsedUnknown = parseChallengeFromHash('#challenge?code=APTIQ-NEWBIE');
assert(!parsedUnknown.error, 'Unfamiliar code does not crash');
assert(parsedUnknown.payload !== undefined, 'Unfamiliar code creates deterministic duel fallback');
assert(parsedUnknown.payload?.code === 'APTIQ-NEWBIE', 'Fallback duel retains code');
assert((parsedUnknown.payload?.quiz.questions.length ?? 0) > 0, 'Fallback duel has valid questions');

// 6. Resilience & Corrupted Data Handling
console.log('\n[Suite 6: Resilience & Corrupted Data Handling]');

// Truncated base64 data
const corruptData = encoded.slice(0, 30);
const parsedCorrupt = parseChallengeFromHash(`#challenge?code=APTIQ-CORRUPT&data=${corruptData}`);
assert(parsedCorrupt.error !== undefined, 'Corrupted base64 payload returns descriptive error');
assert(Boolean(parsedCorrupt.error?.includes('corrupted or malformed')), 'Error message clearly indicates data issue');

// Random gibberish data
const parsedGibberish = parseChallengeFromHash('#challenge?data=not_even_base64_!@#$%^&*()');
assert(parsedGibberish.error !== undefined, 'Gibberish data returns error');

// Empty input
const parsedEmpty = parseChallengeFromHash('');
assert(parsedEmpty.error !== undefined, 'Empty input returns error');

// Unrelated hash
const parsedUnrelated = parseChallengeFromHash('#dashboard');
assert(parsedUnrelated.error !== undefined, 'Non-challenge route hash is not recognized as challenge');

// 7. Session Storage Management (Test Arena refresh support)
console.log('\n[Suite 7: Session Storage Management for Refreshes]');
const duelSession = {
  customQuestions: sampleQuiz.questions,
  customQuiz: sampleQuiz,
  duelInfo: {
    code: 'APTIQ-9Z4KM',
    creatorName: 'Marcus Vance',
    creatorScore: 95,
    creatorTimeSeconds: 210,
  },
  quizTitle: sampleQuiz.title,
};

saveActiveDuelSession(duelSession);
const recoveredSession = getActiveDuelSession();
assert(recoveredSession !== null, 'Active duel session recovered from sessionStorage');
assert(recoveredSession.duelInfo.code === 'APTIQ-9Z4KM', 'Recovered session retains duel code');
assert(recoveredSession.customQuestions.length === 2, 'Recovered session retains questions');

clearActiveDuelSession();
assert(getActiveDuelSession() === null, 'Active duel session cleared successfully');

// 8. Security & Secret Exposure Audit
console.log('\n[Suite 8: Security Audit for URL Secrets]');
const testUrl = buildShareableChallengeUrl(samplePayload);
assert(!testUrl.toLowerCase().includes('api_key'), 'Challenge URL does not contain api_key');
assert(!testUrl.toLowerCase().includes('gemini'), 'Challenge URL does not contain gemini key reference');
assert(!testUrl.toLowerCase().includes('password'), 'Challenge URL does not contain password');
assert(!testUrl.toLowerCase().includes('secret'), 'Challenge URL does not contain secret');

console.log(`\n--- Challenge Service Test Results: ${passedTests} passed, ${totalTests - passedTests} failed ---`);
if (passedTests === totalTests) {
  console.log('ALL CHALLENGE LINK & DUEL SERVICE TESTS PASSED PERFECTLY!\n');
} else {
  process.exit(1);
}
