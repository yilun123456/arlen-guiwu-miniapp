const CATEGORIES = [
  { id: 'digital', name: '数码', emoji: '💻', color: '#5b8ff9' },
  { id: 'home', name: '家居', emoji: '🛋️', color: '#61c9a8' },
  { id: 'clothes', name: '穿搭', emoji: '👕', color: '#f48fb1' },
  { id: 'travel', name: '出行', emoji: '🚲', color: '#ff9f43' },
  { id: 'study', name: '学习', emoji: '📚', color: '#8d7cf6' },
  { id: 'sports', name: '运动', emoji: '🏸', color: '#2bb7b3' },
  { id: 'other', name: '其他', emoji: '📦', color: '#8b95a7' }
]

function getCategory(id) {
  return CATEGORIES.find((item) => item.id === id) || CATEGORIES[CATEGORIES.length - 1]
}

module.exports = {
  CATEGORIES,
  getCategory
}
