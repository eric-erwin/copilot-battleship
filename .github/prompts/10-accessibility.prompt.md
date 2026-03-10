# Accessibility Prompt — Copilot Battleship

Purpose
-------
Generate an accessibility (A11y) guidance prompt for Copilot Battleship that outlines keyboard flows, focus states, ARIA roles, color contrast guidance, and screen-reader text patterns for the board and UI components.

Context
-------
- Frontend: Next 15 + React 19
- Styling: Tailwind CSS
- Audience: frontend engineers and designers

Prompt variables
----------------
- project_name — default `copilot-battleship`
- default_board_size — prefer `machine-summary`, fallback `10`
- project_config (optional)

Generator instructions
----------------------
Produce an actionable A11y checklist with exact headings below. Prefer incoming `machine-summary` defaults and include a consistency check when values differ.

Required sections
-----------------
1. A11y goals & overview
2. Keyboard flows (board navigation, placing, firing)
3. Focus styles & visual cues (Tailwind suggestions)
4. ARIA roles & screen-reader text
5. Color contrast & theme recommendations
6. machine-summary

Key accessibility rules
-----------------------
- Board should be navigable with arrow keys and cells activatable with Enter/Space.
- Use `role="grid"` on the Board and `role="gridcell"` on cells; provide `aria-selected` or `aria-pressed` for active targeting.
- Focus styles: recommend `focus:outline-none focus:ring-2 focus:ring-offset-1` and a high-contrast ring color.
- Provide polite live regions for game events (e.g., `aria-live="polite"` for shot results).

machine-summary JSON schema
---------------------------
{
  "project_name": string,
  "schema_version": number | string,
  "a11yChecklist": ["keyboard-navigation","focus-styles","sr-text"],
  "keyboardShortcuts": { "move": "arrow-keys", "activate": "enter|space" }
}

Output formatting rules
-----------------------
- Use exact headings; include Tailwind class examples for focus.
- Keep concise and actionable (200–500 words).

Acceptance criteria
-------------------
- Includes keyboard flows and ARIA role recommendations.
- Provides Tailwind focus suggestions and contrast notes.
- Emits valid `machine-summary` JSON.

Commit guidance
---------------
Commit message: `chore: add accessibility prompt`

