import { Link } from 'react-router-dom'
import Header from '../components/Header'

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="min-h-[70vh] flex items-center justify-center bg-cream-50 p-6">
        <div className="text-center max-w-md">
          <div className="text-8xl mb-6">🛍️</div>
          <h1 className="font-display text-4xl font-bold text-gray-800 mb-3">Page not found</h1>
          <p className="text-gray-600 mb-8">
            This page doesn't exist or was moved. Let's get you back to shopping.
          </p>
          <Link
            to="/"
            className="inline-flex items-center bg-brand text-white px-6 py-3 rounded-lg font-medium hover:bg-brand-dark transition-colors"
          >
            ← Back to the shop
          </Link>
        </div>
      </main>
    </>
  )
}
