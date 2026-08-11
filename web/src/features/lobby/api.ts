import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '@/lib/firebase'
import { trackEvent } from '@/lib/analytics'
import {
  ANSWER_PHASE_DEFAULTS,
  createRoomId,
  QUESTION_PHASE_DEFAULTS,
  VERDICT_PHASE_DEFAULTS,
  type Room,
  type RoomResult,
  type RoomStatus,
} from '@/features/lobby/types'

function requireDb() {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase is not configured.')
  }
  return db
}

function mapRoom(roomId: string, data: Record<string, unknown>): Room {
  const createdAt = data.createdAt as { toMillis?: () => number } | number | null
  const updatedAt = data.updatedAt as { toMillis?: () => number } | number | null
  const scoreRaw = data.compatibilityScore
  const compatibilityScore =
    typeof scoreRaw === 'number' && Number.isFinite(scoreRaw)
      ? Math.max(0, Math.min(100, Math.round(scoreRaw)))
      : null

  return {
    roomId,
    createdBy: String(data.createdBy ?? ''),
    partnerA: String(data.partnerA ?? ''),
    partnerB: data.partnerB ? String(data.partnerB) : null,
    partnerADisplayName: String(data.partnerADisplayName ?? 'Partner A'),
    partnerAUsername: String(data.partnerAUsername ?? ''),
    partnerBDisplayName: data.partnerBDisplayName
      ? String(data.partnerBDisplayName)
      : null,
    partnerBUsername: data.partnerBUsername
      ? String(data.partnerBUsername)
      : null,
    memberIds: Array.isArray(data.memberIds)
      ? (data.memberIds as string[])
      : [],
    status: (data.status as RoomStatus) ?? 'waiting_partner',
    partnerAReadyQuestions: Boolean(data.partnerAReadyQuestions),
    partnerBReadyQuestions: Boolean(data.partnerBReadyQuestions),
    partnerAQuestionCount: Number(data.partnerAQuestionCount ?? 0),
    partnerBQuestionCount: Number(data.partnerBQuestionCount ?? 0),
    partnerAQuestionsDelivered: Boolean(data.partnerAQuestionsDelivered),
    partnerBQuestionsDelivered: Boolean(data.partnerBQuestionsDelivered),
    partnerAReadyAnswers: Boolean(data.partnerAReadyAnswers),
    partnerBReadyAnswers: Boolean(data.partnerBReadyAnswers),
    partnerAAnsweredCount: Number(data.partnerAAnsweredCount ?? 0),
    partnerBAnsweredCount: Number(data.partnerBAnsweredCount ?? 0),
    partnerAAnswersDelivered: Boolean(data.partnerAAnswersDelivered),
    partnerBAnswersDelivered: Boolean(data.partnerBAnswersDelivered),
    partnerAAgreementsSubmitted: Boolean(
      data.partnerAAgreementsSubmitted ?? data.partnerAVerdictSubmitted,
    ),
    partnerBAgreementsSubmitted: Boolean(
      data.partnerBAgreementsSubmitted ?? data.partnerBVerdictSubmitted,
    ),
    compatibilityScore,
    result: (data.result as RoomResult) ?? null,
    closedBy: data.closedBy ? String(data.closedBy) : null,
    createdAt:
      typeof createdAt === 'number'
        ? createdAt
        : createdAt && typeof createdAt.toMillis === 'function'
          ? createdAt.toMillis()
          : null,
    updatedAt:
      typeof updatedAt === 'number'
        ? updatedAt
        : updatedAt && typeof updatedAt.toMillis === 'function'
          ? updatedAt.toMillis()
          : null,
  }
}

export async function createRoom(input: {
  uid: string
  displayName: string
  username: string
}): Promise<Room> {
  const firestore = requireDb()
  const roomId = createRoomId()
  const ref = doc(firestore, 'rooms', roomId)

  const payload = {
    roomId,
    createdBy: input.uid,
    partnerA: input.uid,
    partnerB: null,
    partnerADisplayName: input.displayName || 'Partner A',
    partnerAUsername: input.username || '',
    partnerBDisplayName: null,
    partnerBUsername: null,
    memberIds: [input.uid],
    status: 'waiting_partner' as RoomStatus,
    ...QUESTION_PHASE_DEFAULTS,
    ...ANSWER_PHASE_DEFAULTS,
    ...VERDICT_PHASE_DEFAULTS,
    closedBy: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  await setDoc(ref, payload)

  trackEvent('room_created', { room_id: roomId })

  return mapRoom(roomId, {
    ...payload,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  })
}

export async function getRoom(roomId: string): Promise<Room | null> {
  const firestore = requireDb()
  const snap = await getDoc(doc(firestore, 'rooms', roomId))
  if (!snap.exists()) return null
  return mapRoom(snap.id, snap.data())
}

export function subscribeRoom(
  roomId: string,
  onData: (room: Room | null) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const firestore = requireDb()
  return onSnapshot(
    doc(firestore, 'rooms', roomId),
    (snap) => {
      if (!snap.exists()) {
        onData(null)
        return
      }
      onData(mapRoom(snap.id, snap.data()))
    },
    (error) => {
      onError?.(error)
    },
  )
}

export async function joinRoom(input: {
  roomId: string
  uid: string
  displayName: string
  username: string
}): Promise<Room> {
  const firestore = requireDb()
  const ref = doc(firestore, 'rooms', input.roomId)
  const snap = await getDoc(ref)

  if (!snap.exists()) {
    throw new Error('Room not found. Check the invite link and try again.')
  }

  const room = mapRoom(snap.id, snap.data())

  if (room.partnerA === input.uid) {
    return room
  }

  if (room.partnerB === input.uid) {
    return room
  }

  if (room.partnerB) {
    throw new Error('This room already has two people.')
  }

  if (room.status !== 'waiting_partner') {
    throw new Error('This room is no longer accepting a partner.')
  }

  await updateDoc(ref, {
    partnerB: input.uid,
    partnerBDisplayName: input.displayName || 'Partner B',
    partnerBUsername: input.username || '',
    memberIds: [room.partnerA, input.uid],
    status: 'questions_building',
    updatedAt: serverTimestamp(),
  })

  trackEvent('partner_joined', { room_id: input.roomId })

  // Do not re-fetch here: a hanging/failing follow-up getDoc left Partner 2
  // stuck on the join loader even though Partner 1 already saw them online.
  return mapRoom(input.roomId, {
    ...room,
    partnerB: input.uid,
    partnerBDisplayName: input.displayName || 'Partner B',
    partnerBUsername: input.username || '',
    memberIds: [room.partnerA, input.uid],
    status: 'questions_building',
    updatedAt: Date.now(),
  })
}

export function subscribeUserRooms(
  uid: string,
  onData: (rooms: Room[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const firestore = requireDb()
  const q = query(
    collection(firestore, 'rooms'),
    where('memberIds', 'array-contains', uid),
  )

  return onSnapshot(
    q,
    (snap) => {
      const rooms = snap.docs.map((d) => mapRoom(d.id, d.data()))
      rooms.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
      onData(rooms)
    },
    (error) => onError?.(error),
  )
}

/** Simple leave / cancel: members mark the room closed. */
export async function closeRoom(input: {
  roomId: string
  uid: string
}): Promise<void> {
  const firestore = requireDb()
  const ref = doc(firestore, 'rooms', input.roomId)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    throw new Error('Room not found.')
  }

  const room = mapRoom(snap.id, snap.data())
  if (!room.memberIds.includes(input.uid)) {
    throw new Error('You are not a member of this room.')
  }
  if (room.status === 'closed') return

  await updateDoc(ref, {
    status: 'closed',
    closedBy: input.uid,
    updatedAt: serverTimestamp(),
  })
}
