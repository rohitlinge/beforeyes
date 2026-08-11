import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AppHeader } from '@/components/AppHeader'
import { GateScreen } from '@/components/GateScreen'
import { PageLoader } from '@/components/PageLoader'
import { useAuth } from '@/features/auth/AuthProvider'
import { useRoom } from '@/features/lobby/useRoom'
import { resolveCompatibilityIfReady } from '@/features/agreements/api'

/** Waiting / redirect hub after ratings — score is calculated from Agree/Disagree. */
export function VerdictPage() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { room, loading, error: roomError } = useRoom(roomId)

  const isMember = Boolean(user && room?.memberIds.includes(user.uid))
  const isA = Boolean(user && room && room.partnerA === user.uid)
  const iSubmitted = isA
    ? room?.partnerAAgreementsSubmitted
    : room?.partnerBAgreementsSubmitted
  const partnerSubmitted = isA
    ? room?.partnerBAgreementsSubmitted
    : room?.partnerAAgreementsSubmitted

  useEffect(() => {
    if (!room || !roomId) return
    if (room.compatibilityScore != null) {
      navigate(`/room/${roomId}/result`, { replace: true })
      return
    }
    if (!iSubmitted) {
      navigate(`/room/${roomId}/review`, { replace: true })
    }
  }, [room, roomId, iSubmitted, navigate])

  useEffect(() => {
    if (!roomId || !room) return
    if (
      room.partnerAAgreementsSubmitted &&
      room.partnerBAgreementsSubmitted &&
      room.compatibilityScore == null
    ) {
      void resolveCompatibilityIfReady(roomId).catch(() => undefined)
    }
  }, [room, roomId])

  if (loading) {
    return <PageLoader message="Checking alignment score…" />
  }

  if (room?.status === 'closed') {
    return (
      <GateScreen
        title="This room is closed"
        description="The session ended before the score was ready."
      />
    )
  }

  if (roomError || !room || !user || !isMember) {
    return (
      <GateScreen
        title="Score unavailable"
        description={roomError ?? 'Finish rating answers first.'}
      />
    )
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-on-background">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-40">
        <div className="absolute top-[-10%] left-[-10%] h-[50vw] w-[50vw] rounded-full bg-primary-container/50 opacity-60 blur-[120px]" />
        <div className="absolute right-[-10%] bottom-[-10%] h-[60vw] w-[60vw] rounded-full bg-primary-fixed opacity-50 blur-[140px]" />
      </div>

      <AppHeader room={room} uid={user.uid} transparent />

      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-margin-mobile py-10 pb-24 md:px-8">
        <div className="relative flex w-full flex-col items-center gap-6 overflow-hidden rounded-[32px] border border-primary/5 bg-background/70 p-6 text-center shadow-[0_24px_48px_-12px_rgba(22,105,101,0.08)] backdrop-blur-xl md:p-12">
          <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-primary-container text-on-primary-container shadow-inner md:h-20 md:w-20">
            <span className="material-symbols-outlined text-4xl" aria-hidden>
              percent
            </span>
          </div>
          <h1 className="font-headline text-2xl font-semibold tracking-tight text-on-surface sm:text-3xl">
            Calculating how aligned you are…
          </h1>
          <p className="max-w-md text-on-surface-variant">
            {partnerSubmitted
              ? 'Both of you finished rating. Your shared compatibility percentage is almost ready.'
              : 'Your Agree / Disagree ratings are in. Waiting for your partner to finish theirs.'}
          </p>
          <Link
            to={`/room/${room.roomId}/review`}
            className="font-label text-sm font-semibold text-primary"
          >
            ← Back to review
          </Link>
        </div>
      </main>
    </div>
  )
}
