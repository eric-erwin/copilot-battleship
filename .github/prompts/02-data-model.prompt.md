# Data Model Prompt — Copilot Battleship

Purpose
-------
This prompt generates clear, UI/UX-minded TypeScript data models for the Copilot Battleship project (Next 15 + React 19, TypeScript, in-memory/no-DB, Tailwind). The output must include TypeScript interfaces, in-memory runtime shapes, example JSON instances, a serialization example for the `/api/games/[id]/shot` endpoint, and a machine-readable JSON block labeled `machine-summary` at the end.

Context
-------
- Project: Copilot Battleship
- Framework: Next.js 15 + React 19 (TypeScript)
- Persistence: In-memory only (no database) — ephemeral games
- Styling: Tailwind CSS (informational)
- Audience: frontend engineers, designers
- Default board size: 10 x 10

Prompt variables (ask for these or use defaults)
-----------------------------------------------
- project_name (string) — default: `copilot-battleship`
- default_board_size (number) — default: `10` (fallback only — prefer incoming machine-summary/project_config)
- include_tailwind (boolean) — default: `true` (informational only)
- models (optional array of model names) — default: `["Game","Player","Board","Ship","Cell","Shot","GameState"]`
- schema_version (number|string) — default: `1`
- project_config (optional object) — if provided, prefer values from `project_config` or an incoming `machine-summary` (recommended)

Generator instructions
----------------------
Produce a friendly, concise data-model document suitable for developers and designers. Use the exact headings below and include short, actionable rationales where requested. If an incoming `project_config` or `machine-summary` is provided, prefer its `default_board_size` value and include a one-line consistency check if your local default differs.

Required sections (use these exact headings)
-------------------------------------------
1. Data model overview
2. TypeScript interfaces
3. In-memory runtime shapes
4. Example JSON instances
5. Serialization example (POST /api/games/[id]/shot)
6. Copy-to-lib instructions
7. Runtime validation (Why & examples)
8. machine-summary

Details for each section
------------------------
- Data model overview: One-paragraph summary explaining the domain types and their responsibilities (Game, Player, Board, Ship, Cell, Shot, GameState). Keep it UI/UX-friendly.

- TypeScript interfaces: Output TypeScript interfaces for each confirmed model (`Game`, `Player`, `Board`, `Ship`, `Cell`, `Shot`, `GameState`). Keep interfaces concise and practical. Use union types or string enums where appropriate (e.g., `CellStatus = 'empty'|'miss'|'hit'|'ship'`).

- In-memory runtime shapes: Describe any runtime differences between the in-memory representation and the static interfaces (for example, derived fields like `shipsRemaining`, `shotsByPlayer`, or transient helpers). Keep this short.

- Example JSON instances: For each model, provide a minimal, concrete example JSON object (realistic sample values) showing how it will look over the wire. Keep examples compact.

- Serialization example (POST /api/games/[id]/shot): Provide a small request/response pair example showing the JSON shape a client will POST to fire a shot and the typical JSON response containing the result, e.g. `{ "result": "miss" | "hit" | "sunk", "x": 3, "y": 5, "nextTurnPlayerId": "..." }`.

- Copy-to-lib instructions: Include a short, actionable note telling developers how to copy the generated interfaces into `lib/types.ts` so client and server can share the same types. Mention using a single source-of-truth workflow (copy file or paste code into `lib/types.ts`) and optionally using a codegen step later.

- Runtime validation (Why & examples): Explain briefly why runtime validation matters (see the "Why?" guidance below). Recommend using Zod for runtime validation and include 2–3 short example Zod schemas mirroring the TypeScript interfaces (for `Shot` and `Cell`, or `Game` minimal). Keep code blocks concise.

Why include runtime validation? (short answer the generator must include)
------------------------------------------------------------------------
- TypeScript types disappear at runtime — Zod provides runtime checks at the client/server boundary to prevent malformed requests or accidental corruption of the in-memory state.
- In an ephemeral in-memory server, validation prevents a bad client or a UI bug from putting the server into an unrecoverable state.
- Zod integrates nicely with TypeScript and is lightweight, so it's a good default recommendation for this project.

Output formatting rules
-----------------------
- Use Markdown headings for the required sections (exact names above).
- For `TypeScript interfaces` and `Runtime validation` include fenced TypeScript code blocks.
- For `Example JSON instances` and `Serialization example`, include fenced JSON code blocks.
- For the `machine-summary` section, include exactly one JSON code block that is valid JSON (no comments).
- Keep the document concise — aim for 300–700 words total.

machine-summary JSON schema
---------------------------
The `machine-summary` must be a JSON object with these keys:

{
  "project_name": string,
  "default_board_size": number,
  "schema_version": number | string,
  "models": [
    {
      "name": string,
      "fields": { "fieldName": "type" }
    }
  ],
  "enums": { "EnumName": ["value1","value2"] },
  "routesUsingModels": ["/api/games","/api/games/[id]/shot"],
  "notes": {
    "persistence": "in-memory-only",
    "validation": "zod-recommended"
  }
}

Consistency guidance
--------------------
- If an incoming `project_config` or `machine-summary` is provided, prefer its `default_board_size` and include a one-line consistency check when your local default differs.
- The `machine-summary` emitted by this generator should echo the `default_board_size` used so downstream steps can verify consistency.

Acceptance criteria
-------------------
- Contains all required sections with valid code examples.
- Includes TypeScript interfaces for Game, Player, Board, Ship, Cell, Shot, GameState.
- Provides at least one realistic JSON example per model.
- Includes a small POST `/api/games/[id]/shot` request/response example.
- Recommends Zod and includes short example validators.
- `machine-summary` is valid JSON and follows the schema above.

Example invocation
------------------
"Generate data models for `copilot-battleship` with `default_board_size=10` and `schema_version=1`. Include TypeScript interfaces, Zod examples, example JSON instances, and the `machine-summary` JSON block."

Commit guidance
---------------
When adding this prompt file to the repo, use the commit message: `chore: add data-model prompt`

Notes and constraints
---------------------
- Do not include private or sensitive information.
- Do not output any code that attempts to persist data to disk; all models should assume in-memory runtime only.
- Keep UX language friendly and short; this prompt targets developers and designers working together.

End of prompt file.
