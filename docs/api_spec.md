# API Spec — Copilot Battleship

> Authoritative defaults from `01-architecture.prompt.md` machine-summary:
> `default_board_size = 10` (consistent — no mismatch).

All routes are same-origin Next.js 15 app-router API handlers. No external backend or database. State is ephemeral in-memory.

---

## Purpose & Context

The Copilot Battleship API provides a thin REST surface over the in-memory game engine (`lib/gameService.ts`). Clients (React pages and hooks) call these routes using `fetch` on the same origin — no CORS required. All request bodies are validated at the boundary with **Zod** (`lib/validators.ts`) before touching the game store.

---

## Routes & Methods

| Method | Route | Description |
|--------|-------|-------------|
| `GET`  | `/api/games` | List all active in-memory games |
| `POST` | `/api/games` | Create a new game |
| `GET`  | `/api/games/[id]` | Fetch full game state |
| `POST` | `/api/games/[id]` | Join an existing game as player 2 |
| `POST` | `/api/games/[id]/place` | Place a ship on your board |
| `POST` | `/api/games/[id]/shot` | Fire a shot at the opponent's board |
| `GET`  | `/api/ws` | WebSocket upgrade entry (placeholder) |

---

## Request / Response shapes

### `GET /api/games`
No body.

**Response `200`**
```json
{
  "games": [
    {
      "id": "uuid",
      "state": "waiting",
      "players": [{ "id": "uuid", "name": "Alice", "ready": false }],
      "boardSize": 10,
      "createdAt": 1741564800000
    }
  ]
}
```

---

### `POST /api/games`
**Request**
```json
{ "playerName": "Alice", "boardSize": 10 }
```
**Response `201`**
```json
{ "gameId": "uuid", "playerId": "uuid" }
```

---

### `GET /api/games/[id]`
No body.

**Response `200`**
```json
{ "game": { "id": "uuid", "state": "placing", "players": [], "shots": [], "boardSize": 10, "turnPlayerId": null, "winnerId": null, "createdAt": 0, "updatedAt": 0 } }
```
**Response `404`** — game not found.

---

### `POST /api/games/[id]` — Join game
**Request**
```json
{ "playerName": "Bob" }
```
**Response `200`**
```json
{ "gameId": "uuid", "playerId": "uuid" }
```

---

### `POST /api/games/[id]/place` — Place a ship
**Request**
```json
{ "playerId": "uuid", "shipId": "Destroyer", "x": 3, "y": 5, "orientation": "horizontal" }
```
**Response `200`**
```json
{ "game": { "...": "updated Game object" } }
```

---

### `POST /api/games/[id]/shot` — Fire a shot
**Request**
```json
{ "playerId": "uuid", "x": 3, "y": 5 }
```
**Response `200`**
```json
{
  "result": "sunk",
  "x": 3,
  "y": 5,
  "sunkShip": { "id": "uuid", "type": "Destroyer", "size": 2, "orientation": "horizontal", "x": 3, "y": 5, "hits": 2 },
  "nextTurnPlayerId": "uuid",
  "winnerId": null
}
```
`result` is one of `"miss"` | `"hit"` | `"sunk"`. `sunkShip` is `null` unless a ship was sunk this turn.

---

## Zod schemas

All validators live in `lib/validators.ts` and are imported directly into each route handler.

```typescript
import { z } from 'zod'

export const CreateGameSchema = z.object({
  playerName: z.string().min(1).max(32),
  boardSize:  z.number().int().min(5).max(20).optional().default(10),
})

export const JoinGameSchema = z.object({
  playerName: z.string().min(1).max(32),
})

export const ShotSchema = z.object({
  playerId: z.string().uuid(),
  x:        z.number().int().min(0),
  y:        z.number().int().min(0),
})

export const PlaceShipSchema = z.object({
  playerId:    z.string().uuid(),
  shipId:      z.string(),
  x:           z.number().int().min(0),
  y:           z.number().int().min(0),
  orientation: z.enum(['horizontal', 'vertical']),
})
```

**Usage pattern in a route handler:**
```typescript
const parsed = ShotSchema.safeParse(await req.json())
if (!parsed.success) {
  return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
}
const { playerId, x, y } = parsed.data
```

---

## Error handling and status codes

| Status | Meaning |
|--------|---------|
| `200` | OK |
| `201` | Created (new game) |
| `400` | Bad request — Zod validation failed or invalid move |
| `403` | Forbidden — not your turn |
| `404` | Not found — game or player does not exist |
| `409` | Conflict — game is full or ship overlaps |
| `426` | Upgrade required — WebSocket endpoint called via HTTP |
| `500` | Unexpected server error |

All error responses use the shape `{ "error": string | object }`.

---

## Security notes

- **Same-origin only** — all API routes are called from the same Next.js origin; no CORS headers are set or needed.
- **No authentication** — player IDs are opaque UUIDs issued at game creation/join. Store them in `localStorage` client-side and include them in request bodies.
- **CSRF** — same-origin fetch requests from a browser are not subject to cross-site request forgery. If auth (cookies) is added later, include a `SameSite=Strict` or `SameSite=Lax` cookie policy and consider a CSRF token.
- **Input sanitization** — all request bodies are validated with Zod before reaching the game store. No user-supplied strings are rendered as HTML.
- **Ephemeral state** — no data is written to disk; all game state is lost on server restart.

---

## machine-summary

```json
{
  "project_name": "copilot-battleship",
  "schema_version": 1,
  "default_board_size": 10,
  "routes": [
    "GET  /api/games",
    "POST /api/games",
    "GET  /api/games/[id]",
    "POST /api/games/[id]",
    "POST /api/games/[id]/place",
    "POST /api/games/[id]/shot",
    "GET  /api/ws"
  ],
  "validators": ["CreateGameSchema", "JoinGameSchema", "ShotSchema", "PlaceShipSchema"],
  "notes": {
    "validation": "zod-recommended",
    "persistence": "in-memory-only",
    "auth": "none — uuid player IDs only",
    "cors": "same-origin"
  }
}
```
