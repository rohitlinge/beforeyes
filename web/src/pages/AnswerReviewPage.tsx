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
import {
  resolveCompatibilityIfReady,
  submitAgreements,
  subscribeMyAgreements,
  type AgreementChoice,
  type AgreementRating,
} from '@/features/agreements/api'

export function AnswerReviewPage() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { room, loading: roomLoading, error: roomError } = useRoom(roomId)

  const [myAnswers, setMyAnswers] = useState<AnswerItem[]>([])
  const [partnerAnswers, setPartnerAnswers] = useState<AnswerItem[] | null>(null)
  const [ratings, setRatings] = useState<Record<string, AgreementChoice>>({})
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const isPartnerA = Boolean(user && room && room.partnerA === user.uid)
  const partnerName = useMemo(() => {
    if (!room || !user) return 'Partner'
    return isPartnerA
      ? room.partnerBDisplayName ?? 'Partner'
      : room.partnerADisplayName
  }, [room, user, isPartnerA])

  const iSubmitted = Boolean(
    user &&
      room &&
      (isPartnerA
        ? room.partnerAAgreementsSubmitted
        : room.partnerBAgreementsSubmitted),
  )
  const partnerSubmitted = Boolean(
    room &&
      (isPartnerA
        ? room.partnerBAgreementsSubmitted
        : room.partnerAAgreementsSubmitted),
  )

  const allRated =
    partnerAnswers !== null &&
    partnerAnswers.length > 0 &&
    partnerAnswers.every((a) => ratings[a.questionId] === 'agree' || ratings[a.questionId] === 'disagree')

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

  useEffect(() => {
    if (!roomId || !user) return
    return subscribeMyAgreements(
      roomId,
      user.uid,
      (doc) => {
        if (!doc?.ratings?.length) return
        const next: Record<string, AgreementChoice> = {}
        for (const r of doc.ratings) {
          if (r.agreement === 'agree' || r.agreement === 'disagree') {
            next[r.questionId] = r.agreement
          }
        }
        setRatings(next)
      },
      (err) => setError(err.message),
    )
  }, [roomId, user])

  useEffect(() => {
    if (room?.compatibilityScore != null && roomId) {
      navigate(`/room/${roomId}/result`, { replace: true })
      return
    }
    if (iSubmitted && roomId && room?.compatibilityScore == null) {
      navigate(`/room/${roomId}/verdict`, { replace: true })
    }
  }, [room?.compatibilityScore, iSubmitted, roomId, navigate])

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

  function setRating(questionId: string, choice: AgreementChoice) {
    if (iSubmitted) return
    setRatings((prev) => ({ ...prev, [questionId]: choice }))
  }

  async function onSubmit() {
    if (!room || !user || !partnerAnswers || submitting || iSubmitted) return
    if (!allRated) {
      setError('Choose Agree or Disagree for every partner answer.')
      return
    }

    const payload: AgreementRating[] = partnerAnswers.map((item) => ({
      questionId: item.questionId,
      questionText: item.questionText,
      answerText: item.text,
      agreement: ratings[item.questionId],
    }))

    setSubmitting(true)
    setError(null)
    try {
      await submitAgreements({ room, uid: user.uid, ratings: payload })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not submit ratings.'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

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
          Read answers, then rate alignment
        </h1>
        <p className="mt-2 leading-relaxed text-on-surface-variant">
          Below each of {partnerName}’s answers, choose whether you Agree or
          Disagree. When you both finish, you’ll see how aligned you are as a
          percentage—not a blunt Yes/No.
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
              {partnerAnswers.map((item, i) => {
                const choice = ratings[item.questionId]
                return (
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

                    <div className="mt-5 border-t border-outline-variant/30 pt-4">
                      <p className="font-label text-sm font-semibold text-on-surface">
                        Are you agreed with this answer?
                      </p>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          disabled={iSubmitted}
                          onClick={() => setRating(item.questionId, 'agree')}
                          className={`min-h-11 rounded-full font-label text-sm font-semibold transition-colors disabled:opacity-60 ${
                            choice === 'agree'
                              ? 'bg-primary text-on-primary'
                              : 'border border-outline-variant bg-surface text-on-surface hover:bg-surface-container-high'
                          }`}
                        >
                          Agree
                        </button>
                        <button
                          type="button"
                          disabled={iSubmitted}
                          onClick={() => setRating(item.questionId, 'disagree')}
                          className={`min-h-11 rounded-full font-label text-sm font-semibold transition-colors disabled:opacity-60 ${
                            choice === 'disagree'
                              ? 'bg-on-surface text-surface'
                              : 'border border-outline-variant bg-surface text-on-surface hover:bg-surface-container-high'
                          }`}
                        >
                          Disagree
                        </button>
                      </div>
                      <p className="mt-3 text-xs leading-relaxed text-on-surface-variant">
                        Note: We don’t offer a Maybe option. Soft 50/50 agreement
                        often becomes a bigger issue later in a relationship—clear
                        Agree or Disagree keeps the score honest.
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className="mt-10">
          <h2 className="font-headline text-lg font-semibold text-on-surface">
            Your answers to {partnerName}’s questions
          </h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            For your reference—{partnerName} rates these on their side.
          </p>
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
        {iSubmitted ? (
          <div className="w-full rounded-2xl border border-outline-variant/40 bg-surface-container-low px-4 py-4 text-center">
            <p className="font-headline font-semibold text-on-surface">
              Ratings submitted
            </p>
            <p className="mt-1 text-sm text-on-surface-variant">
              {partnerSubmitted
                ? 'Partner finished too — calculating your alignment…'
                : 'Waiting for your partner to finish their Agree / Disagree ratings…'}
            </p>
          </div>
        ) : (
          <button
            type="button"
            disabled={!allRated || submitting}
            onClick={() => void onSubmit()}
            className="flex w-full min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 font-label font-semibold text-on-primary shadow-[0_8px_20px_-6px_rgba(22,105,101,0.4)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Submit ratings & see score'}
            <span className="material-symbols-outlined text-[20px]" aria-hidden>
              arrow_forward
            </span>
          </button>
        )}
      </StickyCtaBar>
    </div>
  )
}
