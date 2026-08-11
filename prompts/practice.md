---
description: Generate a practice problem for a DSA pattern at a specified difficulty
argument-hint: "<pattern> [difficulty]"
---
Give me a practice problem for the $1 pattern at ${2:-medium} difficulty.

Rules:
1. Describe the problem clearly with a concrete example.
2. State the constraints.
3. Let ME attempt the solution. Do NOT write any code until I ask.
4. If I'm stuck after my first attempt, give me ONE hint (not the answer).
5. After I solve it, review my approach and discuss time/space complexity.
6. Show me one alternative approach if one exists.

Before generating, read the skill file for $1 to match the problem style and difficulty scaling used there.