# Game Engine — Copilot Battleship

> Authoritative defaults from `01-architecture.prompt.md` machine-summary:
> `default_board_size = 10` (consistent — no mismatch).

---

## Overview & responsibilities

The game engine lives entirely in `lib/gameService.ts` and `lib/gameStore.ts`. It is responsible for:

- Creating and mutating `Game` objects stored in the in-memory `Map<string, Game>`
- Enforcing ship placement rules (bounds, alignment, no-overlap)
- Resolving shots (hit / miss / sunk) and updating cell statuses
- Managing turn order and detecting the win condition
- Transitioning `GameState` through its lifecycle (`waiting → placing → playing → ended`)

The engine is **purely synchronous** — every function reads from and writes to the in-memory store immediately. There is no async I/O, no database, and no disk writes.

---

## Ship placement rules

1. **Axis-aligned only** — ships must be placed either `horizontal` or `vertical`. Diagonal placement is rejected.
2. **Within bounds** — the full length of the ship must fit inside the `boardSize × boardSize` grid.
   - Horizontal: `x + size <= boardSize`
   - Vertical: `y + size <= boardSize`
3. **No overlap** — every cell the ship would occupy must have `status === 'empty'`. Placing on a `ship`, `hit`, `miss`, or `sunk` cell throws an error.
4. **One ship per type** — each ship type (`Carrier`, `Battleship`, `Cruiser`, `Submarine`, `Destroyer`) may only be placed once per player.
5. **Auto-ready** — once all 5 ship types are placed, `player.ready` is set to `true` automatically.
6. **Game starts** — when both players are `ready`, `game.state` transitions to `playing` and `game.turnPlayerId` is set to `players[0].id`.

**Standard ship definitions:**

| Type | Size |
|---|---|
| Carrier | 5 |
| Battleship | 4 |
| Cruiser | 3 |
| Submarine | 3 |
| Destroyer | 2 |

---

## Hit & sink detection

When `applyShot` is called:

1. The target cell on the **opponent's** board is looked up at `board.cells[y][x]`.
2. If the cell status is `'empty'` → mark as `'miss'`, result = `'miss'`.
3. If the cell status is `'ship'` → mark as `'hit'`, result = `'hit'`.
   - Find the `Ship` that occupies this cell (`isShipAtCell`).
   - Increment `ship.hits`.
   - If `ship.hits >= ship.size` → the ship is sunk:
     - Mark all cells belonging to this ship as `'sunk'`.
     - result = `'sunk'`.
4. If **all** opponent ships are sunk → `game.state = 'ended'`, `game.winnerId = playerId`.

```typescript
export function checkSunk(ship: Ship): boolean {
  return ship.hits >= ship.size
}
```

---

## Turn resolution & invalid moves

- Only the player whose `id === game.turnPlayerId` may fire.
- After a valid shot (hit, miss, or sunk), the turn passes to the opponent: `game.turnPlayerId = opponent.id`.
- If the shot ends the game (`allSunk`), `turnPlayerId` is set to `null`.

**Invalid move errors thrown:**

| Condition | Error message |
|---|---|
| Game not in `playing` state | `'Game not in playing state'` |
| Wrong player's turn | `'Not your turn'` |
| Cell already targeted | `'Cell already targeted'` |
| Cell out of bounds | `'Cell out of bounds'` |

---

## Game states & lifecycle

```
waiting  →  placing  →  playing  →  ended
```

| State | When entered | turnPlayerId |
|---|---|---|
| `waiting` | Game created (1 player) | `null` |
| `placing` | Second player joins | `null` |
| `playing` | Both players ready (all ships placed) | `players[0].id` |
| `ended` | All opponent ships sunk | `null` |

---

## Public function signatures

All functions are exported from `lib/gameService.ts`:

```
// Create a new game (player 1)
createGame(playerName: string, boardSize?: number): Game

// Join an existing game (player 2)
joinGame(gameId: string, playerName: string): { game: Game; player: Player }

// Place a ship on the player's board
placeShip(
  gameId: string,
  playerId: string,
  shipType: string,        // e.g. 'Destroyer'
  x: number,
  y: number,
  orientation: Orientation // 'horizontal' | 'vertical'
): Game

// Fire a shot at the opponent's board
applyShot(
  gameId: string,
  playerId: string,
  x: number,
  y: number
): { game: Game; result: ShotResult; sunkShip?: Ship }

// Check if a ship is fully sunk (all cells hit)
checkSunk(ship: Ship): boolean

// Check if a ship occupies a given cell (used internally and in tests)
isShipAtCell(ship: Ship, x: number, y: number): boolean
```

---

## Test vectors

### Vector 1 — Valid ship placement

**Input:** Place a `Destroyer` (size 2) at `x=0, y=0, orientation='horizontal'` on a 10×10 board.

**Expected:**
```json
{
  "cells[0][0].status": "ship",
  "cells[0][1].status": "ship",
  "ships": [{ "type": "Destroyer", "size": 2, "x": 0, "y": 0, "orientation": "horizontal", "hits": 0 }]
}
```

---

### Vector 2 — Shot results in miss

**Input:** Fire at `x=5, y=5` where the cell is `empty`.

**Expected:**
```json
{
  "result": "miss",
  "cells[5][5].status": "miss",
  "turnPlayerId": "opponent-uuid"
}
```

---

### Vector 3 — Shot results in hit

**Input:** Fire at `x=0, y=0` where the cell is `ship` (Destroyer placed at `x=0, y=0`).

**Expected:**
```json
{
  "result": "hit",
  "cells[0][0].status": "hit",
  "ship.hits": 1,
  "turnPlayerId": "opponent-uuid"
}
```

---

### Vector 4 — Sequence that sinks a ship

**Input:** Destroyer at `x=0,y=0` horizontal (size 2). Fire `x=0,y=0` → `x=1,y=0`.

**Step 1 — Fire (0,0):**
```json
{ "result": "hit", "ship.hits": 1 }
```

**Step 2 — Fire (1,0):**
```json
{
  "result": "sunk",
  "sunkShip": { "type": "Destroyer", "size": 2, "hits": 2 },
  "cells[0][0].status": "sunk",
  "cells[0][1].status": "sunk"
}
```

---

### Vector 5 — Invalid placement (out of bounds)

**Input:** Place a `Carrier` (size 5) at `x=8, y=0, orientation='horizontal'` on a 10×10 board (`8 + 5 = 13 > 10`).

**Expected:** throws `Error('Ship out of bounds')`

---

### Vector 6 — Invalid move (wrong turn)

**Input:** `applyShot` called with `playerId` of the player who just fired.

**Expected:** throws `Error('Not your turn')`

---

## machine-summary

```json
{
  "project_name": "copilot-battleship",
  "schema_version": 1,
  "default_board_size": 10,
  "rules": ["placement", "hit-sink", "turns"],
  "ship_definitions": [
    { "name": "Carrier",    "size": 5 },
    { "name": "Battleship", "size": 4 },
    { "name": "Cruiser",    "size": 3 },
    { "name": "Submarine",  "size": 3 },
    { "name": "Destroyer",  "size": 2 }
  ],
  "testFixtures": [
    { "name": "valid-placement",   "input": { "shipType": "Destroyer", "x": 0, "y": 0, "orientation": "horizontal" }, "expected": { "cells[0][0]": "ship", "cells[0][1]": "ship" } },
    { "name": "shot-miss",         "input": { "x": 5, "y": 5 }, "expected": { "result": "miss" } },
    { "name": "shot-hit",          "input": { "x": 0, "y": 0 }, "expected": { "result": "hit" } },
    { "name": "sink-sequence",     "input": [{ "x": 0, "y": 0 }, { "x": 1, "y": 0 }], "expected": { "result": "sunk" } },
    { "name": "out-of-bounds",     "input": { "shipType": "Carrier", "x": 8, "y": 0, "orientation": "horizontal" }, "expected": { "throws": "Ship out of bounds" } },
    { "name": "wrong-turn",        "input": { "playerId": "wrong-player" }, "expected": { "throws": "Not your turn" } }
  ],
  "notes": {
    "persistence": "in-memory-only"
  }
}
```

