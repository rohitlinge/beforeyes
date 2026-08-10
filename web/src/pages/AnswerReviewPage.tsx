import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppHeader } from '@/components/AppHeader'
import { EmptyState } from '@/components/EmptyState'
import { GateScreen } from '@/components/GateScreen'
import { InlineError } from '@/components/InlineError'
import { PageLoader } from '@/components/PageLoader'
import { StickyCtaBar } from '@/components/StickyCtaBar'
import { useAuth } from '@/features/auth/AuthProvider'
import { useRoom } from '@/features/lobby/useRoom'
import {
  subscribePrivateAnswers,
  subscribeExchangedAnswers,
  type AnswerItem,
} from '@/features/answers/api'

export function AnswerReviewPage() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { room, loading: roomLoading, error: roomError } = useRoom(roomId)

  const [myAnswers, setMyAnswers] = useState<AnswerItem[]>([])
  const [partnerAnswers, setPartnerAnswers] = useState<AnswerItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isPartnerA = Boolean(user && room && room.partnerA === user.uid)
  const partnerName = useMemo(() => {
    if (!room || !user) return 'Partner'
    return isPartnerA
      ? room.partnerBDisplayName ?? 'Partner'
      : room.partnerADisplayName
  }, [room, user, isPartnerA])

  useEffect(() => {
    if (!roomId || !user) return
    return subscribePrivateAnswers(roomId, user.uid, (answers) => {
      setMyAnswers(answers)
    })
  }, [roomId, user])

  useEffect(() => {
    if (!roomId || !user) return
    return subscribeExchangedAnswers(
      roomId,
      user.uid,
      (answers) => setPartnerAnswers(answers),
      (err) => setError(err.message),
    )
  }, [roomId, user])

  if (roomLoading) {
    return <PageLoader message="Loading review…" />
  }

  if (room?.status === 'closed') {
    return (
      <GateScreen
        title="This room is closed"
        description="The session ended before review."
      />
    )
  }

  if (roomError || !room || !user) {
    return (
      <GateScreen
        title="Review unavailable"
        description={roomError ?? 'Exchange answers first.'}
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
        title="Not ready to review yet"
        description="Both partners need to finish and exchange answers first."
        actionLabel="← Back to answers"
        actionTo={`/room/${room.roomId}/answers`}
      />
    )
  }

  return (
    <div className="min-h-screen bg-background text-on-background">
      <AppHeader room={room} uid={user.uid} />

      <main className="mx-auto max-w-3xl px-margin-mobile py-8 pb-40 md:px-8">
        <h1 className="font-display text-3xl font-bold tracking-tight text-on-surface">
          Read together, then decide
        </h1>
        <p className="mt-2 leading-relaxed text-on-surface-variant">
          Take in what you both wrote. When you’re ready, continue to the private
          verdict — your choice stays hidden until you both vote.
        </p>

        <div className="mt-4">
          <InlineError message={error} />
        </div>

        <section className="mt-8">
          <h2 className="font-headline text-lg font-semibold text-on-surface">
            {partnerName}’s answers to your questions
          </h2>
          {partnerAnswers === null ? (
            <p className="mt-3 text-sm text-on-surface-variant">Loading…</p>
          ) : partnerAnswers.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="No answers yet"
                description="Waiting for your partner’s exchanged answers."
              />
            </div>
          ) : (
            <ul className="mt-4 flex flex-col gap-4">
              {partnerAnswers.map((item, i) => (
                <li
                  key={item.questionId}
                  className="rounded-[24px] border border-white/50 bg-surface-container p-5 ambient-shadow"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-outline">
                    Q{i + 1}
                  </p>
                  <p className="mt-1 font-semibold text-on-surface">
                    {item.questionText}
                  </p>
                  <p className="mt-3 whitespace-pre-wrap leading-relaxed text-on-surface-variant">
                    {item.text}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-10">
          <h2 className="font-headline text-lg font-semibold text-on-surface">
            Your answers to {partnerName}’s questions
          </h2>
          <ul className="mt-4 flex flex-col gap-4">
            {myAnswers.map((item, i) => (
              <li
                key={item.questionId}
                className="rounded-[24px] border border-outline-variant/30 bg-surface px-5 py-4"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-outline">
                  Q{i + 1}
                </p>
                <p className="mt-1 font-semibold text-on-surface">
                  {item.questionText}
                </p>
                <p className="mt-3 whitespace-pre-wrap leading-relaxed text-on-surface-variant">
                  {item.text}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <StickyCtaBar>
        <button
          type="button"
          onClick={() => navigate(`/room/${room.roomId}/verdict`)}
          className="flex w-full min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 font-label font-semibold text-on-primary shadow-[0_8px_20px_-6px_rgba(22,105,101,0.4)]"
        >
          Continue to verdict
          <span className="material-symbols-outlined text-[20px]" aria-hidden>
            arrow_forward
          </span>
        </button>
      </StickyCtaBar>
    </div>
  )
}
