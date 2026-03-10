// ─── Core domain types ────────────────────────────────────────────────────────
// Copy this file into lib/types.ts as the single source-of-truth for both
// client and server. Do not add persistence logic here.

export type CellStatus = 'empty' | 'ship' | 'hit' | 'miss' | 'sunk'
export type GameState  = 'waiting' | 'placing' | 'playing' | 'ended'
export type Orientation = 'horizontal' | 'vertical'
export type ShotResult  = 'miss' | 'hit' | 'sunk'

export interface Cell {
  x: number
  y: number
  status: CellStatus
}

export interface Ship {
  id: string
  type: string
  size: number
  orientation: Orientation
  /** top-left origin */
  x: number
  y: number
  hits: number
}

export interface Board {
  size: number
  cells: Cell[][]
  ships: Ship[]
}

export interface Player {
  id: string
  name: string
  ready: boolean
  board: Board
}

export interface Shot {
  playerId: string
  x: number
  y: number
  result: ShotResult
  timestamp: number
}

export interface Game {
  id: string
  state: GameState
  players: Player[]
  shots: Shot[]
  turnPlayerId: string | null
  winnerId: string | null
  boardSize: number
  createdAt: number
  updatedAt: number
}

// ─── API shapes ──────────────────────────────────────────────────────────────

export interface CreateGameRequest  { playerName: string; boardSize?: number }
export interface CreateGameResponse { gameId: string; playerId: string }

export interface JoinGameRequest    { playerName: string }
export interface JoinGameResponse   { playerId: string }

export interface ShotRequest        { playerId: string; x: number; y: number }
export interface ShotResponse {
  result: ShotResult
  x: number
  y: number
  sunkShip?: Ship
  nextTurnPlayerId: string | null
  winnerId?: string
}

