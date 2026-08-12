---
name: p70-palindrome
description: Full reference for P70 (DP on Strings — Palindrome /) — blueprint, representative problems, follow-ups
---

# P70 — DP on Strings — Palindrome /

## Pattern Overview

DP on strings collects the harder string problems that resist single-pass scans — palindrome
detection over O(n^2) regions, palindrome partitioning with a cost objective, and pattern
matching with wildcards. The unifying idea is a 2D boolean or integer table indexed by string
intervals (i, j) or by (text_index, pattern_index) . Interval-based DP fills by increasing
length; matching DP fills row by row.

The pattern applies when the brute force is exponential on a string and the answer
decomposes into substring or prefix-pair sub-problems. The signature trait separating this
family from LCS (P68) is that DP-on-strings frequently uses a boolean palindrome table as a
sub-routine, and the matching variants use a (m + 1) x (n + 1) table where the second axis
is a pattern, not another text. Once you internalise the interval-fill order and the regex transition
cases, partition cost, substring detection, and wildcard matching collapse to one mental
model.

## Pattern Blueprint (code)

For palindrome problems, allocate a boolean is_pal[i][j] table and fill by increasing length.
For pattern matching, allocate dp[i][j] answering "does the first i characters of text match
the first j of pattern?". The empty-pattern column is True only for the empty-text row, with
extra handling for leading x* allowing zero copies.

# interval-fill palindrome
  for length in 1..n:
      for i in 0..n - length:
          j = i + length - 1
          if length == 1: is_pal[i][j] = True
          elif length == 2: is_pal[i][j] = (s[i] == s[j])
          else: is_pal[i][j] = (s[i] == s[j]) and is_pal[i + 1][j - 1]

For partitioning cost, layer a cuts[i] array on top: minimum cuts to partition s[0..i] into
palindromes. For every j such that s[j..i] is a palindrome, set cuts[i] = min(cuts[i],
cuts[j - 1] + 1) .

## Representative Problems

Problem 1: Longest Palindromic Substring (DP form)
Given a string s , return the longest palindromic substring in s . Constraints: 1 <= len(s) <=
1000 .

Brute force: enumerate every substring, check palindrome. O(n^3). The O(n^2) DP and the
O(n^2) expand-around-centre approaches both work; we show the DP because it composes
with downstream interval problems.

Optimal solution:

  from typing import List

  def longestPalindrome(s: str) -> str:
      n = len(s)
      if n < 2:
          return s
      is_pal: List[List[bool]] = [[False] * n for _ in range(n)]
      start, max_len = 0, 1
      for i in range(n):
          is_pal[i][i] = True
      for length in range(2, n + 1):
          for i in range(n - length + 1):
              j = i + length - 1
              if length == 2:
                   is_pal[i][j] = s[i] == s[j]
              else:
                   is_pal[i][j] = s[i] == s[j] and is_pal[i + 1][j - 1]
              if is_pal[i][j] and length > max_len:
                   start, max_len = i, length
      return s[start:start + max_len]

Time: O(n^2). Space: O(n^2) — reducible to O(n) with expand-around-centre, but the DP table
is the form needed for partitioning.

Walkthrough:

 • Fill order is by increasing length. Each cell is_pal[i][j] depends on the shorter
   is_pal[i + 1][j - 1] which must be filled first; row-major fill would reference
   uncomputed cells.
 • The length-2 carve-out is load-bearing: for length = 2 , i + 1 > j - 1 and the table
   look-up would be out of bounds. Treating two-character matches as a direct equality avoids
   the indexing trap.
 • Tracking start and max_len instead of the substring itself saves O(n) slicing inside the
   loop. The final slice is O(n) once.
 • For n = 10^5 switch to Manacher's O(n) algorithm — flag this in senior rounds but rarely
   required.

Problem 2: Palindrome Partitioning II
Given a string s , partition it such that every substring of the partition is a palindrome. Return
the minimum cuts needed. Constraints: 1 <= len(s) <= 2000 .

Brute force: enumerate every partitioning, count cuts where every piece is a palindrome.
Exponential. A naive O(n^3) DP recomputes palindrome status inside the cut loop. The O(n^2)
form precomputes the boolean table.

Optimal solution:

  from typing import List

  def minCut(s: str) -> int:
      n = len(s)
      if n < 2:
          return 0
      is_pal: List[List[bool]] = [[False] * n for _ in range(n)]
      for i in range(n):
          is_pal[i][i] = True
      for length in range(2, n + 1):
          for i in range(n - length + 1):
              j = i + length - 1
              if length == 2:
                   is_pal[i][j] = s[i] == s[j]
              else:
                   is_pal[i][j] = s[i] == s[j] and is_pal[i + 1][j - 1]
      cuts = [0] * n
      for i in range(n):
          if is_pal[0][i]:
              cuts[i] = 0
              continue
          cuts[i] = i # worst case: cut between every character
          for j in range(1, i + 1):
              if is_pal[j][i]:
                   cuts[i] = min(cuts[i], cuts[j - 1] + 1)
      return cuts[n - 1]

Time: O(n^2). Space: O(n^2).

Walkthrough:

 • Two passes: first build the palindrome boolean table; second walk i from 0 to n - 1
   computing cuts[i] — minimum cuts for the prefix ending at i .
 • The inner loop tries every split point j : if s[j..i] is a palindrome, the answer is cuts[j -
   1] + 1 . Starting with cuts[i] = i (cut between every character) ensures the min is
   meaningful even if no palindromic suffix is found.
 • The if is_pal[0][i] shortcut sets cuts[i] = 0 when the whole prefix is itself a
   palindrome. Forgetting this returns 1 instead of 0 on inputs like "aba" .

Problem 3: Regular Expression Matching
Given an input string s and a pattern p , implement regex matching with support for . (any
single character) and * (zero or more of the preceding element). The match must cover the
entire input string. Constraints: 1 <= len(s) <= 20 , 1 <= len(p) <= 20 .

Brute force: recursive backtracking over (s_index, p_index) exploring * as zero or more
copies. Exponential. Memoising on (i, j) gives O(m * n) — and the iterative DP form is what
we show.

Optimal solution:

  from typing import List

  def isMatch(s: str, p: str) -> bool:
      m, n = len(s), len(p)
      dp: List[List[bool]] = [[False] * (n + 1) for _ in range(m + 1)]
      dp[0][0] = True
      # handle leading patterns like a*, a*b*, etc., that match empty text
      for j in range(2, n + 1):
          if p[j - 1] == '*':
              dp[0][j] = dp[0][j - 2]
      for i in range(1, m + 1):
          for j in range(1, n + 1):
              if p[j - 1] == '*':
                  # zero copies of the preceding element
                  dp[i][j] = dp[i][j - 2]
                  # OR one+ copies, if the preceding element matches s[i - 1]
                  if p[j - 2] == '.' or p[j - 2] == s[i - 1]:
                      dp[i][j] = dp[i][j] or dp[i - 1][j]
              elif p[j - 1] == '.' or p[j - 1] == s[i - 1]:
                  dp[i][j] = dp[i - 1][j - 1]
      return dp[m][n]

Time: O(m * n). Space: O(m * n) — reducible to O(n) with two rolling rows.

Walkthrough:

 • The base case dp[0][0] = True is the empty-text-matches-empty-pattern anchor. The
   empty-text row dp[0][j] is True only when the pattern up to j is composed of x* pairs
   all matching zero copies; the explicit loop handles that.

• The * branch has two arms: dp[i][j - 2] uses the x* group zero times (skip it); dp[i -
  1][j] uses it one or more times — only if the preceding element matches the current text
  character.
 • The non- * branch is the simple character match: literal equality or . , in which case dp[i]
  [j] = dp[i - 1][j - 1] .
 • A pattern starting with * is invalid by the problem's guarantee; the table look-ups stay in
  bounds because the * handling indexes j - 2 .

## What to Say While Solving

"This is DP on strings — I will need a 2D table either over intervals (i, j) of the string or
 over (text_index, pattern_index) for matching. For the palindrome family I will build a
 boolean is_pal[i][j] table filling by increasing interval length, with the length-2 carve-out.
 For regex matching I will set the empty-text-empty-pattern base True, handle the leading x*
 cases, and split the recurrence by whether the current pattern character is * , . , or a literal.
 Both forms are O(m * n) time and space, reducible to O(n) for length-only."

## Common Follow-up Questions

• Q: "Can you do longest palindromic substring in O(n)?" — A: Yes — Manacher's algorithm
  runs in O(n) by reusing palindromic reflection within a rightmost-known palindrome. Mention
  if the interviewer probes "can you beat O(n^2)?".
 • Q: "Reduce regex matching to O(n) space." — A: Two rolling 1D arrays of size n + 1 . The
  recurrence references dp[i - 1][j - 1] and dp[i - 1][j] only, so two rows suffice.
  Reconstruction still needs the full grid.
 • Q: "How does Wildcard Matching differ — ? is any single character, * is any sequence?"
  — A: The wildcard * arm is dp[i][j] = dp[i - 1][j] or dp[i][j - 1] (extend or skip),
  simpler than regex * because * here is not paired with a preceding element.
 • Q: "Memoised recursion or bottom-up table — which do you prefer?" — A: Bottom-up table
  for the interview because base cases and fill order are explicit. Acceptable to start with
  recursion and translate to a table.

## What NOT to Say

• "Palindromic substring is the same as palindromic subsequence." — why it hurts: substring
  is contiguous; subsequence allows gaps. Longest Palindromic Subsequence (P68) uses a
  different recurrence and produces a different answer. Conflating them eats interview time on
   "abcdba" and signals the foundational distinction was never internalised.
 • "I will skip the boolean palindrome table and recompute inside the cuts loop." — why it
  hurts: that is the O(n^3) DP. For n = 2000 that is 8 * 10^9 operations — well over the
  interview ceiling. The two-pass form (precompute then cut) is the textbook O(n^2).

• "Regex matching is too hard for an interview." — why it hurts: it is on every senior product-
   co loop and is solvable in 15 minutes with the table. The correct move is to write the empty-
   text base row, then the two * arms, and verify on s = "aab", p = "c*a*b" .

## Pattern Recognition Cheat

• Keywords → longest palindromic substring, palindrome partition, minimum cuts, regex
   match, wildcard, . and * , interval DP on string
 • Data structure shape → 2D boolean palindrome table or 2D match table over text and
   pattern; interval fill by length, matching fill row-by-row
 • Constraint shape → Single string with substring or interval question, or two-input text vs
   pattern with wildcard semantics

## Real-world Scenario

Razorpay Backend Engineer DSA Round 2 (sourced from AmbitionBox interview reports
  and Medium Razorpay SDE write-ups, 2023-2025): the candidate was given a log of
  merchant identifiers and asked to partition the log into the minimum number of pieces where
  each piece reads the same forwards as backwards — framed as a fraud-pattern detection
  scenario. The probe was whether the candidate would build the boolean palindrome table
  separately from the cut DP and answer the O(n^2) vs O(n^3) follow-up correctly. Successful
  candidates named "palindrome partitioning II" within 30 seconds, sketched the two-pass DP
  on the whiteboard, and explained the length-2 carve-out before coding.

Sources for this pattern
Public interview reports drawn from AmbitionBox, Glassdoor, LinkedIn Posts, LeetCode
discuss India tag, and r/developersIndia threads, 2023-2026. See Module 09 for full sourcing
methodology. DP on strings — palindrome partitioning and regex matching specifically — has
been a Razorpay Backend Engineer Round 2 and Adobe India MTS-2 staple across the
2023-2025 cycles; PhonePe SDE-2 routinely uses the wildcard matching variant as the senior-
loop discriminator.

