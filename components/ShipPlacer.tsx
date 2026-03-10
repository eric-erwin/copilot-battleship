'use client'

import { useState, useCallback } from 'react'
import type { Cell as CellType, Orientation } from '@/lib/types'

const SHIP_DEFINITIONS = [
  { type: 'Carrier',    size: 5 },
  { type: 'Battleship', size: 4 },
  { type: 'Cruiser',    size: 3 },
  { type: 'Submarine',  size: 3 },
  { type: 'Destroyer',  size: 2 },
]

interface Props {
  boardSize: number
  cells: CellType[][]
  placedTypes: string[]
  onPlace: (shipType: string, x: number, y: number, orientation: Orientation) => Promise<void>
}

export default function ShipPlacer({ boardSize, cells, placedTypes, onPlace }: Props) {
  const [selectedShip, setSelectedShip]       = useState<string | null>(null)
  const [orientation, setOrientation]         = useState<Orientation>('horizontal')
  const [hoverCells, setHoverCells]           = useState<Set<string>>(new Set())
  const [hoverValid, setHoverValid]           = useState(true)
  const [placing, setPlacing]                 = useState(false)

  const remaining = SHIP_DEFINITIONS.filter(d => !placedTypes.includes(d.type))

  const getShipCells = useCallback((shipType: string, x: number, y: number, o: Orientation) => {
    const def = SHIP_DEFINITIONS.find(d => d.type === shipType)
    if (!def) return []
    return Array.from({ length: def.size }, (_, i) => ({
      x: o === 'horizontal' ? x + i : x,
      y: o === 'vertical'   ? y + i : y,
    }))
  }, [])

  const isValid = useCallback((shipType: string, x: number, y: number, o: Orientation) => {
    const shipCells = getShipCells(shipType, x, y, o)
    return shipCells.every(c =>
      c.x >= 0 && c.x < boardSize &&
      c.y >= 0 && c.y < boardSize &&
      cells[c.y]?.[c.x]?.status === 'empty'
    )
  }, [boardSize, cells, getShipCells])

  function handleMouseEnter(x: number, y: number) {
    if (!selectedShip) return
    const shipCells = getShipCells(selectedShip, x, y, orientation)
    setHoverCells(new Set(shipCells.map(c => `${c.x},${c.y}`)))
    setHoverValid(isValid(selectedShip, x, y, orientation))
  }

  function handleMouseLeave() {
    setHoverCells(new Set())
    setHoverValid(true)
  }

  async function handleCellClick(x: number, y: number) {
    if (!selectedShip || placing) return
    if (!isValid(selectedShip, x, y, orientation)) return
    setPlacing(true)
    try {
      await onPlace(selectedShip, x, y, orientation)
      // Auto-advance to next unplaced ship
      const next = SHIP_DEFINITIONS.find(d => !placedTypes.includes(d.type) && d.type !== selectedShip)
      setSelectedShip(next?.type ?? null)
    } finally {
      setPlacing(false)
      setHoverCells(new Set())
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Ship selector */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
          Select a ship to place:
        </p>
        <div className="flex flex-wrap gap-2">
          {SHIP_DEFINITIONS.map(def => {
            const placed = placedTypes.includes(def.type)
            const active = selectedShip === def.type
            return (
              <button
                key={def.type}
                disabled={placed || placing}
                onClick={() => setSelectedShip(def.type)}
                aria-pressed={active}
                aria-label={`${def.type}, size ${def.size}${placed ? ', placed' : ''}`}
                className={[
                  'px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500',
                  placed
                    ? 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900 dark:text-green-300 cursor-default'
                    : active
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600',
                ].join(' ')}
              >
                {placed ? '✓ ' : ''}{def.type} ({def.size})
              </button>
            )
          })}
        </div>
      </div>

      {/* Orientation toggle */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-500">Orientation:</span>
        <button
          onClick={() => setOrientation(o => o === 'horizontal' ? 'vertical' : 'horizontal')}
          aria-label={`Switch to ${orientation === 'horizontal' ? 'vertical' : 'horizontal'}`}
          className="px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-600 text-sm font-medium bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
        >
          {orientation === 'horizontal' ? '→ Horizontal' : '↓ Vertical'}
        </button>
        <span className="text-xs text-slate-400">(or press R to rotate)</span>
      </div>

      {/* Instruction copy */}
      <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium min-h-[1.25rem]">
        {selectedShip
          ? `Place ship: Click a cell on your board to place ${selectedShip}.`
          : remaining.length === 0
          ? '✓ All ships placed! Waiting for opponent…'
          : 'Select a ship above to begin placing.'}
      </p>

      {/* Board with hover preview */}
      <div
        role="grid"
        aria-label="Your board — place ships"
        aria-colcount={boardSize}
        aria-rowcount={boardSize}
        className="inline-grid border border-slate-300 dark:border-slate-600 rounded"
        style={{ gridTemplateColumns: `repeat(${boardSize}, 1fr)` }}
        onMouseLeave={handleMouseLeave}
        onKeyDown={e => {
          if (e.key === 'r' || e.key === 'R') setOrientation(o => o === 'horizontal' ? 'vertical' : 'horizontal')
        }}
        tabIndex={0}
      >
        {cells.flat().map(cell => {
          const key      = `${cell.x},${cell.y}`
          const isHover  = hoverCells.has(key)
          const isPlaced = cell.status === 'ship'

          let bg = 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700'
          if (isPlaced)              bg = 'bg-slate-400 dark:bg-slate-500'
          else if (isHover && hoverValid)  bg = 'bg-indigo-300 dark:bg-indigo-700'
          else if (isHover && !hoverValid) bg = 'bg-red-300 dark:bg-red-700'

          return (
            <div
              key={key}
              role="gridcell"
              aria-label={`Row ${cell.y + 1}, Column ${cell.x + 1}${isPlaced ? ' — ship' : ''}`}
              tabIndex={selectedShip && !isPlaced ? 0 : -1}
              className={`w-8 h-8 sm:w-10 sm:h-10 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 ${bg}`}
              onMouseEnter={() => handleMouseEnter(cell.x, cell.y)}
              onClick={() => handleCellClick(cell.x, cell.y)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleCellClick(cell.x, cell.y)
                }
              }}
            >
              {isPlaced ? '🚢' : ''}
            </div>
          )
        })}
      </div>
    </div>
  )
}

