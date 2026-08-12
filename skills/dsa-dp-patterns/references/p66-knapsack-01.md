---
name: p66-knapsack-01
description: Full reference for P66 (0/1 Knapsack — Subset Sum /) — blueprint, representative problems, follow-ups
---

# P66 — 0/1 Knapsack — Subset Sum /

## Pattern Overview

0/1 Knapsack is the canonical "pick or skip from a finite set" DP — each item can be taken at
most once, and the question is either "is a target sum reachable" or "what is the optimal value
subject to a capacity". The recurrence is dp[i][c] = max(dp[i-1][c], dp[i-1][c - w[i]] +
v[i]) for the value variant, or boolean OR for the subset-sum variant. The at-most-once
constraint is what separates 0/1 Knapsack from the unbounded Coin Change family (P63).
With "items outer, capacity inner descending" in the 1D rolling form, the constraint enforces
itself.

The pattern applies when you select a subset from a finite item set to hit or maximise a single
integer constraint. Subset Sum, Partition Equal Subset Sum, Target Sum, and Last Stone
Weight II all collapse to the same dp[c] |= dp[c - num] loop once you reframe them. The
reframing is the hardest part — Target Sum becomes "pick a subset summing to (total +
target) / 2 ", Last Stone Weight II becomes "split into two subsets with smallest difference,
which is total - 2 * (largest reachable subset sum <= total / 2) ".

## Pattern Blueprint (code)

A 1D boolean dp of size target + 1 , dp[0] = True . For each item num , walk capacity from
target down to num and update dp[c] |= dp[c - num] . After all items, dp[target]
answers reachability. For value-maximisation, swap booleans for integers and |= for
max(dp[c], dp[c - w] + v) .

# boolean subset sum
  dp = [False] * (target + 1)
  dp[0] = True
  for num in nums:
      for c in range(target, num - 1, -1):                # descending — at-most-once
          dp[c] = dp[c] or dp[c - num]
  return dp[target]

  # count variant — number of subsets summing to target
  dp = [0] * (target + 1)
  dp[0] = 1
  for num in nums:
      for c in range(target, num - 1, -1):
          dp[c] += dp[c - num]
  return dp[target]

The descending capacity loop is non-negotiable for 0/1. Reverse it and you get unbounded
knapsack with no warning — the code still runs, just gives the wrong answer.

## Representative Problems

Problem 1: Partition Equal Subset Sum
Given a non-empty integer array nums , determine if the array can be partitioned into two
subsets such that the sum of elements in both subsets is equal. Constraints: 1 <= len(nums)
<= 200 , 1 <= nums[i] <= 100 .

Brute force: try every subset and check. O(2^n). For n = 200 this is well past any time
budget.

Optimal solution (1D tabulation):

  from typing import List

  def canPartition(nums: List[int]) -> bool:
      total = sum(nums)
      if total % 2 == 1:
          return False
      target = total // 2
      dp = [False] * (target + 1)
      dp[0] = True
      for num in nums:
          for c in range(target, num - 1, -1):
              dp[c] = dp[c] or dp[c - num]
      return dp[target]

Time: O(n * target). Space: O(target).

Walkthrough:

 • The reframing: a 50/50 partition exists if and only if a subset sums to total / 2 . Total
   must be even (early return if odd) and the problem reduces to Subset Sum with target =
   total / 2 .

• The descending inner loop is the at-most-once enforcement. When updating dp[c] , we
   read dp[c - num] which still holds the previous-iteration value. Ascending would let dp[c
   - num] already include the current item.
 • Trace on nums = [1, 5, 11, 5] : total = 22, target = 11. The answer is True via subsets
   {1, 5, 5} and {11} .
 • Memoised top-down with (i, remaining) as state is the equivalent recursive form —
   same complexity, larger constant factor due to the function-call overhead.

Problem 2: Target Sum
You are given an integer array nums and an integer target . You want to build an expression
out of nums by adding a + or - symbol before each integer and then concatenating them.
Return the number of different expressions that evaluate to target . Constraints: 1 <=
len(nums) <= 20 , 0 <= nums[i] <= 1000 , -1000 <= target <= 1000 .

Brute force: try every + / - assignment. O(2^n). For n = 20 this is one million paths — slow
but tractable; for larger n it would not be.

Optimal solution:

  from typing import List

  def findTargetSumWays(nums: List[int], target: int) -> int:
      total = sum(nums)
      # let P = sum of plus-signed, N = sum of minus-signed
      # P + N = total, P - N = target => P = (total + target) / 2
      if abs(target) > total or (total + target) % 2 == 1:
          return 0
      subset_target = (total + target) // 2
      if subset_target < 0:
          return 0
      dp = [0] * (subset_target + 1)
      dp[0] = 1
      for num in nums:
          for c in range(subset_target, num - 1, -1):
              dp[c] += dp[c - num]
      return dp[subset_target]

Time: O(n * (total + target)). Space: O(subset_target).

Walkthrough:

 • Split the array into two subsets, P (assigned + ) and N (assigned - ). Then P + N = total
   and P - N = target , so P = (total + target) / 2 . The problem reduces to "count
   subsets summing to P".
 • Two early returns: abs(target) > total means impossible, and (total + target) % 2
   == 1 means the system has no integer solution.
 • The count variant uses dp[c] += dp[c - num] instead of dp[c] |= dp[c - num] . Same
   descending loop, same at-most-once enforcement.
 • Trace on nums = [1, 1, 1, 1, 1], target = 3 : total = 5, subset_target = 4, dp[4] = 5
   (five expressions including +1+1+1+1-1 and rotations).

• Edge case: an all-zeros array with target 0 returns 2^n because every assignment
   evaluates to 0. The DP handles this because dp[0] doubles each time a zero is processed.

Problem 3: Last Stone Weight II
You have a collection of stones, each with a positive integer weight. Each turn, choose any two
stones and smash them together — if their weights are equal, both stones are destroyed; if
unequal, the lighter is destroyed and the heavier loses the lighter's weight. Return the minimum
possible weight of the last remaining stone (or 0 if none remain). Constraints: 1 <=
len(stones) <= 30 , 1 <= stones[i] <= 100 .

Brute force: simulate every pairing. Exponential.

Optimal solution:

  from typing import List

  def lastStoneWeightII(stones: List[int]) -> int:
      total = sum(stones)
      target = total // 2
      dp = [False] * (target + 1)
      dp[0] = True
      for s in stones:
          for c in range(target, s - 1, -1):
              dp[c] = dp[c] or dp[c - s]
      # find the largest reachable subset sum <= total // 2
      for c in range(target, -1, -1):
          if dp[c]:
              return total - 2 * c
      return total # unreachable in practice

Time: O(n * total). Space: O(total).

Walkthrough:

 • Every smash assigns a + / - sign to each stone (winner positive, loser negative). The final
   weight is |sum of signs| . Minimising the absolute value is equivalent to splitting the
   stones into two subsets with the smallest possible sum difference.
 • The minimum difference is total - 2 * (largest subset sum at most total / 2) . Run
   Subset Sum up to total / 2 and scan backwards for the largest reachable cell.
 • Naming the reduction — "this is partition with min-difference, which is subset sum up to
   total / 2 " — is the senior-altitude signal. Skipping the reframing and trying to simulate
   the smashing directly burns interview minutes.

## What to Say While Solving

"This is 0/1 Knapsack — each item used at most once. The 1D DP form has items outer and
  capacity descending inner; descending enforces the at-most-once constraint because dp[c
  - num] on the right is still the previous-iteration value. For Partition Equal Subset Sum I
  reframe to Subset Sum at total / 2 after early-returning on odd total. For Target Sum I

reframe to subset sum at (total + target) / 2 . The reframing is the harder half; once it
 lands, the recurrence is the same 0/1 routine."

## Common Follow-up Questions

• Q: "Why is the inner loop descending in the 1D form?" — A: To enforce the at-most-once
 constraint. Descending means dp[c - num] is the previous-iteration value. Ascending
 would let the item be re-used in the same pass — that is unbounded Coin Change, not 0/1.
• Q: "What if items have values and weights both?" — A: Switch the boolean to an integer DP
 and replace dp[c] |= dp[c - w] with dp[c] = max(dp[c], dp[c - w] + v) . Same
 descending loop.
• Q: "Can you reconstruct which items were picked?" — A: The 1D form does not preserve
 enough state. Use the 2D dp[i][c] form and backtrack from dp[n][target] , checking at
 each step whether dp[i][c] == dp[i-1][c] (skipped) or dp[i-1][c - w[i]] + v[i]
 (taken).
• Q: "What if items have a bounded supply, say at most k of each?" — A: Bounded
 knapsack. Decompose each item into copies (binary lifting for efficiency) or add a third
 dimension for copies-used. Polynomial in n * target * k .
• Q: "Target Sum — what is the reframing?" — A: Let P be plus-signed sum and N be minus-
 signed sum. Then P + N = total , P - N = target , so P = (total + target) / 2 .
 Count subsets summing to P.

## What NOT to Say

• "I will use a 2D dp[i][c] array because each item is binary." — why it hurts: 2D works but
 is wasteful. The 1D rolling form with descending inner loop captures the same at-most-once
 semantics in half the space. Coding 2D directly without flagging the 1D optimisation signals
 you have not internalised the descending-loop trick.
• "I will go ascending so the loop reads more naturally." — why it hurts: ascending breaks
 0/1. The same item gets re-used in the same pass, silently solving unbounded Coin Change
 instead. On nums = [2, 3], target = 4 , ascending says True; the correct 0/1 answer is
 False.
• "Partition Equal Subset Sum is just sorting and greedy split." — why it hurts: greedy
 partition is wrong in general. On nums = [1, 5, 11, 5] , greedy (largest-first into the
 smaller pile) gives {11, 1} and {5, 5} — sums 12 and 10. The DP gives True via {1, 5,
 5} and {11} .

## Pattern Recognition Cheat

• Keywords → partition into two equal subsets, can subset sum to S, minimum difference
 between subsets, target sum with + and -, each element used once

• Data structure shape → 1D boolean (or integer count) array indexed by capacity, sized
   target + 1 ; descending inner loop enforces at-most-once
 • Constraint shape → Each item selected at most once; single integer capacity; ask is
   reach / count / max-value at capacity

## Real-world Scenario

Atlassian India Senior Software Engineer DSA Round (sourced from AmbitionBox
  interview reports and LinkedIn engineer posts, 2023-2025): the candidate was given Partition
  Equal Subset Sum framed as a load-balancing question — split a list of service request
  weights between two servers so the difference is zero, return whether possible. The probe
  was whether the candidate would name the subset-sum reduction within the first 30 seconds
  and flag the at-most-once constraint as the 0/1 signal. The follow-up was Last Stone Weight
  II as the min-difference variant — successful candidates reused the same DP routine with a
  final backwards scan and connected the two via "min difference = total minus twice the
  largest reachable subset sum at most total / 2".

Sources for this pattern
Public interview reports drawn from AmbitionBox, Glassdoor, LinkedIn Posts, LeetCode
discuss India tag, and r/developersIndia threads, 2023-2026. See Module 09 for full sourcing
methodology. 0/1 Knapsack and its subset-sum variants have been an Atlassian India and
Razorpay senior-loop staple across the 2023-2025 cycles; Adobe India and Microsoft India use
Target Sum as the count-variant follow-up to probe whether candidates can switch from
boolean OR to integer addition on the same skeleton.

