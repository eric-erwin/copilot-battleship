import { NextResponse } from 'next/server'
import { placeShip } from '@/lib/gameService'
import { PlaceShipSchema } from '@/lib/validators'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body   = await req.json()
    const parsed = PlaceShipSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }
    const { playerId, shipId, x, y, orientation } = parsed.data
    const game = placeShip(id, playerId, shipId, x, y, orientation)
    return NextResponse.json({ game })
  } catch (err: unknown) {
    const msg    = String(err)
    const status = msg.includes('not found') ? 404
                 : msg.includes('bounds')    ? 400
                 : msg.includes('Overlap')   ? 409
                 : 400
    return NextResponse.json({ error: msg }, { status })
  }
}

