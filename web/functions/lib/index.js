"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveVerdict = exports.exchangeAnswers = exports.exchangeQuestions = void 0;
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const https_1 = require("firebase-functions/v2/https");
const v2_1 = require("firebase-functions/v2");
(0, app_1.initializeApp)();
(0, v2_1.setGlobalOptions)({ region: 'asia-south1', maxInstances: 20 });
const db = (0, firestore_1.getFirestore)();
function assertAuth(uid) {
    if (!uid) {
        throw new https_1.HttpsError('unauthenticated', 'Sign in required.');
    }
}
async function requireMember(roomId, uid) {
    const snap = await db.doc(`rooms/${roomId}`).get();
    if (!snap.exists) {
        throw new https_1.HttpsError('not-found', 'Room not found.');
    }
    const room = snap.data();
    const members = Array.isArray(room.memberIds) ? room.memberIds : [];
    if (!members.includes(uid)) {
        throw new https_1.HttpsError('permission-denied', 'Not a room member.');
    }
    if (room.status === 'closed') {
        throw new https_1.HttpsError('failed-precondition', 'Room is closed.');
    }
    return { ref: snap.ref, room };
}
/**
 * Privacy-preserving question swap.
 * Reads each member's privateQuestions and writes only to the partner inbox.
 */
exports.exchangeQuestions = (0, https_1.onCall)(async (request) => {
    assertAuth(request.auth?.uid);
    const roomId = String(request.data?.roomId ?? '');
    if (!roomId)
        throw new https_1.HttpsError('invalid-argument', 'roomId required.');
    const { ref, room } = await requireMember(roomId, request.auth.uid);
    if (!room.partnerB) {
        throw new https_1.HttpsError('failed-precondition', 'Partner required.');
    }
    if (!room.partnerAReadyQuestions || !room.partnerBReadyQuestions) {
        throw new https_1.HttpsError('failed-precondition', 'Both partners must be ready.');
    }
    const [aPriv, bPriv] = await Promise.all([
        db.doc(`rooms/${roomId}/privateQuestions/${room.partnerA}`).get(),
        db.doc(`rooms/${roomId}/privateQuestions/${room.partnerB}`).get(),
    ]);
    const aQuestions = Array.isArray(aPriv.data()?.questions)
        ? aPriv.data().questions
        : [];
    const bQuestions = Array.isArray(bPriv.data()?.questions)
        ? bPriv.data().questions
        : [];
    const batch = db.batch();
    const now = firestore_1.FieldValue.serverTimestamp();
    // Partner B receives A's questions; Partner A receives B's.
    batch.set(db.doc(`rooms/${roomId}/exchangedQuestions/${room.partnerB}`), {
        fromUid: room.partnerA,
        questions: aQuestions,
        exchangedAt: now,
    });
    batch.set(db.doc(`rooms/${roomId}/exchangedQuestions/${room.partnerA}`), {
        fromUid: room.partnerB,
        questions: bQuestions,
        exchangedAt: now,
    });
    batch.update(ref, {
        partnerAQuestionsDelivered: true,
        partnerBQuestionsDelivered: true,
        status: 'answering',
        updatedAt: now,
    });
    await batch.commit();
    return { ok: true, status: 'answering' };
});
/**
 * Privacy-preserving answer swap.
 */
exports.exchangeAnswers = (0, https_1.onCall)(async (request) => {
    assertAuth(request.auth?.uid);
    const roomId = String(request.data?.roomId ?? '');
    if (!roomId)
        throw new https_1.HttpsError('invalid-argument', 'roomId required.');
    const { ref, room } = await requireMember(roomId, request.auth.uid);
    if (!room.partnerB) {
        throw new https_1.HttpsError('failed-precondition', 'Partner required.');
    }
    if (!room.partnerAReadyAnswers || !room.partnerBReadyAnswers) {
        throw new https_1.HttpsError('failed-precondition', 'Both partners must be ready.');
    }
    const [aPriv, bPriv] = await Promise.all([
        db.doc(`rooms/${roomId}/privateAnswers/${room.partnerA}`).get(),
        db.doc(`rooms/${roomId}/privateAnswers/${room.partnerB}`).get(),
    ]);
    const aAnswers = Array.isArray(aPriv.data()?.answers) ? aPriv.data().answers : [];
    const bAnswers = Array.isArray(bPriv.data()?.answers) ? bPriv.data().answers : [];
    const batch = db.batch();
    const now = firestore_1.FieldValue.serverTimestamp();
    batch.set(db.doc(`rooms/${roomId}/exchangedAnswers/${room.partnerB}`), {
        fromUid: room.partnerA,
        answers: aAnswers,
        exchangedAt: now,
    });
    batch.set(db.doc(`rooms/${roomId}/exchangedAnswers/${room.partnerA}`), {
        fromUid: room.partnerB,
        answers: bAnswers,
        exchangedAt: now,
    });
    batch.update(ref, {
        partnerAAnswersDelivered: true,
        partnerBAnswersDelivered: true,
        status: 'answers_exchanged',
        updatedAt: now,
    });
    await batch.commit();
    return { ok: true, status: 'answers_exchanged' };
});
/**
 * Double-blind result. Never writes who said No — only match | no_match.
 */
exports.resolveVerdict = (0, https_1.onCall)(async (request) => {
    assertAuth(request.auth?.uid);
    const roomId = String(request.data?.roomId ?? '');
    if (!roomId)
        throw new https_1.HttpsError('invalid-argument', 'roomId required.');
    const { ref, room } = await requireMember(roomId, request.auth.uid);
    if (!room.partnerB) {
        throw new https_1.HttpsError('failed-precondition', 'Partner required.');
    }
    if (room.result === 'match' || room.result === 'no_match') {
        return { ok: true, result: room.result };
    }
    if (!room.partnerAVerdictSubmitted || !room.partnerBVerdictSubmitted) {
        throw new https_1.HttpsError('failed-precondition', 'Both verdicts required.');
    }
    const [aYes, bYes] = await Promise.all([
        db.doc(`rooms/${roomId}/verdictYesSignals/${room.partnerA}`).get(),
        db.doc(`rooms/${roomId}/verdictYesSignals/${room.partnerB}`).get(),
    ]);
    const result = aYes.exists && bYes.exists ? 'match' : 'no_match';
    await ref.update({
        result,
        status: 'result_revealed',
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
    });
    return { ok: true, result };
});
//# sourceMappingURL=index.js.map