import { Link, useNavigate, useParams } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { AppHeader } from '@/components/AppHeader'
import { GateScreen } from '@/components/GateScreen'
import { PageLoader } from '@/components/PageLoader'
import { useToast } from '@/components/Toast'
import { useAuth } from '@/features/auth/AuthProvider'
import { useRoom } from '@/features/lobby/useRoom'
import { createRoom } from '@/features/lobby/api'
import { trackEvent } from '@/lib/analytics'

export function ResultPage() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { pushToast } = useToast()
  const { user, profile } = useAuth()
  const { room, loading, error } = useRoom(roomId)
  const trackedResult = useRef<string | null>(null)

  const isMatch = room?.result === 'match'
  const pairName =
    room && room.partnerB
      ? `${room.partnerADisplayName} & ${room.partnerBDisplayName}`
      : 'You both'

  useEffect(() => {
    if (!room?.result || !room.roomId) return
    const key = `${room.roomId}:${room.result}`
    if (trackedResult.current === key) return
    trackedResult.current = key
    trackEvent('verdict_revealed', { room_id: room.roomId })
    trackEvent(room.result === 'match' ? 'result_match' : 'result_no_match', {
      room_id: room.roomId,
    })
  }, [room?.result, room?.roomId])

  async function startAnother() {
    if (!user || !profile) return
    try {
      const next = await createRoom({
        uid: user.uid,
        displayName: profile.displayName,
        username: profile.username,
      })
      pushToast('New room ready.', 'success')
      navigate(`/room/${next.roomId}/lobby`)
    } catch (err) {
      pushToast(
        err instanceof Error ? err.message : 'Could not create a new room.',
        'error',
      )
    }
  }

  if (loading) {
    return <PageLoader message="Loading result…" />
  }

  if (error || !room || !room.result) {
    return (
      <GateScreen
        title="Result not ready"
        description={error ?? 'Both partners need to submit a verdict first.'}
        actionLabel="← Back to verdict"
        actionTo={roomId ? `/room/${roomId}/verdict` : '/app'}
      />
    )
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-on-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-55"
        style={{
          background:
            'radial-gradient(circle at 50% -20%, rgba(95,168,163,0.4) 0%, transparent 60%), radial-gradient(circle at 100% 120%, rgba(166,240,234,0.35) 0%, transparent 50%)',
        }}
      />

      <AppHeader room={room} uid={user?.uid} transparent />

      <main className="relative z-10 mx-auto flex min-h-[70vh] w-full max-w-2xl flex-col items-center justify-center px-margin-mobile py-12 pb-safe md:px-8">
        <div className="animate-fade-in-up flex w-full flex-col items-center rounded-3xl border border-outline-variant/30 bg-surface/70 p-8 text-center shadow-[0_20px_40px_-15px_rgba(22,105,101,0.08)] backdrop-blur-2xl md:p-12">
          {isMatch ? (
            <>
              <div className="relative mb-8 flex h-32 w-32 items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-primary-container opacity-50 blur-2xl" />
                <div className="relative z-10 flex items-center justify-center">
                  <div className="h-20 w-20 -translate-x-4 rounded-full border-[6px] border-primary mix-blend-multiply" />
                  <div className="h-20 w-20 translate-x-4 rounded-full border-[6px] border-primary-container mix-blend-multiply" />
                  <span
                    className="material-symbols-outlined absolute text-4xl text-tertiary"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                    aria-hidden
                  >
                    favorite
                  </span>
                </div>
              </div>
              <h1 className="font-display text-4xl font-bold tracking-tight text-primary sm:text-5xl">
                It’s a Match!
              </h1>
              <p className="mt-4 font-headline text-xl font-semibold text-on-surface sm:text-2xl">
                {pairName}, you both chose to move forward together.
              </p>
              <p className="mx-auto mt-4 max-w-lg text-lg leading-relaxed text-on-surface-variant">
                Taking this step shows honesty and care. You’ve navigated the hard
                questions—now enjoy the path ahead.
              </p>
            </>
          ) : (
            <>
              <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant">
                <span className="material-symbols-outlined text-5xl" aria-hidden>
                  radio_button_unchecked
                </span>
              </div>
              <h1 className="font-display text-4xl font-bold tracking-tight text-on-surface sm:text-5xl">
                No Match
              </h1>
              <p className="mt-4 font-headline text-xl font-semibold text-on-surface-variant">
                This isn’t the right fit to move forward right now.
              </p>
              <p className="mx-auto mt-4 max-w-lg text-lg leading-relaxed text-on-surface-variant">
                Clarity can be a kindness. The result is shared the same way for
                both of you—no public rejection, no blame in the app.
              </p>
            </>
          )}

          <div className="mt-10 flex w-full flex-col gap-3">
            <button
              type="button"
              onClick={() => void startAnother()}
              className="min-h-12 rounded-full bg-primary px-6 py-4 font-label font-semibold text-on-primary shadow-[0_8px_20px_-6px_rgba(22,105,101,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              Start another private room
            </button>
            <Link
              to="/app"
              className="min-h-11 rounded-full border border-outline-variant px-6 py-3 text-center font-label font-semibold text-on-surface"
            >
              Back to home
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
