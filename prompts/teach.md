---
description: Full DSA teaching session with 3D visualization — brute force → optimized progression
argument-hint: "<pattern> [problem]"
---
Teach me: $1${2:+

Problem: $2}

Progression:
1. Start with brute force — the obvious human approach. Show what gets recomputed.
2. Identify the waste: "You are recomputing X again and again" or "You are storing Y you never reuse."
3. Show the optimized approach step by step.

For EACH approach (brute force AND optimized), generate a self-contained interactive Three.js HTML file with:
- 3D visualization of the actual data structure
- ▼ Next / ◀ Back / ↺ Reset buttons
- Code panel with current line highlighted yellow
- Live variables updating every step
- Color coding: yellow=current, blue=dependency, green=answer, red=wasted

Read the dsa-visual-teacher skill for the template. Read the dsa-$1 skill for pattern details.
Follow the i-have-adhd output rules. Verify I understand after each phase before moving on.