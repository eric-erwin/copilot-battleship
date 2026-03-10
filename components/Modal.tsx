'use client'

import { useEffect, useRef } from 'react'

export interface ModalProps {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  children: React.ReactNode
}

export default function Modal({ open, title, description, onClose, children }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  // Focus trap — move focus into dialog when opened
  useEffect(() => {
    if (open) {
      const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      firstFocusable?.focus()
    }
  }, [open])

  // Close on Escape key
  useEffect(() => {
    if (!open) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      aria-hidden="true"
      onClick={onClose}
    >
      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby={description ? 'modal-description' : undefined}
        className="relative bg-white dark:bg-slate-900 rounded-xl shadow-xl p-6 w-full max-w-md mx-4 focus:outline-none"
        onClick={e => e.stopPropagation()}
        tabIndex={-1}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
        >
          ✕
        </button>

        <h2
          id="modal-title"
          className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-1"
        >
          {title}
        </h2>

        {description && (
          <p
            id="modal-description"
            className="text-sm text-slate-500 dark:text-slate-400 mb-4"
          >
            {description}
          </p>
        )}

        {children}
      </div>
    </div>
  )
}

