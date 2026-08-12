import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

// ═══════════ TEACHING PERSONA ═══════════
const TEACHING_PROMPT = `You are a DSA teacher for someone with ADHD who struggles with abstract concepts and has weak working memory. Your student has NO pen and paper — everything must live on screen.

## Core Teaching Philosophy

You explain how a HUMAN thinks through a problem over time. Start with the naive, obvious approach (brute force). Only then identify WHY it's slow — and the answer is always one of two things:
- "You are recomputing the same thing again and again"
- "You are storing things you never use again"

This is the psychology of ALL algorithm optimization. Lead with this.

## Teaching Rules

### 1. One approach at a time
Explain ONE approach fully. The progression is always: brute force first, then optimized approaches one by one. Never explain two approaches in the same turn.

### 2. Concrete before abstract
Start every concept with the problem's ACTUAL data (real strings, arrays, numbers). Draw it. Only introduce variable names (i, j, dp[i]) AFTER the idea is clear in plain English.

### 3. Visualize what the computer stores
Always show: what the computer holds in memory NOW, what it just computed, what it's about to compute, what it never needs again.

### 4. Generate interactive HTML visualizations
For each approach, generate a self-contained interactive HTML file. Follow the dsa-visual-teacher skill. Pick the template matching your data structure.

### 5. Signal when an approach is complete
When you have FULLY explained one approach — every step, with visualization — call the mark_approach_complete tool with the approach name. THEN ask the student to verify their understanding of the WHOLE approach.

Do NOT call mark_approach_complete for a sub-point or a clarification. Only call it when the entire approach is done.

### 6. Verify understanding before moving on
After calling mark_approach_complete, ask the student to explain the approach back in their own words. Do NOT start the next approach until they confirm.

If the student asks a sub-question mid-explanation, answer it, but do NOT mark the approach complete. Keep explaining until the whole approach is done.

### 7. Follow ADHD output rules
Lead with the next action. Number multi-step work. Restate state every turn. Suppress tangents. No preamble, no closing pleasantries.`;

// ═══════════ STATE MACHINE ═══════════
// [explaining] --mark_approach_complete--> [awaiting_confirmation]
// [awaiting_confirmation] --student "yes"--> [confirmed]
// [confirmed] --AI starts next approach--> [explaining]

interface ApproachState {
  currentApproach: string | null;   // e.g. "brute force", "memoization"
  awaitingConfirmation: boolean;    // AI called mark_approach_complete
  confirmed: boolean;               // student said yes
  history: Array<{ name: string; confirmed: boolean }>;
}

let state: ApproachState = {
  currentApproach: null,
  awaitingConfirmation: false,
  confirmed: false,
  history: [],
};

// ═══════════ SIGNAL DETECTION ═══════════

function detectUnderstanding(text: string): 'confirmed' | 'confused' | 'neutral' {
  const lower = text.toLowerCase();

  const confirmed = [
    'i understand', 'i got it', 'got it', 'makes sense', 'i see',
    'that makes sense', 'understood', 'i think i get it',
    'so basically', 'in other words', 'let me explain back',
    'so what you\'re saying', 'if i understand', 'ahh', 'aha',
    'okay', 'ok got', 'right', 'yes', 'yeah', 'yep', 'makes sense now',
  ];
  for (const s of confirmed) if (lower.includes(s)) return 'confirmed';

  const confused = [
    'i don\'t get it', 'don\'t understand', 'what do you mean',
    'huh', 'unclear', 'confused', 'i\'m lost', 'not following',
    'what is', 'how does', 'i don\'t know', 'not sure', 'wait',
  ];
  for (const s of confused) if (lower.includes(s)) return 'confused';

  return 'neutral';
}

// Broad approach keywords for the backstop (works across all DSA patterns)
const APPROACH_KEYWORDS: Array<{ name: string; pattern: RegExp }> = [
  { name: 'brute force', pattern: /\b(brute.?force|naive|exhaustive|try every|all possible paths?)\b/i },
  { name: 'memoization', pattern: /\b(memoiz|notebook|cache the result|store.*answer|write.*down)\b/i },
  { name: 'tabulation', pattern: /\b(tabulat|bottom.?up|fill.*table|dp table|dp array)\b/i },
  { name: 'space optimization', pattern: /\b(space.?optim|only.*last|two variables|constant space|don't need the whole)\b/i },
  { name: 'binary search', pattern: /\b(binary search|halve|divide.*half|log.*n)\b/i },
  { name: 'two pointers', pattern: /\b(two.?pointer|converg|left.*right.*pointer)\b/i },
  { name: 'sliding window', pattern: /\b(sliding window|expand.*shrink|window)\b/i },
  { name: 'hash table', pattern: /\b(hash.?table|hashmap|hash.?map|dictionary|lookup table)\b/i },
  { name: 'bfs', pattern: /\b(bfs|breadth.?first|level.?by.?level|queue)\b/i },
  { name: 'dfs', pattern: /\b(dfs|depth.?first|backtrack|recursi)\b/i },
  { name: 'merge sort', pattern: /\b(merge sort|divide and conquer)\b/i },
  { name: 'quick sort', pattern: /\b(quick sort|partition|pivot)\b/i },
  { name: 'greedy', pattern: /\b(greedy|locally optimal)\b/i },
];

function detectApproaches(text: string): string[] {
  const found: string[] = [];
  for (const kw of APPROACH_KEYWORDS) {
    if (kw.pattern.test(text)) found.push(kw.name);
  }
  return [...new Set(found)];
}

function hasVerificationQuestion(text: string): boolean {
  const trimmed = text.trim();
  const last200 = trimmed.slice(-200);
  return (
    trimmed.endsWith('?') ||
    last200.includes('?') ||
    /explain.*back|your turn|try it|what.*think|does that make sense|in your own words|how would you/i.test(last200)
  );
}

function detectCodeDump(text: string): boolean {
  const codeBlocks = (text.match(/```/g) || []).length;
  return codeBlocks >= 6 && !hasVerificationQuestion(text);
}

// ═══════════ EXTENSION ═══════════

export default function (pi: ExtensionAPI) {
  // 1. Inject teaching persona
  pi.on("before_agent_start", async (event) => {
    let prompt = TEACHING_PROMPT + "\n\n" + event.systemPrompt;

    // Inject current teaching progress
    const progress = buildProgressNote();
    if (progress) prompt += "\n\n" + progress;

    return { systemPrompt: prompt };
  });

  // 2. THE CORE TOOL: AI signals "I'm done explaining this approach"
  pi.registerTool({
    name: "mark_approach_complete",
    label: "Mark Approach Complete",
    description:
      "Call this ONLY when you have FULLY explained one approach (brute force, memoization, etc.) — every step, with visualization. " +
      "Do NOT call it for a sub-point or a clarification. After calling, ask the student to verify they understood the WHOLE approach.",
    parameters: Type.Object({
      approach: Type.String({
        description: "Name of the approach just fully explained, e.g. 'brute force', 'memoization', 'binary search'",
      }),
    }),
    async execute(_toolCallId, params) {
      const approach = params.approach.trim().toLowerCase();

      // If there's an unconfirmed approach and this is a DIFFERENT one, the AI is jumping ahead
      if (state.currentApproach && state.awaitingConfirmation && !state.confirmed && approach !== state.currentApproach) {
        return {
          content: [
            {
              type: "text",
              text: `BLOCKED: You are trying to mark "${approach}" complete, but "${state.currentApproach}" has not been confirmed by the student yet. Go back to "${state.currentApproach}" and verify understanding first.`,
            },
          ],
          isError: true,
        };
      }

      state.currentApproach = approach;
      state.awaitingConfirmation = true;
      state.confirmed = false;

      // Record in history if new
      if (!state.history.find(h => h.name === approach)) {
        state.history.push({ name: approach, confirmed: false });
      }

      return {
        content: [
          {
            type: "text",
            text: `Approach "${approach}" marked complete. Now ask the student to verify their understanding of the WHOLE "${approach}" approach before moving on.`,
          },
        ],
      };
    },
  });

  // 3. Reset on session start
  pi.on("session_start", async () => {
    state = { currentApproach: null, awaitingConfirmation: false, confirmed: false, history: [] };
  });

  // 4. ENFORCEMENT: check every assistant response
  pi.on("turn_end", async (event) => {
    if (event.message.role !== 'assistant') return;

    const text = event.message.content
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('\n');

    // === VIOLATION 1: code dump without engagement ===
    if (detectCodeDump(text)) {
      pi.sendUserMessage(
        "Too much code with no engagement. End with a question. Ask the student to trace through the code with a concrete input.",
        { deliverAs: "steer" }
      );
      return;
    }

    // === VIOLATION 2: no verification question ===
    // Only enforce when the AI has marked an approach complete (i.e., should be asking for verification)
    if (state.awaitingConfirmation && !state.confirmed && !hasVerificationQuestion(text)) {
      pi.sendUserMessage(
        `You marked "${state.currentApproach}" complete but didn't ask the student to verify. Ask them to explain "${state.currentApproach}" back in their own words. END with a question.`,
        { deliverAs: "steer" }
      );
      return;
    }
  });

  // 5. Track student confirmation — ONLY counts when awaitingConfirmation is true
  pi.on("input", async (event) => {
    if (!state.awaitingConfirmation || state.confirmed) return { action: 'continue' };

    const understanding = detectUnderstanding(event.text);

    if (understanding === 'confirmed') {
      state.confirmed = true;
      state.awaitingConfirmation = false;

      // Update history
      const entry = state.history.find(h => h.name === state.currentApproach);
      if (entry) entry.confirmed = true;
    }

    // 'confused' or 'neutral' → leave awaitingConfirmation true, let AI re-explain

    return { action: 'continue' };
  });

  // 6. Block solution code writes (allow HTML viz and markdown)
  pi.on("tool_call", async (event) => {
    if (event.toolName === 'write' || event.toolName === 'edit') {
      const input = event.input as any;
      const path = input?.path || input?.file_path || '';
      if (path.endsWith('.html') || path.endsWith('.md')) return;

      if (/\.(py|js|ts|java|cpp|go|rs|swift|kt)$/.test(path)) {
        return {
          block: true,
          reason: "Teaching mode: don't write solution code unless the student explicitly asked after attempting. Generate an HTML visualization instead.",
        };
      }
    }
  });
}

function buildProgressNote(): string {
  const confirmed = state.history.filter(h => h.confirmed).map(h => h.name);
  const current = state.currentApproach;

  if (current && state.awaitingConfirmation && !state.confirmed) {
    const lines = [];
    if (confirmed.length > 0) {
      lines.push(`Approaches the student has confirmed: ${confirmed.join(', ')}.`);
    }
    lines.push(`CURRENT approach: "${current}" — fully explained, awaiting student confirmation.`);
    lines.push(`Do NOT start the next approach until the student confirms they understand "${current}".`);
    return lines.join('\n');
  }

  if (confirmed.length > 0) {
    return `Approaches the student has confirmed: ${confirmed.join(', ')}.`;
  }

  return '';
}
