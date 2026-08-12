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

### 4. RECOGNITION BEFORE SOLUTION
Before any code, help the learner identify WHICH pattern/sub-pattern the problem is. For DP, walk the recognition decision tree in the dsa-dp-patterns skill: input shape → transition → used/unused axis → pivot choice. Ask them: "Which pattern is this? What's the state? What does the transition read?" Do NOT start solving until they name the pattern.

### 5. Generate interactive HTML visualizations
For each approach, generate a self-contained interactive HTML file. Follow the dsa-visual-teacher skill. Pick the template matching your data structure.

### 6. Signal when an approach is complete
When you have FULLY explained one approach — every step, with visualization — call the mark_approach_complete tool with the approach name. THEN ask the student to verify their understanding of the WHOLE approach.

Do NOT call mark_approach_complete for a sub-point or a clarification. Only call it when the entire approach is done.

### 7. Verify understanding before moving on
After calling mark_approach_complete, ask the student to explain the approach back in their own words. Do NOT start the next approach until they confirm.

If the student asks a sub-question mid-explanation, answer it, but do NOT mark the approach complete. Keep explaining until the whole approach is done.

### 8. Follow ADHD output rules
Lead with the next action. Number multi-step work. Restate state every turn. Suppress tangents. No preamble, no closing pleasantries.`;

// ═══════════ STATE MACHINE (per-session) ═══════════
interface ApproachState {
  currentApproach: string | null;
  awaitingConfirmation: boolean;
  confirmed: boolean;
  history: Array<{ name: string; confirmed: boolean }>;
  turnCount: number;
  confirmStartTurn: number;   // turn when mark_approach_complete was called
}

let state: ApproachState = {
  currentApproach: null,
  awaitingConfirmation: false,
  confirmed: false,
  history: [],
  turnCount: 0,
  confirmStartTurn: 0,
};

// ═══════════ STUDENT PROFILE (cross-session, durable) ═══════════
interface PatternRecord {
  pattern: string;
  confirmed: number;          // times learner confirmed understanding
  struggled: number;          // times learner showed confusion before confirming
  timeToConfirm: number[];    // turns between "approach complete" and "yes" — lower is better
  lastConfirmedAt: number;    // unix ms
}

interface StudentProfile {
  version: 1;
  patterns: Record<string, PatternRecord>;
  totalSessions: number;
}

let profile: StudentProfile = { version: 1, patterns: {}, totalSessions: 0 };

function recordFor(pattern: string): PatternRecord {
  const key = pattern.trim().toLowerCase();
  if (!profile.patterns[key]) {
    profile.patterns[key] = {
      pattern: pattern.trim(),
      confirmed: 0,
      struggled: 0,
      timeToConfirm: [],
      lastConfirmedAt: 0,
    };
  }
  return profile.patterns[key];
}

// ═══════════ SIGNAL DETECTION ═══════════

function detectUnderstanding(text: string): 'confirmed' | 'confused' | 'neutral' {
  const lower = text.toLowerCase();

  const confirmed = [
    'i understand', 'i got it', 'got it', 'makes sense', 'i see',
    'that makes sense', 'understood', 'i think i get it',
    'so basically', 'in other words', 'let me explain back',
    'so what you\'re saying', 'if i understand', 'ahh', 'aha',
    'okay', 'ok got', 'right', 'yes', 'yeah', 'yep',
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

// ═══════════ PROFILE PERSISTENCE ═══════════

function serializeProfile(): Record<string, unknown> {
  // Keep only the durable parts (drop transient metrics we don't need to persist verbatim)
  return { version: 1, patterns: profile.patterns, totalSessions: profile.totalSessions };
}

function buildProfileNote(): string {
  const entries = Object.values(profile.patterns);
  if (entries.length === 0) return '';

  const mastered = entries.filter(p => p.confirmed >= 1).sort((a, b) => b.confirmed - a.confirmed);
  const weak = entries
    .filter(p => p.struggled > 0 && (p.struggled > p.confirmed || p.struggled >= 2))
    .sort((a, b) => b.struggled - a.struggled);

  const lines: string[] = [];
  if (mastered.length > 0) {
    lines.push(`Student has confirmed understanding of: ${mastered.map(p => p.pattern).join(', ')}.`);
  }
  if (weak.length > 0) {
    lines.push(`Student has STRUGGLED with: ${weak.map(p => `${p.pattern} (${p.struggled}×)`).join(', ')}. Spend extra turns here. Use a fresh metaphor, not the one that failed.`);
  }
  if (weak.length > 0 && mastered.length > 0) {
    lines.push(`Before introducing a NEW pattern, offer to revisit a weak one: ${weak[0].pattern}.`);
  }
  return lines.join('\n');
}

function buildProgressNote(): string {
  const confirmed = state.history.filter(h => h.confirmed).map(h => h.name);
  const current = state.currentApproach;

  if (current && state.awaitingConfirmation && !state.confirmed) {
    const lines = [];
    if (confirmed.length > 0) {
      lines.push(`Approaches the student has confirmed THIS session: ${confirmed.join(', ')}.`);
    }
    lines.push(`CURRENT approach: "${current}" — fully explained, awaiting student confirmation.`);
    lines.push(`Do NOT start the next approach until the student confirms they understand "${current}".`);
    return lines.join('\n');
  }

  if (confirmed.length > 0) {
    return `Approaches the student has confirmed THIS session: ${confirmed.join(', ')}.`;
  }
  return '';
}

function buildProfileSummary(): string {
  const entries = Object.values(profile.patterns);
  if (entries.length === 0) return 'No learning history yet. Teach me something first.';

  const lines = entries
    .sort((a, b) => b.confirmed - a.confirmed)
    .map(p => {
      const avgTime = p.timeToConfirm.length > 0
        ? (p.timeToConfirm.reduce((s, t) => s + t, 0) / p.timeToConfirm.length).toFixed(1)
        : '—';
      return `${p.pattern}: confirmed ${p.confirmed}×, struggled ${p.struggled}×, avg confirm ${avgTime} turns`;
    });
  return `DSA Learning Profile (${profile.totalSessions} session${profile.totalSessions === 1 ? '' : 's'}):\n\n${lines.join('\n')}`;
}

// ═══════════ EXTENSION ═══════════

export default function (pi: ExtensionAPI) {
  // 1. Inject teaching persona + progress + profile
  pi.on("before_agent_start", async (event) => {
    let prompt = TEACHING_PROMPT + "\n\n" + event.systemPrompt;

    const progress = buildProgressNote();
    if (progress) prompt += "\n\n## Session Progress\n" + progress;

    const profileNote = buildProfileNote();
    if (profileNote) prompt += "\n\n## Student Profile (from previous sessions)\n" + profileNote;

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
      state.confirmStartTurn = state.turnCount;

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

  // 3. Session start — load profile, reset per-session state
  pi.on("session_start", async (_event, ctx) => {
    state = {
      currentApproach: null,
      awaitingConfirmation: false,
      confirmed: false,
      history: [],
      turnCount: 0,
      confirmStartTurn: 0,
    };

    // Reconstruct the durable profile from the LAST "dsa-profile" entry
    const entries = ctx.sessionManager.getEntries();
    const lastProfile = entries
      .filter((e: any) => e.type === "custom" && e.customType === "dsa-profile")
      .pop() as { data?: StudentProfile } | undefined;

    if (lastProfile?.data && lastProfile.data.patterns) {
      profile = lastProfile.data;
    }
  });

  // 4. Persist profile on shutdown (final safety net)
  pi.on("session_shutdown", async () => {
    if (Object.keys(profile.patterns).length > 0) {
      pi.appendEntry("dsa-profile", serializeProfile());
    }
  });

  // 5. ENFORCEMENT: check every assistant response
  pi.on("turn_end", async (event) => {
    if (event.message.role !== 'assistant') return;
    state.turnCount++;

    const text = event.message.content
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('\n');

    if (detectCodeDump(text)) {
      pi.sendUserMessage(
        "Too much code with no engagement. End with a question. Ask the student to trace through the code with a concrete input.",
        { deliverAs: "steer" }
      );
      return;
    }

    if (state.awaitingConfirmation && !state.confirmed && !hasVerificationQuestion(text)) {
      pi.sendUserMessage(
        `You marked "${state.currentApproach}" complete but didn't ask the student to verify. Ask them to explain "${state.currentApproach}" back in their own words. END with a question.`,
        { deliverAs: "steer" }
      );
      return;
    }
  });

  // 6. Track student confirmation + struggle — persist profile on confirmation
  pi.on("input", async (event) => {
    if (!state.awaitingConfirmation || state.confirmed) return { action: 'continue' };

    const understanding = detectUnderstanding(event.text);

    if (understanding === 'confirmed') {
      state.confirmed = true;
      state.awaitingConfirmation = false;

      const entry = state.history.find(h => h.name === state.currentApproach);
      if (entry) entry.confirmed = true;

      // Update the durable profile
      const rec = recordFor(state.currentApproach || 'unknown');
      rec.confirmed++;
      rec.lastConfirmedAt = Date.now();
      const turnsToConfirm = Math.max(1, state.turnCount - state.confirmStartTurn + 1);
      rec.timeToConfirm.push(turnsToConfirm);

      // Persist immediately (natural checkpoint)
      pi.appendEntry("dsa-profile", serializeProfile());
    }

    if (understanding === 'confused') {
      // Record the struggle against the current approach
      if (state.currentApproach) {
        const rec = recordFor(state.currentApproach);
        rec.struggled++;
      }
      // Leave awaitingConfirmation = true so the AI re-explains
    }

    return { action: 'continue' };
  });

  // 7. Block solution code writes (allow HTML viz and markdown)
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

  // 8. /progress command — make wins visible
  pi.registerCommand("progress", {
    description: "Show your DSA learning profile (patterns confirmed, struggles, avg time to confirm)",
    handler: async (_args, ctx) => {
      ctx.ui.notify(buildProfileSummary(), "info");
    },
  });
}
