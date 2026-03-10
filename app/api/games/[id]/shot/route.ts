import { NextResponse } from 'next/server'
import { applyShot } from '@/lib/gameService'
import { ShotSchema } from '@/lib/validators'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body   = await req.json()
    const parsed = ShotSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }
    const { playerId, x, y } = parsed.data
    const { game, result, sunkShip } = applyShot(id, playerId, x, y)
    return NextResponse.json({
      result,
      x,
      y,
      sunkShip:         sunkShip ?? null,
      nextTurnPlayerId: game.turnPlayerId,
      winnerId:         game.winnerId,
    })
  } catch (err: unknown) {
    const msg = String(err)
    const status = msg.includes('not found') ? 404 : msg.includes('turn') ? 403 : 400
    return NextResponse.json({ error: msg }, { status })
  }
}

