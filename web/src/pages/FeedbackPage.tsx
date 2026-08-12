import { BrandMark } from '@/components/BrandMark'
import { Atmosphere } from '@/components/Atmosphere'
import { SiteFooter } from '@/components/SiteFooter'
import { Link } from 'react-router-dom'

const FEEDBACK_URL = import.meta.env.VITE_FEEDBACK_URL?.trim()
const FEEDBACK_EMAIL = import.meta.env.VITE_FEEDBACK_EMAIL?.trim()
const hasFeedbackTarget = Boolean(FEEDBACK_URL || FEEDBACK_EMAIL)

export function FeedbackPage() {
  return (
    <Atmosphere>
      <div className="mx-auto flex min-h-screen max-w-lg flex-col px-margin-mobile py-10 md:px-8">
        <BrandMark to="/" size="sm" />
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
          ) : FEEDBACK_EMAIL ? (
            <a
              href={`mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent('BeforeYes feedback')}`}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-6 py-3.5 font-label text-sm font-semibold text-on-primary transition-opacity hover:opacity-90"
            >
              Email feedback
            </a>
          ) : (
            <p className="rounded-2xl border border-outline-variant/40 bg-surface-container px-4 py-4 text-sm text-on-surface-variant">
              Feedback isn’t configured yet. Set{' '}
              <code className="rounded bg-surface px-1">VITE_FEEDBACK_URL</code> or{' '}
              <code className="rounded bg-surface px-1">VITE_FEEDBACK_EMAIL</code> in{' '}
              <code className="rounded bg-surface px-1">.env</code>.
            </p>
          )}
          <Link
            to="/app"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-outline-variant px-6 py-3 font-label text-sm font-semibold text-on-surface"
          >
            Back to app
          </Link>
        </div>

        {hasFeedbackTarget && !FEEDBACK_URL && (
          <p className="mt-6 text-xs text-on-surface-variant">
            Tip: set <code className="rounded bg-surface-container px-1">VITE_FEEDBACK_URL</code>{' '}
            for a form link instead of email.
          </p>
        )}

        <div className="mt-auto pt-16">
          <SiteFooter />
        </div>
      </div>
    </Atmosphere>
  )
}
