import { initializeApp } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { setGlobalOptions } from 'firebase-functions/v2'

initializeApp()
setGlobalOptions({ region: 'asia-south1', maxInstances: 20 })

const db = getFirestore()

function assertAuth(uid: string | undefined): asserts uid is string {
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Sign in required.')
  }
}

async function requireMember(roomId: string, uid: string) {
  const snap = await db.doc(`rooms/${roomId}`).get()
  if (!snap.exists) {
    throw new HttpsError('not-found', 'Room not found.')
  }
  const room = snap.data()!
  const members: string[] = Array.isArray(room.memberIds) ? room.memberIds : []
  if (!members.includes(uid)) {
    throw new HttpsError('permission-denied', 'Not a room member.')
  }
  if (room.status === 'closed') {
    throw new HttpsError('failed-precondition', 'Room is closed.')
  }
  return { ref: snap.ref, room }
}

/**
 * Privacy-preserving question swap.
 * Reads each member's privateQuestions and writes only to the partner inbox.
 */
export const exchangeQuestions = onCall(async (request) => {
  assertAuth(request.auth?.uid)
  const roomId = String(request.data?.roomId ?? '')
  if (!roomId) throw new HttpsError('invalid-argument', 'roomId required.')

  const { ref, room } = await requireMember(roomId, request.auth.uid)
  if (!room.partnerB) {
    throw new HttpsError('failed-precondition', 'Partner required.')
  }
  if (!room.partnerAReadyQuestions || !room.partnerBReadyQuestions) {
    throw new HttpsError('failed-precondition', 'Both partners must be ready.')
  }

  const [aPriv, bPriv] = await Promise.all([
    db.doc(`rooms/${roomId}/privateQuestions/${room.partnerA}`).get(),
    db.doc(`rooms/${roomId}/privateQuestions/${room.partnerB}`).get(),
  ])

  const aQuestions = Array.isArray(aPriv.data()?.questions)
    ? aPriv.data()!.questions
    : []
  const bQuestions = Array.isArray(bPriv.data()?.questions)
    ? bPriv.data()!.questions
    : []

  const batch = db.batch()
  const now = FieldValue.serverTimestamp()

  // Partner B receives A's questions; Partner A receives B's.
  batch.set(db.doc(`rooms/${roomId}/exchangedQuestions/${room.partnerB}`), {
    fromUid: room.partnerA,
    questions: aQuestions,
    exchangedAt: now,
  })
  batch.set(db.doc(`rooms/${roomId}/exchangedQuestions/${room.partnerA}`), {
    fromUid: room.partnerB,
    questions: bQuestions,
    exchangedAt: now,
  })
  batch.update(ref, {
    partnerAQuestionsDelivered: true,
    partnerBQuestionsDelivered: true,
    status: 'answering',
    updatedAt: now,
  })

  await batch.commit()
  return { ok: true, status: 'answering' }
})

/**
 * Privacy-preserving answer swap.
 */
export const exchangeAnswers = onCall(async (request) => {
  assertAuth(request.auth?.uid)
  const roomId = String(request.data?.roomId ?? '')
  if (!roomId) throw new HttpsError('invalid-argument', 'roomId required.')

  const { ref, room } = await requireMember(roomId, request.auth.uid)
  if (!room.partnerB) {
    throw new HttpsError('failed-precondition', 'Partner required.')
  }
  if (!room.partnerAReadyAnswers || !room.partnerBReadyAnswers) {
    throw new HttpsError('failed-precondition', 'Both partners must be ready.')
  }

  const [aPriv, bPriv] = await Promise.all([
    db.doc(`rooms/${roomId}/privateAnswers/${room.partnerA}`).get(),
    db.doc(`rooms/${roomId}/privateAnswers/${room.partnerB}`).get(),
  ])

  const aAnswers = Array.isArray(aPriv.data()?.answers) ? aPriv.data()!.answers : []
  const bAnswers = Array.isArray(bPriv.data()?.answers) ? bPriv.data()!.answers : []

  const batch = db.batch()
  const now = FieldValue.serverTimestamp()

  batch.set(db.doc(`rooms/${roomId}/exchangedAnswers/${room.partnerB}`), {
    fromUid: room.partnerA,
    answers: aAnswers,
    exchangedAt: now,
  })
  batch.set(db.doc(`rooms/${roomId}/exchangedAnswers/${room.partnerA}`), {
    fromUid: room.partnerB,
    answers: bAnswers,
    exchangedAt: now,
  })
  batch.update(ref, {
    partnerAAnswersDelivered: true,
    partnerBAnswersDelivered: true,
    status: 'answers_exchanged',
    updatedAt: now,
  })

  await batch.commit()
  return { ok: true, status: 'answers_exchanged' }
})

/**
 * Compatibility score from both partners' Agree/Disagree summaries.
 * Per-question ratings stay in privateAgreements; only counts are used here.
 */
export const resolveCompatibility = onCall(async (request) => {
  assertAuth(request.auth?.uid)
  const roomId = String(request.data?.roomId ?? '')
  if (!roomId) throw new HttpsError('invalid-argument', 'roomId required.')

  const { ref, room } = await requireMember(roomId, request.auth.uid)
  if (!room.partnerB) {
    throw new HttpsError('failed-precondition', 'Partner required.')
  }

  if (typeof room.compatibilityScore === 'number') {
    return { ok: true, compatibilityScore: room.compatibilityScore }
  }

  const aSubmitted =
    room.partnerAAgreementsSubmitted === true ||
    room.partnerAVerdictSubmitted === true
  const bSubmitted =
    room.partnerBAgreementsSubmitted === true ||
    room.partnerBVerdictSubmitted === true
  if (!aSubmitted || !bSubmitted) {
    throw new HttpsError('failed-precondition', 'Both partners must submit ratings.')
  }

  const [aSum, bSum] = await Promise.all([
    db.doc(`rooms/${roomId}/agreementSummaries/${room.partnerA}`).get(),
    db.doc(`rooms/${roomId}/agreementSummaries/${room.partnerB}`).get(),
  ])

  if (!aSum.exists || !bSum.exists) {
    throw new HttpsError('failed-precondition', 'Agreement summaries missing.')
  }

  const a = aSum.data()!
  const b = bSum.data()!
  const aAgree = Number(a.agreeCount ?? 0)
  const aTotal = Number(a.total ?? 0)
  const bAgree = Number(b.agreeCount ?? 0)
  const bTotal = Number(b.total ?? 0)
  const total = aTotal + bTotal
  const compatibilityScore =
    total <= 0 ? 0 : Math.round((100 * (aAgree + bAgree)) / total)

  await ref.update({
    compatibilityScore,
    status: 'result_revealed',
    updatedAt: FieldValue.serverTimestamp(),
  })

  return { ok: true, compatibilityScore }
})

/**
 * @deprecated Legacy Yes/No match. Prefer resolveCompatibility.
 */
export const resolveVerdict = onCall(async (request) => {
  assertAuth(request.auth?.uid)
  const roomId = String(request.data?.roomId ?? '')
  if (!roomId) throw new HttpsError('invalid-argument', 'roomId required.')

  const { ref, room } = await requireMember(roomId, request.auth.uid)
  if (!room.partnerB) {
    throw new HttpsError('failed-precondition', 'Partner required.')
  }

  if (typeof room.compatibilityScore === 'number') {
    return { ok: true, result: null, compatibilityScore: room.compatibilityScore }
  }

  if (room.result === 'match' || room.result === 'no_match') {
    return { ok: true, result: room.result }
  }

  if (!room.partnerAVerdictSubmitted || !room.partnerBVerdictSubmitted) {
    throw new HttpsError('failed-precondition', 'Both verdicts required.')
  }

  const [aYes, bYes] = await Promise.all([
    db.doc(`rooms/${roomId}/verdictYesSignals/${room.partnerA}`).get(),
    db.doc(`rooms/${roomId}/verdictYesSignals/${room.partnerB}`).get(),
  ])

  const result = aYes.exists && bYes.exists ? 'match' : 'no_match'

  await ref.update({
    result,
    status: 'result_revealed',
    updatedAt: FieldValue.serverTimestamp(),
  })

  return { ok: true, result }
})
