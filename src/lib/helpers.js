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
  return uuid?.slice(0, 8).toUpperCase() ?? ''
}

/**
 * Debounce a function call.
 */
export function debounce(fn, delay) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

/**
 * Compress and resize an image File to max 1200px, returns a new File.
 */
export async function compressImage(file, maxPx = 1200, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      let { width, height } = img
      if (width > maxPx || height > maxPx) {
        const ratio = Math.min(maxPx / width, maxPx / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url)
          if (!blob) return reject(new Error('Canvas toBlob failed'))
          resolve(new File([blob], file.name, { type: 'image/jpeg' }))
        },
        'image/jpeg',
        quality
      )
    }
    img.onerror = reject
    img.src = url
  })
}
