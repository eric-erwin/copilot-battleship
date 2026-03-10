# Styling Prompt — Copilot Battleship (Tailwind)

Purpose
-------
Create a prompt that outputs Tailwind styling conventions, theme tokens, and recommended utility patterns for the Battleship UI components and board layout.

Context
-------
- Styling: Tailwind CSS
- Framework: Next 15 + React 19
- Audience: frontend engineers and designers

Prompt variables
----------------
- project_name — default `copilot-battleship`
- include_tailwind — default `true`
- project_config (optional)

Generator instructions
----------------------
Produce a concise Tailwind styling guide with exact headings below. Prefer incoming `machine-summary` values and include a consistency check when values differ.

Required sections
-----------------
1. Tailwind config suggestions (colors, spacing, focus)
2. Utility patterns for Board & Cell
3. Component-level class examples (Board, Cell, PlayerPanel)
4. Theme tokens and dark-mode notes
5. machine-summary

Utility recommendations
----------------------
- Board container: `grid grid-cols-{size} gap-0` and responsive wrappers
- Cell base: `w-8 h-8 sm:w-10 sm:h-10 border bg-slate-100 dark:bg-slate-800`
- Focus: `focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500`

machine-summary JSON schema
---------------------------
{
  "project_name": string,
  "schema_version": number | string,
  "tailwindConfigHints": { "colors": ["indigo","slate"], "focus": "ring-indigo-500" },
  "utilityExamples": ["grid","w-8","h-8","focus:ring-2"]
}

Output formatting rules
-----------------------
- Use exact headings; provide class examples and short rationale.
- Keep concise (200–600 words).

Acceptance criteria
-------------------
- Provides Tailwind config hints and utility class examples for Board and Cell.
- Includes dark-mode considerations and focus utilities.
- Emits valid `machine-summary` JSON.

Commit guidance
---------------
Commit message: `chore: add styling prompt`

