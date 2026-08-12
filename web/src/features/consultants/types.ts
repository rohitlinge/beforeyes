export type ConsultantStatus = 'pending' | 'approved'

export type ConsultantProfile = {
  id: string
  /** URL slug, e.g. priya-sharma-mft */
  slug: string
  fullName: string
  title: string
  city: string
  region: string
  country: string
  specialties: string[]
  bio: string
  yearsExperience: number
  languages: string[]
  /** Google Business Profile / Maps listing URL — primary verification signal */
  googleBusinessUrl: string
  website: string
  email: string
  phone: string
  /** Optional public photo URL */
  photoUrl: string
  status: ConsultantStatus
  /** SEO — editable by admin on approval */
  seoTitle: string
  seoDescription: string
  seoKeywords: string
  submittedBy: string | null
  reviewedBy: string | null
  reviewedAt: number | null
  createdAt: number | null
  updatedAt: number | null
}

export type ConsultantApplicationInput = {
  fullName: string
  title: string
  city: string
  region: string
  country: string
  specialties: string[]
  bio: string
  yearsExperience: number
  languages: string[]
  googleBusinessUrl: string
  website: string
  email: string
  phone: string
  photoUrl: string
  preferredSlug?: string
}

export type ConsultantApproveInput = {
  seoTitle: string
  seoDescription: string
  seoKeywords: string
  /** Optional slug override at approval time */
  slug?: string
}

export const SPECIALTY_OPTIONS = [
  'Pre-marital counseling',
  'Marriage counseling',
  'Couples therapy',
  'Family therapy',
  'Faith & culture',
  'Communication',
  'Conflict resolution',
  'Intimacy & trust',
  'Divorce / separation support',
] as const

export function slugifyName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

export function defaultSeoForConsultant(p: {
  fullName: string
  title: string
  city: string
  specialties: string[]
}): { seoTitle: string; seoDescription: string; seoKeywords: string } {
  const place = p.city ? ` in ${p.city}` : ''
  const focus = p.specialties.slice(0, 3).join(', ')
  return {
    seoTitle: `${p.fullName} — ${p.title || 'Relationship Therapist'}${place} | BeforeYes`,
    seoDescription: `${p.fullName} is a ${p.title || 'relationship therapist'}${place}. Specialties: ${focus || 'couples and pre-marital clarity'}. Find verified guidance on BeforeYes.`,
    seoKeywords: [
      p.fullName,
      p.title,
      p.city,
      'relationship therapist',
      'pre-marital counselor',
      'couples therapy',
      ...p.specialties,
      'BeforeYes',
    ]
      .filter(Boolean)
      .join(', '),
  }
}
