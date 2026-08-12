# Prime Agent DSA Tutor

A Socratic DSA tutor for people who find algorithms hard to understand. Built as a [Prime Agent](https://github.com/PrimeIntellect-ai/prime-agent) package.

---

## The Problem

Most DSA explanations are written for people who already think in code. They dump the optimized solution, use `dp[i][j]` notation on line one, and skip the part where a human brain actually goes: *"why would anyone think to do it this way?"*

For a learner with ADHD, weak working memory, and no pen and paper, that style fails instantly. Abstract symbols don't stick. Code dumps don't stick. What sticks is a concrete picture and a story about **why**.

The core problem this solves:

> How do you teach someone to *think* like the computer iterates — seeing what it stores, what it recomputes, what it throws away — instead of just memorizing a pattern?

---

## The Solution

Teach the way a human reasons, not the way a textbook writes.

Every DSA problem reduces to one of two questions:

1. **"Am I recomputing the same thing again and again?"** — if yes, store it (memoization, tabulation, sliding window, two pointers, hash table).
2. **"Am I storing things I never use again?"** — if yes, throw it away (space optimization, constant-space tricks).

This is the *entire* psychology of algorithm optimization. The tutor leads with this insight, never with the final code.

The progression is always the same, and it mirrors how the human brain actually works:

```
brute force  →  "why is it slow?"  →  optimized approach  →  "why is this one better?"
```

Each step is interactive. The learner presses **Next** through a 3D visualization of the actual data structure — the recursive tree growing, the pointer sliding, the table filling — while the code line that's executing lights up and the live variables update in sync.

---

## How It's Built (the 6 W's)

### Who

The learner: someone with ADHD, weak working memory, no pen and paper. Everything must live on screen and be concrete, visual, and one-step-at-a-time.

### What

A Prime Agent package that turns the AI into a Socratic tutor. It doesn't give answers — it asks guiding questions, draws the data structure, and makes the learner verify understanding before moving on.

### When

Whenever the learner is tackling a new pattern or a new problem. Trigger it with slash commands:

| Command | What happens |
|---------|-------------|
| `/teach <pattern> [problem]` | Full lesson: brute force → optimized, with 3D HTML generation |
| `/viz <algorithm> <stage>` | Generate just the interactive HTML for one stage |
| `/practice <pattern> [difficulty]` | Generate a problem for the learner to attempt |
| `/compare <pattern> <problem>` | Side-by-side brute force vs optimized |
| `/debug-thinking <pattern>` | Guided debugging of the learner's attempt |
| `/quiz-me <pattern>` | 3-question understanding check |

### Where

Runs inside Prime Agent (terminal-based AI agent). The visualizations are self-contained HTML files that open in any browser — no install, no server, works offline.

### Why

Because a system prompt that *says* "be patient and verify understanding" is only a suggestion. The AI can ignore it. What actually works is **enforcement** — code that intercepts the AI's responses and corrects them in real time.

The tutor has two layers:

1. **The persona** (system prompt) — tells the AI *what* good teaching looks like.
2. **The enforcement** (extension code) — makes sure the AI *actually does it*.

The enforcement catches:
- Explaining multiple approaches at once (should be one at a time)
- Code dumps without a verification question
- Responses that don't end by checking understanding
- Writing solution code before the learner attempted it

### How

Four pieces, all native Prime Agent features:

```
prime-agent-dsa-tutor/
├── extensions/
│   └── dsa-tutor.ts          ← the brain: persona + enforcement
├── skills/                   ← pattern knowledge (the AI reads these)
│   ├── dsa-sliding-window/
│   ├── dsa-two-pointers/
│   ├── dsa-binary-search/
│   ├── dsa-bfs/
│   ├── dsa-dfs/
│   ├── dsa-hash-table/
│   ├── dsa-dynamic-programming/
│   ├── dsa-visual-teacher/   ← how to build the HTML viz
│   └── i-have-adhd/          ← output formatting rules
├── prompts/                  ← slash commands
│   ├── teach.md, viz.md, practice.md,
│   ├── compare.md, debug-thinking.md, quiz-me.md
└── templates/ (inside dsa-visual-teacher)
    ├── skeleton-3d-template.html       ← recursion tree (DP, backtracking)
    ├── array-pointers.html             ← binary search, two pointers, sliding window
    ├── graph-traversal.html            ← BFS, DFS, Dijkstra
    └── ...reference implementations
```

**How a skill works:** each `SKILL.md` teaches the AI one pattern — its core idea, physical metaphor, recognition signals, brute-force → optimized progression, and common mistakes. The AI reads the relevant skill when the learner picks a pattern.

**How a visualization works:** the AI adapts a template to the learner's specific problem. The result is one `.html` file with Next/Back/Auto buttons, a highlighted code panel, live variables, and a 3D scene (via Three.js) of the actual data structure. Fixed color coding: yellow = current, blue = dependency, green = answer, red = wasted/recomputed.

**How enforcement works:** the extension subscribes to the agent's lifecycle events. After every AI response, it checks the response against the teaching rules. If violated, it injects a corrective message. Before every response, it injects the learner's progress so the AI knows exactly where they are.

---

## Install

```bash
prime-agent package install git:github.com/goliakshay357/prime-agent-dsa-tutor
```

Or from a local path:

```bash
prime-agent package install /path/to/prime-agent-dsa-tutor
```

## Usage

```bash
prime-agent                 # start a session
/teach dp "climbing stairs" # full lesson with 3D viz
```

---

## How It Improves

The package is future-proof by design:

- **New pattern?** Add one `SKILL.md` file. No code changes.
- **New algorithm type?** Add one HTML template. Update the skill to point at it.
- **Teaching style drift?** Edit the persona in `dsa-tutor.ts`, or use Prime Agent's harness (`refine`) to persist a memory like "this learner responds well to food metaphors".
- **Is it working?** Validate by checking: does the AI use metaphors? Draw the data? End with a question? Refuse to give answers? Each is a testable behavior, not a vague feeling.

## License

MIT
