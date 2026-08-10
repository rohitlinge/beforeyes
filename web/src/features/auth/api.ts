import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { auth, db, isFirebaseConfigured } from '@/lib/firebase'
import { trackEvent } from '@/lib/analytics'
import {
  isValidUsername,
  normalizeUsername,
  type UserProfile,
} from '@/features/auth/types'

function requireAuthDb() {
  if (!isFirebaseConfigured || !auth || !db) {
    throw new Error(
      'Firebase is not configured. Add your keys to web/.env (see .env.example).',
    )
  }
  return { auth, db }
}

function mapProfile(
  uid: string,
  data: Record<string, unknown>,
  fallbackEmail = '',
): UserProfile {
  return {
    uid,
    email: (data.email as string) ?? fallbackEmail,
    displayName: (data.displayName as string) ?? '',
    username: (data.username as string) ?? '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

export async function signUpWithEmail(params: {
  email: string
  password: string
  displayName: string
  username: string
}): Promise<User> {
  const { auth: firebaseAuth, db: firestore } = requireAuthDb()
  const username = normalizeUsername(params.username)
  const displayName = params.displayName.trim()
  const email = params.email.trim()

  if (!displayName) {
    throw new Error('Please enter a display name.')
  }
  if (!isValidUsername(username)) {
    throw new Error(
      'Username must be 3–20 characters: lowercase letters, numbers, underscore.',
    )
  }

  const usernameRef = doc(firestore, 'usernames', username)
  const taken = await getDoc(usernameRef)
  if (taken.exists()) {
    throw new Error('That username is already taken.')
  }

  const credential = await createUserWithEmailAndPassword(
    firebaseAuth,
    email,
    params.password,
  )
  const user = credential.user

  try {
    await updateProfile(user, { displayName })

    await runTransaction(firestore, async (tx) => {
      const usernameSnap = await tx.get(usernameRef)
      if (usernameSnap.exists()) {
        throw new Error('That username is already taken.')
      }

      tx.set(usernameRef, {
        uid: user.uid,
        createdAt: serverTimestamp(),
      })
      tx.set(doc(firestore, 'users', user.uid), {
        uid: user.uid,
        email: user.email ?? email,
        displayName,
        username,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    })
  } catch (error) {
    await user.delete().catch(() => undefined)
    throw error
  }

  trackEvent('signup')
  return user
}

export async function signInWithEmail(email: string, password: string) {
  const { auth: firebaseAuth } = requireAuthDb()
  const credential = await signInWithEmailAndPassword(
    firebaseAuth,
    email.trim(),
    password,
  )
  await ensureUserProfile(credential.user)
  return credential.user
}

export async function logOut() {
  const { auth: firebaseAuth } = requireAuthDb()
  await signOut(firebaseAuth)
}

export async function ensureUserProfile(user: User): Promise<UserProfile> {
  const { db: firestore } = requireAuthDb()
  const userRef = doc(firestore, 'users', user.uid)
  const snap = await getDoc(userRef)

  if (snap.exists()) {
    return mapProfile(user.uid, snap.data(), user.email ?? '')
  }

  const base =
    user.email?.split('@')[0]?.replace(/[^a-zA-Z0-9_]/g, '_') ||
    `user_${user.uid.slice(0, 6)}`
  let username = normalizeUsername(base)
  if (!isValidUsername(username)) {
    username = `user_${user.uid.slice(0, 8)}`
  }

  // Ensure unique fallback username
  let attempt = username
  for (let i = 0; i < 5; i += 1) {
    const exists = await getDoc(doc(firestore, 'usernames', attempt))
    if (!exists.exists()) {
      username = attempt
      break
    }
    attempt = `${username}_${i + 1}`
  }

  const profile = {
    uid: user.uid,
    email: user.email ?? '',
    displayName: user.displayName ?? 'Player',
    username,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  await setDoc(userRef, profile)
  await setDoc(doc(firestore, 'usernames', username), {
    uid: user.uid,
    createdAt: serverTimestamp(),
  })

  return mapProfile(user.uid, {
    email: profile.email,
    displayName: profile.displayName,
    username,
  })
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const { db: firestore } = requireAuthDb()
  const snap = await getDoc(doc(firestore, 'users', uid))
  if (!snap.exists()) return null
  return mapProfile(uid, snap.data())
}

export async function updateUserProfile(
  uid: string,
  updates: { displayName?: string; username?: string },
): Promise<UserProfile> {
  const { auth: firebaseAuth, db: firestore } = requireAuthDb()
  const userRef = doc(firestore, 'users', uid)
  const currentSnap = await getDoc(userRef)
  if (!currentSnap.exists()) {
    throw new Error('Profile not found.')
  }

  const current = currentSnap.data()
  const nextDisplayName =
    updates.displayName?.trim() ?? (current.displayName as string)
  let nextUsername = (current.username as string) ?? ''

  if (updates.username !== undefined) {
    nextUsername = normalizeUsername(updates.username)
    if (!isValidUsername(nextUsername)) {
      throw new Error(
        'Username must be 3–20 characters: lowercase letters, numbers, underscore.',
      )
    }
  }

  await runTransaction(firestore, async (tx) => {
    const fresh = await tx.get(userRef)
    if (!fresh.exists()) throw new Error('Profile not found.')

    const oldUsername = (fresh.data().username as string) ?? ''

    if (nextUsername !== oldUsername) {
      const newRef = doc(firestore, 'usernames', nextUsername)
      const newSnap = await tx.get(newRef)
      if (newSnap.exists() && newSnap.data()?.uid !== uid) {
        throw new Error('That username is already taken.')
      }
      if (oldUsername) {
        tx.delete(doc(firestore, 'usernames', oldUsername))
      }
      tx.set(newRef, { uid, createdAt: serverTimestamp() })
    }

    tx.update(userRef, {
      displayName: nextDisplayName,
      username: nextUsername,
      updatedAt: serverTimestamp(),
    })
  })

  if (firebaseAuth.currentUser && nextDisplayName) {
    await updateProfile(firebaseAuth.currentUser, {
      displayName: nextDisplayName,
    })
  }

  return mapProfile(uid, {
    email: current.email,
    displayName: nextDisplayName,
    username: nextUsername,
  })
}

export async function isUsernameAvailable(username: string): Promise<boolean> {
  const { db: firestore } = requireAuthDb()
  const normalized = normalizeUsername(username)
  if (!isValidUsername(normalized)) return false
  const snap = await getDoc(doc(firestore, 'usernames', normalized))
  return !snap.exists()
}
