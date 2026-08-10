import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getFunctions, type Functions } from 'firebase/functions'

/**
 * Firebase web config from environment variables.
 * Copy `.env.example` → `.env` and fill values from Firebase Console.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || undefined,
}

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.apiKey !== 'your-api-key',
)

export const isAnalyticsConfigured = Boolean(
  isFirebaseConfigured &&
    firebaseConfig.measurementId &&
    firebaseConfig.measurementId !== 'G-XXXXXXXX',
)

let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null
let functions: Functions | null = null
let analytics: Analytics | null = null

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  db = getFirestore(app)
  functions = getFunctions(app, 'asia-south1')

  if (isAnalyticsConfigured && typeof window !== 'undefined') {
    void isSupported()
      .then((ok) => {
        if (ok && app && !analytics) {
          analytics = getAnalytics(app)
        }
      })
      .catch(() => {
        /* Analytics unavailable in this environment */
      })
    // Eager init for SPA so early funnel events (signup) are not dropped.
    try {
      analytics = getAnalytics(app)
    } catch {
      /* wait for isSupported path */
    }
  }
} else {
  console.warn(
    '[firebase] Missing VITE_FIREBASE_* env vars. Auth/Firestore will be unavailable until .env is configured.',
  )
}

export { app, auth, db, functions, analytics }
