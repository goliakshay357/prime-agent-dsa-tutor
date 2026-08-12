---
name: p69-lis
description: Full reference for P69 (Longest Increasing Subsequence) — blueprint, representative problems, follow-ups
---

# P69 — Longest Increasing Subsequence

## Pattern Overview

LIS has two canonical solutions and senior interviewers expect both. The naive O(n^2) DP
defines dp[i] as the length of the longest increasing subsequence ending at index i ; the
recurrence scans every earlier j < i and extends from any dp[j] with a strictly smaller
value. The patience-sorting trick uses binary search on a tails array — tails[k] is the
smallest tail of any increasing subsequence of length k + 1 — collapsing the loop to O(n log
n). The tails length, not its contents, is the LIS length.

The pattern applies anywhere a problem asks for the longest monotone-trending subsequence
— strictly or non-strictly, increasing or decreasing, possibly in 2D after sorting by one axis. The
signature trait distinguishing LIS from LCS (P68) is that LIS works on a single sequence and the
operator is an order test, not an equality test. Russian Doll Envelopes is LIS in disguise after a
careful sort; Number of LIS is the same skeleton with a parallel count array.

## Pattern Blueprint (code)

For the O(n^2) form, allocate dp of length n filled with 1 — every single element is itself a
subsequence of length 1. For each i , scan every j < i ; if nums[j] < nums[i] , set dp[i] =
max(dp[i], dp[j] + 1) . Answer is max(dp) . For the O(n log n) form, maintain a tails list.
For each x in nums , find the leftmost index in tails where tails[idx] >= x using
bisect_left . If no such index exists (binary search returns past the end), append x ;
otherwise overwrite tails[idx] = x . Answer is len(tails) .

# O(n log n)
  tails = []
  for x in nums:
      idx = bisect_left(tails, x)
      if idx == len(tails):
          tails.append(x)
      else:
          tails[idx] = x
  return len(tails)

The tails array is not a valid LIS — overwriting destroys the actual elements. It is a length
witness only. To reconstruct an actual LIS, fall back to the O(n^2) form with a parent array.

## Representative Problems

Problem 1: Longest Increasing Subsequence
Given an integer array nums , return the length of the longest strictly increasing subsequence.
Constraints: 1 <= len(nums) <= 2500 for the O(n^2) form; problem variants tighten to 1 <=
len(nums) <= 10^5 to force the O(n log n) form.

Brute force: enumerate every subsequence and check strictly increasing — O(2^n). Memoised
recursion on (i, prev_index) gives O(n^2).

Optimal solution (O(n log n)):

  from bisect import bisect_left
  from typing import List

  def lengthOfLIS(nums: List[int]) -> int:
      tails: List[int] = []
      for x in nums:
          idx = bisect_left(tails, x)
          if idx == len(tails):
              tails.append(x)
          else:
              tails[idx] = x
      return len(tails)

Time: O(n log n). Space: O(n) for the tails array.

Alternative O(n^2) form (for reconstruction):

from typing import List

  def lengthOfLISQuadratic(nums: List[int]) -> int:
      n = len(nums)
      dp = [1] * n
      for i in range(n):
          for j in range(i):
              if nums[j] < nums[i]:
                   dp[i] = max(dp[i], dp[j] + 1)
      return max(dp) if nums else 0

Time: O(n^2). Space: O(n).

Walkthrough:

 • tails is the patience-sort invariant: tails[k] is the smallest end value across every
   length- (k + 1) increasing subsequence seen so far. Smaller tails are strictly better.
 • bisect_left finds where x belongs to keep tails sorted; overwriting at that index
   replaces the existing tail with the smaller x , maintaining the invariant.
 • For strictly increasing use bisect_left . For non-decreasing, use bisect_right . Senior
   interviewers test this exact flip.
 • Edge case: empty input returns 0 naturally because len([]) == 0 .

Problem 2: Russian Doll Envelopes
Given a 2D array envelopes where envelopes[i] = [width, height] , you can nest
envelope A into envelope B if both width and height of A are strictly smaller than B. Return the
maximum number of envelopes you can Russian-doll. Constraints: 1 <= len(envelopes) <=
10^5 , 1 <= width, height <= 10^5 .

Brute force: sort by width, then for every subset check the strictly-increasing-on-both-axes
condition — O(2^n). The O(n^2) LIS on heights after sorting gives O(n^2) — too slow for 10^5 .

Optimal solution:

  from bisect import bisect_left
  from typing import List

  def maxEnvelopes(envelopes: List[List[int]]) -> int:
      # sort by width ascending, then by height DESCENDING on ties
      envelopes.sort(key=lambda e: (e[0], -e[1]))
      heights = [e[1] for e in envelopes]
      tails: List[int] = []
      for h in heights:
          idx = bisect_left(tails, h)
          if idx == len(tails):
              tails.append(h)
          else:
              tails[idx] = h
      return len(tails)

Time: O(n log n). Space: O(n).

Walkthrough:

 • Sort by width ascending — that fixes the width-axis ordering, so any strictly increasing
   subsequence of heights gives a valid nesting.
 • The descending-height tiebreaker is load-bearing. Without it, two envelopes with equal
   widths but increasing heights would form a valid LIS on heights — but they cannot nest.
   Sorting heights descending on a width tie ensures only one envelope per width is ever
   extended.
 • The trick collapses 2D LIS to 1D LIS by burning one axis into the sort.
 • Edge cases: single envelope returns 1; all envelopes with the same width return 1.

Problem 3: Number of Longest Increasing Subsequence
Given an integer array nums , return the number of longest increasing subsequences. Notice
that the subsequence has to be strictly increasing. Constraints: 1 <= len(nums) <= 2000 ,
-10^6 <= nums[i] <= 10^6 .

Brute force: enumerate every subsequence, check strictly increasing, find the maximum
length, and count how many achieve it. Exponential. The DP form runs both length and count
tables in parallel.

Optimal solution:

  from typing import List

  def findNumberOfLIS(nums: List[int]) -> int:
      if not nums:
          return 0
      n = len(nums)
      lengths = [1] * n
      counts = [1] * n
      for i in range(n):
          for j in range(i):
              if nums[j] < nums[i]:
                   if lengths[j] + 1 > lengths[i]:
                       # found a strictly longer chain
                       lengths[i] = lengths[j] + 1
                       counts[i] = counts[j]
                   elif lengths[j] + 1 == lengths[i]:
                       # same length — accumulate the count
                       counts[i] += counts[j]
      best = max(lengths)
      return sum(c for length, c in zip(lengths, counts) if length == best)

Time: O(n^2). Space: O(n).

Walkthrough:

 • Two parallel arrays: lengths[i] holds the LIS length ending at i ; counts[i] holds how
   many distinct LIS of that length end at i .
 • The recurrence updates count carefully — when j produces a strictly longer chain, the
   count at i resets to counts[j] ; when j produces an equal-length chain, the counts

accumulate. Getting this branch wrong is the most common bug; the strict-greater-vs-equal
  distinction is what the interviewer probes.
 • Final answer sums counts[i] over all i where lengths[i] equals the global max. A
  single longest chain at the end can be missed if you only return counts[max_index] —
  sum over all ends.
 • O(n log n) version exists using Fenwick trees keyed by value, but is rarely interview-
  expected; the O(n^2) form is the standard answer for n <= 2000 .

## What to Say While Solving

"I have two ways to do LIS — O(n^2) with a dp array tracking the longest chain ending at
 each index, or O(n log n) with a tails array updated via binary search. Given the constraint,
 I will go with the patience-sort form: for each element I binary-search where it belongs in
  tails and either append or overwrite. The length of tails at the end is the LIS length. I
 will be careful to use bisect_left for strictly increasing and bisect_right if the problem
 allows equals. If asked to reconstruct an actual subsequence I will fall back to the O(n^2)
 form with a parent array."

## Common Follow-up Questions

• Q: "Reconstruct an actual LIS, not just its length." — A: Use the O(n^2) form with a
   parent[i] array recording which j extended i . After finding the index with max dp[i] ,
  walk back through parents and reverse. The tails array cannot reconstruct because
  overwriting destroys the witness.
 • Q: "What if equal values are allowed in the chain?" — A: Swap bisect_left to
   bisect_right in the O(n log n) form, or change nums[j] < nums[i] to nums[j] <=
  nums[i] in the O(n^2) form. Same complexity.
 • Q: "How does this generalise to 2D — Russian Doll Envelopes?" — A: Sort by one axis
  ascending with the other axis descending on ties, then run LIS on the second axis. The
  descending tiebreaker prevents same-first-axis pairs from chaining.
 • Q: "Count the number of distinct longest increasing subsequences." — A: Run two parallel
  arrays — lengths and counts — with the strict-greater / equal-length update rule shown in
  Problem 3. O(n^2) time.
 • Q: "Longest non-decreasing or longest decreasing — what changes?" — A: Non-
  decreasing flips bisect_left to bisect_right . Longest decreasing reverses the array or
  negates values and runs LIS, or flips the comparison. Same complexity.

## What NOT to Say

• "The tails array is the actual LIS." — why it hurts: it is not — it is a length witness, and
  overwriting destroys the path. Claiming you can read off the LIS from tails falls apart on
   [10, 9, 2, 5, 3, 7, 101, 18] where tails ends as [2, 3, 7, 18] but the actual LIS

[2, 3, 7, 18] happens to match — coincidence, not correctness. Interviewers test inputs
   where the two diverge to expose this.
 • "I will use a TreeMap / SortedList for the binary search." — why it hurts: in Python you
   reach for bisect_left on a list; introducing sortedcontainers or SortedList brings an
   external dependency. The stdlib bisect is exactly the right tool. Mentioning Java's
   TreeMap suggests you have not internalised the Python idiom.
 • "O(n log n) is the only acceptable solution." — why it hurts: for n <= 2500 the O(n^2) form
   is fine and is easier to reason about for reconstruction and counting variants. Insisting on
   O(n log n) when the problem asks you to count distinct LIS or reconstruct the actual chain
   signals you are pattern-matching on the headline complexity rather than the question.

## Pattern Recognition Cheat

• Keywords → longest increasing subsequence, longest chain, russian doll, strictly
   increasing, non-decreasing, longest monotone, envelopes
 • Data structure shape → 1D dp array of chain-end lengths (O(n^2)) or tails array
   updated via bisect_left (O(n log n))
 • Constraint shape → Single sequence on input; question asks for the longest order-
   preserving monotone subsequence or its count

## Real-world Scenario

Atlassian India SDE-2 DSA Round 2 (sourced from AmbitionBox interview reports and
  LinkedIn engineer posts, 2023-2025): the candidate was given a stream of build durations
  across releases and asked for the longest strictly increasing streak of build durations as a
  subsequence — framed as "find the longest run of monotonically worsening build
  performance". The probe was whether the candidate would recognise LIS under domain
  framing, jump to the O(n log n) form with bisect, and answer the "what if I want the count of
  such streaks" escalation correctly. Successful candidates named LIS within 30 seconds,
  sketched both forms on the whiteboard, and stated the bisect_left vs bisect_right
  distinction before coding.

Sources for this pattern
Public interview reports drawn from AmbitionBox, Glassdoor, LinkedIn Posts, LeetCode
discuss India tag, and r/developersIndia threads, 2023-2026. See Module 09 for full sourcing
methodology. LIS — particularly the O(n log n) patience-sort form — has been an Atlassian
India SDE-2 and Adobe India MTS-2 round 2 staple across the 2023-2025 cycles; the Russian
Doll Envelopes 2D extension consistently surfaces in Microsoft India senior loops.

