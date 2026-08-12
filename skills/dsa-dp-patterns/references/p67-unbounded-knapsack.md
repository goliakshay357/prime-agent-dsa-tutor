---
name: p67-unbounded-knapsack
description: Full reference for P67 (Unbounded Knapsack — Rod) — blueprint, representative problems, follow-ups
---

# P67 — Unbounded Knapsack — Rod

## Pattern Overview

Unbounded knapsack is the variant where each item can be picked any number of times. State
stays one-dimensional in the capacity (or target sum) because the "items so far" axis collapses
— at every capacity you can re-use any item. The recurrence is dp[c] = best over items i
of (dp[c - weight[i]] combined with value[i]) . The combination is max for rod cutting,
min for coin-change minimum, and + for counting.

The pattern applies wherever the inputs say "you can use each piece as many times as you
like" and the question asks for an extremum or count over a target sum or length. The
signature trait separating unbounded knapsack from 0/1 knapsack (P66) is the inner-loop
direction: unbounded iterates capacity forward, allowing reuse; 0/1 iterates capacity backward,
blocking reuse. Order of outer and inner loops also matters when the question distinguishes
"combinations" from "permutations" — swapping them changes what you count.

## Pattern Blueprint (code)

A 1D dp array of size target + 1 . Initialise dp[0] to the base value — 0 for max / sum, 0 for
"no coins needed", 1 for "one way to make zero" in the counting form. For each capacity from
1 to target, scan every item; if weight[i] <= c , combine dp[c - weight[i]] with value[i]
using the problem's operator. The base case carries the meaning of "empty solution" for the
chosen operator — that is where the count / cost / value originates.

dp[0] = base_value
  for c in range(1, target + 1):
      for w in items:
          if w <= c:
              dp[c] = combine(dp[c], dp[c - w] + value(w))
  return dp[target]

For the counting form ("how many ways"), put the items loop outside the capacity loop to
count combinations (each item considered once across all capacities). Swap the order to count
permutations (each capacity considers every item, so [1, 2] and [2, 1] count separately). This
loop-order flip is the single most-asked follow-up.

## Representative Problems

Problem 1: Rod Cutting — Maximum Revenue from Length n
Given a rod of length n and a list prices where prices[i] is the price of a piece of length i
+ 1 , return the maximum revenue obtainable by cutting the rod into pieces. Each length may
be sold any number of times. Constraints: 1 <= n <= 1000 , 1 <= len(prices) >= n , 0 <=
prices[i] <= 10^4 .

Brute force: recursive search — at every remaining length, try every first piece and recurse on
the leftover. Branching factor n , depth n , giving O(2^n) without memoisation. Memoising on
the remaining length collapses it but the iterative DP form is what interviewers want.

Optimal solution:

  from typing import List

  def cutRod(prices: List[int], n: int) -> int:
      dp = [0] * (n + 1)
      for length in range(1, n + 1):
          best = 0
          for piece in range(1, length + 1):
              if piece - 1 < len(prices):
                   best = max(best, prices[piece - 1] + dp[length - piece])
          dp[length] = best
      return dp[n]

Time: O(n^2). Space: O(n).

Walkthrough:

 • dp[length] is the best revenue achievable from a rod of exactly length units.
   dp[0] = 0 is the base — a zero-length rod yields no revenue.
 • For each length , try every first piece size piece from 1 to length and combine
   prices[piece - 1] (selling that piece) with dp[length - piece] (best revenue from the
   leftover). Take the max.

• Why forward sweep over length ? Each dp[length - piece] is already finalised when we
   read it, so the recurrence is well-defined. There is no second axis because each piece size
   can be re-cut from the leftover — that is the unbounded property.
 • Sanity-check on the classical input prices = [1, 5, 8, 9, 10, 17, 17, 20] , n = 8 :
   the answer is 22 (cut into pieces of length 2 + 6, revenues 5 + 17, or 2 + 2 + 4, revenues 5 +
   5 + 9 + 0... the 2 + 6 split is optimal). The dp[8] = 22 confirms.

Problem 2: Integer Break — Maximum Product Partition
Given an integer n , break it into the sum of at least two positive integers and return the
maximum product of those integers. Constraints: 2 <= n <= 58 .

Brute force: recursive search — for every first factor j from 1 to n - 1 , the choice is max(j
* (n - j), j * integerBreak(n - j)) (either keep the second factor whole or break it
further). Branching factor n , depth n , exponential without memo.

Optimal solution:

  def integerBreak(n: int) -> int:
      if n <= 3:
          return n - 1
      dp = [0] * (n + 1)
      dp[1], dp[2], dp[3] = 1, 2, 3
      for i in range(4, n + 1):
          best = 0
          for j in range(1, i // 2 + 1):
              best = max(best, dp[j] * dp[i - j])
          dp[i] = best
      return dp[n]

Time: O(n^2). Space: O(n).

Walkthrough:

 • The special-case for n <= 3 is the bite-sized cliff: the contract demands at least two parts,
   so n = 2 returns 1 * 1 = 1 and n = 3 returns 1 * 2 = 2 . Without this guard the DP
   under-counts because dp[i] represents "best product treating i as either a final factor or
   further break", but the top-level call must enforce the "at least two parts" rule.
 • For i >= 4 , dp[i] = max over j of dp[j] * dp[i - j] . The seeds dp[1] = 1, dp[2]
   = 2, dp[3] = 3 carry the trick: in the recurrence we allow i = 2 and i = 3 to
   participate as a whole factor, not as a further break, because 2 > 1*1 and 3 > 1*2 . This
   lets dp[i] represent "best product where each factor is either a leaf or further broken".
 • Why range j only up to i // 2 ? Products are symmetric — dp[j] * dp[i - j] == dp[i
   - j] * dp[j] . Halving the inner loop is the cheap constant-factor win.
 • The optimal partition tends toward factors of 3: e.g. n = 10 breaks as 3 + 3 + 4 with
   product 3 * 3 * 4 = 36 . The DP discovers this without hard-coding the rule. Naming "the
   answer tends to use 3s, 2s as filler" in the interview earns a senior nod.

Problem 3: Combination Sum IV — Counting Ordered Compositions
Given an array of distinct positive integers nums and a target integer target , return the
number of possible combinations that add up to target. The order matters — (1, 2) and (2,
1) count as different. Constraints: 1 <= len(nums) <= 200 , 1 <= nums[i] <= 1000 , 1 <=
target <= 1000 .

Brute force: enumerate every ordered sequence summing to target. Exponential. Memoised
recursion on target works; the iterative DP form is what we show.

Optimal solution:

  from typing import List

  def combinationSum4(nums: List[int], target: int) -> int:
      dp = [0] * (target + 1)
      dp[0] = 1
      for c in range(1, target + 1):
          for x in nums:
              if x <= c:
                  dp[c] += dp[c - x]
      return dp[target]

Time: O(target * len(nums)). Space: O(target).

Walkthrough:

 • Loop order is flipped from Coin Change 2 — capacity outer, items inner. Now for each c ,
   every item is considered fresh, so (1, 2) (build to 2, then add 1) and (2, 1) (build to 1,
   then add 2) both register, and the answer counts ordered compositions.
 • The recurrence reads: "number of compositions of c ending in any single element". Picking
   the last element x decomposes the count to dp[c - x] . Summing over all x gives
   dp[c] .
 • The name "Combination Sum IV" is misleading — it counts permutations. Interviewers cite
   this as a calibrated "did the candidate notice the order matters?" trap. Naming it aloud
   earns trust.
 • Edge case: target = 0 returns 1 (empty composition). If nums contains numbers larger
   than target , the guard simply skips them.

## What to Say While Solving

"This is unbounded knapsack — each piece (rod length, integer factor, ordered element) can
  be picked any number of times, so I will use a 1D dp of size target + 1 and let dp[c]
  mean either the maximum revenue, the maximum product, or the count of compositions for
  that target, depending on the question. The base case dp[0] carries the meaning of the
  empty solution — 0 for max / sum forms, 1 for the counting form. For the counting form I will
  be careful about loop order — items outside means combinations, capacity outside means

permutations. The recurrence is one line and runs in O(target * items). I will sanity-check
 target = 0 and unreachable cases."

## Common Follow-up Questions

• Q: "What changes if each piece can only be used once?" — A: That is 0/1 knapsack (P66).
 Same skeleton, but the inner capacity loop runs backward from target down to weight
 so each item is considered at most once.
• Q: "Recover the actual cuts / factors used." — A: Track a parent[c] array holding which
 piece was chosen at each c . After dp[target] is set, walk back: while c > 0 , append
  parent[c] and set c = c - parent[c] .
• Q: "Rod cutting — what if cuts have a cost?" — A: Add the cut penalty per piece taken.
  dp[L] = max over l of dp[L - l] + price[l] - cut_cost if L > l (no cut needed for
 the last piece). The recurrence stays one line.
• Q: "Make this O(1) space?" — A: Cannot. The state space is target + 1 distinct values
 and any single point can depend on any earlier one. You can compress if the item set is tiny
 and bounded — that turns into a different algorithm (BFS over states or math). Standard
 interview answer: no, O(target) is the floor.
• Q: "What if target is up to 10^9 but there are only 3 item sizes?" — A: The DP table no
 longer fits. Switch to a number-theoretic / BFS / matrix-exponentiation approach exploiting
 the small item set. This is a senior-level Cred / Adobe escalation.

## What NOT to Say

• "I will use 0/1 knapsack." — why it hurts: signals you did not register that each piece can
 be reused. The backward inner-loop sweep blocks reuse, which is exactly wrong here.
 Interviewers ask you to verify on a small input — 0/1 vs unbounded answers diverge once
 any single piece appears twice in the optimum, e.g. prices = [1, 5] , n = 4 : unbounded
 answers 4 (cut into four pieces of length 1), 0/1 caps at 2.
• "Order of loops does not matter." — why it hurts: it matters in the counting form, and that
 is the single most-asked follow-up. Mixing combinations with permutations changes the
 count by an order of magnitude. Treating loop order as cosmetic signals that the buyer has
 memorised one form without understanding what each axis means.
• "Integer Break — I will just multiply 3s." — why it hurts: the 3-heavy heuristic is correct for
  n >= 4 but proving it on the spot is harder than running the DP. Interviewers want the
 recurrence first; the heuristic is the senior follow-up earning extra credit, not the lead
 answer. Lead with dp[i] = max over j of dp[j] * dp[i - j] and mention the heuristic.

## Pattern Recognition Cheat

• Keywords → unlimited use, rod cutting, integer break, make target, maximum revenue,
 number of ordered ways, any number of times

• Data structure shape → 1D dp array indexed by target / capacity / length; forward inner-
   loop sweep enables reuse
 • Constraint shape → Target sum or length on one axis; small item / piece-size set; question
   asks min, max, or count

## Real-world Scenario

Cred Backend SDE-1 DSA Round 2 (sourced from AmbitionBox interview reports and
  Medium Cred SDE write-ups, 2023-2025): the candidate was given a length of marketing-
  banner real estate to fill and a price list for banner segments of each length, then asked for
  the maximum revenue obtainable by cutting the strip into segments — each segment length
  usable any number of times. The probe was whether the candidate recognised this as Rod
  Cutting / unbounded knapsack and put the items loop inside the length loop with a forward
  sweep. Successful candidates named unbounded knapsack within the first minute, sketched
  the 1D dp on the whiteboard, and walked the interviewer through why a backward sweep
  would over-block reuse and yield a strictly lower revenue.

Sources for this pattern
Public interview reports drawn from AmbitionBox, Glassdoor, LinkedIn Posts, LeetCode
discuss India tag, and r/developersIndia threads, 2023-2026. See Module 09 for full sourcing
methodology. Unbounded knapsack — particularly Rod Cutting and Integer Break variants —
has been a Cred SDE-1 Round 2 and Amazon India SDE-1 OA staple across the 2023-2025
cycles; the loop-order escalation appears consistently in Razorpay and Atlassian India senior
rounds.

