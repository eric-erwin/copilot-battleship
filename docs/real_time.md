# Real-time — Copilot Battleship

> Authoritative defaults from `01-architecture.prompt.md` machine-summary:
> `default_board_size = 10`, `realtime = "websocket"` (consistent — no mismatch).

---

## Transport recommendation

**Recommended: WebSocket**

| Transport | Latency | Bi-directional | Complexity | Verdict |
|---|---|---|---|---|
| WebSocket | Very low | ✅ Yes | Medium | ✅ **Recommended** |
| SSE (Server-Sent Events) | Low | ❌ Server→client only | Low | Fallback |
| Polling (`setInterval`) | High (2–5s lag) | ❌ Client pull only | Very low | MVP fallback only |

**Rationale:** Battleship is a two-player turn-based game where both players must see the same state immediately. WebSocket gives true bi-directional, low-latency push with a single persistent connection. SSE is acceptable as a read-only fallback (client still POSTs shots via REST). Polling (current MVP fallback, 2s interval in `useGame.ts`) is simple but introduces visible lag — replace with WS as soon as possible.

**Current status:** `hooks/useWebSocket.ts` implements the full WS client with reconnection. `app/api/ws/route.ts` documents the expected contract; a custom Next.js server or managed service (Ably, Pusher, PartyKit) is required to handle the actual upgrade in production.

---

## Message schema

All messages are JSON-serialised objects with a `type` discriminator and a `payload`.

### Server → Client events

#### `game:update`
Sent after any server-side mutation (join, place, shot). Client should replace its cached game state.
```
{
  "type": "game:update",
  "payload": {
    "id": "uuid",
    "state": "playing",
    "players": [],
    "shots": [],
    "turnPlayerId": "uuid",
    "winnerId": null,
    "boardSize": 10,
    "createdAt": 1741564800000,
    "updatedAt": 1741564900000
  }
}
```

#### `shot:result`
Sent immediately after `applyShot` resolves. Lets the opponent's UI update without waiting for a full `game:update`.
```
{
  "type": "shot:result",
  "payload": {
    "x": 3,
    "y": 5,
    "result": "hit",
    "playerId": "uuid-attacker"
  }
}
```
`result` is `"miss"` | `"hit"` | `"sunk"`.

#### `player:joined`
Broadcast when player 2 joins a game.
```
{
  "type": "player:joined",
  "payload": {
    "playerId": "uuid",
    "name": "Bob"
  }
}
```

#### `game:ended`
Broadcast when the win condition is met.
```
{
  "type": "game:ended",
  "payload": {
    "winnerId": "uuid",
    "finalState": { "...": "full Game object" }
  }
}
```

### Client → Server messages

#### `ping`
Keepalive sent periodically to prevent proxy timeouts. Server responds with `{ "type": "pong" }`.
```
{ "type": "ping" }
```

---

## Connection lifecycle & reconnection strategy

```
Client                                Server
  |                                     |
  |── WS upgrade (gameId, playerId) ───►|
  |◄── open ───────────────────────────|
  |◄── game:update (full state) ───────|  ← on connect, server sends current state
  |◄── shot:result / player:joined ────|  ← on any mutation
  |── ping ──────────────────────────►|  ← every 25s
  |◄── pong ───────────────────────────|
  |
  |  (network drop)
  |◄── close ──────────────────────────|
  |
  |  wait BASE=500ms * 2^n + jitter(0–200ms), max 30s
  |── WS upgrade (retry) ─────────────►|
  |◄── open ───────────────────────────|
  |── GET /api/games/[id] ────────────►|  ← re-sync missed state via REST
  |◄── full Game ──────────────────────|
```

**Backoff parameters:**
- Base delay: `500ms`
- Multiplier: `×2` per attempt
- Jitter: `0–200ms` (uniform random, prevents thundering herd)
- Max delay: `30 000ms`
- Manual disconnect: stops reconnecting immediately (`manualClose` flag)

Implemented in `hooks/useWebSocket.ts` — `useWebSocket({ gameId, playerId, onEvent, onStatusChange })`.

---

## Client handling & UI states

`WSStatus` has four states: `"connecting"` | `"connected"` | `"disconnected"` | `"error"`.

| Status | UI behaviour |
|---|---|
| `connecting` | Show `ConnectionBanner` — "⟳ Connecting…" (yellow) |
| `connected` | Banner hidden; game fully interactive |
| `disconnected` | Show banner — "⚠ Disconnected — reconnecting…" (red); disable shot button |
| `error` | Show banner — "✕ Connection error — retrying…" (red); poll REST as fallback |

`components/ConnectionBanner.tsx` renders the correct banner for each status with `role="status"` and `aria-live="polite"` so screen readers announce connection changes.

On reconnect, the client:
1. Re-fetches `GET /api/games/[id]` via `useGame.ts` to recover any missed mutations.
2. Re-establishes the WS connection automatically via `useWebSocket`.
3. Hides the banner once `status === 'connected'`.

---

## Security & scaling notes

- **Same-origin**: WS connects to the same host as the app — no CORS needed.
- **Player ID validation**: server should verify `playerId` query param belongs to the game before upgrading (implemented when using a custom server).
- **Message size**: keep payloads small; send diffs rather than full `Game` objects where possible (future optimisation).
- **Single instance**: `lib/wsBroadcast.ts` is in-memory. For multi-instance deployments (Vercel, Railway with replicas), replace with Redis pub/sub or a managed WS service.
- **Ping/pong**: send a `ping` every 25s to prevent proxy/load-balancer timeout (typically 60s idle limit).
- **Rate limiting**: consider rate-limiting shot POSTs per `playerId` to prevent flooding (add in API middleware when needed).

---

## machine-summary

```
{
  "project_name": "copilot-battleship",
  "schema_version": 1,
  "default_board_size": 10,
  "transport": "websocket",
  "fallback": "polling",
  "messageTypes": ["game:update", "shot:result", "player:joined", "game:ended", "ping"],
  "reconnectStrategy": {
    "type": "exponential",
    "baseMs": 500,
    "maxMs": 30000,
    "jitterMs": 200
  },
  "wsStatus": ["connecting", "connected", "disconnected", "error"],
  "notes": {
    "persistence": "in-memory-only",
    "multiInstance": "requires Redis pub/sub or managed WS service"
  }
}
```

