import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { formatPrice } from '../../lib/helpers'
import { useToast } from '../../contexts/ToastContext'
import { DEMO_MODE } from '../../lib/constants'

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('newest')
  const [deactivateId, setDeactivateId] = useState(null)
  const [editingStockId, setEditingStockId] = useState(null)
  const [stockDraft, setStockDraft] = useState('')
  const { toast } = useToast()
  const navigate = useNavigate()

  const fetchProducts = async () => {
    setLoading(true)
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    setProducts(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchProducts() }, [])

  const filtered = products.filter(p => {
    const q = search.toLowerCase()
    return !q || p.name?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q)
  }).sort((a, b) => {
    if (sort === 'name') return a.name.localeCompare(b.name)
    if (sort === 'stock') return a.stock - b.stock
    return new Date(b.created_at) - new Date(a.created_at)
  })

  const saveStock = async (id) => {
    const newStock = parseInt(stockDraft, 10)
 
    if (DEMO_MODE) { toast('🚫 Demo mode – changes are disabled in this portfolio preview.'); return }   if (isNaN(newStock) || newStock < 0) { setEditingStockId(null); return }
    setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: newStock } : p))
    const { error } = await supabase.from('products').update({ stock: newStock }).eq('id', id)
    if (error) { toast('Failed to update stock'); fetchProducts() }
    else toast('Stock updated')
    setEditingStockId(null)
  }

  const toggleActive = async (product) => {
    const newVal = !product.is_active
    const msg = newVal ? 'Product is now visible in the store.' : 'Product hidden from store.'
    if (DEMO_MODE) { toast('🚫 Demo mode – changes are disabled in this portfolio preview.'); return }
    await supabase.from('products').update({ is_active: newVal }).eq('id', product.id)
    toast(msg)
    setDeactivateId(null)
    fetchProducts()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-gray-800">Products</h1>
        <Link
          to="/admin/products/new"
          className="bg-brand text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-dark transition-colors flex items-center gap-1"
        >
          ＋ Add product
        </Link>
      </div>

      {/* Toolbar */}
      <div className="flex gap-3 flex-wrap">
        <input
          type="search"
          placeholder="Search products…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand flex-1 min-w-48"
        />
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-white"
        >
          <option value="newest">Newest</option>
          <option value="name">Name A–Z</option>
          <option value="stock">Stock (low–high)</option>
        </select>
      </div>

      {/* Confirm deactivate dialog */}
      {deactivateId && (() => {
        const p = products.find(x => x.id === deactivateId)
        return (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
              <h3 className="font-semibold text-gray-800 mb-2">
                {p.is_active ? 'Hide this product?' : 'Show this product?'}
              </h3>
              <p className="text-sm text-gray-600 mb-5">
                {p.is_active
                  ? 'It will be hidden from the storefront immediately. Orders that reference it are unaffected.'
                  : 'It will appear in the storefront again.'}
              </p>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setDeactivateId(null)} className="px-4 py-2 text-sm text-gray-600 hover:underline">Cancel</button>
                <button onClick={() => toggleActive(p)} className="px-4 py-2 text-sm bg-brand text-white rounded-lg hover:bg-brand-dark">Confirm</button>
              </div>
            </div>
          </div>
        )
      })()}

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-7 h-7 border-4 border-brand border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {filtered.map(p => (
            <div key={p.id} className="flex items-center gap-4 px-5 py-4">
              {/* Thumbnail */}
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-cream-100 shrink-0">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl">🏪</div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 text-sm truncate">{p.name}</p>
                <p className="text-xs text-gray-400">{p.category} · {formatPrice(p.price_pence)}</p>
              </div>

              {/* Inline stock edit */}
              <div className="text-sm shrink-0">
                {editingStockId === p.id ? (
                  <input
                    type="number"
                    min={0}
                    value={stockDraft}
                    onChange={e => setStockDraft(e.target.value)}
                    onBlur={() => saveStock(p.id)}
                    onKeyDown={e => e.key === 'Enter' && saveStock(p.id)}
                    autoFocus
                    className="w-16 border border-brand rounded px-2 py-1 text-center text-sm focus:outline-none"
                  />
                ) : (
                  <button
                    onClick={() => { setEditingStockId(p.id); setStockDraft(String(p.stock)) }}
                    className={`font-mono text-sm px-2 py-1 rounded hover:bg-gray-100 ${p.stock === 0 ? 'text-red-600' : p.stock <= 3 ? 'text-amber-600' : 'text-gray-700'}`}
                    title="Click to edit stock"
                  >
                    {p.stock}
                  </button>
                )}
              </div>

              {/* Active toggle */}
              <button
                onClick={() => setDeactivateId(p.id)}
                title={p.is_active ? 'Visible — click to hide' : 'Hidden — click to show'}
                className={`w-10 h-6 rounded-full transition-colors ${p.is_active ? 'bg-brand' : 'bg-gray-200'} shrink-0 relative`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${p.is_active ? 'left-4.5' : 'left-0.5'}`} />
              </button>

              {/* Edit link */}
              <button onClick={() => navigate(`/admin/products/${p.id}`)} className="text-brand text-sm hover:underline shrink-0">Edit</button>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="py-12 text-center text-gray-400">No products found</p>
          )}
        </div>
      )}
    </div>
  )
}
