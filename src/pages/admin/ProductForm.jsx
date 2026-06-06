import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { priceToPence, formatPrice, compressImage } from '../../lib/helpers'
import { useToast } from '../../contexts/ToastContext'

const DEFAULT_CATEGORIES = ['Tops', 'Bottoms', 'Dresses', 'Accessories', 'Footwear', 'Outerwear']

export default function ProductForm() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const { toast } = useToast()
  const fileInputRef = useRef(null)

  const [form, setForm] = useState({
    name: '', description: '', price: '', category: '', stock: 0, is_active: true
  })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [existingImageUrl, setExistingImageUrl] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [isDirty, setIsDirty] = useState(false)
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)
  const [newCat, setNewCat] = useState('')
  const [showNewCat, setShowNewCat] = useState(false)
  const [loading, setLoading] = useState(isEdit)

  useEffect(() => {
    const handler = (e) => {
      if (isDirty) { e.preventDefault(); e.returnValue = '' }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  useEffect(() => {
    supabase.from('products').select('category').then(({ data }) => {
      if (data) {
        const cats = [...new Set([...DEFAULT_CATEGORIES, ...data.map(p => p.category).filter(Boolean)])]
        setCategories(cats.sort())
      }
    })
  }, [])

  useEffect(() => {
    if (!isEdit) return
    supabase.from('products').select('*').eq('id', id).single().then(({ data }) => {
      if (data) {
        setForm({
          name: data.name ?? '',
          description: data.description ?? '',
          price: (data.price_pence / 100).toFixed(2),
          category: data.category ?? '',
          stock: data.stock ?? 0,
          is_active: data.is_active ?? true,
        })
        setExistingImageUrl(data.image_url)
        setImagePreview(data.image_url)
      }
      setLoading(false)
    })
  }, [id, isEdit])

  const setField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setIsDirty(true)
  }

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const compressed = await compressImage(file)
    setImageFile(compressed)
    setImagePreview(URL.createObjectURL(compressed))
    setIsDirty(true)
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    const compressed = await compressImage(file)
    setImageFile(compressed)
    setImagePreview(URL.createObjectURL(compressed))
    setIsDirty(true)
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Name is required'
    if (!form.price || isNaN(parseFloat(form.price)) || parseFloat(form.price) < 0) errs.price = 'Enter a valid price'
    if (form.stock < 0) errs.stock = 'Stock cannot be negative'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    setSaving(true)
    setUploadProgress(0)
    let imageUrl = existingImageUrl
    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const path = `products/${Date.now()}.${ext}`
      setUploadProgress(20)
      const { error: uploadError } = await supabase.storage.from('product-images').upload(path, imageFile, { upsert: true })
      if (uploadError) { toast('Image upload failed: ' + uploadError.message); setSaving(false); return }
      setUploadProgress(80)
      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path)
      imageUrl = urlData.publicUrl
    }
    setUploadProgress(90)
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price_pence: priceToPence(form.price),
      category: form.category.trim() || null,
      stock: parseInt(form.stock, 10),
      is_active: form.is_active,
      image_url: imageUrl,
    }
    let error
    if (isEdit) {
      ({ error } = await supabase.from('products').update(payload).eq('id', id))
    } else {
      ({ error } = await supabase.from('products').insert(payload))
    }
    setSaving(false)
    setUploadProgress(0)
    if (error) { toast('Save failed: ' + error.message); return }
    setIsDirty(false)
    toast(isEdit ? 'Product updated' : 'Product created')
    navigate('/admin/products')
  }

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" /></div>
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin/products" className="text-sm text-brand hover:underline">&larr; Products</Link>
        <h1 className="font-display text-2xl font-bold text-gray-800">{isEdit ? 'Edit product' : 'Add product'}</h1>
      </div>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Product image</label>
          <div onDrop={handleDrop} onDragOver={e => e.preventDefault()} onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-cream-200 rounded-xl p-6 text-center cursor-pointer hover:border-brand transition-colors relative overflow-hidden">
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto rounded-lg object-contain" />
            ) : (
              <div className="text-gray-400">
                <div className="text-4xl mb-2">🖼️</div>
                <p className="text-sm">Drag & drop or click to upload</p>
                <p className="text-xs mt-1">Max 1200px, compressed automatically</p>
              </div>
            )}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-cream-200">
                <div className="h-1 bg-brand transition-all" style={{ width: uploadProgress + '%' }} />
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
        </div>
        <div>
          <label htmlFor="p-name" className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
          <input id="p-name" type="text" required value={form.name} onChange={e => setField('name', e.target.value)} className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand ${errors.name ? 'border-red-400' : 'border-gray-200'}`} />
          {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name}</p>}
        </div>
        <div>
          <label htmlFor="p-desc" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea id="p-desc" rows={4} value={form.description} onChange={e => setField('description', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand resize-none" />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="p-price" className="block text-sm font-medium text-gray-700 mb-1">Price (£) *</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-400 text-sm">£</span>
              <input id="p-price" type="number" min="0" step="0.01" value={form.price} onChange={e => setField('price', e.target.value)} className={`w-full border rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand ${errors.price ? 'border-red-400' : 'border-gray-200'}`} />
            </div>
            {errors.price && <p className="text-red-600 text-xs mt-1">{errors.price}</p>}
          </div>
          <div>
            <label htmlFor="p-stock" className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
            <input id="p-stock" type="number" min="0" value={form.stock} onChange={e => setField('stock', parseInt(e.target.value, 10) || 0)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
          </div>
        </div>
        <div>
          <label htmlFor="p-cat" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          {showNewCat ? (
            <div className="flex gap-2">
              <input type="text" value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="New category name" className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
              <button type="button" onClick={() => { if (newCat.trim()) { setCategories(prev => [...prev, newCat.trim()]); setField('category', newCat.trim()) } setShowNewCat(false); setNewCat('') }} className="px-3 py-2 bg-brand text-white text-sm rounded-lg">Add</button>
              <button type="button" onClick={() => setShowNewCat(false)} className="text-sm text-gray-500 hover:underline px-2">Cancel</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <select id="p-cat" value={form.category} onChange={e => setField('category', e.target.value)} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-white">
                <option value="">— No category —</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button type="button" onClick={() => setShowNewCat(true)} className="text-sm text-brand hover:underline px-2 shrink-0">+ New</button>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Visible in store</p>
            <p className="text-xs text-gray-400">Toggle off to hide without deleting</p>
          </div>
          <button type="button" onClick={() => setField('is_active', !form.is_active)} className={`w-12 h-7 rounded-full transition-colors relative ${form.is_active ? 'bg-brand' : 'bg-gray-200'}`} aria-checked={form.is_active} role="switch">
            <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${form.is_active ? 'left-6' : 'left-1'}`} />
          </button>
        </div>
        <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
          <button type="submit" disabled={saving} className="flex-1 sm:flex-none bg-brand text-white px-8 py-3 rounded-lg font-semibold hover:bg-brand-dark transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {saving ? 'Saving…' : 'Save product'}
          </button>
          <Link to="/admin/products" className="text-sm text-gray-500 hover:underline">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
