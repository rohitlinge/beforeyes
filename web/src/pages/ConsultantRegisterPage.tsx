import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Atmosphere } from '@/components/Atmosphere'
import { BrandMark } from '@/components/BrandMark'
import { InlineError } from '@/components/InlineError'
import { SiteFooter } from '@/components/SiteFooter'
import { submitConsultantApplication } from '@/features/consultants/api'
import { SPECIALTY_OPTIONS, slugifyName } from '@/features/consultants/types'

const LANG_OPTIONS = ['English', 'Hindi', 'Marathi', 'Tamil', 'Telugu', 'Kannada', 'Bengali', 'Gujarati', 'Other']

export function ConsultantRegisterPage() {
  const [fullName, setFullName] = useState('')
  const [title, setTitle] = useState('')
  const [city, setCity] = useState('')
  const [region, setRegion] = useState('')
  const [country, setCountry] = useState('India')
  const [specialties, setSpecialties] = useState<string[]>([])
  const [bio, setBio] = useState('')
  const [yearsExperience, setYearsExperience] = useState('5')
  const [languages, setLanguages] = useState<string[]>(['English'])
  const [website, setWebsite] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [preferredSlug, setPreferredSlug] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [doneSlug, setDoneSlug] = useState<string | null>(null)

  const previewSlug = useMemo(
    () => slugifyName(preferredSlug || fullName) || 'your-name',
    [preferredSlug, fullName],
  )

  function toggle(list: string[], value: string, setter: (v: string[]) => void) {
    setter(list.includes(value) ? list.filter((x) => x !== value) : [...list, value])
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await submitConsultantApplication({
        fullName,
        title,
        city,
        region,
        country,
        specialties,
        bio,
        yearsExperience: Number(yearsExperience) || 0,
        languages,
        website,
        email,
        phone,
        photoUrl,
        preferredSlug: preferredSlug || undefined,
      })
      setDoneSlug(res.slug)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit application.')
    } finally {
      setSubmitting(false)
    }
  }

  if (doneSlug) {
    return (
      <Atmosphere>
        <div className="mx-auto flex min-h-screen max-w-lg flex-col px-margin-mobile py-10 md:px-8">
          <BrandMark to="/" size="sm" />
          <h1 className="mt-8 font-display text-3xl font-bold tracking-tight text-on-surface">
            Application received
          </h1>
          <p className="mt-3 leading-relaxed text-on-surface-variant">
            Thanks for registering. An admin will review your profile. Once approved,
            it will go live and become searchable at{' '}
            <span className="font-semibold text-on-surface">
              /consultants/{doneSlug}
            </span>
            .
          </p>
          <p className="mt-3 text-sm text-on-surface-variant">
            Unverified applications are removed — we only publish profiles that pass
            review.
          </p>
          <Link
            to="/consultants"
            className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-6 font-label text-sm font-semibold text-on-primary"
          >
            Browse consultants
          </Link>
          <div className="mt-auto pt-16">
            <SiteFooter />
          </div>
        </div>
      </Atmosphere>
    )
  }

  return (
    <Atmosphere>
      <div className="mx-auto flex min-h-screen max-w-xl flex-col px-margin-mobile py-10 md:px-8">
        <BrandMark to="/" size="sm" />
        <h1 className="mt-8 font-display text-3xl font-bold tracking-tight text-on-surface">
          Register as a consultant
        </h1>
        <p className="mt-3 leading-relaxed text-on-surface-variant">
          Create a public profile for couples seeking guidance before commitment.
          Profiles go live only after admin approval — so they can rank with trust.
        </p>

        <form
          onSubmit={(e) => void onSubmit(e)}
          className="mt-8 flex flex-col gap-5 rounded-[32px] border border-white/60 bg-surface-container-lowest/95 p-6 ambient-shadow sm:p-8"
        >
          <Field label="Full name *" value={fullName} onChange={setFullName} required />
          <Field
            label="Professional title *"
            value={title}
            onChange={setTitle}
            placeholder="e.g. Licensed Marriage & Family Therapist"
            required
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="City *" value={city} onChange={setCity} required />
            <Field label="State / region" value={region} onChange={setRegion} />
          </div>
          <Field label="Country" value={country} onChange={setCountry} />
          <Field
            label="Years of experience"
            value={yearsExperience}
            onChange={setYearsExperience}
            type="number"
          />

          <fieldset>
            <legend className="font-label text-sm font-semibold text-on-surface">
              Specialties *
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {SPECIALTY_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggle(specialties, s, setSpecialties)}
                  className={`rounded-full px-3 py-1.5 font-label text-xs font-semibold transition-colors ${
                    specialties.includes(s)
                      ? 'bg-primary text-on-primary'
                      : 'border border-outline-variant bg-surface text-on-surface'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="font-label text-sm font-semibold text-on-surface">
              Languages
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {LANG_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggle(languages, s, setLanguages)}
                  className={`rounded-full px-3 py-1.5 font-label text-xs font-semibold transition-colors ${
                    languages.includes(s)
                      ? 'bg-primary text-on-primary'
                      : 'border border-outline-variant bg-surface text-on-surface'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="flex flex-col gap-1.5">
            <span className="font-label text-sm font-semibold text-on-surface">
              Bio * (min 40 characters)
            </span>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              required
              rows={5}
              className="rounded-2xl border border-outline-variant/50 bg-surface px-4 py-3.5 text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="Who you help, your approach, and why couples trust you before saying yes…"
            />
          </label>

          <Field label="Public email *" value={email} onChange={setEmail} type="email" required />
          <Field label="Phone (optional)" value={phone} onChange={setPhone} />
          <Field
            label="Website (optional)"
            value={website}
            onChange={setWebsite}
            placeholder="https://"
          />
          <Field
            label="Photo URL (optional)"
            value={photoUrl}
            onChange={setPhotoUrl}
            placeholder="https://…"
          />
          <Field
            label="Preferred profile URL"
            value={preferredSlug}
            onChange={setPreferredSlug}
            placeholder="priya-sharma-mft"
          />
          <p className="text-xs text-on-surface-variant">
            Public URL preview:{' '}
            <span className="font-semibold text-on-surface">/consultants/{previewSlug}</span>
          </p>

          <InlineError message={error} />

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 min-h-12 rounded-full bg-primary px-6 font-label text-sm font-semibold text-on-primary disabled:opacity-60"
          >
            {submitting ? 'Submitting…' : 'Submit for review'}
          </button>
          <p className="text-xs leading-relaxed text-on-surface-variant">
            By submitting, you confirm the information is accurate. Profiles that are
            not approved are deleted and will not appear in search.
          </p>
        </form>

        <div className="mt-auto pt-16">
          <SiteFooter />
        </div>
      </div>
    </Atmosphere>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  required?: boolean
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-label text-sm font-semibold text-on-surface">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="rounded-2xl border border-outline-variant/50 bg-surface px-4 py-3.5 text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </label>
  )
}
