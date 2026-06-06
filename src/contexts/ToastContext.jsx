import { createContext, useContext, useState, useCallback, useRef } from 'react'

const ToastContext = createContext(null)

let nextId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef({})

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
    clearTimeout(timers.current[id])
  }, [])

  const toast = useCallback((message, opts = {}) => {
    const id = ++nextId
    const duration = opts.duration ?? 4000
    const action = opts.action ?? null // { label, onClick }

    setToasts(prev => [...prev.slice(-4), { id, message, action }])

    if (duration > 0) {
      timers.current[id] = setTimeout(() => dismiss(id), duration)
    }

    return id
  }, [dismiss])

  return (
    <ToastContext.Provider value={{ toast, dismiss, toasts }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
