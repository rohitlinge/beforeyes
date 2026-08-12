import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Atmosphere } from '@/components/Atmosphere'
import { BrandMark } from '@/components/BrandMark'
import { InlineError } from '@/components/InlineError'
import { useAuth } from '@/features/auth/AuthProvider'
import { requestPasswordReset } from '@/features/auth/api'
import { authErrorMessage, normalizeUsername } from '@/features/auth/types'

type AuthPageProps = {
  mode: 'login' | 'signup'
}

export function AuthPage({ mode }: AuthPageProps) {
  const isLogin = mode === 'login'
  const { signIn, signUp, configured } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from =
    (location.state as { from?: string } | null)?.from &&
    (location.state as { from?: string }).from !== '/login' &&
    (location.state as { from?: string }).from !== '/signup'
      ? (location.state as { from: string }).from
      : '/app'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [ageConfirmed, setAgeConfirmed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [resetting, setResetting] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)

    if (!configured) {
      setError('Firebase is not configured. Add keys to web/.env first.')
      return
    }

    if (!isLogin && !ageConfirmed) {
      setError('Confirm you are 18 or older to create an account.')
      return
    }

    setSubmitting(true)
    try {
      if (isLogin) {
        const signedIn = await signIn(email, password)
        navigate(signedIn.emailVerified ? from : '/verify-email', {
          replace: true,
        })
      } else {
        await signUp({
          email,
          password,
          displayName,
          username: normalizeUsername(username),
        })
        navigate('/verify-email', { replace: true })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : authErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function onForgotPassword() {
    setError(null)
    setMessage(null)
    if (!configured) {
      setError('Firebase is not configured. Add keys to web/.env first.')
      return
    }
    if (!email.trim()) {
      setError('Enter your email above, then tap Forgot password.')
      return
    }
    setResetting(true)
    try {
      await requestPasswordReset(email)
      setMessage('Password reset email sent. Check your inbox.')
    } catch (err) {
      setError(err instanceof Error ? err.message : authErrorMessage(err))
    } finally {
      setResetting(false)
    }
  }

  return (
    <Atmosphere>
      <div className="flex min-h-screen flex-col items-center justify-center px-margin-mobile py-10">
        <div className="w-full max-w-md rounded-[32px] border border-white/60 bg-surface-container-lowest/95 p-8 ambient-shadow backdrop-blur-sm">
          <BrandMark to="/" size="sm" />
          <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-on-surface">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="mt-2 font-body text-on-surface-variant">
            {isLogin
              ? 'Log in to continue with your partner.'
              : 'Pick a username your partner can recognize.'}
          </p>

          {!configured && (
            <p className="mt-4 rounded-2xl bg-error-container/40 px-4 py-3 text-sm text-tertiary">
              Firebase keys missing. Copy <code>.env.example</code> to{' '}
              <code>.env</code> and restart the server.
            </p>
          )}
          <form className="mt-8 flex flex-col gap-4" onSubmit={onSubmit}>
            {!isLogin && (
              <>
                <Field
                  label="Display name"
                  value={displayName}
                  onChange={setDisplayName}
                  placeholder="Alex"
                  autoComplete="name"
                  required
                />
                <Field
                  label="Username"
                  value={username}
                  onChange={setUsername}
                  placeholder="alex_22"
                  autoComplete="username"
                  required
                  hint="3–20 chars: a-z, 0-9, underscore"
                />
              </>
            )}
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
            <Field
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              required
              minLength={6}
            />

            {isLogin && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => void onForgotPassword()}
                  disabled={resetting}
                  className="font-label text-sm font-semibold text-primary disabled:opacity-60"
                >
                  {resetting ? 'Sending reset…' : 'Forgot password?'}
                </button>
              </div>
            )}

            {!isLogin && (
              <label className="mt-1 flex items-start gap-3 text-left text-sm text-on-surface-variant">
                <input
                  type="checkbox"
                  checked={ageConfirmed}
                  onChange={(e) => setAgeConfirmed(e.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0 rounded border-outline-variant text-primary focus-visible:ring-2 focus-visible:ring-primary/40"
                  required
                />
                <span>
                  I confirm I am 18 or older, and I agree to the{' '}
                  <Link to="/terms" className="font-semibold text-primary">
                    Terms
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="font-semibold text-primary">
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>
            )}

            <InlineError message={error} />
            {message && (
              <p className="rounded-2xl bg-primary-container/40 px-4 py-3 text-sm font-semibold text-on-primary-container">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || (!isLogin && !ageConfirmed)}
              className="mt-2 min-h-12 rounded-full bg-primary py-4 font-label font-semibold text-on-primary transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-60"
            >
              {submitting
                ? isLogin
                  ? 'Logging in…'
                  : 'Creating account…'
                : isLogin
                  ? 'Log in'
                  : 'Sign up'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-on-surface-variant">
            {isLogin ? (
              <>
                New here?{' '}
                <Link to="/signup" className="font-semibold text-primary">
                  Sign up
                </Link>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-primary">
                  Log in
                </Link>
              </>
            )}
          </p>
          <p className="mt-3 text-center text-xs text-on-surface-variant">
            Adults 18+ only
          </p>
        </div>
      </div>
    </Atmosphere>
  )
}

function Field(props: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  autoComplete?: string
  required?: boolean
  minLength?: number
  hint?: string
}) {
  return (
    <label className="flex flex-col gap-1.5 text-left">
      <span className="font-label text-sm font-semibold text-on-surface-variant">
        {props.label}
      </span>
      <input
        type={props.type ?? 'text'}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        autoComplete={props.autoComplete}
        required={props.required}
        minLength={props.minLength}
        className="rounded-2xl border border-outline-variant bg-surface px-4 py-3 outline-none focus:border-primary"
      />
      {props.hint ? (
        <span className="text-xs text-on-surface-variant">{props.hint}</span>
      ) : null}
    </label>
  )
}
