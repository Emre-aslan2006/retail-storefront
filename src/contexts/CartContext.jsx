import { createContext, useContext, useReducer, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const CartContext = createContext(null)

const CART_KEY = 'shop_cart'

function cartReducer(state, action) {
        switch (action.type) {
              case 'ADD_ITEM': {
                          const existing = state.find(i => i.id === action.product.id)
                          if (existing) {
                                        return state.map(i =>
                                                        i.id === action.product.id
                                                                     ? { ...i, qty: Math.min(i.qty + action.qty, i.stock) }
                                                          : i
                                                                 )
                          }
                          return [...state, { ...action.product, qty: action.qty }]
              }
              case 'UPDATE_QTY':
                          if (action.qty <= 0) return state.filter(i => i.id !== action.id)
                          return state.map(i =>
                                        i.id === action.id ? { ...i, qty: Math.min(action.qty, i.stock) } : i
                                                 )
              case 'REMOVE_ITEM':
                          return state.filter(i => i.id !== action.id)
              case 'CLEAR':
                          return []
              case 'HYDRATE':
                          return action.items.map(i => ({
                                        ...i,
                                        qty: Number(i.qty) || Number(i.quantity) || 1,
                          }))
              case 'REFRESH_STOCK': {
                          const products = action.products
                          if (!Array.isArray(products)) return state
                          return state.map(i => {
                                        const fresh = products.find(p => p.id === i.id)
                                        if (!fresh) return { ...i, _soldOut: true }
                                        if (fresh.stock === 0) return { ...i, stock: 0, qty: 0, _soldOut: true }
                                        if (i.qty > fresh.stock) return { ...i, stock: fresh.stock, qty: fresh.stock, _stockWarning: true }
                                        return { ...i, stock: fresh.stock, _soldOut: false, _stockWarning: false }
                          })
              }
              default:
                          return state
        }
}

export function CartProvider({ children }) {
        const [items, dispatch] = useReducer(cartReducer, [])

  // Hydrate from localStorage
  useEffect(() => {
            try {
                        const saved = localStorage.getItem(CART_KEY)
                        if (saved) dispatch({ type: 'HYDRATE', items: JSON.parse(saved) })
            } catch {}
  }, [])

  // Persist on change
  useEffect(() => {
            localStorage.setItem(CART_KEY, JSON.stringify(items))
  }, [items])

  const addItem = (product, qty = 1) => dispatch({ type: 'ADD_ITEM', product, qty })
        const updateQty = (itemOrId, qty) => {
                  const id = itemOrId && typeof itemOrId === 'object' ? itemOrId.id : itemOrId
                  dispatch({ type: 'UPDATE_QTY', id, qty })
        }
        const removeItem = (itemOrId) => {
                  const id = itemOrId && typeof itemOrId === 'object' ? itemOrId.id : itemOrId
                  dispatch({ type: 'REMOVE_ITEM', id })
        }
        const clearCart = () => dispatch({ type: 'CLEAR' })
        const refreshStock = async (products) => {
                  if (Array.isArray(products)) {
                              dispatch({ type: 'REFRESH_STOCK', products })
                              return
                  }
                  try {
                              const { data } = await supabase.from('products').select('id, stock')
                              if (data) dispatch({ type: 'REFRESH_STOCK', products: data })
                  } catch {}
        }

  const itemCount = items.reduce((sum, i) => sum + (i.qty || 0), 0)
        const subtotalPence = items.reduce((sum, i) => sum + (i.price_pence || 0) * (i.qty || 0), 0)

  return (
            <CartContext.Provider value={{ items, addItem, updateQty, removeItem, clearCart, refreshStock, itemCount, subtotalPence }}>
                  {children}
            </CartContext.Provider>
          )
}

export function useCart() {
        const ctx = useContext(CartContext)
        if (!ctx) throw new Error('useCart must be used within CartProvider')
        return ctx
}
