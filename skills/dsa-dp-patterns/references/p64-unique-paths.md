---
name: p64-unique-paths
description: Full reference for P64 (2D DP — Unique Paths / Grid) — blueprint, representative problems, follow-ups
---

# P64 — 2D DP — Unique Paths / Grid

## Pattern Overview

Unique Paths and its variants are the canonical entry point to 2D DP — a grid, a start cell, an
end cell, moves restricted to "right or down", and a question that decomposes cleanly into
"how did I get here from cells I could have come from". The recurrence is dp[i][j] = dp[i-1]
[j] + dp[i][j-1] for the count variant, or dp[i][j] = grid[i][j] + min(dp[i-1][j],
dp[i][j-1]) for the min-path-sum variant. Both share the same fill order — row by row, left to
right — and both collapse from O(m * n) space to O(n) by retaining only the previous row.

The pattern applies when you have a grid with constrained moves and need to count distinct
paths or find the optimal-cost path between corners. The signature trait distinguishing it from
grid BFS / DFS (P12, P40) is that there is no exploration of arbitrary neighbours — the move set
is restricted enough that you fill the grid in a single forward sweep, with each cell needing only
already-filled cells. That is the DP, not the search.

## Pattern Blueprint (code)

Fill the dp grid row by row, left to right. The first row and first column are base cases — the
only way to reach any cell on the top row is by moving right from the start, so all entries are 1
(for count) or the running prefix sum (for min-path). Same for the first column. After that, each
interior cell uses dp[i-1][j] (cell above, already filled) and dp[i][j-1] (cell to the left, also
already filled).

# Unique Paths (count)
  dp[0][j] = 1 for all j
  dp[i][0] = 1 for all i
  for i from 1 to m-1:
      for j from 1 to n-1:
          dp[i][j] = dp[i-1][j] + dp[i][j-1]
  return dp[m-1][n-1]

  # Space-optimised: one rolling row of size n
  dp = [1] * n
  for i from 1 to m-1:
      for j from 1 to n-1:
          dp[j] = dp[j] + dp[j-1]   # dp[j] = old (above), dp[j-1] = new (left)
  return dp[n-1]

The space-optimised form is the senior-altitude answer because it shows you realised only the
previous row is needed at any moment. The rolling form keeps total auxiliary space at O(n) (or
O(min(m, n)) if you pick the shorter dimension as the rolling axis).

## Representative Problems

Problem 1: Unique Paths
A robot is located at the top-left corner of an m x n grid. The robot can only move either down
or right. The robot is trying to reach the bottom-right corner. How many possible unique paths
are there? Constraints: 1 <= m, n <= 100 .

Brute force: pure recursion — paths(i, j) = paths(i-1, j) + paths(i, j-1) with base
paths(0, j) = paths(i, 0) = 1 . Exponential because the same (i, j) is recomputed
across many branches.

Optimal solution (bottom-up tabulation):

  def uniquePaths(m: int, n: int) -> int:
      dp = [[1] * n for _ in range(m)]
      for i in range(1, m):
          for j in range(1, n):
              dp[i][j] = dp[i - 1][j] + dp[i][j - 1]
      return dp[m - 1][n - 1]

Optimal solution (space-optimised 1D):

  def uniquePaths(m: int, n: int) -> int:
      dp = [1] * n
      for _ in range(1, m):
          for j in range(1, n):
              dp[j] += dp[j - 1]
      return dp[n - 1]

Time: O(m * n). Space: O(m * n) for the full table, O(n) for the rolling row.

Walkthrough:

 • The first row and first column are all 1 because there is one way to reach any of them —
     keep moving right (or keep moving down).
 • The rolling-row form works because when processing row i , column j , the value dp[j]
     still holds the row- i-1 answer (cell above) and dp[j-1] already holds the row- i answer
     (cell to the left).
 • Closed-form alternative: C(m + n - 2, m - 1) — the number of ways to choose which m
     - 1 of the total m + n - 2 moves are downward. Mention this for large grids; do not code
     unless asked.
 • The memoised recursive form using @lru_cache(maxsize=None) on paths(i, j) is the
     equivalent top-down version — same complexity, same answer.

Problem 2: Unique Paths II (with obstacles)
An m x n grid contains an obstacle in some cells, marked as 1, and empty cells marked as 0.
Return the number of unique paths from the top-left to the bottom-right, where a path cannot
pass through an obstacle cell. Constraints: 1 <= m, n <= 100 , obstacleGrid[i][j] is 0 or
1.

Brute force: same recursion as Unique Paths with an extra check — if the current cell is an
obstacle, return 0. Memoise to collapse to O(m * n).

Optimal solution:

     from typing import List

     def uniquePathsWithObstacles(obstacleGrid: List[List[int]]) -> int:
         if not obstacleGrid or obstacleGrid[0][0] == 1:
             return 0
         m, n = len(obstacleGrid), len(obstacleGrid[0])
         dp = [0] * n
         dp[0] = 1
         for i in range(m):
             for j in range(n):
                 if obstacleGrid[i][j] == 1:
                      dp[j] = 0
                 elif j > 0:
                      dp[j] += dp[j - 1]
         return dp[n - 1]

Time: O(m * n). Space: O(n).

Walkthrough:

 • The rolling row starts with dp[0] = 1 and the rest 0. The first row is computed inside the
     main loop — when an obstacle is absent and j > 0 , dp[j] += dp[j-1] propagates the 1
     forward until an obstacle blocks it.
 • An obstacle cell sets dp[j] = 0 because no path passes through it. This must happen
     before neighbours read it, which is why the obstacle check is the first branch.

• Early return on obstacleGrid[0][0] == 1 — if the start is blocked, no path exists.
   Blocked end cells are handled naturally by the loop ending with dp[n-1] = 0 .

Problem 3: Minimum Path Sum
Given an m x n grid filled with non-negative integers, find a path from top-left to bottom-right
which minimises the sum of all numbers along its path. You can only move right or down.
Constraints: 1 <= m, n <= 200 , 0 <= grid[i][j] <= 200 .

Brute force: recursion exploring both moves at each cell. min_path(i, j) = grid[i][j] +
min(min_path(i-1, j), min_path(i, j-1)) . Exponential without memoisation.

Optimal solution:

  from typing import List

  def minPathSum(grid: List[List[int]]) -> int:
      m, n = len(grid), len(grid[0])
      dp = [float('inf')] * n
      dp[0] = 0
      for i in range(m):
          dp[0] += grid[i][0]
          for j in range(1, n):
              if i == 0:
                  dp[j] = dp[j - 1] + grid[i][j]
              else:
                  dp[j] = min(dp[j], dp[j - 1]) + grid[i][j]
      return dp[n - 1]

Time: O(m * n). Space: O(n).

Walkthrough:

 • The rolling row holds the min-path sums for the previous row at the start of iteration i . For
   the first row, each cell is the prefix sum to the left. For later rows, dp[j] = min(dp[j],
   dp[j-1]) + grid[i][j] picks the cheaper parent.
 • dp[0] += grid[i][0] updates the leftmost column outside the inner loop because it has
   only one parent (the cell above). Mixing this into the inner-loop logic is the off-by-one trap.
 • Naming the family aloud — "classic 2D grid DP with cell-from-above-or-left transition" —
   signals fluency and sets up cleanly for Edit Distance follow-ups.

## What to Say While Solving

"This is 2D grid DP — the answer at any cell depends on the answer at the cell above and
  the cell to the left because moves are restricted to right or down. I will fill row by row, left to
  right, so both parents are always already computed. The base case is the first row and first
  column, which have a single ancestor each. The full table is O(m * n) space, but only the
  previous row is needed at any moment, so I will collapse to a 1D rolling row of size n for O(n)
  space."

## Common Follow-up Questions

• Q: "Can you solve Unique Paths in O(1) space?" — A: Yes — the closed-form is C(m + n -
 2, m - 1) , computed with a single loop in O(min(m, n)) time and O(1) space. The
 combinatorial form is the math-savvy answer.
• Q: "What if diagonal moves are also allowed?" — A: The recurrence widens to dp[i][j] =
 dp[i-1][j] + dp[i][j-1] + dp[i-1][j-1] . Same fill order, same complexity.
• Q: "What if some cells are obstacles?" — A: Set dp[i][j] = 0 for obstacle cells before
 the recurrence reads them. The early return on a blocked start is the edge case.
• Q: "Can you reconstruct the actual path with minimum sum?" — A: Backtrack from [m-1]
 [n-1] by comparing dp[i-1][j] and dp[i][j-1] and moving to the smaller parent. O(m
 + n) extra work, no extra storage.
• Q: "What if costs include negative numbers?" — A: The same DP works because the
 transition is min , not max . Negative numbers do not break the optimality. Only if you
 allowed cycles would it break, and the right-or-down restriction forbids cycles.

## What NOT to Say

• "I will use BFS / DFS to explore all paths." — why it hurts: this signals you missed the DP.
 Explicit path exploration is exponential and ignores the overlapping-subproblem structure.
 The interviewer asks "how many paths can there be?" — for a 30x30 grid it is C(58, 29),
 roughly 3 * 10^16 — clearly not enumerable.
• "I will use a 2D dp array." — why it hurts: it works, but interviewers expect you to flag the
 rolling-row optimisation. Stopping at 2D leaves an "and could you reduce to 1D?" follow-up
 on the table; saying it yourself shows seniority.
• "The first row and first column do not need a base case." — why it hurts: they absolutely
 do. Without setting dp[0][j] = 1 (count) or dp[0][j] = prefix sum (min path), the
 recurrence reads from uninitialised cells. The base case is the single most-asked
 correctness point in 2D DP.

## Pattern Recognition Cheat

• Keywords → unique paths, only right or down, grid top-left to bottom-right, minimum path
 sum, obstacle grid, count grid paths
• Data structure shape → 2D dp table of the grid shape, or 1D rolling row of width n for
 space optimisation
• Constraint shape → Move set is restricted enough that each cell has 1-3 fixed parents, so
 the table fills in a single forward sweep without recursion

## Real-world Scenario

Cred SDE-2 Backend DSA Round (sourced from AmbitionBox interview reports and
  Medium Cred SDE write-ups, 2023-2025): the candidate was given Minimum Path Sum
  framed as a route-cost problem — "given a grid of toll prices, find the cheapest top-left to
  bottom-right route, moves restricted to east or south". The probe was whether the candidate
  would recognise the 2D grid DP family within the first read, write the recurrence on the board
  before coding, and propose the rolling-row space optimisation when the interviewer asked
  "can you cut the memory?". Successful candidates named the right-or-down restriction as
  the source of the DP structure (no cycles, fixed parents), and stated the O(n) rolling-row
  bound out loud before refactoring.

Sources for this pattern
Public interview reports drawn from AmbitionBox, Glassdoor, LinkedIn Posts, LeetCode
discuss India tag, and r/developersIndia threads, 2023-2026. See Module 09 for full sourcing
methodology. Unique Paths and its obstacle / min-path variants have been a Razorpay, Cred,
and Amazon India SDE-1 / SDE-2 staple across the 2023-2025 cycles; Microsoft India and
Atlassian India routinely use the path-reconstruction follow-up to separate junior from senior
candidates.

