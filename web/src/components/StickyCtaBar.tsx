import type { ReactNode } from 'react'

export function StickyCtaBar({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-outline-variant/20 bg-background/95 px-margin-mobile pt-3 pb-safe backdrop-blur-md md:px-8">
      <div className="mx-auto w-full max-w-3xl">{children}</div>
    </div>
  )
}
