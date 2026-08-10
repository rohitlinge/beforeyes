import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** Public pages search engines may index. Everything else is noindex. */
const INDEXABLE_PATHS = new Set(['/', '/privacy', '/terms'])

const BRAND = 'BeforeYes'

const PAGE_TITLES: Record<string, string> = {
  '/': BRAND,
  '/privacy': `Privacy Policy — ${BRAND}`,
  '/terms': `Terms — ${BRAND}`,
  '/feedback': `Feedback — ${BRAND}`,
  '/login': `Log in — ${BRAND}`,
  '/signup': `Sign up — ${BRAND}`,
  '/verify-email': `Verify email — ${BRAND}`,
  '/app': `Home — ${BRAND}`,
  '/join': `Join room — ${BRAND}`,
}

function titleForPath(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
  if (pathname.startsWith('/join/')) return `Join room — ${BRAND}`
  if (pathname.startsWith('/room/')) return `Private session — ${BRAND}`
  return BRAND
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
