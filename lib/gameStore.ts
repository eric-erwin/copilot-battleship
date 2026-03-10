import type { Game } from '@/lib/types'

// ─── Global singleton store ───────────────────────────────────────────────────
// In dev mode Next.js hot-reloads modules, which would reset a plain Map.
// Attaching to `globalThis` ensures the store survives HMR between reloads.

declare global {
  // eslint-disable-next-line no-var
  var __gameStore: Map<string, Game> | undefined
}

const games: Map<string, Game> = globalThis.__gameStore ?? new Map<string, Game>()
if (!globalThis.__gameStore) globalThis.__gameStore = games

// ─── Store accessors ─────────────────────────────────────────────────────────

export function getGame(id: string): Game | undefined {
  return games.get(id)
}

export function setGame(game: Game): void {
  games.set(game.id, game)
}

export function deleteGame(id: string): void {
  games.delete(id)
}

export function listGames(): Game[] {
  return Array.from(games.values())
}

export function gameExists(id: string): boolean {
  return games.has(id)
}
