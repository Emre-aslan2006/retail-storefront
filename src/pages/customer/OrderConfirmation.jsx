import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { formatPrice, shortId } from '../../lib/helpers'
import Header from '../../components/Header'

const STATUS_CONFIG = {
  pending: { label: 'Order received', color: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500' },
  ready: { label: 'Ready for collection! 🎉', color: 'bg-green-100 text-green-800', dot: 'bg-green-500' },
  collected: { label: 'Collected', color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', dot: 'bg-red-400' },
}

export default function OrderConfirmation() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [items, setItems] = useState([])
  const [status, setStatus] = useState('loading')

  const fetchOrder = async () => {
    const { data, error } = await supabase.rpc('get_order_for_customer', { p_order_id: id })
    if (error || !data) { setStatus('error'); return }
    setOrder(data.order)
    setItems(data.items)
    setStatus('success')
  }

  useEffect(() => { fetchOrder() }, [id]) // eslint-disable-line

  const cfg = order ? (STATUS_CONFIG[order.status] || STATUS_CONFIG.pending) : null

  if (status === 'loading') {
    return (
      <>
        <Header />
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </>
    )
  }

  if (status === 'error' || !order) {
    return (
      <>
        <Header />
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <p className="text-gray-600 mb-4">Couldn't load your order.</p>
          <button onClick={fetchOrder} className="bg-brand text-white px-6 py-2.5 rounded-lg">Try again</button>
        </div>
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="max-w-lg mx-auto px-4 sm:px-6 py-12">
        {/* Big tick */}
        <div className="text-center mb-8">
          <div className="text-7xl mb-4">✅</div>
          <h1 className="font-display text-3xl font-bold text-gray-800 mb-2">
            Thanks, {order.customer_name.split(' ')[0]}! Your order is in.
          </h1>
          <p className="text-gray-600">Order <span className="font-mono font-semibold">#{shortId(order.id)}</span></p>
        </div>

        {/* Status badge */}
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl mb-6 ${cfg.color}`}>
          <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
          <span className="font-medium text-sm">{cfg.label}</span>
          <button
            onClick={fetchOrder}
            title="Refresh status"
            className="ml-auto text-xs underline opacity-70 hover:opacity-100"
          >
            Refresh
          </button>
        </div>

        {/* Items */}
        <div className="bg-white rounded-xl border border-cream-200 divide-y divide-cream-100 mb-6">
          {items.map(item => (
            <div key={item.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div>
                <p className="font-medium text-gray-800">{item.product_name}</p>
                <p className="text-gray-500">Qty: {item.quantity} × {formatPrice(item.unit_price_pence)}</p>
              </div>
              <p className="font-semibold text-gray-800">{formatPrice(item.unit_price_pence * item.quantity)}</p>
            </div>
          ))}
          <div className="flex justify-between px-4 py-3 font-bold text-gray-800">
            <span>Total</span>
            <span>{formatPrice(order.total_pence)}</span>
          </div>
        </div>

        {/* Collection info */}
        <div className="bg-cream-100 rounded-xl p-4 mb-6 text-sm text-gray-700 space-y-1">
          <p className="font-semibold text-gray-800 mb-2">Collection details</p>
          <p>📍 123 High Street, London</p>
          <p>🕐 Mon–Sat 9am–6pm, Sun 10am–4pm</p>
          <p>💳 Payment in store at time of collection</p>
        </div>

        <p className="text-center text-sm text-gray-500 mb-6">
          We've sent a confirmation to <strong>{order.customer_email}</strong>
        </p>

        <Link to="/" className="block text-center text-brand hover:underline text-sm">
          ← Continue shopping
        </Link>
      </main>
    </>
  )
}
