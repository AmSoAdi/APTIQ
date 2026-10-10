# APTIQ — Think Beyond the Answer

> **Intelligence in Motion**  
> Learn smarter. Reason deeper. Solve better.

APTIQ is a full-stack learning, assessment, and critical-thinking platform. While standard study applications reward rote memorization, APTIQ trains learners to dissect evidence, identify assumptions, weigh alternatives, and transfer principles to unfamiliar real-world problems.

---

## 🏛️ Two Core Pillars

### Pillar 1 — Learn & Assess
- **AI Quiz Studio**: Ingest course PDFs, research articles, or custom topics. Generates unambiguous, structured questions grounded in source material.
- **Timed Test Arena**: Exam simulation with countdown timers, question mark-for-review navigation, automatic submission on expiry, and detailed explanations.
- **Explain My Mistake (AI)**: Immediate cognitive diagnostic explaining why an answer failed, why the key is correct, and generating a targeted follow-up question.
- **Revision Loop**: Automatically queues difficult questions into an active spaced revision cycle.

### Pillar 2 — Think & Reason
- **Think Arena**: Tackles messy, open-ended real-world scenarios across 8 categories:
  1. Logic & Deduction
  2. Evidence Evaluation
  3. Identifying Assumptions
  4. Cause & Effect
  5. Everyday Decisions
  6. Trade-offs & Resource Allocation
  7. Bias & Misinformation
  8. Unfamiliar Scenario Solving
- **6-Dimension Reasoning Rubric**: Written submissions are evaluated across:
  - *Clarity* (1-5)
  - *Evidence Utilization* (1-5)
  - *Unstated Assumptions* (1-5)
  - *Alternative Hypotheses* (1-5)
  - *Logical Consistency* (1-5)
  - *Conclusion Justification* (1-5)
- **Prompting Lab**: Dedicated prompt-engineering studio that flags ambiguities in AI prompts and provides optimized side-by-side diffs with version tracking.

---

## 🚀 Quickstart & Local Setup

### 1. Prerequisites
- Node.js 18+ or 20+
- npm or pnpm

### 2. Installation
```bash
git clone <repository-url>
cd aptiq
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Add your Gemini API key:
```env
GEMINI_API_KEY="your-gemini-api-key-here"
GEMINI_MODEL="gemini-3.8-flash"
PORT=3000
```
*(Note: If no API key is set, APTIQ operates automatically with its built-in deterministic curriculum engine without throwing crashes or unhandled rejections).*

### 4. Running the Application
```bash
npm run dev
```
Open your browser at `http://localhost:3000`.

### 5. Building for Production
```bash
npm run build
npm start
```

---

## 📦 Project Structure

```
├── server.ts               # Express backend & Gemini @google/genai proxy
├── src/
│   ├── components/
│   │   ├── Navbar.tsx             # Global navigation & status indicators
│   │   ├── Footer.tsx             # Brand footer & export triggers
│   │   ├── DualPrismVisual.tsx    # Abstract cinematic geometric hero art
│   │   └── RecallVsApplySimulator.tsx # Interactive comparison widget
│   ├── pages/
│   │   ├── HomePage.tsx           # Cinematic showcase & daily challenge
│   │   ├── DashboardPage.tsx      # Learning stats, streaks & revision queue
│   │   ├── QuizStudioPage.tsx     # PDF ingestion & quiz synthesis
│   │   ├── TestArenaPage.tsx      # Timed testing & mistake diagnostics
│   │   ├── ThinkArenaPage.tsx     # Scenario reasoning & 6-axis rubrics
│   │   ├── PromptingLabPage.tsx   # Prompt engineering & ambiguity detector
│   │   ├── ProgressPage.tsx       # Accuracy trends & revision loops
│   │   ├── LeaderboardPage.tsx    # Benchmark cohorts & challenge duels
│   │   └── SettingsPage.tsx       # Engine health check & ZIP exporter
│   ├── services/
│   │   ├── api.ts                 # Type-safe client for Express API
│   │   └── storage.ts             # LocalStorage persistence & starter data
│   ├── utils/
│   │   └── pdfExtractor.ts        # Client-side PDF text extraction stream
│   ├── types/
│   │   └── index.ts               # Complete TypeScript domain schemas
│   ├── App.tsx                    # Main client routing
│   └── main.tsx                   # React 19 entrypoint
├── index.html                     # Entrypoint with typography & OpenGraph
├── package.json                   # Dependencies and scripts
└── tsconfig.json                  # Strict TypeScript configuration
```

---

## 🔒 Security & Grounding Principles

1. **Zero Client-Side Key Exposure**: The `@google/genai` SDK and `GEMINI_API_KEY` are isolated within `server.ts`. No API secrets are exposed to the client bundle.
2. **Strict Output Schemas**: All AI responses are validated against explicit JSON schemas before rendering.
3. **No Fabricated Citations**: When source documents are provided, passages are mapped directly to the extracted text without inventing fake quotes.
4. **Deterministic Fallbacks**: Every workflow functions gracefully offline or without an API key using curated first-principles scenarios.

---

## 💾 Exporting as `APTIQ.zip`

You can download the entire runnable source code as a compressed ZIP directly within the app:
1. Navigate to **Settings** in the top navigation.
2. Click **Download Complete Project (APTIQ.zip)**.
3. Extract the ZIP locally, run `npm install`, and start using `npm run dev`.
