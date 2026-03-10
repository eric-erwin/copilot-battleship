'use client'

import type { Cell as CellType, CellStatus } from '@/lib/types'

export interface CellProps {
  cell: CellType
  fogOfWar?: boolean
  interactive?: boolean
  isFocused?: boolean
  onClick?: (x: number, y: number) => void
}

const STATUS_ICONS: Record<CellStatus | 'pending', string> = {
  hit:     '💥',
  sunk:    '☠️',
  miss:    '·',
  ship:    '',
  empty:   '',
  pending: '…',
}

const CLASS_MAP: Record<string, string> = {
  empty:   'cell-empty',
  ship:    'cell-ship',
  hit:     'cell-hit',
  miss:    'cell-miss',
  sunk:    'cell-sunk',
  pending: 'cell-pending',
}

export default function Cell({
  cell,
  fogOfWar    = false,
  interactive = false,
  isFocused,
  onClick,
}: CellProps) {
  const { x, y, status } = cell

  // Hide ships from opponent board (fog-of-war)
  const displayStatus: string = fogOfWar && status === 'ship' ? 'empty' : status

  const isActionable = interactive && displayStatus === 'empty'

  function handleKey(e: React.KeyboardEvent) {
    if (isActionable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      onClick?.(x, y)
    }
  }

  return (
    <div
      role="gridcell"
      aria-label={`Row ${y + 1}, Column ${x + 1} — ${displayStatus}`}
      aria-selected={isActionable ? false : undefined}
      aria-disabled={interactive && !isActionable ? true : undefined}
      data-status={displayStatus}
      tabIndex={interactive ? 0 : -1}
      className={[
        'cell-base',
        CLASS_MAP[displayStatus] ?? 'cell-empty',
        isActionable ? 'cursor-pointer' : 'cursor-default',
        isFocused ? 'ring-2 ring-indigo-500 ring-offset-1' : '',
      ].join(' ')}
      onClick={() => isActionable && onClick?.(x, y)}
      onKeyDown={handleKey}
    >
      <span aria-hidden="true">
        {STATUS_ICONS[displayStatus as CellStatus | 'pending'] ?? ''}
      </span>
    </div>
  )
}
