import { NextResponse } from 'next/server'

/**
 * WebSocket upgrade entry point — /api/ws
 *
 * Next.js 15 app router does not support native WS upgrades.
 * Options for production:
 *  A) Custom server (server.ts) using the `ws` npm package.
 *  B) Separate WS microservice on a different port.
 *  C) Managed service: Ably, Pusher, PartyKit, or similar.
 *
 * Connection URL:
 *   ws(s)://host/api/ws?gameId={uuid}&playerId={uuid}
 *
 * ─── Server → Client events ──────────────────────────────────────────────────
 *
 *  game:update
 *    { "type": "game:update", "payload": <Game> }
 *    Sent after any state mutation. Client should merge or replace its
 *    cached game state.
 *
 *  shot:result
 *    { "type": "shot:result", "payload": { "x": 3, "y": 5, "result": "hit", "playerId": "uuid" } }
 *    Sent immediately after applyShot resolves. result is "miss"|"hit"|"sunk".
 *
 *  player:joined
 *    { "type": "player:joined", "payload": { "playerId": "uuid", "name": "Bob" } }
 *    Sent to all clients when player 2 joins.
 *
 *  game:ended
 *    { "type": "game:ended", "payload": { "winnerId": "uuid", "finalState": <Game> } }
 *    Sent when all opponent ships are sunk.
 *
 * ─── Client → Server messages ────────────────────────────────────────────────
 *
 *  ping
 *    { "type": "ping" }
 *    Keepalive — server should respond with { "type": "pong" }.
 *
 * ─── Reconnection ────────────────────────────────────────────────────────────
 *
 *  Client uses exponential backoff with jitter (base 500ms, max 30s).
 *  On reconnect, client re-fetches GET /api/games/[id] to re-sync state,
 *  then re-establishes the WS connection.
 *
 * ─── Broadcaster ─────────────────────────────────────────────────────────────
 *
 *  Use lib/wsBroadcast.ts to push events from API route handlers:
 *
 *    import { broadcast } from '@/lib/wsBroadcast'
 *    broadcast(gameId, { type: 'shot:result', payload: { x, y, result, playerId } })
 */
export async function GET() {
  return NextResponse.json(
    {
      message:      'WebSocket endpoint — HTTP upgrade required',
      connectUrl:   'ws(s)://host/api/ws?gameId={uuid}&playerId={uuid}',
      serverEvents: ['game:update', 'shot:result', 'player:joined', 'game:ended'],
      clientEvents: ['ping'],
      reconnect:    { strategy: 'exponential-backoff', baseMs: 500, maxMs: 30000 },
    },
    { status: 426 }
  )
}
