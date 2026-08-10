import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AppHeader } from '@/components/AppHeader'
import { EmptyState } from '@/components/EmptyState'
import { GateScreen } from '@/components/GateScreen'
import { PageLoader } from '@/components/PageLoader'
import { StickyCtaBar } from '@/components/StickyCtaBar'
import { useToast } from '@/components/Toast'
import { useAuth } from '@/features/auth/AuthProvider'
import { useRoom } from '@/features/lobby/useRoom'
import { inviteUrl, whatsappShareUrl } from '@/features/lobby/types'

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}

export function LobbyPage() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { room, loading, error } = useRoom(roomId)
  const { pushToast } = useToast()
  const [copied, setCopied] = useState(false)

  const isMember = useMemo(() => {
    if (!user || !room) return false
    return room.memberIds.includes(user.uid)
  }, [room, user])

  const bothConnected = Boolean(room?.partnerA && room?.partnerB)
  const invite = roomId ? inviteUrl(roomId) : ''
  const isClosed = room?.status === 'closed'

  async function copyInvite() {
    if (!invite) return
    try {
      await navigator.clipboard.writeText(invite)
      setCopied(true)
      pushToast('Invite link copied.', 'success')
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
      pushToast('Could not copy link. Select and copy it manually.', 'error')
    }
  }

  if (loading) {
    return <PageLoader message="Connecting to lobby…" />
  }

  if (error || !room) {
    return (
      <GateScreen
        title="Lobby unavailable"
        description={error ?? 'This room could not be found.'}
      />
    )
  }

  if (user && !isMember) {
    return (
      <GateScreen
        title="You’re not in this room"
        description="Use the invite link to join, or return home."
        actionLabel="Go to join"
        actionTo={`/join/${room.roomId}`}
      />
    )
  }

  const nameA = room.partnerADisplayName
  const nameB = room.partnerBDisplayName ?? 'Waiting…'
  const titlePair = bothConnected
    ? `${nameA} & ${nameB}`
    : `${nameA} & partner`

  return (
    <div className="min-h-screen bg-background text-on-background">
      <AppHeader room={room} uid={user?.uid} />

      <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-margin-mobile pb-36 pt-8 md:gap-10 md:px-8">
        <section className="mx-auto max-w-2xl animate-fade-in-up text-center">
          <h1 className="font-display text-3xl font-bold tracking-tight text-on-surface sm:text-4xl md:text-5xl">
            Welcome to the Lobby,
            <br />
            <span className="text-primary">{titlePair}.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-on-surface-variant sm:text-lg">
            Take a deep breath. This is a safe space for important conversations
            with clarity and mutual respect.
          </p>
        </section>

        {isClosed && (
          <EmptyState
            title="This room is closed"
            description="Someone left or cancelled the session. Create a new room anytime — there’s no limit."
            action={
              <Link
                to="/app"
                className="rounded-full bg-primary px-6 py-3 font-label text-sm font-semibold text-on-primary"
              >
                Back to app
              </Link>
            }
          />
        )}

        <section className="mx-auto grid w-full max-w-3xl grid-cols-1 gap-6 md:grid-cols-2">
          <PartnerCard
            name={nameA}
            username={room.partnerAUsername}
            connected
            accent="primary"
            you={user?.uid === room.partnerA}
          />
          <PartnerCard
            name={bothConnected ? nameB : 'Partner'}
            username={room.partnerBUsername}
            connected={bothConnected}
            accent="secondary"
            you={user?.uid === room.partnerB}
            waiting={!bothConnected}
          />
        </section>

        {!bothConnected && !isClosed && (
          <section className="mx-auto w-full max-w-3xl rounded-[32px] border border-outline-variant/20 bg-surface-container-low/70 p-6 ambient-shadow backdrop-blur-xl sm:p-8">
            <h2 className="font-headline text-xl font-semibold text-on-surface">
              Invite your partner
            </h2>
            <p className="mt-2 text-on-surface-variant">
              Share this private link. They’ll join after signing in.
            </p>
            <p className="mt-4 break-all rounded-2xl bg-surface px-4 py-3 font-label text-sm text-on-surface">
              {invite}
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => void copyInvite()}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 font-label text-sm font-semibold text-on-primary"
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden>
                  content_copy
                </span>
                {copied ? 'Copied!' : 'Copy invite link'}
              </button>
              <a
                href={whatsappShareUrl(room.roomId)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-outline-variant px-5 py-3 text-center font-label text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container"
              >
                Share on WhatsApp
              </a>
            </div>
            {profile?.username && (
              <p className="mt-4 text-sm text-on-surface-variant">
                You’re signed in as @{profile.username}
              </p>
            )}
          </section>
        )}

        <section className="mx-auto w-full max-w-3xl">
          <div className="relative overflow-hidden rounded-[32px] border border-outline-variant/20 bg-surface-container-low/60 p-7 ambient-shadow backdrop-blur-xl sm:p-8 md:p-10">
            <div className="absolute top-0 right-0 -z-10 h-64 w-64 rounded-bl-[100px] bg-primary-container/10 blur-3xl" />
            <h2 className="font-headline text-xl font-semibold text-on-surface md:text-2xl">
              How this room works
            </h2>
            <ol className="mt-4 list-decimal space-y-3 pl-5 leading-relaxed text-on-surface-variant">
              <li>
                You each build questions privately — custom ones plus starter decks.
              </li>
              <li>
                Lists swap only when you both tap Ready; answers unlock the same way.
              </li>
              <li>
                The Yes/No verdict is double-blind. No Match never reveals who said No.
              </li>
              <li>Take your time and be honest. This space is only for the two of you.</li>
            </ol>
          </div>
        </section>
      </main>

      {!isClosed && (
        <StickyCtaBar>
          <button
            type="button"
            disabled={!bothConnected}
            onClick={() => navigate(`/room/${room.roomId}/questions`)}
            className="flex w-full min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 font-label text-sm font-semibold text-on-primary shadow-[0_8px_20px_-6px_rgba(22,105,101,0.4)] transition-all duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {bothConnected ? 'Start question phase' : 'Waiting for partner…'}
            {bothConnected ? (
              <span className="material-symbols-outlined text-[20px]" aria-hidden>
                arrow_forward
              </span>
            ) : null}
          </button>
        </StickyCtaBar>
      )}
    </div>
  )
}

function PartnerCard(props: {
  name: string
  username: string | null
  connected: boolean
  waiting?: boolean
  you?: boolean
  accent: 'primary' | 'secondary'
}) {
  return (
    <div className="relative flex flex-col items-center justify-center gap-5 overflow-hidden rounded-[32px] border border-white/50 bg-surface-container p-8 ambient-shadow transition-transform duration-300 hover:scale-[1.01]">
      <div
        className={`absolute h-32 w-32 rounded-full blur-2xl ${
          props.accent === 'primary'
            ? '-top-12 -right-12 bg-primary/5'
            : '-bottom-12 -left-12 bg-primary-container/20'
        }`}
      />
      <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-background bg-surface-container-high text-2xl font-semibold text-primary shadow-sm">
        {props.waiting ? '?' : initials(props.name) || '•'}
        {props.connected && (
          <span className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-2 border-background bg-primary animate-soft-pulse" />
        )}
      </div>
      <div className="relative z-10 flex flex-col items-center gap-2 text-center">
        <h3 className="font-headline text-xl font-semibold text-on-surface sm:text-2xl">
          {props.name}
          {props.you ? (
            <span className="ml-2 font-label text-sm font-semibold text-primary">
              (you)
            </span>
          ) : null}
        </h3>
        {props.username ? (
          <p className="text-sm text-on-surface-variant">@{props.username}</p>
        ) : null}
        <div className="flex items-center justify-center gap-2 rounded-full border border-surface-variant/50 bg-background/80 px-4 py-1.5 backdrop-blur-sm">
          <div
            className={`h-2.5 w-2.5 rounded-full ${
              props.connected
                ? 'animate-soft-pulse bg-primary'
                : 'bg-outline-variant'
            }`}
          />
          <span className="font-label text-sm font-semibold text-on-surface-variant">
            {props.connected ? 'Connected' : 'Waiting to join'}
          </span>
        </div>
      </div>
    </div>
  )
}
