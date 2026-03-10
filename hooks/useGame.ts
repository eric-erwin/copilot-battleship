'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Game } from '@/lib/types'

interface UseGameReturn {
  game: Game | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  fireShot: (playerId: string, x: number, y: number) => Promise<void>
}

export function useGame(gameId: string): UseGameReturn {
  const [game, setGame]       = useState<Game | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const res  = await fetch(`/api/games/${gameId}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to fetch game')
      setGame(data.game)
      setError(null)
    } catch (e: unknown) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [gameId])

  const fireShot = useCallback(async (playerId: string, x: number, y: number) => {
    // Optimistically mark cell pending before request resolves
    setGame(prev => {
      if (!prev) return prev
      const updated = structuredClone(prev)
      const opponent = updated.players.find(p => p.id !== playerId)
      if (opponent?.board.cells[y]?.[x]) {
        opponent.board.cells[y][x].status = 'pending' as never
      }
      return updated
    })

    try {
      const res  = await fetch(`/api/games/${gameId}/shot`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ playerId, x, y }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Shot failed')
      // Re-fetch authoritative state after shot resolves
      await refresh()
    } catch (e: unknown) {
      setError(String(e))
      // Rollback optimistic update
      await refresh()
    }
  }, [gameId, refresh])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 2000)
    return () => clearInterval(interval)
  }, [refresh])

  return { game, loading, error, refresh, fireShot }
}

