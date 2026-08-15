const CATEGORIES = [
  { id: 'digital', name: '数码', emoji: '💻', color: '#5b8ff9' },
  { id: 'home', name: '家居', emoji: '🛋️', color: '#61c9a8' },
  { id: 'clothes', name: '穿搭', emoji: '👕', color: '#f48fb1' },
  { id: 'travel', name: '出行', emoji: '🚲', color: '#ff9f43' },
  { id: 'study', name: '学习', emoji: '📚', color: '#8d7cf6' },
  { id: 'sports', name: '运动', emoji: '🏸', color: '#2bb7b3' },
  { id: 'other', name: '其他', emoji: '📦', color: '#8b95a7' }
]

const ITEM_STATUSES = [
  { id: 'using', name: '使用中', shortName: '使用中', color: '#22a978' },
  { id: 'collected', name: '收藏中', shortName: '收藏中', color: '#8d6be8' },
  { id: 'retired', name: '已退役', shortName: '已退役', color: '#8b95a7' }
]

function getCategory(id) {
  return CATEGORIES.find((item) => item.id === id) || CATEGORIES[CATEGORIES.length - 1]
}

function normalizeItemStatus(item) {
  if (ITEM_STATUSES.some((status) => status.id === item.itemStatus)) return item.itemStatus
  // 兼容旧版本数据：原来的“暂停计费”迁移成“收藏中”。
  return item.billingStatus === 'paused' ? 'collected' : 'using'
}

function getItemStatus(item) {
  const id = normalizeItemStatus(item)
  return ITEM_STATUSES.find((status) => status.id === id) || ITEM_STATUSES[0]
}

module.exports = {
  CATEGORIES,
  ITEM_STATUSES,
  getCategory,
  getItemStatus,
  normalizeItemStatus
}
