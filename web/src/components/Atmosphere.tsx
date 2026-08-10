import type { ReactNode } from 'react'

/** Soft teal atmosphere used on Landing — reuse on Auth / Join. */
export function Atmosphere({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-20 h-72 w-72 rounded-full bg-primary-container/25 blur-3xl" />
        <div className="absolute -right-16 top-1/3 h-64 w-64 rounded-full bg-primary-fixed/40 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-secondary-container/20 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(22,105,101,0.12) 1px, transparent 0)',
            backgroundSize: '22px 22px',
          }}
        />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  )
}
