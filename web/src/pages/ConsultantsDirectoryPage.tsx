import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Atmosphere } from '@/components/Atmosphere'
import { BrandMark } from '@/components/BrandMark'
import { InlineError } from '@/components/InlineError'
import { PageLoader } from '@/components/PageLoader'
import { SiteFooter } from '@/components/SiteFooter'
import { listApprovedConsultants } from '@/features/consultants/api'
import type { ConsultantProfile } from '@/features/consultants/types'

export function ConsultantsDirectoryPage() {
  const [items, setItems] = useState<ConsultantProfile[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void listApprovedConsultants()
      .then((list) => {
        if (!cancelled) setItems(list)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Could not load relationship therapists.',
          )
          setItems([])
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (items === null) {
    return <PageLoader message="Loading relationship therapists…" />
  }

  return (
    <Atmosphere>
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-margin-mobile py-10 md:px-8">
        <BrandMark to="/" size="sm" />
        <h1 className="mt-8 font-display text-3xl font-bold tracking-tight text-on-surface sm:text-4xl">
          Relationship therapists
        </h1>
        <p className="mt-3 max-w-xl leading-relaxed text-on-surface-variant">
          Verified therapists who help serious couples prepare for commitment.
          Only admin-approved profiles are listed here.
        </p>
        <Link
          to="/consultants/register"
          className="mt-6 inline-flex w-fit min-h-11 items-center justify-center rounded-full border border-outline-variant px-5 font-label text-sm font-semibold text-on-surface hover:bg-surface-container"
        >
          Register as a relationship therapist
        </Link>

        {error ? (
          <div className="mt-8">
            <InlineError message={error} />
          </div>
        ) : items.length === 0 ? (
          <p className="mt-10 text-on-surface-variant">
            No approved relationship therapists yet. Check back soon.
          </p>
        ) : (
          <ul className="mt-10 flex flex-col gap-4">
            {items.map((c) => (
              <li key={c.id}>
                <Link
                  to={`/consultants/${c.slug}`}
                  className="block rounded-[24px] border border-outline-variant/30 bg-surface/80 px-5 py-5 transition-colors hover:border-primary/30 hover:bg-surface-container-low"
                >
                  <p className="font-headline text-lg font-semibold text-on-surface">
                    {c.fullName}
                  </p>
                  <p className="mt-1 text-sm text-primary">{c.title}</p>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    {[c.city, c.region, c.country].filter(Boolean).join(', ')}
                  </p>
                  {c.specialties.length > 0 && (
                    <p className="mt-2 text-xs text-on-surface-variant">
                      {c.specialties.slice(0, 4).join(' · ')}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto pt-16">
          <SiteFooter />
        </div>
      </div>
    </Atmosphere>
  )
}
