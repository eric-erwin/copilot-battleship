'use client'

import type { Game } from '@/lib/types'

export interface TopBarProps {
  game: Game
  playerId: string | null
}

const STATE_LABELS: Record<string, string> = {
  waiting: '⏳ Waiting for opponent…',
  placing: '🚢 Place your ships',
  playing: '🎯 Game in progress',
  ended:   '🏆 Game over',
}

export default function TopBar({ game, playerId }: TopBarProps) {
  const isWinner = !!game.winnerId && game.winnerId === playerId

  return (
    <header
      role="banner"
      aria-label="Game header"
      className="flex items-center justify-between px-6 py-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
    >
      <span className="font-bold text-lg tracking-tight select-none">⚓ Copilot Battleship</span>

      <span
        role="status"
        aria-live="polite"
        className="text-sm text-slate-500 dark:text-slate-400 font-medium"
      >
        {game.state === 'ended'
          ? isWinner ? '🏆 You won!' : '💀 You lost'
          : STATE_LABELS[game.state]}
      </span>

      <button
        className="text-xs text-slate-400 font-mono select-all hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded px-1"
        title="Click to copy Game ID"
        aria-label={`Game ID: ${game.id}`}
        onClick={() => navigator.clipboard?.writeText(game.id)}
      >
        {game.id.slice(0, 8)}…
      </button>
    </header>
  )
}
