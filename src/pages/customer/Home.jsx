import { useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { debounce } from '../../lib/helpers'
import Header from '../../components/Header'
import ProductCard from '../../components/ProductCard'
import { SkeletonGrid } from '../../components/SkeletonCard'

export default function Home() {
  const [products, setProducts] = useState([])
  const [status, setStatus] = useState('loading') // loading | success | error
  const [searchParams, setSearchParams] = useSearchParams()

  const q = searchParams.get('q') || ''
  const cat = searchParams.get('category') || 'All'

  const fetchProducts = useCallback(async () => {
    setStatus('loading')
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    if (error) { setStatus('error'); return }
    setProducts(data)
    setStatus('success')
  }, [])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const categories = useMemo(() => {
    const cats = [...new Set(products.map(p => p.category).filter(Boolean))]
    return ['All', ...cats.sort()]
  }, [products])

  const setQuery = useCallback(
    debounce((val) => {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev)
        if (val) next.set('q', val); else next.delete('q')
        return next
      })
    }, 300),
    [setSearchParams]
  )

  const setCat = (c) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (c === 'All') next.delete('category'); else next.set('category', c)
      return next
    })
  }

  const filtered = useMemo(() => {
    let list = products
    if (cat !== 'All') list = list.filter(p => p.category === cat)
    if (q) {
      const lower = q.toLowerCase()
      list = list.filter(p =>
        p.name?.toLowerCase().includes(lower) ||
        p.description?.toLowerCase().includes(lower)
      )
    }
    return list
  }, [products, q, cat])

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero strip */}
        <div className="mb-8 bg-cream-100 rounded-2xl p-6 sm:p-8">
          <p className="font-display text-3xl sm:text-4xl font-bold text-gray-800 leading-tight">
            Carefully chosen goods,<br className="hidden sm:block" /> made to last.
          </p>
          <p className="mt-2 text-gray-600">Browse our collection — everything is available to collect in store.</p>
        </div>

        {/* Toolbar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-3">
          <label className="sr-only" htmlFor="search-input">Search products</label>
          <input
            id="search-input"
            type="search"
            placeholder="Search products…"
            defaultValue={q}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 border border-cream-200 bg-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          />
          <div className="flex gap-2 flex-wrap" role="group" aria-label="Filter by category">
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  cat === c
                    ? 'bg-brand text-white'
                    : 'border border-brand text-brand hover:bg-brand hover:text-white'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* States */}
        {status === 'loading' && <SkeletonGrid count={8} />}

        {status === 'error' && (
          <div className="text-center py-20">
            <p className="text-gray-600 mb-4">Couldn't load products. Please try again.</p>
            <button
              onClick={fetchProducts}
              className="bg-brand text-white px-6 py-2.5 rounded-lg font-medium hover:bg-brand-dark"
            >
              Try again
            </button>
          </div>
        )}

        {status === 'success' && products.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🏪</div>
            <p className="text-gray-600">Nothing in stock right now — check back soon!</p>
          </div>
        )}

        {status === 'success' && products.length > 0 && filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-600 mb-4">No results for "<strong>{q || cat}</strong>"</p>
            <button
              onClick={() => setSearchParams({})}
              className="border border-brand text-brand px-5 py-2 rounded-lg hover:bg-brand hover:text-white transition-colors"
            >
              Clear filters
            </button>
          </div>
        )}

        {status === 'success' && filtered.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </main>
    </>
  )
}
