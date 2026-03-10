'use client'

import Link from 'next/link'
import type { Game } from '@/lib/types'

export interface GameListProps {
  games: Pick<Game, 'id' | 'state' | 'players' | 'boardSize' | 'createdAt'>[]
  currentPlayerId?: string | null
}

const STATE_BADGE: Record<string, string> = {
  waiting: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  placing: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  playing: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  ended:   'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
}

export default function GameList({ games, currentPlayerId }: GameListProps) {
  if (games.length === 0) {
    return (
      <p className="text-slate-400 text-sm text-center py-6">
        No active games. Create one to get started!
      </p>
    )
  }

  return (
    <ul
      role="list"
      aria-label="Active games"
      className="flex flex-col gap-2 w-full"
    >
      {games.map(g => {
        const playerNames = g.players.map(p => p.name).join(' vs ')
        const isMyGame    = g.players.some(p => p.id === currentPlayerId)

        return (
          <li key={g.id}>
            <Link
              href={`/game/${g.id}`}
              aria-label={`${isMyGame ? 'Resume' : 'Join'} game: ${playerNames || 'New game'}, state: ${g.state}`}
              className="flex items-center justify-between px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  {playerNames || 'Waiting for players…'}
                </span>
                <span className="text-xs text-slate-400 font-mono">{g.id.slice(0, 8)}…</span>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATE_BADGE[g.state] ?? ''}`}>
                  {g.state}
                </span>
                {isMyGame && (
                  <span className="text-xs text-indigo-500 font-semibold">Resume</span>
                )}
              </div>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

