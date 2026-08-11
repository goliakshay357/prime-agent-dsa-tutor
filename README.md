# Prime Agent DSA Tutor

A Socratic DSA (Data Structures & Algorithms) tutor packaged as a [Prime Agent](https://github.com/PrimeIntellect-ai/prime-agent) extension.

## What it does

Teaches DSA patterns through a **brute-force → optimized progression** with interactive **Three.js 3D HTML visualizations**. Designed for learners with ADHD who struggle with abstract concepts.

Every lesson follows the same psychology: "What am I recomputing? What am I storing unnecessarily?"

## Install

```bash
# From git
prime-agent package install git:github.com/USER/prime-agent-dsa-tutor

# From local path (for development)
prime-agent package install ./prime-agent-dsa-tutor

# Try without installing
prime-agent -e ./prime-agent-dsa-tutor/extensions/dsa-tutor.ts
```

## What's included

### Extension
- `dsa-tutor.ts` — Injects Socratic teaching persona. Generates interactive HTML visualizations.

### Skills (9)
| Skill | What it teaches |
|-------|----------------|
| `dsa-sliding-window` | Fixed/dynamic windows — from O(n³) to O(n) |
| `dsa-two-pointers` | Converging pointers — exploiting sorted order |
| `dsa-binary-search` | Halving the search space — O(log n) |
| `dsa-bfs` | Level-by-level exploration — shortest path |
| `dsa-dfs` | Deep-first with backtracking — all paths |
| `dsa-hash-table` | Trading space for time — O(1) lookup |
| `dsa-dynamic-programming` | Memoization → tabulation → space optimization |
| `dsa-visual-teacher` | How to build interactive Three.js HTML viz |
| `i-have-adhd` | ADHD-friendly output formatting |

### Prompts (6)
| Command | What it does |
|---------|-------------|
| `/teach <pattern> [problem]` | Full teaching session with 3D HTML generation |
| `/viz <algorithm> <stage>` | Generate just the HTML visualization |
| `/practice <pattern> [difficulty]` | Generate a practice problem |
| `/compare <pattern> <problem>` | Side-by-side brute force vs optimized |
| `/debug-thinking <pattern>` | Guided debugging of your approach |
| `/quiz-me <pattern>` | 3-question understanding check |

## How it works

1. Pick a pattern: `/teach sliding-window`
2. Agent explains brute force first — the obvious human approach
3. Shows what's being recomputed (highlighted in red)
4. Generates a self-contained `problem-brute-force-3d.html` you can open in any browser
5. Progresses through optimization stages: brute force → memoization → tabulation → space optimization
6. Each stage gets its own interactive HTML with Next/Back/Auto controls

## License

MIT
