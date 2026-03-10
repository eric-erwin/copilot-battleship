import { NextResponse } from 'next/server'
import { createGame } from '@/lib/gameService'
import { listGames } from '@/lib/gameStore'
import { CreateGameSchema } from '@/lib/validators'

export async function GET() {
  const games = listGames().map(g => ({
    id:        g.id,
    state:     g.state,
    players:   g.players.map(p => ({ id: p.id, name: p.name, ready: p.ready })),
    boardSize: g.boardSize,
    createdAt: g.createdAt,
  }))
  return NextResponse.json({ games })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = CreateGameSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }
    const { playerName, boardSize } = parsed.data
    const { game, playerId } = createGame(playerName, boardSize)
    return NextResponse.json({ gameId: game.id, playerId }, { status: 201 })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

