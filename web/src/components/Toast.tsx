import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type ToastTone = 'info' | 'success' | 'error'

type ToastItem = {
  id: string
  message: string
  tone: ToastTone
}

type ToastContextValue = {
  pushToast: (message: string, tone?: ToastTone) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const pushToast = useCallback((message: string, tone: ToastTone = 'info') => {
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `t${Date.now()}`
    setItems((prev) => [...prev, { id, message, tone }])
    window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id))
    }, 3200)
  }, [])

  const value = useMemo(() => ({ pushToast }), [pushToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 px-margin-mobile pb-safe pt-2"
        aria-live="polite"
      >
        {items.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto max-w-md rounded-2xl px-4 py-3 font-label text-sm font-semibold shadow-[0_12px_30px_-12px_rgba(29,27,26,0.35)] animate-fade-in-up ${
              toast.tone === 'error'
                ? 'bg-error-container text-on-error-container'
                : toast.tone === 'success'
                  ? 'bg-primary text-on-primary'
                  : 'bg-inverse-surface text-inverse-on-surface'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return ctx
}
