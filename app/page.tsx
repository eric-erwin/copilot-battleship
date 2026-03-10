'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()
  const [playerName, setPlayerName] = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)

  async function handleCreate() {
    if (!playerName.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch('/api/games', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ playerName }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create game')
      localStorage.setItem(`pid-${data.gameId}`, data.playerId)
      router.push(`/game/${data.gameId}`)
    } catch (e: unknown) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-8 p-6">
      <div className="flex flex-col items-center gap-2">
        <span className="text-5xl">⚓</span>
        <h1 className="text-4xl font-bold tracking-tight">Copilot Battleship</h1>
        <p className="text-slate-500 dark:text-slate-400 text-center max-w-sm">
          Place your ships, then sink the CPU&apos;s fleet before it sinks yours.
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <input
          className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:border-slate-600"
          placeholder="Enter your name"
          value={playerName}
          onChange={e => setPlayerName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
          aria-label="Your name"
          autoFocus
        />
        <button
          onClick={handleCreate}
          disabled={loading || !playerName.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg px-4 py-2 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {loading ? 'Starting…' : 'Play vs CPU'}
        </button>
        {error && <p role="alert" className="text-red-500 text-sm text-center">{error}</p>}
      </div>
    </main>
  )
}
