---
name: dsa-dynamic-programming
description: DP — from exponential brute force to polynomial by storing answers to overlapping subproblems
---

# Dynamic Programming

## The Psychology
This is THE pattern that answers: "Am I recomputing the same thing again and again?"

Brute force recursion explores every path. Many paths lead to the SAME subproblem. You solve `fib(2)` once, then again, then again. That's wasted work. The fix is embarrassingly simple: write down the answer the first time. Next time you need it, just look it up.

DP has exactly two forms:
1. **Memoization (top-down)**: "Keep a notebook. Before computing anything, check if you already solved it."
2. **Tabulation (bottom-up)**: "Fill a table from smallest subproblem to largest. Every cell depends only on cells you already filled."

Both answer the same question: "What am I recomputing that I could just... remember?"

## Physical Metaphor
Climbing stairs. To reach step 10, you come from step 9 or step 8. Ways to reach step 10 = ways(9) + ways(8). If you already wrote down ways(9) and ways(8), just add them. If you DIDN'T write them down, you recompute them — and they need ways(8) and ways(7), which need ways(7) and ways(6)... an explosion of recomputation.

## Recognition Signals
1. "How many ways", "minimum/maximum", "longest/shortest"
2. Can express answer in terms of smaller subproblems
3. Subproblems OVERLAP — same subproblem appears multiple times

## Three-Stage Progression

### Stage 1: Brute Force Recursion (exponential)
```python
def fib(n):
    if n <= 1: return n
    return fib(n-1) + fib(n-2)  # fib(2) computed 3×, fib(1) computed 5×
```
Count the recomputations. Show the tree. Every duplicate node is wasted work.

### Stage 2: Memoization (notebook, top-down)
```python
memo = {}
def fib(n):
    if n in memo: return memo[n]   # "Already solved this!"
    if n <= 1: return n
    memo[n] = fib(n-1) + fib(n-2)  # "Write it down"
    return memo[n]
```
Same tree, but branches stop at memo hits. Show saved work.

### Stage 3: Tabulation (table, bottom-up)
```python
dp = [0] * (n+1)
dp[1] = 1
for i in range(2, n+1):
    dp[i] = dp[i-1] + dp[i-2]   # Each cell: look at two previous
```
No recursion. No tree. Just fill left to right.

### Stage 4: Space Optimization
"Do we need the WHOLE array, or just the last two values?"
```python
prev2, prev1 = 0, 1
for _ in range(2, n+1):
    prev2, prev1 = prev1, prev1 + prev2
```

## Visualization Data
For DP viz, generate SEPARATE HTML files for each stage:
1. **brute-force-3d.html**: Recursive tree with nodes colored by value. Yellow=current, red=recomputed duplicate, green=base case. Show the tree GROW as you step through. Counter: "recomputations avoided: 0"
2. **memo-3d.html**: Same tree but memo HIT nodes glow green, branches stop at hits. Counter: "recomputations avoided: X"
3. **tabulation-3d.html**: DP table filling left to right. Current cell yellow, dependency cells blue. Live variables panel showing which cells were read.

KEY: In tabulation viz, ALWAYS show the dependency arrows — which cells the current cell reads from. This is the "how does the problem shrink" insight.

## Classic DP Categories (teach in this order)
1. **1D DP**: Climbing Stairs, House Robber — dp[i] depends on dp[i-1], dp[i-2]
2. **2D DP on Strings**: Longest Common Subsequence — dp[i][j] depends on diagonal/up/left
3. **Knapsack**: 0/1 Knapsack, Coin Change — dp[i][w] depends on dp[i-1][w] and dp[i][w-weight]
4. **DP on Grid**: Unique Paths, Minimum Path Sum

## Common Mistakes
- Not clearly defining what dp[i] MEANS before coding
- Wrong iteration order (dependent cells must be computed first)
- Forgetting base cases (the table foundation)
- Using O(n) space when O(1) works (only last 1-2 values needed)
