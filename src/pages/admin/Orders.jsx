import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { formatPrice, relativeTime, shortId } from '../../lib/helpers'
import { useToast } from '../../contexts/ToastContext'
import { DEMO_MODE } from '../../lib/constants'

const TABS = ['all', 'pending', 'ready', 'collected', 'cancelled']
const PAGE_SIZE = 25

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-800',
  ready: 'bg-green-100 text-green-800',
  collected: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-700',
}

export default function Orders() {
  const [tab, setTab] = useState('all')
  const [orders, setOrders] = useState([])
  const [counts, setCounts] = useState({})
  const [expandedId, setExpandedId] = useState(null)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [cancelId, setCancelId] = useState(null)
  const { toast } = useToast()

  const fetchOrders = async () => {
    setLoading(true)
    let q = supabase
      .from('orders')
      .select(`*, order_items (id, product_name, unit_price_pence, quantity)`, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (tab !== 'all') q = q.eq('status', tab)

    const { data, error } = await q
    if (!error) setOrders(data ?? [])
    setLoading(false)
  }

  const fetchCounts = async () => {
    const res = await supabase.from('orders').select('status')
    const data = res.data ?? []
    const c = {}
    TABS.slice(1).forEach(s => { c[s] = data.filter(o => o.status === s).length })
    c.all = data.length
    setCounts(c)
  }

  useEffect(() => {
    fetchOrders()
    fetchCounts()
  }, [tab, page]) // eslint-disable-line

  const updateStatus = async (orderId, newStatus) => {
    const { error } = await supabase.from('orde
    if (DEMO_MODE) { toast('🚫 Demo mode – changes are disabled in this portfolio preview.'); return }rs').update({ status: newStatus }).eq('id', orderId)
    if (error) { toast('Failed to update status'); return }
    toast(`Order marked as ${newStatus}`)
    fetchOrders()
    fetchCounts()
  }

  const cancelOrder = async (orderId) => {
    if (DEMO_MODE) { toast('🚫 Demo mode – changes are disabled in this portfolio preview.'); return }
    const { error } = await supabase.rpc('cancel_order', { p_order_id: orderId })
    if (error) { toast('Failed to cancel: ' + error.message); return
    if (DEMO_MODE) { toast('🚫 Demo mode – changes are disabled in this portfolio preview.'); return } }
    toast('Order cancelled and stock restored')
    setCancelId(null)
    fetchOrders()
    fetchCounts()
  }

  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-bold text-gray-800">Orders</h1>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setPage(0) }}
            className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-colors ${
              tab === t ? 'bg-brand text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-brand hover:text-brand'
            }`}
          >
            {t} {counts[t] !== undefined ? `(${counts[t]})` : ''}
          </button>
        ))}
      </div>

      {/* Table / Cards */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="w-7 h-7 border-4 border-brand border-t-transparent rounded-full animate-spin" /></div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No orders found</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {orders.map(order => (
            <div key={order.id}>
              {/* Row */}
              <div
                className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs text-gray-400">#{shortId(order.id)}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="font-medium text-gray-800 text-sm mt-0.5">{order.customer_name}</p>
                  <p className="text-xs text-gray-400">{relativeTime(order.created_at)}</p>
                </div>
                <p className="font-semibold text-gray-800 shrink-0">{formatPrice(order.total_pence)}</p>
                <span className="text-gray-300 text-sm">{expandedId === order.id ? '▲' : '▼'}</span>
              </div>

              {/* Expanded */}
              {expandedId === order.id && (
                <div className="px-5 pb-5 bg-gray-50 border-t border-gray-100">
                  <div className="grid sm:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-1 text-sm">
                      <p className="font-semibold text-gray-700 mb-2">Customer</p>
                      <p>{order.customer_name}</p>
                      <p className="text-gray-500">{order.customer_email}</p>
                      {order.customer_phone && <p className="text-gray-500">{order.customer_phone}</p>}
                      {order.note && <p className="text-gray-600 italic mt-2">"{order.note}"</p>}
                    </div>
                    <div className="text-sm">
                      <p className="font-semibold text-gray-700 mb-2">Items</p>
                      {order.order_items?.map(i => (
                        <div key={i.id} className="flex justify-between text-gray-600 py-0.5">
                          <span>{i.product_name} × {i.quantity}</span>
                          <span>{formatPrice(i.unit_price_pence * i.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4 flex-wrap">
                    {order.status === 'pending' && (
                      <button
                        onClick={() => updateStatus(order.id, 'ready')}
                        className="bg-green-600 text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-green-700"
                      >
                        Mark ready
                      </button>
                    )}
                    {order.status === 'ready' && (
                      <button
                        onClick={() => updateStatus(order.id, 'collected')}
                        className="bg-gray-700 text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-gray-800"
                      >
                        Mark collected
                      </button>
                    )}
                    {order.status !== 'collected' && order.status !== 'cancelled' && (
                      cancelId === order.id ? (
                        <div className="flex gap-2 items-center">
                          <span className="text-xs text-gray-600">Cancel this order?</span>
                          <button onClick={() => cancelOrder(order.id)} className="bg-red-600 text-white text-xs px-3 py-2 rounded-lg hover:bg-red-700">Yes, cancel</button>
                          <button onClick={() => setCancelId(null)} className="text-xs text-gray-500 hover:underline">No</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setCancelId(order.id)}
                          className="border border-red-300 text-red-600 text-xs font-medium px-4 py-2 rounded-lg hover:bg-red-50"
                        >
                          Cancel order
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex justify-center gap-3 pt-2">
        <button
          disabled={page === 0}
          onClick={() => setPage(p => p - 1)}
          className="px-4 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:border-brand hover:text-brand"
        >
          ← Prev
        </button>
        <span className="px-4 py-2 text-sm text-gray-500">Page {page + 1}</span>
        <button
          disabled={orders.length < PAGE_SIZE}
          onClick={() => setPage(p => p + 1)}
          className="px-4 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:border-brand hover:text-brand"
        >
          Next →
        </button>
      </div>
    </div>
  )
}
