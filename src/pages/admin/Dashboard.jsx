import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { formatPrice, relativeTime } from '../../lib/helpers'
import { useToast } from '../../contexts/ToastContext'

export default function Dashboard() {
  const [stats, setStats] = useState({ ordersToday: 0, revenueToday: 0, pendingCount: 0 })
  const [pending, setPending] = useState([])
  const [lowStock, setLowStock] = useState([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const fetchAll = async () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString()

    const [ordersRes, pendingRes, lowStockRes] = await Promise.all([
      supabase.from('orders').select('id, total_pence, status, created_at').gte('created_at', todayStr),
      supabase.from('orders').select(`
        id, customer_name, total_pence, created_at, status,
        order_items ( quantity )
      `).eq('status', 'pending').order('created_at', { ascending: false }).limit(20),
      supabase.from('products').select('id, name, stock, category').lte('stock', 3).eq('is_active', true).order('stock'),
    ])

    const todayOrders = ordersRes.data ?? []
    setStats({
      ordersToday: todayOrders.length,
      revenueToday: todayOrders.reduce((s, o) => s + (o.total_pence ?? 0), 0),
            pendingCount: (pendingRes.data ?? []).length,
    })
    setPending(pendingRes.data ?? [])
    setLowStock(lowStockRes.data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  // Realtime subscription for new orders
  useEffect(() => {
    const channel = supabase
      .channel('new-orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, () => {
        fetchAll()
        toast('New order received! 🎉')
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, []) // eslint-disable-line

  const markReady = async (orderId) => {
    // Optimistic update
    setPending(prev => prev.filter(o => o.id !== orderId))
    const { error } = await supabase.from('orders').update({ status: 'ready' }).eq('id', orderId)
    if (error) {
      toast('Failed to update order')
      fetchAll() // rollback by refetching
    } else {
      toast('Order marked as ready')
      fetchAll()
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" /></div>
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-gray-800">Dashboard</h1>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: 'Orders today', value: stats.ordersToday, icon: '📦' },
          { label: 'Revenue today', value: formatPrice(stats.revenueToday), icon: '💷' },
          { label: 'Pending orders', value: stats.pendingCount, icon: '⏳' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
            <span className="text-3xl">{s.icon}</span>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{s.label}</p>
              <p className="text-2xl font-bold text-gray-800 mt-0.5">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pending orders */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Pending orders</h2>
          <Link to="/admin/orders" className="text-sm text-brand hover:underline">View all</Link>
        </div>
        {pending.length === 0 ? (
          <p className="px-5 py-8 text-center text-gray-400 text-sm">No pending orders</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {pending.map(order => {
              const itemCount = order.order_items?.reduce((s, i) => s + i.quantity, 0) ?? 0
              return (
                <div key={order.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 text-sm">{order.customer_name}</p>
                    <p className="text-xs text-gray-500">{itemCount} item{itemCount !== 1 ? 's' : ''} · {relativeTime(order.created_at)}</p>
                  </div>
                  <p className="font-semibold text-gray-800 text-sm shrink-0">{formatPrice(order.total_pence)}</p>
                  <button
                    onClick={() => markReady(order.id)}
                    className="shrink-0 bg-green-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Mark ready
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Low stock */}
      {lowStock.length > 0 && (
        <div className="bg-white rounded-xl border border-amber-200">
          <div className="px-5 py-4 border-b border-amber-100">
            <h2 className="font-semibold text-gray-800">⚠ Low stock ({lowStock.length})</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {lowStock.map(p => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <div>
                  <p className="font-medium text-gray-800">{p.name}</p>
                  <p className="text-xs text-gray-500">{p.category}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-semibold ${p.stock === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                    {p.stock === 0 ? 'Out of stock' : `${p.stock} left`}
                  </span>
                  <Link to={`/admin/products/${p.id}`} className="text-brand hover:underline text-xs">Edit</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
