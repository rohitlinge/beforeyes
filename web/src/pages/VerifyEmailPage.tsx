import { useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Atmosphere } from '@/components/Atmosphere'
import { BrandMark } from '@/components/BrandMark'
import { InlineError } from '@/components/InlineError'
import { useAuth } from '@/features/auth/AuthProvider'
import {
  applyEmailVerificationCode,
} from '@/features/auth/api'
import { authErrorMessage } from '@/features/auth/types'

function extractOobCode(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) return ''
  try {
    const url = new URL(trimmed)
    return url.searchParams.get('oobCode')?.trim() || trimmed
  } catch {
    if (trimmed.includes('oobCode=')) {
      const query = trimmed.includes('?') ? trimmed.slice(trimmed.indexOf('?') + 1) : trimmed
      return new URLSearchParams(query).get('oobCode')?.trim() || trimmed
    }
    return trimmed
  }
}

/**
 * After signup, users confirm email via the Firebase link.
 * Also accepts oobCode from the email action URL if customized to this route.
 */
export function VerifyEmailPage() {
  const { user, refreshUser, resendVerificationEmail, logOut } = useAuth()
  const [searchParams] = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)
  const [resending, setResending] = useState(false)
  const [applyingLink, setApplyingLink] = useState(false)
  const [manualCode, setManualCode] = useState('')

  const oobFromUrl = searchParams.get('oobCode')
  const mode = searchParams.get('mode')

  useEffect(() => {
    if (!oobFromUrl || (mode && mode !== 'verifyEmail')) return

    let cancelled = false
    async function applyFromLink() {
      setApplyingLink(true)
      setError(null)
      try {
        await applyEmailVerificationCode(oobFromUrl!)
        if (cancelled) return
        const next = await refreshUser()
        if (next?.emailVerified) {
          setInfo('Email verified. Taking you in…')
        } else {
          setInfo('Email verified. Please log in to continue.')
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : authErrorMessage(err))
        }
      } finally {
        if (!cancelled) setApplyingLink(false)
      }
    }

    void applyFromLink()
    return () => {
      cancelled = true
    }
  }, [oobFromUrl, mode, refreshUser])

  // Auto-check a few times after landing (user may have verified in another tab).
  useEffect(() => {
    let ticks = 0
    const id = window.setInterval(() => {
      ticks += 1
      void refreshUser()
      if (ticks >= 8) window.clearInterval(id)
    }, 4000)
    return () => window.clearInterval(id)
  }, [refreshUser])

  async function onCheck() {
    setChecking(true)
    setError(null)
    setInfo(null)
    try {
      const next = await refreshUser()
      if (next?.emailVerified) {
        setInfo('Email verified. Taking you in…')
      } else {
        setInfo('Not verified yet. Open the link in your email, then try again.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : authErrorMessage(err))
    } finally {
      setChecking(false)
    }
  }

  async function onResend() {
    setResending(true)
    setError(null)
    setInfo(null)
    try {
      await resendVerificationEmail()
      setInfo('Verification email sent. Check your inbox and spam folder.')
    } catch (err) {
      setError(err instanceof Error ? err.message : authErrorMessage(err))
    } finally {
      setResending(false)
    }
  }

  async function onSubmitCode(e: FormEvent) {
    e.preventDefault()
    const code = extractOobCode(manualCode)
    if (!code) {
      setError('Paste the verification link or code from your email.')
      return
    }
    setChecking(true)
    setError(null)
    setInfo(null)
    try {
      await applyEmailVerificationCode(code)
      await refreshUser()
      setInfo('Email verified. Taking you in…')
    } catch (err) {
      setError(err instanceof Error ? err.message : authErrorMessage(err))
    } finally {
      setChecking(false)
    }
  }

  return (
    <Atmosphere>
      <div className="flex min-h-screen flex-col items-center justify-center px-margin-mobile py-10">
        <div className="w-full max-w-md rounded-[32px] border border-white/60 bg-surface-container-lowest/95 p-8 ambient-shadow backdrop-blur-sm">
          <BrandMark to="/" size="sm" />
          <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-on-surface">
            Verify your email
          </h1>
          <p className="mt-3 font-body text-on-surface-variant leading-relaxed">
            {user?.email ? (
              <>
                We sent a verification link to{' '}
                <span className="font-semibold text-on-surface">{user.email}</span>
                . Open it to activate your BeforeYes account.
              </>
            ) : (
              <>Confirming your email verification link…</>
            )}
          </p>

          {applyingLink && (
            <p className="mt-4 text-sm text-primary font-label">
              Confirming your email link…
            </p>
          )}

          {info && (
            <p className="mt-4 rounded-2xl bg-primary-fixed/40 px-4 py-3 text-sm text-primary">
              {info}
            </p>
          )}
          <InlineError message={error} />

          <div className="mt-8 flex flex-col gap-3">
            {user && (
              <>
                <button
                  type="button"
                  onClick={() => void onCheck()}
                  disabled={checking || applyingLink}
                  className="min-h-12 rounded-full bg-primary py-4 font-label font-semibold text-on-primary transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {checking ? 'Checking…' : 'I verified — continue'}
                </button>
                <button
                  type="button"
                  onClick={() => void onResend()}
                  disabled={resending || applyingLink}
                  className="min-h-11 rounded-full border border-outline-variant px-6 py-3 font-label text-sm font-semibold text-on-surface disabled:opacity-60"
                >
                  {resending ? 'Sending…' : 'Resend verification email'}
                </button>
              </>
            )}
            {!user && (
              <Link
                to="/login"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-primary py-4 font-label font-semibold text-on-primary"
              >
                Log in to continue
              </Link>
            )}
          </div>

          <form className="mt-8 border-t border-outline-variant/40 pt-6" onSubmit={onSubmitCode}>
            <p className="text-sm text-on-surface-variant">
              Or paste the full verification link from your email (or its{' '}
              <span className="font-semibold">oobCode</span>).
            </p>
            <label className="mt-3 flex flex-col gap-1.5 text-left">
              <span className="font-label text-sm font-semibold text-on-surface-variant">
                Verification link or code
              </span>
              <input
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Paste link or code"
                autoComplete="one-time-code"
                className="rounded-2xl border border-outline-variant bg-surface px-4 py-3.5 text-on-surface outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
              />
            </label>
            <button
              type="submit"
              disabled={checking || applyingLink || !manualCode.trim()}
              className="mt-3 w-full min-h-11 rounded-full border border-primary/30 px-6 py-3 font-label text-sm font-semibold text-primary disabled:opacity-60"
            >
              Verify with link / code
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-on-surface-variant">
            Wrong account?{' '}
            <button
              type="button"
              onClick={() => void logOut()}
              className="font-semibold text-primary"
            >
              Log out
            </button>
            {' · '}
            <Link to="/" className="font-semibold text-primary">
              Home
            </Link>
          </p>
        </div>
      </div>
    </Atmosphere>
  )
}
