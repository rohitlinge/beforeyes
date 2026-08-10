export function InlineError({ message }: { message: string | null | undefined }) {
  if (!message) return null
  return (
    <p
      role="alert"
      className="rounded-2xl bg-error-container/50 px-4 py-3 text-sm text-error"
    >
      {message}
    </p>
  )
}
