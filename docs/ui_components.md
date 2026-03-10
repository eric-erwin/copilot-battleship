# UI Components — Copilot Battleship

> Authoritative defaults from `01-architecture.prompt.md` machine-summary:
> `default_board_size = 10`, `include_tailwind = true` (consistent — no mismatch).

---

## Component list & responsibilities

| Component | File | Responsibility |
|---|---|---|
| `Board` | `components/Board.tsx` | Renders the 10×10 grid, handles clicks and arrow-key navigation, supports fog-of-war and place/play modes |
| `Cell` | `components/Cell.tsx` | Single cell — displays status (empty/ship/hit/miss/sunk/pending), handles click and Enter/Space, shows icon |
| `PlayerPanel` | `components/PlayerPanel.tsx` | Footer showing both players, active turn indicator, ready/winner state |
| `TopBar` | `components/TopBar.tsx` | Header with game title, live status label, and copy-able Game ID |
| `Modal` | `components/Modal.tsx` | Accessible dialog with focus trap, Escape to close, and backdrop dismiss |
| `GameList` | `components/GameList.tsx` | List of active games linking to `/game/[id]`, with state badges and resume indicator |

---

## Props & TypeScript interfaces

### `Board`
```
export interface BoardProps {
  size: number                               // board dimension (default 10)
  cells: Cell[][]                            // 2-D cell grid [y][x]
  interactive?: boolean                      // enable click + keyboard
  fogOfWar?: boolean                         // hide opponent ships
  mode?: 'place' | 'play'                   // drives aria-description copy
  label?: string                             // override aria-label
  onCellClick?: (x: number, y: number) => void
}
```

### `Cell`
```
export interface CellProps {
  cell: Cell                                 // { x, y, status }
  fogOfWar?: boolean
  interactive?: boolean
  isFocused?: boolean                        // controlled focus ring
  onClick?: (x: number, y: number) => void
}
```

### `PlayerPanel`
```
export interface PlayerPanelProps {
  players: Player[]
  turnPlayerId: string | null
  winnerId?: string | null
}
```

### `TopBar`
```
export interface TopBarProps {
  game: Game
  playerId: string | null
}
```

### `Modal`
```
export interface ModalProps {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  children: React.ReactNode
}
```

### `GameList`
```
export interface GameListProps {
  games: Pick<Game, 'id' | 'state' | 'players' | 'boardSize' | 'createdAt'>[]
  currentPlayerId?: string | null
}
```

---

## Accessibility: ARIA roles & keyboard interactions

### Board
- `role="grid"` on the container
- `aria-label` = "Your board" or "Opponent's board" (or custom via `label` prop)
- `aria-description` = UX copy ("Place ship: …" or "Fire shot: …") when interactive
- `aria-colcount` / `aria-rowcount` set to `size`
- **Arrow keys** move focus between cells (`ArrowRight`, `ArrowLeft`, `ArrowDown`, `ArrowUp`)

### Cell
- `role="gridcell"` on each cell
- `aria-label` = `"Row {y+1}, Column {x+1} — {status}"`
- `aria-selected="false"` on actionable empty cells
- `aria-disabled="true"` on non-actionable cells when board is interactive
- `data-status` attribute for CSS targeting
- `Enter` / `Space` fires the click action when interactive
- `tabIndex={0}` when interactive, `-1` otherwise

### PlayerPanel
- `role="status"` + `aria-label="Player status"` on footer
- Each player chip has `aria-label` describing name, turn, and winner state

### TopBar
- `role="banner"` on header
- Game state span has `role="status"` + `aria-live="polite"` for screen-reader announcements
- Game ID button has explicit `aria-label`

### Modal
- `role="dialog"` + `aria-modal="true"`
- `aria-labelledby` → `modal-title`
- `aria-describedby` → `modal-description` (when description provided)
- Focus moves to first focusable element on open
- `Escape` closes the dialog
- Backdrop click closes the dialog

---

## Tailwind utility suggestions

### Board
```
inline-grid border border-slate-300 dark:border-slate-600 rounded
// grid columns set via inline style: gridTemplateColumns: `repeat(${size}, 1fr)`
```

### Cell (via globals.css `@layer components`)
```
.cell-base    { w-8 h-8 sm:w-10 sm:h-10 border flex items-center justify-center
                text-xs font-medium transition-colors duration-150
                focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 }
.cell-empty   { bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 }
.cell-ship    { bg-slate-400 dark:bg-slate-500 }
.cell-hit     { bg-red-500 text-white }
.cell-miss    { bg-slate-200 text-slate-400 dark:bg-slate-700 }
.cell-pending { bg-indigo-200 animate-pulse dark:bg-indigo-800 }
.cell-sunk    { bg-red-700 text-white }
```

### PlayerPanel
```
flex gap-6 justify-center p-4 border-t bg-white dark:bg-slate-900
// active chip: bg-indigo-100 text-indigo-700 dark:bg-indigo-900
// winner chip: bg-yellow-100 text-yellow-700 dark:bg-yellow-900
```

### TopBar
```
flex items-center justify-between px-6 py-3 border-b bg-white dark:bg-slate-900
```

### Modal
```
// backdrop: fixed inset-0 z-50 flex items-center justify-center bg-black/50
// dialog:   bg-white dark:bg-slate-900 rounded-xl shadow-xl p-6 w-full max-w-md
```

---

## Example usage snippets

### `Board` — opponent board in play mode
```
import Board from '@/components/Board'

<Board
  size={10}
  cells={opponent.board.cells}
  interactive={isMyTurn}
  fogOfWar
  mode="play"
  onCellClick={(x, y) => fireShot(x, y)}
/>
```

### `Board` — my board in placement mode
```
<Board
  size={10}
  cells={me.board.cells}
  interactive={game.state === 'placing'}
  mode="place"
  onCellClick={(x, y) => placeShipAt(x, y)}
/>
```

### `Cell` — standalone (inside Board)
```
import Cell from '@/components/Cell'

<Cell
  cell={{ x: 3, y: 5, status: 'empty' }}
  interactive
  onClick={(x, y) => console.log('Clicked', x, y)}
/>
```

### `Modal` — game-over dialog
```
import Modal from '@/components/Modal'

<Modal
  open={game.state === 'ended'}
  title={isWinner ? '🏆 You won!' : '💀 You lost'}
  description="The game is over. Start a new one?"
  onClose={() => router.push('/')}
>
  <button onClick={() => router.push('/')}>Back to lobby</button>
</Modal>
```

---

## machine-summary

```
{
  "project_name": "copilot-battleship",
  "schema_version": 1,
  "default_board_size": 10,
  "components": ["Board", "Cell", "PlayerPanel", "TopBar", "Modal", "GameList"],
  "ariaRoles": {
    "Board":       "grid",
    "Cell":        "gridcell",
    "PlayerPanel": "status",
    "TopBar":      "banner",
    "Modal":       "dialog",
    "GameList":    "list"
  },
  "tailwindUtilities": [
    "inline-grid", "w-8", "h-8", "sm:w-10", "sm:h-10",
    "focus:ring-2", "focus:ring-indigo-500", "focus:ring-offset-1",
    "animate-pulse", "bg-red-500", "bg-slate-100", "dark:bg-slate-800"
  ]
}
```

