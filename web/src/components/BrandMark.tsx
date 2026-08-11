import { Link } from 'react-router-dom'
import markUrl from '@/assets/beforeyes-mark.svg'

type BrandMarkProps = {
  to?: string
  href?: string
  size?: 'sm' | 'md' | 'lg'
  showWordmark?: boolean
  className?: string
  onClick?: () => void
}

const SIZES = {
  sm: { icon: 'h-7 w-7', text: 'text-base sm:text-lg' },
  md: { icon: 'h-8 w-8', text: 'text-lg sm:text-xl' },
  lg: { icon: 'h-10 w-10 sm:h-12 sm:w-12', text: 'text-2xl sm:text-3xl md:text-4xl' },
} as const

/**
 * BeforeYes brand mark + wordmark. Prefer this over plain text for headers.
 */
export function BrandMark({
  to,
  href,
  size = 'sm',
  showWordmark = true,
  className = '',
  onClick,
}: BrandMarkProps) {
  const s = SIZES[size]
  const content = (
    <>
      <img
        src={markUrl}
        alt=""
        width={48}
        height={48}
        className={`${s.icon} shrink-0 rounded-[28%]`}
        decoding="async"
      />
      {showWordmark && (
        <span className={`font-headline font-semibold tracking-tight text-primary ${s.text}`}>
          BeforeYes
        </span>
      )}
    </>
  )

  const classes = `inline-flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-lg ${className}`

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
