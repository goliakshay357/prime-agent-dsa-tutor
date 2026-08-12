import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

// ═══════════ TEACHING PERSONA (injected into system prompt) ═══════════
const TEACHING_PROMPT = `You are a DSA teacher for someone with ADHD who struggles with abstract concepts and has weak working memory. Your student has NO pen and paper — everything must live on screen.

## Core Teaching Philosophy

You explain how a HUMAN thinks through a problem over time. Start with the naive, obvious approach (brute force). Only then identify WHY it's slow — and the answer is always one of two things:
- "You are recomputing the same thing again and again"
- "You are storing things you never use again"

This is the psychology of ALL algorithm optimization. Lead with this.

## Teaching Rules

### 1. One approach at a time, one step at a time
Explain brute force first. Fully. Only when the student says they understand, move to the optimized version.
DO NOT explain memoization and tabulation in the same turn. They are separate approaches.
DO NOT jump to "the DP solution" before the student has internalized why brute force fails.

### 2. Concrete before abstract
Start every concept with the problem's ACTUAL data (real strings, real arrays, real numbers). Draw the data as it exists in the computer's memory.
Only introduce variable names (i, j, dp[i]) AFTER the idea is already clear in plain English.

### 3. Visualize what the computer stores
When explaining any algorithm, always show:
- What the computer is holding in memory RIGHT NOW
- What it just computed
- What it's about to compute
- What it never needs again (wasted storage)

### 4. Generate interactive HTML visualizations
When explaining a new algorithm, ALWAYS generate a self-contained interactive HTML file. Follow the dsa-visual-teacher skill's templates.

### 5. Verify understanding at every stage
After each major phase (brute force, memoization, tabulation, space optimization), ask the student to explain back what they understood in their own words. Do NOT move to the next phase until they do.
If confused, ask "which step breaks first" and re-explain ONLY that step.

### 6. Follow ADHD output rules
Lead with the next action. Number multi-step work. Restate state every turn. Suppress tangents. No preamble, no closing pleasantries.`;

// ═══════════ STATE TRACKING ═══════════
// Tracks which teaching stage we're in and whether the student confirmed
interface TutorState {
  stage: 'idle' | 'brute-force' | 'memoization' | 'tabulation' | 'space-opt';
  stageConfirmed: boolean;
  lastResponseWasQuestion: boolean;
  turnCount: number;
}

let state: TutorState = { stage: 'idle', stageConfirmed: false, lastResponseWasQuestion: false, turnCount: 0 };

// ═══════════ UNDERSTANDING SIGNALS ═══════════
// Words/phrases that indicate the student understood
const CONFIRMATION_SIGNALS = [
  'i understand', 'i got it', 'got it', 'makes sense', 'i see',
  'that makes sense', 'clear', 'understood', 'i think i get it',
  'so basically', 'in other words', 'let me explain back',
  'so what you\'re saying', 'if i understand',
];

// Words/phrases that indicate confusion — need to re-explain
const CONFUSION_SIGNALS = [
  'i don\'t get it', 'don\'t understand', 'what do you mean',
  'huh', 'unclear', 'confused', 'i\'m lost', 'not following',
  'can you explain', 'what is', 'how does', 'why',
  'i don\'t know', 'not sure', 'wait',
];

// ═══════════ ENFORCEMENT FUNCTIONS ═══════════

function detectUnderstanding(text: string): 'confirmed' | 'confused' | 'neutral' {
  const lower = text.toLowerCase();
  for (const signal of CONFIRMATION_SIGNALS) {
    if (lower.includes(signal)) return 'confirmed';
  }
  for (const signal of CONFUSION_SIGNALS) {
    if (lower.includes(signal)) return 'confused';
  }
  return 'neutral';
}

function detectCodeDump(text: string): boolean {
  // Heuristic: if there's a large code block and no question mark
  const codeBlockCount = (text.match(/```/g) || []).length;
  const hasQuestion = text.includes('?');
  const hasVerifyPhrase = /explain.*back|your turn|try it|what do you think|does that make sense/i.test(text);
  return codeBlockCount >= 4 && !hasQuestion && !hasVerifyPhrase;
}

function detectStageJump(text: string): boolean {
  // Detects if the AI tried to explain multiple optimization stages in one response
  const stageKeywords = {
    'brute-force': /\b(brute.?force|naive|obvious approach|try every|all possible)\b/i,
    'memoization': /\b(memoiz|notebook|cache the result|store.*answer|write it down)\b/i,
    'tabulation': /\b(tabulat|bottom.?up|fill.*table|dp table|dp array)\b/i,
    'space-opt': /\b(space.*optim|only.*need.*last|don't need.*whole|two variables)\b/i,
  };

  let stagesMentioned = 0;
  for (const [stage, regex] of Object.entries(stageKeywords)) {
    if (regex.test(text)) stagesMentioned++;
  }
  return stagesMentioned >= 2 && state.stage === 'idle';
}

// ═══════════ EXTENSION =══════════

export default function (pi: ExtensionAPI) {
  // 1. Inject teaching persona
  pi.on("before_agent_start", async (event) => {
    return { systemPrompt: TEACHING_PROMPT + "\n\n" + event.systemPrompt };
  });

  // 2. ENFORCEMENT: Intercept every assistant response
  pi.on("turn_end", async (event, ctx) => {
    state.turnCount++;

    // Only check assistant messages
    if (event.message.role !== 'assistant') return;

    const text = event.message.content
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('\n');

    // === ENFORCEMENT 1: Detect stage jumps ===
    if (detectStageJump(text)) {
      pi.sendUserMessage(
        "You explained multiple optimization stages at once. Go back. Explain only ONE stage. The student needs to confirm understanding before moving on.",
        { deliverAs: "steer" }
      );
      return;
    }

    // === ENFORCEMENT 2: Detect code dumps without verification ===
    if (detectCodeDump(text)) {
      pi.sendUserMessage(
        "You dumped a lot of code without asking the student to engage. End EVERY response with a question that checks understanding. Ask them to explain back what they just learned.",
        { deliverAs: "steer" }
      );
      return;
    }

    // === ENFORCEMENT 3: Check if response ends with a question ===
    const trimmedText = text.trim();
    const endsWithQuestion = trimmedText.endsWith('?');
    const hasQuestionNearEnd = trimmedText.slice(-200).includes('?');
    const hasVerifyPhrase = /explain.*back|your turn|try it|what.*think|does that make sense|in your own words/i.test(trimmedText.slice(-300));

    state.lastResponseWasQuestion = endsWithQuestion || hasQuestionNearEnd || hasVerifyPhrase;

    if (!state.lastResponseWasQuestion && state.turnCount > 1) {
      pi.sendUserMessage(
        "Your response didn't end with a question. Always end by asking the student to verify understanding. Example: 'Can you explain back to me in your own words what the brute force approach does?'",
        { deliverAs: "steer" }
      );
    }
  });

  // 3. ENFORCEMENT: Check student responses for understanding
  pi.on("input", async (event) => {
    // Only check when we're in an active teaching stage
    if (state.stage === 'idle') return { action: 'continue' };

    const understanding = detectUnderstanding(event.text);

    if (understanding === 'confirmed') {
      state.stageConfirmed = true;
      // Don't intercept — let the AI see the confirmation
      return { action: 'continue' };
    }

    if (understanding === 'confused') {
      state.stageConfirmed = false;
      // Don't intercept — let the AI see the confusion and re-explain
      return { action: 'continue' };
    }

    // Neutral — student didn't explicitly confirm
    // If the AI just asked a verification question and the student gave a neutral answer,
    // nudge the AI to re-verify
    if (state.lastResponseWasQuestion && understanding === 'neutral') {
      // Let it pass but mark as unconfirmed
      state.stageConfirmed = false;
    }

    return { action: 'continue' };
  });

  // 4. ENFORCEMENT: Track teaching stages
  pi.on("before_agent_start", async (event) => {
    const prompt = typeof event.prompt === 'string' ? event.prompt : '';
    // Detect stage from teaching commands
    if (/brute.?force|naive/i.test(prompt) && /explain|teach|what.*approach/i.test(prompt)) {
      state = { stage: 'brute-force', stageConfirmed: false, lastResponseWasQuestion: false, turnCount: 0 };
    }
    if (/memoiz|notebook|cache/i.test(prompt)) {
      state = { stage: 'memoization', stageConfirmed: false, lastResponseWasQuestion: false, turnCount: 0 };
    }
    if (/tabulat|bottom.?up|table/i.test(prompt)) {
      state = { stage: 'tabulation', stageConfirmed: false, lastResponseWasQuestion: false, turnCount: 0 };
    }
  });

  // 5. Session start — reset state
  pi.on("session_start", async () => {
    state = { stage: 'idle', stageConfirmed: false, lastResponseWasQuestion: false, turnCount: 0 };
  });

  // 6. Block code-writing tools when in teaching mode
  pi.on("tool_call", async (event) => {
    if (event.toolName === 'write' || event.toolName === 'edit') {
      const input = event.input as any;
      const path = input?.path || input?.file_path || '';
      // Allow HTML visualization files
      if (path.endsWith('.html')) return;
      // Allow markdown skill files
      if (path.endsWith('.md')) return;

      // Block code files unless student explicitly asked
      if (/\.(py|js|ts|java|cpp|go|rs)$/.test(path)) {
        return {
          block: true,
          reason: "Teaching mode: don't write solution code unless the student explicitly asked for it after attempting. Generate an HTML visualization instead."
        };
      }
    }
  });
}
