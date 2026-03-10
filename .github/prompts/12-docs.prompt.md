# Docs Prompt — Copilot Battleship

Purpose
-------
Generate a prompt that produces README content, local development steps, API usage examples, contribution guidelines, and sample fixtures for the project documentation.

Context
-------
- Audience: new contributors, frontend devs, and designers
- Project: Next 15 + React 19, in-memory Battleship

Prompt variables
----------------
- project_name — default `copilot-battleship`
- default_board_size — prefer `machine-summary`, fallback `10`
- project_config (optional)

Generator instructions
----------------------
Output a clear README scaffold with exact headings and actionable commands. Prefer incoming `machine-summary` defaults and include a one-line consistency check when values differ.

Required sections
-----------------
1. Project overview
2. Local development (install, dev, build)
3. API usage examples
4. Running tests
5. Contributing guidelines
6. Sample fixtures and how to load them
7. machine-summary

Key commands to include
-----------------------
- `pnpm install` (or `npm install`) — install deps
- `pnpm dev` — start Next dev server
- `pnpm build && pnpm start` — build and run
- `pnpm test` — run tests

machine-summary JSON schema
---------------------------
{
  "project_name": string,
  "schema_version": number | string,
  "runCommands": ["pnpm install","pnpm dev","pnpm test"],
  "docsSections": ["Overview","Local dev","API","Contributing"]
}

Output formatting rules
-----------------------
- Use exact headings; provide copy-paste commands and short examples.
- Keep concise and helpful (300–800 words).

Acceptance criteria
-------------------
- Provides README sections with commands and API usage example.
- Includes a sample fixture section and how to use it.
- Emits valid `machine-summary` JSON.

Commit guidance
---------------
Commit message: `chore: add docs prompt`

