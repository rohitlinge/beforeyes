# The Pre-Commitment Game (Web)

React + Firebase website for private couple Q&A before commitment.

## Design reference (Stitch)

Visual prototypes live outside this folder:

`../stitch_the_big_talk_game/stitch_the_big_talk_game/`

| Screen | Stitch file |
|--------|-------------|
| Lobby | `lobby/code.html` |
| Question Builder | `question_builder/code.html` |
| Answer Phase | `answer_phase/code.html` |
| Verdict | `the_verdict/code.html` |
| Match Found | `match_found/code.html` |

Theme tokens (colors, fonts) are ported into `src/index.css`.

## Setup

```bash
cd web
npm install
cp .env.example .env
# Fill Firebase web config in .env
npm run dev
```

## Scripts

- `npm run dev` — local development
- `npm run build` — production build
- `npm run preview` — preview production build

## Phase status

- **Phase 0 (current):** Vite + React + Tailwind + Router + Firebase init + route shells
- **Next:** Phase 1 — Auth & profiles

See `../DEVELOPMENT_PLAN.md` for the full roadmap.
