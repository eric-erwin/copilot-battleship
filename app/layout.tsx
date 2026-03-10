import type { Metadata } from 'next'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'Copilot Battleship',
  description: 'A two-player Battleship game built with Next.js 15 + React 19',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 antialiased">
        {children}
      </body>
    </html>
  )
}

