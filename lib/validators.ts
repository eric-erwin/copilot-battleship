import { z } from 'zod'

// ─── Request validators ───────────────────────────────────────────────────────

export const CreateGameSchema = z.object({
  playerName: z.string().min(1).max(32),
  boardSize:  z.number().int().min(5).max(20).optional().default(10),
})

export const JoinGameSchema = z.object({
  playerName: z.string().min(1).max(32),
})

export const ShotSchema = z.object({
  playerId: z.string().uuid(),
  x: z.number().int().min(0),
  y: z.number().int().min(0),
})

export const PlaceShipSchema = z.object({
  playerId:    z.string().uuid(),
  shipId:      z.string(),
  x:           z.number().int().min(0),
  y:           z.number().int().min(0),
  orientation: z.enum(['horizontal', 'vertical']),
})

export type CreateGameInput = z.infer<typeof CreateGameSchema>
export type JoinGameInput   = z.infer<typeof JoinGameSchema>
export type ShotInput       = z.infer<typeof ShotSchema>
export type PlaceShipInput  = z.infer<typeof PlaceShipSchema>

