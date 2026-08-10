import { Link, useParams } from 'react-router-dom'

type PlaceholderFlowPageProps = {
  title: string
  phase: string
  stitchPath: string
}

/**
 * Temporary shells so routes exist early.
 * Visual implementation should follow Stitch HTML under /stitch_the_big_talk_game.
 */
export function PlaceholderFlowPage({
  title,
  phase,
  stitchPath,
}: PlaceholderFlowPageProps) {
  const { roomId } = useParams()

  return (
    <div className="min-h-screen bg-background px-margin-mobile py-10 max-w-2xl mx-auto">
      <p className="font-headline text-lg font-semibold text-primary">
        The Pre-Commitment Game
      </p>
      <h1 className="font-display text-3xl font-bold text-on-surface mt-4 tracking-tight">
        {title}
      </h1>
      <p className="text-on-surface-variant mt-2">
        Room: <span className="font-semibold text-on-surface">{roomId ?? '—'}</span>
      </p>
      <div className="mt-6 bg-surface-container rounded-[24px] p-6 ambient-shadow border border-white/50">
        <p className="font-label text-sm font-semibold text-primary">{phase}</p>
        <p className="font-body text-on-surface mt-2">
          Screen shell only. Build this UI to match the Stitch prototype:
        </p>
        <code className="block mt-3 text-sm bg-surface-container-highest rounded-xl px-3 py-2 text-on-surface-variant break-all">
          {stitchPath}
        </code>
      </div>
      <Link to="/app" className="inline-block mt-8 text-primary font-label font-semibold">
        ← Back to app
      </Link>
    </div>
  )
}
