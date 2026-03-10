'use client'

import type { Player } from '@/lib/types'

export interface PlayerPanelProps {
  players: Player[]
  turnPlayerId: string | null
  winnerId?: string | null
}

export default function PlayerPanel({ players, turnPlayerId, winnerId }: PlayerPanelProps) {
  return (
    <footer
      role="status"
      aria-label="Player status"
      className="flex gap-6 justify-center p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
    >
      {players.map(p => {
        const isActive = p.id === turnPlayerId
        const isWinner = p.id === winnerId
        return (
          <div
            key={p.id}
            aria-label={`${p.name}${isActive ? ', their turn' : ''}${isWinner ? ', winner' : ''}`}
            className={[
              'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
              isWinner  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
            : isActive  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
            :             'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
            ].join(' ')}
          >
            <span
              className={[
                'w-2 h-2 rounded-full',
                isWinner ? 'bg-yellow-400'
              : isActive ? 'bg-indigo-500 animate-pulse'
              :            'bg-slate-300',
              ].join(' ')}
              aria-hidden="true"
            />
            {p.name}
            {p.ready   && !isWinner && <span className="text-xs text-green-500 ml-1" aria-label="ready">✓</span>}
            {isWinner  && <span className="text-xs ml-1" aria-label="winner">🏆</span>}
          </div>
        )
      })}
    </footer>
  )
}
