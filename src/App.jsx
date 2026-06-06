import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { CartProvider } from './contexts/CartContext'
import { ToastProvider } from './contexts/ToastContext'
import ErrorBoundary from './components/ErrorBoundary'
import ProtectedRoute from './components/ProtectedRoute'
import Toast from './components/Toast'

// Customer pages
import Home from './pages/customer/Home'
import ProductDetail from './pages/customer/ProductDetail'
import Cart from './pages/customer/Cart'
import OrderConfirmation from './pages/customer/OrderConfirmation'

// Admin pages
import AdminLogin from './pages/admin/Login'
import AdminShell from './pages/admin/AdminShell'
import Dashboard from './pages/admin/Dashboard'
import Orders from './pages/admin/Orders'
import Products from './pages/admin/Products'
import ProductForm from './pages/admin/ProductForm'

import NotFound from './pages/NotFound'

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <CartProvider>
          <BrowserRouter>
            <Toast />
            <Routes>
              {/* Customer */}
              <Route path="/" element={<Home />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/order/:id" element={<OrderConfirmation />} />

              {/* Admin auth */}
              <Route path="/admin/login" element={<AdminLogin />} />

              {/* Protected admin */}
              <Route path="/admin" element={<ProtectedRoute><AdminShell /></ProtectedRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="orders" element={<Orders />} />
                <Route path="products" element={<Products />} />
                <Route path="products/new" element={<ProductForm />} />
                <Route path="products/:id" element={<ProductForm />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </ToastProvider>
    </ErrorBoundary>
  )
}
