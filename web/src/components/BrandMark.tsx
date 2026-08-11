import { Link } from 'react-router-dom'

type BrandMarkProps = {
  to?: string
  href?: string
  size?: 'sm' | 'md' | 'lg'
  /** Kept for API compatibility; full logo already includes the wordmark. */
  showWordmark?: boolean
  className?: string
  onClick?: () => void
}

const SIZES = {
  sm: 'h-9 w-auto sm:h-10',
  md: 'h-12 w-auto',
  lg: 'h-24 w-auto sm:h-28 md:h-32',
} as const

const LOGO_SRC = '/beforeyes-logo-2.png'

/**
 * BeforeYes brand logo. Prefer this over plain text for headers.
 */
export function BrandMark({
  to,
  href,
  size = 'sm',
  className = '',
  onClick,
}: BrandMarkProps) {
  const content = (
    <img
      src={LOGO_SRC}
      alt="BeforeYes"
      width={640}
      height={360}
      className={`${SIZES[size]} shrink-0 object-contain object-left`}
      decoding="async"
    />
  )

  const classes = `inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-lg ${className}`

  if (to) {
    return (
      <Link to={to} onClick={onClick} className={classes} aria-label="BeforeYes">
        {content}
      </Link>
    )
  }

  if (href) {
    return (
      <a href={href} onClick={onClick} className={classes} aria-label="BeforeYes">
        {content}
      </a>
    )
  }

  return (
    <span className={classes} aria-label="BeforeYes">
      {content}
    </span>
  )
}
