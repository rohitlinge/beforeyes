import { Link, useNavigate, useParams } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import { AppHeader } from '@/components/AppHeader'
import { GateScreen } from '@/components/GateScreen'
import { PageLoader } from '@/components/PageLoader'
import { useToast } from '@/components/Toast'
import { useAuth } from '@/features/auth/AuthProvider'
import { useRoom } from '@/features/lobby/useRoom'
import { createRoom } from '@/features/lobby/api'
import { trackEvent } from '@/lib/analytics'
import {
  subscribeExchangedAnswers,
  subscribePrivateAnswers,
  type AnswerItem,
} from '@/features/answers/api'
import {
  subscribeMyAgreements,
  type AgreementRating,
} from '@/features/agreements/api'
import {
  buildCompatibilityReportHtml,
  downloadCompatibilityReport,
} from '@/features/agreements/report'

export function ResultPage() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { pushToast } = useToast()
  const { user, profile } = useAuth()
  const { room, loading, error } = useRoom(roomId)
  const trackedResult = useRef<string | null>(null)

  const [myAnswers, setMyAnswers] = useState<AnswerItem[]>([])
  const [partnerAnswers, setPartnerAnswers] = useState<AnswerItem[]>([])
  const [myRatings, setMyRatings] = useState<AgreementRating[]>([])

  const score = room?.compatibilityScore
  const pairName =
    room && room.partnerB
      ? `${room.partnerADisplayName} & ${room.partnerBDisplayName}`
      : 'You both'

  const isPartnerA = Boolean(user && room && room.partnerA === user.uid)
  const partnerName = useMemo(() => {
    if (!room || !user) return 'Partner'
    return isPartnerA
      ? room.partnerBDisplayName ?? 'Partner'
      : room.partnerADisplayName
  }, [room, user, isPartnerA])
  const myName =
    profile?.displayName ||
    (isPartnerA ? room?.partnerADisplayName : room?.partnerBDisplayName) ||
    'You'

  useEffect(() => {
    if (!roomId || !user) return
    return subscribePrivateAnswers(roomId, user.uid, setMyAnswers)
  }, [roomId, user])

  useEffect(() => {
    if (!roomId || !user) return
    return subscribeExchangedAnswers(roomId, user.uid, (answers) => {
      setPartnerAnswers(answers ?? [])
    })
  }, [roomId, user])

  useEffect(() => {
    if (!roomId || !user) return
    return subscribeMyAgreements(roomId, user.uid, (doc) => {
      setMyRatings(doc?.ratings ?? [])
    })
  }, [roomId, user])

  useEffect(() => {
    if (score == null || !room?.roomId) return
    const key = `${room.roomId}:${score}`
    if (trackedResult.current === key) return
    trackedResult.current = key
    trackEvent('verdict_revealed', { room_id: room.roomId, score })
    trackEvent('result_score', { room_id: room.roomId, score })
  }, [score, room?.roomId])

  async function startAnother() {
    if (!user || !profile) return
    try {
      const next = await createRoom({
        uid: user.uid,
        displayName: profile.displayName,
        username: profile.username,
      })
      pushToast('New room ready.', 'success')
      navigate(`/room/${next.roomId}/lobby`)
    } catch (err) {
      pushToast(
        err instanceof Error ? err.message : 'Could not create a new room.',
        'error',
      )
    }
  }

  function onDownloadReport() {
    if (!room || score == null) return
    const html = buildCompatibilityReportHtml({
      room,
      score,
      partnerName,
      myName,
      partnerAnswers,
      myAnswers,
      myRatings,
    })
    downloadCompatibilityReport(
      html,
      `beforeyes-report-${room.roomId}-${score}pct.html`,
    )
    trackEvent('report_downloaded', { room_id: room.roomId, score })
    pushToast('Report downloaded.', 'success')
  }

  if (loading) {
    return <PageLoader message="Loading result…" />
  }

  if (error || !room || score == null) {
    return (
      <GateScreen
        title="Result not ready"
        description={
          error ??
          'Both partners need to submit Agree / Disagree ratings first.'
        }
        actionLabel="← Back to review"
        actionTo={roomId ? `/room/${roomId}/review` : '/app'}
      />
    )
  }

  const tone =
    score >= 80 ? 'strong' : score >= 55 ? 'mixed' : 'low'

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-on-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-55"
        style={{
          background:
            'radial-gradient(circle at 50% -20%, rgba(95,168,163,0.4) 0%, transparent 60%), radial-gradient(circle at 100% 120%, rgba(166,240,234,0.35) 0%, transparent 50%)',
        }}
      />

      <AppHeader room={room} uid={user?.uid} transparent />

      <main className="relative z-10 mx-auto flex min-h-[70vh] w-full max-w-2xl flex-col items-center justify-center px-margin-mobile py-12 pb-safe md:px-8">
        <div className="animate-fade-in-up flex w-full flex-col items-center rounded-3xl border border-outline-variant/30 bg-surface/70 p-8 text-center shadow-[0_20px_40px_-15px_rgba(22,105,101,0.08)] backdrop-blur-2xl md:p-12">
          <div className="mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-primary/10">
            <span className="font-display text-3xl font-bold text-primary">
              {score}%
            </span>
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-on-surface sm:text-4xl">
            {score}% aligned for you
          </h1>
          <p className="mt-3 font-headline text-lg font-semibold text-on-surface sm:text-xl">
            {pairName}
          </p>
          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-on-surface-variant">
            {tone === 'strong'
              ? 'Strong shared agreement across the answers you both rated. Use this clarity as a foundation for the commitment conversation.'
              : tone === 'mixed'
                ? 'Partial alignment—some answers landed, others didn’t. The gaps are worth talking through before a big decision.'
                : 'Lower shared agreement. That doesn’t mean failure—it means honest differences showed up. Take time before saying yes.'}
          </p>
          <p className="mx-auto mt-3 max-w-md text-sm text-on-surface-variant">
            Score = combined Agree rate from both of you rating each other’s
            answers. No Maybe options—only clear Agree or Disagree.
          </p>

          <div className="mt-10 w-full rounded-2xl border border-outline-variant/40 bg-surface-container-low/80 px-5 py-5 text-left">
            <p className="text-sm leading-relaxed text-on-surface-variant">
              You can download this report for yourself or share it with a
              relationship therapist if you both choose to. It includes your
              questions, answers, your ratings, and this compatibility score.
            </p>
            <button
              type="button"
              onClick={onDownloadReport}
              className="mt-4 flex w-full min-h-12 items-center justify-center gap-2 rounded-full border border-outline-variant bg-surface px-6 py-3 font-label font-semibold text-on-surface transition-colors hover:bg-surface-container"
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden>
                download
              </span>
              Download report
            </button>
          </div>

          <div className="mt-6 flex w-full flex-col gap-3">
            <button
              type="button"
              onClick={() => void startAnother()}
              className="min-h-12 rounded-full bg-primary px-6 py-4 font-label font-semibold text-on-primary shadow-[0_8px_20px_-6px_rgba(22,105,101,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              Start another private room
            </button>
            <Link
              to="/app"
              className="min-h-11 rounded-full border border-outline-variant px-6 py-3 text-center font-label font-semibold text-on-surface"
            >
              Back to home
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
