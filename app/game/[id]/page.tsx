'use client'

import { use, useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import Board from '@/components/Board'
import PlayerPanel from '@/components/PlayerPanel'
import TopBar from '@/components/TopBar'
import ShipPlacer from '@/components/ShipPlacer'
import type { Game, Orientation } from '@/lib/types'

interface Props {
  params: Promise<{ id: string }>
}

export default function GamePage({ params }: Props) {
  const { id: gameId }          = use(params)
  const [game, setGame]         = useState<Game | null>(null)
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [error, setError]       = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [pending, setPending]   = useState(false)
  const intervalRef             = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const fetchGame = useCallback(async () => {
    try {
      const res = await fetch(`/api/games/${gameId}`)
      if (res.status === 404) {
        setNotFound(true)
        stopPolling()
        return
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to fetch game')
      setGame(data.game)
      setError(null)
      if (data.game?.state === 'ended') stopPolling()
    } catch (e: unknown) {
      setError(String(e))
    }
  }, [gameId, stopPolling])

  useEffect(() => {
    setPlayerId(localStorage.getItem(`pid-${gameId}`))
    fetchGame()
    intervalRef.current = setInterval(fetchGame, 2000)
    return stopPolling
  }, [gameId, fetchGame, stopPolling])

  // ── Ship placement ────────────────────────────────────────────────────────
  async function handlePlaceShip(shipType: string, x: number, y: number, orientation: Orientation) {
    if (!playerId) return
    const res  = await fetch(`/api/games/${gameId}/place`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ playerId, shipId: shipType, x, y, orientation }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? 'Placement failed')
    await fetchGame()
  }

  // ── Shot ──────────────────────────────────────────────────────────────────
  async function handleShot(x: number, y: number) {
    if (!playerId || !game || pending) return
    setPending(true)
    setError(null)
    try {
      const res  = await fetch(`/api/games/${gameId}/shot`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ playerId, x, y }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Shot failed')
      await fetchGame()
    } catch (e: unknown) {
      setError(String(e))
    } finally {
      setPending(false)
    }
  }

  // ── Guards ────────────────────────────────────────────────────────────────
  if (notFound) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-6">
      <p className="text-2xl">🌊</p>
      <h1 className="text-xl font-semibold text-slate-700 dark:text-slate-200">Game not found</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-xs">
        This game no longer exists — the server may have restarted and cleared all in-memory games.
      </p>
      <Link href="/" className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-5 py-2 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500">
        Back to lobby
      </Link>
    </div>
  )

  if (error && !game) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-6">
      <p role="alert" className="text-red-500 text-sm">{error}</p>
      <Link href="/" className="text-indigo-500 underline text-sm">Back to lobby</Link>
    </div>
  )

  if (!game) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-slate-400 animate-pulse">Loading game…</p>
    </div>
  )

  const me       = game.players.find(p => p.id === playerId) ?? game.players[0]
  const opponent = game.players.find(p => p.id !== playerId)
  const isMyTurn = game.turnPlayerId === playerId
  const isPlacing = game.state === 'placing' || game.state === 'waiting'

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar game={game} playerId={playerId} />

      {error && (
        <div role="alert" className="text-center text-xs text-red-500 py-1 bg-red-50 dark:bg-red-900/20">
          {error}
        </div>
      )}

      <main className="flex flex-1 flex-col lg:flex-row gap-8 items-start justify-center p-6">

        {/* ── Placement phase ── */}
        {isPlacing && me && (
          <section className="flex flex-col gap-3">
            <h2 className="font-semibold text-slate-600 dark:text-slate-300">Your board</h2>
            <ShipPlacer
              boardSize={game.boardSize}
              cells={me.board.cells}
              placedTypes={me.board.ships.map(s => s.type)}
              onPlace={handlePlaceShip}
            />
            {!opponent && (
              <div className="mt-2 flex flex-col gap-1">
                <p className="text-xs text-slate-400">Share your Game ID for a friend to join:</p>
                <code className="text-sm font-mono bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded select-all">
                  {gameId}
                </code>
              </div>
            )}
          </section>
        )}

        {/* ── Playing phase ── */}
        {!isPlacing && (
          <>
            {/* My board */}
            <section className="flex flex-col gap-3">
              <h2 className="font-semibold text-slate-600 dark:text-slate-300">Your board</h2>
              <Board
                size={game.boardSize}
                cells={me.board.cells}
                interactive={false}
              />
            </section>

            {/* Opponent board */}
            {opponent && (
              <section className="flex flex-col gap-3">
                <h2 className="font-semibold text-slate-600 dark:text-slate-300">
                  {opponent.name}&apos;s board
                </h2>
                <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">
                  {isMyTurn
                    ? "Fire shot: Click a cell on the opponent's board to fire."
                    : `Waiting for ${opponent.name}…`}
                </p>
                <Board
                  size={game.boardSize}
                  cells={opponent.board.cells}
                  interactive={isMyTurn && !pending}
                  fogOfWar
                  onCellClick={handleShot}
                />
              </section>
            )}
          </>
        )}
      </main>

      <PlayerPanel
        players={game.players}
        turnPlayerId={game.turnPlayerId}
        winnerId={game.winnerId}
      />
    </div>
  )
}
