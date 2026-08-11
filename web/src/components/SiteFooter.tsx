import { Link } from 'react-router-dom'
import { BrandMark } from '@/components/BrandMark'

const FEEDBACK_URL = import.meta.env.VITE_FEEDBACK_URL?.trim()

export function SiteFooter() {
  return (
    <footer className="border-t border-outline-variant/30 px-margin-mobile py-10 md:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 text-sm text-on-surface-variant">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <BrandMark to="/" size="sm" />
            <p className="mt-2 max-w-sm">
              A clarity tool for serious couples. Not a dating marketplace.
            </p>
          </div>
          <nav
            aria-label="Legal and feedback"
            className="flex flex-wrap gap-x-5 gap-y-2 font-label text-sm"
          >
            <Link
              to="/consultants/register"
              className="hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              Register as consultant
            </Link>
            <Link
              to="/consultants"
              className="hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              Consultants
            </Link>
            <Link
              to="/privacy"
              className="hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              Privacy
            </Link>
            <Link
              to="/terms"
              className="hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              Terms
            </Link>
            {FEEDBACK_URL ? (
              <a
                href={FEEDBACK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                Feedback
              </a>
            ) : (
              <Link
                to="/feedback"
                className="hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                Feedback
              </Link>
            )}
          </nav>
        </div>
        <p className="text-xs">
          18+ only · Free to use · Private by design
        </p>
      </div>
    </footer>
  )
}
