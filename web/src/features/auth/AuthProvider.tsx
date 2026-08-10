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
  signUp: (input: {
    email: string
    password: string
    displayName: string
    username: string
  }) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  logOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  saveProfile: (updates: {
    displayName?: string
    username?: string
  }) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser)
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
    await signInWithEmail(email, password)
  }, [])

  const logOut = useCallback(async () => {
    await apiLogOut()
    setProfile(null)
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!user) return
    const next = await ensureUserProfile(user)
    setProfile(next)
  }, [user])

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
      signUp,
      signIn,
      logOut,
      refreshProfile,
      saveProfile,
    }),
    [
      user,
      profile,
      loading,
      signUp,
      signIn,
      logOut,
      refreshProfile,
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
