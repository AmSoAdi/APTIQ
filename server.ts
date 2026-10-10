import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import JSZip from 'jszip';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Gemini SDK if API key is present
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

// Status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    hasApiKey: Boolean(apiKey),
    model: GEMINI_MODEL,
    environment: process.env.NODE_ENV || 'development',
    serverTime: new Date().toISOString(),
  });
});

// 1. Generate Quiz Endpoint
app.post('/api/gemini/generate-quiz', async (req, res) => {
  try {
    const {
      topic = 'Critical Thinking',
      sourceSnippet = '',
      mode = 'apply', // 'recall' | 'apply' | 'mixed'
      questionCount = 4,
      difficulty = 'medium',
    } = req.body;

    const count = Math.min(Math.max(Number(questionCount) || 4, 2), 10);

    // If Gemini is not configured, supply high-quality deterministic quiz
    if (!ai) {
      return res.json({
        isDemoMode: true,
        notice: 'Generated using APTIQ deterministic curriculum engine (Gemini API key not configured).',
        questions: generateCuratedFallbackQuestions(topic, mode, count, difficulty),
      });
    }

    const systemInstruction = `You are APTIQ's Senior Assessment Architect.
Your role is to construct high-rigor, unambiguous multiple-choice questions.
Key Principles:
- Accuracy and clarity matter above all. Questions must be crystal clear on first reading.
- If Mode is "recall", assess fundamental definitions, laws, formulas, and recall of mechanisms.
- If Mode is "apply", assess transfer of learning to unfamiliar scenarios, anomaly diagnostics, or second-order effects.
- Provide plausible distractors that represent common cognitive traps.
- Every question MUST have an in-depth explanation and a misconception alert.
- If source material is provided, ground the question and cite the relevant passage or concept. Do not invent fake quotes.`;

    const prompt = `Generate a ${count}-question quiz.
Topic: ${topic}
Target Difficulty: ${difficulty}
Mode: ${mode}
${sourceSnippet ? `Source Text Context:\n"""\n${sourceSnippet.slice(0, 4000)}\n"""` : 'No source document provided. Generate from authoritative first-principles knowledge.'}

Return JSON with a list of questions strictly conforming to the requested schema.`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  prompt: { type: Type.STRING },
                  mode: { type: Type.STRING, description: "'recall' or 'apply'" },
                  options: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        text: { type: Type.STRING },
                      },
                      required: ['id', 'text'],
                    },
                  },
                  correctAnswerId: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  misconceptionAlert: { type: Type.STRING },
                  topic: { type: Type.STRING },
                  sourceReference: {
                    type: Type.OBJECT,
                    properties: {
                      section: { type: Type.STRING },
                      passage: { type: Type.STRING },
                    },
                  },
                },
                required: ['id', 'prompt', 'options', 'correctAnswerId', 'explanation'],
              },
            },
          },
          required: ['questions'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    if (!parsed.questions || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      throw new Error('Malformed questions received from model');
    }

    res.json({
      isDemoMode: false,
      questions: parsed.questions.map((q: any, i: number) => ({
        ...q,
        id: q.id || `gen-q-${i + 1}-${Date.now()}`,
        difficulty,
        mode: q.mode || mode,
        topic: q.topic || topic,
      })),
    });
  } catch (error: any) {
    console.error('Quiz Generation Error:', error);
    // Graceful fallback on error
    const fallback = generateCuratedFallbackQuestions(req.body.topic || 'General Science', req.body.mode || 'apply', 4, 'medium');
    res.json({
      isDemoMode: true,
      errorNotice: `Gemini service encountered a transient issue (${error?.message || 'timeout'}). Loaded fallback challenge curriculum.`,
      questions: fallback,
    });
  }
});

// 1b. Adaptive Question Generation Endpoint (Generates a single question at exact target difficulty)
app.post('/api/gemini/generate-adaptive-question', async (req, res) => {
  try {
    const {
      topic = 'Critical Thinking',
      sourceSnippet = '',
      mode = 'apply',
      targetDifficulty = 'medium', // 'easy' | 'medium' | 'hard'
      previousQuestions = [],
    } = req.body;

    // If Gemini is not configured, supply high-quality deterministic fallback
    if (!ai) {
      const fallback = generateCuratedFallbackByDifficulty(topic, targetDifficulty, mode);
      return res.json({
        isDemoMode: true,
        notice: 'Generated using APTIQ deterministic curriculum engine (Gemini API key not configured).',
        question: fallback,
      });
    }

    const previousPrompts = Array.isArray(previousQuestions)
      ? previousQuestions.map((p: any) => `"${p.prompt || p}"`).slice(-6).join('\n')
      : '';

    const systemInstruction = `You are APTIQ's Senior Adaptive Assessment Architect.
Your task is to generate ONE new multiple-choice question tailored strictly to target difficulty "${targetDifficulty}" in "${mode}" mode.
Target Difficulty Guidelines:
- EASY: Assess foundational concepts, single-variable transfer, and common cognitive traps with clear distinctions.
- MEDIUM: Assess multi-variable trade-offs, confounding variables, indirect effects, and intermediate scenario anomalies.
- HARD: Assess counter-intuitive boundary conditions, non-linear dynamics, catastrophic tail risks, and deep first-principles transfer.

CRITICAL REQUIREMENTS:
- Do NOT repeat or superficially rephrase any of the previous questions:
${previousPrompts ? `Previously asked questions:\n${previousPrompts}` : 'No previous questions.'}
- Every question MUST have 4 distinct options, exactly one unambiguous correct answer, an in-depth explanation, and a misconception alert.
- Return JSON conforming to the requested schema.`;

    const prompt = `Generate 1 multiple-choice question for:
Topic: ${topic}
Target Difficulty: ${targetDifficulty}
Cognitive Mode: ${mode}
${sourceSnippet ? `Source Text Context:\n"""\n${sourceSnippet.slice(0, 3000)}\n"""` : 'No source document provided. Generate from authoritative first-principles knowledge.'}`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            question: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                prompt: { type: Type.STRING },
                mode: { type: Type.STRING, description: "'recall' or 'apply'" },
                options: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      text: { type: Type.STRING },
                    },
                    required: ['id', 'text'],
                  },
                },
                correctAnswerId: { type: Type.STRING },
                explanation: { type: Type.STRING },
                misconceptionAlert: { type: Type.STRING },
                topic: { type: Type.STRING },
                sourceReference: {
                  type: Type.OBJECT,
                  properties: {
                    section: { type: Type.STRING },
                    passage: { type: Type.STRING },
                  },
                },
              },
              required: ['id', 'prompt', 'options', 'correctAnswerId', 'explanation'],
            },
          },
          required: ['question'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    if (!parsed.question || !parsed.question.prompt) {
      throw new Error('Malformed adaptive question received from model');
    }

    res.json({
      isDemoMode: false,
      question: {
        ...parsed.question,
        id: parsed.question.id || `gen-adapt-${Date.now()}`,
        difficulty: targetDifficulty,
        mode: parsed.question.mode || mode,
        topic: parsed.question.topic || topic,
      },
    });
  } catch (error: any) {
    console.error('Adaptive Question Generation Error:', error);
    const fallback = generateCuratedFallbackByDifficulty(
      req.body.topic || 'Critical Thinking',
      req.body.targetDifficulty || 'medium',
      req.body.mode || 'apply'
    );
    res.json({
      isDemoMode: true,
      errorNotice: `Gemini service encountered a transient issue (${error?.message || 'timeout'}). Loaded fallback challenge curriculum.`,
      question: fallback,
    });
  }
});

// 2. Think Arena Reasoning Evaluation
app.post('/api/gemini/evaluate-reasoning', async (req, res) => {
  try {
    const {
      scenario = '',
      category = 'Unfamiliar Scenarios',
      userAnalysis = {
        evidenceAnalysis: '',
        hiddenAssumptions: '',
        tradeoffsAndAlternatives: '',
        finalDecision: '',
      },
    } = req.body;

    if (!ai) {
      return res.json({
        isDemoMode: true,
        rubric: generateCuratedRubricEvaluation(userAnalysis),
        notice: 'Evaluated using APTIQ Local Reasoning Engine (Gemini key not set).',
      });
    }

    const systemInstruction = `You are APTIQ's Critical Thinking Evaluator.
Evaluate the user's reasoning against this rigorous 6-dimension rubric (Score each 1 to 5):
1. Clarity (0-5): Is the thought process coherent, precise, and articulate?
2. Evidence (0-5): Did they ground deductions in facts rather than speculation?
3. Assumptions (0-5): Did they identify unstated premises and cognitive biases?
4. Alternatives (0-5): Did they weigh competing hypotheses and edge cases?
5. Logical Consistency (0-5): Is the argumentation internally consistent without circular reasoning?
6. Conclusion Quality (0-5): Is the final synthesis warranted by the evidence?

Provide detailed constructive feedback:
- List 2-3 specific strengths.
- List 2 specific blind spots or unexamined assumptions.
- Provide 1 actionable improvement to elevate their mental model.`;

    const prompt = `Scenario Being Analyzed:
"""
${scenario}
Category: ${category}
"""

User Analysis Submission:
- Evidence & Data Points: ${userAnalysis.evidenceAnalysis || 'None provided'}
- Identified Hidden Assumptions: ${userAnalysis.hiddenAssumptions || 'None provided'}
- Trade-offs & Competing Alternatives: ${userAnalysis.tradeoffsAndAlternatives || 'None provided'}
- Final Decision & Synthesis: ${userAnalysis.finalDecision || 'None provided'}

Evaluate the user's critical thinking rigor and return the JSON rubric.`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            clarity: { type: Type.INTEGER },
            evidence: { type: Type.INTEGER },
            assumptions: { type: Type.INTEGER },
            alternatives: { type: Type.INTEGER },
            consistency: { type: Type.INTEGER },
            conclusion: { type: Type.INTEGER },
            totalScore: { type: Type.INTEGER },
            feedbackComments: {
              type: Type.OBJECT,
              properties: {
                strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                blindSpots: { type: Type.ARRAY, items: { type: Type.STRING } },
                actionableImprovement: { type: Type.STRING },
              },
              required: ['strengths', 'blindSpots', 'actionableImprovement'],
            },
          },
          required: ['clarity', 'evidence', 'assumptions', 'alternatives', 'consistency', 'conclusion', 'feedbackComments'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    const totalScore = (parsed.clarity || 3) + (parsed.evidence || 3) + (parsed.assumptions || 3) + (parsed.alternatives || 3) + (parsed.consistency || 3) + (parsed.conclusion || 3);
    parsed.totalScore = totalScore;

    res.json({
      isDemoMode: false,
      rubric: parsed,
    });
  } catch (error: any) {
    console.error('Reasoning Evaluation Error:', error);
    res.json({
      isDemoMode: true,
      rubric: generateCuratedRubricEvaluation(req.body.userAnalysis),
      errorNotice: `Gemini service unavailable. Provided heuristic evaluation: ${error?.message}`,
    });
  }
});

// 3. Prompting Lab Evaluation
app.post('/api/gemini/evaluate-prompt', async (req, res) => {
  try {
    const {
      prompt = '',
      objective = 'General Task',
      context = '',
      constraints = [],
      outputFormat = '',
    } = req.body;

    if (!ai) {
      return res.json({
        isDemoMode: true,
        evaluation: generateCuratedPromptEvaluation(prompt, objective),
      });
    }

    const systemInstruction = `You are APTIQ's Prompt Architecture Specialist.
Analyze the user's raw prompt for an AI system.
Evaluate for:
1. Ambiguity & Under-specified goals.
2. Missing constraints & boundary conditions.
3. Output format determinism.
4. Hallucination risk.
Produce an improved version that transforms vague requests into deterministic, high-fidelity instructions with clear role framing, input grounding, and negative constraints.`;

    const userPayload = `Prompt: "${prompt}"
Objective: ${objective}
Context: ${context || 'None'}
Constraints: ${Array.isArray(constraints) ? constraints.join(', ') : 'None'}
Desired Output Format: ${outputFormat || 'Unspecified'}`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: userPayload,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            clarityScore: { type: Type.INTEGER, description: 'Score between 0 and 100' },
            ambiguitiesFound: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestedImprovements: { type: Type.ARRAY, items: { type: Type.STRING } },
            optimizedPrompt: { type: Type.STRING },
            rationale: { type: Type.STRING },
          },
          required: ['clarityScore', 'ambiguitiesFound', 'suggestedImprovements', 'optimizedPrompt', 'rationale'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({
      isDemoMode: false,
      evaluation: parsed,
    });
  } catch (error: any) {
    console.error('Prompt Evaluation Error:', error);
    res.json({
      isDemoMode: true,
      evaluation: generateCuratedPromptEvaluation(req.body.prompt, req.body.objective),
    });
  }
});

// 4. Explain My Mistake & Generate Follow-up Practice Question
app.post('/api/gemini/explain-mistake', async (req, res) => {
  try {
    const { question, selectedOptionId } = req.body;
    const selectedOption = question?.options?.find((o: any) => o.id === selectedOptionId)?.text || 'Unknown';
    const correctOption = question?.options?.find((o: any) => o.id === question?.correctAnswerId)?.text || 'Unknown';

    if (!ai) {
      return res.json({
        isDemoMode: true,
        explanation: {
          whyIncorrect: `Option "${selectedOption}" focuses on an intuitive surface correlation rather than the core causal mechanism.`,
          whyCorrect: `Option "${correctOption}" correctly identifies the underlying invariant: ${question?.explanation || 'See core principle.'}`,
          underlyingMisconception: question?.misconceptionAlert || 'Conflating immediate symptoms with foundational causality.',
          followUpQuestion: {
            id: `followup-${Date.now()}`,
            prompt: `To reinforce this concept: If the scenario constraints were reversed, which factor would govern the equilibrium outcome?`,
            options: [
              { id: 'f-a', text: 'The factor with the lowest marginal latency.' },
              { id: 'f-b', text: 'The primary system bottleneck constraint.' },
              { id: 'f-c', text: 'Random environmental noise.' },
              { id: 'f-d', text: 'Past unrecoverable sunk costs.' },
            ],
            correctAnswerId: 'f-b',
            explanation: 'In complex systems, reversing operational constraints always places system limits at the bottleneck resource.',
            topic: question?.topic || 'General Reasoning',
            mode: 'apply',
          },
        },
      });
    }

    const systemInstruction = `You are APTIQ's Cognitive Diagnostic Tutor.
A learner answered an assessment question incorrectly.
Break down their mistake into:
1. Why their selected choice was incorrect.
2. Why the correct answer is valid.
3. The precise cognitive trap or misconception (e.g. availability bias, linear extrapolation of non-linear system, survivorship bias).
4. One new follow-up practice multiple-choice question to verify mastery of this exact concept.`;

    const promptText = `Question: "${question?.prompt}"
Learner's Incorrect Choice: "${selectedOption}"
Correct Answer: "${correctOption}"
Official Explanation: "${question?.explanation}"
Topic: "${question?.topic}"`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: promptText,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            whyIncorrect: { type: Type.STRING },
            whyCorrect: { type: Type.STRING },
            underlyingMisconception: { type: Type.STRING },
            followUpQuestion: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                prompt: { type: Type.STRING },
                options: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      text: { type: Type.STRING },
                    },
                    required: ['id', 'text'],
                  },
                },
                correctAnswerId: { type: Type.STRING },
                explanation: { type: Type.STRING },
                topic: { type: Type.STRING },
              },
              required: ['id', 'prompt', 'options', 'correctAnswerId', 'explanation'],
            },
          },
          required: ['whyIncorrect', 'whyCorrect', 'underlyingMisconception', 'followUpQuestion'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({
      isDemoMode: false,
      explanation: parsed,
    });
  } catch (error: any) {
    console.error('Explain Mistake Error:', error);
    res.status(500).json({ error: error?.message || 'Failed to analyze mistake' });
  }
});

// 5. Export ZIP endpoint: creates actual APTIQ.zip containing the entire project!
app.get('/api/export-zip', async (req, res) => {
  try {
    const zip = new JSZip();

    // Helper to recursively add files
    const addDirToZip = (dirPath: string, zipFolder: JSZip) => {
      const items = fs.readdirSync(dirPath);
      for (const item of items) {
        if (
          item === 'node_modules' ||
          item === '.git' ||
          item === 'dist' ||
          item === 'APTIQ.zip' ||
          item === '.env'
        ) {
          continue;
        }
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          addDirToZip(fullPath, zipFolder.folder(item)!);
        } else {
          const content = fs.readFileSync(fullPath);
          zipFolder.file(item, content);
        }
      }
    };

    addDirToZip(__dirname, zip);

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });

    // Save to disk at root so it can also be inspected
    fs.writeFileSync(path.join(__dirname, 'APTIQ.zip'), zipBuffer);

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="APTIQ.zip"');
    res.send(zipBuffer);
  } catch (err: any) {
    console.error('ZIP export error:', err);
    res.status(500).json({ error: 'Failed to generate zip archive' });
  }
});

// Deterministic Curriculum Generators (Guarantees zero downtime / works without API key)
function generateCuratedFallbackByDifficulty(topic: string, difficulty: string, mode: string = 'apply') {
  const cleanTopic = topic || 'Critical Thinking';
  if (difficulty === 'easy') {
    return {
      id: `fb-easy-${Date.now()}`,
      prompt: mode === 'recall'
        ? `What is the foundational definition and operational boundary of ${cleanTopic}?`
        : `A consumer products startup observes that customer reviews are 95% positive, but only 2% of total purchasers submitted a review. The founder claims this proves universal customer satisfaction. What sampling error makes this conclusion unreliable?`,
      mode,
      options: [
        { id: 'opt-e-a', text: 'Survivorship & self-selection bias: voluntary respondents hold extreme positive or negative views, distorting the representative median.' },
        { id: 'opt-e-b', text: 'Quantum tunneling measurement interference.' },
        { id: 'opt-e-c', text: 'The law of large numbers guarantees 2% is identical to 100% of the population.' },
        { id: 'opt-e-d', text: 'Customer reviews are legally required to be perfectly representative.' },
      ],
      correctAnswerId: 'opt-e-a',
      explanation: 'Voluntary response samples suffer from strong self-selection bias. Satisfied or motivated buyers disproportionately review, leaving the silent majority unrepresented.',
      misconceptionAlert: 'Assuming that unprompted voluntary reviews represent average user experience.',
      topic: cleanTopic,
      difficulty: 'easy',
      sourceReference: {
        section: 'Sampling Architecture & Selection Bias',
        passage: 'Voluntary feedback mechanisms over-sample extreme poles of the satisfaction distribution.',
      },
    };
  }

  if (difficulty === 'hard') {
    return {
      id: `fb-hard-${Date.now()}`,
      prompt: `In applying ${cleanTopic} to complex mission-critical systems, an engineering team eliminates single points of failure by introducing redundant parallel sub-systems. Surprisingly, systemic failure rates increase rather than decrease. According to Charles Perrow’s Normal Accidents Theory, why does added redundancy sometimes backfire?`,
      mode,
      options: [
        { id: 'opt-h-a', text: 'Interactive complexity and tight coupling: redundant safety devices introduce novel unforeseen failure pathways and cognitive overconfidence.' },
        { id: 'opt-h-b', text: 'Hardware components manufactured in parallel cancel out each other’s electrical potential.' },
        { id: 'opt-h-c', text: 'Redundancy violates the law of conservation of momentum.' },
        { id: 'opt-h-d', text: 'Systems with duplicate parts cannot execute Boolean logic.' },
      ],
      correctAnswerId: 'opt-h-a',
      explanation: 'In complex adaptive systems, redundancy increases interactive complexity. Unplanned interactions between safety mechanisms create obscure failure modes, while operator risk compensation leads to lower vigilance.',
      misconceptionAlert: 'Assuming adding protective components linearly increases reliability without creating second-order interaction risks.',
      topic: cleanTopic,
      difficulty: 'hard',
      sourceReference: {
        section: 'System Safety & Normal Accidents',
        passage: 'Redundancy adds parts and complexity, often increasing interactive coupling and unexpected failure modes.',
      },
    };
  }

  // Medium
  return {
    id: `fb-med-${Date.now()}`,
    prompt: `When evaluating conflicting evidence in ${cleanTopic}, an organization observes that increasing observation count shrinks statistical sampling error, but predictions remain consistently inaccurate. What foundational principle resolves this paradox?`,
    mode,
    options: [
      { id: 'opt-m-a', text: 'Precision vs Accuracy: sample size reduces random variance, but systematic instrument bias or unrepresentative collection remains invariant to N.' },
      { id: 'opt-m-b', text: 'Data collection is completely irrelevant to predictive accuracy.' },
      { id: 'opt-m-c', text: 'The central limit theorem fails whenever observations exceed 100 items.' },
      { id: 'opt-m-d', text: 'Linear models always outperform non-linear models in stochastic environments.' },
    ],
    correctAnswerId: 'opt-m-a',
    explanation: 'A larger sample size refines precision (clustering) but cannot correct systematic bias. A massive biased sample merely produces a highly confident error.',
    misconceptionAlert: 'Believing larger dataset volume inherently cures systematic collection bias.',
    topic: cleanTopic,
    difficulty: 'medium',
    sourceReference: {
      section: 'Epistemology of Measurement',
      passage: 'Precision describes clustering; accuracy describes alignment with ground truth.',
    },
  };
}

function generateCuratedFallbackQuestions(topic: string, mode: string, count: number, difficulty: string) {
  const isApply = mode === 'apply' || mode === 'mixed';
  const questions = [
    {
      id: `fb-q-1-${Date.now()}`,
      prompt: isApply
        ? `In applying ${topic} to high-uncertainty decisions, an organization observes that previous successes lead teams to underestimate tail risk. Which cognitive mechanism explains this drift toward vulnerability?`
        : `What is the foundational definition and operational boundary of ${topic}?`,
      mode: isApply ? 'apply' : 'recall',
      options: [
        { id: 'opt-a', text: 'Active de-escalation of commitment through randomized stress testing.' },
        { id: 'opt-b', text: 'Outcome bias and creeping normality (normalization of deviance).' },
        { id: 'opt-c', text: 'Strict adherence to Bayesian probabilistic updating.' },
        { id: 'opt-d', text: 'Zero-risk bias eliminating all low-probability scenarios.' },
      ],
      correctAnswerId: 'opt-b',
      explanation:
        'When teams evaluate decisions solely based on favorable outcomes rather than sound process rigor, they normalize deviance. Past luck is mistaken for operational resilience, expanding latent vulnerability.',
      misconceptionAlert:
        'Believing that a good result proves the decision process was sound. In stochastic environments, flawed logic can succeed by chance.',
      topic,
      difficulty,
      sourceReference: {
        section: 'Risk Architecture & Cognitive Blind Spots',
        passage: 'Normalization of deviance occurs when unacceptable risks become tolerated because no catastrophe immediately follows.',
      },
    },
    {
      id: `fb-q-2-${Date.now()}`,
      prompt:
        `When evaluating conflicting data in ${topic}, a researcher notes that increasing sample size does not reduce systematic measurement skew. What is the fundamental distinction highlighted here?`,
      mode: 'apply',
      options: [
        { id: 'opt-a', text: 'High sample sizes eliminate all forms of bias automatically.' },
        { id: 'opt-b', text: 'Variance decreases with larger sample size, but systematic bias (uncalibrated instruments or selection skew) remains constant.' },
        { id: 'opt-c', text: 'Measurement error is mathematically equivalent to random white noise.' },
        { id: 'opt-d', text: 'Standard error increases proportionally with observation frequency.' },
      ],
      correctAnswerId: 'opt-b',
      explanation:
        'Increasing statistical sample size shrinks variance (random sampling error), but systematic bias (instrument calibration, non-random response) is unaffected by N. A larger biased sample only produces a more confident error.',
      misconceptionAlert:
        'Assuming "Big Data" inherently corrects for non-representative collection protocols.',
      topic,
      difficulty,
      sourceReference: {
        section: 'Epistemology of Measurement',
        passage: 'Precision describes clustering; accuracy describes alignment with ground truth. Large N refines precision without repairing accuracy.',
      },
    },
    {
      id: `fb-q-3-${Date.now()}`,
      prompt: isApply
        ? `Consider two competing hypotheses explaining an unexpected anomaly in ${topic}. Hypothesis X requires four novel unverified assumptions; Hypothesis Y explains the data using established boundary conditions. According to Occam’s Razor, what is the rational stance?`
        : `Which principle states that among competing hypotheses explaining the same data, the one with the fewest assumptions should be selected first?`,
      mode: isApply ? 'apply' : 'recall',
      options: [
        { id: 'opt-a', text: 'Occam’s Razor; prioritize Hypothesis Y as the default baseline before adopting unparsimonious entities.' },
        { id: 'opt-b', text: 'Hanlon’s Razor; assume malicious interference by competitors.' },
        { id: 'opt-c', text: 'Moore’s Law; assume exponential capability changes overnight.' },
        { id: 'opt-d', text: 'Parkinson’s Law; expand hypothesis scope to encompass all variables.' },
      ],
      correctAnswerId: 'opt-a',
      explanation:
        'Occam’s Razor (the principle of parsimony) mandates that pluralities should not be posited without necessity. While the simpler explanation is not guaranteed to be true, it forms the rigorous prior baseline because it carries fewer failure modes.',
      misconceptionAlert:
        'Treating Occam’s Razor as proof of truth rather than a methodological heuristic for hypothesis prioritization.',
      topic,
      difficulty,
      sourceReference: {
        section: 'Scientific Methodology and Parsimony',
        passage: 'Lex Parsimoniae dictates selecting the model that introduces the fewest auxiliary assumptions.',
      },
    },
    {
      id: `fb-q-4-${Date.now()}`,
      prompt:
        `In ${topic}, what is the primary risk of relying exclusively on recall-based memorization when confronting a novel real-world breakdown?`,
      mode: 'apply',
      options: [
        { id: 'opt-a', text: 'Recall-based memory is too slow compared to intuitive guessing.' },
        { id: 'opt-b', text: 'Negative transfer: applying remembered answers to superficially similar problems with structurally altered boundary conditions.' },
        { id: 'opt-c', text: 'Memorization causes permanent degradation of sensory visual processing.' },
        { id: 'opt-d', text: 'Textbook solutions always yield 100% precision in real environments.' },
      ],
      correctAnswerId: 'opt-b',
      explanation:
        'Negative transfer occurs when past memorized associations interfere with learning or problem-solving in a new context. Learners misapply past answers because the surface cues match, failing to notice that underlying causal variables differ.',
      misconceptionAlert:
        'Believing knowledge is purely accumulated facts rather than structural relational models.',
      topic,
      difficulty,
      sourceReference: {
        section: 'Cognitive Science of Problem Solving',
        passage: 'Deep structure determines mechanism; surface structure merely decorates the presentation.',
      },
    },
  ];

  return questions.slice(0, count);
}

function generateCuratedRubricEvaluation(userAnalysis: any) {
  const textLength =
    (userAnalysis?.evidenceAnalysis?.length || 0) +
    (userAnalysis?.hiddenAssumptions?.length || 0) +
    (userAnalysis?.tradeoffsAndAlternatives?.length || 0) +
    (userAnalysis?.finalDecision?.length || 0);

  const depthBonus = textLength > 200 ? 1 : 0;

  return {
    clarity: Math.min(5, 3 + depthBonus),
    evidence: Math.min(5, 3 + depthBonus),
    assumptions: Math.min(5, 4),
    alternatives: Math.min(5, 3 + depthBonus),
    consistency: 4,
    conclusion: Math.min(5, 3 + depthBonus),
    totalScore: 20 + depthBonus * 4,
    feedbackComments: {
      strengths: [
        'Identified the primary tension between superficial metrics and systemic root causes.',
        'Structured clear trade-offs instead of assuming an effortless single-variable solution.',
      ],
      blindSpots: [
        'Could probe deeper into second-order incentives (how rational actors adapt to the new policy).',
        'Consider verifying whether the initial baseline data suffered from self-selection or sampling bias.',
      ],
      actionableImprovement:
        'To elevate this to an executive-grade argument, explicitly quantify the downside tail risk of your recommended alternative.',
    },
  };
}

function generateCuratedPromptEvaluation(prompt: string, objective: string) {
  const isShort = (prompt || '').length < 60;
  return {
    clarityScore: isShort ? 54 : 78,
    ambiguitiesFound: [
      'Unspecified target persona and domain depth (e.g. beginner student vs. principal engineer).',
      'No explicit negative constraints (what the AI must NOT do or assume).',
      'Output format lacks strict structural boundaries (e.g., bulleted rubric vs. JSON vs. prose).',
    ],
    suggestedImprovements: [
      'Define an explicit role context ("You are a Lead Systems Architect specializing in...").',
      'Incorporate boundary conditions to prevent generic introductory filler.',
      'Enforce verifiable output criteria with step-by-step reasoning verification.',
    ],
    optimizedPrompt: `Act as a senior expert in ${objective || 'the target domain'}.\nYour task is: ${prompt}.\n\nContext & Boundaries:\n- Focus strictly on verified first-principles mechanisms.\n- Do not include generic marketing introductory fluff or conversational sign-offs.\n- Structure your response into: 1. Core Diagnosis, 2. Root Cause Analysis, 3. Trade-offs Matrix, and 4. Concrete Next Steps.\n- Flag any assumptions where evidence is uncertain.`,
    rationale:
      'The optimized prompt bounds the model search space, eliminates hallucination through explicit structure, and establishes quality standards.',
  };
}

// Development Vite integration vs Production static serving
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 APTIQ Server listening on http://0.0.0.0:${PORT}`);
    console.log(`Gemini API configured: ${Boolean(apiKey)} (Model: ${GEMINI_MODEL})`);
  });
}

setupServer().catch((err) => {
  console.error('Server startup failed:', err);
});
