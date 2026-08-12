/** Public & admin paths for relationship therapist listings. */
export const THERAPISTS_PATH = '/relationship-therapists'
export const THERAPISTS_REGISTER_PATH = '/relationship-therapists/register'
export const THERAPISTS_ADMIN_PATH = '/admin/relationship-therapists'

export function therapistProfilePath(slug: string): string {
  return `${THERAPISTS_PATH}/${slug}`
}
