import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore'
import { auth, db, isFirebaseConfigured } from '@/lib/firebase'
import {
  defaultSeoForConsultant,
  slugifyName,
  type ConsultantApproveInput,
  type ConsultantApplicationInput,
  type ConsultantProfile,
  type ConsultantStatus,
} from '@/features/consultants/types'

function requireDb() {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase is not configured.')
  }
  return db
}

function mapConsultant(
  id: string,
  data: Record<string, unknown>,
): ConsultantProfile {
  const createdAt = data.createdAt as { toMillis?: () => number } | number | null
  const updatedAt = data.updatedAt as { toMillis?: () => number } | number | null
  const reviewedAt = data.reviewedAt as { toMillis?: () => number } | number | null
  const toMs = (v: typeof createdAt) =>
    typeof v === 'number'
      ? v
      : v && typeof v.toMillis === 'function'
        ? v.toMillis()
        : null

  return {
    id,
    slug: String(data.slug ?? ''),
    fullName: String(data.fullName ?? ''),
    title: String(data.title ?? ''),
    city: String(data.city ?? ''),
    region: String(data.region ?? ''),
    country: String(data.country ?? ''),
    specialties: Array.isArray(data.specialties)
      ? (data.specialties as unknown[]).map(String)
      : [],
    bio: String(data.bio ?? ''),
    yearsExperience: Number(data.yearsExperience ?? 0),
    languages: Array.isArray(data.languages)
      ? (data.languages as unknown[]).map(String)
      : [],
    googleBusinessUrl: String(data.googleBusinessUrl ?? ''),
    website: String(data.website ?? ''),
    email: String(data.email ?? ''),
    phone: String(data.phone ?? ''),
    photoUrl: String(data.photoUrl ?? ''),
    status: (data.status as ConsultantStatus) === 'approved' ? 'approved' : 'pending',
    seoTitle: String(data.seoTitle ?? ''),
    seoDescription: String(data.seoDescription ?? ''),
    seoKeywords: String(data.seoKeywords ?? ''),
    submittedBy: data.submittedBy ? String(data.submittedBy) : null,
    reviewedBy: data.reviewedBy ? String(data.reviewedBy) : null,
    reviewedAt: toMs(reviewedAt),
    createdAt: toMs(createdAt),
    updatedAt: toMs(updatedAt),
  }
}

export async function isAdminUid(uid: string): Promise<boolean> {
  const firestore = requireDb()
  const snap = await getDoc(doc(firestore, 'admins', uid))
  return snap.exists()
}

export function subscribeIsAdmin(
  uid: string | undefined,
  onData: (isAdmin: boolean) => void,
): Unsubscribe {
  if (!uid || !isFirebaseConfigured || !db) {
    onData(false)
    return () => undefined
  }
  return onSnapshot(
    doc(db, 'admins', uid),
    (snap) => onData(snap.exists()),
    () => onData(false),
  )
}

async function reserveSlug(slug: string, consultantId: string): Promise<void> {
  const firestore = requireDb()
  const ref = doc(firestore, 'consultantSlugs', slug)
  const existing = await getDoc(ref)
  if (existing.exists() && existing.data()?.consultantId !== consultantId) {
    throw new Error('That profile URL is already taken. Try a different name spelling.')
  }
  await setDoc(ref, { consultantId, createdAt: serverTimestamp() })
}

export async function submitConsultantApplication(
  input: ConsultantApplicationInput,
): Promise<{ id: string; slug: string }> {
  const firestore = requireDb()
  const fullName = input.fullName.trim()
  if (fullName.length < 2) throw new Error('Please enter your full name.')
  if (!input.email.trim() || !input.email.includes('@')) {
    throw new Error('Please enter a valid email.')
  }
  if (input.bio.trim().length < 40) {
    throw new Error('Bio should be at least 40 characters so visitors understand your work.')
  }
  if (input.specialties.length === 0) {
    throw new Error('Select at least one specialty.')
  }
  const gmb = input.googleBusinessUrl.trim()
  if (!gmb || !/^https?:\/\//i.test(gmb)) {
    throw new Error('Add a valid Google Business Profile link (must start with https://).')
  }
  const looksLikeGoogle =
    /google\.(com|co\.[a-z]{2})/i.test(gmb) ||
    /maps\.app\.goo\.gl/i.test(gmb) ||
    /goo\.gl\/maps/i.test(gmb) ||
    /g\.page\//i.test(gmb) ||
    /business\.google\.com/i.test(gmb)
  if (!looksLikeGoogle) {
    throw new Error(
      'Use your Google Business Profile or Google Maps link (maps.google.com, g.page, or business.google.com).',
    )
  }

  const baseSlug =
    slugifyName(input.preferredSlug?.trim() || fullName) ||
    `consultant-${Date.now().toString(36)}`
  let slug = baseSlug
  for (let i = 0; i < 5; i++) {
    const clash = await getDoc(doc(firestore, 'consultantSlugs', slug))
    if (!clash.exists()) break
    slug = `${baseSlug}-${Math.random().toString(36).slice(2, 5)}`
  }

  const id = crypto.randomUUID().replace(/-/g, '').slice(0, 20)
  const seo = defaultSeoForConsultant({
    fullName,
    title: input.title.trim(),
    city: input.city.trim(),
    specialties: input.specialties,
  })
  const uid = auth?.currentUser?.uid ?? null

  await reserveSlug(slug, id)

  await setDoc(doc(firestore, 'consultants', id), {
    slug,
    fullName,
    title: input.title.trim(),
    city: input.city.trim(),
    region: input.region.trim(),
    country: input.country.trim() || 'India',
    specialties: input.specialties,
    bio: input.bio.trim(),
    yearsExperience: Math.max(0, Math.min(60, Math.round(input.yearsExperience || 0))),
    languages: input.languages.length ? input.languages : ['English'],
    googleBusinessUrl: gmb,
    website: input.website.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    photoUrl: input.photoUrl.trim(),
    status: 'pending',
    seoTitle: seo.seoTitle,
    seoDescription: seo.seoDescription,
    seoKeywords: seo.seoKeywords,
    submittedBy: uid,
    reviewedBy: null,
    reviewedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return { id, slug }
}

export async function getApprovedConsultantBySlug(
  slug: string,
): Promise<ConsultantProfile | null> {
  const firestore = requireDb()
  const q = query(collection(firestore, 'consultants'), where('slug', '==', slug))
  const snap = await getDocs(q)
  if (snap.empty) return null
  const d = snap.docs[0]
  const profile = mapConsultant(d.id, d.data())
  return profile.status === 'approved' ? profile : null
}

export async function listApprovedConsultants(): Promise<ConsultantProfile[]> {
  const firestore = requireDb()
  const q = query(
    collection(firestore, 'consultants'),
    where('status', '==', 'approved'),
  )
  const snap = await getDocs(q)
  return snap.docs
    .map((d) => mapConsultant(d.id, d.data()))
    .sort((a, b) => a.fullName.localeCompare(b.fullName))
}

export function subscribePendingConsultants(
  onData: (items: ConsultantProfile[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const firestore = requireDb()
  const q = query(
    collection(firestore, 'consultants'),
    where('status', '==', 'pending'),
  )
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs
        .map((d) => mapConsultant(d.id, d.data()))
        .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
      onData(items)
    },
    (err) => onError?.(err),
  )
}

export function subscribeApprovedConsultants(
  onData: (items: ConsultantProfile[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const firestore = requireDb()
  const q = query(
    collection(firestore, 'consultants'),
    where('status', '==', 'approved'),
  )
  return onSnapshot(
    q,
    (snap) => {
      onData(
        snap.docs
          .map((d) => mapConsultant(d.id, d.data()))
          .sort((a, b) => a.fullName.localeCompare(b.fullName)),
      )
    },
    (err) => onError?.(err),
  )
}

export async function approveConsultant(
  id: string,
  adminUid: string,
  input: ConsultantApproveInput,
): Promise<void> {
  const firestore = requireDb()
  const ref = doc(firestore, 'consultants', id)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error('Application not found.')
  const data = snap.data()
  const nextSlug = input.slug?.trim()
    ? slugifyName(input.slug)
    : String(data.slug ?? '')
  if (!nextSlug) throw new Error('Slug is required.')

  if (nextSlug !== data.slug) {
    await reserveSlug(nextSlug, id)
    if (data.slug) {
      await deleteDoc(doc(firestore, 'consultantSlugs', String(data.slug))).catch(
        () => undefined,
      )
    }
  }

  await updateDoc(ref, {
    status: 'approved',
    slug: nextSlug,
    seoTitle: input.seoTitle.trim(),
    seoDescription: input.seoDescription.trim(),
    seoKeywords: input.seoKeywords.trim(),
    reviewedBy: adminUid,
    reviewedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

/** Reject unverified applications by deleting the profile and freeing the slug. */
export async function rejectAndDeleteConsultant(id: string): Promise<void> {
  const firestore = requireDb()
  const ref = doc(firestore, 'consultants', id)
  const snap = await getDoc(ref)
  if (!snap.exists()) return
  const slug = String(snap.data().slug ?? '')
  await deleteDoc(ref)
  if (slug) {
    await deleteDoc(doc(firestore, 'consultantSlugs', slug)).catch(() => undefined)
  }
}
