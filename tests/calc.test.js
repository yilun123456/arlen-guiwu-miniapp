const assert = require('assert')
const { calculateItem, summarize } = require('../utils/calc')

function item(overrides = {}) {
  return {
    price: 116,
    purchaseDate: '2026-08-15',
    category: 'other',
    itemStatus: 'using',
    ...overrides
  }
}

assert.strictEqual(calculateItem(item(), new Date('2026-08-15T12:00:00')).dailyCost, 116)
assert.strictEqual(calculateItem(item(), new Date('2026-08-16T12:00:00')).dailyCost, 58)
assert.strictEqual(calculateItem(item(), new Date('2026-08-17T12:00:00')).dailyCost, 38.6667)

const retired = calculateItem(item({
  itemStatus: 'retired',
  retiredDate: '2026-08-16'
}), new Date('2026-08-20T12:00:00'))
assert.strictEqual(retired.ownershipDays, 2)
assert.strictEqual(retired.dailyCost, 58)

const legacy = calculateItem(item({
  price: 90,
  billingStatus: 'paused',
  itemStatus: undefined
}), new Date('2026-08-17T12:00:00'))
assert.strictEqual(legacy.itemStatus, 'collected')
assert.strictEqual(legacy.dailyCost, 30)

const summary = summarize([item()], new Date('2026-08-16T12:00:00'))
assert.strictEqual(summary.totalDailyCost, 58)

console.log('Formula passed: 116.00 -> 58.00 -> 38.67')
console.log('Legacy, retired-item and summary checks passed')
