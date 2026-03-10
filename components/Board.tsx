'use client'

import { useRef, useCallback } from 'react'
import type { Cell as CellType } from '@/lib/types'
import Cell from '@/components/Cell'

export interface BoardProps {
  size: number
  cells: CellType[][]
  interactive?: boolean
  fogOfWar?: boolean
  /** 'place' = ship placement phase, 'play' = firing phase */
  mode?: 'place' | 'play'
  label?: string
  onCellClick?: (x: number, y: number) => void
}

export default function Board({
  size,
  cells,
  interactive = false,
  fogOfWar    = false,
  mode        = 'play',
  label,
  onCellClick,
}: BoardProps) {
  const gridRef = useRef<HTMLDivElement>(null)

  // Arrow-key navigation across grid cells
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!interactive) return
    const focused = document.activeElement as HTMLElement
    const allCells = Array.from(gridRef.current?.querySelectorAll<HTMLElement>('[role="gridcell"]') ?? [])
    const idx = allCells.indexOf(focused)
    if (idx === -1) return

    let next = -1
    if (e.key === 'ArrowRight') next = idx + 1
    if (e.key === 'ArrowLeft')  next = idx - 1
    if (e.key === 'ArrowDown')  next = idx + size
    if (e.key === 'ArrowUp')    next = idx - size

    if (next >= 0 && next < allCells.length) {
      e.preventDefault()
      allCells[next].focus()
    }
  }, [interactive, size])

  const ariaLabel = label ?? (fogOfWar ? "Opponent's board" : 'Your board')
  const ariaDesc  = mode === 'place'
    ? 'Place ship: Select cells on your board to place this ship.'
    : 'Fire shot: Click a cell on the opponent\'s board to fire.'

  return (
    <div
      ref={gridRef}
      role="grid"
      aria-label={ariaLabel}
      aria-description={interactive ? ariaDesc : undefined}
      aria-colcount={size}
      aria-rowcount={size}
      className="inline-grid border border-slate-300 dark:border-slate-600 rounded"
      style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
      onKeyDown={handleKeyDown}
    >
      {cells.flat().map(cell => (
        <Cell
          key={`${cell.x}-${cell.y}`}
          cell={cell}
          fogOfWar={fogOfWar}
          interactive={interactive}
          onClick={onCellClick}
        />
      ))}
    </div>
  )
}
