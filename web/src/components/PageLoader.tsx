export function PageLoader({ message = 'Loading…' }: { message?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-margin-mobile">
      <div
        className="h-9 w-9 animate-spin rounded-full border-2 border-outline-variant border-t-primary"
        aria-hidden
      />
      <p className="font-label text-sm text-on-surface-variant">{message}</p>
    </div>
  )
}
