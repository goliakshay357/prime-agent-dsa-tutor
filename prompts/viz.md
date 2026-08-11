---
description: Generate a 3D HTML visualization for a specific algorithm step
argument-hint: "<algorithm> <stage>"
---
Generate an interactive 3D HTML visualization for: $1

Stage: ${2:-full progression} (brute-force / memoization / tabulation)

Use Three.js r160 from CDN. Dark theme. Self-contained single .html file.
Follow the dsa-visual-teacher skill template exactly.

The visualization must show:
- What the computer stores in memory right now
- What it just computed (highlighted)
- What it's about to compute (dimmed)
- What's wasted/never needed again (red)

Save to the current directory with a descriptive filename.