import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** Public pages search engines may index. Everything else is noindex. */
function isIndexablePath(pathname: string): boolean {
  if (pathname === '/' || pathname === '/privacy' || pathname === '/terms') {
    return true
  }
  if (
    pathname === '/relationship-therapists' ||
    pathname === '/relationship-therapists/register'
  ) {
    return true
  }
  if (pathname.startsWith('/relationship-therapists/')) {
    return true
  }
  return false
}

const BRAND = 'BeforeYes'
const SITE_URL = (
  import.meta.env.VITE_SITE_URL?.trim() || 'https://www.beforeyes.online'
).replace(/\/$/, '')

type PageSeo = {
  title: string
  description: string
  keywords: string
}

const DEFAULT_KEYWORDS =
  'ask before saying yes, avoid marriage regret, pre marriage questions, hard questions before marriage, serious couples conversation, relationship compatibility score, BeforeYes, precommitment clarity, private couple Q&A, agree disagree relationship questions'

const PAGE_SEO: Record<string, PageSeo> = {
  '/': {
    title: 'Ask Before Saying Yes Or Regret It After Relationship | BeforeYes',
    description:
      'Avoid post-marriage regret. BeforeYes gives serious couples a private space to ask hard questions, mark Agree or Disagree, and see a clear compatibility percentage—with dignity.',
    keywords: `${DEFAULT_KEYWORDS}, ask before saying yes or regret it after, post marriage regret, decide before commitment`,
  },
  '/privacy': {
    title: 'Privacy Policy | BeforeYes — Private Couple Conversations Stay Confidential',
    description:
      'How BeforeYes protects your account, private room questions, answers, and Agree/Disagree ratings. Built for adults who value dignity and confidentiality before commitment.',
    keywords:
      'BeforeYes privacy policy, private couple conversations, secure relationship questions, data privacy before marriage, confidential Q&A for couples',
  },
  '/terms': {
    title: 'Terms of Use | BeforeYes — Rules for Serious Couples',
    description:
      'BeforeYes terms for our private two-player clarity tool. Adults only, consensual use, Agree/Disagree ratings, and a shared compatibility score—not dating or counseling.',
    keywords:
      'BeforeYes terms of use, relationship clarity tool terms, private couple Q&A rules, compatibility score terms',
  },
  '/relationship-therapists': {
    title:
      'Find Verified Relationship Therapists for Serious Couples | BeforeYes',
    description:
      'Browse admin-verified relationship therapists and pre-marital counselors who help serious couples prepare for commitment. Compare specialties, location, and credentials on BeforeYes.',
    keywords:
      'relationship therapists, pre-marital counselor, couples therapist near me, marriage counselor directory, verified relationship therapist, pre marriage counseling, serious couples therapist, BeforeYes therapists',
  },
  '/relationship-therapists/register': {
    title:
      'Register as a Relationship Therapist — List Your Practice | BeforeYes',
    description:
      'List your relationship therapy or pre-marital counseling practice on BeforeYes. Reach serious couples preparing for commitment. Profiles publish after Google Business verification and admin review.',
    keywords:
      'register as relationship therapist, list couples therapy practice, pre-marital counselor directory listing, join BeforeYes therapists, therapist Google Business Profile verification',
  },
  '/admin/relationship-therapists': {
    title: `Therapist Admin — ${BRAND}`,
    description: 'Review and approve relationship therapist profile applications.',
    keywords: 'BeforeYes admin',
  },
  '/feedback': {
    title: `Feedback — ${BRAND}`,
    description:
      'Share product feedback with the BeforeYes team. Help improve the private space serious couples use before saying yes.',
    keywords: 'BeforeYes feedback, product feedback, couple conversation tool',
  },
  '/login': {
    title: `Log in — ${BRAND}`,
    description:
      'Log in to BeforeYes to continue your private conversation and compatibility scoring with your partner.',
    keywords: 'BeforeYes login, sign in BeforeYes',
  },
  '/signup': {
    title: `Sign up — ${BRAND}`,
    description:
      'Create a BeforeYes account to ask hard questions in a safe, private room before you say yes.',
    keywords: 'BeforeYes sign up, create account BeforeYes, pre marriage questions app',
  },
  '/verify-email': {
    title: `Verify email — ${BRAND}`,
    description: 'Verify your email to unlock BeforeYes and start a private session with your partner.',
    keywords: 'BeforeYes verify email',
  },
  '/app': {
    title: `Home — ${BRAND}`,
    description: 'Your BeforeYes home — create or join a private room for a serious conversation before commitment.',
    keywords: 'BeforeYes home, private couple room',
  },
  '/join': {
    title: `Join room — ${BRAND}`,
    description: "Join your partner's private BeforeYes room with an invite link or room code.",
    keywords: 'join BeforeYes room, couple invite link',
  },
}

function seoForPath(pathname: string): PageSeo {
  if (PAGE_SEO[pathname]) return PAGE_SEO[pathname]
  if (pathname.startsWith('/join/')) {
    return {
      title: `Join room — ${BRAND}`,
      description: PAGE_SEO['/join'].description,
      keywords: PAGE_SEO['/join'].keywords,
    }
  }
  if (pathname.startsWith('/room/')) {
    return {
      title: `Private session — ${BRAND}`,
      description:
        'Private BeforeYes session — questions, answers, Agree/Disagree ratings, and a shared compatibility percentage.',
      keywords: 'BeforeYes private session, relationship compatibility score',
    }
  }
  if (
    pathname.startsWith('/relationship-therapists/') &&
    pathname !== '/relationship-therapists/register'
  ) {
    return {
      title: `Relationship Therapist | ${BRAND}`,
      description:
        'Verified relationship therapist profile on BeforeYes — guidance for serious couples before commitment.',
      keywords:
        'relationship therapist, pre-marital counselor, couples therapist, BeforeYes',
    }
  }
  return PAGE_SEO['/']
}

function ensureNamedMeta(name: string): HTMLMetaElement {
  let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('name', name)
    document.head.appendChild(el)
  }
  return el
}

function ensurePropertyMeta(property: string): HTMLMetaElement {
  let el = document.querySelector(
    `meta[property="${property}"]`,
  ) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('property', property)
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

function canonicalPath(pathname: string): string {
  if (pathname === '/') return `${SITE_URL}/`
  return `${SITE_URL}${pathname}`
}

/**
 * Sets robots, title, description, keywords, canonical, and social meta per route
 * so only marketing/legal pages are indexed.
 */
export function Seo() {
  const { pathname } = useLocation()

  useEffect(() => {
    const indexable = isIndexablePath(pathname)
    const page = seoForPath(pathname)
    const url = canonicalPath(pathname)

    // Profile pages set their own SEO after data loads — skip overwrite here.
    if (
      pathname.startsWith('/relationship-therapists/') &&
      pathname !== '/relationship-therapists/register'
    ) {
      ensureNamedMeta('robots').setAttribute('content', 'index, follow')
      return
    }

    ensureNamedMeta('robots').setAttribute(
      'content',
      indexable ? 'index, follow' : 'noindex, nofollow',
    )

    document.title = page.title
    ensureNamedMeta('description').setAttribute('content', page.description)
    ensureNamedMeta('keywords').setAttribute('content', page.keywords)

    ensurePropertyMeta('og:site_name').setAttribute('content', BRAND)
    ensurePropertyMeta('og:type').setAttribute('content', 'website')
    ensurePropertyMeta('og:title').setAttribute('content', page.title)
    ensurePropertyMeta('og:description').setAttribute('content', page.description)
    ensurePropertyMeta('og:url').setAttribute('content', url)
    ensurePropertyMeta('og:image').setAttribute(
      'content',
      `${SITE_URL}/beforeyes-logo.png`,
    )

    ensureNamedMeta('twitter:card').setAttribute('content', 'summary_large_image')
    ensureNamedMeta('twitter:title').setAttribute('content', page.title)
    ensureNamedMeta('twitter:description').setAttribute('content', page.description)
    ensureNamedMeta('twitter:image').setAttribute(
      'content',
      `${SITE_URL}/beforeyes-logo.png`,
    )

    const canonical = ensureCanonical()
    if (indexable) {
      canonical.setAttribute('href', url)
    } else {
      canonical.remove()
    }
  }, [pathname])

  return null
}
