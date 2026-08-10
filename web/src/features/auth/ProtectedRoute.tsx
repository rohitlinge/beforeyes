import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '@/features/auth/AuthProvider'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading, configured } = useAuth()
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

  return children
}

export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-on-surface-variant font-label">
        Loading…
      </div>
    )
  }

  if (user) {
    return <Navigate to="/app" replace />
  }

  return children
}
