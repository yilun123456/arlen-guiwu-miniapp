const STORAGE_KEY = 'wupin_billing_items_v1'

function ensureStorage() {
  const value = wx.getStorageSync(STORAGE_KEY)
  if (!Array.isArray(value)) wx.setStorageSync(STORAGE_KEY, [])
}

function loadItems() {
  const value = wx.getStorageSync(STORAGE_KEY)
  return Array.isArray(value) ? value : []
}

function saveItems(items) {
  wx.setStorageSync(STORAGE_KEY, items)
}

function getItem(id) {
  return loadItems().find((item) => item.id === id)
}

function upsertItem(nextItem) {
  const items = loadItems()
  const index = items.findIndex((item) => item.id === nextItem.id)
  if (index >= 0) {
    items[index] = nextItem
  } else {
    items.unshift(nextItem)
  }
  saveItems(items)
  return nextItem
}

function removeItem(id) {
  const items = loadItems().filter((item) => item.id !== id)
  saveItems(items)
}

function createId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

module.exports = {
  STORAGE_KEY,
  createId,
  ensureStorage,
  getItem,
  loadItems,
  removeItem,
  saveItems,
  upsertItem
}
