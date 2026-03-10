import { v4 as uuid } from 'uuid'
import type { Game, Player, Board, Ship, Cell, Shot, ShotResult, Orientation } from '@/lib/types'
import { getGame, setGame } from '@/lib/gameStore'
import { AIPlayer } from '@/lib/ai'

// ─── Global AI player registry (survives HMR like the game store) ─────────────
declare global {
  // eslint-disable-next-line no-var
  var __aiPlayers: Map<string, AIPlayer> | undefined
}
const aiPlayers: Map<string, AIPlayer> =
  globalThis.__aiPlayers ?? new Map<string, AIPlayer>()
if (!globalThis.__aiPlayers) globalThis.__aiPlayers = aiPlayers

export const AI_PLAYER_NAME = 'CPU'

export const SHIP_DEFINITIONS = [
  { type: 'Carrier',    size: 5 },
  { type: 'Battleship', size: 4 },
  { type: 'Cruiser',    size: 3 },
  { type: 'Submarine',  size: 3 },
  { type: 'Destroyer',  size: 2 },
]

// ─── Board helpers ────────────────────────────────────────────────────────────

function makeBoard(size: number): Board {
  const cells: Cell[][] = Array.from({ length: size }, (_, y) =>
    Array.from({ length: size }, (_, x) => ({ x, y, status: 'empty' as const }))
  )
  return { size, cells, ships: [] }
}

/** Place a ship directly onto a board (no game-state checks — used for AI setup) */
function placeShipOnBoard(
  board: Board,
  shipType: string,
  size: number,
  x: number,
  y: number,
  orientation: Orientation
): void {
  const ship: Ship = { id: uuid(), type: shipType, size, orientation, x, y, hits: 0 }
  for (let i = 0; i < size; i++) {
    const cx = orientation === 'horizontal' ? x + i : x
    const cy = orientation === 'vertical'   ? y + i : y
    board.cells[cy][cx].status = 'ship'
  }
  board.ships.push(ship)
}

/** Randomly place all ships on a board — used to set up the AI's fleet */
function randomlyPlaceAllShips(board: Board): void {
  for (const def of SHIP_DEFINITIONS) {
    let placed = false
    let attempts = 0
    while (!placed && attempts < 1000) {
      attempts++
      const orientation: Orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical'
      const maxX = orientation === 'horizontal' ? board.size - def.size : board.size - 1
      const maxY = orientation === 'vertical'   ? board.size - def.size : board.size - 1
      const x    = Math.floor(Math.random() * (maxX + 1))
      const y    = Math.floor(Math.random() * (maxY + 1))

      // Check all cells are empty
      const cells: Array<{ x: number; y: number }> = Array.from({ length: def.size }, (_, i) => ({
        x: orientation === 'horizontal' ? x + i : x,
        y: orientation === 'vertical'   ? y + i : y,
      }))
      const valid = cells.every(c => board.cells[c.y]?.[c.x]?.status === 'empty')
      if (valid) {
        placeShipOnBoard(board, def.type, def.size, x, y, orientation)
        placed = true
      }
    }
  }
}

// ─── Game lifecycle ───────────────────────────────────────────────────────────

export function createGame(playerName: string, boardSize = 10): { game: Game; playerId: string } {
  const humanPlayer: Player = {
    id:    uuid(),
    name:  playerName,
    ready: false,
    board: makeBoard(boardSize),
  }

  // AI player — place ships randomly and mark ready immediately
  const aiBoard = makeBoard(boardSize)
  randomlyPlaceAllShips(aiBoard)
  const aiPlayer: Player = {
    id:    uuid(),
    name:  AI_PLAYER_NAME,
    ready: true,
    board: aiBoard,
  }

  const game: Game = {
    id:           uuid(),
    state:        'placing',   // human still needs to place ships
    players:      [humanPlayer, aiPlayer],
    shots:        [],
    turnPlayerId: null,
    winnerId:     null,
    boardSize,
    createdAt:    Date.now(),
    updatedAt:    Date.now(),
  }

  // Register AI instance for this game
  aiPlayers.set(game.id, new AIPlayer({ boardSize }))

  setGame(game)
  return { game, playerId: humanPlayer.id }
}

export function getAIPlayerId(gameId: string): string | null {
  const game = getGame(gameId)
  if (!game) return null
  return game.players.find(p => p.name === AI_PLAYER_NAME)?.id ?? null
}

// ─── Ship placement (human only) ─────────────────────────────────────────────

export function placeShip(
  gameId: string,
  playerId: string,
  shipType: string,
  x: number,
  y: number,
  orientation: Orientation
): Game {
  const game = getGame(gameId)
  if (!game)   throw new Error('Game not found')

  const player = game.players.find(p => p.id === playerId)
  if (!player) throw new Error('Player not found')

  const def = SHIP_DEFINITIONS.find(d => d.type === shipType)
  if (!def)    throw new Error('Unknown ship type')

  const { size } = def
  const board    = player.board

  if (orientation === 'horizontal' && x + size > board.size) throw new Error('Ship out of bounds')
  if (orientation === 'vertical'   && y + size > board.size) throw new Error('Ship out of bounds')

  for (let i = 0; i < size; i++) {
    const cx = orientation === 'horizontal' ? x + i : x
    const cy = orientation === 'vertical'   ? y + i : y
    if (board.cells[cy][cx].status !== 'empty') throw new Error('Overlap detected')
  }

  placeShipOnBoard(board, shipType, size, x, y, orientation)

  // Human is ready when all ships placed
  if (board.ships.length === SHIP_DEFINITIONS.length) player.ready = true

  // Start game when human is ready (AI is always ready)
  if (game.players.every(p => p.ready)) {
    game.state        = 'playing'
    game.turnPlayerId = humanPlayer(game).id  // human goes first
  }

  game.updatedAt = Date.now()
  setGame(game)
  return game
}

function humanPlayer(game: Game): Player {
  return game.players.find(p => p.name !== AI_PLAYER_NAME)!
}

// ─── Shot logic ───────────────────────────────────────────────────────────────

export function applyShot(
  gameId: string,
  playerId: string,
  x: number,
  y: number
): { game: Game; result: ShotResult; sunkShip?: Ship } {
  const game = getGame(gameId)
  if (!game)                          throw new Error('Game not found')
  if (game.state !== 'playing')       throw new Error('Game not in playing state')
  if (game.turnPlayerId !== playerId) throw new Error('Not your turn')

  const opponent = game.players.find(p => p.id !== playerId)
  if (!opponent) throw new Error('Opponent not found')

  const shotResult = resolveShot(game, playerId, opponent, x, y)

  // If game still going and next turn is AI — fire AI shot immediately
  if (game.state === 'playing' && game.turnPlayerId === getAIPlayerId(gameId)) {
    fireAIShot(gameId)
  }

  return shotResult
}

/** Fire one AI shot and resolve it against the human's board */
function fireAIShot(gameId: string): void {
  const game = getGame(gameId)
  if (!game || game.state !== 'playing') return

  const ai       = aiPlayers.get(gameId)
  const aiId     = getAIPlayerId(gameId)
  const human    = humanPlayer(game)
  if (!ai || !aiId) return

  const { x, y } = ai.nextMove()
  resolveShot(game, aiId, human, x, y)
  ai.recordResult(x, y, game.shots[game.shots.length - 1].result)
}

/** Shared shot resolution — mutates game in place, saves to store */
function resolveShot(
  game: Game,
  shooterId: string,
  target: Player,
  x: number,
  y: number
): { game: Game; result: ShotResult; sunkShip?: Ship } {
  const cell = target.board.cells[y]?.[x]
  if (!cell) throw new Error('Cell out of bounds')
  if (cell.status === 'hit' || cell.status === 'miss' || cell.status === 'sunk')
    throw new Error('Cell already targeted')

  let result: ShotResult = 'miss'
  let sunkShip: Ship | undefined

  if (cell.status === 'ship') {
    cell.status = 'hit'
    result      = 'hit'
    const ship  = target.board.ships.find(s => isShipAtCell(s, x, y))
    if (ship) {
      ship.hits++
      if (ship.hits >= ship.size) {
        result   = 'sunk'
        sunkShip = ship
        for (let i = 0; i < ship.size; i++) {
          const cx = ship.orientation === 'horizontal' ? ship.x + i : ship.x
          const cy = ship.orientation === 'vertical'   ? ship.y + i : ship.y
          target.board.cells[cy][cx].status = 'sunk'
        }
      }
    }
  } else {
    cell.status = 'miss'
  }

  const shot: Shot = { playerId: shooterId, x, y, result, timestamp: Date.now() }
  game.shots.push(shot)

  const allSunk = target.board.ships.every(s => s.hits >= s.size)
  if (allSunk) {
    game.state        = 'ended'
    game.winnerId     = shooterId
    game.turnPlayerId = null
  } else {
    game.turnPlayerId = target.id
  }

  game.updatedAt = Date.now()
  setGame(game)
  return { game, result, sunkShip }
}

export function checkSunk(ship: Ship): boolean {
  return ship.hits >= ship.size
}

export function isShipAtCell(ship: Ship, x: number, y: number): boolean {
  for (let i = 0; i < ship.size; i++) {
    const cx = ship.orientation === 'horizontal' ? ship.x + i : ship.x
    const cy = ship.orientation === 'vertical'   ? ship.y + i : ship.y
    if (cx === x && cy === y) return true
  }
  return false
}
