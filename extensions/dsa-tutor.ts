import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

// ═══════════ TEACHING PERSONA ═══════════
const TEACHING_PROMPT = `You are a DSA teacher for someone with ADHD who struggles with abstract concepts and has weak working memory. Your student has NO pen and paper — everything must live on screen.

## Core Teaching Philosophy

You explain how a HUMAN thinks through a problem over time. Start with the naive, obvious approach (brute force). Only then identify WHY it's slow — and the answer is always one of two things:
- "You are recomputing the same thing again and again"
- "You are storing things you never use again"

This is the psychology of ALL algorithm optimization. Lead with this.

## Teaching Rules

### 1. One approach at a time, one step at a time
Explain the CURRENT approach fully. The progression is always: brute force first → then optimized approaches one by one. Never explain two approaches in the same turn.

### 2. Concrete before abstract
Start every concept with the problem's ACTUAL data (real strings, real arrays, real numbers).
Only introduce variable names (i, j, dp[i]) AFTER the idea is clear in plain English.

### 3. Visualize what the computer stores
When explaining any algorithm, always show:
- What the computer is holding in memory RIGHT NOW
- What it just computed
- What it's about to compute
- What it never needs again (wasted storage)

### 4. Generate interactive HTML visualizations
For each approach, generate a self-contained interactive HTML file. Follow the dsa-visual-teacher skill. Pick the template matching your data structure (recursion tree, array pointers, graph traversal).

### 5. VERIFY UNDERSTANDING AFTER EVERY APPROACH
After explaining ONE approach (brute force, or one optimization), you MUST:
- Ask the student to explain it back in their own words
- Do NOT move to the next approach until they confirm understanding
- If confused, ask "which step breaks first" and re-explain ONLY that step
- Never restart the whole explanation

### 6. Follow ADHD output rules
Lead with the next action. Number multi-step work. Restate state every turn. Suppress tangents. No preamble, no closing pleasantries.`;

// ═══════════ DYNAMIC STAGE TRACKING ═══════════
// Concepts are discovered from the conversation, not hardcoded.
// Works for any problem: DP (brute→memo→tab), binary search (linear→binary), 
// sliding window (nested→window), sorting (bubble→merge→quick), etc.

interface TrackedConcept {
  name: string;           // e.g., "brute force", "memoization", "merge sort"
  explained: boolean;     // AI has explained this concept
  confirmed: boolean;     // student confirmed understanding
}

let concepts: TrackedConcept[] = [];
let currentConceptIndex = -1;  // -1 = nothing being taught yet
let turnsWithoutQuestion = 0;

// ═══════════ SIGNAL DETECTION ═══════════

function detectUnderstanding(text: string): 'confirmed' | 'confused' | 'neutral' {
  const lower = text.toLowerCase();

  const confirmed = [
    'i understand', 'i got it', 'got it', 'makes sense', 'i see',
    'that makes sense', 'clear', 'understood', 'i think i get it',
    'so basically', 'in other words', 'let me explain back',
    'so what you\'re saying', 'if i understand', 'ahh', 'aha',
    'okay', 'ok got', 'right', 'yes', 'yeah',
  ];
  for (const s of confirmed) if (lower.includes(s)) return 'confirmed';

  const confused = [
    'i don\'t get it', 'don\'t understand', 'what do you mean',
    'huh', 'unclear', 'confused', 'i\'m lost', 'not following',
    'can you explain that', 'what is', 'how does', 'i don\'t know',
    'not sure', 'wait',
  ];
  for (const s of confused) if (lower.includes(s)) return 'confused';

  return 'neutral';
}

// Detect concepts being introduced in an AI response
// Looks for patterns like: "Now let's look at X" or "Stage 2: X" or "## X Approach"
function detectNewConcepts(text: string): string[] {
  const found: string[] = [];
  const patterns = [
    /(?:now|next|then)\s+(?:let'?s?\s+)?(?:look at|try|use|apply|consider)\s+(?:the\s+)?([^,.!]+?(?:approach|method|solution|technique|algorithm|way))/gi,
    /(?:stage|step|phase|approach)\s*\d+\s*:?\s*([^,.!\n]+)/gi,
    /#+\s*(.+?(?:approach|method|solution|technique))[:\s]/gi,
    /\b(brute.?force|naive|exhaustive|linear scan)\b/gi,
    /\b(memoiz|tabulation|bottom.?up|dynamic programming)\b/gi,
    /\b(binary search|two.?pointer|sliding window|hash|set|dictionary)\b/gi,
    /\b(merge sort|quick sort|bubble sort|heap sort|counting sort)\b/gi,
    /\b(bfs|dfs|dijkstra|topological|union.?find)\b/gi,
    /\b(greedy|backtracking|divide and conquer)\b/gi,
    /\b(space.?optim|only.*last|two.*variable|constant space)\b/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const name = (match[1] || match[0]).trim().toLowerCase();
      if (name.length > 2 && name.length < 60) found.push(name);
    }
  }

  // Deduplicate similar names
  return [...new Set(found)];
}

function hasVerificationQuestion(text: string): boolean {
  const trimmed = text.trim();
  const last200 = trimmed.slice(-200);

  return (
    trimmed.endsWith('?') ||
    last200.includes('?') ||
    /explain.*back|your turn|try it|what.*think|does that make sense|in your own words|how would you/i.test(last200) ||
    /can you (tell|explain|describe|summarize|walk)/i.test(last200) ||
    /what.*(next|happen|wrong|missing)/i.test(last200)
  );
}

function detectCodeDump(text: string): boolean {
  const codeBlocks = (text.match(/```/g) || []).length;
  const lines = text.split('\n').filter(l => l.trim().length > 0).length;
  return codeBlocks >= 6 && !hasVerificationQuestion(text);
}

function detectTooManyConcepts(text: string): boolean {
  // Count distinct concept mentions
  const found = detectNewConcepts(text);
  // "brute force" is always allowed in the first response
  const nonBruteForce = found.filter(c => !c.includes('brute') && !c.includes('naive'));
  return nonBruteForce.length >= 2;
}

// ═══════════ EXTENSION ═══════════

export default function (pi: ExtensionAPI) {
  // 1. Inject teaching persona
  pi.on("before_agent_start", async (event) => {
    return { systemPrompt: TEACHING_PROMPT + "\n\n" + event.systemPrompt };
  });

  // 2. Reset state on new session
  pi.on("session_start", async () => {
    concepts = [];
    currentConceptIndex = -1;
    turnsWithoutQuestion = 0;
  });

  // 3. ENFORCEMENT: Check every assistant response
  pi.on("turn_end", async (event, ctx) => {
    if (event.message.role !== 'assistant') return;

    const text = event.message.content
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('\n');

    // Detect what concepts the AI is trying to explain
    const mentionedConcepts = detectNewConcepts(text);

    // Track new concepts
    for (const name of mentionedConcepts) {
      if (!concepts.find(c => c.name === name)) {
        concepts.push({ name, explained: true, confirmed: false });
      }
    }

    // === VIOLATION 1: Too many concepts at once ===
    if (detectTooManyConcepts(text)) {
      pi.sendUserMessage(
        "STOP. You mentioned multiple optimization approaches in one response. Pick ONE. Explain it fully. The student hasn't even confirmed they understood the previous concept yet. ONE approach per response.",
        { deliverAs: "steer" }
      );
      return;
    }

    // === VIOLATION 2: Code dump without engagement ===
    if (detectCodeDump(text)) {
      pi.sendUserMessage(
        "Too much code with no engagement. End with a question. Ask the student to trace through the code with a concrete input.",
        { deliverAs: "steer" }
      );
      return;
    }

    // === VIOLATION 3: No verification question ===
    if (!hasVerificationQuestion(text)) {
      turnsWithoutQuestion++;
      if (turnsWithoutQuestion >= 2) {
        pi.sendUserMessage(
          "You haven't asked a verification question in " + turnsWithoutQuestion + " turns. Ask the student to explain the current approach back in their own words. END with a question.",
          { deliverAs: "steer" }
        );
      }
    } else {
      turnsWithoutQuestion = 0;
    }
  });

  // 4. Track student confirmation
  pi.on("input", async (event) => {
    if (concepts.length === 0) return { action: 'continue' };

    const understanding = detectUnderstanding(event.text);

    if (understanding === 'confirmed') {
      // Mark the most recent unconfirmed concept as confirmed
      for (let i = concepts.length - 1; i >= 0; i--) {
        if (concepts[i].explained && !concepts[i].confirmed) {
          concepts[i].confirmed = true;
          break;
        }
      }
    }

    if (understanding === 'confused') {
      // Reset confirmation — needs re-explanation
      for (let i = concepts.length - 1; i >= 0; i--) {
        if (concepts[i].explained && !concepts[i].confirmed) {
          concepts[i].confirmed = false;
          break;
        }
      }
    }

    return { action: 'continue' };
  });

  // 5. Before next agent start, inject concept progress
  pi.on("before_agent_start", async () => {
    if (concepts.length === 0) return;

    const unconfirmed = concepts.filter(c => !c.confirmed).map(c => c.name);
    const confirmed = concepts.filter(c => c.confirmed).map(c => c.name);

    let progressNote = '';
    if (confirmed.length > 0) {
      progressNote += `\nConcepts student has confirmed understanding: ${confirmed.join(', ')}.`;
    }
    if (unconfirmed.length > 0) {
      progressNote += `\nCURRENT concept student needs to understand: ${unconfirmed[0]}. Do NOT move past this until confirmed.`;
    }

    if (progressNote) {
      return { systemPrompt: progressNote };
    }
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
          reason: "Teaching mode: don't write solution code unless the student explicitly asked after attempting. Generate an HTML visualization instead."
        };
      }
    }
  });
}
