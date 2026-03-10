# Architecture — Copilot Battleship

## Architecture decisions

- **In-memory server state (ephemeral)** — Games are stored in a `Map<string, Game>` on the Node process. Rationale: zero infra, instant local dev, easy Vercel deploy. Tradeoff: state is lost on restart and does not scale to multiple instances without Redis.
- **Next.js 15 app router + React 19 + TypeScript** — Co-located client/server code, type-safety everywhere, and React 19 `use()` for ergonomic async params. Rationale: strong DX and simple same-origin API routing.
- **REST for commands + polling for realtime** — REST endpoints handle all game mutations; client polls `GET /api/games/[id]` every 2 s. A WebSocket route (`/api/ws`) is provided for future upgrade.
- **Zod at API boundary** — All incoming requests are validated with Zod before touching in-memory state. Rationale: TypeScript types are erased at runtime; Zod prevents corrupt state.
- **Hunt-and-target AI (`lib/ai.ts`)** — Simple seeded CPU opponent: random hunt until hit, then probe orthogonal directions until sunk. Rationale: enables solo play and reproducible tests.

## Tech stack

| Layer      | Choice                        | Reason                               |
|------------|-------------------------------|--------------------------------------|
| Framework  | Next.js 15 (app router)       | Co-located routes, server components |
| UI         | React 19 + TypeScript         | Component model, type safety         |
| Styling    | Tailwind CSS                  | Utility-first, dark mode, focus rings|
| Validation | Zod                           | Runtime checks at API boundary       |
| AI         | Custom `AIPlayer` (lib/ai.ts) | Simple, seeded, dependency-free      |
| Testing    | Jest + Testing Library        | Unit/integration + deterministic AI  |

## Folder structure

```
app/
  layout.tsx
  page.tsx
  game/[id]/page.tsx
  api/
    games/route.ts
    games/[id]/route.ts
    games/[id]/shot/route.ts
    ws/route.ts
lib/
  types.ts
  gameStore.ts
  gameService.ts
  ai.ts
  validators.ts
components/
  Board.tsx
  Cell.tsx
  PlayerPanel.tsx
  TopBar.tsx
hooks/
  useGame.ts
  useWebSocket.ts
styles/
  globals.css
tailwind.config.ts
docs/
  architecture.md
  api_spec.md
  data_model.md
```

## UI/UX notes

- **Place ship:** "Place ship: Select cells on your board to place this ship."
- **Fire shot:** "Fire shot: Click a cell on the opponent's board to fire."
- Keyboard: arrow keys to navigate board, `Enter`/`Space` to activate a cell.
- Accessibility: `role="grid"` on Board, `role="gridcell"` on Cell, `aria-live="polite"` for shot results.
- Visual feedback: pending shot shows `animate-pulse`; results shown inline (💥 hit, · miss, ☠️ sunk).
- Error UX: inline `role="alert"` banner, retry button for failed shots.

## Tailwind integration

Install and configure with `tailwind.config.ts` and import `styles/globals.css` in `app/layout.tsx`.

Key utilities:
- Board grid: `inline-grid` + `style={{ gridTemplateColumns: repeat(size, 1fr) }}`
- Cell base: `w-8 h-8 sm:w-10 sm:h-10 border flex items-center justify-center`
- Focus ring: `focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500`
- Hit: `bg-red-500 text-white` | Miss: `bg-slate-200` | Sunk: `bg-red-700 text-white`
- Dark mode: `dark:bg-slate-800`, `dark:border-slate-600` on all cells

## machine-summary

```json
{
  "project_name": "copilot-battleship",
  "default_board_size": 10,
  "schema_version": 1,
  "routes": ["/", "/game/[id]", "/api/games", "/api/games/[id]/shot", "/api/ws"],
  "components": ["Board", "Cell", "PlayerPanel", "TopBar"],
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
```

