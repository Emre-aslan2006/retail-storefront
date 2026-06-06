/**
 * Format pence/cents integer to display currency string.
 * e.g. 1250 -> "£12.50"
 */
export function formatPrice(pence) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(pence / 100)
}

/**
 * Convert display price string/number to pence integer.
 * e.g. "12.50" -> 1250
 */
export function priceToPence(displayPrice) {
  return Math.round(parseFloat(displayPrice) * 100)
}

/**
 * Clamp a cart quantity between 1 and the available stock.
 * clampQty(requested, stock) => integer in [1, max(1, stock)]
 */
export function clampQty(requested, stock) {
  const max = Math.max(1, stock)
  return Math.min(Math.max(1, requested), max)
}

/**
 * Compress an image File to a max width, returning a new File.
 * Used in ProductForm for image uploads.
 */
export function compressImage(file, maxWidth = 1200) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, maxWidth / img.width)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('Canvas toBlob failed'))
          resolve(new File([blob], file.name, { type: 'image/jpeg' }))
        },
        'image/jpeg',
        0.85,
      )
    }
    img.onerror = reject
    img.src = url
  })
}

/**
 * Relative time: "3 min ago", "2 hr ago", etc.
 */
export function relativeTime(dateString) {
  const diff = Date.now() - new Date(dateString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return mins + ' min ago'
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return hrs + ' hr ago'
  const days = Math.floor(hrs / 24)
  return days + ' day' + (days === 1 ? '' : 's') + ' ago'
}

/**
 * Truncate a UUID to a short order reference (first 8 chars, uppercase).
 */
export function shortId(uuid) {
  return (uuid || '').slice(0, 8).toUpperCase()
}

/**
 * Status badge colours for order status strings.
 */
export function statusColour(status) {
  switch (status) {
    case 'pending':   return 'bg-amber-100 text-amber-800'
    case 'ready':     return 'bg-green-100 text-green-800'
    case 'collected': return 'bg-gray-100 text-gray-600'
    case 'cancelled': return 'bg-red-100 text-red-700'
    default:          return 'bg-gray-100 text-gray-600'
  }
}

/**
 * Debounce: returns a function that delays calling fn until after wait ms.
 */
export function debounce(fn, wait = 300) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), wait)
  }
}
