import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** Public pages search engines may index. Everything else is noindex. */
const INDEXABLE_PATHS = new Set(['/', '/privacy', '/terms'])

const PAGE_TITLES: Record<string, string> = {
  '/': 'The Pre-Commitment Game',
  '/privacy': 'Privacy Policy — The Pre-Commitment Game',
  '/terms': 'Terms — The Pre-Commitment Game',
  '/feedback': 'Feedback — The Pre-Commitment Game',
  '/login': 'Log in — The Pre-Commitment Game',
  '/signup': 'Sign up — The Pre-Commitment Game',
  '/app': 'Home — The Pre-Commitment Game',
  '/join': 'Join room — The Pre-Commitment Game',
}

function titleForPath(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
  if (pathname.startsWith('/join/')) return 'Join room — The Pre-Commitment Game'
  if (pathname.startsWith('/room/')) return 'Private session — The Pre-Commitment Game'
  return 'The Pre-Commitment Game'
}

function ensureMeta(name: string): HTMLMetaElement {
  let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('name', name)
    document.head.appendChild(el)
  }
  return el
}

function ensureCanonical(): HTMLLinkElement {
  let el = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  return el
}

/**
 * Sets robots + title per route so only marketing/legal pages are indexed.
 * Sensitive auth/session pages get noindex,nofollow.
 */
export function Seo() {
  const { pathname } = useLocation()

  useEffect(() => {
    const indexable = INDEXABLE_PATHS.has(pathname)
    ensureMeta('robots').setAttribute(
      'content',
      indexable ? 'index, follow' : 'noindex, nofollow',
    )
    document.title = titleForPath(pathname)

    const canonical = ensureCanonical()
    if (indexable) {
      canonical.setAttribute('href', `${window.location.origin}${pathname}`)
    } else {
      canonical.remove()
    }
  }, [pathname])

  return null
}
