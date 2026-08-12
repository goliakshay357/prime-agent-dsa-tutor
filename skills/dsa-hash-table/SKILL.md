---
name: dsa-hash-table
description: Hash tables — O(1) lookup by trading space for time; the most fundamental optimization pattern
---

# Hash Table / Dictionary / Set

## The Psychology
This is the purest example of "trade space for time." Brute force: for each element, scan the entire array looking for its complement. O(n^2). The insight: "What if I could just ASK 'does 7 exist?' in one step instead of scanning?" A hash table lets you do exactly that.

The cost: extra memory. But for most problems, O(n) extra space is worth dropping from O(n^2) to O(n) time. This trade-off is the heart of DSA optimization.

## Physical Metaphor
A wall of labeled mailboxes. Each person in the building has one box. To get Bob's mail, you walk straight to BOB's box — you don't open every box looking for Bob's name. That's O(1): constant time, no matter how many boxes there are.

## Recognition Signals
1. Need to **count frequencies**
2. Need **O(1) lookup/insert/delete**
3. **"Does X exist?"** or **"Have I seen X before?"**
4. **Finding complements** (two-sum: target - current = complement)
5. **Removing duplicates** or checking **uniqueness**

## The Complement Pattern (Two-Sum)
The classic: "For each element x, check if (target - x) has been seen before."
Without hash table: scan array for each element = O(n^2).
With hash table: one lookup per element = O(n).

## Brute Force -> Optimized

### Step 1: Brute Force
```python
# O(n^2) — for each element, scan everything after it
for i in range(n):
    for j in range(i+1, n):
        if arr[i] + arr[j] == target:
            return [i, j]
```

### Step 2: The Insight
"Instead of scanning the array to find the complement of arr[i], what if I could just ASK a magic box: 'Have you seen (target - arr[i]) before?' and get an instant yes/no?"

### Step 3: Optimized
```python
seen = {}  # value -> index
for i, x in enumerate(arr):
    complement = target - x
    if complement in seen:        # O(1) lookup!
        return [seen[complement], i]
    seen[x] = i                   # store for future lookups
```

## Visualization Data
Show array being scanned left to right. "Wall of lockers" (hash table) growing as elements are added. Arrow from current element to complement lookup. Hit = locker glows green. Miss = new locker slides in. Counter: "lookups: X, hits: Y". For the HTML, adapt the visual style from `array-pointers.html` — replace pointers with a growing hash table panel.

## Example Problems
1. **Two Sum** — complement lookup
2. **Contains Duplicate** — set for existence
3. **First Unique Character** — frequency + order scan
4. **Group Anagrams** — sorted string as hash key
5. **Subarray Sum Equals K** — prefix sum + frequency map

## Common Mistakes
- Using a list for O(n) lookups when a set would be O(1)
- Forgetting that dict keys must be hashable (lists can't be keys; tuples can)
- Not using .get(key, default) when key might be missing
