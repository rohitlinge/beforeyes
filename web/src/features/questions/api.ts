import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions, isFirebaseConfigured } from '@/lib/firebase'
import { trackEvent } from '@/lib/analytics'
import type { Room } from '@/features/lobby/types'
import { newQuestionId, type QuestionItem } from '@/features/questions/decks'

function requireDb() {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase is not configured.')
  }
  return db
}

export function subscribePrivateQuestions(
  roomId: string,
  uid: string,
  onData: (questions: QuestionItem[], ready: boolean) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const firestore = requireDb()
  return onSnapshot(
    doc(firestore, 'rooms', roomId, 'privateQuestions', uid),
    (snap) => {
      if (!snap.exists()) {
        onData([], false)
        return
      }
      const data = snap.data()
      const questions = Array.isArray(data.questions)
        ? (data.questions as QuestionItem[])
        : []
      onData(questions, Boolean(data.ready))
    },
    (error) => onError?.(error),
  )
}

export function subscribeExchangedQuestions(
  roomId: string,
  uid: string,
  onData: (questions: QuestionItem[] | null) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const firestore = requireDb()
  return onSnapshot(
    doc(firestore, 'rooms', roomId, 'exchangedQuestions', uid),
    (snap) => {
      if (!snap.exists()) {
        onData(null)
        return
      }
      const data = snap.data()
      onData(
        Array.isArray(data.questions) ? (data.questions as QuestionItem[]) : [],
      )
    },
    (error) => onError?.(error),
  )
}

export async function savePrivateQuestions(input: {
  roomId: string
  uid: string
  isPartnerA: boolean
  questions: QuestionItem[]
  ready?: boolean
}): Promise<void> {
  const firestore = requireDb()
  await setDoc(
    doc(firestore, 'rooms', input.roomId, 'privateQuestions', input.uid),
    {
      uid: input.uid,
      questions: input.questions,
      ready: Boolean(input.ready),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )

  await updateDoc(doc(firestore, 'rooms', input.roomId), {
    ...(input.isPartnerA
      ? { partnerAQuestionCount: input.questions.length }
      : { partnerBQuestionCount: input.questions.length }),
    updatedAt: serverTimestamp(),
  })
}

export async function setQuestionsReady(input: {
  room: Room
  uid: string
  questions: QuestionItem[]
  ready: boolean
}): Promise<void> {
  if (input.ready && input.questions.length === 0) {
    throw new Error('Add at least one question before marking ready.')
  }

  const firestore = requireDb()
  const { room, uid, questions, ready } = input
  const isA = room.partnerA === uid

  await setDoc(
    doc(firestore, 'rooms', room.roomId, 'privateQuestions', uid),
    {
      uid,
      questions,
      ready,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )

  await updateDoc(doc(firestore, 'rooms', room.roomId), {
    ...(isA
      ? {
          partnerAReadyQuestions: ready,
          partnerAQuestionCount: questions.length,
          ...(ready ? {} : { partnerAQuestionsDelivered: false }),
        }
      : {
          partnerBReadyQuestions: ready,
          partnerBQuestionCount: questions.length,
          ...(ready ? {} : { partnerBQuestionsDelivered: false }),
        }),
    status: ready ? 'questions_ready' : 'questions_building',
    updatedAt: serverTimestamp(),
  })
}

/**
 * Prefer Cloud Function exchange; fall back to client inbox writes until Blaze.
 */
export async function deliverMyQuestionsIfReady(input: {
  room: Room
  uid: string
  questions: QuestionItem[]
}): Promise<void> {
  const { room, uid, questions } = input
  if (!room.partnerB) return
  if (!room.partnerAReadyQuestions || !room.partnerBReadyQuestions) return
  if (questions.length === 0) return
  if (room.partnerAQuestionsDelivered && room.partnerBQuestionsDelivered) return
  if (room.status === 'answering' || room.status === 'questions_exchanged') return

  if (functions) {
    try {
      const call = httpsCallable<{ roomId: string }, { ok: boolean }>(
        functions,
        'exchangeQuestions',
      )
      await call({ roomId: room.roomId })
      trackEvent('questions_exchanged', { room_id: room.roomId })
      return
    } catch {
      // Fall through to client path until Functions are deployed (Blaze).
    }
  }

  const isA = room.partnerA === uid
  const alreadyDelivered = isA
    ? room.partnerAQuestionsDelivered
    : room.partnerBQuestionsDelivered

  const firestore = requireDb()
  const roomRef = doc(firestore, 'rooms', room.roomId)

  if (!alreadyDelivered) {
    const partnerUid = isA ? room.partnerB : room.partnerA
    await setDoc(
      doc(firestore, 'rooms', room.roomId, 'exchangedQuestions', partnerUid),
      {
        fromUid: uid,
        questions,
        exchangedAt: serverTimestamp(),
      },
    )

    await updateDoc(roomRef, {
      ...(isA
        ? { partnerAQuestionsDelivered: true }
        : { partnerBQuestionsDelivered: true }),
      updatedAt: serverTimestamp(),
    })
  }

  const fresh = await getDoc(roomRef)
  if (!fresh.exists()) return
  const data = fresh.data()
  const aDone = Boolean(data.partnerAQuestionsDelivered)
  const bDone = Boolean(data.partnerBQuestionsDelivered)
  const status = String(data.status)

  if (
    aDone &&
    bDone &&
    status !== 'answering' &&
    status !== 'questions_exchanged'
  ) {
    await updateDoc(roomRef, {
      status: 'answering',
      updatedAt: serverTimestamp(),
    })
    trackEvent('questions_exchanged', { room_id: room.roomId })
  }
}

export function createQuestion(text: string, source?: string): QuestionItem {
  return {
    id: newQuestionId(),
    text: text.trim(),
    source: source ?? 'custom',
  }
}
