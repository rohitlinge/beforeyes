import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { Atmosphere } from '@/components/Atmosphere'
import { InlineError } from '@/components/InlineError'
import { PageLoader } from '@/components/PageLoader'
import { useAuth } from '@/features/auth/AuthProvider'
import { getRoom, joinRoom } from '@/features/lobby/api'
import { db } from '@/lib/firebase'

function debugLog(
  location: string,
  message: string,
  data: Record<string, unknown>,
  hypothesisId = 'F',
) {
  // #region agent log
  const payload = {
    sessionId: '518cb8',
    runId: 'post-fix-3',
    hypothesisId,
    location,
    message,
    data,
    timestamp: Date.now(),
  }
  fetch('http://127.0.0.1:7370/ingest/ac5c11ac-0645-4a28-afc5-a7c1935a705a', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': '518cb8',
    },
    body: JSON.stringify(payload),
  }).catch(() => {})
  // #endregion
}

async function writeJoinBreadcrumb(
  uid: string,
  step: string,
  data: Record<string, unknown>,
) {
  // #region agent log
  if (!db) return
  try {
    await updateDoc(doc(db, 'users', uid), {
      _joinDebug: { step, ...data, at: Date.now() },
      updatedAt: serverTimestamp(),
    })
  } catch (err) {
    debugLog('JoinPage.tsx:breadcrumb-fail', 'breadcrumb write failed', {
      step,
      error: err instanceof Error ? err.message : String(err),
    }, 'F')
  }
  // #endregion
}

export function JoinPage() {
  const { roomId: routeRoomId } = useParams()
  const { user, profile } = useAuth()
  const [code, setCode] = useState(routeRoomId ?? '')
  const [error, setError] = useState<string | null>(null)
  const [joining, setJoining] = useState(false)
  const [joinStep, setJoinStep] = useState('idle')

  const uid = user?.uid
  const displayName = profile?.displayName
  const username = profile?.username

  useEffect(() => {
    if (routeRoomId) setCode(routeRoomId)
  }, [routeRoomId])

  useEffect(() => {
    debugLog('JoinPage.tsx:effect-entry', 'auto-join effect entry', {
      routeRoomId: routeRoomId ?? null,
      hasUid: Boolean(uid),
      hasProfile: Boolean(profile),
    })

    if (!routeRoomId || !uid || !profile) return

    let cancelled = false
    setJoining(true)
    setError(null)
    setJoinStep('start')
    void writeJoinBreadcrumb(uid, 'start', { routeRoomId })

    void (async () => {
      try {
        setJoinStep('getRoom')
        void writeJoinBreadcrumb(uid, 'getRoom', { routeRoomId })
        const existing = await getRoom(routeRoomId)
        debugLog('JoinPage.tsx:getRoom', 'getRoom result', {
          found: Boolean(existing),
          status: existing?.status ?? null,
          alreadyMember: existing
            ? existing.partnerA === uid || existing.partnerB === uid
            : false,
          cancelled,
        })
        if (!existing) {
          throw new Error('Room not found. Check the invite link and try again.')
        }

        if (existing.partnerA === uid || existing.partnerB === uid) {
          setJoinStep('redirect-member')
          void writeJoinBreadcrumb(uid, 'redirect-member', { routeRoomId })
          debugLog('JoinPage.tsx:already-member', 'hard redirect to lobby', {
            routeRoomId,
          })
          window.location.replace(`/room/${routeRoomId}/lobby`)
          return
        }

        setJoinStep('joinRoom')
        void writeJoinBreadcrumb(uid, 'joinRoom', { routeRoomId })
        await joinRoom({
          roomId: routeRoomId,
          uid,
          displayName: displayName || 'Partner B',
          username: username || '',
        })
        setJoinStep('redirect-joined')
        void writeJoinBreadcrumb(uid, 'redirect-joined', { routeRoomId })
        debugLog('JoinPage.tsx:after-join', 'join ok; hard redirect to lobby', {
          cancelled,
          routeRoomId,
        })
        // Hard navigation avoids React Router / Strict Mode leaving Partner 2
        // stranded on the join loader after Firestore already accepted the join.
        window.location.replace(`/room/${routeRoomId}/lobby`)
      } catch (err) {
        debugLog(
          'JoinPage.tsx:catch',
          'auto-join error',
          {
            cancelled,
            error: err instanceof Error ? err.message : String(err),
          },
          'E',
        )
        void writeJoinBreadcrumb(uid, 'error', {
          routeRoomId,
          error: err instanceof Error ? err.message : String(err),
        })
        if (!cancelled) {
          setJoinStep('error')
          setError(err instanceof Error ? err.message : 'Could not join room.')
          setJoining(false)
        }
      }
    })()

    return () => {
      cancelled = true
      debugLog('JoinPage.tsx:cleanup', 'auto-join effect cleanup', { routeRoomId })
    }
  }, [routeRoomId, uid, displayName, username, profile])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = code.trim()
    if (!trimmed) return

    if (!user || !profile) {
      setError('You must be signed in to join.')
      return
    }

    setJoining(true)
    setJoinStep('manual-join')
    setError(null)
    try {
      const existing = await getRoom(trimmed)
      if (!existing) {
        throw new Error('Room not found. Check the invite link and try again.')
      }

      if (existing.partnerA === user.uid || existing.partnerB === user.uid) {
        window.location.replace(`/room/${trimmed}/lobby`)
        return
      }

      await joinRoom({
        roomId: trimmed,
        uid: user.uid,
        displayName: profile.displayName,
        username: profile.username,
      })
      window.location.replace(`/room/${trimmed}/lobby`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not join room.')
      setJoining(false)
      setJoinStep('error')
    }
  }

  if (routeRoomId && joining && !error) {
    return (
      <PageLoader message={`Connecting you to the lobby… (${joinStep})`} />
    )
  }

  return (
    <Atmosphere>
      <div className="flex min-h-screen flex-col items-center justify-center px-margin-mobile py-10">
        <div className="w-full max-w-md rounded-[32px] border border-white/50 bg-surface-container/95 p-8 text-center ambient-shadow backdrop-blur-sm">
          <p className="font-label text-sm font-semibold text-primary">
            Partner invite
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-on-surface">
            Join a private room
          </h1>
          <p className="mt-3 font-body text-on-surface-variant">
            {routeRoomId
              ? error
                ? 'Something went wrong joining automatically. Check the code and try again.'
                : 'Enter the room code from your partner’s invite.'
              : 'Paste the room code from your partner’s invite link.'}
          </p>

          <form className="mt-6 flex flex-col gap-3 text-left" onSubmit={onSubmit}>
            <label className="flex flex-col gap-1.5">
              <span className="font-label text-sm font-semibold text-on-surface-variant">
                Room code
              </span>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. a1b2c3d4e5"
                className="rounded-2xl border border-outline-variant bg-surface px-4 py-3.5 text-on-surface outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
                disabled={joining}
              />
            </label>

            <InlineError message={error} />

            <button
              type="submit"
              disabled={joining || !code.trim()}
              className="mt-1 min-h-12 rounded-full bg-primary py-4 font-label font-semibold text-on-primary transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-60"
            >
              {joining ? 'Joining…' : 'Join lobby'}
            </button>
          </form>

          <Link
            to="/app"
            className="mt-8 inline-block min-h-11 font-label text-sm font-semibold text-primary"
          >
            ← Back to app
          </Link>
        </div>
      </div>
    </Atmosphere>
  )
}
