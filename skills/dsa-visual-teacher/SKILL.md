---
name: dsa-visual-teacher
description: 'Build interactive HTML walkthroughs for ANY algorithm — recursion trees, arrays, graphs, DP tables. Pick the template that matches your data structure.'
---

# DSA Visual Teacher

Build ONE self-contained HTML page per algorithm stage. No frameworks. Three.js for 3D where needed, vanilla canvas/DOM for everything else. Works offline by double-click.

## Template Catalog — Pick by Data Structure

| Your algorithm operates on... | Use this template |
|------------------------------|-------------------|
| Recursive calls (DP, backtracking, divide & conquer) | `skeleton-3d-template.html` or `brute-force-recursion-tree-3d.html` |
| Array with pointers (binary search, two pointers, sliding window, partition) | `array-pointers.html` |
| Graph (BFS, DFS, Dijkstra, topological sort) | `graph-traversal.html` |
| 2D Table/Grid (DP tabulation, matrix traversal) | `memoization-tree-grid-3d.html` (adapt: replace tree with grid) |
| Sorting (bubble, merge, quick, heap) | Adapt `array-pointers.html` — add swap animation |

All templates are in `skills/dsa-visual-teacher/templates/`.

## Template Quick Reference

### `array-pointers.html`
Shows array as tile row. Pointers (L, R, mid) as colored labels above tiles. Eliminated tiles fade out. Window tiles get green border. Code panel + live variables.

**Adapt for:**
- **Binary search**: steps show mid pick, comparison, half elimination
- **Two pointers**: L and R converge, show sum/comparison
- **Sliding window**: L and R move same direction, window sum updates
- **Partition/quicksort**: pivot + partition boundaries

**Key step fields:** `{ line, left, right, mid, window: [s,e], eliminated: [s,e], action, vars, desc }`

### `graph-traversal.html`
Canvas-rendered graph with nodes as circles, edges as lines. Queue/stack panel shows waiting nodes. Code panel + live variables.

**Adapt for:**
- **BFS**: queue panel, rings of visited nodes
- **DFS**: stack panel, current path highlighted
- **Dijkstra**: add distance labels on nodes, priority queue
- **Topological sort**: add in-degree counters

**Key step fields:** `{ line, node, action, queueContents, visitedSet, vars, desc }`

### `skeleton-3d-template.html`
Three.js 3D scene with node cards connected by edges. Orbit controls. Code panel + info panel.

**Adapt for:**
- **Recursive DP**: show call tree, highlight recomputed nodes (red), memo hits (green)
- **Backtracking**: show state tree, prune dead branches
- **Divide & conquer**: show merge tree, subproblem results

**Key step fields:** `{ line, nid, action, val, desc }` — same as existing template

### `memoization-tree-grid-3d.html`
Full reference: LCS memoization with 3D tree + 2D memo board + code panel. Study this for the memo-grid pattern.

## Non-negotiables (all templates)

1. **Every step waits for a click.** Next/Back/Auto/Reset buttons always present.
2. **Fixed color coding:**
   - YELLOW (#ffd54f) = current/active
   - BLUE (#7c9af2) = dependency / queued / boundary
   - GREEN (#69f0ae) = answer / match / visited / optimal
   - RED (#ff5252) = wasted / recomputed / memo hit
   - GRAY (#555) = base case / eliminated / inactive
3. **Dark theme** (`--bg: #080c12`). Consistent.
4. **Keyboard:**  = next,  = prev, Space = auto, R = reset.
5. **Multiple examples** in dropdown.
6. **Code panel** shows full algorithm from step 1. Current line highlighted.
7. **Live variables** panel updates every step.
8. **Human-readable description** per step — no raw variable dumps.

## Deliverables

- One `.html` per approach stage: `<problem>-brute-force-3d.html`, `<problem>-memo-3d.html`, `<problem>-tabulation-3d.html`
- For non-DP: `<problem>-<algorithm>.html` (e.g., `binary-search.html`, `bfs-grid.html`)
- Save to current working directory
- Test: opens without console errors, all examples work
