import { collection, onSnapshot, orderBy, query, type Unsubscribe } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '@/lib/firebase'
import { QUESTION_DECKS, type QuestionDeck } from '@/features/questions/decks'

function mapDeck(id: string, data: Record<string, unknown>): QuestionDeck | null {
  const title = String(data.title ?? '').trim()
  const questions = Array.isArray(data.questions)
    ? data.questions.map((q) => String(q)).filter(Boolean)
    : []
  if (!title || questions.length === 0) return null

  return {
    id,
    title,
    description: String(data.description ?? ''),
    icon: String(data.icon ?? 'help'),
    order: Number(data.order ?? 99),
    questions,
  }
}

/**
 * Prefer Firestore starter decks when available; fall back to local `QUESTION_DECKS`.
 * All decks are unlocked — no premium filtering.
 */
export function subscribeDecks(
  onData: (decks: QuestionDeck[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  if (!isFirebaseConfigured || !db) {
    onData(QUESTION_DECKS)
    return () => undefined
  }

  const q = query(collection(db, 'questionDecks'), orderBy('order', 'asc'))
  return onSnapshot(
    q,
    (snap) => {
      const decks = snap.docs
        .map((d) => mapDeck(d.id, d.data()))
        .filter((d): d is QuestionDeck => Boolean(d))
      onData(decks.length > 0 ? decks : QUESTION_DECKS)
    },
    (error) => {
      onError?.(error)
      onData(QUESTION_DECKS)
    },
  )
}
