const SITE_URL = (
  import.meta.env.VITE_SITE_URL?.trim() || 'https://www.beforeyes.online'
).replace(/\/$/, '')

export function siteUrl(path = '/'): string {
  if (!path || path === '/') return `${SITE_URL}/`
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

/** Inject or replace a JSON-LD script by id. */
export function setJsonLd(id: string, data: Record<string, unknown> | null): void {
  const existing = document.getElementById(id)
  if (!data) {
    existing?.remove()
    return
  }
  const el =
    (existing as HTMLScriptElement | null) ??
    Object.assign(document.createElement('script'), {
      id,
      type: 'application/ld+json',
    })
  el.textContent = JSON.stringify(data)
  if (!existing) document.head.appendChild(el)
}
