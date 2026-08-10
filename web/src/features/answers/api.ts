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

export type AnswerItem = {
  questionId: string
  questionText: string
  text: string
}

function requireDb() {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase is not configured.')
  }
  return db
}

export function subscribePrivateAnswers(
  roomId: string,
  uid: string,
  onData: (answers: AnswerItem[], ready: boolean) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const firestore = requireDb()
  return onSnapshot(
    doc(firestore, 'rooms', roomId, 'privateAnswers', uid),
    (snap) => {
      if (!snap.exists()) {
        onData([], false)
        return
      }
      const data = snap.data()
      onData(
        Array.isArray(data.answers) ? (data.answers as AnswerItem[]) : [],
        Boolean(data.ready),
      )
    },
    (error) => onError?.(error),
  )
}

export function subscribeExchangedAnswers(
  roomId: string,
  uid: string,
  onData: (answers: AnswerItem[] | null, fromUid: string | null) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const firestore = requireDb()
  return onSnapshot(
    doc(firestore, 'rooms', roomId, 'exchangedAnswers', uid),
    (snap) => {
      if (!snap.exists()) {
        onData(null, null)
        return
      }
      const data = snap.data()
      onData(
        Array.isArray(data.answers) ? (data.answers as AnswerItem[]) : [],
        data.fromUid ? String(data.fromUid) : null,
      )
    },
    (error) => onError?.(error),
  )
}

export async function savePrivateAnswers(input: {
  roomId: string
  uid: string
  isPartnerA: boolean
  answers: AnswerItem[]
  ready?: boolean
}): Promise<void> {
  const firestore = requireDb()
  const answeredCount = input.answers.filter((a) => a.text.trim().length > 0)
    .length

  await setDoc(
    doc(firestore, 'rooms', input.roomId, 'privateAnswers', input.uid),
    {
      uid: input.uid,
      answers: input.answers,
      ready: Boolean(input.ready),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )

  await updateDoc(doc(firestore, 'rooms', input.roomId), {
    ...(input.isPartnerA
      ? { partnerAAnsweredCount: answeredCount }
      : { partnerBAnsweredCount: answeredCount }),
    updatedAt: serverTimestamp(),
  })
}

export async function setAnswersReady(input: {
  room: Room
  uid: string
  answers: AnswerItem[]
  expectedCount: number
  ready: boolean
}): Promise<void> {
  const filled = input.answers.filter((a) => a.text.trim().length > 0)
  if (input.ready && filled.length < input.expectedCount) {
    throw new Error('Please answer every question before marking ready.')
  }

  const firestore = requireDb()
  const { room, uid, answers, ready } = input
  const isA = room.partnerA === uid

  await setDoc(
    doc(firestore, 'rooms', room.roomId, 'privateAnswers', uid),
    {
      uid,
      answers,
      ready,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )

  await updateDoc(doc(firestore, 'rooms', room.roomId), {
    ...(isA
      ? {
          partnerAReadyAnswers: ready,
          partnerAAnsweredCount: filled.length,
          ...(ready ? {} : { partnerAAnswersDelivered: false }),
        }
      : {
          partnerBReadyAnswers: ready,
          partnerBAnsweredCount: filled.length,
          ...(ready ? {} : { partnerBAnswersDelivered: false }),
        }),
    status: ready ? 'answers_ready' : 'answering',
    updatedAt: serverTimestamp(),
  })
}

export async function deliverMyAnswersIfReady(input: {
  room: Room
  uid: string
  answers: AnswerItem[]
}): Promise<void> {
  const { room, uid, answers } = input
  if (!room.partnerB) return
  if (!room.partnerAReadyAnswers || !room.partnerBReadyAnswers) return
  if (answers.length === 0) return
  if (room.partnerAAnswersDelivered && room.partnerBAnswersDelivered) return
  if (
    room.status === 'answers_exchanged' ||
    room.status === 'verdict_pending' ||
    room.status === 'result_revealed'
  ) {
    return
  }

  if (functions) {
    try {
      const call = httpsCallable<{ roomId: string }, { ok: boolean }>(
        functions,
        'exchangeAnswers',
      )
      await call({ roomId: room.roomId })
      trackEvent('answers_exchanged', { room_id: room.roomId })
      return
    } catch {
      // Fall through until Functions deploy (Blaze).
    }
  }

  const isA = room.partnerA === uid
  const alreadyDelivered = isA
    ? room.partnerAAnswersDelivered
    : room.partnerBAnswersDelivered

  const firestore = requireDb()
  const roomRef = doc(firestore, 'rooms', room.roomId)

  if (!alreadyDelivered) {
    const partnerUid = isA ? room.partnerB : room.partnerA
    await setDoc(
      doc(firestore, 'rooms', room.roomId, 'exchangedAnswers', partnerUid),
      {
        fromUid: uid,
        answers,
        exchangedAt: serverTimestamp(),
      },
    )

    await updateDoc(roomRef, {
      ...(isA
        ? { partnerAAnswersDelivered: true }
        : { partnerBAnswersDelivered: true }),
      updatedAt: serverTimestamp(),
    })
  }

  const fresh = await getDoc(roomRef)
  if (!fresh.exists()) return
  const data = fresh.data()
  const aDone = Boolean(data.partnerAAnswersDelivered)
  const bDone = Boolean(data.partnerBAnswersDelivered)
  const status = String(data.status)

  if (
    aDone &&
    bDone &&
    status !== 'answers_exchanged' &&
    status !== 'verdict_pending' &&
    status !== 'result_revealed'
  ) {
    await updateDoc(roomRef, {
      status: 'answers_exchanged',
      updatedAt: serverTimestamp(),
    })
    trackEvent('answers_exchanged', { room_id: room.roomId })
  }
}
