# Game Engine Prompt — Copilot Battleship

Purpose
-------
Create a prompt that generates a precise, implementable description of the core game engine for Copilot Battleship: ship placement rules, adjacency and overlap rules, hit/sink detection, turn resolution, lifecycle states, and test vectors/fixtures.

Context
-------
- In-memory game state (no DB)
- Board: prefer authoritative `default_board_size` from `/.github/prompts/01-architecture.prompt.md` (fallback: 10)
- Audience: engineers implementing game logic and unit tests

Prompt variables
----------------
- project_name (string) — default `copilot-battleship`
- default_board_size (number) — prefer incoming `machine-summary`, fallback `10`
- ship_definitions (optional) — default standard Battleship sizes (5,4,3,3,2)
- project_config (optional object)

Generator instructions
----------------------
Output a developer-facing game-engine spec with the exact headings below. Prefer incoming `machine-summary` and include one-line consistency check on mismatch.

Required sections
-----------------
1. Overview & responsibilities
2. Ship placement rules (alignment, boundaries, no-overlap)
3. Hit & sink detection (how to mark cell statuses and sink logic)
4. Turn resolution & invalid moves
5. Game states & lifecycle (waiting, placing, playing, ended)
6. Public function signatures
7. Test vectors (inputs -> expected outputs)
8. machine-summary

Key rules & function signatures
------------------------------
- Ship placement must be axis-aligned (horizontal/vertical), within bounds, and non-overlapping.
- Cells: represent by `{ x:number, y:number, status: 'empty'|'ship'|'hit'|'miss' }` or similar.
- Core functions to define (examples):
  - `createGame(playerId: string, boardSize: number): Game`
  - `placeShip(gameId: string, playerId: string, ship: Ship): Result`
  - `applyShot(gameId: string, playerId: string, x: number, y: number): ShotResult`
  - `checkSunk(board, ship): boolean`
- Define clear error/validation responses for invalid placement or out-of-turn shots.

Test vectors
------------
Include 3–5 small fixtures showing:
- Valid placement example and state after placement
- Shot that results in miss
- Shot that results in hit
- Sequence that sinks a ship (show expected `sunk` detection)

machine-summary JSON schema
---------------------------
{
  "project_name": string,
  "schema_version": number | string,
  "rules": ["placement","hit-sink","turns"],
  "ship_definitions": [{ "name":"Carrier","size":5 }],
  "testFixtures": [ { "name": "sink-example", "input": {}, "expected": {} } ],
  "notes": { "persistence": "in-memory-only" }
}

Output formatting rules
-----------------------
- Use exact headings; include short code examples and JSON fixtures for test vectors.
- Keep concise but unambiguous (300–900 words depending on examples).

Acceptance criteria
-------------------
- Unambiguous placement and hit/sink rules.
- Public function signatures listed.
- At least 3 test vectors with input and expected output.
- Valid `machine-summary` JSON exported.

Commit guidance
---------------
Commit message: `chore: add game-engine prompt`

