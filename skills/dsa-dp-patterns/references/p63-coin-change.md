---
name: p63-coin-change
description: Full reference for P63 (1D DP — Coin Change (min coins) — blueprint, representative problems, follow-ups
---

# P63 — 1D DP — Coin Change (min coins

## Pattern Overview

Coin Change is the canonical unbounded-knapsack 1D DP — an unlimited supply of items,
each with a single integer "size", and the question is either "minimum count to hit target T" or
"number of distinct multisets that sum to T". The recurrence at amount a looks across every
coin c <= a and takes the best of dp[a - c] + 1 (for min-coins) or sums dp[a - c] (for
count-ways). The loop order determines whether you count combinations or permutations —
the most subtle correctness point in this DP family.

The pattern applies when you have a fixed item set with unlimited supply and a single integer
constraint to fill. The signature trait distinguishing it from 0/1 Knapsack (P66) is the unlimited
supply — the same denomination can be re-used as many times as needed. The min-coins
and count-ways variants share the table shape but have opposite loop orderings for the count
form, and that is the trap interviewers love to spring.

## Pattern Blueprint (code)

For min-coins: a 1D dp of size amount + 1 , initialised to amount + 1 as a sentinel for
"impossible". dp[0] = 0 . For each amount a from 1 to amount , dp[a] = min(dp[a - c] +
1 for c in coins if c <= a) . Return dp[amount] if reachable, else -1 .

For count-ways: same shape, dp[0] = 1 (one way to make 0: pick nothing). Loop coins outer,
amounts inner. The outer-coin loop enforces a fixed coin order across each combination,
stopping permutations from being double-counted.

  # min-coins
  dp = [amount + 1] * (amount + 1)
  dp[0] = 0
  for a in range(1, amount + 1):
      for c in coins:
          if c <= a:
              dp[a] = min(dp[a], dp[a - c] + 1)
  return dp[amount] if dp[amount] <= amount else -1

  # count-ways (combinations)
  dp = [0] * (amount + 1)
  dp[0] = 1
  for c in coins:            # outer must be coins
      for a in range(c, amount + 1):
          dp[a] += dp[a - c]
  return dp[amount]

Swapping the loop order in the count-ways form changes the answer — it counts ordered
sequences instead of multisets. That is the single most-asked follow-up in this family.

## Representative Problems

Problem 1: Coin Change (minimum coins)
You are given an integer array coins representing coins of different denominations and an
integer amount representing a total amount of money. Return the fewest number of coins
needed to make up that amount. If that amount cannot be made up by any combination of the
coins, return -1 . You have an infinite number of each kind of coin. Constraints: 1 <=
len(coins) <= 12 , 1 <= coins[i] <= 2^31 - 1 , 0 <= amount <= 10^4 .

Brute force: pure recursion exploring every coin at every amount. min_coins(a) = 1 +
min(min_coins(a - c) for c in coins) with base min_coins(0) = 0 . Exponential
because the same (a) reappears across many branches.

Optimal solution (bottom-up tabulation):

  from typing import List

  def coinChange(coins: List[int], amount: int) -> int:
      dp = [amount + 1] * (amount + 1)
      dp[0] = 0
      for a in range(1, amount + 1):
          for c in coins:
              if c <= a:
                  dp[a] = min(dp[a], dp[a - c] + 1)
      return dp[amount] if dp[amount] <= amount else -1

Time: O(amount * len(coins)). Space: O(amount).

Walkthrough:

 • The sentinel amount + 1 for unreachable cells works because no valid count can exceed
   amount (worst case is amount coins of value 1). Using float('inf') works but is less
   idiomatic in a typed-int DP.
 • Trace on coins = [1, 2, 5], amount = 11 : dp[11] = min(dp[10] + 1, dp[9] + 1,
   dp[6] + 1) = min(3, 5, 3) = 3 (one 5 + one 5 + one 1).
 • Greedy (always pick the largest coin that fits) is wrong on
   coins = [1, 3, 4], amount = 6 — greedy gives 4 + 1 + 1 = 3 coins; the DP gives 3 + 3 =
   2. Saying this out loud is the senior-altitude refutation.
 • The memoised top-down equivalent uses @lru_cache(maxsize=None) on min_coins(a) ,
   returning float('inf') for a < 0 and 0 for a == 0 . Same complexity, larger constant.

Problem 2: Coin Change 2 (count ways)
Given an integer array coins representing coins of different denominations and an integer
amount , return the number of combinations that make up that amount. If that amount of
money cannot be made up by any combination, return 0. You may assume there is an infinite
number of each kind of coin. Constraints: 1 <= len(coins) <= 300 ,
1 <= coins[i] <= 5000 , 0 <= amount <= 5000 .

Brute force: recurse over the coin index and remaining amount with two choices per call (use
this coin again, or move to the next coin). O(2^amount) without memoisation.

Optimal solution:

  from typing import List

  def change(amount: int, coins: List[int]) -> int:
      dp = [0] * (amount + 1)
      dp[0] = 1
      for c in coins:
          for a in range(c, amount + 1):
              dp[a] += dp[a - c]
      return dp[amount]

Time: O(amount * len(coins)). Space: O(amount).

Walkthrough:

 • The outer loop must be over coins. After processing coin c , dp[a] holds the number of
   ways to make a using only coins seen so far. Each combination is counted once because
   the coin order is fixed.
 • Swap the loops and you count permutations — 1 + 2 and 2 + 1 become two paths. On
   coins = [1, 2], amount = 3 : the combination count is 2 ( [1, 1, 1] and [1, 2] ); the
   permutation count is 3.
 • dp[0] = 1 is the empty multiset — one way to make 0 by picking no coins.

Problem 3: Perfect Squares
Given an integer n , return the least number of perfect square numbers that sum to n . A
perfect square is an integer that is the square of an integer — e.g., 1, 4, 9, 16, 25. Constraints:
1 <= n <= 10^4 .

Brute force: recursion over n and the candidate squares. Exponential without memoisation.

Optimal solution:

  def numSquares(n: int) -> int:
      dp = [n + 1] * (n + 1)
      dp[0] = 0
      for i in range(1, n + 1):
          j = 1
          while j * j <= i:
              dp[i] = min(dp[i], dp[i - j * j] + 1)
              j += 1
      return dp[n]

Time: O(n * sqrt(n)). Space: O(n).

Walkthrough:

 • Coin Change with the coin set generated on the fly — coins = [1, 4, 9, 16, ...] up to
   sqrt(n) . Recurrence: dp[i] = min(dp[i - j*j] + 1) over valid squares j*j .
 • The inner while j * j <= i enumerates squares up to sqrt(i) — that is why
   complexity drops vs. plain Coin Change.
 • Lagrange's four-square theorem guarantees the answer is at most 4, so a math-only
   solution runs in O(sqrt(n)). Mention as a follow-up; do not code unless asked.
 • Trace on n = 12 : dp[12] = min(dp[11] + 1, dp[8] + 1, dp[3] + 1) = 3 (4 + 4 + 4).

## What to Say While Solving

"This is unbounded-knapsack 1D DP — unlimited supply of each coin, single integer target.
  For min-coins, dp[a] is the minimum over dp[a - c] + 1 for each coin c <= a . For
  count-ways, loop order matters: outer on coins, inner on amounts, otherwise you count
  permutations. I will use bottom-up tabulation because the loop structure makes the order
  explicit. Edge cases: amount = 0 and unreachable amounts."

## Common Follow-up Questions

• Q: "Why does the loop order matter in Coin Change 2?" — A: Outer-coin fixes a coin
   ordering across each combination, so each multiset is counted once. Outer-amount counts
   ordered sequences — [1, 2] and [2, 1] become two paths.
 • Q: "Can you reconstruct the actual coin set, not just the count?" — A: Store a choice[a]
   array recording which coin gave the min at amount a , then backtrack from amount .
   O(amount) extra space.

• Q: "What if coin denominations are very large but the amount is small?" — A: Complexity
 stays O(amount * len(coins)) because we loop over amounts, not coin values.
• Q: "Greedy works for Indian currency, why not in general?" — A: Greedy is optimal only for
 canonical coin systems where each denomination divides the next. On
  coins = [1, 3, 4], amount = 6 , greedy gives 3 coins (4 + 1 + 1), DP gives 2 (3 + 3).
• Q: "Streaming version — coins are revealed one at a time?" — A: The count-ways DP is
 streaming-friendly because the outer loop is over coins. Each new coin processes in
 O(amount). Min-coins is harder because its inner loop relies on the fixed coin set.

## What NOT to Say

• "I will use greedy and pick the largest coin." — why it hurts: greedy is wrong in general,
 and interviewers know it. On coins = [1, 3, 4], amount = 6 , greedy gives 3 coins; DP
 gives 2. Defaulting to greedy without naming the counterexample signals you have not
 internalised when greedy fails.
• "I will use 2D DP with coin index as the second dimension." — why it hurts: 2D works but
 is wasteful — the unbounded supply collapses cleanly to 1D. Mentioning 2D as a step and
 then dropping to 1D is fine; coding 2D directly signals you have not seen the unbounded-
 knapsack collapse.
• "Loop order does not matter — both produce the count." — why it hurts: it absolutely
 matters in Coin Change 2. Outer-amount counts permutations, outer-coin counts
 combinations. The interviewer will trace coins = [1, 2], amount = 3 and you will be
 caught with answer 3 instead of 2.

## Pattern Recognition Cheat

• Keywords → fewest coins, make change, number of ways, combinations summing to,
 unlimited supply, perfect squares summing to
• Data structure shape → 1D dp indexed by amount; outer-coin loop for combination
 count, outer-amount loop for min-coins
• Constraint shape → Unlimited supply of items, single integer target, ask is either "min
 count to reach target" or "number of distinct multisets summing to target"

## Real-world Scenario

Razorpay SDE-2 Backend DSA Round (sourced from AmbitionBox interview reports and
 Medium Razorpay SDE write-ups, 2023-2025): the candidate was given Coin Change as the
 first problem with a payment-domain framing — "given denominations supported by a
 payment partner, what is the minimum number of transfers to settle an invoice of amount
 X?". The follow-up was the count-ways variant with the loop-order trap: "now tell me how
 many distinct partner-combination settlements are possible." Successful candidates named
 unbounded knapsack within 30 seconds, stated the outer-coin requirement for combination

counting before writing the second solution, and traced coins = [1, 2], amount = 3
  aloud to justify why the loop order mattered.

Sources for this pattern
Public interview reports drawn from AmbitionBox, Glassdoor, LinkedIn Posts, LeetCode
discuss India tag, and r/developersIndia threads, 2023-2026. See Module 09 for full sourcing
methodology. Coin Change and Coin Change 2 have been a Razorpay, Flipkart, and Amazon
India SDE-1 / SDE-2 staple across the 2023-2025 cycles; Atlassian India and Cred routinely
use Perfect Squares as the variant that surfaces the on-the-fly coin generation insight.

