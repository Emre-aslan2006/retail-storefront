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
 * Ensures we never send qty < 1 or qty > stock to the DB.
 * clampQty(requested, stock) => integer in [1, max(1, stock)]
 */
export function clampQty(requested, stock) {
  const max = Math.max(1, stock)
  return Math.min(Math.max(1, requested), max)
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
