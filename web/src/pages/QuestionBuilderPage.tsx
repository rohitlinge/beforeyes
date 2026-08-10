import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AppHeader } from '@/components/AppHeader'
import { EmptyState } from '@/components/EmptyState'
import { GateScreen } from '@/components/GateScreen'
import { InlineError } from '@/components/InlineError'
import { PageLoader } from '@/components/PageLoader'
import { StickyCtaBar } from '@/components/StickyCtaBar'
import { useToast } from '@/components/Toast'
import { useAuth } from '@/features/auth/AuthProvider'
import { useRoom } from '@/features/lobby/useRoom'
import {
  createQuestion,
  deliverMyQuestionsIfReady,
  savePrivateQuestions,
  setQuestionsReady,
  subscribePrivateQuestions,
} from '@/features/questions/api'
import { subscribeDecks } from '@/features/questions/deckApi'
import {
  QUESTION_DECKS,
  type QuestionDeck,
  type QuestionItem,
} from '@/features/questions/decks'

export function QuestionBuilderPage() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { room, loading: roomLoading, error: roomError } = useRoom(roomId)
  const { pushToast } = useToast()

  const [decks, setDecks] = useState<QuestionDeck[]>(QUESTION_DECKS)
  const [questions, setQuestions] = useState<QuestionItem[]>([])
  const [ready, setReady] = useState(false)
  const [activeDeckId, setActiveDeckId] = useState(QUESTION_DECKS[0].id)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadedPrivate, setLoadedPrivate] = useState(false)

  const isPartnerA = Boolean(user && room && room.partnerA === user.uid)
  const isMember = Boolean(user && room?.memberIds.includes(user.uid))

  const partnerName = useMemo(() => {
    if (!room || !user) return 'Partner'
    return isPartnerA
      ? room.partnerBDisplayName ?? 'Partner'
      : room.partnerADisplayName
  }, [room, user, isPartnerA])

  const partnerReady = isPartnerA
    ? room?.partnerBReadyQuestions
    : room?.partnerAReadyQuestions
  const partnerCount = isPartnerA
    ? room?.partnerBQuestionCount ?? 0
    : room?.partnerAQuestionCount ?? 0
  const bothReady = Boolean(
    room?.partnerAReadyQuestions && room?.partnerBReadyQuestions,
  )

  useEffect(() => {
    return subscribeDecks(setDecks)
  }, [])

  useEffect(() => {
    if (decks.length === 0) return
    if (!decks.some((d) => d.id === activeDeckId)) {
      setActiveDeckId(decks[0].id)
    }
  }, [decks, activeDeckId])

  useEffect(() => {
    if (!roomId || !user) return
    setLoadedPrivate(false)
    return subscribePrivateQuestions(
      roomId,
      user.uid,
      (next, nextReady) => {
        setQuestions(next)
        setReady(nextReady)
        setLoadedPrivate(true)
      },
      (err) => setError(err.message),
    )
  }, [roomId, user])

  useEffect(() => {
    if (!room || !user || !loadedPrivate) return
    if (!bothReady || ready === false) return
    void deliverMyQuestionsIfReady({
      room,
      uid: user.uid,
      questions,
    }).catch((err) => {
      setError(err instanceof Error ? err.message : 'Exchange failed.')
    })
  }, [room, user, bothReady, ready, questions, loadedPrivate])

  useEffect(() => {
    if (!room || !roomId) return
    if (room.status === 'answering' || room.status === 'questions_exchanged') {
      navigate(`/room/${roomId}/answers`, { replace: true })
    }
  }, [room, roomId, navigate])

  async function persist(next: QuestionItem[], nextReady = ready) {
    if (!room || !user) return
    setSaving(true)
    setError(null)
    try {
      await savePrivateQuestions({
        roomId: room.roomId,
        uid: user.uid,
        isPartnerA,
        questions: next,
        ready: nextReady,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save questions.')
    } finally {
      setSaving(false)
    }
  }

  function addQuestion(text: string, source?: string) {
    const trimmed = text.trim()
    if (!trimmed) return
    if (questions.some((q) => q.text.toLowerCase() === trimmed.toLowerCase())) {
      pushToast('That question is already on your list.', 'error')
      return
    }
    const next = [...questions, createQuestion(trimmed, source)]
    setQuestions(next)
    setDraft('')
    void persist(next)
  }

  function removeQuestion(id: string) {
    if (ready) return
    const next = questions.filter((q) => q.id !== id)
    setQuestions(next)
    void persist(next)
  }

  async function toggleReady() {
    if (!room || !user) return
    if (!ready && questions.length === 0) {
      pushToast('Add at least one question before marking ready.', 'error')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const nextReady = !ready
      await setQuestionsReady({
        room,
        uid: user.uid,
        questions,
        ready: nextReady,
      })
      setReady(nextReady)
      pushToast(
        nextReady
          ? 'You’re marked ready. Waiting for your partner…'
          : 'Ready undone — keep editing.',
        'success',
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update ready state.')
    } finally {
      setSaving(false)
    }
  }

  if (roomLoading || !loadedPrivate) {
    return <PageLoader message="Opening private builder…" />
  }

  if (roomError || !room || !user || !isMember) {
    return (
      <GateScreen
        title="Builder unavailable"
        description={
          roomError ?? 'Join the lobby first, then start the question phase.'
        }
      />
    )
  }

  if (room.status === 'closed') {
    return (
      <GateScreen
        title="This room is closed"
        description="The session ended before questions were finished. Start a new room anytime."
      />
    )
  }

  if (room.status === 'waiting_partner' || !room.partnerB) {
    return (
      <GateScreen
        title="Waiting for your partner"
        description="Both of you need to be in the lobby before building questions."
        actionLabel="← Back to lobby"
        actionTo={`/room/${room.roomId}/lobby`}
      />
    )
  }

  const activeDeck = decks.find((d) => d.id === activeDeckId) ?? decks[0]

  return (
    <div className="min-h-screen bg-background text-on-background">
      <AppHeader room={room} uid={user.uid} />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-margin-mobile py-8 pb-44 lg:flex-row md:px-8">
        <div className="flex min-w-0 flex-1 flex-col gap-8">
          <section>
            <div className="mb-2 flex items-center gap-2 text-outline">
              <span className="material-symbols-outlined text-[18px]" aria-hidden>
                lock
              </span>
              <span className="font-label text-xs font-semibold uppercase tracking-widest">
                Private space
              </span>
            </div>
            <h1 className="font-headline text-2xl font-semibold tracking-tight text-on-surface sm:text-3xl">
              Build Your Question List
            </h1>
            <p className="mt-2 max-w-2xl text-on-surface-variant">
              Pick from every starter deck or write your own. Nothing is locked —
              your partner won’t see these until you both choose to exchange.
            </p>
          </section>

          <section className="rounded-2xl border border-surface-variant bg-surface p-5 shadow-[0_20px_40px_-15px_rgba(22,105,101,0.05)] sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <h2 className="font-label text-sm font-semibold text-on-surface">
                Explore categories
              </h2>
              <p className="text-xs text-on-surface-variant">
                All decks open to everyone
              </p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {decks.map((deck) => {
                const active = deck.id === activeDeckId
                return (
                  <button
                    key={deck.id}
                    type="button"
                    onClick={() => setActiveDeckId(deck.id)}
                    disabled={ready}
                    className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 py-2.5 font-body text-sm transition-colors sm:px-5 ${
                      active
                        ? 'border-transparent bg-primary-container text-on-primary-container shadow-[0_4px_12px_rgba(95,168,163,0.2)]'
                        : 'border-outline-variant bg-surface-container text-on-surface hover:bg-surface-container-high'
                    } disabled:opacity-60`}
                  >
                    <span
                      className="material-symbols-outlined text-[18px]"
                      aria-hidden
                    >
                      {deck.icon}
                    </span>
                    {deck.title}
                  </button>
                )
              })}
            </div>
            <div className="mt-5 border-t border-surface-variant pt-5">
              <p className="font-label text-xs font-semibold text-on-surface-variant">
                Suggested {activeDeck.title} questions
              </p>
              {activeDeck.description ? (
                <p className="mt-1 text-sm text-on-surface-variant">
                  {activeDeck.description}
                </p>
              ) : null}
              <div className="mt-3 flex flex-col gap-2">
                {activeDeck.questions.map((text) => (
                  <div
                    key={text}
                    className="group flex items-start justify-between gap-3 rounded-xl p-2 transition-colors hover:bg-surface-container"
                  >
                    <p className="text-sm leading-relaxed text-on-surface group-hover:text-primary">
                      {text}
                    </p>
                    <button
                      type="button"
                      disabled={ready}
                      onClick={() => addQuestion(text, activeDeck.id)}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-outline hover:bg-surface-container-high hover:text-primary disabled:opacity-40"
                      aria-label="Add question"
                    >
                      <span className="material-symbols-outlined text-[22px]" aria-hidden>
                        add
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-transparent bg-surface-container p-5 focus-within:border-primary focus-within:bg-surface sm:p-6">
            <label
              htmlFor="custom-question"
              className="font-label text-sm font-semibold text-on-surface"
            >
              Add a custom question
            </label>
            <textarea
              id="custom-question"
              rows={3}
              disabled={ready}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="What's on your mind? e.g., How do we handle holiday visits between families?"
              className="mt-3 w-full resize-none border-none bg-transparent p-0 text-on-surface outline-none placeholder:text-outline disabled:opacity-60"
            />
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                disabled={ready || !draft.trim()}
                onClick={() => addQuestion(draft, 'custom')}
                className="min-h-11 rounded-full bg-primary px-6 py-2 font-label text-sm font-semibold text-on-primary shadow-[0_4px_12px_rgba(22,105,101,0.2)] disabled:opacity-50"
              >
                Add to list
              </button>
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-label text-sm font-semibold text-on-surface">
                Your selected questions
              </h2>
              <span className="rounded-full bg-secondary-container px-2 py-0.5 text-xs font-semibold text-on-secondary-container">
                {questions.length} added
              </span>
            </div>
            {questions.length === 0 ? (
              <EmptyState
                title="No questions yet"
                description="Add suggestions from any deck or write your own. Keep it focused — quality over quantity."
              />
            ) : (
              <ul className="flex flex-col gap-2">
                {questions.map((q, index) => (
                  <li
                    key={q.id}
                    className="flex items-start justify-between gap-3 rounded-xl border border-surface-variant bg-surface-container px-4 py-3"
                  >
                    <div>
                      <p className="text-xs font-semibold text-outline">
                        Q{index + 1}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-on-surface">
                        {q.text}
                      </p>
                    </div>
                    {!ready && (
                      <button
                        type="button"
                        onClick={() => removeQuestion(q.id)}
                        className="min-h-11 font-label text-xs font-semibold text-tertiary"
                      >
                        Remove
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="hidden w-full shrink-0 flex-col gap-4 lg:flex lg:w-[360px]">
          <div className="relative overflow-hidden rounded-2xl border border-surface-variant bg-surface-container-low p-5">
            <div className="absolute -mt-10 -mr-10 top-0 right-0 h-32 w-32 rounded-full bg-primary-fixed opacity-30 blur-3xl" />
            <h2 className="relative z-10 font-label text-sm font-semibold text-on-surface">
              Session status
            </h2>
            <div className="relative z-10 mt-4 flex items-center gap-4">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-full border-2 border-surface bg-surface-variant text-lg font-semibold text-outline">
                {partnerName.slice(0, 1).toUpperCase()}
                <span
                  className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-surface-container-low ${
                    partnerReady ? 'bg-primary' : 'bg-outline-variant'
                  }`}
                />
              </div>
              <div>
                <p className="text-sm text-on-surface">
                  {partnerReady
                    ? `${partnerName} is ready to exchange`
                    : `${partnerName} is still building their list…`}
                </p>
                <p className="mt-1 text-xs text-outline">
                  {partnerCount} question{partnerCount === 1 ? '' : 's'} added so
                  far
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center rounded-2xl border border-surface-variant bg-surface p-5 text-center shadow-[0_20px_40px_-15px_rgba(22,105,101,0.08)]">
            <div
              className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
                ready ? 'bg-tertiary-container/40' : 'bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-3xl text-primary">
                {ready ? 'hourglass_top' : 'sync'}
              </span>
            </div>
            <h2 className="font-headline text-xl font-semibold text-on-surface">
              Ready to exchange?
            </h2>
            <p className="mt-2 mb-4 text-sm leading-relaxed text-on-surface-variant">
              Once both of you mark as ready, your lists will be shared at the
              same time, and you can begin answering.
            </p>
            {bothReady && (
              <p className="mb-3 text-sm font-semibold text-primary">
                Both ready — exchanging privately…
              </p>
            )}
            <InlineError message={error} />
            <button
              type="button"
              disabled={saving || (bothReady && ready)}
              onClick={() => void toggleReady()}
              className={`mt-3 w-full rounded-full py-4 font-label text-sm font-semibold transition-all ${
                ready
                  ? 'bg-tertiary text-on-tertiary'
                  : 'bg-surface-variant text-on-surface-variant hover:bg-surface-dim'
              } disabled:opacity-60`}
            >
              {ready ? 'Ready — tap to undo' : 'Mark as ready'}
            </button>
            <Link
              to={`/room/${room.roomId}/lobby`}
              className="mt-4 font-label text-sm font-semibold text-primary"
            >
              ← Back to lobby
            </Link>
          </div>
        </aside>
      </main>

      <StickyCtaBar>
        <div className="mb-2 flex items-center gap-3 lg:hidden">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-high text-sm font-semibold text-primary">
            {partnerName.slice(0, 1).toUpperCase()}
            <span
              className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background ${
                partnerReady ? 'bg-primary' : 'bg-outline-variant'
              }`}
            />
          </div>
          <p className="text-xs text-on-surface-variant">
            {partnerReady
              ? `${partnerName} is ready`
              : `${partnerName} still building…`}
          </p>
        </div>
        <button
          type="button"
          disabled={saving || (bothReady && ready)}
          onClick={() => void toggleReady()}
          className={`w-full min-h-12 rounded-full py-4 font-label text-sm font-semibold transition-all disabled:opacity-60 ${
            ready ? 'bg-tertiary text-on-tertiary' : 'bg-primary text-on-primary'
          }`}
        >
          {ready ? 'Ready — tap to undo' : 'Mark as ready'}
        </button>
      </StickyCtaBar>
    </div>
  )
}
