export type UserProfile = {
  uid: string
  email: string
  displayName: string
  username: string
  createdAt: number
  updatedAt: number
}

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, '_')
}

export function isValidUsername(username: string): boolean {
  return /^[a-z0-9_]{3,20}$/.test(username)
}

export function authErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object' || !('code' in error)) {
    return 'Something went wrong. Please try again.'
  }

  const code = String((error as { code: string }).code)

  switch (code) {
    case 'auth/email-already-in-use':
      return 'That email is already registered. Try logging in.'
    case 'auth/invalid-email':
      return 'Enter a valid email address.'
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.'
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password.'
    case 'auth/missing-email':
      return 'Enter your email to reset your password.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait and try again.'
    case 'auth/network-request-failed':
      return 'Network error. Check your connection.'
    case 'auth/expired-action-code':
      return 'That verification link expired. Request a new one.'
    case 'auth/invalid-action-code':
      return 'That verification link is invalid or already used.'
    case 'auth/user-disabled':
      return 'This account has been disabled.'
    default:
      return 'Something went wrong. Please try again.'
  }
}
