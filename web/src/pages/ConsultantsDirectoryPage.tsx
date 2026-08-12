import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Atmosphere } from '@/components/Atmosphere'
import { BrandMark } from '@/components/BrandMark'
import { InlineError } from '@/components/InlineError'
import { PageLoader } from '@/components/PageLoader'
import { SiteFooter } from '@/components/SiteFooter'
import { listApprovedConsultants } from '@/features/consultants/api'
import {
  THERAPISTS_PATH,
  THERAPISTS_REGISTER_PATH,
  therapistProfilePath,
} from '@/features/consultants/paths'
import type { ConsultantProfile } from '@/features/consultants/types'
import { setJsonLd, siteUrl } from '@/lib/seoJsonLd'

const FAQ = [
  {
    q: 'Who are the relationship therapists listed on BeforeYes?',
    a: 'Only admin-approved professionals. We review each application and require a Google Business Profile before a public listing goes live.',
  },
  {
    q: 'Are these therapists for dating or for serious commitment?',
    a: 'BeforeYes is built for serious couples preparing for commitment or marriage—not a dating marketplace. Therapists here focus on pre-marital clarity, communication, and alignment.',
  },
  {
    q: 'How do I become a listed relationship therapist?',
    a: 'Apply through our registration form with your credentials and Google Business Profile link. After review, your profile can appear in this directory.',
  },
] as const

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

  useEffect(() => {
    const pageUrl = siteUrl(THERAPISTS_PATH)
    const breadcrumb = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: siteUrl('/'),
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Relationship therapists',
          item: pageUrl,
        },
      ],
    }

    const collection: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Verified Relationship Therapists for Serious Couples',
      description:
        'Directory of admin-verified relationship therapists and pre-marital counselors on BeforeYes.',
      url: pageUrl,
      isPartOf: { '@type': 'WebSite', name: 'BeforeYes', url: siteUrl('/') },
    }

    if (items && items.length > 0) {
      collection.mainEntity = {
        '@type': 'ItemList',
        numberOfItems: items.length,
        itemListElement: items.slice(0, 50).map((c, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: siteUrl(therapistProfilePath(c.slug)),
          name: c.fullName,
        })),
      }
    }

    const faq = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    }

    setJsonLd('therapists-directory-breadcrumb', breadcrumb)
    setJsonLd('therapists-directory-collection', collection)
    setJsonLd('therapists-directory-faq', faq)

    return () => {
      setJsonLd('therapists-directory-breadcrumb', null)
      setJsonLd('therapists-directory-collection', null)
      setJsonLd('therapists-directory-faq', null)
    }
  }, [items])

  if (items === null) {
    return <PageLoader message="Loading relationship therapists…" />
  }

  return (
    <Atmosphere>
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-margin-mobile py-10 md:px-8">
        <BrandMark to="/" size="sm" />

        <nav aria-label="Breadcrumb" className="mt-6 text-sm text-on-surface-variant">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link to="/" className="font-semibold text-primary">
                Home
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="text-on-surface">Relationship therapists</li>
          </ol>
        </nav>

        <header className="mt-6">
          <h1 className="font-display text-3xl font-bold tracking-tight text-on-surface sm:text-4xl">
            Find verified relationship therapists for serious couples
          </h1>
          <p className="mt-4 max-w-2xl leading-relaxed text-on-surface-variant">
            Browse admin-approved relationship therapists and pre-marital counselors
            who help couples prepare for commitment—with clear specialties, locations,
            and Google Business verification.
          </p>
        </header>

        <Link
          to={THERAPISTS_REGISTER_PATH}
          className="mt-6 inline-flex w-fit min-h-11 items-center justify-center rounded-full border border-outline-variant px-5 font-label text-sm font-semibold text-on-surface hover:bg-surface-container"
        >
          Register as a relationship therapist
        </Link>

        {error ? (
          <div className="mt-8">
            <InlineError message={error} />
          </div>
        ) : items.length === 0 ? (
          <section className="mt-10 rounded-[24px] border border-outline-variant/30 bg-surface/70 px-5 py-6">
            <h2 className="font-headline text-lg font-semibold text-on-surface">
              Directory launching with verified listings
            </h2>
            <p className="mt-2 leading-relaxed text-on-surface-variant">
              Approved therapist profiles will appear here. If you are a licensed or
              experienced relationship therapist,{' '}
              <Link
                to={THERAPISTS_REGISTER_PATH}
                className="font-semibold text-primary"
              >
                apply to list your practice
              </Link>
              .
            </p>
          </section>
        ) : (
          <section className="mt-10" aria-labelledby="therapist-list-heading">
            <h2
              id="therapist-list-heading"
              className="font-headline text-lg font-semibold text-on-surface"
            >
              Verified therapists ({items.length})
            </h2>
            <ul className="mt-4 flex flex-col gap-4">
              {items.map((c) => (
                <li key={c.id}>
                  <Link
                    to={therapistProfilePath(c.slug)}
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
          </section>
        )}

        <section className="mt-12" aria-labelledby="why-heading">
          <h2
            id="why-heading"
            className="font-headline text-xl font-semibold text-on-surface"
          >
            Why couples look for a therapist before saying yes
          </h2>
          <p className="mt-3 leading-relaxed text-on-surface-variant">
            Hard questions about values, money, family, and expectations are easier
            with a trusted guide. BeforeYes pairs private couple conversations with a
            directory of therapists focused on pre-commitment clarity—not casual dating.
          </p>
        </section>

        <section className="mt-10" aria-labelledby="faq-heading">
          <h2
            id="faq-heading"
            className="font-headline text-xl font-semibold text-on-surface"
          >
            Frequently asked questions
          </h2>
          <dl className="mt-4 flex flex-col gap-4">
            {FAQ.map((item) => (
              <div
                key={item.q}
                className="rounded-[20px] border border-outline-variant/30 bg-surface/60 px-5 py-4"
              >
                <dt className="font-headline font-semibold text-on-surface">{item.q}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                  {item.a}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="mt-auto pt-16">
          <SiteFooter />
        </div>
      </div>
    </Atmosphere>
  )
}
