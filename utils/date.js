const DAY_MS = 24 * 60 * 60 * 1000

function pad(value) {
  return String(value).padStart(2, '0')
}

function toDate(value) {
  if (value instanceof Date) return new Date(value.getFullYear(), value.getMonth(), value.getDate())
  if (typeof value === 'number') {
    const date = new Date(value)
    return new Date(date.getFullYear(), date.getMonth(), date.getDate())
  }
  const parts = String(value || '').split('-').map(Number)
  if (parts.length !== 3 || parts.some(Number.isNaN)) return new Date()
  return new Date(parts[0], parts[1] - 1, parts[2])
}

function formatDate(value) {
  const date = toDate(value || new Date())
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function daysBetween(start, end) {
  const startDate = toDate(start)
  const endDate = toDate(end || new Date())
  return Math.max(0, Math.floor((endDate.getTime() - startDate.getTime()) / DAY_MS))
}

function friendlyDate(value) {
  const date = toDate(value)
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

function todayLabel() {
  const now = new Date()
  const week = ['日', '一', '二', '三', '四', '五', '六'][now.getDay()]
  return `${now.getMonth() + 1}月${now.getDate()}日 · 周${week}`
}

module.exports = {
  DAY_MS,
  daysBetween,
  formatDate,
  friendlyDate,
  todayLabel,
  toDate
}
