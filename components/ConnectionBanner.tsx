'use client'

import type { WSStatus } from '@/hooks/useWebSocket'

interface Props {
  status: WSStatus
}

const CONFIG: Record<WSStatus, { show: boolean; text: string; classes: string }> = {
  connecting:   { show: true,  text: '⟳ Connecting…',         classes: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' },
  connected:    { show: false, text: '',                        classes: '' },
  disconnected: { show: true,  text: '⚠ Disconnected — reconnecting…', classes: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
  error:        { show: true,  text: '✕ Connection error — retrying…', classes: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
}

export default function ConnectionBanner({ status }: Props) {
  const cfg = CONFIG[status]
  if (!cfg.show) return null

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={cfg.text}
      className={`w-full text-center text-xs font-medium py-1.5 px-4 transition-all ${cfg.classes}`}
    >
      {cfg.text}
    </div>
  )
}

