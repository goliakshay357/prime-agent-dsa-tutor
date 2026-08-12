---
name: p65-edit-distance
description: Full reference for P65 (2D DP — Min Path Sum / Edit) — blueprint, representative problems, follow-ups
---

# P65 — 2D DP — Min Path Sum / Edit

## Pattern Overview

Edit Distance and its 2D-DP-on-two-strings cousins are where DP gets serious. The state is
(i, j) representing prefix lengths from each string, and the transition depends on whether
the current characters match. When they match, you inherit dp[i-1][j-1] directly. When they
do not, you take the min (or sum, for count variants) over three operations — delete, insert,
substitute — translating to dp[i-1][j] , dp[i][j-1] , and dp[i-1][j-1] . The grid fills row
by row with each interior cell looking at three already-computed parents.

The pattern applies when you compare two sequences and need to count, optimise, or
transform one into the other. The signature trait distinguishing it from grid-restricted-move
(P64) is that the state space is the product of two string lengths and the transition has three
parents. Edit Distance, Delete Operation for Two Strings, Longest Common Subsequence,
Distinct Subsequences, and Interleaving String are all variations of the same recurrence shape.

## Pattern Blueprint (code)

A (m + 1) x (n + 1) table. Row 0 represents the empty prefix of a — the cost to reach
b[0..j] is j insertions. Column 0 represents the empty prefix of b — the cost to reduce
a[0..i] to empty is i deletions. Fill row by row, left to right. At cell (i, j) : if the current
characters match, dp[i][j] = dp[i-1][j-1] ; otherwise dp[i][j] = 1 + min(dp[i-1][j],
dp[i][j-1], dp[i-1][j-1]) representing delete, insert, substitute respectively.

dp[0][j] = j for all j        # insert j characters
  dp[i][0] = i for all i        # delete i characters

  for i from 1 to m:
      for j from 1 to n:
          if a[i-1] == b[j-1]:
              dp[i][j] = dp[i-1][j-1]
          else:
              dp[i][j] = 1 + min(dp[i-1][j],                  # delete from a
                                 dp[i][j-1],                  # insert into a
                                 dp[i-1][j-1])                # substitute
  return dp[m][n]

The 1-indexing of the table against 0-indexed strings is the off-by-one trap that catches half
the candidates on this problem. State the indexing convention out loud before writing the loop.

## Representative Problems

Problem 1: Edit Distance
Given two strings word1 and word2 , return the minimum number of operations required to
convert word1 to word2 . You have three operations available: insert a character, delete a
character, replace a character. Constraints: 0 <= len(word1), len(word2) <= 500 .

Brute force: recursion on (i, j) exploring all three operations. edit(i, j) = 1 +
min(edit(i-1, j), edit(i, j-1), edit(i-1, j-1)) with base cases handling empty
prefixes. O(3^(m + n)) without memoisation.

Optimal solution (bottom-up tabulation):

  def minDistance(word1: str, word2: str) -> int:
      m, n = len(word1), len(word2)
      dp = [[0] * (n + 1) for _ in range(m + 1)]
      for i in range(m + 1):
          dp[i][0] = i
      for j in range(n + 1):
          dp[0][j] = j
      for i in range(1, m + 1):
          for j in range(1, n + 1):
              if word1[i - 1] == word2[j - 1]:
                  dp[i][j] = dp[i - 1][j - 1]
              else:
                  dp[i][j] = 1 + min(dp[i - 1][j],
                                     dp[i][j - 1],
                                     dp[i - 1][j - 1])
      return dp[m][n]

Time: O(m * n). Space: O(m * n), reducible to O(min(m, n)) with rolling rows.

Walkthrough:

 • Base cases: turning word1[0..i] into the empty string costs i deletes; turning the empty
   string into word2[0..j] costs j inserts.

• The three transitions map to the three operations: dp[i-1][j] is delete word1[i-1] ,
   dp[i][j-1] is insert word2[j-1] , dp[i-1][j-1] is substitute. Naming these aloud
   during the interview is the senior-altitude signal.
 • Trace on word1 = "horse", word2 = "ros" : the answer is 3 (substitute h→r, delete o,
   delete r).
 • Space-optimised form: keep two rolling 1D arrays of size n + 1 and swap after each row.
   Reduces space to O(n).
 • The memoised top-down form using @lru_cache(maxsize=None) on (i, j) is the
   recursive equivalent — same complexity, slightly more familiar reading order for some
   candidates.

Problem 2: Delete Operation for Two Strings
Given two strings word1 and word2 , return the minimum number of single-character delete
operations required to make word1 and word2 equal. You may delete from either string.
Constraints: 1 <= len(word1), len(word2) <= 500 .

Brute force: recursion exploring deletions from each side. Exponential without memoisation.

Optimal solution:

  def minDistance(word1: str, word2: str) -> int:
      m, n = len(word1), len(word2)
      # dp[i][j] = length of LCS of word1[:i] and word2[:j]
      dp = [[0] * (n + 1) for _ in range(m + 1)]
      for i in range(1, m + 1):
          for j in range(1, n + 1):
              if word1[i - 1] == word2[j - 1]:
                  dp[i][j] = dp[i - 1][j - 1] + 1
              else:
                  dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])
      lcs = dp[m][n]
      return (m - lcs) + (n - lcs)

Time: O(m * n). Space: O(m * n), reducible to O(min(m, n)).

Walkthrough:

 • This reduces to Longest Common Subsequence — the optimum keeps the LCS in both
   strings and deletes everything else. Total deletes = (m - lcs) + (n - lcs) .
 • LCS recurrence: when characters match, extend by 1; otherwise take the better of "drop the
   last char of word1 " or "drop the last char of word2 ".
 • Stating "this reduces to LCS" out loud, before coding, is the pattern-recognition payoff that
   interviewers grade on. Skipping to LCS code without naming the reduction looks lucky, not
   skilled.

Problem 3: Distinct Subsequences
Given two strings s and t , return the number of distinct subsequences of s that equal t . A
subsequence preserves the relative order of remaining characters. Constraints: 1 <= len(s),
len(t) <= 1000 .

Brute force: recursion choosing at each position of s whether to use it to match the current
position of t . Exponential.

Optimal solution:

  def numDistinct(s: str, t: str) -> int:
      m, n = len(s), len(t)
      if m < n:
          return 0
      # dp[i][j] = number of subsequences of s[:i] that equal t[:j]
      dp = [[0] * (n + 1) for _ in range(m + 1)]
      for i in range(m + 1):
          dp[i][0] = 1 # empty t matches empty subsequence of s in 1 way
      for i in range(1, m + 1):
          for j in range(1, n + 1):
              if s[i - 1] == t[j - 1]:
                   # either use s[i-1] to match t[j-1], or skip s[i-1]
                   dp[i][j] = dp[i - 1][j - 1] + dp[i - 1][j]
              else:
                   # must skip s[i-1]
                   dp[i][j] = dp[i - 1][j]
      return dp[m][n]

Time: O(m * n). Space: O(m * n), reducible to O(n).

Walkthrough:

 • The base case dp[i][0] = 1 is non-obvious — there is one way to match the empty t
   regardless of s : pick nothing. dp[0][j] = 0 for j > 0 falls out from the initial zero array.
 • When s[i-1] == t[j-1] , two paths combine: use this character of s to match (taking
   dp[i-1][j-1] paths) or skip it and look for the match later ( dp[i-1][j] paths). Sum, not
   max — this is a count variant.
 • When characters differ, the only choice is to skip s[i-1] . dp[i][j] = dp[i-1][j] .

## What to Say While Solving

"This is 2D DP on two strings — state is (i, j) standing for prefix lengths from each string,
  and the transition branches on whether the current characters match. The table is (m + 1) x
  (n + 1) with the extra row and column for the empty-prefix base case. I will index the table
  1-based against the 0-indexed strings, which means s[i - 1] and t[j - 1] inside the
  loop — that off-by-one is the trap I want to call out before coding. The match branch inherits
  the diagonal cell; the no-match branch takes 1 plus the min of three neighbours."

## Common Follow-up Questions

• Q: "Can you reduce space to O(min(m, n))?" — A: Yes — only the previous and current rows
   are needed, so two rolling 1D arrays of size min(m, n) + 1 suffice. Pick the shorter string
   as the row axis.

• Q: "How would you reconstruct the actual edit sequence?" — A: Backtrack from dp[m][n]
 to dp[0][0] . At each step, check which transition matched the current value and record
 the operation. O(m + n) extra work.
• Q: "What if delete and insert have different costs?" — A: Replace the +1 in each branch
 with the actual cost. Same complexity, weighted answer.
• Q: "What changes for case-insensitive comparison?" — A: Precompute s.lower() and
  t.lower() once and run the same DP.
• Q: "Delete Operation for Two Strings — does it reduce to a known DP?" — A: Yes, it
 reduces to Longest Common Subsequence. Total deletes = (m - lcs) + (n - lcs) .

## What NOT to Say

• "I will solve this with brute-force string transformation." — why it hurts: at any altitude
 above complete fresher, this signals you do not see the DP. The interviewer is specifically
 testing whether you recognise the (m + 1) x (n + 1) table shape — defaulting to brute means
 you are not playing the game they posed.
• "I will use a 3D DP — i, j, and the last operation taken." — why it hurts: the third dimension
 is unnecessary. The optimum at (i, j) does not depend on which operation produced it;
 only the cost matters. Adding a dimension you cannot justify multiplies the state space and
 signals you have not reduced the problem to its tightest form.
• "The base case is dp[0][0] = 0 and the rest is filled by the loop." — why it hurts: it is not
 — you also need dp[i][0] = i (delete cost) and dp[0][j] = j (insert cost). Missing
 either makes the recurrence read from zero-initialised cells and produces a wrong answer.
 The first-row and first-column base cases are the most-asked correctness point in 2D DP-
 on-strings.

## Pattern Recognition Cheat

• Keywords → edit distance, minimum operations to convert, insert delete replace, make two
 strings equal, number of distinct subsequences, longest common subsequence
• Data structure shape → (m + 1) x (n + 1) table 1-indexed against 0-indexed strings;
 each cell reads up to three parents — top, left, top-left
• Constraint shape → Compare two sequences; state is two prefix lengths; transition
 branches on whether current characters match

## Real-world Scenario

Microsoft India SDE-2 DSA Round 2 (sourced from GeeksforGeeks Microsoft India archive
 and AmbitionBox, 2023-2025): the candidate was given Edit Distance directly, followed by
 "now reconstruct the actual sequence of operations" as the immediate follow-up. The probe
 was whether the candidate would name the (m + 1) x (n + 1) table convention before coding,
 flag the 1-based-vs-0-based indexing trap, and switch to the backtracking-from- dp[m][n]

reconstruction without re-deriving the DP. Successful candidates stated the three transitions
  out loud (delete / insert / substitute → top / left / diagonal), wrote the base case explicitly,
  and finished both the cost computation and the reconstruction within the 45-minute window.

Sources for this pattern
Public interview reports drawn from AmbitionBox, Glassdoor, LinkedIn Posts, GeeksforGeeks
Microsoft India and Adobe India archives, and r/developersIndia threads, 2023-2026. See
Module 09 for full sourcing methodology. Edit Distance has been a Microsoft India and Adobe
India SDE-2 staple across the 2023-2025 cycles; Amazon India and Atlassian India routinely
use Distinct Subsequences as the count-variant follow-up to probe whether the candidate can
switch from the min recurrence to the sum recurrence on the same table shape.

