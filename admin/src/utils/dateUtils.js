export function toTimestamp(ts) {
  if (!ts) return null
  if (typeof ts === 'number') return ts * 1000
  const secs = ts._seconds ?? ts.seconds
  return secs ? secs * 1000 : null
}

export function formatDate(ts) {
  const ms = toTimestamp(ts)
  if (!ms || isNaN(ms)) return '—'
  return new Date(ms).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function formatDateShort(ts) {
  const ms = toTimestamp(ts)
  if (!ms || isNaN(ms)) return '—'
  return new Date(ms).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function cap(str) { return str ? str[0].toUpperCase() + str.slice(1) : '—' }