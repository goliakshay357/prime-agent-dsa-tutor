---
name: p62-house-robber
description: Full reference for P62 (1D DP — House Robber +) — blueprint, representative problems, follow-ups
---

# P62 — 1D DP — House Robber +

## Pattern Overview

House Robber is the canonical "take or skip" 1D DP — at every index i , you choose to
include the current element (constraint: previous is excluded) or skip it (inherit the previous
answer). The recurrence is dp[i] = max(dp[i-1], dp[i-2] + nums[i]) . That max is the
entire pattern — it separates this family from Fibonacci (P61), where the transition is a pure
sum.

The pattern applies when you walk a 1D array and have a binary choice at each position that
constrains the next allowed position. The signature trait is the "no two adjacent" or "k apart"
constraint, framed in problem statements as "cannot rob two adjacent houses" or "cannot pick
consecutive elements". Variants extend the array shape (circular for House Robber II) or the
input encoding (frequency-count for Delete and Earn), but the recurrence and two-rolling-
scalars implementation never change.

## Pattern Blueprint (code)

A single left-to-right pass over the array. Maintain two scalars — prev2 (best answer up to
two indices back) and prev1 (best answer up to one index back). At index i , compute cur =
max(prev1, prev2 + nums[i]) , then shift the window: prev2 = prev1 , prev1 = cur . After
the loop, prev1 holds the answer.

prev2 = prev1 = 0
  for x in nums:
      cur = max(prev1, prev2 + x)
      prev2 = prev1
      prev1 = cur
  return prev1

The invariant is that after processing index i , prev1 equals the best total achievable
considering indices 0..i under the no-adjacent constraint. prev2 lags one step behind. The
circular variant (House Robber II) runs this routine twice — once on nums[0:n-1] and once on
nums[1:n] — and returns the max, because index 0 and index n-1 cannot both be taken in a
circle.

## Representative Problems

Problem 1: House Robber
You are a robber planning to rob houses along a street. Each house has a non-negative amount
of money stashed; the only constraint is that adjacent houses have connected security
systems and will trigger the alarm if both are robbed. Given an integer array nums representing
the money at each house, return the maximum amount you can rob without alerting police.
Constraints: 1 <= len(nums) <= 100 , 0 <= nums[i] <= 400 .

Brute force: pure recursion exploring both choices at every house. rob(i) = max(rob(i+1),
rob(i+2) + nums[i]) . O(2^n) time because the call tree branches twice and the same (i)
repeats exponentially.

Optimal solution (rolling scalars, O(1) space):

  from typing import List

  def rob(nums: List[int]) -> int:
      prev2 = prev1 = 0
      for x in nums:
          prev2, prev1 = prev1, max(prev1, prev2 + x)
      return prev1

Time: O(n). Space: O(1).

Walkthrough:

  • The max(prev1, prev2 + x) is the pattern: skip current (inherit prev1 ) or take it (build on
    prev2 since prev1 conflicts by adjacency).
  • The tuple-swap is idiomatic — Python evaluates the right-hand side fully before the
   assignment, so prev1 on the right is still the old value.
  • Edge cases: empty array returns 0. Single element returns that element ( max(0, 0 + x) =
   x ).

• The memoised top-down form with @lru_cache on best(i) is equivalent — same
   complexity, O(n) space for the cache. Interviewers expect rolling scalars when they ask "can
   you optimise space?".

Problem 2: House Robber II (circular)
Now the houses are arranged in a circle. The first house is adjacent to the last. Return the
maximum amount you can rob without triggering alarms. Constraints:
1 <= len(nums) <= 100 , 0 <= nums[i] <= 1000 .

Brute force: O(2^n) recursion with a flag tracking whether the first house was taken, branching
on that. The branching means the trick is "split into two linear subproblems."

Optimal solution:

  from typing import List

  def rob(nums: List[int]) -> int:
      if len(nums) == 1:
          return nums[0]

       def rob_linear(houses: List[int]) -> int:
           prev2 = prev1 = 0
           for x in houses:
               prev2, prev1 = prev1, max(prev1, prev2 + x)
           return prev1

       # case 1: skip the last house (house 0 may be taken)
       # case 2: skip the first house (house n-1 may be taken)
       return max(rob_linear(nums[:-1]), rob_linear(nums[1:]))

Time: O(n). Space: O(n) for the slice; O(1) if you pass indices instead of slicing.

Walkthrough:

 • In a circle, the first and last houses cannot both be taken. The optimum either excludes the
   first house or excludes the last house. Run linear House Robber on both subarrays and take
   the max.
 • The early return on len(nums) == 1 matters — slicing would produce empty arrays and
   the answer would wrongly be 0 instead of nums[0] .
 • The slicing form uses O(n) extra space. For O(1) auxiliary space, pass lo, hi indices to
   rob_linear and loop for i in range(lo, hi) .
 • "Split a circular constraint into two linear runs" is the senior-altitude insight. Naming it
   explicitly signals you have seen circular-DP problems before.

Problem 3: Delete and Earn
Given an integer array nums , you perform an operation where you pick nums[i] and earn
nums[i] points; however, picking nums[i] deletes every element equal to nums[i] - 1 and
every element equal to nums[i] + 1 from the array. Return the maximum points. Constraints:
1 <= len(nums) <= 2 * 10^4 , 1 <= nums[i] <= 10^4 .

Brute force: try every subset of distinct values respecting the constraint. Exponential.

Optimal solution:

  from collections import Counter
  from typing import List

  def deleteAndEarn(nums: List[int]) -> int:
      counts = Counter(nums)
      max_val = max(nums)
      # earn[v] = total points if we take all copies of v
      earn = [0] * (max_val + 1)
      for v, c in counts.items():
          earn[v] = v * c
      # now this is House Robber on `earn`:
      # taking earn[v] forbids earn[v-1] and earn[v+1]
      prev2 = prev1 = 0
      for x in earn:
          prev2, prev1 = prev1, max(prev1, prev2 + x)
      return prev1

Time: O(n + max(nums)). Space: O(max(nums)).

Walkthrough:

 • Bucket the input by value, sum the points each bucket yields ( v * count[v] ), and you
   have House Robber on the value-indexed array. Taking bucket v forbids buckets v-1 and
   v+1 — the exact no-adjacent constraint.
 • Once the buckets are built, the rest is the same rolling-scalars routine. Stating "this reduces
   to House Robber on the value-indexed array" out loud is the pattern-recognition signal
   interviewers grade on.
 • When max(nums) is huge but len(nums) is small, the bucket form wastes space. The
   "sorted unique + neighbour check" variant runs in O(n log n) time and O(n) space; mention
   as a follow-up.

## What to Say While Solving

"This is a 1D DP with a binary skip-or-take decision at each index. The recurrence is dp[i] =
  max(dp[i-1], dp[i-2] + nums[i]) — skip current and inherit the previous best, or take
  current and build on the answer from two steps back. I will go straight to the rolling-scalars
  form because only two prior states matter, which gives O(n) time and O(1) space. Edge cases
  I will check: empty array, single element, and the circular variant where the first and last
  cannot both be taken."

## Common Follow-up Questions

• Q: "Houses are in a circle — first and last are neighbours." — A: Run linear House Robber
   twice, on nums[:-1] and on nums[1:] , then take the max. O(n) time.

• Q: "Can you do this in O(1) space without slicing?" — A: Pass lo, hi indices to the inner
 routine and loop for i in range(lo, hi) reading nums[i] directly.
• Q: "What if the constraint is k apart instead of strictly adjacent?" — A: Recurrence widens
 to dp[i] = max(dp[i-1], dp[i-k-1] + nums[i]) . Keep k+1 rolling scalars.
• Q: "Can you reconstruct which houses were robbed?" — A: Store the choice at each step in
 a parallel array, then backtrack from the final index. O(n) extra space.
• Q: "What changes for Delete and Earn?" — A: Bucket into earn[v] = v * count[v] , then
 run House Robber on earn . Taking value v forbids v-1 and v+1 .

## What NOT to Say

• "I will use a 2D DP with a taken/not_taken flag." — why it hurts: the flag is unnecessary
 because the transition already encodes the constraint. Adding a second dimension doubles
 the state space and signals you have not reduced the problem to its 1D form. Interviewers
 ask "can you collapse this to 1D?" specifically to test for this gap.
• "House Robber II is just the same as House Robber." — why it hurts: it is not — the circular
 adjacency means index 0 and index n-1 cannot both be taken. Missing the circular
 constraint produces a wrong answer on inputs like [2, 3, 2] (linear answer is 4, circular
 answer is 3).
• "Delete and Earn needs a different DP — it has the value constraint." — why it hurts: it
 does not need a different DP. The bucket transformation reduces it to House Robber on the
 value-indexed array, and missing that reduction means you re-derive the recurrence from
 scratch and run over the interview budget. The whole point of pattern recognition is to spot
 this collapse.

## Pattern Recognition Cheat

• Keywords → no two adjacent, cannot pick consecutive, maximise total, robber, alarm if
 neighbours, skip-or-take
• Data structure shape → 1D value array with adjacency constraint on picks; two rolling
 scalars prev1 and prev2 for O(1) space
• Constraint shape → Binary decision at each index with a "forbid the neighbour" rule;
 recurrence has a max inside the transition

## Real-world Scenario

Flipkart SDE-1 On-Campus DSA Round (sourced from GeeksforGeeks Flipkart Interview
 Experience archive and AmbitionBox, 2023-2025): the candidate was given a 60-minute
 round with House Robber II as the headline problem. The interviewer's probe was whether
 the candidate would recognise the circular constraint within the first read and split it into two
 linear runs without prompting. Candidates who walked the linear → circular ladder out loud
 (state the linear recurrence, name the circular wrinkle, propose the two-run split, then code)

closed the round in 25 minutes. Candidates who attacked the circle directly with extra state
  typically did not finish.

Sources for this pattern
Public interview reports drawn from AmbitionBox, Glassdoor, LinkedIn Posts, GeeksforGeeks
Flipkart and Amazon India archives, and r/developersIndia threads, 2023-2026. See Module 09
for full sourcing methodology. House Robber and House Robber II have been a Flipkart on-
campus and Amazon India SDE-1 staple across the 2023-2025 cycles; Cred and Razorpay
routinely use Delete and Earn as the value-bucket-reduction probe in SDE-2 loops.

