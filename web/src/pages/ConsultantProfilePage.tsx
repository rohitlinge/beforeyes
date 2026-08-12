import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Atmosphere } from '@/components/Atmosphere'
import { BrandMark } from '@/components/BrandMark'
import { GateScreen } from '@/components/GateScreen'
import { PageLoader } from '@/components/PageLoader'
import { SiteFooter } from '@/components/SiteFooter'
import { getApprovedConsultantBySlug } from '@/features/consultants/api'
import type { ConsultantProfile } from '@/features/consultants/types'

const SITE_URL = (
  import.meta.env.VITE_SITE_URL?.trim() || 'https://www.beforeyes.online'
).replace(/\/$/, '')

function applyConsultantSeo(c: ConsultantProfile) {
  const title = c.seoTitle || `${c.fullName} | BeforeYes`
  const description =
    c.seoDescription || c.bio.slice(0, 155) || `${c.fullName} — relationship therapist`
  const keywords =
    c.seoKeywords ||
    [c.fullName, c.title, c.city, ...c.specialties, 'BeforeYes'].join(', ')
  const url = `${SITE_URL}/consultants/${c.slug}`

  document.title = title

  const setNamed = (name: string, content: string) => {
    let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null
    if (!el) {
      el = document.createElement('meta')
      el.setAttribute('name', name)
      document.head.appendChild(el)
    }
    el.setAttribute('content', content)
  }
  const setProp = (property: string, content: string) => {
    let el = document.querySelector(
      `meta[property="${property}"]`,
    ) as HTMLMetaElement | null
    if (!el) {
      el = document.createElement('meta')
      el.setAttribute('property', property)
      document.head.appendChild(el)
    }
    el.setAttribute('content', content)
  }

  setNamed('description', description)
  setNamed('keywords', keywords)
  setNamed('robots', 'index, follow')
  setProp('og:title', title)
  setProp('og:description', description)
  setProp('og:url', url)
  setProp('og:type', 'profile')

  let canonical = document.querySelector(
    'link[rel="canonical"]',
  ) as HTMLLinkElement | null
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.setAttribute('rel', 'canonical')
    document.head.appendChild(canonical)
  }
  canonical.setAttribute('href', url)

  const ldId = 'consultant-jsonld'
  document.getElementById(ldId)?.remove()
  const script = document.createElement('script')
  script.id = ldId
  script.type = 'application/ld+json'
  script.text = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: c.fullName,
    jobTitle: c.title,
    description: c.bio,
    url,
    email: c.email || undefined,
    telephone: c.phone || undefined,
    image: c.photoUrl || undefined,
    address: {
      '@type': 'PostalAddress',
      addressLocality: c.city || undefined,
      addressRegion: c.region || undefined,
      addressCountry: c.country || undefined,
    },
    knowsAbout: c.specialties,
  })
  document.head.appendChild(script)
}

export function ConsultantProfilePage() {
  const { slug } = useParams()
  const [profile, setProfile] = useState<ConsultantProfile | null | undefined>(
    undefined,
  )

  useEffect(() => {
    if (!slug) {
      setProfile(null)
      return
    }
    let cancelled = false
    void getApprovedConsultantBySlug(slug).then((p) => {
      if (!cancelled) setProfile(p)
    })
    return () => {
      cancelled = true
      document.getElementById('consultant-jsonld')?.remove()
    }
  }, [slug])

  useEffect(() => {
    if (profile) applyConsultantSeo(profile)
  }, [profile])

  if (profile === undefined) {
    return <PageLoader message="Loading profile…" />
  }

  if (!profile) {
    return (
      <GateScreen
        title="Profile not found"
        description="This relationship therapist profile is not published or does not exist."
        actionLabel="Browse relationship therapists"
        actionTo="/consultants"
      />
    )
  }

  return (
    <Atmosphere>
      <article className="mx-auto flex min-h-screen max-w-3xl flex-col px-margin-mobile py-10 md:px-8">
        <BrandMark to="/" size="sm" />

        <header className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-start">
          {profile.photoUrl ? (
            <img
              src={profile.photoUrl}
              alt=""
              className="h-24 w-24 rounded-full object-cover ring-2 ring-primary/20"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 font-display text-2xl font-bold text-primary">
              {profile.fullName.slice(0, 1)}
            </div>
          )}
          <div>
            <p className="font-label text-xs font-semibold uppercase tracking-wide text-primary">
              Verified relationship therapist
            </p>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-on-surface sm:text-4xl">
              {profile.fullName}
            </h1>
            <p className="mt-1 font-headline text-lg text-on-surface-variant">
              {profile.title}
            </p>
            <p className="mt-2 text-sm text-on-surface-variant">
              {[profile.city, profile.region, profile.country]
                .filter(Boolean)
                .join(', ')}
              {profile.yearsExperience > 0
                ? ` · ${profile.yearsExperience}+ years`
                : ''}
            </p>
          </div>
        </header>

        <section className="mt-8">
          <h2 className="font-headline text-lg font-semibold text-on-surface">
            About
          </h2>
          <p className="mt-2 whitespace-pre-wrap leading-relaxed text-on-surface-variant">
            {profile.bio}
          </p>
        </section>

        {profile.specialties.length > 0 && (
          <section className="mt-8">
            <h2 className="font-headline text-lg font-semibold text-on-surface">
              Specialties
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {profile.specialties.map((s) => (
                <li
                  key={s}
                  className="rounded-full bg-primary/10 px-3 py-1.5 font-label text-xs font-semibold text-primary"
                >
                  {s}
                </li>
              ))}
            </ul>
          </section>
        )}

        {profile.languages.length > 0 && (
          <section className="mt-6">
            <h2 className="font-headline text-lg font-semibold text-on-surface">
              Languages
            </h2>
            <p className="mt-2 text-on-surface-variant">
              {profile.languages.join(', ')}
            </p>
          </section>
        )}

        <section className="mt-8 rounded-[24px] border border-outline-variant/30 bg-surface-container-low/80 px-5 py-5">
          <h2 className="font-headline text-lg font-semibold text-on-surface">
            Contact
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-on-surface-variant">
            {profile.googleBusinessUrl && (
              <li>
                Google Business:{' '}
                <a
                  className="font-semibold text-primary"
                  href={profile.googleBusinessUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on Google
                </a>
              </li>
            )}
            {profile.email && (
              <li>
                Email:{' '}
                <a className="font-semibold text-primary" href={`mailto:${profile.email}`}>
                  {profile.email}
                </a>
              </li>
            )}
            {profile.phone && <li>Phone: {profile.phone}</li>}
            {profile.website && (
              <li>
                Website:{' '}
                <a
                  className="font-semibold text-primary"
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {profile.website.replace(/^https?:\/\//, '')}
                </a>
              </li>
            )}
          </ul>
        </section>

        <p className="mt-8 text-xs text-on-surface-variant">
          BeforeYes lists verified relationship therapists for discovery. We do
          not provide counseling advice ourselves.
        </p>

        <Link
          to="/consultants"
          className="mt-6 font-label text-sm font-semibold text-primary"
        >
          ← All relationship therapists
        </Link>

        <div className="mt-auto pt-16">
          <SiteFooter />
        </div>
      </article>
    </Atmosphere>
  )
}
