/**
 * Per-answer Agree / Disagree ratings after answers are exchanged.
 * Aggregate compatibility % is revealed only when both partners submit.
 * Per-question ratings stay private to each owner; only agreeCount/total
 * are published for score calculation.
 */
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
import type { Room } from '@/features/lobby/types'

export type AgreementChoice = 'agree' | 'disagree'

export type AgreementRating = {
  questionId: string
  questionText: string
  answerText: string
  agreement: AgreementChoice
}

export type PrivateAgreementsDoc = {
  uid: string
  ratings: AgreementRating[]
  agreeCount: number
  total: number
  submittedAt: number | null
}

function requireDb() {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase is not configured.')
  }
  return db
}

export function computeAgreeStats(ratings: AgreementRating[]): {
  agreeCount: number
  total: number
} {
  const total = ratings.length
  const agreeCount = ratings.filter((r) => r.agreement === 'agree').length
  return { agreeCount, total }
}

/** Combined compatibility from both partners' agree counts. */
export function computeCompatibilityPercent(
  aAgree: number,
  aTotal: number,
  bAgree: number,
  bTotal: number,
): number {
  const total = aTotal + bTotal
  if (total <= 0) return 0
  return Math.round((100 * (aAgree + bAgree)) / total)
}

export function subscribeMyAgreements(
  roomId: string,
  uid: string,
  onData: (doc: PrivateAgreementsDoc | null) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const firestore = requireDb()
  return onSnapshot(
    doc(firestore, 'rooms', roomId, 'privateAgreements', uid),
    (snap) => {
      if (!snap.exists()) {
        onData(null)
        return
      }
      const data = snap.data()
      const ratings = Array.isArray(data.ratings)
        ? (data.ratings as AgreementRating[])
        : []
      const submittedAt = data.submittedAt as
        | { toMillis?: () => number }
        | number
        | null
      onData({
        uid: String(data.uid ?? uid),
        ratings,
        agreeCount: Number(data.agreeCount ?? 0),
        total: Number(data.total ?? ratings.length),
        submittedAt:
          typeof submittedAt === 'number'
            ? submittedAt
            : submittedAt && typeof submittedAt.toMillis === 'function'
              ? submittedAt.toMillis()
              : null,
      })
    },
    (error) => onError?.(error),
  )
}

export async function saveAgreementDraft(input: {
  roomId: string
  uid: string
  ratings: AgreementRating[]
}): Promise<void> {
  const { roomId, uid, ratings } = input
  const { agreeCount, total } = computeAgreeStats(ratings)
  const firestore = requireDb()
  await setDoc(
    doc(firestore, 'rooms', roomId, 'privateAgreements', uid),
    {
      uid,
      ratings,
      agreeCount,
      total,
      ready: false,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export async function submitAgreements(input: {
  room: Room
  uid: string
  ratings: AgreementRating[]
}): Promise<void> {
  const { room, uid, ratings } = input
  if (!room.partnerB) throw new Error('Partner required.')
  if (room.compatibilityScore != null) {
    throw new Error('This room already has a compatibility score.')
  }

  const isA = room.partnerA === uid
  const already = isA
    ? room.partnerAAgreementsSubmitted
    : room.partnerBAgreementsSubmitted
  if (already) throw new Error('You already submitted your ratings.')

  if (ratings.length === 0) {
    throw new Error('Rate every partner answer before submitting.')
  }
  if (ratings.some((r) => r.agreement !== 'agree' && r.agreement !== 'disagree')) {
    throw new Error('Choose Agree or Disagree for every answer.')
  }

  const { agreeCount, total } = computeAgreeStats(ratings)
  const firestore = requireDb()

  await setDoc(doc(firestore, 'rooms', room.roomId, 'privateAgreements', uid), {
    uid,
    ratings,
    agreeCount,
    total,
    ready: true,
    submittedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  // Member-readable summary only — enough to compute score, not which items.
  await setDoc(doc(firestore, 'rooms', room.roomId, 'agreementSummaries', uid), {
    uid,
    agreeCount,
    total,
    submittedAt: serverTimestamp(),
  })

  await updateDoc(doc(firestore, 'rooms', room.roomId), {
    ...(isA
      ? { partnerAAgreementsSubmitted: true }
      : { partnerBAgreementsSubmitted: true }),
    status: 'verdict_pending',
    updatedAt: serverTimestamp(),
  })

  await resolveCompatibilityIfReady(room.roomId)
}

export async function resolveCompatibilityIfReady(
  roomId: string,
): Promise<number | null> {
  if (functions) {
    try {
      const call = httpsCallable<
        { roomId: string },
        { ok: boolean; compatibilityScore?: number | null }
      >(functions, 'resolveCompatibility')
      const res = await call({ roomId })
      const score = res.data.compatibilityScore
      return typeof score === 'number' ? score : null
    } catch {
      // Fall through until Functions deploy (Blaze).
    }
  }

  const firestore = requireDb()
  const roomRef = doc(firestore, 'rooms', roomId)
  const roomSnap = await getDoc(roomRef)
  if (!roomSnap.exists()) return null

  const data = roomSnap.data()
  if (typeof data.compatibilityScore === 'number') {
    return data.compatibilityScore
  }

  if (!data.partnerAAgreementsSubmitted || !data.partnerBAgreementsSubmitted) {
    return null
  }

  const [aSum, bSum] = await Promise.all([
    getDoc(doc(firestore, 'rooms', roomId, 'agreementSummaries', data.partnerA)),
    getDoc(doc(firestore, 'rooms', roomId, 'agreementSummaries', data.partnerB)),
  ])

  if (!aSum.exists() || !bSum.exists()) return null

  const a = aSum.data()
  const b = bSum.data()
  const score = computeCompatibilityPercent(
    Number(a.agreeCount ?? 0),
    Number(a.total ?? 0),
    Number(b.agreeCount ?? 0),
    Number(b.total ?? 0),
  )

  await updateDoc(roomRef, {
    compatibilityScore: score,
    status: 'result_revealed',
    updatedAt: serverTimestamp(),
  })

  return score
}
