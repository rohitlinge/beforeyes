import { Link } from 'react-router-dom'
import { Atmosphere } from '@/components/Atmosphere'
import { SiteFooter } from '@/components/SiteFooter'

const FEEDBACK_URL = import.meta.env.VITE_FEEDBACK_URL?.trim()
const FEEDBACK_EMAIL =
  import.meta.env.VITE_FEEDBACK_EMAIL?.trim() || 'feedback@example.com'

export function FeedbackPage() {
  return (
    <Atmosphere>
      <div className="mx-auto flex min-h-screen max-w-lg flex-col px-margin-mobile py-10 md:px-8">
        <Link
          to="/"
          className="font-headline text-lg font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          The Pre-Commitment Game
        </Link>
        <h1 className="mt-8 font-display text-3xl font-bold tracking-tight text-on-surface">
          Send feedback
        </h1>
        <p className="mt-3 leading-relaxed text-on-surface-variant">
          Tell us what felt confusing, what helped, or what broke. Real-couple
          notes shape the next fixes.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          {FEEDBACK_URL ? (
            <a
              href={FEEDBACK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-6 py-3.5 font-label text-sm font-semibold text-on-primary transition-opacity hover:opacity-90"
            >
              Open feedback form
            </a>
          ) : (
            <a
              href={`mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent('Pre-Commitment Game feedback')}`}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-6 py-3.5 font-label text-sm font-semibold text-on-primary transition-opacity hover:opacity-90"
            >
              Email feedback
            </a>
          )}
          <Link
            to="/app"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-outline-variant px-6 py-3 font-label text-sm font-semibold text-on-surface"
          >
            Back to app
          </Link>
        </div>

        {!FEEDBACK_URL && (
          <p className="mt-6 text-xs text-on-surface-variant">
            Set <code className="rounded bg-surface-container px-1">VITE_FEEDBACK_URL</code>{' '}
            (Google Form / Typeform) in <code className="rounded bg-surface-container px-1">.env</code> for
            a form link instead of email.
          </p>
        )}

        <div className="mt-auto pt-16">
          <SiteFooter />
        </div>
      </div>
    </Atmosphere>
  )
}
