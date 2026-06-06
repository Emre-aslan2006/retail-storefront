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
  const [placing, setPlacing] = useState(false)
  const [placeError, setPlaceError] = useState(null)

  useEffect(() => {
    if (items.length === 0) return
    const ids = items.map(i => i.id)
    supabase.from('products').select('id, stock').in('id', ids).then(({ data }) => {
      if (data) refreshStock(data)
    })
  }, []) // eslint-disable-line

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    const errs = validate({ ...form })
    setErrors(prev => ({ ...prev, [field]: errs[field] || null }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const allTouched = { name: true, email: true, phone: true, note: true }
    setTouched(allTouched)
    const errs = validate(form)
    setErrors(errs)
    if (Object.keys(errs).length > 0) {
      const first = ['name', 'email', 'note'].find(f => errs[f])
      document.getElementById(`field-${first}`)?.focus()
      return
    }
    setPlacing(true)
    setPlaceError(null)
    const orderItems = items.map(i => ({
      product_id: i.id,
      product_name: i.name,
      unit_price_pence: i.unit_price_pence ?? i.price_pence,
      quantity: i.quantity,
    }))
    const { data, error } = await supabase.rpc('place_order', {
      p_items: orderItems,
      p_name: form.name,
      p_email: form.email,
      p_phone: form.phone || null,
      p_note: form.note || null,
    })
    if (error) {
      setPlacing(false)
      setPlaceError(error.message || 'Something went wrong. Please try again.')
      const ids = items.map(i => i.id)
      supabase.from('products').select('id, stock').in('id', ids).then(({ data: d }) => {
        if (d) refreshStock(d)
      })
      return
    }
    clearCart()
    navigate(`/order/${data}`)
  }

  const handleRemove = (item) => {
    savedItems.current[item.id] = { ...item }
    removeItem(item.id)
    let undone = false
    const id = toast('Removed — ', {
      duration: 5000,
      action: {
        label: 'Undo',
        onClick: () => {
          undone = true
          const saved = savedItems.current[item.id]
          if (saved) updateQty(saved.id, saved.quantity)
        }
      }
    })
    void id
  }

  if (items.length === 0) {
    return (
      <>
        <Header />
        <main className="max-w-3xl mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-6">🛒</div>
          <h1 className="font-display text-3xl font-bold text-gray-800 mb-3">Your cart is empty</h1>
          <p className="text-gray-600 mb-8">Browse our products and add something you love.</p>
          <Link to="/" className="bg-brand text-white px-8 py-3 rounded-lg font-medium hover:bg-brand-dark transition-colors">Browse products</Link>
        </main>
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-display text-3xl font-bold text-gray-800 mb-8">Your cart</h1>
        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-4">
            {items.map(item => {
              const price = item.unit_price_pence ?? item.price_pence
              return (
                <div key={item.id} className={`flex gap-4 p-4 bg-white rounded-xl border border-cream-200 ${item._soldOut ? 'opacity-60' : ''}`}>
                  <Link to={`/product/${item.id}`}>
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-cream-100 shrink-0">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">🏪</div>
                      )}
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-gray-800 truncate">{item.name}</p>
                        <p className="text-sm text-gray-500">{formatPrice(price)} each</p>
                      </div>
                      <button onClick={() => handleRemove(item)} aria-label={`Remove ${item.name}`} className="text-gray-400 hover:text-red-500 transition-colors shrink-0">✕</button>
                    </div>
                    {item._soldOut && <p className="text-red-600 text-xs mt-1 font-medium">This item is no longer available</p>}
                    {item._stockWarning && !item._soldOut && <p className="text-amber-600 text-xs mt-1 font-medium">Only {item.stock} left — quantity updated</p>}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-cream-200 rounded-lg overflow-hidden">
                        <button onClick={() => updateQty(item.id, item.quantity - 1)} disabled={item.quantity <= 1} aria-label="Decrease" className="px-2.5 py-1.5 hover:bg-cream-100 disabled:opacity-40 text-sm">−</button>
                        <span className="px-3 py-1.5 border-x border-cream-200 text-sm">{item.quantity}</span>
                        <button onClick={() => updateQty(item.id, item.quantity + 1)} disabled={item.quantity >= item.stock} aria-label="Increase" className="px-2.5 py-1.5 hover:bg-cream-100 disabled:opacity-40 text-sm">+</button>
                      </div>
                      <p className="font-semibold text-gray-800">{formatPrice(price * item.quantity)}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-cream-200 p-6 sticky top-20">
              <h2 className="font-display text-xl font-bold text-gray-800 mb-4">Order summary</h2>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Subtotal</span>
                <span className="font-semibold text-gray-800">{formatPrice(subtotalPence)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 mb-4 pb-4 border-b border-cream-200">
                <span>Fulfilment</span>
                <span className="text-green-600 font-medium">Click &amp; Collect (free)</span>
              </div>
              <div className="flex justify-between font-bold text-lg text-gray-800 mb-6">
                <span>Total</span>
                <span>{formatPrice(subtotalPence)}</span>
              </div>
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div>
                  <label htmlFor="field-name" className="block text-sm font-medium text-gray-700 mb-1">Full name *</label>
                  <input id="field-name" type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} onBlur={() => handleBlur('name')} autoComplete="name" className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand ${touched.name && errors.name ? 'border-red-400' : 'border-cream-200'}`} />
                  {touched.name && errors.name && <p className="text-red-600 text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label htmlFor="field-email" className="block text-sm font-medium text-gray-700 mb-1">Email address *</label>
                  <input id="field-email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} onBlur={() => handleBlur('email')} autoComplete="email" className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand ${touched.email && errors.email ? 'border-red-400' : 'border-cream-200'}`} />
                  {touched.email && errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
                </div>
                <div>
                  <label htmlFor="field-phone" className="block text-sm font-medium text-gray-700 mb-1">Phone <span className="text-gray-400">(optional)</span></label>
                  <input id="field-phone" type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} autoComplete="tel" className="w-full border border-cream-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
                </div>
                <div>
                  <label htmlFor="field-note" className="block text-sm font-medium text-gray-700 mb-1">Note <span className="text-gray-400">(optional)</span></label>
                  <textarea id="field-note" rows={3} maxLength={200} value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} onBlur={() => handleBlur('note')} className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand resize-none ${touched.note && errors.note ? 'border-red-400' : 'border-cream-200'}`} />
                  <div className="flex justify-between items-center mt-0.5">
                    {touched.note && errors.note ? <p className="text-red-600 text-xs">{errors.note}</p> : <span />}
                    <p className="text-xs text-gray-400">{form.note.length}/200</p>
                  </div>
                </div>
                {placeError && <p className="text-red-600 text-sm p-3 bg-red-50 rounded-lg">{placeError}</p>}
                <button type="submit" disabled={placing || items.some(i => i._soldOut)} className="w-full bg-brand text-white py-3 rounded-lg font-semibold hover:bg-brand-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {placing && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {placing ? 'Placing order…' : 'Place order'}
                </button>
                <p className="text-xs text-gray-500 text-center">Click &amp; collect · Pay in store</p>
              </form>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
