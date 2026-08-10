/**
 * Firestore rules unit tests for Phase 8.
 * Run: npx -y firebase-tools@latest emulators:exec --only firestore "npm run test:rules"
 * Or with Jest/@firebase/rules-unit-testing once deps are installed.
 *
 * These scenarios are also documented for manual emulator verification.
 */

/*
Manual allow/deny checklist (Firebase Emulator Suite):

ALLOW
- User reads/writes own users/{uid}
- Room member reads room
- Owner writes privateQuestions/{ownUid}, privateAnswers/{ownUid}, privateVerdicts/{ownUid}
- Member creates verdictYesSignals/{ownUid} with yes:true
- Signed-in user reads questionDecks
- Partner B joins waiting_partner room once

DENY
- User reads partner users/{otherUid}
- Non-member reads room after both joined
- Partner reads privateQuestions/{otherUid} / privateAnswers / privateVerdicts
- Client writes exchangedQuestions / exchangedAnswers
- Client sets room.result or status answering|answers_exchanged|result_revealed
- Client sets partner*Delivered flags
- Second stranger joins a full room
- Write questionDecks from client
*/

export const PHASE8_RULE_CASES = [
  { name: 'owner can read own profile', expect: 'allow' },
  { name: 'partner cannot read privateVerdicts', expect: 'deny' },
  { name: 'client cannot write exchangedQuestions', expect: 'deny' },
  { name: 'client cannot set result', expect: 'deny' },
  { name: 'member can close room', expect: 'allow' },
] as const
