const { DAY_MS, daysBetween, toDate } = require('./date')
const { getCategory } = require('./constants')

function round(value, digits = 2) {
  const factor = 10 ** digits
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor
}

function money(value) {
  const amount = Number(value) || 0
  if (Math.abs(amount) >= 10000) return `${round(amount / 10000, 2)}万`
  return amount.toFixed(2)
}

function getPausedDays(item, now) {
  const stored = Math.max(0, Number(item.pausedDays) || 0)
  if (item.billingStatus !== 'paused' || !item.pausedAt) return stored
  const currentPause = Math.max(0, Math.floor((toDate(now).getTime() - toDate(item.pausedAt).getTime()) / DAY_MS))
  return stored + currentPause
}

function calculateItem(item, now = new Date()) {
  const price = Math.max(0, Number(item.price) || 0)
  const residualValue = Math.min(price, Math.max(0, Number(item.residualValue) || 0))
  const lifeMonths = Math.max(1, Number(item.lifeMonths) || 36)
  const lifeDays = Math.max(1, Math.round(lifeMonths * 365 / 12))
  const calendarDays = daysBetween(item.purchaseDate, now) + 1
  const pausedDays = getPausedDays(item, now)
  const billableDays = Math.max(0, calendarDays - pausedDays)
  const depreciable = Math.max(0, price - residualValue)
  const dailyCost = depreciable / lifeDays
  const accumulatedCost = Math.min(depreciable, dailyCost * billableDays)
  const currentValue = Math.max(residualValue, price - accumulatedCost)
  const useCount = Math.max(0, Number(item.useCount) || 0)
  const progress = Math.min(100, Math.round((billableDays / lifeDays) * 100))
  const category = getCategory(item.category)

  return {
    ...item,
    price,
    residualValue,
    lifeMonths,
    useCount,
    categoryName: category.name,
    emoji: category.emoji,
    categoryColor: category.color,
    lifeDays,
    calendarDays,
    billableDays,
    dailyCost: round(dailyCost, 4),
    accumulatedCost: round(accumulatedCost),
    currentValue: round(currentValue),
    costPerUse: useCount > 0 ? round(accumulatedCost / useCount) : 0,
    progress,
    priceText: money(price),
    dailyCostText: money(dailyCost),
    accumulatedCostText: money(accumulatedCost),
    currentValueText: money(currentValue),
    costPerUseText: useCount > 0 ? money(accumulatedCost / useCount) : '--'
  }
}

function summarize(items, now = new Date()) {
  const calculated = items.map((item) => calculateItem(item, now))
  const totalPrice = calculated.reduce((sum, item) => sum + item.price, 0)
  const currentValue = calculated.reduce((sum, item) => sum + item.currentValue, 0)
  const accumulatedCost = calculated.reduce((sum, item) => sum + item.accumulatedCost, 0)
  const todayCost = calculated
    .filter((item) => item.billingStatus !== 'paused' && item.progress < 100)
    .reduce((sum, item) => sum + item.dailyCost, 0)

  return {
    count: calculated.length,
    totalPrice: round(totalPrice),
    currentValue: round(currentValue),
    accumulatedCost: round(accumulatedCost),
    todayCost: round(todayCost, 4),
    monthlyCost: round(todayCost * 30),
    yearlyCost: round(todayCost * 365),
    totalPriceText: money(totalPrice),
    currentValueText: money(currentValue),
    accumulatedCostText: money(accumulatedCost),
    todayCostText: money(todayCost),
    monthlyCostText: money(todayCost * 30),
    yearlyCostText: money(todayCost * 365)
  }
}

module.exports = {
  calculateItem,
  money,
  round,
  summarize
}
