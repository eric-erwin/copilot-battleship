# Security & Privacy Prompt — Copilot Battleship

Purpose
-------
Create a prompt that outlines security and privacy considerations for the project: ephemeral-state warnings, input validation & sanitization (Zod), CSRF/XSS guidance, and telemetry opt-in language.

Context
-------
- No persistent user data; games are ephemeral in-memory
- Audience: engineers and product managers

Prompt variables
----------------
- project_name — default `copilot-battleship`
- default_board_size — prefer `machine-summary`, fallback `10`
- telemetry_policy (optional) — default `opt-in`
- project_config (optional)

Generator instructions
----------------------
Produce a clear, actionable security & privacy doc with exact headings. Prefer incoming `machine-summary` defaults and include a one-line consistency check when values differ.

Required sections
-----------------
1. Threat model & overview
2. Input validation & sanitization (Zod recommended)
3. CSRF & same-origin considerations
4. XSS & output encoding
5. Telemetry & privacy language (opt-in recommended)
6. machine-summary

Key guidance
------------
- Use Zod at API boundary to validate all incoming requests.
- Run same-origin rules; recommend CSRF token or verify `same-site` cookies for POSTs if auth added later.
- Sanitize any user-provided text before rendering. Avoid injecting HTML.
- Telemetry: default to off; if enabled, require explicit opt-in and document data collected.

machine-summary JSON schema
---------------------------
{
  "project_name": string,
  "schema_version": number | string,
  "threats": ["bad-input","state-tampering"],
  "validationRecommendations": "zod-recommended",
  "telemetry": { "policy": "opt-in" }
}

Output formatting rules
-----------------------
- Use exact headings; include small examples (Zod usage) where helpful.
- Keep concise and practical (200–600 words).

Acceptance criteria
-------------------
- Includes input validation and CSRF/XSS guidance.
- Recommends Zod and documents telemetry opt-in policy.
- Emits valid `machine-summary` JSON.

Commit guidance
---------------
Commit message: `chore: add security-privacy prompt`

