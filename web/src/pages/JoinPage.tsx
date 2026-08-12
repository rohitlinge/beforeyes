import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Atmosphere } from '@/components/Atmosphere'
import { InlineError } from '@/components/InlineError'
import { PageLoader } from '@/components/PageLoader'
import { useAuth } from '@/features/auth/AuthProvider'
import { getRoom, joinRoom } from '@/features/lobby/api'
import { roomPhasePath } from '@/features/lobby/types'

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
    if (!routeRoomId || !uid || !profile) return

    let cancelled = false
    setJoining(true)
    setError(null)
    setJoinStep('start')

    void (async () => {
      try {
        setJoinStep('getRoom')
        const existing = await getRoom(routeRoomId)
        if (!existing) {
          throw new Error('Room not found. Check the invite link and try again.')
        }

        if (existing.partnerA === uid || existing.partnerB === uid) {
          const dest = roomPhasePath(routeRoomId, existing.status)
          setJoinStep('redirect-member')
          window.location.replace(dest)
          return
        }

        setJoinStep('joinRoom')
        await joinRoom({
          roomId: routeRoomId,
          uid,
          displayName: displayName || 'Partner B',
          username: username || '',
        })
        setJoinStep('redirect-joined')
        // New joiners start in lobby to meet / invite flow.
        window.location.replace(`/room/${routeRoomId}/lobby`)
      } catch (err) {
        if (!cancelled) {
          setJoinStep('error')
          setError(err instanceof Error ? err.message : 'Could not join room.')
          setJoining(false)
        }
      }
    })()

    return () => {
      cancelled = true
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
        const dest = roomPhasePath(trimmed, existing.status)
        window.location.replace(dest)
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
      <PageLoader message={`Connecting you to the room… (${joinStep})`} />
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
              : 'Paste the room code or open the full invite link.'}
          </p>

          <form className="mt-8 flex flex-col gap-4 text-left" onSubmit={onSubmit}>
            <label className="flex flex-col gap-1.5">
              <span className="font-label text-sm font-semibold text-on-surface-variant">
                Room code
              </span>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. a1b2c3d4e5"
                className="rounded-2xl border border-outline-variant bg-surface px-4 py-3 outline-none focus:border-primary"
                required
              />
            </label>
            <InlineError message={error} />
            <button
              type="submit"
              disabled={joining}
              className="min-h-12 rounded-full bg-primary py-4 font-label font-semibold text-on-primary disabled:opacity-60"
            >
              {joining ? 'Joining…' : 'Join room'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-on-surface-variant">
            <Link to="/app" className="font-semibold text-primary">
              Back to app
            </Link>
          </p>
        </div>
      </div>
    </Atmosphere>
  )
}
