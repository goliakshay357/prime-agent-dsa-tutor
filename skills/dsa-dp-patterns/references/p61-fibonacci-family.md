---
name: p61-fibonacci-family
description: Full reference for P61 (1D DP — Fibonacci-family +) — blueprint, representative problems, follow-ups
---

# P61 — 1D DP — Fibonacci-family +

## Pattern Overview

The Fibonacci-family of 1D DP problems is where every Indian engineer first meets dynamic
programming. The recurrence is shallow — usually dp[i] = dp[i-1] + dp[i-2] or a tiny
variation — and the state space is a single integer index. What matters is not the recurrence
itself, but the discipline of moving from naive recursion (exponential) to memoised recursion
(linear) to bottom-up tabulation (linear) to constant-space rolling scalars. Every interviewer at
the fresher tier uses this family to test whether the candidate can reason about overlapping
subproblems and walk that complexity ladder aloud.

The pattern applies when the answer at index i decomposes into a small fixed number of
earlier indices — most commonly i-1 and i-2 . The signature trait distinguishing it from
House Robber (P62) is that there is no max / decision step inside the transition; it is a pure sum
or shallow combine. If the recurrence has a max(...) or a "skip or take" branch, you are in
P62 territory.

## Pattern Blueprint (code)

A single loop from a small base case up to n . The state is one integer; the transition reads two
or three earlier states and combines them. Three forms are interview-acceptable, and the
candidate should be able to switch between them on request:

 • Top-down memoised recursion using @lru_cache(maxsize=None) — closest to the natural
   problem statement.
 • Bottom-up tabulation with a full dp array — clearest narrative when explaining the build
   order.
 • Rolling-scalars form — two or three variables updated each iteration; O(1) space.

  # bottom-up tabulation
  dp = array of size n + 1
  dp[0], dp[1] = base values
  for i from 2 to n:
      dp[i] = combine(dp[i-1], dp[i-2])
  return dp[n]

  # rolling scalars
  prev2, prev1 = base values
  for i from 2 to n:
      prev2, prev1 = prev1, combine(prev1, prev2)
  return prev1

The invariant maintained across the loop is that prev1 always holds the answer for the index
one step behind the loop counter and prev2 holds the answer two steps behind. The rolling-
scalars form is the senior-altitude answer because it shows you noticed only two states need
retention.

## Representative Problems

Problem 1: Climbing Stairs
You are climbing a staircase with n steps. Each move, you may climb 1 or 2 steps. Return the
number of distinct ways to reach the top. Constraints: 1 <= n <= 45 .

Brute force: pure recursion — ways(n) = ways(n-1) + ways(n-2) with base cases ways(0)
= ways(1) = 1 . The recursion tree branches twice at every level, so the time complexity is
O(2^n). For n = 45 , that is ~35 trillion calls — well past the 1-second budget.

Optimal solution (memoised recursion):

from functools import lru_cache

  def climbStairs(n: int) -> int:
      @lru_cache(maxsize=None)
      def ways(i: int) -> int:
          if i <= 1:
              return 1
          return ways(i - 1) + ways(i - 2)
      return ways(n)

Optimal solution (rolling scalars, O(1) space):

  def climbStairs(n: int) -> int:
      if n <= 1:
          return 1
      prev2, prev1 = 1, 1
      for _ in range(2, n + 1):
          prev2, prev1 = prev1, prev1 + prev2
      return prev1

Time: O(n). Space: O(n) for the memoised form, O(1) for the rolling-scalars form.

Walkthrough:

 • The recurrence ways(i) = ways(i-1) + ways(i-2) is Fibonacci offset by one — ways(n)
   = F(n+1) . Saying this aloud signals you recognise the family.
 • @lru_cache(maxsize=None) is defined inside climbStairs so the cache is scoped to a
   single call. Defining it at module scope leaks state across calls.
 • The rolling-scalars form drops space from O(n) to O(1) because only the previous two values
   are needed. Interviewers ask "can you do this in O(1) space?" after the memoised form
   lands.
 • Edge cases: n = 1 returns 1 (one way: one single step).

Problem 2: Fibonacci Number (multiple approaches)
Calculate the n -th Fibonacci number, where F(0) = 0 , F(1) = 1 , and F(n) = F(n-1) +
F(n-2) for n >= 2 . Constraints: 0 <= n <= 30 (or higher in some variants).

Brute force: pure recursion mirroring the math definition. O(2^n) time, O(n) recursion stack.

Optimal solution (bottom-up tabulation):

  def fib(n: int) -> int:
      if n < 2:
          return n
      dp = [0] * (n + 1)
      dp[1] = 1
      for i in range(2, n + 1):
          dp[i] = dp[i - 1] + dp[i - 2]
      return dp[n]

Optimal solution (rolling scalars):

def fib(n: int) -> int:
      if n < 2:
          return n
      prev2, prev1 = 0, 1
      for _ in range(2, n + 1):
          prev2, prev1 = prev1, prev1 + prev2
      return prev1

Time: O(n). Space: O(n) for tabulation, O(1) for rolling scalars.

Walkthrough:

 • Climbing Stairs and Fibonacci share the same recurrence; only the base case differs.
   climbStairs(n) = fib(n + 1) . Stating this connection when the interviewer pivots shows
   pattern fluency.
 • For very large n (say 10^9 ), switch to matrix exponentiation of [[1, 1], [1, 0]] for
   O(log n). Mention as a follow-up; do not code unless asked.
 • The base case n < 2 is one line because both F(0) = 0 and F(1) = 1 are simply n .

Problem 3: Min Cost Climbing Stairs
You are given an array cost where cost[i] is the cost of stepping onto stair i . After paying
the cost, you can climb 1 or 2 steps. You may start at stair 0 or stair 1. Return the minimum
cost to reach beyond the last stair. Constraints: 2 <= len(cost) <= 1000 , 0 <= cost[i] <=
999 .

Brute force: recursion exploring both choices at every stair. O(2^n) time.

Optimal solution (rolling scalars):

  from typing import List

  def minCostClimbingStairs(cost: List[int]) -> int:
      n = len(cost)
      # dp[i] = min cost to reach stair i (before paying cost[i])
      prev2, prev1 = 0, 0
      for i in range(2, n + 1):
          prev2, prev1 = prev1, min(prev1 + cost[i - 1], prev2 + cost[i - 2])
      return prev1

Time: O(n). Space: O(1).

Walkthrough:

 • Recurrence: dp[i] = min(dp[i-1] + cost[i-1], dp[i-2] + cost[i-2]) — reach stair
   i either from i-1 (paying cost[i-1] ) or from i-2 (paying cost[i-2] ).
 • The "top" is one step beyond the last stair, so dp is sized n + 1 . Trace cost = [10, 15,
   20] : answer is 15 (start at stair 1, pay 15, step 2 to the top).
 • The starting indices 0 and 1 are free entry points, so dp[0] = dp[1] = 0 — you have not
   paid to step onto your chosen start yet.

## What to Say While Solving

"This is a 1D DP problem from the Fibonacci family — the answer at step i only depends
 on the answers at i-1 and i-2 , so the same subproblems repeat exponentially in naive
 recursion. I will start by stating the recurrence, then walk the complexity ladder: O(2^n) naive,
 O(n) with memoisation, O(n) with bottom-up tabulation, O(1) space with rolling scalars. I will
 code the rolling-scalars form directly because the recurrence only reaches back two states.
 Edge cases I will watch: n = 0 , n = 1 , and the base values being correct for the specific
 problem framing."

## Common Follow-up Questions

• Q: "Can you do this in O(1) space?" — A: Yes — only the last two values matter for any
  transition, so we hold them in two scalars and update each loop step. This is the rolling-
  scalars form.
 • Q: "What if you could take 1, 2, or 3 steps per move?" — A: The recurrence widens to
   dp[i] = dp[i-1] + dp[i-2] + dp[i-3] and we keep three rolling scalars instead of two.
  Same O(n) time, still O(1) space.
 • Q: "What if n is very large, say 10^9?" — A: Switch to matrix exponentiation of [[1, 1],
  [1, 0]] raised to n for O(log n) time. The closed-form Binet formula is O(1) but floating-
  point error makes it unsafe at large n .
 • Q: "Can you reconstruct the actual path of steps, not just the count?" — A: Store the choice
  made at each step (1 or 2) in a parallel array during tabulation, then backtrack from dp[n]
  to reconstruct. O(n) extra space.
 • Q: "What if each step has a different cost and you want the cheapest path?" — A: That is
  Min Cost Climbing Stairs (Problem 3); the recurrence becomes dp[i] = min(dp[i-1] +
  cost[i-1], dp[i-2] + cost[i-2]) .

## What NOT to Say

• "Let me start with pure recursion." — why it hurts: at any altitude above complete fresher,
  jumping into O(2^n) recursion without immediately flagging it as a memoisation candidate
  signals you do not see the overlapping subproblems. Mention naive recursion as a
  complexity anchor, then write memoised or tabulated directly.
 • "I will use a dictionary to memoise." — why it hurts: not wrong, but for integer-keyed 1D
  DP a plain list or @lru_cache is the idiomatic Python choice. Reaching for a dict here
  suggests you have not internalised the difference between general memoisation and 1D DP.
 • "The base case is dp[0] = 0 and dp[1] = 1 ." — why it hurts: this is the Fibonacci base,
  not the Climbing Stairs base. Mixing them up on the whiteboard is the most common
  interviewer-catch in this family. State the base in terms of the problem framing ( ways to
  reach step 0 = 1 because you are already there).

## Pattern Recognition Cheat

• Keywords → number of ways, distinct ways, climb 1 or 2 steps, fibonacci, minimum cost
   path of jumps, reach the top
 • Data structure shape → Single integer index drives the recurrence; full dp array for
   tabulation or two-three rolling scalars for O(1) space
 • Constraint shape → dp[i] depends on a small fixed number of earlier states ( i-1 , i-2 ,
   sometimes i-3 ); no max / decision branching inside the transition

## Real-world Scenario

Razorpay SDE-1 DSA Round 1 (sourced from AmbitionBox interview reports and Medium
  Razorpay SDE write-ups, 2023-2025): the candidate was asked Climbing Stairs as the warm-
  up problem, then immediately pivoted with "now there is a cost to step onto each stair —
  minimise total cost." The probe was whether the candidate would recognise the same
  recurrence shape underneath the cost framing, and whether they would land on the rolling-
  scalars O(1) space form on the first cut. Successful candidates named the Fibonacci family in
  the first sentence, wrote the recurrence on the board before coding, and stated the O(1)
  space claim before writing the loop.

Sources for this pattern
Public interview reports drawn from AmbitionBox, Glassdoor, LinkedIn Posts, GeeksforGeeks
TCS NQT and Infosys SP archives, and r/developersIndia threads, 2023-2026. See Module 09
for full sourcing methodology. The Fibonacci-family pattern is a long-running staple at every
Indian recruiter tier — TCS NQT and Infosys SP use Climbing Stairs verbatim as an aptitude-
coding section warm-up, while Razorpay and Flipkart use the cost variant as a complexity-
ladder probe in SDE-1 first rounds.

