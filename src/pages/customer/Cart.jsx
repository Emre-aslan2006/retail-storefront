import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { formatPrice } from '../../lib/helpers'
import { useCart } from '../../contexts/CartContext'
import { useToast } from '../../contexts/ToastContext'
import Header from '../../components/Header'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate(fields) {
  const errors = {}
  if (!fields.name.trim()) errors.name = 'Name is required'
  if (!fields.email.trim()) errors.email = 'Email is required'
  else if (!EMAIL_RE.test(fields.email)) errors.email = 'Enter a valid email address'
  if (fields.note.length > 200) errors.note = 'Note must be 200 characters or fewer'
  return errors
}

export default function Cart() {
  const { items, updateQty, removeItem, clearCart, refreshStock, subtotalPence } = useCart()
  const { toast } = useToast()
  const navigate = useNavigate()
  const savedItems = useRef({})

  const [form, setForm] = useState({ name: '', email: '', phone: '', note: '' })
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [placeError, setPlaceError] = useState(null)
  const [placing, setPlacing] = useState(false)

  useEffect(() => { refreshStock() }, []) // eslint-disable-line

  const handleRemove = (item) => {
    savedItems.current[item.id] = item
    removeItem(item.id)
    const id = toast(
      <span>
        Removed <strong>{item.name}</strong>.{' '}
        <button
          className="underline font-medium"
          onClick={() => {
            const saved = savedItems.current[item.id]
            if (saved) updateQty(saved.id, saved.qty)
            void id
          }}
        >
          Undo
        </button>
      </span>,
      4000
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate(form)
    setErrors(errs)
    if (Object.keys(errs).length) return
    setPlacing(true)
    setPlaceError(null)
    try {
      const { data, error } = await supabase.rpc('place_order', {
        p_customer_name: form.name.trim(),
        p_customer_email: form.email.trim(),
        p_customer_phone: form.phone.trim() || null,
        p_note: form.note.trim() || null,
        p_items: items.map(i => ({ product_id: i.id, quantity: i.qty })),
      })
      if (error) throw error
      clearCart()
      navigate('/order/' + data)
    } catch (err) {
      setPlaceError(err.message || 'Something went wrong. Please try again.')
      setPlacing(false)
    }
  }

  if (items.length === 0) {
    return (
      <>
        <Header />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h1 className="font-display text-2xl font-bold text-gray-800 mb-2">Your cart is empty</h1>
          <p className="text-gray-500 mb-6">Add something from the shop to get started.</p>
          <Link
            to="/"
            className="inline-block bg-brand text-white px-6 py-2.5 rounded-lg font-medium hover:bg-brand-dark transition-colors"
          >
            Browse the shop
          </Link>
        </main>
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Your cart</h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Items column */}
          <div className="flex-1 min-w-0">
            <div className="space-y-4">
              {items.map(item => (
                <div key={item.id} className="flex gap-4 bg-white rounded-xl border border-cream-200 p-4">
                  {/* Thumbnail */}
                  <Link to={'/product/' + item.id} className="flex-shrink-0">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-24 h-24 object-cover rounded-lg bg-cream-100"
                    />
                  </Link>
                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <Link to={'/product/' + item.id} className="font-medium text-gray-800 hover:text-brand leading-snug">
                        {item.name}
                      </Link>
                      <span className="font-semibold text-gray-800 whitespace-nowrap">
                        {formatPrice(item.price_pence * item.qty)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{formatPrice(item.price_pence)} each</p>
                    {item.qty > item.stock && (
                      <p className="text-xs text-red-600 mt-1">Only {item.stock} in stock</p>
                    )}
                    {/* Qty + remove */}
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex items-center border border-cream-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() => updateQty(item.id, item.qty - 1)}
                          disabled={item.qty <= 1}
                          className="px-3 py-1.5 text-gray-600 hover:bg-cream-100 disabled:opacity-40 transition-colors"
                          aria-label="Decrease quantity"
                        >−</button>
                        <span className="px-3 py-1.5 text-sm font-medium min-w-[2rem] text-center">{item.qty}</span>
                        <button
                          onClick={() => updateQty(item.id, item.qty + 1)}
                          disabled={item.qty >= item.stock}
                          className="px-3 py-1.5 text-gray-600 hover:bg-cream-100 disabled:opacity-40 transition-colors"
                          aria-label="Increase quantity"
                        >+</button>
                      </div>
                      <button
                        onClick={() => handleRemove(item)}
                        className="text-sm text-gray-400 hover:text-red-500 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <Link to="/" className="text-sm text-brand hover:underline">
                ← Continue shopping
              </Link>
            </div>
          </div>

          {/* Order summary + checkout form */}
          <div className="w-full lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-xl border border-cream-200 p-6 sticky top-4">
              <h2 className="font-semibold text-gray-800 mb-4">Order summary</h2>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>{items.reduce((s, i) => s + i.qty, 0)} item{items.reduce((s, i) => s + i.qty, 0) !== 1 ? 's' : ''}</span>
                <span>{formatPrice(subtotalPence)}</span>
              </div>
              <div className="flex justify-between font-semibold text-gray-800 border-t border-cream-200 pt-3 mt-3">
                <span>Total</span>
                <span>{formatPrice(subtotalPence)}</span>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="name">Name *</label>
                  <input
                    id="name" type="text" autoComplete="name"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    onBlur={() => setTouched(t => ({ ...t, name: true }))}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand ${touched.name && errors.name ? 'border-red-400' : 'border-cream-200'}`}
                    aria-invalid={!!(touched.name && errors.name)}
                  />
                  {touched.name && errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">Email *</label>
                  <input
                    id="email" type="email" autoComplete="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    onBlur={() => setTouched(t => ({ ...t, email: true }))}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand ${touched.email && errors.email ? 'border-red-400' : 'border-cream-200'}`}
                    aria-invalid={!!(touched.email && errors.email)}
                  />
                  {touched.email && errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="phone">Phone (optional)</label>
                  <input
                    id="phone" type="tel" autoComplete="tel"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full border border-cream-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="note">
                    Note <span className="text-gray-400 font-normal">(optional, max 200 chars)</span>
                  </label>
                  <textarea
                    id="note" rows={3}
                    value={form.note}
                    onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                    onBlur={() => setTouched(t => ({ ...t, note: true }))}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand resize-none ${touched.note && errors.note ? 'border-red-400' : 'border-cream-200'}`}
                  />
                  <p className={`text-xs mt-1 ${form.note.length > 200 ? 'text-red-500' : 'text-gray-400'}`}>
                    {form.note.length}/200
                  </p>
                  {touched.note && errors.note && <p className="text-xs text-red-500">{errors.note}</p>}
                </div>

                {placeError && (
                  <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{placeError}</p>
                )}

                <button
                  type="submit"
                  disabled={placing}
                  className="w-full bg-brand text-white py-3 rounded-lg font-semibold hover:bg-brand-dark disabled:opacity-60 transition-colors"
                >
                  {placing ? 'Placing order…' : 'Place order'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
