# State Management Prompt — Copilot Battleship

Purpose
-------
Generate a concise, actionable prompt that describes client-side state management patterns for Copilot Battleship. The generated output should explain fetching and caching, mutation flows (especially firing a shot), optimistic updates and rollback, local vs server state responsibilities, and integration notes. The generator MUST prefer authoritative defaults from `/.github/prompts/01-architecture.prompt.md` when present and emit a `machine-summary` JSON block at the end.

Context
-------
- Frontend: Next.js 15 (app router) + React 19 + TypeScript
- Data: same-origin Next.js API routes, in-memory server state
- Recommended libs: SWR or React Query for caching; Zod for API validation
- Audience: frontend engineers implementing data flow and integration

Prompt variables (ask for these or use defaults)
-----------------------------------------------
- project_name (string) — default: `copilot-battleship`
- default_board_size (number) — prefer incoming `machine-summary.default_board_size`, fallback: `10`
- prefer_library (string) — default: `swr` (allowed: `swr`, `react-query`)
- schema_version (number|string) — default: `1`
- project_config (optional object) — if provided, prefer values from this or incoming `machine-summary`

Generator instructions
----------------------
Produce a friendly, developer-oriented guide with the exact headings below. When a `project_config` or `machine-summary` is provided, prefer its values and include a one-line consistency check when your local defaults differ. Keep the output concise and focus on copy-paste-able patterns.

Required sections (use these exact headings)
-------------------------------------------
1. Data flow overview
2. Fetching & caching (endpoints and cache keys)
3. Mutations & optimistic updates (shot flow)
4. Error handling & rollback
5. Local UI state vs server state
6. Example code snippets (SWR or React Query)
7. machine-summary

Section details
---------------
- Data flow overview: One-paragraph description of responsibilities: server is authoritative for game state; client caches game state for responsiveness and subscribes to realtime updates when available.

- Fetching & caching: Recommend caching `GET /api/games/[id]` under key `['game', gameId]` (or `game:{id}`). Suggest `staleTime` (e.g., 5s) and `refetchOnReconnect` behavior. Mention which endpoints should NOT be cached (POST endpoints).

- Mutations & optimistic updates (shot flow): Provide a step-by-step mutation flow for firing a shot:
  1. Locally mark the target cell as `pending` in client state.
  2. Optimistically update UI to show a spinner/indicator on the cell.
  3. POST to `/api/games/[id]/shot` with Zod-validated body.
  4. On success: replace optimistic cell with server response (hit/miss/sunk) and update turn info.
  5. On failure: rollback optimistic change and surface an error message.
Include guidance for idempotency and deduplication (use unique mutation keys / request IDs).

- Error handling & rollback: Show examples of how to rollback optimistic updates and where to show user-facing errors (toast or banner). Recommend retry strategies for transient network errors and backoff for repeated failures.

- Local UI state vs server state: Explain which state stays local (UI selection, placement preview, modals) vs server-owned (board cells, ships, turn order). Recommend persisting only minimal UI state across navigation (e.g., in-memory or session storage) and never write AI/game state to disk.

- Example code snippets: Provide short examples for both SWR and React Query mutation flows (pseudocode/TypeScript) showing optimistic update, API call, and rollback. Reference usage of Zod for request validation on the server.

machine-summary JSON schema
---------------------------
Emit a single valid JSON object with these keys:

{
  "project_name": string,
  "schema_version": number | string,
  "cacheKeys": ["game:{id}"],
  "optimisticPatterns": ["shotMutation"],
  "notes": { "library": "swr|react-query", "staleTimeMs": 5000 }
}

Output formatting rules
-----------------------
- Use the required section headings exactly as listed above.
- Include fenced TypeScript code blocks for example snippets.
- Keep the total output concise (approx. 200–600 words plus snippets).

Acceptance criteria
-------------------
- The generated output explains fetch/caching strategy with concrete cache key examples.
- Mutation flow for firing a shot includes optimistic update and rollback steps.
- Includes short SWR and/or React Query code snippets for the mutation.
- Emits a valid `machine-summary` JSON block and echoes the used `default_board_size` when relevant.

Commit guidance
---------------
When adding this prompt file to the repo, use the commit message: `chore: add state-management prompt`

Notes and constraints
---------------------
- Prefer authoritative defaults from `/.github/prompts/01-architecture.prompt.md`.
- The generator should WARN (one-line consistency check) when local defaults differ from authoritative values.
- Do not include any code that persists game state to disk; assume in-memory-only server state.

End of prompt file.

