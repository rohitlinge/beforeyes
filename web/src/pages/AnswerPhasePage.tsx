import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppHeader } from '@/components/AppHeader'
import { GateScreen } from '@/components/GateScreen'
import { InlineError } from '@/components/InlineError'
import { PageLoader } from '@/components/PageLoader'
import { StickyCtaBar } from '@/components/StickyCtaBar'
import { useAuth } from '@/features/auth/AuthProvider'
import { useRoom } from '@/features/lobby/useRoom'
import { subscribeExchangedQuestions } from '@/features/questions/api'
import type { QuestionItem } from '@/features/questions/decks'
import {
  deliverMyAnswersIfReady,
  savePrivateAnswers,
  setAnswersReady,
  subscribePrivateAnswers,
  type AnswerItem,
} from '@/features/answers/api'

export function AnswerPhasePage() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { room, loading: roomLoading, error: roomError } = useRoom(roomId)

  const [partnerQuestions, setPartnerQuestions] = useState<QuestionItem[] | null>(
    null,
  )
  const [answers, setAnswers] = useState<AnswerItem[]>([])
  const [ready, setReady] = useState(false)
  const [index, setIndex] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  const isPartnerA = Boolean(user && room && room.partnerA === user.uid)
  const isMember = Boolean(user && room?.memberIds.includes(user.uid))

  const partnerName = useMemo(() => {
    if (!room || !user) return 'your partner'
    return isPartnerA
      ? room.partnerBDisplayName ?? 'your partner'
      : room.partnerADisplayName
  }, [room, user, isPartnerA])

  const partnerReady = isPartnerA
    ? room?.partnerBReadyAnswers
    : room?.partnerAReadyAnswers

  const bothReady = Boolean(
    room?.partnerAReadyAnswers && room?.partnerBReadyAnswers,
  )

  useEffect(() => {
    if (!roomId || !user) return
    return subscribeExchangedQuestions(
      roomId,
      user.uid,
      (questions) => setPartnerQuestions(questions),
      (err) => setError(err.message),
    )
  }, [roomId, user])

  useEffect(() => {
    if (!roomId || !user) return
    return subscribePrivateAnswers(
      roomId,
      user.uid,
      (next, nextReady) => {
        setAnswers(next)
        setReady(nextReady)
        setLoaded(true)
      },
      (err) => setError(err.message),
    )
  }, [roomId, user])

  useEffect(() => {
    if (!room || !user || !loaded || !partnerQuestions) return
    if (answers.length > 0) return
    if (partnerQuestions.length === 0) return
    const seeded = partnerQuestions.map((q) => ({
      questionId: q.id,
      questionText: q.text,
      text: '',
    }))
    setAnswers(seeded)
  }, [room, user, loaded, partnerQuestions, answers.length])

  useEffect(() => {
    if (!room || !user || !loaded) return
    if (!bothReady || !ready) return
    void deliverMyAnswersIfReady({
      room,
      uid: user.uid,
      answers,
    }).catch((err) => {
      setError(err instanceof Error ? err.message : 'Exchange failed.')
    })
  }, [room, user, bothReady, ready, answers, loaded])

  useEffect(() => {
    if (!room || !roomId) return
    if (
      room.status === 'answers_exchanged' ||
      room.status === 'verdict_pending' ||
      room.status === 'result_revealed'
    ) {
      navigate(`/room/${roomId}/review`, { replace: true })
    }
  }, [room, roomId, navigate])

  const total = partnerQuestions?.length ?? 0
  const current = answers[index]
  const answeredCount = answers.filter((a) => a.text.trim()).length
  const allAnswered = total > 0 && answeredCount === total

  async function persistAnswers(next: AnswerItem[], nextReady = ready) {
    if (!room || !user) return
    setSaving(true)
    setError(null)
    try {
      await savePrivateAnswers({
        roomId: room.roomId,
        uid: user.uid,
        isPartnerA,
        answers: next,
        ready: nextReady,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save answers.')
    } finally {
      setSaving(false)
    }
  }

  async function updateCurrentText(text: string) {
    const next = answers.map((a, i) => (i === index ? { ...a, text } : a))
    setAnswers(next)
  }

  async function toggleReady() {
    if (!room || !user) return
    setSaving(true)
    setError(null)
    try {
      const nextReady = !ready
      await setAnswersReady({
        room,
        uid: user.uid,
        answers,
        expectedCount: total,
        ready: nextReady,
      })
      setReady(nextReady)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update ready state.')
    } finally {
      setSaving(false)
    }
  }

  if (roomLoading || !loaded) {
    return <PageLoader message="Loading answers…" />
  }

  if (room?.status === 'closed') {
    return (
      <GateScreen
        title="This room is closed"
        description="The session ended before answers were finished."
      />
    )
  }

  if (roomError || !room || !user || !isMember) {
    return (
      <GateScreen
        title="Answers unavailable"
        description={roomError ?? 'Finish the question exchange first.'}
      />
    )
  }

  if (
    room.status !== 'answering' &&
    room.status !== 'answers_ready' &&
    room.status !== 'questions_exchanged'
  ) {
    if (
      room.status === 'questions_building' ||
      room.status === 'questions_ready' ||
      room.status === 'waiting_partner'
    ) {
      return (
        <GateScreen
          title="Questions first"
          description="Complete the question exchange before answering."
          actionLabel="← Back to questions"
          actionTo={`/room/${room.roomId}/questions`}
        />
      )
    }
  }

  if (partnerQuestions === null) {
    return <PageLoader message="Waiting for your partner’s questions…" />
  }

  if (partnerQuestions.length === 0) {
    return (
      <GateScreen
        title="No questions to answer"
        description="Your partner didn’t add any questions."
      />
    )
  }

  return (
    <div className="min-h-screen bg-background text-on-background">
      <AppHeader room={room} uid={user.uid} />

      <main className="mx-auto flex w-full max-w-3xl flex-col items-center px-margin-mobile pb-44 pt-6 md:px-8">
        <div className="mb-6 flex items-center gap-3 rounded-full bg-primary-fixed px-5 py-3 text-on-primary-fixed shadow-sm">
          <span className="material-symbols-outlined text-[20px]" aria-hidden>
            lock
          </span>
          <span className="font-label text-sm font-semibold">
            Your answers are private until you both finish.
          </span>
        </div>

        <div className="mb-8 flex w-full flex-col items-center">
          <span className="mb-4 font-label text-sm font-semibold uppercase tracking-widest text-on-surface-variant">
            Question {Math.min(index + 1, total)} of {total}
          </span>
          <div className="flex flex-wrap items-center justify-center gap-1">
            {partnerQuestions.map((q, i) => {
              const filled = Boolean(answers[i]?.text.trim())
              const active = i === index
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  className="flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  aria-label={`Go to question ${i + 1}`}
                >
                  <span
                    className={`rounded-full transition-all ${
                      active
                        ? 'h-4 w-4 bg-primary ring-4 ring-primary/20'
                        : filled
                          ? 'h-3 w-3 bg-primary-container'
                          : 'h-3 w-3 bg-surface-variant'
                    }`}
                  />
                </button>
              )
            })}
          </div>
        </div>

        {current && (
          <div className="w-full rounded-xl border border-surface-variant bg-surface-container-lowest p-6 ambient-shadow md:p-10">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
                <span className="material-symbols-outlined text-[22px]" aria-hidden>
                  partner_exchange
                </span>
              </div>
              <div>
                <h1 className="font-headline text-xl font-semibold leading-tight text-on-surface sm:text-2xl">
                  “{current.questionText}”
                </h1>
                <p className="mt-2 text-sm italic text-on-surface-variant">
                  Asked by {partnerName}
                </p>
              </div>
            </div>

            <label
              htmlFor="answer-input"
              className="mt-8 mb-3 block font-label text-sm font-semibold text-on-surface"
            >
              Your thoughts
            </label>
            <textarea
              id="answer-input"
              rows={6}
              disabled={ready}
              value={current.text}
              onChange={(e) => void updateCurrentText(e.target.value)}
              onBlur={() => void persistAnswers(answers)}
              placeholder="Take your time. Be honest and gentle…"
              className="w-full resize-none rounded-xl border-none bg-surface-container p-5 text-on-surface outline-none placeholder:text-outline focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
            />
            <p className="mt-1 mr-2 text-right text-xs text-outline">
              {current.text.trim().split(/\s+/).filter(Boolean).length} words
            </p>

            <div className="mt-6 flex items-center justify-between border-t border-surface-variant pt-6">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => {
                  void persistAnswers(answers)
                  setIndex((i) => Math.max(0, i - 1))
                }}
                className="inline-flex min-h-11 items-center gap-1 rounded-full px-4 py-2 font-label text-sm font-semibold text-on-surface-variant disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden>
                  arrow_back
                </span>
                Previous
              </button>
              {index < total - 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    void persistAnswers(answers)
                    setIndex((i) => Math.min(total - 1, i + 1))
                  }}
                  className="inline-flex min-h-11 items-center gap-1 rounded-full bg-primary px-5 py-2.5 font-label text-sm font-semibold text-on-primary"
                >
                  Next
                  <span className="material-symbols-outlined text-[18px]" aria-hidden>
                    arrow_forward
                  </span>
                </button>
              ) : (
                <span className="font-label text-sm font-semibold text-primary">
                  {allAnswered ? 'All answered' : `${answeredCount}/${total} done`}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="mt-8 w-full rounded-2xl border border-surface-variant bg-surface p-5">
          <div className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-surface-container-high font-semibold text-primary">
              {partnerName.slice(0, 1).toUpperCase()}
              <span
                className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-surface ${
                  partnerReady ? 'bg-primary' : 'bg-outline-variant'
                }`}
              />
            </div>
            <p className="text-sm text-on-surface-variant">
              {partnerReady
                ? `${partnerName} is ready to exchange answers.`
                : `${partnerName} is still answering…`}
            </p>
          </div>
          {bothReady && (
            <p className="mt-3 text-sm font-semibold text-primary">
              Both ready — exchanging privately…
            </p>
          )}
          <InlineError message={error} />
        </div>
      </main>

      <StickyCtaBar>
        <button
          type="button"
          disabled={saving || (ready && bothReady) || (!ready && !allAnswered)}
          onClick={() => void toggleReady()}
          className={`w-full min-h-12 rounded-full py-4 font-label text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50 ${
            ready ? 'bg-tertiary text-on-tertiary' : 'bg-primary text-on-primary'
          }`}
        >
          {ready ? 'Ready — tap to undo' : 'Ready to exchange answers'}
        </button>
      </StickyCtaBar>
    </div>
  )
}
