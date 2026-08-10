import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AppHeader } from '@/components/AppHeader'
import { GateScreen } from '@/components/GateScreen'
import { InlineError } from '@/components/InlineError'
import { PageLoader } from '@/components/PageLoader'
import { useAuth } from '@/features/auth/AuthProvider'
import { useRoom } from '@/features/lobby/useRoom'
import {
  resolveVerdictIfReady,
  submitVerdict,
  subscribeMyVerdict,
  type VerdictChoice,
} from '@/features/verdict/api'

export function VerdictPage() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { room, loading, error: roomError } = useRoom(roomId)
  const [myChoice, setMyChoice] = useState<VerdictChoice | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isMember = Boolean(user && room?.memberIds.includes(user.uid))
  const isA = Boolean(user && room && room.partnerA === user.uid)
  const iSubmitted = isA
    ? room?.partnerAVerdictSubmitted
    : room?.partnerBVerdictSubmitted
  const partnerSubmitted = isA
    ? room?.partnerBVerdictSubmitted
    : room?.partnerAVerdictSubmitted

  useEffect(() => {
    if (!roomId || !user) return
    return subscribeMyVerdict(roomId, user.uid, setMyChoice, (err) =>
      setError(err.message),
    )
  }, [roomId, user])

  useEffect(() => {
    if (!room?.result || !roomId) return
    if (room.status === 'result_revealed' || room.result) {
      navigate(`/room/${roomId}/result`, { replace: true })
    }
  }, [room, roomId, navigate])

  useEffect(() => {
    if (!roomId || !room) return
    if (room.partnerAVerdictSubmitted && room.partnerBVerdictSubmitted && !room.result) {
      void resolveVerdictIfReady(roomId).catch(() => undefined)
    }
  }, [room, roomId])

  async function onChoose(choice: VerdictChoice) {
    if (!room || !user || submitting || iSubmitted) return
    setSubmitting(true)
    setError(null)
    try {
      await submitVerdict({ room, uid: user.uid, choice })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit verdict.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <PageLoader message="Opening verdict…" />
  }

  if (room?.status === 'closed') {
    return (
      <GateScreen
        title="This room is closed"
        description="The session ended before the verdict."
      />
    )
  }

  if (roomError || !room || !user || !isMember) {
    return (
      <GateScreen
        title="Verdict unavailable"
        description={roomError ?? 'Finish reviewing answers first.'}
      />
    )
  }

  if (
    room.status !== 'answers_exchanged' &&
    room.status !== 'verdict_pending' &&
    room.status !== 'result_revealed'
  ) {
    return (
      <GateScreen
        title="Not ready for verdict"
        description="Exchange answers and review them before deciding."
        actionLabel="← Back to review"
        actionTo={`/room/${room.roomId}/review`}
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
        <div className="relative flex w-full flex-col items-center gap-8 overflow-hidden rounded-[32px] border border-primary/5 bg-background/70 p-6 text-center shadow-[0_24px_48px_-12px_rgba(22,105,101,0.08)] backdrop-blur-xl md:p-12">
          <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-primary-container text-on-primary-container shadow-inner md:h-20 md:w-20">
            <span className="material-symbols-outlined text-4xl" aria-hidden>
              how_to_reg
            </span>
          </div>

          <div className="flex max-w-2xl flex-col gap-4">
            <h1 className="font-headline text-2xl font-semibold tracking-tight text-on-surface sm:text-3xl">
              You’ve both read each other’s answers. Now, how do you feel about
              moving forward?
            </h1>
            <p className="mx-auto inline-flex items-center justify-center gap-2 rounded-full border border-outline-variant/30 bg-surface-container-low px-4 py-2 text-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px]" aria-hidden>
                lock
              </span>
              Your choice is private. You’ll only see a match if you both choose
              YES.
            </p>
          </div>

          {iSubmitted ? (
            <div className="w-full rounded-2xl border border-outline-variant/30 bg-surface-container-low px-6 py-8">
              <p className="font-headline text-xl font-semibold text-on-surface">
                Verdict submitted
              </p>
              <p className="mt-2 text-on-surface-variant">
                You chose{' '}
                <span className="font-semibold text-primary">
                  {myChoice === 'yes' ? 'YES' : myChoice === 'no' ? 'NO' : '—'}
                </span>
                . This stays private.
              </p>
              <p className="mt-4 text-sm text-on-surface-variant">
                {partnerSubmitted
                  ? 'Partner has voted — revealing result…'
                  : 'Waiting for your partner to vote…'}
              </p>
            </div>
          ) : (
            <div className="mt-2 grid w-full grid-cols-1 gap-4 md:grid-cols-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => void onChoose('yes')}
                className="group relative flex min-h-[7rem] flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl bg-primary p-6 text-on-primary shadow-[0_8px_20px_-4px_rgba(22,105,101,0.25)] transition-all duration-300 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-container disabled:opacity-60"
              >
                <span className="font-headline text-2xl tracking-wide">YES</span>
                <span className="text-xs font-normal opacity-90">
                  I’m ready to move forward
                </span>
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void onChoose('no')}
                className="group flex min-h-[7rem] flex-col items-center justify-center gap-1 rounded-2xl border border-outline-variant/40 bg-surface-container p-6 text-on-surface transition-all duration-300 hover:-translate-y-1 hover:bg-surface-container-high focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-surface-variant disabled:opacity-60"
              >
                <span className="font-headline text-2xl text-on-surface-variant group-hover:text-on-surface">
                  NO
                </span>
                <span className="text-xs font-normal text-on-surface-variant opacity-80">
                  Not the right fit for me right now
                </span>
              </button>
            </div>
          )}

          <InlineError message={error} />

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
