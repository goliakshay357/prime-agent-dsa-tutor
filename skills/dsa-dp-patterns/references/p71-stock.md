---
name: p71-stock
description: Full reference for P71 (DP — Stock Buy/Sell variants) — blueprint, representative problems, follow-ups
---

# P71 — DP — Stock Buy/Sell variants

## Pattern Overview

Stock Buy/Sell is a six-problem family unified by a state machine over (day, holdings,
transactions_used) . The single-transaction case collapses to running minimum and running
max-profit. The unlimited-transactions case sums every positive day-to-day delta. The k-
transaction case is the canonical 2D DP: state is (day, transactions_used,
currently_holding) and the answer rolls forward by deciding hold or transact each step.
Cooldown and fee variants add one more axis or a constant to the transition cost; the skeleton
stays the same.

The pattern applies anywhere a problem describes buying / selling / holding a single instrument
over a time series with constraints on transactions, cooldown, or fee. The signature trait
separating the family from generic 1D DP (P61-P63) is the two binary states at each day —
holding vs not holding — and the natural roll-forward of two scalars cash and held .

## Pattern Blueprint (code)

For the unlimited / cooldown / fee variants, carry two scalars: cash (max profit if not holding)
and held (max profit if holding). Each day update both simultaneously using the old values —
cash_new = max(cash, held + price) (sell today or stay flat); held_new = max(held, cash
- price) (buy today or stay holding). For cooldown, add a third scalar rest representing
"sold yesterday, must rest today". For fees, subtract fee from cash_new when selling.

# unlimited transactions
  cash, held = 0, -prices[0]
  for p in prices[1:]:
      cash, held = max(cash, held + p), max(held, cash - p)
  return cash

For at-most-k transactions, allocate dp[k + 1][2] where dp[t][0] = max profit using up to t
transactions and currently not holding, dp[t][1] = max profit using up to t transactions and
currently holding. Roll forward day by day. The dp[0][0] = 0 , dp[0][1] = -inf initialisation
captures "zero transactions and holding is impossible".

## Representative Problems

Problem 1: Best Time to Buy and Sell Stock (1 transaction)
Given an array prices where prices[i] is the price on day i, find the maximum profit from at
most one buy-and-sell. If no profit is possible, return 0. Constraints: 1 <= len(prices) <=
10^5 , 0 <= prices[i] <= 10^4 .

Brute force: try every (buy, sell) pair where buy < sell. O(n^2).

Optimal solution:

  from typing import List

  def maxProfit(prices: List[int]) -> int:
      min_price = float('inf')
      best = 0
      for p in prices:
          if p < min_price:
               min_price = p
          elif p - min_price > best:
               best = p - min_price
      return best

Time: O(n). Space: O(1).

Walkthrough:

 • Track running minimum; for each day, best profit if selling today is price - running_min .
   Global best is the max across days.
 • The elif saves work: when we just updated min_price , today's profit is 0, so no need to
   recompute the max.
 • Monotonically decreasing prices return 0. Single-element input returns 0. Empty array
   returns 0.
 • This is not DP — it is the running-minimum collapse of the DP. Naming it as "the 1-
   transaction degenerate case of the family" earns trust.

Problem 2: Best Time to Buy and Sell Stock II (Unlimited Transactions)
Given an array prices , find the maximum profit you can achieve. You may buy and sell as
many times as you like — but you must sell a share before buying again. Constraints: 1 <=
len(prices) <= 3 * 10^4 , 0 <= prices[i] <= 10^4 .

Brute force: enumerate every interleaving of buys and sells — exponential. A greedy form runs
in O(n) by summing positive day-to-day deltas.

Optimal solution (greedy form):

  from typing import List

  def maxProfitUnlimited(prices: List[int]) -> int:
      profit = 0
      for i in range(1, len(prices)):
          if prices[i] > prices[i - 1]:
              profit += prices[i] - prices[i - 1]
      return profit

Alternative DP form (carries to other variants):

  from typing import List

  def maxProfitUnlimitedDP(prices: List[int]) -> int:
      if not prices:
          return 0
      cash, held = 0, -prices[0]
      for p in prices[1:]:
          cash, held = max(cash, held + p), max(held, cash - p)
      return cash

Time: O(n). Space: O(1).

Walkthrough:

 • The greedy form works because any profitable trade (buy_i, sell_j) decomposes into
   the sum of positive day-to-day deltas across [i, j] . Interleaved buys and sells
   consolidate into "capture every up-day".
 • The two-scalar DP form is equivalent and is the bridge to the harder variants. State the
   greedy as the fast answer, then offer the DP form as the generalisable skeleton.
 • Monotonically decreasing prices return 0. Same prices day to day produce zero deltas —
   also 0.

Problem 3: Best Time to Buy and Sell Stock IV (At Most K Transactions)
Given an integer array prices and an integer k , find the maximum profit you can achieve
with at most k transactions. Constraints: 1 <= k <= 100 , 1 <= len(prices) <= 1000 .

Brute force: enumerate every choice of up to k (buy, sell) pairs. Exponential. The DP form is
O(n * k); a small optimisation collapses to greedy when k >= n // 2 (effectively unlimited).

Optimal solution:

  from typing import List

  def maxProfitK(k: int, prices: List[int]) -> int:
      n = len(prices)
      if n < 2 or k == 0:
          return 0
      # if k is large enough, problem degenerates to unlimited transactions
      if k >= n // 2:
          profit = 0
          for i in range(1, n):
              if prices[i] > prices[i - 1]:
                   profit += prices[i] - prices[i - 1]
          return profit
      # dp[t][0] = max profit using up to t transactions, not holding
      # dp[t][1] = max profit using up to t transactions, currently holding
      NEG_INF = float('-inf')
      dp: List[List[float]] = [[0, NEG_INF] for _ in range(k + 1)]
      for p in prices:
          for t in range(k, 0, -1):
              dp[t][0] = max(dp[t][0], dp[t][1] + p)
              dp[t][1] = max(dp[t][1], dp[t - 1][0] - p)
      return int(dp[k][0])

Time: O(n * k). Space: O(k).

Walkthrough:

 • Transaction count t is decremented only on buy — selling does not consume a new
   transaction in this convention. The opposite convention flips the indices; pick one and be
   consistent.
 • The reverse iteration for t in range(k, 0, -1) is load-bearing. It ensures
   dp[t - 1][0] referenced when computing dp[t][1] is the previous day's value, not the
   just-updated current day. Forward iteration over-counts.
 • The k >= n // 2 shortcut handles the unlimited-equivalent regime cleanly.
 • Empty prices, k = 0 , single-day prices all return 0. NEG_INF for dp[t][1] initially
   prevents phantom "holding without buying" states.

## What to Say While Solving

"This is the stock buy / sell family — I will recognise which variant by the number of allowed
  transactions and any cooldown or fee. For at most one transaction, running minimum and
  running max-profit; for unlimited, sum the positive day-to-day deltas or carry two scalars
   cash and held . For at most k transactions, allocate a 2D dp[k + 1][2] table — not
  holding and holding — and roll forward day by day, decrementing transactions only on buy.
  The iteration order over k must be reverse so each cell reads the previous day's value. Time
  is O(n * k), space is O(k)."

## Common Follow-up Questions

• Q: "Add a cooldown: you cannot buy on the day immediately after a sell." — A: Introduce a
 third scalar rest representing "sold yesterday, must rest today". Transitions: cash_new =
 max(cash, rest) , held_new = max(held, cash - p) , rest_new = held + p . Still O(n)
 time, O(1) space.
• Q: "Add a per-transaction fee." — A: Subtract fee from the sell side: cash_new =
 max(cash, held + p - fee) . The greedy-summing form fails because not every positive
 delta is now profitable; the two-scalar DP form handles it cleanly.
• Q: "Reconstruct the actual buy and sell days for at most k transactions." — A: Store parent
 pointers in the DP table — for each (day, t, holding) state record which prior state was
 the argmax. After computing dp[k][0] , walk back. O(n * k) extra space.
• Q: "What is the time complexity if k is unbounded?" — A: It degenerates to the unlimited-
 transaction case — greedy O(n) time and O(1) space. The k >= n // 2 shortcut detects
 this regime.
• Q: "Can you do this with at most 2 transactions in O(n) and O(1) space without a table?" —
 A: Yes — carry four scalars: buy1 , sell1 , buy2 , sell2 . Update them in order: buy1 =
 max(buy1, -p) , sell1 = max(sell1, buy1 + p) , buy2 = max(buy2, sell1 - p) ,
  sell2 = max(sell2, buy2 + p) . Same O(n) time, O(1) space.

## What NOT to Say

• "I will iterate the transaction axis forward." — why it hurts: in the bounded-k DP, forward
 iteration reads an already-updated dp[t - 1][0] and double-counts — the same buy is
 registered against two transactions. Reverse iteration is what makes the rolling 1D form
 correct. Senior interviewers test on prices = [1, 2, 4], k = 2 to catch this — correct
 answer is 3, the buggy forward iteration returns 6.
• "The greedy summing form works for every variant." — why it hurts: it only works for
 unlimited transactions with no fee. Adding a fee invalidates it (small positive deltas may not
 cover the fee); adding cooldown invalidates it (cannot capture every up-day); bounding k
 invalidates it (must choose which k profitable trades to take). Generalising greedy to "all
 stock variants" signals you have memorised the easy case without internalising the family.
• "Stock 1-transaction needs DP." — why it hurts: the single-transaction case is the running-
 minimum collapse — O(n) time, O(1) space, no DP table needed. Pulling out a DP table for it
 suggests you cannot see when a problem degenerates. Name it as "the 1-transaction
 degenerate case of the family" to signal recognition.

## Pattern Recognition Cheat

• Keywords → buy and sell, maximise profit, k transactions, unlimited transactions, with
 cooldown, with fee, stock prices

• Data structure shape → Two scalars ( cash , held ) for unlimited and degenerates; 2D
   dp[k][2] table or rolling 1D for at-most-k
 • Constraint shape → Time series of prices on day i with a binary holding state and an
   action (buy / sell / hold) per day

## Real-world Scenario

Flipkart SDE-1 On-Campus DSA Round (sourced from GeeksforGeeks Flipkart Interview
  Experience archive and LinkedIn on-campus posts, 2023-2025): the candidate was given a
  list of daily ad-bid prices and asked to maximise profit over at most two campaign cycles —
  a thinly disguised "at most 2 transactions" question. The probe was whether the candidate
  would write the 4-scalar form ( buy1, sell1, buy2, sell2 ) directly or unnecessarily reach
  for a 2D DP table. Successful candidates named the family within 30 seconds, stated O(n)
  time O(1) space upfront, and walked through the four-scalar updates before coding.

Sources for this pattern
Public interview reports drawn from AmbitionBox, Glassdoor, LinkedIn Posts, LeetCode
discuss India tag, GeeksforGeeks company archives, and r/developersIndia threads,
2023-2026. See Module 09 for full sourcing methodology. The stock buy / sell family —
particularly the 1-transaction, 2-transaction, and unlimited variants — has been a near-
universal product-co OA and Round 1 question across the 2023-2025 cycles; the at-most-k
variant with cooldown shows up in Razorpay and Cred senior loops.

