import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Atmosphere } from '@/components/Atmosphere'
import { BrandMark } from '@/components/BrandMark'
import { InlineError } from '@/components/InlineError'
import { PageLoader } from '@/components/PageLoader'
import { SiteFooter } from '@/components/SiteFooter'
import { useAuth } from '@/features/auth/AuthProvider'
import {
  approveConsultant,
  rejectAndDeleteConsultant,
  subscribeApprovedConsultants,
  subscribeIsAdmin,
  subscribePendingConsultants,
} from '@/features/consultants/api'
import {
  defaultSeoForConsultant,
  type ConsultantProfile,
} from '@/features/consultants/types'

export function AdminConsultantsPage() {
  const { user, loading: authLoading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminChecked, setAdminChecked] = useState(false)
  const [pending, setPending] = useState<ConsultantProfile[]>([])
  const [approved, setApproved] = useState<ConsultantProfile[]>([])
  const [error, setError] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [seoTitle, setSeoTitle] = useState('')
  const [seoDescription, setSeoDescription] = useState('')
  const [seoKeywords, setSeoKeywords] = useState('')
  const [slug, setSlug] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!user) {
      setIsAdmin(false)
      setAdminChecked(true)
      return
    }
    setAdminChecked(false)
    return subscribeIsAdmin(user.uid, (ok) => {
      setIsAdmin(ok)
      setAdminChecked(true)
    })
  }, [user])

  useEffect(() => {
    if (!isAdmin) return
    const unsubP = subscribePendingConsultants(setPending, (err) =>
      setError(err.message),
    )
    const unsubA = subscribeApprovedConsultants(setApproved, (err) =>
      setError(err.message),
    )
    return () => {
      unsubP()
      unsubA()
    }
  }, [isAdmin])

  function openReview(c: ConsultantProfile) {
    setActiveId(c.id)
    const defaults = defaultSeoForConsultant(c)
    setSeoTitle(c.seoTitle || defaults.seoTitle)
    setSeoDescription(c.seoDescription || defaults.seoDescription)
    setSeoKeywords(c.seoKeywords || defaults.seoKeywords)
    setSlug(c.slug)
    setError(null)
  }

  async function onApprove() {
    if (!user || !activeId) return
    setBusy(true)
    setError(null)
    try {
      await approveConsultant(activeId, user.uid, {
        seoTitle,
        seoDescription,
        seoKeywords,
        slug,
      })
      setActiveId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Approve failed.')
    } finally {
      setBusy(false)
    }
  }

  async function onReject(id: string) {
    if (!window.confirm('Delete this unverified application permanently?')) return
    setBusy(true)
    setError(null)
    try {
      await rejectAndDeleteConsultant(id)
      if (activeId === id) setActiveId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed.')
    } finally {
      setBusy(false)
    }
  }

  if (authLoading || !adminChecked) {
    return <PageLoader message="Checking admin access…" />
  }

  if (!user) {
    return (
      <Atmosphere>
        <div className="mx-auto max-w-md px-margin-mobile py-16 text-center md:px-8">
          <BrandMark to="/" size="sm" />
          <h1 className="mt-8 font-display text-2xl font-bold text-on-surface">
            Admin sign-in required
          </h1>
          <Link
            to="/login"
            state={{ from: '/admin/consultants' }}
            className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-6 font-label text-sm font-semibold text-on-primary"
          >
            Log in
          </Link>
        </div>
      </Atmosphere>
    )
  }

  if (!isAdmin) {
    return (
      <Atmosphere>
        <div className="mx-auto max-w-md px-margin-mobile py-16 text-center md:px-8">
          <BrandMark to="/" size="sm" />
          <h1 className="mt-8 font-display text-2xl font-bold text-on-surface">
            Not an admin
          </h1>
          <p className="mt-3 text-on-surface-variant">
            Your account is not on the admin allowlist. Ask the project owner to
            create <code className="rounded bg-surface-container px-1">admins/{'{uid}'}</code>{' '}
            in Firestore.
          </p>
          <Link to="/" className="mt-6 inline-block font-label text-sm font-semibold text-primary">
            ← Home
          </Link>
        </div>
      </Atmosphere>
    )
  }

  const active = pending.find((p) => p.id === activeId) ?? null

  return (
    <Atmosphere>
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col px-margin-mobile py-10 md:px-8">
        <div className="flex items-center justify-between gap-4">
          <BrandMark to="/" size="sm" />
          <Link to="/consultants" className="font-label text-sm font-semibold text-primary">
            View directory
          </Link>
        </div>
        <h1 className="mt-8 font-display text-3xl font-bold tracking-tight text-on-surface">
          Consultant admin
        </h1>
        <p className="mt-2 text-on-surface-variant">
          Review applications. Approve with SEO metadata, or delete unverified
          requests.
        </p>

        <InlineError message={error} />

        <section className="mt-10">
          <h2 className="font-headline text-xl font-semibold text-on-surface">
            Pending ({pending.length})
          </h2>
          {pending.length === 0 ? (
            <p className="mt-3 text-sm text-on-surface-variant">No pending applications.</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {pending.map((c) => (
                <li
                  key={c.id}
                  className="rounded-[20px] border border-outline-variant/40 bg-surface px-4 py-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-on-surface">{c.fullName}</p>
                      <p className="text-sm text-on-surface-variant">
                        {c.title} · {c.city}
                      </p>
                      <p className="mt-1 text-xs text-on-surface-variant">{c.email}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openReview(c)}
                        className="rounded-full bg-primary px-4 py-2 font-label text-xs font-semibold text-on-primary"
                      >
                        Review & SEO
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void onReject(c.id)}
                        className="rounded-full border border-outline-variant px-4 py-2 font-label text-xs font-semibold text-on-surface"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {active && (
          <section className="mt-8 rounded-[28px] border border-primary/20 bg-surface-container-low/90 p-5 sm:p-6">
            <h3 className="font-headline text-lg font-semibold text-on-surface">
              Approve: {active.fullName}
            </h3>
            <p className="mt-2 whitespace-pre-wrap text-sm text-on-surface-variant">
              {active.bio}
            </p>
            <div className="mt-4 flex flex-col gap-3">
              <label className="flex flex-col gap-1">
                <span className="font-label text-xs font-semibold">Profile slug</span>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="rounded-2xl border border-outline-variant/50 bg-surface px-3 py-2.5"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-label text-xs font-semibold">SEO title</span>
                <input
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  className="rounded-2xl border border-outline-variant/50 bg-surface px-3 py-2.5"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-label text-xs font-semibold">SEO description</span>
                <textarea
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  rows={3}
                  className="rounded-2xl border border-outline-variant/50 bg-surface px-3 py-2.5"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-label text-xs font-semibold">SEO keywords</span>
                <input
                  value={seoKeywords}
                  onChange={(e) => setSeoKeywords(e.target.value)}
                  className="rounded-2xl border border-outline-variant/50 bg-surface px-3 py-2.5"
                />
              </label>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void onApprove()}
                className="rounded-full bg-primary px-5 py-2.5 font-label text-sm font-semibold text-on-primary disabled:opacity-60"
              >
                {busy ? 'Saving…' : 'Approve & publish'}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void onReject(active.id)}
                className="rounded-full border border-outline-variant px-5 py-2.5 font-label text-sm font-semibold"
              >
                Reject & delete
              </button>
              <button
                type="button"
                onClick={() => setActiveId(null)}
                className="rounded-full px-5 py-2.5 font-label text-sm font-semibold text-on-surface-variant"
              >
                Cancel
              </button>
            </div>
          </section>
        )}

        <section className="mt-12">
          <h2 className="font-headline text-xl font-semibold text-on-surface">
            Published ({approved.length})
          </h2>
          <ul className="mt-4 flex flex-col gap-2">
            {approved.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-outline-variant/30 px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-on-surface">{c.fullName}</p>
                  <p className="text-xs text-on-surface-variant">/consultants/{c.slug}</p>
                </div>
                <div className="flex gap-2">
                  <Link
                    to={`/consultants/${c.slug}`}
                    className="font-label text-xs font-semibold text-primary"
                  >
                    Open
                  </Link>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void onReject(c.id)}
                    className="font-label text-xs font-semibold text-on-surface-variant"
                  >
                    Unpublish & delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-auto pt-16">
          <SiteFooter />
        </div>
      </div>
    </Atmosphere>
  )
}
