/**
 * Double-blind verdict helpers.
 * Private choices stay in privateVerdicts/{uid}.
 * Only YES voters publish a member-readable yes signal.
 * Prefer Cloud Function `resolveVerdict`; client fallback until Blaze.
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
import type { Room, RoomResult } from '@/features/lobby/types'

export type VerdictChoice = 'yes' | 'no'

function requireDb() {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase is not configured.')
  }
  return db
}

export function subscribeMyVerdict(
  roomId: string,
  uid: string,
  onData: (choice: VerdictChoice | null) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const firestore = requireDb()
  return onSnapshot(
    doc(firestore, 'rooms', roomId, 'privateVerdicts', uid),
    (snap) => {
      if (!snap.exists()) {
        onData(null)
        return
      }
      const choice = snap.data().choice
      onData(choice === 'yes' || choice === 'no' ? choice : null)
    },
    (error) => onError?.(error),
  )
}

export async function submitVerdict(input: {
  room: Room
  uid: string
  choice: VerdictChoice
}): Promise<void> {
  const { room, uid, choice } = input
  if (!room.partnerB) throw new Error('Partner required.')
  if (room.result) throw new Error('This room already has a result.')

  const isA = room.partnerA === uid
  const already = isA
    ? room.partnerAVerdictSubmitted
    : room.partnerBVerdictSubmitted
  if (already) throw new Error('You already submitted your verdict.')

  const firestore = requireDb()

  await setDoc(doc(firestore, 'rooms', room.roomId, 'privateVerdicts', uid), {
    uid,
    choice,
    submittedAt: serverTimestamp(),
  })

  if (choice === 'yes') {
    await setDoc(doc(firestore, 'rooms', room.roomId, 'verdictYesSignals', uid), {
      yes: true,
      submittedAt: serverTimestamp(),
    })
  }

  await updateDoc(doc(firestore, 'rooms', room.roomId), {
    ...(isA
      ? { partnerAVerdictSubmitted: true }
      : { partnerBVerdictSubmitted: true }),
    status: 'verdict_pending',
    updatedAt: serverTimestamp(),
  })

  await resolveVerdictIfReady(room.roomId)
}

export async function resolveVerdictIfReady(roomId: string): Promise<RoomResult> {
  if (functions) {
    try {
      const call = httpsCallable<
        { roomId: string },
        { ok: boolean; result?: RoomResult }
      >(functions, 'resolveVerdict')
      const res = await call({ roomId })
      return (res.data.result as RoomResult) ?? null
    } catch {
      // Fall through until Functions deploy (Blaze).
    }
  }

  const firestore = requireDb()
  const roomRef = doc(firestore, 'rooms', roomId)
  const roomSnap = await getDoc(roomRef)
  if (!roomSnap.exists()) return null

  const data = roomSnap.data()
  if (data.result === 'match' || data.result === 'no_match') {
    return data.result as RoomResult
  }

  if (!data.partnerAVerdictSubmitted || !data.partnerBVerdictSubmitted) {
    return null
  }

  const [aYes, bYes] = await Promise.all([
    getDoc(doc(firestore, 'rooms', roomId, 'verdictYesSignals', data.partnerA)),
    getDoc(doc(firestore, 'rooms', roomId, 'verdictYesSignals', data.partnerB)),
  ])

  const result: RoomResult =
    aYes.exists() && bYes.exists() ? 'match' : 'no_match'

  await updateDoc(roomRef, {
    result,
    status: 'result_revealed',
    updatedAt: serverTimestamp(),
  })

  return result
}
