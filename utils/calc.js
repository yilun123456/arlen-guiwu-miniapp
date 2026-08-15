const { daysBetween, toDate } = require('./date')
const { getCategory, getItemStatus } = require('./constants')

function round(value, digits = 2) {
  const factor = 10 ** digits
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor
}

function money(value) {
  const amount = Number(value) || 0
  if (Math.abs(amount) >= 10000) return `${round(amount / 10000, 2)}万`
  return amount.toFixed(2)
}

function calculateItem(item, now = new Date()) {
  const price = Math.max(0, Number(item.price) || 0)
  const category = getCategory(item.category)
  const status = getItemStatus(item)
  const today = toDate(now)
  const purchaseDate = toDate(item.purchaseDate)
  const retiredDate = item.retiredDate ? toDate(item.retiredDate) : today
  const effectiveEnd = status.id === 'retired' && retiredDate < today ? retiredDate : today

  // 购入当天算第 1 天：116 元当天为 116 元/天，第二天为 58 元/天。
  const ownershipDays = daysBetween(purchaseDate, effectiveEnd) + 1
  const dailyCost = price / ownershipDays
  const tomorrowDays = status.id === 'retired' ? ownershipDays : ownershipDays + 1
  const tomorrowDailyCost = price / tomorrowDays
  const dailyDrop = Math.max(0, dailyCost - tomorrowDailyCost)
  const useCount = Math.max(0, Math.floor(Number(item.useCount) || 0))

  return {
    ...item,
    itemStatus: status.id,
    statusName: status.name,
    statusColor: status.color,
    price,
    useCount,
    categoryName: category.name,
    emoji: category.emoji,
    categoryColor: category.color,
    ownershipDays,
    calendarDays: daysBetween(purchaseDate, today) + 1,
    dailyCost: round(dailyCost, 4),
    tomorrowDailyCost: round(tomorrowDailyCost, 4),
    dailyDrop: round(dailyDrop, 4),
    costPerUse: useCount > 0 ? round(price / useCount) : 0,
    priceText: money(price),
    dailyCostText: money(dailyCost),
    tomorrowDailyCostText: money(tomorrowDailyCost),
    dailyDropText: money(dailyDrop),
    costPerUseText: useCount > 0 ? money(price / useCount) : '--'
  }
}

function summarize(items, now = new Date()) {
  const calculated = items.map((item) => calculateItem(item, now))
  const totalPrice = calculated.reduce((sum, item) => sum + item.price, 0)
  const totalDailyCost = calculated.reduce((sum, item) => sum + item.dailyCost, 0)
  const activeItems = calculated.filter((item) => item.itemStatus !== 'retired')
  const activePrice = activeItems.reduce((sum, item) => sum + item.price, 0)
  const activeDailyCost = activeItems.reduce((sum, item) => sum + item.dailyCost, 0)
  const totalUseCount = calculated.reduce((sum, item) => sum + item.useCount, 0)
  const averageOwnershipDays = calculated.length
    ? calculated.reduce((sum, item) => sum + item.ownershipDays, 0) / calculated.length
    : 0

  return {
    count: calculated.length,
    activeCount: activeItems.length,
    totalPrice: round(totalPrice),
    activePrice: round(activePrice),
    totalDailyCost: round(totalDailyCost, 4),
    activeDailyCost: round(activeDailyCost, 4),
    totalUseCount,
    averageOwnershipDays: Math.round(averageOwnershipDays),
    totalPriceText: money(totalPrice),
    activePriceText: money(activePrice),
    totalDailyCostText: money(totalDailyCost),
    activeDailyCostText: money(activeDailyCost)
  }
}

module.exports = {
  calculateItem,
  money,
  round,
  summarize
}
