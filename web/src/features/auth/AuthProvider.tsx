import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth, isFirebaseConfigured } from '@/lib/firebase'
import {
  ensureUserProfile,
  logOut as apiLogOut,
  reloadAuthUser,
  sendVerificationEmail,
  signInWithEmail,
  signUpWithEmail,
  updateUserProfile,
} from '@/features/auth/api'
import type { UserProfile } from '@/features/auth/types'

type AuthContextValue = {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  configured: boolean
  emailVerified: boolean
  signUp: (input: {
    email: string
    password: string
    displayName: string
    username: string
  }) => Promise<void>
  signIn: (email: string, password: string) => Promise<User>
  logOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  refreshUser: () => Promise<User | null>
  resendVerificationEmail: () => Promise<void>
  saveProfile: (updates: {
    displayName?: string
    username?: string
  }) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [emailVerified, setEmailVerified] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser)
      setEmailVerified(nextUser?.emailVerified ?? false)
      if (!nextUser) {
        setProfile(null)
        setLoading(false)
        return
      }

      try {
        const nextProfile = await ensureUserProfile(nextUser)
        setProfile(nextProfile)
      } catch (error) {
        console.error('[auth] Failed to load profile', error)
        setProfile(null)
      } finally {
        setLoading(false)
      }
    })

    return unsubscribe
  }, [])

  const signUp = useCallback(
    async (input: {
      email: string
      password: string
      displayName: string
      username: string
    }) => {
      await signUpWithEmail(input)
    },
    [],
  )

  const signIn = useCallback(async (email: string, password: string) => {
    return signInWithEmail(email, password)
  }, [])

  const logOut = useCallback(async () => {
    await apiLogOut()
    setProfile(null)
    setEmailVerified(false)
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!user) return
    const next = await ensureUserProfile(user)
    setProfile(next)
  }, [user])

  const refreshUser = useCallback(async () => {
    const next = await reloadAuthUser()
    setUser(next)
    setEmailVerified(next?.emailVerified ?? false)
    return next
  }, [])

  const resendVerificationEmail = useCallback(async () => {
    await sendVerificationEmail()
  }, [])

  const saveProfile = useCallback(
    async (updates: { displayName?: string; username?: string }) => {
      if (!user) throw new Error('Not signed in.')
      const next = await updateUserProfile(user.uid, updates)
      setProfile(next)
    },
    [user],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      configured: isFirebaseConfigured,
      emailVerified,
      signUp,
      signIn,
      logOut,
      refreshProfile,
      refreshUser,
      resendVerificationEmail,
      saveProfile,
    }),
    [
      user,
      profile,
      loading,
      emailVerified,
      signUp,
      signIn,
      logOut,
      refreshProfile,
      refreshUser,
      resendVerificationEmail,
      saveProfile,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
