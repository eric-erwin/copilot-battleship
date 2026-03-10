# Real-time Prompt — Copilot Battleship

Purpose
-------
Create a prompt that defines the real-time strategy for live games: recommend transport (WebSocket), message schema/events, reconnection and backoff strategies, and UI behaviors on disconnect/reconnect.

Context
-------
- In-memory server state
- Low-latency two-player games preferred
- Audience: frontend and backend engineers implementing real-time updates

Prompt variables
----------------
- project_name — default `copilot-battleship`
- preferred_transport — default `websocket` (fallback `sse`)
- default_board_size — prefer `machine-summary`, fallback `10`
- project_config (optional)

Generator instructions
----------------------
Produce a concise real-time design doc with exact headings and a machine-summary. Prefer incoming `machine-summary` defaults; include a one-line consistency check when differing.

Required sections
-----------------
1. Transport recommendation (WS vs SSE vs Polling)
2. Message schema (events and payloads)
3. Connection lifecycle & reconnection strategy (backoff)
4. Client handling & UI states (stale/disconnected)
5. Security & scaling notes
6. machine-summary

Message schema (example events)
-------------------------------
- `game:update` — contains full game state or diffs
- `shot:result` — { x, y, result: 'miss'|'hit'|'sunk', playerId }
- `player:joined` — { playerId, name }
- `game:ended` — { winnerId, finalState }

Reconnection strategy
---------------------
- Exponential backoff with jitter (e.g., base 500ms, max 30s)
- On reconnect, re-sync full game state via API or request a `game:update` from server

machine-summary JSON schema
---------------------------
{
  "project_name": string,
  "schema_version": number | string,
  "transport": "websocket" | "sse" | "polling",
  "messageTypes": ["game:update","shot:result"],
  "reconnectStrategy": { "type": "exponential", "baseMs": 500, "maxMs": 30000 }
}

Output formatting rules
-----------------------
- Use exact headings; include example JSON messages.
- Keep concise (200–600 words).

Acceptance criteria
-------------------
- Recommends transport (WS preferred) with rationale.
- Provides canonical message examples and reconnection policy.
- Emits valid `machine-summary` JSON.

Commit guidance
---------------
Commit message: `chore: add real-time prompt`

