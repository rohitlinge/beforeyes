/**
 * Build a downloadable compatibility report (HTML) for the couple or a relationship therapist.
 */
import type { AnswerItem } from '@/features/answers/api'
import type { AgreementRating } from '@/features/agreements/api'
import type { Room } from '@/features/lobby/types'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatAnswerBlock(
  title: string,
  items: AnswerItem[],
  ratingsByQuestion?: Map<string, AgreementRating>,
): string {
  if (items.length === 0) {
    return `<h2>${escapeHtml(title)}</h2><p>None recorded.</p>`
  }
  const rows = items
    .map((item, i) => {
      const rating = ratingsByQuestion?.get(item.questionId)
      const ratingLine = rating
        ? `<p><strong>Your rating:</strong> ${
            rating.agreement === 'agree' ? 'Agree' : 'Disagree'
          }</p>`
        : ''
      return `
        <article class="card">
          <p class="qnum">Q${i + 1}</p>
          <h3>${escapeHtml(item.questionText)}</h3>
          <p class="answer">${escapeHtml(item.text)}</p>
          ${ratingLine}
        </article>`
    })
    .join('\n')
  return `<h2>${escapeHtml(title)}</h2>\n${rows}`
}

export function buildCompatibilityReportHtml(input: {
  room: Room
  score: number
  partnerName: string
  myName: string
  partnerAnswers: AnswerItem[]
  myAnswers: AnswerItem[]
  myRatings: AgreementRating[]
}): string {
  const {
    room,
    score,
    partnerName,
    myName,
    partnerAnswers,
    myAnswers,
    myRatings,
  } = input
  const ratingsMap = new Map(myRatings.map((r) => [r.questionId, r]))
  const generated = new Date().toLocaleString()
  const pair = room.partnerB
    ? `${room.partnerADisplayName} & ${room.partnerBDisplayName}`
    : myName

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>BeforeYes Compatibility Report — ${escapeHtml(pair)}</title>
  <style>
    body { font-family: Georgia, serif; max-width: 720px; margin: 40px auto; padding: 0 20px; color: #1a2e2c; line-height: 1.5; }
    h1 { font-size: 1.75rem; margin-bottom: 0.25rem; }
    h2 { font-size: 1.2rem; margin-top: 2rem; border-bottom: 1px solid #bec9c7; padding-bottom: 0.35rem; }
    h3 { font-size: 1rem; margin: 0.35rem 0; }
    .meta { color: #5a6f6c; font-size: 0.95rem; }
    .score { font-size: 2.5rem; font-weight: bold; color: #166965; margin: 1rem 0; }
    .card { border: 1px solid #d5dedc; border-radius: 12px; padding: 1rem 1.15rem; margin: 0.75rem 0; background: #f7fafa; }
    .qnum { font-size: 0.75rem; letter-spacing: 0.06em; text-transform: uppercase; color: #7a8c89; margin: 0; }
    .answer { white-space: pre-wrap; color: #3d524f; }
    .note { margin-top: 2rem; font-size: 0.9rem; color: #5a6f6c; }
    @media print { body { margin: 16px; } }
  </style>
</head>
<body>
  <h1>BeforeYes Compatibility Report</h1>
  <p class="meta">${escapeHtml(pair)} · Generated ${escapeHtml(generated)} · Room ${escapeHtml(room.roomId)}</p>
  <p class="score">${score}% aligned</p>
  <p>This score is the shared Agree rate across both partners’ ratings of each other’s answers. There is no Maybe option—only Agree or Disagree—so the percentage reflects clear alignment, not soft middle ground.</p>

  ${formatAnswerBlock(
    `${partnerName}’s answers to ${myName}’s questions (with your ratings)`,
    partnerAnswers,
    ratingsMap,
  )}

  ${formatAnswerBlock(
    `${myName}’s answers to ${partnerName}’s questions`,
    myAnswers,
  )}

  <p class="note">Private by design for the two of you. You may share this file with a relationship therapist if you both choose to. BeforeYes is not legal, medical, or counseling advice.</p>
</body>
</html>`
}

export function downloadCompatibilityReport(
  html: string,
  filename = 'beforeyes-compatibility-report.html',
): void {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
