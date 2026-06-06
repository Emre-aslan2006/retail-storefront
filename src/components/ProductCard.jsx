import { Link } from 'react-router-dom'
import { formatPrice } from '../lib/helpers'

export default function ProductCard({ product }) {
  const { id, name, price_pence, stock, image_url, category } = product
  const soldOut = stock === 0
  const lowStock = stock > 0 && stock <= 3

  return (
    <Link
      to={soldOut ? '#' : `/product/${id}`}
      onClick={e => soldOut && e.preventDefault()}
      className={`group rounded-xl overflow-hidden border border-cream-200 bg-white hover:shadow-md transition-shadow ${soldOut ? 'cursor-not-allowed opacity-75' : ''}`}
      aria-disabled={soldOut}
    >
      {/* Image */}
      <div className="aspect-square overflow-hidden relative bg-cream-100">
        {image_url ? (
          <img
            src={image_url}
            alt={name}
            loading="lazy"
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${soldOut ? 'grayscale' : ''}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300">
            🏪
          </div>
        )}
        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-gray-900/80 text-white text-xs font-semibold px-3 py-1 rounded-full">
              Sold out
            </span>
          </div>
        )}
        {lowStock && !soldOut && (
          <div className="absolute top-2 left-2">
            <span className="bg-amber-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
              Only {stock} left
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-sm font-medium text-gray-800 truncate">{name}</p>
        <p className="text-sm font-semibold text-brand mt-0.5">{formatPrice(price_pence)}</p>
      </div>
    </Link>
  )
}
