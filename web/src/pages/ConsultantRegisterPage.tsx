import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Atmosphere } from '@/components/Atmosphere'
import { BrandMark } from '@/components/BrandMark'
import { InlineError } from '@/components/InlineError'
import { SiteFooter } from '@/components/SiteFooter'
import { submitConsultantApplication } from '@/features/consultants/api'
import {
  THERAPISTS_PATH,
  THERAPISTS_REGISTER_PATH,
} from '@/features/consultants/paths'
import { SPECIALTY_OPTIONS, slugifyName } from '@/features/consultants/types'
import { setJsonLd, siteUrl } from '@/lib/seoJsonLd'

const LANG_OPTIONS = [
  'English',
  'Hindi',
  'Marathi',
  'Tamil',
  'Telugu',
  'Kannada',
  'Bengali',
  'Gujarati',
  'Other',
]

const STEPS = [
  { id: 'name', label: 'Name' },
  { id: 'role', label: 'Role' },
  { id: 'gmb', label: 'Google Business' },
  { id: 'location', label: 'Location' },
  { id: 'expertise', label: 'Expertise' },
  { id: 'story', label: 'Your story' },
  { id: 'contact', label: 'Contact' },
] as const

const REGISTER_FAQ = [
  {
    q: 'Who can register as a relationship therapist on BeforeYes?',
    a: 'Licensed or experienced relationship therapists, marriage and family therapists, and pre-marital counselors who work with serious couples preparing for commitment.',
  },
  {
    q: 'Why is a Google Business Profile required?',
    a: 'It is our primary trust signal. We verify listings through Google before publishing so couples can trust that profiles are real practices.',
  },
  {
    q: 'When will my profile go live?',
    a: 'After you submit, an admin reviews your details. Once approved, your public page appears in the BeforeYes relationship therapists directory.',
  },
] as const

export function ConsultantRegisterPage() {
  const [step, setStep] = useState(0)
  const [fullName, setFullName] = useState('')
  const [title, setTitle] = useState('')
  const [yearsExperience, setYearsExperience] = useState('5')
  const [googleBusinessUrl, setGoogleBusinessUrl] = useState('')
  const [city, setCity] = useState('')
  const [region, setRegion] = useState('')
  const [country, setCountry] = useState('India')
  const [specialties, setSpecialties] = useState<string[]>([])
  const [languages, setLanguages] = useState<string[]>(['English'])
  const [bio, setBio] = useState('')
  const [website, setWebsite] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [preferredSlug, setPreferredSlug] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [doneSlug, setDoneSlug] = useState<string | null>(null)

  useEffect(() => {
    if (doneSlug) {
      setJsonLd('therapists-register-schema', null)
      setJsonLd('therapists-register-faq', null)
      setJsonLd('therapists-register-breadcrumb', null)
      return
    }

    const pageUrl = siteUrl(THERAPISTS_REGISTER_PATH)
    setJsonLd('therapists-register-breadcrumb', {
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
          item: siteUrl(THERAPISTS_PATH),
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Register',
          item: pageUrl,
        },
      ],
    })
    setJsonLd('therapists-register-schema', {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Register as a Relationship Therapist on BeforeYes',
      description:
        'Apply to list your relationship therapy or pre-marital counseling practice on BeforeYes for serious couples preparing for commitment.',
      url: pageUrl,
      isPartOf: { '@type': 'WebSite', name: 'BeforeYes', url: siteUrl('/') },
    })
    setJsonLd('therapists-register-faq', {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: REGISTER_FAQ.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    })

    return () => {
      setJsonLd('therapists-register-breadcrumb', null)
      setJsonLd('therapists-register-schema', null)
      setJsonLd('therapists-register-faq', null)
    }
  }, [doneSlug])

  const previewSlug = useMemo(
    () => slugifyName(preferredSlug || fullName) || 'your-name',
    [preferredSlug, fullName],
  )

  const progress = ((step + 1) / STEPS.length) * 100
  const isLast = step === STEPS.length - 1

  function toggle(list: string[], value: string, setter: (v: string[]) => void) {
    setter(list.includes(value) ? list.filter((x) => x !== value) : [...list, value])
  }

  function validateStep(): string | null {
    switch (STEPS[step].id) {
      case 'name':
        if (fullName.trim().length < 2) return 'Please enter your full name.'
        return null
      case 'role':
        if (title.trim().length < 2) return 'Please enter your professional title.'
        return null
      case 'gmb': {
        const gmb = googleBusinessUrl.trim()
        if (!gmb) return 'Google Business Profile link is required.'
        if (!/^https?:\/\//i.test(gmb)) return 'Link must start with https://'
        const ok =
          /google\.(com|co\.[a-z]{2})/i.test(gmb) ||
          /maps\.app\.goo\.gl/i.test(gmb) ||
          /goo\.gl\/maps/i.test(gmb) ||
          /g\.page\//i.test(gmb) ||
          /business\.google\.com/i.test(gmb)
        if (!ok) {
          return 'Paste your Google Business Profile or Google Maps link.'
        }
        return null
      }
      case 'location':
        if (city.trim().length < 2) return 'Please enter your city.'
        return null
      case 'expertise':
        if (specialties.length === 0) return 'Select at least one specialty.'
        return null
      case 'story':
        if (bio.trim().length < 40) return 'Bio should be at least 40 characters.'
        return null
      case 'contact':
        if (!email.trim() || !email.includes('@')) return 'Please enter a valid email.'
        return null
      default:
        return null
    }
  }

  function goNext() {
    const msg = validateStep()
    if (msg) {
      setError(msg)
      return
    }
    setError(null)
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  function goBack() {
    setError(null)
    setStep((s) => Math.max(s - 1, 0))
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isLast) {
      goNext()
      return
    }
    const msg = validateStep()
    if (msg) {
      setError(msg)
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await submitConsultantApplication({
        fullName,
        title,
        city,
        region,
        country,
        specialties,
        bio,
        yearsExperience: Number(yearsExperience) || 0,
        languages,
        googleBusinessUrl,
        website,
        email,
        phone,
        photoUrl,
        preferredSlug: preferredSlug || undefined,
      })
      setDoneSlug(res.slug)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit application.')
    } finally {
      setSubmitting(false)
    }
  }

  if (doneSlug) {
    return (
      <Atmosphere>
        <div className="mx-auto flex min-h-screen max-w-lg flex-col px-margin-mobile py-10 md:px-8">
          <BrandMark to="/" size="sm" />
          <h1 className="mt-8 font-display text-3xl font-bold tracking-tight text-on-surface">
            Application received
          </h1>
          <p className="mt-3 leading-relaxed text-on-surface-variant">
            Thanks for registering. An admin will review your Google Business Profile
            and details. Once approved, your page goes live at{' '}
            <span className="font-semibold text-on-surface">
              {THERAPISTS_PATH}/{doneSlug}
            </span>
            .
          </p>
          <Link
            to={THERAPISTS_PATH}
            className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-6 font-label text-sm font-semibold text-on-primary"
          >
            Browse relationship therapists
          </Link>
          <div className="mt-auto pt-16">
            <SiteFooter />
          </div>
        </div>
      </Atmosphere>
    )
  }

  return (
    <Atmosphere>
      <div className="mx-auto flex min-h-screen max-w-lg flex-col px-margin-mobile py-10 md:px-8">
        <BrandMark to="/" size="sm" />

        <nav aria-label="Breadcrumb" className="mt-6 text-sm text-on-surface-variant">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link to="/" className="font-semibold text-primary">
                Home
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link to={THERAPISTS_PATH} className="font-semibold text-primary">
                Relationship therapists
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="text-on-surface">Register</li>
          </ol>
        </nav>

        <header className="mt-6">
          <h1 className="font-display text-3xl font-bold tracking-tight text-on-surface">
            Register as a relationship therapist
          </h1>
          <p className="mt-3 leading-relaxed text-on-surface-variant">
            List your practice on BeforeYes and reach serious couples preparing for
            commitment. Complete the steps below—your Google Business Profile is the
            main trust signal we use before publishing.
          </p>
        </header>

        <ul className="mt-5 list-disc space-y-1.5 pl-5 text-sm text-on-surface-variant">
          <li>Reach couples who want pre-marital clarity, not casual dating</li>
          <li>Public profile with specialties, location, and contact options</li>
          <li>Admin review after Google Business verification</li>
        </ul>

        <div className="mt-6" aria-hidden>
          <div className="flex items-center justify-between text-xs font-label text-on-surface-variant">
            <span>
              Step {step + 1} of {STEPS.length}
            </span>
            <span>{STEPS[step].label}</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-outline-variant/40">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <form
          onSubmit={(e) => void onSubmit(e)}
          className="mt-6 flex flex-col gap-5 rounded-[32px] border border-white/60 bg-surface-container-lowest/95 p-6 ambient-shadow sm:p-8"
        >
          {STEPS[step].id === 'name' && (
            <StepBlock
              title="What’s your full name?"
              hint="This appears as the headline on your public profile."
            >
              <Field
                label="Full name"
                value={fullName}
                onChange={setFullName}
                placeholder="e.g. Dr. Priya Sharma"
                autoFocus
              />
            </StepBlock>
          )}

          {STEPS[step].id === 'role' && (
            <StepBlock
              title="What’s your professional title?"
              hint="How couples should understand your credentials."
            >
              <Field
                label="Title"
                value={title}
                onChange={setTitle}
                placeholder="e.g. Licensed Marriage & Family Therapist"
                autoFocus
              />
              <Field
                label="Years of experience"
                value={yearsExperience}
                onChange={setYearsExperience}
                type="number"
              />
            </StepBlock>
          )}

          {STEPS[step].id === 'gmb' && (
            <StepBlock
              title="Add your Google Business Profile"
              hint="This is the most important step. We verify listings through Google before approval."
            >
              <div className="rounded-2xl border border-primary/25 bg-primary/5 px-4 py-3 text-sm leading-relaxed text-on-surface-variant">
                Paste the public link from Google Maps or Google Business Profile
                (maps.google.com, g.page, or business.google.com). Profiles without a
                valid Google listing are usually not approved.
              </div>
              <Field
                label="Google Business Profile URL *"
                value={googleBusinessUrl}
                onChange={setGoogleBusinessUrl}
                placeholder="https://maps.google.com/… or https://g.page/…"
                autoFocus
              />
            </StepBlock>
          )}

          {STEPS[step].id === 'location' && (
            <StepBlock title="Where do you practice?" hint="Shown on your public profile and in search.">
              <Field label="City *" value={city} onChange={setCity} autoFocus />
              <Field label="State / region" value={region} onChange={setRegion} />
              <Field label="Country" value={country} onChange={setCountry} />
            </StepBlock>
          )}

          {STEPS[step].id === 'expertise' && (
            <StepBlock title="What do you specialize in?" hint="Pick every focus that fits your practice.">
              <div className="flex flex-wrap gap-2">
                {SPECIALTY_OPTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggle(specialties, s, setSpecialties)}
                    className={`rounded-full px-3 py-1.5 font-label text-xs font-semibold transition-colors ${
                      specialties.includes(s)
                        ? 'bg-primary text-on-primary'
                        : 'border border-outline-variant bg-surface text-on-surface'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <p className="font-label text-sm font-semibold text-on-surface">Languages</p>
              <div className="flex flex-wrap gap-2">
                {LANG_OPTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggle(languages, s, setLanguages)}
                    className={`rounded-full px-3 py-1.5 font-label text-xs font-semibold transition-colors ${
                      languages.includes(s)
                        ? 'bg-primary text-on-primary'
                        : 'border border-outline-variant bg-surface text-on-surface'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </StepBlock>
          )}

          {STEPS[step].id === 'story' && (
            <StepBlock
              title="Tell couples your story"
              hint="At least 40 characters — who you help and how you work."
            >
              <label className="flex flex-col gap-1.5">
                <span className="font-label text-sm font-semibold text-on-surface">Bio</span>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={6}
                  autoFocus
                  className="rounded-2xl border border-outline-variant/50 bg-surface px-4 py-3.5 text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="Who you help, your approach, and why couples trust you before saying yes…"
                />
              </label>
            </StepBlock>
          )}

          {STEPS[step].id === 'contact' && (
            <StepBlock
              title="How should couples reach you?"
              hint="Email is required. Other fields are optional."
            >
              <Field
                label="Public email *"
                value={email}
                onChange={setEmail}
                type="email"
                autoFocus
              />
              <Field label="Phone (optional)" value={phone} onChange={setPhone} />
              <Field
                label="Website (optional)"
                value={website}
                onChange={setWebsite}
                placeholder="https://"
              />
              <Field
                label="Photo URL (optional)"
                value={photoUrl}
                onChange={setPhotoUrl}
                placeholder="https://…"
              />
              <Field
                label="Preferred profile URL"
                value={preferredSlug}
                onChange={setPreferredSlug}
                placeholder="priya-sharma-mft"
              />
              <p className="text-xs text-on-surface-variant">
                Preview:{' '}
                <span className="font-semibold text-on-surface">
                  {THERAPISTS_PATH}/{previewSlug}
                </span>
              </p>
            </StepBlock>
          )}

          <InlineError message={error} />

          <div className="mt-2 flex gap-3">
            {step > 0 && (
              <button
                type="button"
                onClick={goBack}
                className="min-h-12 flex-1 rounded-full border border-outline-variant px-6 font-label text-sm font-semibold text-on-surface"
              >
                Back
              </button>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="min-h-12 flex-[1.4] rounded-full bg-primary px-6 font-label text-sm font-semibold text-on-primary disabled:opacity-60"
            >
              {submitting ? 'Submitting…' : isLast ? 'Submit for review' : 'Continue'}
            </button>
          </div>

          {isLast && (
            <p className="text-xs leading-relaxed text-on-surface-variant">
              By submitting, you confirm your Google Business Profile and details are
              accurate. Unverified applications are deleted and never indexed.
            </p>
          )}
        </form>

        <section className="mt-12" aria-labelledby="register-faq-heading">
          <h2
            id="register-faq-heading"
            className="font-headline text-xl font-semibold text-on-surface"
          >
            Registration FAQ
          </h2>
          <dl className="mt-4 flex flex-col gap-4">
            {REGISTER_FAQ.map((item) => (
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
          <p className="mt-4 text-sm text-on-surface-variant">
            Prefer to browse first?{' '}
            <Link to={THERAPISTS_PATH} className="font-semibold text-primary">
              View the relationship therapists directory
            </Link>
            .
          </p>
        </section>

        <div className="mt-auto pt-16">
          <SiteFooter />
        </div>
      </div>
    </Atmosphere>
  )
}

function StepBlock({
  title,
  hint,
  children,
}: {
  title: string
  hint: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="font-headline text-xl font-semibold tracking-tight text-on-surface">
          {title}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">{hint}</p>
      </div>
      {children}
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  autoFocus,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  autoFocus?: boolean
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-label text-sm font-semibold text-on-surface">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="rounded-2xl border border-outline-variant/50 bg-surface px-4 py-3.5 text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </label>
  )
}
