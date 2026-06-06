import { useToast } from '../contexts/ToastContext'

export default function Toast() {
  const { toasts, dismiss } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-xs w-full">
      {toasts.map(t => (
        <div
          key={t.id}
          className="bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center justify-between gap-3 animate-fade-in"
        >
          <span className="text-sm">{t.message}</span>
          <div className="flex items-center gap-2 shrink-0">
            {t.action && (
              <button
                onClick={() => { t.action.onClick(); dismiss(t.id) }}
                className="text-brand-light text-sm font-medium hover:underline"
              >
                {t.action.label}
              </button>
            )}
            <button
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss"
              className="text-gray-400 hover:text-white ml-1"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
