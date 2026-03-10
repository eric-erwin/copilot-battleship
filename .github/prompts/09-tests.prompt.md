# Tests Prompt — Copilot Battleship

Purpose
-------
Create a prompt that outputs a focused test plan for the project: unit and integration tests for game engine, API, AI, and UI components. Include deterministic seeding guidance and sample fixtures for reproducible tests.

Context
-------
- Test frameworks: Jest + Testing Library (recommended) for frontend; node for engine tests
- Deterministic AI behavior via `randomness_seed`
- Audience: engineers writing tests and CI pipeline authors

Prompt variables
----------------
- project_name — default `copilot-battleship`
- default_board_size — prefer `machine-summary`, fallback `10`
- test_frameworks — default `jest` + `@testing-library/react`
- project_config (optional)

Generator instructions
----------------------
Produce a concise test plan with exact headings and include example test cases, fixtures, and seeding instructions. Prefer incoming `machine-summary` defaults and include consistency check if differing.

Required sections
-----------------
1. Test strategy (unit vs integration vs e2e)
2. Unit tests (game engine, utils, AI)
3. Integration tests (API routes + engine)
4. Component tests (Board and interactions)
5. Fixtures & deterministic seeds
6. CI tips & coverage targets
7. machine-summary

Example test cases
------------------
- Game engine: placing ships, invalid placement, hit/miss/sink detection
- API: POST /api/games create + POST /api/games/[id]/shot validate responses and status codes
- AI: seeded run should produce reproducible shot sequence for a small board
- Component: Board keyboard navigation and cell activation

Fixtures & seeds
----------------
- Provide sample JSON fixtures for a simple sinking sequence and a deterministic seed example (e.g., seed=42) for AI tests.

machine-summary JSON schema
---------------------------
{
  "project_name": string,
  "schema_version": number | string,
  "testFixtures": ["sink-sequence.json"],
  "seedExample": { "aiSeed": 42 },
  "coverageTargets": { "unit": 80 }
}

Output formatting rules
-----------------------
- Use exact headings; include code/test snippets where useful.
- Keep concise but actionable (300–800 words).

Acceptance criteria
-------------------
- Lists concrete unit and integration test cases.
- Includes deterministic AI test guidance and example fixtures.
- Emits valid `machine-summary` JSON.

Commit guidance
---------------
Commit message: `chore: add tests prompt`

