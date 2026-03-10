'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import type { Game, ShotResult } from '@/lib/types'

// ─── Event types ─────────────────────────────────────────────────────────────

export type WSStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

export type WSEvent =
  | { type: 'game:update';   payload: Game }
  | { type: 'shot:result';   payload: { x: number; y: number; result: ShotResult; playerId: string } }
  | { type: 'player:joined'; payload: { playerId: string; name: string } }
  | { type: 'game:ended';    payload: { winnerId: string; finalState: Game } }

export type WSMessage = WSEvent  // alias for sending; same discriminated union

// ─── Options / return ────────────────────────────────────────────────────────

export interface UseWebSocketOptions {
  gameId:          string
  playerId:        string | null
  /** Called for every inbound event from the server */
  onEvent?:        (event: WSEvent) => void
  /** Called whenever the connection status changes */
  onStatusChange?: (status: WSStatus) => void
}

export interface UseWebSocketReturn {
  /** Current connection status */
  status:    WSStatus
  /** True when status === 'connected' */
  connected: boolean
  /** Send any serialisable payload to the server */
  send:      (data: unknown) => void
  /** Manually close and stop reconnecting */
  disconnect: () => void
}

// ─── Constants ───────────────────────────────────────────────────────────────

const BASE_DELAY_MS = 500
const MAX_DELAY_MS  = 30_000

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useWebSocket({
  gameId,
  playerId,
  onEvent,
  onStatusChange,
}: UseWebSocketOptions): UseWebSocketReturn {
  const wsRef         = useRef<WebSocket | null>(null)
  const retryDelay    = useRef(BASE_DELAY_MS)
  const retryTimeout  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const unmounted     = useRef(false)
  const manualClose   = useRef(false)

  const [status, setStatus] = useState<WSStatus>('connecting')

  const updateStatus = useCallback((s: WSStatus) => {
    setStatus(s)
    onStatusChange?.(s)
  }, [onStatusChange])

  const connect = useCallback(() => {
    if (unmounted.current || manualClose.current || !playerId) return

    updateStatus('connecting')

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const url      = `${protocol}://${window.location.host}/api/ws?gameId=${encodeURIComponent(gameId)}&playerId=${encodeURIComponent(playerId)}`
    const ws       = new WebSocket(url)
    wsRef.current  = ws

    ws.onopen = () => {
      updateStatus('connected')
      retryDelay.current = BASE_DELAY_MS
    }

    ws.onmessage = (e: MessageEvent) => {
      try {
        const event = JSON.parse(e.data as string) as WSEvent
        onEvent?.(event)
      } catch {
        // ignore malformed frames
      }
    }

    ws.onerror = () => {
      updateStatus('error')
      ws.close()
    }

    ws.onclose = () => {
      updateStatus('disconnected')
      if (unmounted.current || manualClose.current) return
      // Exponential backoff with jitter
      const jitter            = Math.random() * 200
      const delay             = Math.min(retryDelay.current + jitter, MAX_DELAY_MS)
      retryDelay.current      = Math.min(retryDelay.current * 2, MAX_DELAY_MS)
      retryTimeout.current    = setTimeout(connect, delay)
    }
  }, [gameId, playerId, onEvent, updateStatus])

  useEffect(() => {
    unmounted.current  = false
    manualClose.current = false
    connect()
    return () => {
      unmounted.current = true
      if (retryTimeout.current) clearTimeout(retryTimeout.current)
      wsRef.current?.close()
    }
  }, [connect])

  const send = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    }
  }, [])

  const disconnect = useCallback(() => {
    manualClose.current = true
    if (retryTimeout.current) clearTimeout(retryTimeout.current)
    wsRef.current?.close()
    updateStatus('disconnected')
  }, [updateStatus])

  return { status, connected: status === 'connected', send, disconnect }
}
