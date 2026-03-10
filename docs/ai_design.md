# AI Design — Copilot Battleship

> Authoritative defaults from `01-architecture.prompt.md` machine-summary:
> `default_board_size = 10` (consistent — no mismatch).

---

## AI overview

The Copilot Battleship AI uses a **hunt-and-target** strategy — the simplest effective approach for a Battleship CPU opponent. It makes random attacks until it scores a hit, then switches to a targeted search to finish off the ship before returning to random hunting. The tradeoff is simplicity over optimality: a probability-map or parity-aware AI would find ships faster, but this implementation is easy to read, test, and extend. It is well-suited for a single-player mode where the human plays against the CPU.

---

## Strategy description

**Hunt mode** (default)
- Pick a uniformly random cell from all untried cells.
- If `seed` is provided, use the seeded LCG RNG for a deterministic sequence (useful for unit tests).
- Mark the cell as visited regardless of result.

**Target mode** (entered on first hit)
- Record the hit cell as `origin`.
- Probe orthogonal directions in fixed order: `right → left → down → up`.
- Continue in the current direction as long as cells are valid (in-bounds, untried) and yield consecutive hits.
- On a **miss**: advance to the next direction, reset position to `origin`.
- On a **sunk**: the ship is destroyed — clear `origin`, `last`, and `dirIndex` and return to hunt mode.
- Never return an already-visited cell; skip blocked directions automatically.

---

## Pseudocode

```
// State kept across turns:
//   visited   — Set<"x,y"> of all attacked cells
//   origin    — first hit cell, null in hunt mode
//   last      — last cell tried in current direction
//   dirIndex  — index into ['right','left','down','up']

function nextMove():
  if origin != null and dirIndex < 4:
    // Target mode
    dir = DIRECTIONS[dirIndex]
    next = last + delta(dir)
    if next is in-bounds and not visited:
      return next
    else:
      // Direction blocked — try next
      dirIndex++
      last = origin
      return nextMove()          // recurse once

  // Hunt mode — pick random untried cell
  remaining = all cells not in visited
  return remaining[randomIndex()]

function recordResult(x, y, result):
  visited.add(x, y)
  if result == "hit":
    if origin == null:
      origin = last = {x, y}; dirIndex = 0
    else:
      last = {x, y}            // continue direction
  if result == "miss" and origin != null:
    dirIndex++; last = origin  // next direction
  if result == "sunk":
    origin = last = null; dirIndex = 0  // back to hunt
```

---

## TypeScript example (minimal)

The full implementation lives in `lib/ai.ts`. Key API:

```
import { AIPlayer } from '@/lib/ai'

// Create an AI for a 10×10 board (production)
const ai = new AIPlayer({ boardSize: 10 })

// Create a deterministic AI for tests (seed = 42)
const deterministicAI = new AIPlayer({ boardSize: 10, seed: 42 })

// Get next move (stateless call — AI manages its own state)
const { x, y } = ai.nextMove()

// After the shot resolves, record the result
ai.recordResult(x, y, 'hit')   // 'miss' | 'hit' | 'sunk'

// Alternatively pass state externally (e.g. from a game loop)
const move = ai.nextMove({
  visited: new Set(['0,0', '1,0']),
  lastResult: { x: 2, y: 0, result: 'hit' },
})

// Snapshot / restore for per-game in-memory storage
const snapshot = ai.toJSON()
const restored = AIPlayer.fromJSON(snapshot)
```

**Constructor options**
```
new AIPlayer(opts?: { boardSize?: number; seed?: number })
```

| Method | Description |
|---|---|
| `nextMove(state?)` | Returns `{ x, y }` — never repeats a visited cell |
| `recordResult(x, y, result)` | Updates internal state after a shot resolves |
| `toJSON()` | Serializes AI state to a plain object |
| `AIPlayer.fromJSON(snapshot, seed?)` | Restores AI from snapshot |

---

## Integration notes

**Storing AI state per game**

Add an `aiPlayer` field to the in-memory game store entry:

```
// In lib/gameStore.ts or lib/gameService.ts
import { AIPlayer } from '@/lib/ai'

const aiPlayers = new Map<string, AIPlayer>()  // keyed by gameId

// On game creation (single-player mode):
aiPlayers.set(game.id, new AIPlayer({ boardSize: game.boardSize }))

// On AI turn (e.g. inside applyShot after human move):
const ai    = aiPlayers.get(gameId)!
const move  = ai.nextMove()
const result = applyShot(gameId, aiPlayerId, move.x, move.y)
ai.recordResult(move.x, move.y, result.result)
```

**Rules**
- AI state is in-memory only — do not write `aiPlayers` to disk or a database.
- One `AIPlayer` instance per game; discard it when the game ends.
- `nextMove()` is synchronous and fast — safe to call inside a Next.js API route handler.
- For deterministic tests, pass `seed: 42` (or any fixed number) to `new AIPlayer(...)`.

---

## machine-summary

```
{
  "project_name": "copilot-battleship",
  "ai_strategy": "hunt-target",
  "default_board_size": 10,
  "schema_version": 1,
  "params": {
    "hunt_mode": "random",
    "target_order": ["right", "left", "down", "up"],
    "memory": true
  },
  "notes": {
    "deterministic_example": "randomness_seed optional — pass seed to AIPlayer constructor",
    "persistence": "in-memory-only"
  }
}
```

