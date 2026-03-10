/**
 * lib/wsBroadcast.ts
 *
 * In-memory WebSocket broadcaster.
 * Keeps a registry of open WebSocket connections keyed by gameId.
 * Called by API route handlers after game state mutations to push
 * real-time events to all connected clients for a game.
 *
 * NOTE: This is in-memory only and single-instance. For multi-instance
 * deployments, replace with a pub/sub service (Redis, Ably, Pusher, etc.).
 */

import type { Game, ShotResult } from '@/lib/types'

// ─── Event shapes (mirror WSEvent in hooks/useWebSocket.ts) ──────────────────

export type WSEventPayload =
  | { type: 'game:update';   payload: Game }
  | { type: 'shot:result';   payload: { x: number; y: number; result: ShotResult; playerId: string } }
  | { type: 'player:joined'; payload: { playerId: string; name: string } }
  | { type: 'game:ended';    payload: { winnerId: string; finalState: Game } }

// ─── Connection registry ──────────────────────────────────────────────────────

/** Map of gameId → Set of open WebSocket-like connections */
const connections = new Map<string, Set<WebSocket>>()

export function registerConnection(gameId: string, ws: WebSocket): void {
  if (!connections.has(gameId)) connections.set(gameId, new Set())
  connections.get(gameId)!.add(ws)
}

export function removeConnection(gameId: string, ws: WebSocket): void {
  connections.get(gameId)?.delete(ws)
  if (connections.get(gameId)?.size === 0) connections.delete(gameId)
}

// ─── Broadcast ────────────────────────────────────────────────────────────────

/**
 * Broadcast an event to all clients connected to a game.
 * Silently skips closed connections and removes them from the registry.
 */
export function broadcast(gameId: string, event: WSEventPayload): void {
  const sockets = connections.get(gameId)
  if (!sockets) return

  const message = JSON.stringify(event)
  for (const ws of sockets) {
    if (ws.readyState === ws.OPEN) {
      ws.send(message)
    } else {
      sockets.delete(ws)
    }
  }
}

