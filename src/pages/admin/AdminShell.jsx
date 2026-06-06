import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: '📊', end: true },
  { to: '/admin/orders', label: 'Orders', icon: '📋' },
  { to: '/admin/products', label: 'Products', icon: '🗄️' },
]

export default function AdminShell() {
  const [userEmail, setUserEmail] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? ''))
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-30">
        <span className="font-display font-bold text-brand text-xl">The Shop — Admin</span>
        <span className="text-xs text-gray-500 hidden sm:block">{userEmail}</span>
      </header>

      <div className="flex flex-1">
        {/* Sidebar (desktop) */}
        <aside className="hidden sm:flex flex-col w-52 bg-white border-r border-gray-200 p-4 gap-1 sticky top-14 h-[calc(100vh-3.5rem)]">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-brand/10 text-brand' : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
          <button
            onClick={handleSignOut}
            className="mt-auto flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-red-600 transition-colors"
          >
            <span>🚪</span> Sign out
          </button>
        </aside>

        {/* Content */}
        <main className="flex-1 p-4 sm:p-6 pb-24 sm:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Bottom tab bar (mobile) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-30">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2 text-xs font-medium transition-colors ${
                isActive ? 'text-brand' : 'text-gray-500'
              }`
            }
          >
            <span className="text-xl mb-0.5">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
        <button
          onClick={handleSignOut}
          className="flex-1 flex flex-col items-center py-2 text-xs font-medium text-gray-500"
        >
          <span className="text-xl mb-0.5">🚪</span>
          Sign out
        </button>
      </nav>
    </div>
  )
}
