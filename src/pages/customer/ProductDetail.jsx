import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { formatPrice } from '../../lib/helpers'
import { useCart } from '../../contexts/CartContext'
import { useToast } from '../../contexts/ToastContext'
import Header from '../../components/Header'
import NotFound from '../NotFound'

export default function ProductDetail() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [status, setStatus] = useState('loading')
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const { addItem } = useCart()
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    setStatus('loading')
    supabase.from('products').select('*').eq('id', id).eq('is_active', true).single()
      .then(({ data, error }) => {
        if (error || !data) { setStatus('notfound'); return }
        setProduct(data)
        setStatus('success')
      })
  }, [id])

  if (status === 'loading') {
    return (
      <>
        <Header />
        <div className="max-w-5xl mx-auto px-4 py-12 grid md:grid-cols-2 gap-8 animate-pulse">
          <div className="aspect-square bg-cream-200 rounded-xl" />
          <div className="space-y-4">
            <div className="h-8 bg-cream-200 rounded w-3/4" />
            <div className="h-6 bg-cream-200 rounded w-1/4" />
            <div className="h-4 bg-cream-200 rounded" />
            <div className="h-4 bg-cream-200 rounded w-5/6" />
          </div>
        </div>
      </>
    )
  }

  if (status === 'notfound') return <NotFound />

  const { name, price_pence, description, stock, category, image_url } = product
  const soldOut = stock === 0
  const lowStock = stock > 0 && stock <= 3

  const handleAdd = () => {
    addItem({ ...product, unit_price_pence: price_pence }, qty)
    setAdded(true)
    toast(`Added to cart — `, {
      action: {
        label: 'View cart',
        onClick: () => navigate('/cart'),
      }
    })
    setTimeout(() => setAdded(false), 2000)
  }

  const changeQty = (delta) => {
    setQty(prev => Math.min(Math.max(1, prev + delta), stock))
  }

  const handleQtyInput = (e) => {
    const val = parseInt(e.target.value, 10)
    if (!isNaN(val)) setQty(Math.min(Math.max(1, val), stock))
  }

  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/" className="text-sm text-brand hover:underline mb-6 inline-block">← All products</Link>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Image */}
          <div className="aspect-square rounded-2xl overflow-hidden bg-cream-100">
            {image_url ? (
              <img src={image_url} alt={name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-8xl text-gray-300">🏪</div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col">
            {category && (
              <span className="inline-block self-start bg-cream-100 text-brand text-xs font-semibold px-3 py-1 rounded-full mb-3">
                {category}
              </span>
            )}
            <h1 className="font-display text-3xl font-bold text-gray-800 mb-2">{name}</h1>
            <p className="text-2xl font-semibold text-brand mb-4">{formatPrice(price_pence)}</p>

            {lowStock && (
              <p className="text-amber-600 text-sm font-medium mb-3">⚠ Only {stock} left in stock</p>
            )}

            {description && (
              <p className="text-gray-600 leading-relaxed mb-6">{description}</p>
            )}

            {soldOut ? (
              <button disabled className="w-full md:w-auto bg-gray-300 text-gray-500 px-8 py-3 rounded-lg font-medium cursor-not-allowed">
                Sold out
              </button>
            ) : (
              <div className="space-y-4">
                {/* Quantity stepper */}
                <div className="flex items-center gap-3">
                  <label htmlFor="qty" className="text-sm font-medium text-gray-700">Quantity</label>
                  <div className="flex items-center border border-cream-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => changeQty(-1)}
                      disabled={qty <= 1}
                      aria-label="Decrease quantity"
                      className="px-3 py-2 hover:bg-cream-100 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 font-medium"
                    >
                      −
                    </button>
                    <input
                      id="qty"
                      type="number"
                      min={1}
                      max={stock}
                      value={qty}
                      onChange={handleQtyInput}
                      onBlur={handleQtyInput}
                      className="w-14 text-center border-x border-cream-200 py-2 focus:outline-none focus:bg-cream-50 text-sm"
                    />
                    <button
                      onClick={() => changeQty(1)}
                      disabled={qty >= stock}
                      aria-label="Increase quantity"
                      className="px-3 py-2 hover:bg-cream-100 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 font-medium"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Add to cart button */}
                <button
                  onClick={handleAdd}
                  className={`w-full sm:w-auto px-8 py-3 rounded-lg font-semibold transition-all duration-200 ${
                    added
                      ? 'bg-green-600 text-white'
                      : 'bg-brand text-white hover:bg-brand-dark'
                  }`}
                >
                  {added ? '✓ Added' : 'Add to cart'}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
