import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Atmosphere } from '@/components/Atmosphere'
import { SiteFooter } from '@/components/SiteFooter'

type LegalDocLayoutProps = {
  title: string
  updated: string
  children: ReactNode
}

export function LegalDocLayout({
  title,
  updated,
  children,
}: LegalDocLayoutProps) {
  return (
    <Atmosphere>
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-margin-mobile py-10 md:px-8">
        <header className="mb-10">
          <Link
            to="/"
            className="font-headline text-lg font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            The Pre-Commitment Game
          </Link>
          <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-on-surface sm:text-4xl">
            {title}
          </h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            Last updated: {updated}
          </p>
        </header>
        <article className="prose-legal flex-1 space-y-6 pb-12 font-body text-base leading-relaxed text-on-surface-variant [&_h2]:font-headline [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-on-surface [&_h2]:tracking-tight [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
          {children}
        </article>
        <SiteFooter />
      </div>
    </Atmosphere>
  )
}
