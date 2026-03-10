# UI Components Prompt — Copilot Battleship

Purpose
-------
Generate a UI-focused prompt that produces component specifications, props, ARIA roles, keyboard interactions, and Tailwind utility suggestions for the main React components: `Board`, `Cell`, `PlayerPanel`, `TopBar`, and modals.

Context
-------
- Framework: Next 15 + React 19 + TypeScript
- Styling: Tailwind CSS
- Accessibility required (keyboard + screen reader)
- Audience: frontend engineers and designers

Prompt variables
----------------
- project_name — default `copilot-battleship`
- default_board_size — prefer `machine-summary`, fallback `10`
- include_tailwind — default `true`
- project_config (optional)

Generator instructions
----------------------
Produce a friendly component spec document with exact headings below. Prefer incoming `machine-summary` defaults and include a one-line consistency check when values differ.

Required sections
-----------------
1. Component list & responsibilities
2. Props & TypeScript interfaces (for each component)
3. Accessibility: ARIA roles & keyboard interactions
4. Tailwind utility suggestions (classes for layout & focus)
5. Example usage snippets (JSX) for `Board` and `Cell`
6. machine-summary

Component highlights
--------------------
- `Board`
  - Responsibilities: render grid, handle clicks, show fog-of-war for opponent board
  - Props example: `size:number, cells: Cell[][], onCellClick: (x,y)=>void, mode: 'place'|'play'`
  - ARIA: `role="grid"`, `aria-label="Player board"`
- `Cell`
  - Props example: `x:number,y:number,status: CellStatus, isFocused:boolean, onClick: ()=>void`
  - ARIA: `role="gridcell"`, `aria-selected` when targeted
  - Keyboard: arrow navigation + Enter/Space to activate
- `PlayerPanel`, `TopBar`, `Modal` — include props summary and suggested Tailwind classes

Tailwind suggestions
-------------------
- Board container: `grid grid-cols-{size} gap-0` with responsive sizing classes
- Cell base: `w-8 h-8 sm:w-10 sm:h-10 border` and focus ring `focus:outline-none focus:ring-2 focus:ring-offset-1`

machine-summary JSON schema
---------------------------
{
  "project_name": string,
  "schema_version": number | string,
  "components": ["Board","Cell","PlayerPanel"],
  "ariaRoles": { "Board": "grid", "Cell": "gridcell" },
  "tailwindUtilities": ["grid","w-8","h-8","focus:ring-2"]
}

Output formatting rules
-----------------------
- Use exact headings. Include TypeScript interface examples and JSX snippets.
- Keep document concise (300–700 words plus snippets).

Acceptance criteria
-------------------
- Props/interfaces for Board and Cell provided.
- ARIA roles and keyboard interactions specified.
- Tailwind utility class suggestions included.
- Valid `machine-summary` JSON block emitted.

Commit guidance
---------------
Commit message: `chore: add ui-components prompt`

