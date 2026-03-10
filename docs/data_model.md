# Data Model — Copilot Battleship

All types live in `lib/types.ts` and are shared between client and server. State is in-memory only — no database. Games are ephemeral and lost on server restart.

---

## Data model overview

Copilot Battleship uses six domain types that map directly to the game's rules. A **Game** owns two **Players**, each of whom has a **Board** filled with **Ships** and a 2-D grid of **Cells**. Every time a player fires, a **Shot** is recorded on the game and the target cell's status is updated. **GameState** drives the UI — the app moves from `waiting` → `placing` → `playing` → `ended` as players join, place ships, and take turns. All of these types are TypeScript interfaces in `lib/types.ts` and are used identically on the Next.js server (API routes) and the React client (hooks, components).

---

## TypeScript interfaces

```typescript
// ── Primitives ────────────────────────────────────────────────────────────────
export type CellStatus  = 'empty' | 'ship' | 'hit' | 'miss' | 'sunk'
export type GameState   = 'waiting' | 'placing' | 'playing' | 'ended'
export type Orientation = 'horizontal' | 'vertical'
export type ShotResult  = 'miss' | 'hit' | 'sunk'

// ── Domain models ─────────────────────────────────────────────────────────────
export interface Cell {
  x: number
  y: number
  status: CellStatus
}

export interface Ship {
  id: string
  type: string          // 'Carrier' | 'Battleship' | 'Cruiser' | 'Submarine' | 'Destroyer'
  size: number
  orientation: Orientation
  x: number             // top-left origin column
  y: number             // top-left origin row
  hits: number
}

export interface Board {
  size: number          // default 10
  cells: Cell[][]       // indexed [y][x]
  ships: Ship[]
}

export interface Player {
  id: string
  name: string
  ready: boolean        // true when all ships placed
  board: Board
}

export interface Shot {
  playerId: string
  x: number
  y: number
  result: ShotResult
  timestamp: number     // Date.now()
}

export interface Game {
  id: string
  state: GameState
  players: Player[]
  shots: Shot[]
  turnPlayerId: string | null
  winnerId: string | null
  boardSize: number
  createdAt: number
  updatedAt: number
}

// ── API request / response shapes ─────────────────────────────────────────────
export interface CreateGameRequest  { playerName: string; boardSize?: number }
export interface CreateGameResponse { gameId: string; playerId: string }

export interface JoinGameRequest    { playerName: string }
export interface JoinGameResponse   { playerId: string }

export interface ShotRequest        { playerId: string; x: number; y: number }
export interface ShotResponse {
  result: ShotResult
  x: number
  y: number
  sunkShip: Ship | null
  nextTurnPlayerId: string | null
  winnerId: string | null
}
```

---

## In-memory runtime shapes

The in-memory store (`lib/gameStore.ts`) holds a plain `Map<string, Game>`. There are no derived or computed fields persisted — everything is recalculated on read or mutation. A few runtime-only helpers exist in `lib/gameService.ts`:

- `SHIP_DEFINITIONS` — static array of `{ type, size }` used to validate placement completeness.
- `makeBoard(size)` — factory that builds an empty `Cell[][]` grid; not part of the `Board` interface itself.
- `isShipAtCell(ship, x, y)` — pure helper used during shot resolution; never stored on the `Game`.

No extra fields are attached to `Game` at runtime. If you need derived values (e.g. `shipsRemaining`), compute them from `board.ships` client-side.

---

## Example JSON instances

**Cell**
```json
{ "x": 3, "y": 5, "status": "hit" }
```

**Ship**
```json
{ "id": "a1b2c3", "type": "Destroyer", "size": 2, "orientation": "horizontal", "x": 4, "y": 7, "hits": 1 }
```

**Board** (abbreviated)
```json
{
  "size": 10,
  "cells": [ [{ "x": 0, "y": 0, "status": "empty" }, "..."] ],
  "ships": [{ "id": "a1b2c3", "type": "Destroyer", "size": 2, "orientation": "horizontal", "x": 4, "y": 7, "hits": 1 }]
}
```

**Player**
```json
{ "id": "uuid-player-1", "name": "Alice", "ready": true, "board": { "...": "see Board above" } }
```

**Shot**
```json
{ "playerId": "uuid-player-1", "x": 4, "y": 7, "result": "hit", "timestamp": 1741564800000 }
```

**Game**
```json
{
  "id": "uuid-game-1",
  "state": "playing",
  "players": ["...Player[]"],
  "shots": ["...Shot[]"],
  "turnPlayerId": "uuid-player-2",
  "winnerId": null,
  "boardSize": 10,
  "createdAt": 1741564800000,
  "updatedAt": 1741564900000
}
```

---

## Serialization example (POST /api/games/[id]/shot)

**Request** — client POSTs to `/api/games/{gameId}/shot`:
```json
{
  "playerId": "uuid-player-1",
  "x": 3,
  "y": 5
}
```

**Response `200`** — server returns the shot outcome:
```json
{
  "result": "sunk",
  "x": 3,
  "y": 5,
  "sunkShip": {
    "id": "a1b2c3",
    "type": "Destroyer",
    "size": 2,
    "orientation": "horizontal",
    "x": 3,
    "y": 5,
    "hits": 2
  },
  "nextTurnPlayerId": "uuid-player-2",
  "winnerId": null
}
```

`result` is always one of `"miss"`, `"hit"`, or `"sunk"`. `sunkShip` is `null` unless this shot sank a ship. `winnerId` is set when all opponent ships are sunk.

---

## Copy-to-lib instructions

`lib/types.ts` is the **single source-of-truth** for all domain types. Both API routes (server) and React hooks/components (client) import from it directly via the `@/lib/types` path alias.

To update or extend the data model:
1. Edit `lib/types.ts` directly — do not duplicate types elsewhere.
2. If you generate new interfaces from this prompt, paste them into `lib/types.ts` and remove any duplicates.
3. The path alias `@/*` resolves to the project root (configured in `tsconfig.json`), so imports work identically on client and server.
4. Optional future step: use a codegen tool (e.g. `ts-to-zod`) to auto-generate Zod schemas from the TypeScript interfaces in `lib/types.ts`.

---

## Runtime validation (Why & examples)

**Why does this matter?**
TypeScript types are erased at runtime — the compiled JavaScript has no type information. Without runtime validation, a malformed request body (e.g. a missing `playerId`, a string `x` instead of a number, or an out-of-range coordinate) will silently corrupt the in-memory game state with no recovery path. Zod catches these at the API boundary before they touch the store.

**Zod schemas** live in `lib/validators.ts`:

```typescript
import { z } from 'zod'

// Validate POST /api/games body
export const CreateGameSchema = z.object({
  playerName: z.string().min(1).max(32),
  boardSize:  z.number().int().min(5).max(20).optional().default(10),
})

// Validate POST /api/games/[id]/shot body
export const ShotSchema = z.object({
  playerId: z.string().uuid(),
  x: z.number().int().min(0).max(19),
  y: z.number().int().min(0).max(19),
})

// Validate POST /api/games/[id] (join) body
export const JoinGameSchema = z.object({
  playerName: z.string().min(1).max(32),
})
```

Usage in an API route:
```typescript
const parsed = ShotSchema.safeParse(await req.json())
if (!parsed.success) {
  return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
}
const { playerId, x, y } = parsed.data
```

---

## machine-summary

```json
{
  "project_name": "copilot-battleship",
  "default_board_size": 10,
  "schema_version": 1,
  "models": [
    { "name": "Game",   "fields": { "id": "string", "state": "GameState", "players": "Player[]", "shots": "Shot[]", "turnPlayerId": "string|null", "winnerId": "string|null", "boardSize": "number", "createdAt": "number", "updatedAt": "number" } },
    { "name": "Player", "fields": { "id": "string", "name": "string", "ready": "boolean", "board": "Board" } },
    { "name": "Board",  "fields": { "size": "number", "cells": "Cell[][]", "ships": "Ship[]" } },
    { "name": "Ship",   "fields": { "id": "string", "type": "string", "size": "number", "orientation": "Orientation", "x": "number", "y": "number", "hits": "number" } },
    { "name": "Cell",   "fields": { "x": "number", "y": "number", "status": "CellStatus" } },
    { "name": "Shot",   "fields": { "playerId": "string", "x": "number", "y": "number", "result": "ShotResult", "timestamp": "number" } }
  ],
  "enums": {
    "CellStatus":  ["empty", "ship", "hit", "miss", "sunk"],
    "GameState":   ["waiting", "placing", "playing", "ended"],
    "ShotResult":  ["miss", "hit", "sunk"],
    "Orientation": ["horizontal", "vertical"]
  },
  "routesUsingModels": ["/api/games", "/api/games/[id]", "/api/games/[id]/shot"],
  "notes": {
    "persistence": "in-memory-only",
    "validation": "zod-recommended"
  }
}
```
