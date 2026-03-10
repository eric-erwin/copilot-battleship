# AI Design Prompt — Copilot Battleship (Hunt & Target AI)

Purpose
-------
This prompt generates a friendly, UI/UX-minded design for a simple AI player and a minimal, ready-to-use TypeScript implementation for Copilot Battleship. The AI follows a hunt-and-target strategy: random attacks until it hits, then probe orthogonal directions until the ship is sunk. The output must include a `machine-summary` JSON block that echoes the authoritative defaults when available.

Context
-------
- Project: Copilot Battleship
- Framework: Next.js 15 + React 19 (TypeScript)
- Persistence: In-memory only (no database)
- Styling: Tailwind CSS (informational)
- Audience: frontend/back-end engineers, QA
- Behavior: Hunt (random) -> Target (directional search until sunk)

Authoritative defaults
----------------------
This prompt should prefer `default_board_size` and other high-level defaults from the authoritative `machine-summary` emitted by `/.github/prompts/01-architecture.prompt.md`. If no `machine-summary` or `project_config` is provided, the prompt should fall back to `default_board_size = 10`.

Prompt variables (ask for these or use defaults)
------------------------------------------------
- project_name (string) — default: `copilot-battleship`
- default_board_size (number) — default: `10` (fallback only — prefer incoming `machine-summary`/`project_config`)
- schema_version (number|string) — default: `1`
- randomness_seed (optional number) — include for deterministic example runs/tests
- project_config (optional object) — if provided, prefer values from it or an incoming `machine-summary`

Generator instructions
----------------------
Produce a concise, actionable AI design document and a minimal TypeScript implementation suitable for copy/paste into `lib/ai.ts`. Use the exact headings below. If an incoming `project_config` or `machine-summary` provides `default_board_size`, prefer it and include a one-line consistency check when your local default differs. Keep output concise (200–600 words plus code blocks).

Required sections (use these exact headings)
-------------------------------------------
1. AI overview
2. Strategy description
3. Pseudocode
4. TypeScript example (minimal)
5. Integration notes
6. machine-summary

Details for each section
------------------------
- AI overview: One short paragraph describing the hunt-and-target AI, tradeoffs (simplicity, predictable behavior), and recommended use (single-player vs. CPU opponent).

- Strategy description: Explain modes:
  - Hunt: pick a random, untried cell (uniform random across remaining cells). Use `randomness_seed` for deterministic examples when provided.
  - Target: after a hit, push the hit cell onto a stack and probe orthogonal directions in a fixed order (recommended order: `right`, `left`, `down`, `up`). When a direction yields consecutive hits, continue in that direction until miss or sink; on miss, switch to the opposite direction or the next orthogonal.
  - Always avoid re-attacking visited cells and keep track of tried positions.

- Pseudocode: Provide clear stepwise pseudocode that shows state kept across turns (visited set, hit stack, current direction candidate).

- TypeScript example (minimal): Provide a small, self-contained TypeScript module that exports an `AIPlayer` class with:
  - constructor(opts?: { boardSize?: number; seed?: number })
  - nextMove(state: { visited: Set<string>, lastResult?: { x:number,y:number,result: 'miss'|'hit'|'sunk' } }): { x:number, y:number }
  - internal helpers and minimal comments
The code must be dependency-free, avoid returning already-tried cells, respect `boardSize`, and support an optional deterministic RNG when `seed` is provided (for tests). Keep the implementation easy to read and copy into `lib/ai.ts`.

- Integration notes: Explain how to instantiate and persist the AI state per-game (in-memory storage, e.g., `game.aiState = new AIPlayer()` or store plain objects), how to call `nextMove` from a server-side game loop or API route, and that AI state must not be written to disk.

- machine-summary: Emit a single valid JSON object block (no comments) that includes the fields specified in the schema below and echoes the `default_board_size` used.

machine-summary JSON schema
---------------------------
Produce a JSON object with the following keys (example values shown):

{
  "project_name": "copilot-battleship",
  "ai_strategy": "hunt-target",
  "default_board_size": 10,
  "schema_version": 1,
  "params": {
    "hunt_mode": "random",
    "target_order": ["right","left","down","up"],
    "memory": true
  },
  "notes": {
    "deterministic_example": "randomness_seed optional",
    "persistence": "in-memory-only"
  }
}

Output formatting rules
-----------------------
- Use Markdown headings for the required sections (exact names above).
- For `Pseudocode` and `TypeScript example` include fenced TypeScript code blocks.
- For `machine-summary` include exactly one JSON code block that is valid JSON (no comments).
- Keep overall output concise and developer-friendly.

Consistency guidance
--------------------
- Prefer `project_config` or incoming `machine-summary.default_board_size`. If your local default differs, include a one-line consistency check showing both values and state which value was used.

Acceptance criteria
-------------------
- Output includes all required sections.
- Strategy matches: random hunt until hit, then directional search until sink.
- Pseudocode present and clear.
- Minimal TypeScript `AIPlayer` example included and avoids re-attacks.
- `machine-summary` JSON valid and echoes `default_board_size`.
- Supports optional `randomness_seed` for deterministic examples/tests.

Example invocation
------------------
"Generate an AI design for `copilot-battleship` with `default_board_size=10`, `schema_version=1`, and `randomness_seed=42`. Prefer incoming `machine-summary` defaults when available."

Commit guidance
---------------
When adding this prompt file to the repo, use the commit message: `chore: add ai-design prompt`

Notes and constraints
---------------------
- Do not include network calls or persistence to disk; AI state must be in-memory.
- Keep the AI simple and easy to integrate into `lib/ai.ts`.
- Provide a deterministic RNG option only for example/testability; production can omit seeding.

End of prompt file.

