import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/EmptyState'

type GateScreenProps = {
  title: string
  description: string
  actionLabel?: string
  actionTo?: string
}

/** Full-page dead-end / wrong-phase / unavailable helper. */
export function GateScreen({
  title,
  description,
  actionLabel = '← Back to app',
  actionTo = '/app',
}: GateScreenProps) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center bg-background px-margin-mobile text-center">
      <EmptyState
        title={title}
        description={description}
        action={
          <Link
            to={actionTo}
            className="inline-flex min-h-11 items-center font-label font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            {actionLabel}
          </Link>
        }
      />
    </div>
  )
}
