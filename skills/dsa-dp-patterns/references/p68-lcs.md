---
name: p68-lcs
description: Full reference for P68 (Longest Common Subsequence) — blueprint, representative problems, follow-ups
---

# P68 — Longest Common Subsequence

## Pattern Overview

LCS is the canonical two-string DP. State is dp[i][j] — the length of the longest common
subsequence of s1[:i] and s2[:j] . The recurrence has two cases: if the trailing characters
match, extend the diagonal answer; if they differ, take the better of dropping a character from
either string. The grid is filled row-by-row in O(m * n); reconstruction walks the grid backwards
from dp[m][n] reading off the matched characters.

The pattern applies anywhere a problem asks for the largest order-preserving overlap between
two sequences. The signature trait separating LCS from edit-distance (P65) is the operator:
LCS maximises a length, edit-distance minimises a cost. Once the LCS skeleton is
internalised, derivative problems collapse — Longest Palindromic Subsequence is LCS of the
string and its reverse, Shortest Common Supersequence is m + n - LCS_length , and the
diff / patch family is LCS with reconstruction.

## Pattern Blueprint (code)

Allocate dp of size (m + 1) x (n + 1) filled with zeros — the extra row and column are the
empty-prefix base case. Iterate i from 1 to m, j from 1 to n. If s1[i - 1] == s2[j - 1] ,
set dp[i][j] = dp[i - 1][j - 1] + 1 . Otherwise set dp[i][j] = max(dp[i - 1][j],
dp[i][j - 1]) . The answer is dp[m][n] . To recover the actual subsequence, start at (m, n)
and walk back: on a diagonal match emit the character and step diagonally, otherwise step to
whichever neighbour matches the current cell value.

dp[i][0] = dp[0][j] = 0
  for i in 1..m:
      for j in 1..n:
          if s1[i-1] == s2[j-1]:
              dp[i][j] = dp[i-1][j-1] + 1
          else:
              dp[i][j] = max(dp[i-1][j], dp[i][j-1])
  return dp[m][n]

Space optimisation: only the previous and current rows are needed, so two 1D arrays of size n
+ 1 reduce space to O(n). The reconstruction step requires the full grid; if only the length is
asked, stick with two rows.

## Representative Problems

Problem 1: Longest Common Subsequence (Length)
Given two strings text1 and text2 , return the length of their longest common subsequence.
A subsequence is a sequence derived by deleting zero or more characters without changing
the relative order. Constraints: 1 <= len(text1), len(text2) <= 1000 .

Brute force: enumerate every subsequence of text1 and check if it is a subsequence of
text2 . O(2^m * n). Memoising recursion on (i, j) (drop from front or back) reduces to O(m
* n) — that is the natural step to the DP table.

Optimal solution:

  from typing import List

  def longestCommonSubsequence(text1: str, text2: str) -> int:
      m, n = len(text1), len(text2)
      dp: List[List[int]] = [[0] * (n + 1) for _ in range(m + 1)]
      for i in range(1, m + 1):
          for j in range(1, n + 1):
              if text1[i - 1] == text2[j - 1]:
                  dp[i][j] = dp[i - 1][j - 1] + 1
              else:
                  dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])
      return dp[m][n]

Time: O(m * n). Space: O(m * n) — reducible to O(min(m, n)) with rolling rows.

Walkthrough:

 • The [[0] * (n + 1) for _ in range(m + 1)] form is load-bearing — never
   [[0] * (n + 1)] * (m + 1) because the latter creates m + 1 references to one row and
   a single write corrupts the grid.
 • The off-by-one s1[i - 1] indexing is the convention: row i corresponds to "first i
   characters of s1". Row 0 is the empty-prefix base.

• Why is the else branch a max of neighbours and not the diagonal? If the trailing
   characters differ, one of them is not in the LCS ending here — so the answer is whichever
   prefix-pair you could extend instead. Picking the diagonal directly produces wrong answers
   on "ab" vs "ba" .

Problem 2: Longest Palindromic Subsequence
Given a string s , return the length of the longest palindromic subsequence in s . Constraints:
1 <= len(s) <= 1000 .

Brute force: enumerate every subsequence and test for palindrome. O(2^n * n). Recursion on
(i, j) with cases "match the ends and shrink both, or drop one end" memoises to O(n^2) —
which is the same as the LCS-of-s-and-reverse trick.

Optimal solution:

  from typing import List

  def longestPalindromeSubseq(s: str) -> int:
      n = len(s)
      dp: List[List[int]] = [[0] * n for _ in range(n)]
      for i in range(n):
          dp[i][i] = 1
      for length in range(2, n + 1):
          for i in range(n - length + 1):
              j = i + length - 1
              if s[i] == s[j]:
                  # match shrinks the interval and adds 2 — or 1 if length == 2
                  dp[i][j] = dp[i + 1][j - 1] + 2 if length > 2 else 2
              else:
                  dp[i][j] = max(dp[i + 1][j], dp[i][j - 1])
      return dp[0][n - 1]

Time: O(n^2). Space: O(n^2).

Walkthrough:

 • This is the interval form of LCS — state (i, j) is the longest palindromic subsequence in
   s[i..j] . Length-1 intervals are palindromes of length 1; that is the base.
 • Fill order is by increasing length, not row. Each cell depends on shorter intervals; row-major
   fill would reference uncomputed cells.
 • The length == 2 carve-out handles two-character intervals: if both match the answer is 2,
   not dp[i+1][j-1] + 2 which would index an empty interval.
 • Equivalently, longestPalindromeSubseq(s) == longestCommonSubsequence(s, s[::-1]) .
   Senior interviewers ask for the equivalence proof.

Problem 3: Shortest Common Supersequence
Given two strings str1 and str2 , return the shortest string that has both str1 and str2 as
subsequences. If multiple answers exist, return any of them. Constraints: 1 <= len(str1),
len(str2) <= 1000 .

Brute force: try every interleaving — exponential. Computing the length is m + n -
LCS_length ; reconstruction requires the LCS DP table.

Optimal solution:

  from typing import List

  def shortestCommonSupersequence(str1: str, str2: str) -> str:
      m, n = len(str1), len(str2)
      dp: List[List[int]] = [[0] * (n + 1) for _ in range(m + 1)]
      for i in range(1, m + 1):
          for j in range(1, n + 1):
              if str1[i - 1] == str2[j - 1]:
                   dp[i][j] = dp[i - 1][j - 1] + 1
              else:
                   dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])
      # walk back to build the supersequence
      i, j = m, n
      out: List[str] = []
      while i > 0 and j > 0:
          if str1[i - 1] == str2[j - 1]:
              out.append(str1[i - 1])
              i -= 1
              j -= 1
          elif dp[i - 1][j] >= dp[i][j - 1]:
              out.append(str1[i - 1])
              i -= 1
          else:
              out.append(str2[j - 1])
              j -= 1
      while i > 0:
          out.append(str1[i - 1])
          i -= 1
      while j > 0:
          out.append(str2[j - 1])
          j -= 1
      return ''.join(reversed(out))

Time: O(m * n). Space: O(m * n).

Walkthrough:

 • The DP table is identical to LCS. Reconstruction is where the supersequence appears: on a
   match emit the character once and step diagonally; on a mismatch emit the character from
   whichever string is being kept and step.
 • The supersequence is built in reverse — append while walking back from (m, n) to (0,
   0) , then reverse. Joining a list of single characters is the cleanest pattern; concatenating
   strings inside the loop is O(n^2).
 • Length sanity: len(result) == m + n - dp[m][n] . Each character in the LCS appears
   once in the result; everything else appears once each.

## What to Say While Solving

"This is the two-string LCS pattern, so I will set up a (m + 1) x (n + 1) grid where dp[i]
 [j] holds the LCS length of the first i and first j characters. If the trailing characters
 match, I extend the diagonal; otherwise I take the max of dropping from either side. That
 gives O(m * n) time and space — I can roll to O(n) space if I only need the length, but I will
 start with the full grid because the follow-up usually asks me to reconstruct the
 subsequence. I will watch out for empty strings and confirm the base row and column stay
 zero."

## Common Follow-up Questions

• Q: "Reconstruct the actual subsequence." — A: Walk back from (m, n) : on a match emit
  and step diagonally; on a mismatch step to whichever neighbour holds the current cell
  value. Reverse at the end.
 • Q: "Relationship between LCS and Edit Distance?" — A: Edit Distance is the minimum cost
  form with insert / delete / replace; LCS counts kept characters whereas Edit Distance
  counts changed ones. With inserts and deletes only, EditDistance(s, t) = m + n - 2 *
  LCS(s, t) .
 • Q: "Make this O(min(m, n)) space." — A: Roll two 1D arrays of size min(m, n) + 1 .
  Length-only — reconstruction needs the full grid.
 • Q: "Faster than O(m * n)?" — A: Hunt-Szymanski hits O((r + n) log n) for sparse matches;
  bit-parallel forms hit O(m * n / w). Rarely interview-expected.
 • Q: "Longest Common Substring instead of subsequence?" — A: Same grid, different
  recurrence: dp[i][j] = dp[i - 1][j - 1] + 1 on match, 0 on mismatch. Answer is the
  max value anywhere in the grid.

## What NOT to Say

• "Take the diagonal on mismatch." — why it hurts: factual error — on a mismatch the
  answer is max(dp[i - 1][j], dp[i][j - 1]) , not the diagonal. The bug passes simple
  test cases ("abc" vs "abc") because matches dominate; it fails on "ab" vs "ba" returning
  0 instead of 1. Senior interviewers test this exact case to catch the misremember.
 • "I will reduce space to O(1)." — why it hurts: impossible. Two adjacent cells in the same
  row depend on the previous row, so two 1D arrays is the floor — O(min(m, n)) space, not
  O(1). Claiming O(1) signals you have not actually unrolled the dependency.
 • "Subsequence is the same as substring." — why it hurts: subsequence preserves order but
  allows gaps; substring is contiguous. Longest Common Substring uses a different
  recurrence and resets on mismatch. Conflating them eats interview time and signals the
  foundational distinction was never internalised.

## Pattern Recognition Cheat

• Keywords → longest common subsequence, shortest supersequence, longest palindromic
   subsequence, minimum deletions to align, two strings, order-preserving overlap
 • Data structure shape → (m + 1) x (n + 1) integer DP grid filled row-by-row; optional
   reconstruction walks back from (m, n)
 • Constraint shape → Two sequences on the input; question asks for length or content of
   the largest order-preserving overlap

## Real-world Scenario

Microsoft India SDE-2 DSA Round 1 (sourced from GeeksforGeeks Microsoft India archive
  and AmbitionBox interview reports, 2023-2025): the candidate was given two code-review
  comment threads and asked to find the longest sequence of shared reviewers that appeared
  in both threads in the same relative order — framed as a customer-merge scenario. The
  probe was whether the candidate would set up the LCS grid correctly, get the off-by-one
  indexing right, and handle the reconstruction follow-up. Successful candidates named LCS
  within the first 30 seconds, drew the small 5x5 grid on the whiteboard before coding, and
  reconstructed the actual subsequence on request without restarting.

Sources for this pattern
Public interview reports drawn from AmbitionBox, Glassdoor, LinkedIn Posts, LeetCode
discuss India tag, and r/developersIndia threads, 2023-2026. See Module 09 for full sourcing
methodology. LCS and its derivatives — Longest Palindromic Subsequence, Shortest Common
Supersequence, Edit Distance — have been Microsoft India and Adobe India SDE-2 round 1
staples across the 2023-2025 cycles; Atlassian India routinely uses LCS reconstruction as the
senior-loop discriminator.

