---
name: p72-catalan
description: Full reference for P72 (DP — Catalan Numbers / Tree) — blueprint, representative problems, follow-ups
---

# P72 — DP — Catalan Numbers / Tree

## Pattern Overview

The Catalan family covers a small but recognisable cluster of counting problems whose
recurrence has the same shape: C(n) = sum over i of C(i) * C(n - 1 - i) . Unique
Binary Search Trees count the number of structurally distinct BSTs built from n keys; Generate
Parentheses counts (and enumerates) valid balanced strings; the same numbers count
triangulations of a convex polygon and full binary trees with n internal nodes.

The pattern applies whenever a problem decomposes by "pick a pivot, recurse on left and
right" — a root choice in BSTs, the matching pair of a parenthesis, a chord splitting a polygon.
The signature trait separating Catalan DP from generic 1D DP (P61) is the product in the
recurrence — the answer for size n combines two smaller sub-answers multiplied, not added.
Counting forms use the DP table directly; generation forms backtrack with the same root-
choice loop. Catalan numbers grow like 4^n / (n * sqrt(n)) .

## Pattern Blueprint (code)

For the counting form, allocate dp[0..n] . Base case dp[0] = 1 — the empty structure is the
single "no choice" answer. For each size i from 1 to n, sum over every pivot position j from
0 to i - 1 : dp[i] += dp[j] * dp[i - 1 - j] . The answer is dp[n] . This is the textbook
O(n^2) Catalan recurrence.

dp[0] = 1
  for i in 1..n:
      for j in 0..i - 1:
          dp[i] += dp[j] * dp[i - 1 - j]
  return dp[n]

For the generation form, recurse instead of tabulate — for each pivot, recursively generate all
sub-structures for left and right, then combine via cross-product. Memoisation by sub-size
collapses repeated work; without it, the generation is exponential but the call tree maps cleanly
to the count.

## Representative Problems

Problem 1: Unique Binary Search Trees (Count)
Given an integer n , return the number of structurally unique BSTs which have exactly n
nodes of unique values from 1 to n. Constraints: 1 <= n <= 19 .

Brute force: enumerate every possible BST shape — exponential. The DP recurrence
collapses to O(n^2).

Optimal solution:

  from typing import List

  def numTrees(n: int) -> int:
      dp: List[int] = [0] * (n + 1)
      dp[0] = 1
      for i in range(1, n + 1):
          for j in range(i):
              # j nodes in the left subtree, i - 1 - j nodes in the right
              dp[i] += dp[j] * dp[i - 1 - j]
      return dp[n]

Time: O(n^2). Space: O(n).

Walkthrough:

 • The pivot is the root key. With i nodes total, picking root rank r means the left subtree
   holds r - 1 nodes and the right i - r . Count multiplies because the two subtree shapes
   are independent.
 • The recurrence loop variable j = r - 1 runs from 0 to i - 1 . Each j contributes dp[j]
   * dp[i - 1 - j] to dp[i] .
 • dp[0] = 1 is the empty-tree base. Forgetting this returns 0 for every size.
 • The values are Catalan numbers: dp[0..6] = [1, 1, 2, 5, 14, 42, 132] . Naming this
   earns trust.
 • n = 19 is the constraint ceiling because C(19) fits in 32 bits; C(20) overflows.

Problem 2: Unique Binary Search Trees II (Generate all)
Given an integer n , return all the structurally unique BSTs which have exactly n nodes of
unique values from 1 to n. Return any order. Constraints: 1 <= n <= 8 .

Brute force: enumerate every permutation of 1..n , insert into a BST, deduplicate by shape —
combinatorial and slow. The recursive generation form runs in time proportional to the number
of trees times tree size.

Optimal solution:

  from typing import List, Optional

  class TreeNode:
      def __init__(self, val=0, left=None, right=None):
          self.val = val
          self.left = left
          self.right = right

  def generateTrees(n: int) -> List[Optional[TreeNode]]:
      if n == 0:
          return []

       def build(start: int, end: int) -> List[Optional[TreeNode]]:
           if start > end:
               return [None]
           result: List[Optional[TreeNode]] = []
           for root_val in range(start, end + 1):
               left_subtrees = build(start, root_val - 1)
               right_subtrees = build(root_val + 1, end)
               for left in left_subtrees:
                   for right in right_subtrees:
                       node = TreeNode(root_val, left, right)
                       result.append(node)
           return result

       return build(1, n)

Time: O(C(n) * n) where C(n) is the n-th Catalan number — each of the C(n) trees has n nodes.
Space: O(C(n) * n) for the output.

Walkthrough:

 • The recursion is the generation analogue of the count DP. At each level, pick a root from
    start..end ; recurse on the left range and the right range; cross-product the returned sub-
   trees.
 • start > end returns [None] — the empty subtree is a single shape, represented by
   None. Returning [] instead would multiply-by-zero through the cross-product and yield no
   trees.
 • Memoising on (start, end) would let sub-trees be shared across multiple parent trees,
   but the standard problem definition requires distinct node objects per tree — so each cross-
   product builds a fresh TreeNode . Sharing would mutate sub-trees if any caller modifies
   them.

• Edge case: n = 0 returns the empty list (no trees). n = 1 returns a single-node tree
   wrapped in a list.

Problem 3: Generate Parentheses
Given n pairs of parentheses, generate all combinations of well-formed parentheses.
Constraints: 1 <= n <= 8 .

Brute force: enumerate every string of length 2n over {(, )} and filter for validity —
O(2^(2n) * n). The backtracking form prunes invalid prefixes early.

Optimal solution:

  from typing import List

  def generateParenthesis(n: int) -> List[str]:
      result: List[str] = []

       def backtrack(current: str, open_count: int, close_count: int) -> None:
           if len(current) == 2 * n:
               result.append(current)
               return
           if open_count < n:
               backtrack(current + '(', open_count + 1, close_count)
           if close_count < open_count:
               backtrack(current + ')', open_count, close_count + 1)

       backtrack('', 0, 0)
       return result

Time: O(4^n / sqrt(n)) — the n-th Catalan number times O(n) per build. Space: O(4^n / sqrt(n))
for the result list; recursion depth is O(n).

Walkthrough:

 • The invariant is close_count <= open_count <= n . The first guard prevents over-emitting
    ( ; the second prevents closing more than opened. Together they prune every invalid prefix.
 • The number of generated strings is exactly C(n) — the Catalan number. Any valid balanced
   string is a Dyck path, and Dyck paths count Catalan. Naming the link earns senior-loop
   trust.
 • String concatenation allocates a new string each call. For n <= 8 it is fine; for larger n
   switch to a mutable list and join at the leaf.

## What to Say While Solving

"This is a Catalan-number problem — the recurrence for size n sums over a pivot choice,
  with the left and right sub-problem counts multiplying. For Unique BSTs, the pivot is the root
  rank; for Generate Parentheses, the pivot is the position of the matching close-paren of the
  first open. The count form is a 1D DP of size n + 1 in O(n^2). For generation I will backtrack
  with the same root-choice loop, returning lists of sub-structures and cross-producting. I will

check the base case — empty structure has count 1 — and verify the small values match 1,
 1, 2, 5, 14 ."

## Common Follow-up Questions

• Q: "Why is dp[0] = 1 and not 0?" — A: The empty structure is exactly one shape — itself.
 The recurrence relies on this to get dp[1] = dp[0] * dp[0] = 1 and roll forward correctly.
 Setting dp[0] = 0 propagates zeros through every multiplication.
• Q: "Closed-form for the n-th Catalan number?" — A: C(n) = (2n)! / ((n + 1)! * n!) or
 equivalently C(n) = binomial(2n, n) / (n + 1) . Useful for O(n) computation using a
 single binomial calculation, but the DP form is what interviewers want to see first.
• Q: "Memoise the Generate Trees recursion." — A: Memoising on (start, end) shares
 sub-trees across multiple parents. Be careful — if the caller mutates a returned tree, the
 shared structure corrupts other trees. Standard LeetCode answer keeps trees independent.
• Q: "Number of full binary trees with n internal nodes?" — A: Same Catalan recurrence —
 each internal node is the root of a sub-tree, and the count splits by how many of the
 remaining n - 1 internal nodes go left vs right. C(n).
• Q: "How does this relate to counting triangulations of a convex polygon?" — A: A convex
 polygon with n + 2 vertices has C(n) triangulations, each one fixing a base edge and
 choosing a third vertex to form a triangle, then recursing on the two sub-polygons. Same
 product recurrence.

## What NOT to Say

• "I will sum the sub-counts." — why it hurts: the recurrence is a product, not a sum, of left
 and right sub-counts. Summing turns Catalan into a Fibonacci-shaped 1D DP and produces
 values like dp[1..5] = 1, 2, 4, 8, 16 — visibly wrong against the known Catalan
 sequence. Interviewers test on n = 3 because dp[3] = 5 exposes the bug immediately
 (sum gives 4).
• "Recurse without memoisation and compute the count." — why it hurts: the recursive
 count without memo is exponential — branching factor n at depth n, identical sub-problems
 re-computed thousands of times for n = 19 . Interviewers ask "what is your time
 complexity?" specifically to surface this; "exponential, but Python is fast" is the wrong
 answer. Tabulate.
• "Generate Parentheses is a string problem, not a Catalan problem." — why it hurts: it is
 both — and seeing the Catalan structure unlocks the count and the generalisation to
 "number of valid sequences of length 2n with constraint X". Treating it as a one-off
 backtracking exercise misses the family link that senior interviewers probe with "how many
 such strings exist?".

## Pattern Recognition Cheat

• Keywords → unique BSTs, Catalan, generate parentheses, balanced strings, triangulations,
   full binary trees, number of valid sequences
 • Data structure shape → 1D dp array of size n + 1 for the count, with dp[0] = 1 ;
   recursive backtracking with cross-products for generation
 • Constraint shape → Single integer n (the size); answer is a count or a list of all valid
   structures of size n

## Real-world Scenario

Adobe India MTS-2 DSA Round 1 (sourced from AmbitionBox Adobe India pages and
  GeeksforGeeks Adobe archive, 2023-2025): the candidate was given a parser problem
  framed as "count the number of distinct expression trees for n operands with binary
  operators" and asked to derive the recurrence and code the DP. The probe was whether the
  candidate would recognise the Catalan family from the structural recurrence — pivot on the
  root operator and multiply left and right counts. Successful candidates named "Catalan
  numbers" within the first minute, derived the C(n-1) answer from the operator-pivot insight,
  and stated the small values 1, 1, 2, 5, 14 from memory before writing the DP loop.

Sources for this pattern
Public interview reports drawn from AmbitionBox, Glassdoor, LinkedIn Posts, LeetCode
discuss India tag, GeeksforGeeks company archives, and r/developersIndia threads,
2023-2026. See Module 09 for full sourcing methodology. The Catalan family — Unique BSTs
and Generate Parentheses specifically — has been an Adobe India MTS-2 and Atlassian India
SDE-2 round-1 staple across the 2023-2025 cycles; the triangulation and full-binary-tree
variants appear in Microsoft India senior loops as the "name the family" discriminator.

