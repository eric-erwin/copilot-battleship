# Architecture Prompt — Copilot Battleship

Purpose
-------
This prompt generates a clear, user-friendly architecture overview for the Copilot Battleship project (Next 15 + React 19, TypeScript, in-memory/no-DB, Tailwind CSS). The output should be UI/UX-minded and easy for developers and designers to read. The generator MUST provide a machine-readable JSON block labeled `machine-summary` at the end so the UI can consume it.

Context
-------
- Project: Copilot Battleship
- Framework: Next.js 15 + React 19 (TypeScript)
- Persistence: In-memory only (no database) — ephemeral games
- Styling: Tailwind CSS (required)
- Audience: frontend engineers, designers, product managers
- Date: March 10, 2026

Prompt variables (you should ask for these or use defaults)
---------------------------------------------------------
- project_name (string) — default: `copilot-battleship`
- default_board_size (number) — default: `10`  
- include_tailwind (boolean) — default: `true`
- brand_colors (optional object) — default: a simple Tailwind-compatible palette if not provided

Authoritative defaults
----------------------
This prompt is the single source-of-truth for project-level defaults (for example: `default_board_size` and `include_tailwind`). Other prompt generators (such as the data-model generator) SHOULD prefer values supplied by this prompt's `machine-summary` when available and fall back to their local defaults only when no authoritative value is provided.

Generator instructions
----------------------
Write a friendly, concise architecture document targeted at engineers and designers. Organize the output with these required sections (use exact headings):

1. Architecture decisions
2. Tech stack
3. Folder structure
4. UI/UX notes
5. Tailwind integration
6. machine-summary

For each decision or item, include a 1–3 sentence rationale that is practical and action-oriented. Keep each paragraph short and readable.

UI/UX behavior requirement
--------------------------
- Keep player interactions extremely simple and accessible. When describing UI copy or flows, include a one-line prompt the app should show for both actions:
  - "Place ship: Select cells on your board to place this ship." (or similar)
  - "Fire shot: Click a cell on the opponent's board to fire." (or similar)
- Include accessibility guidance: keyboard controls (arrow keys + Enter/Space), clear focus states, and sufficient color contrast.

Output formatting rules
-----------------------
- Use Markdown headings for the six required sections (exact heading names above).
- For `Folder structure`, present a compact filesystem tree using backtick-wrapped paths (e.g., `app/game/[id]/page.tsx`). Keep the tree to about 25 lines maximum.
- For the `machine-summary` section, include a single JSON code block only. The block must be valid JSON (no comments). The JSON schema is specified below.
- Keep the total output concise — approximately 300–800 words.

machine-summary JSON schema
---------------------------
Produce a JSON object with the following keys (example values shown):

{
  "project_name": "copilot-battleship",
  "default_board_size": 10,
  "schema_version": 1,
  "routes": ["/","/game/[id]","/api/games","/api/games/[id]/shot","/api/ws"],
  "components": ["Board","PlayerPanel","TopBar","GameList"],
  "tailwind": true,
  "entry": "app/",
  "notes": {
    "persistence": "in-memory-only",
    "realtime": "websocket",
    "ux_prompts": {
      "place_ship": "Place ship: Select cells on your board to place this ship.",
      "fire_shot": "Fire shot: Click a cell on the opponent's board to fire."
    }
  }
}

Consistency guidance
--------------------
- If other prompt generators receive a conflicting `default_board_size`, they should include a one-line consistency check in their output showing both values and noting which value was used.

Acceptance criteria
-------------------
- The output includes all required sections with short rationales.
- `Folder structure` maps to real files we will create in the repo (use sensible defaults for a Next 15 app using the `app/` router).
- The `machine-summary` JSON is valid and includes the fields in the schema above.
- Styling guidance includes Tailwind integration steps and a small set of recommended utility classes for the board and focus states.

Example invocation (how a user or automation should call the generator)
------------------------------------------------------------------------
"Generate an architecture doc for `copilot-battleship` with `default_board_size=10` and `include_tailwind=true`. Keep the UX friendly and include the `machine-summary` JSON."

Output tone and style
---------------------
- Friendly, conversational, and actionable.
- Prefer short bullets and concrete examples for UI copy.
- Avoid heavy technical prose; be practical and design-minded.

Commit guidance
---------------
When you add this prompt file to the repo, use the commit message: `chore: add architecture prompt`

Notes and constraints
---------------------
- Do not include brand color tokens in the `machine-summary` unless `brand_colors` are provided.
- Only output JSON in the `machine-summary` section — no YAML or other formats.
- Do not attempt to create or persist any data; state explicitly that games are ephemeral and lost on restart.

End of prompt file.
