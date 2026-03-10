/**
 * lib/ai.ts — Hunt & Target AI Player
 *
 * Strategy:
 *  Hunt   — pick a random untried cell until a hit occurs.
 *  Target — after a hit, probe right → left → down → up until the ship is sunk.
 *
 * Supports an optional `seed` for deterministic test runs.
 * No external dependencies. Safe for in-memory per-game storage.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

type Direction = 'right' | 'left' | 'down' | 'up'

export type AIResult = 'miss' | 'hit' | 'sunk'

export interface AILastResult {
  x: number
  y: number
  result: AIResult
}

export interface AIMoveState {
  visited: Set<string>
  lastResult?: AILastResult
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DIRECTIONS: Direction[] = ['right', 'left', 'down', 'up']

function delta(dir: Direction): { dx: number; dy: number } {
  switch (dir) {
    case 'right': return { dx:  1, dy:  0 }
    case 'left':  return { dx: -1, dy:  0 }
    case 'down':  return { dx:  0, dy:  1 }
    case 'up':    return { dx:  0, dy: -1 }
  }
}

/** Linear Congruential Generator — deterministic when seeded */
function makePrng(seed?: number) {
  let s = seed !== undefined ? seed : Math.floor(Math.random() * 2 ** 31)
  return (): number => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

function cellKey(x: number, y: number): string {
  return `${x},${y}`
}

// ─── AIPlayer ─────────────────────────────────────────────────────────────────

export class AIPlayer {
  private boardSize: number
  private rand: () => number

  /** Cells already attacked */
  private visited = new Set<string>()
  /** First hit cell of the current target sequence */
  private origin: { x: number; y: number } | null = null
  /** Last cell tried in the current direction */
  private last: { x: number; y: number } | null = null
  /** Index into DIRECTIONS for the current target attempt */
  private dirIndex = 0

  constructor(opts?: { boardSize?: number; seed?: number }) {
    this.boardSize = opts?.boardSize ?? 10
    this.rand      = makePrng(opts?.seed)
  }

  /**
   * Call after every shot resolves to update AI internal state.
   * Also accepts the AIMoveState shape for external callers.
   */
  recordResult(x: number, y: number, result: AIResult): void {
    this.visited.add(cellKey(x, y))

    if (result === 'hit') {
      if (!this.origin) {
        // First hit — enter target mode
        this.origin   = { x, y }
        this.last     = { x, y }
        this.dirIndex = 0
      } else {
        // Consecutive hit — continue in same direction
        this.last = { x, y }
      }
    }

    if (result === 'miss' && this.origin) {
      // Direction exhausted — advance to next direction from origin
      this.dirIndex++
      this.last = this.origin
    }

    if (result === 'sunk') {
      // Ship destroyed — reset to hunt mode
      this.origin   = null
      this.last     = null
      this.dirIndex = 0
    }
  }

  /**
   * Returns the next { x, y } to attack.
   * Accepts an optional AIMoveState — if provided, syncs visited set and
   * applies lastResult before computing the next move.
   * Never returns an already-tried cell.
   */
  nextMove(state?: AIMoveState): { x: number; y: number } {
    // Sync external visited set if provided
    if (state) {
      for (const key of state.visited) this.visited.add(key)
      if (state.lastResult) {
        const { x, y, result } = state.lastResult
        // Only record if not already recorded
        if (!this.visited.has(cellKey(x, y))) {
          this.recordResult(x, y, result)
        }
      }
    }

    // ── Target mode ──────────────────────────────────────────────────────────
    if (this.origin && this.dirIndex < DIRECTIONS.length) {
      const dir  = DIRECTIONS[this.dirIndex]
      const { dx, dy } = delta(dir)
      const base = this.last ?? this.origin
      const nx   = base.x + dx
      const ny   = base.y + dy
      const key  = cellKey(nx, ny)

      if (
        nx >= 0 && nx < this.boardSize &&
        ny >= 0 && ny < this.boardSize &&
        !this.visited.has(key)
      ) {
        return { x: nx, y: ny }
      }

      // Direction is blocked or out-of-bounds — try next direction from origin
      this.dirIndex++
      this.last = this.origin
      return this.nextMove()
    }

    // ── Hunt mode (random) ────────────────────────────────────────────────────
    const remaining: Array<{ x: number; y: number }> = []
    for (let y = 0; y < this.boardSize; y++) {
      for (let x = 0; x < this.boardSize; x++) {
        if (!this.visited.has(cellKey(x, y))) remaining.push({ x, y })
      }
    }

    if (remaining.length === 0) throw new Error('AIPlayer: no remaining cells to attack')

    const idx = Math.floor(this.rand() * remaining.length)
    return remaining[idx]
  }

  /** Snapshot internal state as a plain object (useful for serializing per-game AI state) */
  toJSON() {
    return {
      boardSize: this.boardSize,
      visited:   Array.from(this.visited),
      origin:    this.origin,
      last:      this.last,
      dirIndex:  this.dirIndex,
    }
  }

  /** Restore AI from a plain snapshot (e.g. after deserializing from game store) */
  static fromJSON(snapshot: ReturnType<AIPlayer['toJSON']>, seed?: number): AIPlayer {
    const ai     = new AIPlayer({ boardSize: snapshot.boardSize, seed })
    ai.visited   = new Set(snapshot.visited)
    ai.origin    = snapshot.origin
    ai.last      = snapshot.last
    ai.dirIndex  = snapshot.dirIndex
    return ai
  }
}
