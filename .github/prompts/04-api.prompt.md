# API Prompt — Copilot Battleship

Purpose
-------
Generate a clear, developer-friendly prompt that outputs the Next.js API surface for Copilot Battleship: route definitions, HTTP methods, request/response shapes, and example Zod validators for runtime validation. The generator should prefer authoritative defaults from `/.github/prompts/01-architecture.prompt.md` and emit a `machine-summary` JSON block.

Context
-------
- Framework: Next.js 15 (app router) + TypeScript
- Persistence: in-memory only (no DB)
- Validation: Zod recommended at API boundary
- Audience: frontend/back-end devs who will implement API routes

Prompt variables
----------------
- project_name (string) — default: `copilot-battleship`
- default_board_size (number) — prefer incoming `machine-summary.default_board_size`, fallback: `10`
- include_validation (boolean) — default: `true`
- project_config (optional object) — prefer values from it when present

Generator instructions
----------------------
Produce a concise API doc with these exact headings (use Markdown). Prefer incoming `machine-summary` defaults and include a one-line consistency check when values differ.

Required sections
-----------------
1. Purpose & Context
2. Routes & Methods
3. Request / Response shapes (example JSON)
4. Zod schemas (example validators)
5. Error handling and status codes
6. Security notes (same-origin, CSRF brief)
7. machine-summary

Key routes to document (suggested)
---------------------------------
- `GET /api/games` — list active games
- `POST /api/games` — create new game (body: { playerName })
- `GET /api/games/[id]` — fetch game state
- `POST /api/games/[id]/join` — join existing game (body: { playerName })
- `POST /api/games/[id]/shot` — fire a shot (body: { playerId, x, y })
- `GET /api/ws` or `GET /api/realtime` — optional WS upgrade entry (describe expectations)

Zod validation guidance
-----------------------
- Recommend Zod for runtime validation. For each documented endpoint include a minimal Zod schema example and usage note (e.g., `const ShotSchema = z.object({ playerId: z.string(), x: z.number().int(), y: z.number().int() })`).
- Include short note on where to place validators (e.g., `lib/validators.ts`).

machine-summary JSON schema
---------------------------
Emit a valid JSON block containing at least:
{
  "project_name": string,
  "schema_version": number | string,
  "routes": ["/api/games","/api/games/[id]/shot"],
  "validators": ["ShotSchema","CreateGameSchema"],
  "notes": { "validation": "zod-recommended", "persistence": "in-memory-only" }
}

Output formatting rules
-----------------------
- Use exact headings listed above.
- Include code blocks for JSON and TypeScript (Zod) examples.
- Keep the document focused (200–600 words plus examples).

Acceptance criteria
-------------------
- Defines all key routes with example request/response shapes.
- Provides at least one Zod validator example (ShotSchema) and placement guidance.
- Emits valid `machine-summary` JSON block and echoes `default_board_size` if relevant.

Commit guidance
---------------
Commit message: `chore: add api prompt`

