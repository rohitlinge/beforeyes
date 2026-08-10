import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BrandMark } from '@/components/BrandMark'
import { EmptyState } from '@/components/EmptyState'
import { InlineError } from '@/components/InlineError'
import { useToast } from '@/components/Toast'
import { useAuth } from '@/features/auth/AuthProvider'
import { normalizeUsername } from '@/features/auth/types'
import { createRoom } from '@/features/lobby/api'
import { useUserRooms } from '@/features/lobby/useRoom'
import { statusLabel } from '@/features/lobby/types'

export function AppHomePage() {
  const navigate = useNavigate()
  const { pushToast } = useToast()
  const { user, profile, logOut, saveProfile, configured } = useAuth()
  const { rooms, loading: roomsLoading, error: roomsError } = useUserRooms(
    user?.uid,
  )

  const [editing, setEditing] = useState(false)
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '')
  const [username, setUsername] = useState(profile?.username ?? '')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [creating, setCreating] = useState(false)

  function startEdit() {
    setDisplayName(profile?.displayName ?? '')
    setUsername(profile?.username ?? '')
    setMessage(null)
    setError(null)
    setEditing(true)
  }

  async function onSave(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      await saveProfile({
        displayName,
        username: normalizeUsername(username),
      })
      setMessage('Profile updated.')
      pushToast('Profile updated.', 'success')
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile.')
    } finally {
      setSaving(false)
    }
  }

  async function onCreateRoom() {
    if (!user || !profile) return
    setCreating(true)
    setError(null)
    try {
      const room = await createRoom({
        uid: user.uid,
        displayName: profile.displayName,
        username: profile.username,
      })
      pushToast('Private room created.', 'success')
      navigate(`/room/${room.roomId}/lobby`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create room.')
      setCreating(false)
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-3xl bg-background px-margin-mobile py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <BrandMark to="/" size="sm" />
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-on-surface">
            Hi{profile?.displayName ? `, ${profile.displayName}` : ''}
          </h1>
          <p className="mt-2 text-on-surface-variant">
            {profile?.username
              ? `@${profile.username}`
              : 'Complete your profile to continue.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void logOut()}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-outline-variant px-4 py-2 font-label text-sm font-semibold text-on-surface-variant transition-colors hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden>
            logout
          </span>
          Log out
        </button>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <button
          type="button"
          onClick={() => void onCreateRoom()}
          disabled={creating || !profile?.username}
          className="min-h-12 rounded-full bg-primary px-5 py-3.5 text-left font-label font-semibold text-on-primary transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {creating ? 'Creating room…' : 'Create a private room'}
        </button>
        <Link
          to="/join"
          className="min-h-12 rounded-full border border-outline-variant px-5 py-3.5 text-center font-label font-semibold text-on-surface transition-colors hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          Join with invite link
        </Link>
      </div>

      <div className="mt-4">
        <InlineError message={error} />
      </div>

      <section className="mt-10">
        <h2 className="font-headline text-lg font-semibold text-on-surface">
          Your rooms
        </h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          Unlimited history — open any room to continue.
        </p>

        {roomsLoading && (
          <div className="mt-6 flex items-center gap-3 text-sm text-on-surface-variant">
            <div
              className="h-5 w-5 animate-spin rounded-full border-2 border-outline-variant border-t-primary"
              aria-hidden
            />
            Loading rooms…
          </div>
        )}
        <InlineError message={roomsError} />
        {!roomsLoading && rooms.length === 0 && (
          <div className="mt-4">
            <EmptyState
              title="No rooms yet"
              description="Create a private room and invite your partner with a WhatsApp link."
            />
          </div>
        )}

        <ul className="mt-4 flex flex-col gap-3">
          {rooms.map((room) => {
            const otherName =
              room.partnerA === user?.uid
                ? room.partnerBDisplayName ?? 'Waiting for partner'
                : room.partnerADisplayName
            const closed = room.status === 'closed'
            return (
              <li key={room.roomId}>
                <Link
                  to={`/room/${room.roomId}/lobby`}
                  className="block rounded-[24px] border border-white/50 bg-surface-container px-5 py-4 ambient-shadow transition-transform hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-headline font-semibold text-on-surface">
                        With {otherName}
                      </p>
                      <p className="mt-1 text-sm text-on-surface-variant">
                        {statusLabel(room.status)}
                      </p>
                    </div>
                    <span className="font-label text-sm font-semibold text-primary">
                      {closed ? 'View →' : 'Open →'}
                    </span>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="mt-10 rounded-[28px] border border-white/50 bg-surface-container p-6 ambient-shadow">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-headline text-lg font-semibold text-on-surface">
            Your profile
          </h2>
          {!editing && (
            <button
              type="button"
              onClick={startEdit}
              className="font-label text-sm font-semibold text-primary"
            >
              Edit
            </button>
          )}
        </div>

        {!editing ? (
          <dl className="mt-4 grid gap-3 text-sm">
            <div>
              <dt className="text-on-surface-variant">Display name</dt>
              <dd className="font-semibold text-on-surface">
                {profile?.displayName || '—'}
              </dd>
            </div>
            <div>
              <dt className="text-on-surface-variant">Username</dt>
              <dd className="font-semibold text-on-surface">
                {profile?.username ? `@${profile.username}` : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-on-surface-variant">Email</dt>
              <dd className="font-semibold text-on-surface">
                {profile?.email || '—'}
              </dd>
            </div>
          </dl>
        ) : (
          <form className="mt-4 flex flex-col gap-4" onSubmit={onSave}>
            <label className="flex flex-col gap-1.5">
              <span className="font-label text-sm font-semibold text-on-surface-variant">
                Display name
              </span>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="rounded-2xl border border-outline-variant bg-surface px-4 py-3 outline-none focus:border-primary"
                required
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="font-label text-sm font-semibold text-on-surface-variant">
                Username
              </span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="rounded-2xl border border-outline-variant bg-surface px-4 py-3 outline-none focus:border-primary"
                required
              />
            </label>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-primary px-5 py-2.5 font-label font-semibold text-on-primary disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-full border border-outline-variant px-5 py-2.5 font-label font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {message && (
          <p className="mt-4 text-sm font-semibold text-primary">{message}</p>
        )}
      </section>

      <p className="mt-10 text-center text-xs text-on-surface-variant">
        <Link to="/" className="font-semibold text-primary">
          About this product
        </Link>
      </p>

      {!configured && (
        <p className="mt-6 text-sm text-tertiary">
          Firebase is not configured yet.
        </p>
      )}
    </div>
  )
}
