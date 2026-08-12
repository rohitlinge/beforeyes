import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BrandMark } from '@/components/BrandMark'
import { SiteFooter } from '@/components/SiteFooter'
import { useAuth } from '@/features/auth/AuthProvider'

const STEPS = [
  {
    step: '01',
    title: 'Private Lobby',
    body: 'You and your partner connect in a private room—no public profiles, no strangers.',
  },
  {
    step: '02',
    title: 'Question Phase',
    body: 'Each of you privately builds the questions that matter. Lists swap only when both are ready.',
  },
  {
    step: '03',
    title: 'Answer Phase',
    body: 'Answer honestly in private. Answers unlock for both of you at the same time.',
  },
  {
    step: '04',
    title: 'Alignment Score',
    body: 'After reading, mark Agree or Disagree on each answer—no Maybe. You both get a clear % of how aligned you are.',
  },
] as const

const FAQS = [
  {
    question: 'Why use an app instead of just talking or texting on WhatsApp?',
    answer:
      'Live talks and text chats carry real-time pressure, leading to polite answers instead of honest ones. BeforeYes gives both of you a calm, private buffer to reflect deeply and unlock answers at the exact same time without fear of immediate reaction.',
  },
  {
    question:
      'Isn’t using an app for serious relationship topics too transactional?',
    answer:
      'BeforeYes isn’t meant to replace your conversation—it’s built to prepare you for it. It helps you both organize your non-negotiables calmly so your in-person discussion is focused, clear, and productive.',
  },
  {
    question: 'How does the compatibility score work?',
    answer:
      'After answers swap, each of you marks Agree or Disagree on every partner answer. When both finish, BeforeYes combines those ratings into a shared percentage—how aligned you are—not a blunt Yes/No or Match/No Match.',
  },
  {
    question: 'Why isn’t there a Maybe option?',
    answer:
      'Soft 50/50 agreement often becomes a bigger issue later in a relationship. Agree or Disagree keeps the score honest and forces clarity on what you can truly live with.',
  },
  {
    question: 'Can one partner see my answers before submitting theirs?',
    answer:
      'No. Answers are locked in private and only reveal to both partners simultaneously once both sides have completed the phase. Neither person can adapt their answers based on the other’s.',
  },
  {
    question:
      'How do I introduce BeforeYes to my partner without making them defensive?',
    answer:
      'Frame it as mutual respect, not suspicion. A simple: “I care about our future together, and I want to make sure we’re completely aligned on the big things before we make a big commitment.”',
  },
  {
    question: 'Can we download a report of our session?',
    answer:
      'Yes. After your score is revealed, you can download a report for yourself or share it with a relationship therapist if you both choose to.',
  },
  {
    question: 'Is our personal data and relationship details secure?',
    answer:
      'Absolutely. BeforeYes is private by design—there are no public profiles, no social feeds, and your data is encrypted exclusively for your two-person lobby.',
  },
] as const

export function LandingPage() {
  const { user, profile } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const id = 'beforeyes-faq-jsonld'
    const existing = document.getElementById(id)
    if (existing) existing.remove()

    const script = document.createElement('script')
    script.id = id
    script.type = 'application/ld+json'
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQS.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    })
    document.head.appendChild(script)

    return () => {
      document.getElementById(id)?.remove()
    }
  }, [])

  const primaryTo = user ? '/app' : '/signup'
  const inviteTo = user ? '/join' : '/login'

  return (
    <div className="min-h-screen bg-background text-on-background relative overflow-x-hidden">
      {/* Atmosphere */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -top-24 -right-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-40 -left-24 h-80 w-80 rounded-full bg-secondary-container/30 blur-3xl" />
        <div className="absolute bottom-20 right-10 h-64 w-64 rounded-full bg-primary-fixed/40 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, #166965 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />
      </div>

      <header
        className={`fixed top-0 z-40 w-full transition-all duration-300 ${
          scrolled
            ? 'bg-surface-container-low/90 backdrop-blur-md shadow-sm'
            : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between px-margin-mobile py-4 md:px-8">
          <BrandMark href="#top" size="sm" />
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <>
                <span className="hidden text-sm text-on-surface-variant sm:inline">
                  {profile?.displayName ?? 'Signed in'}
                </span>
                <Link
                  to="/app"
                  className="rounded-full bg-primary px-4 py-2 font-label text-sm font-semibold text-on-primary transition-opacity hover:opacity-90"
                >
                  Open app
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-full px-3 py-2 font-label text-sm font-semibold text-on-surface-variant transition-colors hover:bg-surface-container sm:px-4"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="rounded-full bg-primary px-4 py-2 font-label text-sm font-semibold text-on-primary transition-opacity hover:opacity-90"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main id="top">
        {/* Hero — first viewport: brand, one headline, one sentence, CTAs */}
        <section className="mx-auto flex min-h-[100svh] max-w-3xl flex-col justify-center px-margin-mobile pb-16 pt-28 text-center md:px-8 md:pt-32">
          <div className="animate-fade-in-up flex justify-center">
            <BrandMark size="lg" />
          </div>
          <h1 className="animate-fade-in-up animation-delay-100 mt-5 font-display text-3xl font-bold tracking-tight text-on-surface sm:text-4xl md:text-5xl">
            Have the conversation before the commitment.
          </h1>
          <p className="animate-fade-in-up animation-delay-200 mx-auto mt-5 max-w-lg font-body text-base leading-relaxed text-on-surface-variant sm:text-lg">
            A private two-player space for serious couples to ask the hard
            questions—then see how aligned you are as a clear percentage.
          </p>
          <div className="animate-fade-in-up animation-delay-300 mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Link
              to={primaryTo}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 font-label text-sm font-semibold text-on-primary shadow-[0_8px_20px_-6px_rgba(22,105,101,0.4)] transition-all duration-300 hover:-translate-y-0.5 hover:opacity-95"
            >
              Start with your partner
              <span aria-hidden className="text-lg leading-none">
                →
              </span>
            </Link>
            <Link
              to={inviteTo}
              state={!user ? { from: '/join' } : undefined}
              className="inline-flex items-center justify-center rounded-full border border-outline-variant bg-surface/60 px-8 py-4 font-label text-sm font-semibold text-on-surface backdrop-blur-sm transition-colors hover:bg-surface-container"
            >
              I have an invite link
            </Link>
          </div>
          <p className="animate-fade-in-up animation-delay-300 mt-6 text-xs font-label text-on-surface-variant">
            Free to use · Private by design · Adults 18+ only
          </p>
        </section>

        {/* How it works */}
        <section
          id="how-it-works"
          className="mx-auto max-w-3xl px-margin-mobile pb-20 md:px-8"
        >
          <div className="text-center">
            <p className="font-label text-sm font-semibold tracking-wide text-primary">
              How it works
            </p>
            <h2 className="mt-2 font-headline text-2xl font-semibold tracking-tight text-on-surface sm:text-3xl">
              Four calm steps. One clear alignment score.
            </h2>
            <p className="mx-auto mt-3 max-w-md text-on-surface-variant">
              Built for the conversations couples usually avoid—money, family,
              lifestyle, and the future.
            </p>
          </div>

          <ol className="mt-12 flex flex-col gap-0">
            {STEPS.map((item, index) => (
              <li key={item.step} className="relative flex gap-5 sm:gap-6">
                <div className="flex w-12 flex-col items-center sm:w-14">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-label text-sm font-semibold text-primary sm:h-14 sm:w-14">
                    {item.step}
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className="my-1 w-px flex-1 bg-outline-variant/50" />
                  )}
                </div>
                <div className={`flex-1 pb-10 ${index === STEPS.length - 1 ? 'pb-0' : ''}`}>
                  <h3 className="pt-2.5 font-headline text-lg font-semibold text-on-surface sm:pt-3.5 sm:text-xl">
                    {item.title}
                  </h3>
                  <p className="mt-2 max-w-prose leading-relaxed text-on-surface-variant">
                    {item.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* FAQ */}
        <section
          id="faq"
          className="mx-auto max-w-3xl px-margin-mobile pb-20 md:px-8"
          aria-labelledby="faq-heading"
        >
          <div className="text-center">
            <p className="font-label text-sm font-semibold tracking-wide text-primary">
              FAQ
            </p>
            <h2
              id="faq-heading"
              className="mt-2 font-headline text-2xl font-semibold tracking-tight text-on-surface sm:text-3xl"
            >
              Questions couples ask before they begin
            </h2>
            <p className="mx-auto mt-3 max-w-md text-on-surface-variant">
              Straight answers about privacy, pressure, and how BeforeYes
              protects dignity for both of you.
            </p>
          </div>

          <div className="mt-10 divide-y divide-outline-variant/40 border-y border-outline-variant/40">
            {FAQS.map((item, index) => {
              const isOpen = openFaq === index
              const panelId = `faq-panel-${index}`
              const buttonId = `faq-button-${index}`

              return (
                <div key={item.question} className="py-1">
                  <h3>
                    <button
                      type="button"
                      id={buttonId}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="flex w-full items-start justify-between gap-4 py-4 text-left transition-colors hover:text-primary"
                    >
                      <span className="font-headline text-base font-semibold leading-snug text-on-surface sm:text-lg">
                        {item.question}
                      </span>
                      <span
                        aria-hidden
                        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 font-label text-lg leading-none text-primary transition-transform duration-300 ${
                          isOpen ? 'rotate-45' : ''
                        }`}
                      >
                        +
                      </span>
                    </button>
                  </h3>
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    hidden={!isOpen}
                    className="pb-5 pr-10"
                  >
                    <p className="max-w-prose leading-relaxed text-on-surface-variant">
                      {item.answer}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Trust / dignity strip */}
        <section className="mx-auto max-w-3xl px-margin-mobile pb-20 md:px-8">
          <div className="relative overflow-hidden rounded-[32px] border border-outline-variant/20 bg-surface-container-low/70 px-6 py-10 backdrop-blur-xl ambient-shadow sm:px-10">
            <div
              aria-hidden
              className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-secondary-container/20 blur-3xl"
            />
            <h2 className="relative font-headline text-xl font-semibold tracking-tight text-on-surface sm:text-2xl">
              Designed so honesty feels safer than silence.
            </h2>
            <p className="relative mt-3 max-w-xl leading-relaxed text-on-surface-variant">
              Questions and answers stay private until you both choose to
              exchange. Then you mark Agree or Disagree on each answer—no Maybe—
              and see a shared compatibility percentage you can download for
              yourselves or a relationship therapist.
            </p>
            <Link
              to={primaryTo}
              className="relative mt-6 inline-flex rounded-full bg-primary px-6 py-3 font-label text-sm font-semibold text-on-primary transition-opacity hover:opacity-90"
            >
              {user ? 'Continue in the app' : 'Create your free account'}
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
