# Step-Wise Development Plan — React + Firebase Website

**Product:** The Pre-Commitment Game  
**Stack:** React (Vite) + Firebase (Auth, Firestore, Hosting, Cloud Functions)  
**Related doc:** `PRODUCT_PLAN.md`  
**Goal:** Build and launch a mobile-first website that runs the full 4-step couple loop.

---

## Launch policy (important)

**Current build = fully open product**

| Rule | Decision |
|------|----------|
| Payments | **Not in this build** — add later |
| Feature limits | **None** — unlimited rooms, questions, decks, rounds |
| Free vs premium split | **None for now** — everything unlocked |
| Paywalls / trials | **Do not build** |
| Entitlements / plans | **Future only** |

Focus now: ship a complete, unlimited website so couples can use the full experience freely.  
Monetization and limits will be a **separate future update** after the product works.

---

## How to use this document

1. Work **one phase at a time** in order (Phase 0 → 9 for launch).
2. Each phase has: **Goal → Build list → Done when**.
3. After a phase is done, mark it complete and start the next.
4. Use existing Stitch HTML screens as UI reference (required visual source of truth):
   - `stitch_the_big_talk_game/stitch_the_big_talk_game/lobby/code.html`
   - `stitch_the_big_talk_game/stitch_the_big_talk_game/question_builder/code.html`
   - `stitch_the_big_talk_game/stitch_the_big_talk_game/answer_phase/code.html`
   - `stitch_the_big_talk_game/stitch_the_big_talk_game/the_verdict/code.html`
   - `stitch_the_big_talk_game/stitch_the_big_talk_game/match_found/code.html`
5. App code lives in `web/`. Stitch stays as design reference (do not edit Stitch for product logic).
6. **Do not** build payments, paywalls, or usage caps in Phases 0–9.

---

## Final stack (locked for launch)

| Layer | Choice |
|-------|--------|
| Frontend | React 18+ with Vite |
| Routing | React Router |
| Styling | Tailwind CSS (match existing prototype colors) |
| Auth | Firebase Authentication (Email + Google; Phone optional later) |
| Database | Cloud Firestore |
| Backend logic | Cloud Functions (Node.js) |
| Hosting | Firebase Hosting |
| Invites | Shareable room links (`/join/:roomId`) |
| Payments / limits | **Out of scope until Future Phase F1** |

---

## Target folder structure

```text
pre-commitment-game/
├── public/
├── src/
│   ├── assets/
│   ├── components/          # shared UI
│   ├── features/
│   │   ├── auth/
│   │   ├── lobby/
│   │   ├── questions/
│   │   ├── answers/
│   │   ├── verdict/
│   │   └── result/
│   ├── hooks/               # useRoom, useAuth, etc.
│   ├── lib/
│   │   └── firebase.js      # firebase app init
│   ├── pages/
│   ├── styles/
│   ├── App.jsx
│   └── main.jsx
├── functions/               # Cloud Functions
│   └── src/
├── firestore.rules
├── firebase.json
├── .env.example
├── package.json
└── README.md
```

---

## Firestore data model (launch)

### `users/{uid}`
```json
{
  "uid": "string",
  "displayName": "string",
  "username": "string",
  "email": "string",
  "createdAt": "timestamp"
}
```

No plan, credits, or entitlement fields for now.

### `rooms/{roomId}`
```json
{
  "roomId": "string",
  "createdBy": "uid",
  "partnerA": "uid",
  "partnerB": "uid | null",
  "status": "waiting_partner | questions_building | questions_ready | questions_exchanged | answering | answers_ready | answers_exchanged | verdict_pending | result_revealed | closed",
  "partnerAReadyQuestions": false,
  "partnerBReadyQuestions": false,
  "partnerAReadyAnswers": false,
  "partnerBReadyAnswers": false,
  "result": null,
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### `rooms/{roomId}/privateQuestions/{uid}`
```json
{
  "uid": "string",
  "questions": [{ "id": "string", "text": "string" }],
  "ready": false,
  "updatedAt": "timestamp"
}
```
Only the owner can read/write until exchange.  
**No max question count** for launch (reasonable UI soft guidance only, e.g. “keep it focused,” not a hard lock).

### `rooms/{roomId}/exchangedQuestions/{uid}`
```json
{
  "fromUid": "string",
  "questions": [{ "id": "string", "text": "string" }],
  "exchangedAt": "timestamp"
}
```
Created by Cloud Function when both are ready. Each user reads the **other** person’s questions here.

### `rooms/{roomId}/privateAnswers/{uid}`
```json
{
  "uid": "string",
  "answers": [{ "questionId": "string", "text": "string" }],
  "ready": false,
  "updatedAt": "timestamp"
}
```

### `rooms/{roomId}/exchangedAnswers/{uid}`
```json
{
  "fromUid": "string",
  "answers": [{ "questionId": "string", "questionText": "string", "text": "string" }],
  "exchangedAt": "timestamp"
}
```

### `rooms/{roomId}/privateVerdicts/{uid}`
```json
{
  "uid": "string",
  "choice": "yes | no",
  "submittedAt": "timestamp"
}
```
Never exposed to the other partner. Result only stores `match | no_match`.

### `questionDecks/{deckId}` (all unlocked)
```json
{
  "title": "Money & Work",
  "description": "string",
  "questions": ["string"],
  "order": 1
}
```

No `isFree` / premium flags for launch. All decks available to everyone.

---

## Room status flow

```text
waiting_partner
  → questions_building
  → questions_ready          (both marked ready)
  → questions_exchanged      (Cloud Function swap)
  → answering
  → answers_ready
  → answers_exchanged        (Cloud Function swap)
  → verdict_pending
  → result_revealed          (match | no_match)
  → closed
```

**Rule:** Client can propose “ready”. Only Cloud Functions perform exchanges and final result write.

---

# PHASE 0 — Project Setup

**Goal:** Empty app running locally with Firebase connected.

### Build
1. Create Vite React app in project root (or `web/` folder).
2. Install dependencies:
   - `firebase`
   - `react-router-dom`
   - `tailwindcss` + postcss + autoprefixer
3. Create Firebase project in Firebase Console.
4. Enable:
   - Authentication → Email/Password (+ Google optional)
   - Cloud Firestore
   - Hosting
5. Add web app config; create `.env` with Firebase keys.
6. Create `src/lib/firebase.js` and initialize app, auth, firestore.
7. Set up basic routes shell:
   - `/` landing
   - `/login`
   - `/signup`
   - `/app` placeholder dashboard
8. Deploy empty host once to confirm pipeline (`firebase init` + `firebase deploy --only hosting` later).

### Done when
- [x] `npm run dev` works
- [x] Firebase initializes without console errors (warns until `.env` is filled)
- [x] Tailwind styles apply (Stitch color/font tokens in `src/index.css`)
- [x] Basic routes render

**Estimated time:** 0.5–1 day  
**Status:** ✅ Complete (2026-08-10)

**UI reference locked:** implement later flow screens from `stitch_the_big_talk_game/`.

---

# PHASE 1 — Auth & User Profile

**Goal:** Users can sign up, log in, set display name/username.

### Build
1. Signup page (email + password).
2. Login page.
3. Logout action.
4. On first login, create `users/{uid}` document.
5. Username uniqueness check (simple query or usernames collection).
6. Auth guard: protect `/app/*` routes.
7. Basic profile edit (display name, username).

### Done when
- [x] New user can register and land in app
- [x] User doc exists in Firestore
- [x] Logged-out users cannot open private pages
- [x] Refresh keeps session

**Estimated time:** 1–2 days  
**Status:** ✅ Complete (2026-08-10)

**Firebase project:** `precommitment-game` (Asia South 1)  
**Notes:** Email/Password Auth enabled; `users` + `usernames` collections; protected `/app` and room routes; profile edit on app home.

---

# PHASE 2 — Landing + How It Works

**Goal:** Clear first-visit explanation and CTA into signup/login.

### Build
1. Landing page with brand + short promise.
2. 4-step explanation section (Lobby → Questions → Answers → Verdict).
3. Primary CTA: “Start with your partner”.
4. Secondary CTA: “I have an invite link”.
5. Mobile-first layout; keep design calm and trustworthy (use prototype teal palette).
6. No pricing section, no “premium” messaging for launch.

### Done when
- [x] Landing explains product in under 30 seconds
- [x] CTAs route correctly
- [x] Looks usable on phone

**Estimated time:** 1 day  
**Status:** ✅ Complete (2026-08-10)

**Notes:** Brand-first hero, 4-step how-it-works, dignity strip, scroll header, soft atmosphere from Stitch palette. No pricing. Invite CTA → login (with return to `/join`) or `/join` when signed in.

---

# PHASE 3 — Private Lobby + Invite

**Goal:** Partner A creates a room; Partner B joins via link.

### Build
1. “Create Room” button → creates `rooms/{roomId}` with `status: waiting_partner`.
2. Users can create **unlimited rooms** (no session cap).
3. Generate invite URL: `https://yourdomain.com/join/{roomId}`.
4. Copy link + WhatsApp share button.
5. Join page:
   - If logged out → login/signup then return to join
   - If logged in → set `partnerB`, move status to `questions_building`
6. Lobby screen (from prototype):
   - Show both partners connected / waiting
   - Show room rules
   - “Begin Question Phase” when both present
7. Realtime listener on room doc so both see updates live.
8. Simple home list of user’s rooms (active + past) — unlimited history for now.

### Security (basic)
- Only `partnerA` / `partnerB` can read the room.
- Cannot join if room already has two people.
- Cannot join own room as partner B.

### Done when
- [x] A creates room and shares link
- [x] B joins on another browser/phone
- [x] Both see “connected” in lobby in realtime
- [x] Waiting state is clear when B has not joined
- [x] Creating another room after finishing one still works

**Estimated time:** 2–3 days  
**Critical milestone:** Partner-join loop works.  
**Status:** ✅ Complete (2026-08-10)

**Notes:** Rooms in Firestore with realtime lobby, copy/WhatsApp invite, join via `/join/:roomId`, home room list. Question phase CTA routes to Phase 4 placeholder.

---

# PHASE 4 — Question Phase

**Goal:** Each partner privately builds questions; both ready → simultaneous swap.

### Build
1. Question Builder page (prototype UI).
2. Add / edit / delete custom questions — **no hard limit**.
3. Save drafts to `privateQuestions/{uid}` (only owner readable).
4. Insert prompts from any starter deck (all unlocked).
5. “Ready to Exchange” toggle per user.
6. Waiting UI: “Waiting for partner to ready…”.
7. Cloud Function `exchangeQuestions`:
   - Trigger when both ready
   - Copy A’s questions into B’s exchanged feed and vice versa
   - Set room status `questions_exchanged` → `answering`
8. Prevent reading partner questions before exchange (Firestore rules).

### Done when
- [x] A cannot see B’s questions before ready
- [x] When both ready, both instantly receive the other’s list
- [x] Status moves to answering automatically
- [x] Users can add as many questions as they want

**Estimated time:** 3–4 days  
**Critical milestone:** Simultaneous question swap is trustworthy.  
**Status:** ✅ Complete (2026-08-10)

**Notes:** Stitch-style Question Builder with decks + custom questions. Private drafts in `privateQuestions/{uid}`. Simultaneous swap via partner inbox writes (`exchangedQuestions/{partnerUid}`) after both ready—no Cloud Functions required yet. Auto-navigate to answers when status becomes `answering`.

---

# PHASE 5 — Answer Phase

**Goal:** Both answer exchanged questions; then swap answers simultaneously.

### Build
1. Answer Phase page listing partner’s questions.
2. Text answers saved to `privateAnswers/{uid}`.
3. Validation: all listed questions answered before ready (quality rule, not a paid limit).
4. “Ready to Exchange Answers” + waiting state.
5. Cloud Function `exchangeAnswers`:
   - Runs only when both ready
   - Writes exchanged answers for each side
   - Sets status `answers_exchanged` → review / `verdict_pending`
6. Answer Review screen: read partner answers before verdict.

### Done when
- [x] Answers stay private until both ready
- [x] Both can read full Q&A after exchange
- [x] No client-only bypass can peek early

**Estimated time:** 3–4 days  
**Status:** ✅ Complete (2026-08-10)

**Notes:** Answer Phase with progress dots, private `privateAnswers/{uid}`, ready exchange via `exchangedAnswers/{partnerUid}`, Answer Review page before verdict.

---

# PHASE 6 — Double-Blind Verdict + Result

**Goal:** Private Yes/No; reveal only Match / No Match.

### Build
1. Verdict screen (prototype).
2. Submit choice into `privateVerdicts/{uid}` only.
3. Waiting state until partner votes.
4. Cloud Function `resolveVerdict`:
   - When both submitted:
     - If both yes → `result: match`
     - Else → `result: no_match`
   - Write result on room
   - **Do not** write who said no
5. Result pages:
   - Match Found
   - No Match (calm, non-blaming copy)
6. Close room / disable further edits.
7. CTA to start another unlimited round with same or new partner flow.

### Done when
- [x] Neither user can see the other’s raw verdict
- [x] Both see the same final result
- [x] Full loop works end-to-end on two devices

**Estimated time:** 2–3 days  
**Critical milestone:** Full product loop complete.  
**Status:** ✅ Complete (2026-08-10)

**Notes:** Stitch-style Yes/No verdict. Private votes in `privateVerdicts/{uid}`. YES-only signals for resolve. Room stores only `match` | `no_match`. Result page + start another room CTA.

---

# PHASE 7 — Starter Decks + UX Polish

**Goal:** Better questions and smoother flow for real couples.

### Build
1. Seed multiple starter decks in Firestore (Money & Work, Family & In-Laws, Lifestyle, Values, etc.).
2. Deck picker in Question Builder — **all decks open to everyone**.
3. Empty states, loaders, disabled buttons, error toasts.
4. Confirm dialogs for leave/cancel room.
5. Mobile spacing/typography pass from prototypes.
6. Basic “How this room works” tips in lobby.
7. Room cancel / leave flow (simple version).

### Done when
- [x] Couples can complete a round without confusion
- [x] At least 20–40 solid starter questions available across decks
- [x] Major dead-ends have helpful messages
- [x] No locked/premium deck UI exists

**Estimated time:** 2–3 days  
**Status:** ✅ Complete (2026-08-10)

**Notes:** 6 unlocked decks (38 questions) in `decks.ts` + Firestore `questionDecks`. Shared Toast / ConfirmDialog / PageLoader / EmptyState. Lobby “How this room works” tips. `closeRoom` + rules allow `closed`. Exit confirms leave/cancel.

---

# PHASE 8 — Security Rules Hardening

**Goal:** Production-safe access before public users.

### Build
1. Write strict `firestore.rules`:
   - Users read/write only own profile
   - Room members only
   - Private subcollections owner-only
   - Exchanged collections readable only by intended member
   - Verdicts never readable by partner
2. Test rules with Firebase Emulator Suite.
3. Cloud Functions use Admin SDK for privileged writes.
4. Light abuse protection only (e.g. spam join attempts) — **not product usage limits**.

### Done when
- [x] Strict rules deny client exchange/result writes (deployed)
- [ ] Emulator rule tests pass for allow/deny cases
- [x] Manual peek of partner private data blocked by rules
- [~] Functions are the privileged path for exchanges/result (scaffolded; deploy needs Blaze)

**Estimated time:** 2 days  
**Do not skip this phase.**  
**Status:** 🟡 In progress (2026-08-10)

**Notes:** Callables `exchangeQuestions`, `exchangeAnswers`, `resolveVerdict` in `web/functions`. Client tries Functions first, falls back to client writes until Blaze. Rules keep private data owner-only + result forge guard. Emulator config + checklist in `firestore.rules.test.md`. **To finish Phase 8:** upgrade project to Blaze, deploy functions, then lock `exchanged*` writes to `false`.

---

# PHASE 9 — Public / Private Launch (unlimited free site)

**Goal:** Real couples use the full product with no paywall.

### Build / Ops
1. Custom domain (optional) + Firebase Hosting production deploy.
2. Privacy policy + Terms pages (simple).
3. 18+ notice.
4. Feedback form (Google Form / Typeform link is fine).
5. Analytics events (Firebase Analytics or simple custom events):
   - signup
   - room_created
   - partner_joined
   - questions_exchanged
   - answers_exchanged
   - verdict_revealed
   - result_match / result_no_match
6. Invite real couples / friends for testing, then open wider.
7. Fix top friction bugs from feedback.

### Explicitly out of scope for this phase
- Payment checkout
- Free-tier caps
- Premium badges
- Subscription screens

### Done when
- [x] Production URL live (`https://precommitment-game.web.app`)
- [x] Privacy / Terms / Feedback / 18+ notice in app
- [x] Analytics event helpers wired (needs Measurement ID in `.env`)
- [ ] Full loop works for anyone who signs up
- [ ] Unlimited rooms / questions / decks in production
- [ ] ≥ 10 completed couple rooms
- [ ] No critical privacy bugs

**Estimated time:** 2–4 days + feedback window  
**Status:** 🟡 In progress (2026-08-10)

**Notes:** Live at https://precommitment-game.web.app. Legal pages at `/privacy`, `/terms`; feedback at `/feedback` (`VITE_FEEDBACK_URL` or mailto). Signup requires 18+ + Terms/Privacy checkbox. `trackEvent` covers launch funnel. Enable Google Analytics in Firebase Console and set `VITE_FIREBASE_MEASUREMENT_ID`, then redeploy. Next: invite real couples; finish Phase 8 Blaze/functions when ready.

---

# FUTURE PHASE F1 — Payments & Limits (later update)

**Do not start until launch product is stable and you decide to monetize.**

**Goal:** Add monetization without rewriting the core loop.

### Planned later
1. Decide free vs paid boundary (rooms, decks, or session packs).
2. Add payment provider (Razorpay for India / Stripe globally).
3. Entitlements on user/account.
4. Optional premium decks or extra features.
5. Soft limits only where needed — keep core experience fair.

### Done when (future)
- [ ] Test payment works
- [ ] Paid unlock works
- [ ] Existing free users are handled clearly

---

# FUTURE PHASE F2 — Better Version Features (later)

Only after launch is stable (and optionally after F1):

1. Auto-delete answers after N days  
2. Screenshot warning on sensitive screens  
3. Conditional Yes (optional caveats)  
4. Counselor-reviewed decks  
5. Second language  
6. Post-Match checklist / Post-No-Match resources  
7. PWA install prompt  
8. Native wrappers (only if web retention is strong)

---

## Build order summary (checklist)

### Launch track (build now)

| # | Phase | Status |
|---|-------|--------|
| 0 | Project setup (Vite + Firebase + Tailwind) | ✅ done |
| 1 | Auth & profiles | ✅ done |
| 2 | Landing page | ✅ done |
| 3 | Lobby + invite join (unlimited rooms) | ✅ done |
| 4 | Question phase + swap (no question cap) | ✅ done |
| 5 | Answer phase + swap | ✅ done |
| 6 | Verdict + Match / No Match | ✅ done |
| 7 | Decks + polish (all decks unlocked) | ✅ done |
| 8 | Security rules hardening | 🟡 in progress |
| 9 | Launch unlimited free website | 🟡 in progress |

### Future track (do later)

| # | Phase | Status |
|---|-------|--------|
| F1 | Payments & limits | ☐ deferred |
| F2 | Better-version upgrades | ☐ deferred |

---

## Definition of launch (ship gate)

Launch is done when all are true:

1. Two real users can complete Lobby → Questions → Answers → Verdict on phones.  
2. Partner invite link works via WhatsApp.  
3. No one can peek questions/answers/verdicts early.  
4. No Match never reveals who said No.  
5. Hosted on a public URL with basic privacy policy.  
6. Starter decks exist and are fully usable.  
7. **No payment required.**  
8. **No feature limitation / paywall in the product.**

---

## Suggested sprint cadence

| Sprint | Focus |
|--------|--------|
| Sprint 1 (Week 1) | Phase 0 + 1 + 2 |
| Sprint 2 (Week 2) | Phase 3 |
| Sprint 3 (Week 3) | Phase 4 |
| Sprint 4 (Week 4) | Phase 5 |
| Sprint 5 (Week 5) | Phase 6 + 7 |
| Sprint 6 (Week 6) | Phase 8 + 9 |

After Phase 9, pause for real-user learning. Start F1/F2 only when you choose to.

---

## Dev rules while building

1. **Mobile-first every screen** — most users will join from a phone link.  
2. **Realtime first** — always subscribe to room status; avoid manual refresh flows.  
3. **Never trust the client for reveals** — Functions + rules only.  
4. **Test with two browsers** (Chrome normal + Chrome incognito) every phase from 3 onward.  
5. **Keep copy calm** — especially No Match.  
6. **One phase checkpoint at a time** — easier to debug.  
7. **No paywall code in launch track** — keep F1 completely separate.

---

## First command plan (when we start building)

When you say “start Phase 0”, we will:

1. Scaffold Vite React app  
2. Add Tailwind + React Router + Firebase  
3. Create Firebase config files and env example  
4. Add blank pages/routes  
5. Verify local run  

Then continue Phase 1 → 9 in order.

---

## Open decisions (confirm before/during build)

| Topic | Recommendation | Your choice |
|-------|----------------|-------------|
| App folder | `web/` inside this repo | ☐ confirm |
| Auth methods | Email + Google first | ☐ confirm |
| Username required? | Yes, for invite feel | ☐ confirm |
| Question count | Unlimited (soft UX guidance only) | ✅ locked |
| Rooms / decks | Unlimited / all unlocked | ✅ locked |
| Payments | Future Phase F1 only | ✅ locked |
| Domain | Firebase default first, custom later | 🔄 Moving to Vercel (`beforeyes.online`); Firebase Hosting disabled |

---

## Progress log

Use this section as you complete phases:

| Date | Phase completed | Notes |
|------|-----------------|-------|
| 2026-08-10 | Phase 0 | `web/` scaffolded: Vite React-TS, Tailwind v4 (Stitch tokens), React Router shells, Firebase lib + `.env.example`, Hosting/Firestore stubs. Stitch used as visual reference. Next: Phase 1 Auth. |
| 2026-08-10 | Phase 1 | AuthProvider, signup/login/logout, username uniqueness, profile edit, route guards. Firebase project `precommitment-game` created; Auth + Firestore rules deployed; `.env` configured. |
| 2026-08-10 | Phase 2 | Polished landing: brand-first hero, how-it-works timeline, trust strip, mobile CTAs, Stitch-aligned atmosphere/motion. |
| 2026-08-10 | Phase 3 | Create/join rooms, invite copy + WhatsApp, realtime Stitch-style lobby, home room list, Firestore room rules. |
| 2026-08-10 | Phase 4 | Question Builder, private drafts, ready exchange, privacy-preserving simultaneous swap, decks. |
| 2026-08-10 | Phase 5 | Answer Phase, private answers, simultaneous answer swap, Answer Review before verdict. |
| 2026-08-10 | Phase 6 | Double-blind verdict, Match/No Match result pages, full loop complete. |
| 2026-08-10 | Phase 7 | 6 starter decks (38 questions) seeded; Toast/Confirm/leave-cancel; lobby tips; UX polish. Next: Phase 8 security rules. |
| 2026-08-10 | UI polish | Shared AppHeader/StickyCtaBar/Atmosphere/GateScreen; Material icons; safe-area CTAs; Auth/Join atmosphere; warmer copy. |
| 2026-08-10 | Phase 8 (start) | Hardened rules + callables for Q/A exchange & verdict resolve. Emulator config. Functions deploy pending Blaze. |
| 2026-08-10 | Phase 9 (start) | Privacy/Terms/Feedback + 18+ gate + analytics wired. Hosting live: https://precommitment-game.web.app |

---

*This document is the build checklist. Follow Phases 0–9 for launch. Payments and limits are Future Phase F1 only. Product strategy remains in `PRODUCT_PLAN.md`.*
