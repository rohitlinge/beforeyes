import type { ReactNode } from 'react'
import { SessionExitButton } from '@/components/SessionExitButton'
import type { Room } from '@/features/lobby/types'

type AppHeaderProps = {
  room?: Room | null
  uid?: string
  showExit?: boolean
  trailing?: ReactNode
  sticky?: boolean
  transparent?: boolean
}

export function AppHeader({
  room,
  uid,
  showExit = true,
  trailing,
  sticky = true,
  transparent = false,
}: AppHeaderProps) {
  return (
    <header
      className={`${sticky ? 'sticky top-0' : 'relative'} z-40 w-full ${
        transparent
          ? 'bg-background/80 backdrop-blur-md'
          : 'border-b border-outline-variant/20 bg-background/95 backdrop-blur-sm'
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-margin-mobile py-3.5 md:px-8">
        <p className="font-headline text-base font-semibold tracking-tight text-primary sm:text-lg">
          The Pre-Commitment Game
        </p>
        {trailing ??
          (showExit ? (
            <SessionExitButton
              room={room}
              uid={uid}
              label="Exit Session"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-outline-variant/60 px-4 py-2 font-label text-sm font-semibold text-on-surface-variant transition-colors hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            />
          ) : null)}
      </div>
    </header>
  )
}
