import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '@/features/auth/AuthProvider'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading, configured, emailVerified } = useAuth()
  const location = useLocation()

  if (!configured) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-margin-mobile">
        <div className="max-w-md bg-surface-container rounded-[24px] p-6 ambient-shadow text-center">
          <h1 className="font-display text-2xl font-bold text-on-surface">
            Firebase not configured
          </h1>
          <p className="mt-2 text-on-surface-variant">
            Copy <code className="text-sm">web/.env.example</code> to{' '}
            <code className="text-sm">web/.env</code> and add your Firebase web
            app keys, then restart the dev server.
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-on-surface-variant font-label">
        Loading…
      </div>
    )
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    )
  }

  if (!emailVerified) {
    return (
      <Navigate
        to="/verify-email"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    )
  }

  return children
}

/** Logged-in users waiting to verify email (or openers of a verification link). */
export function VerifyEmailRoute({ children }: { children: ReactNode }) {
  const { user, loading, emailVerified } = useAuth()
  const location = useLocation()
  const hasOobCode = new URLSearchParams(location.search).has('oobCode')

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-on-surface-variant font-label">
        Loading…
      </div>
    )
  }

  if (!user && !hasOobCode) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    )
  }

  if (user && emailVerified) {
    const from =
      (location.state as { from?: string } | null)?.from &&
      (location.state as { from?: string }).from !== '/verify-email'
        ? (location.state as { from: string }).from
        : '/app'
    return <Navigate to={from} replace />
  }

  return children
}

export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { user, loading, emailVerified } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-on-surface-variant font-label">
        Loading…
      </div>
    )
  }

  if (user) {
    return (
      <Navigate to={emailVerified ? '/app' : '/verify-email'} replace />
    )
  }

  return children
}
