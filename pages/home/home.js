const { loadItems } = require('../../utils/storage')
const { calculateItem, summarize } = require('../../utils/calc')
const { CATEGORIES } = require('../../utils/constants')
const { todayLabel } = require('../../utils/date')

const SORTS = [
  { id: 'newest', label: '最近购入' },
  { id: 'daily', label: '日均成本' },
  { id: 'value', label: '当前价值' }
]

Page({
  data: {
    today: '',
    summary: {},
    items: [],
    visibleItems: [],
    categories: [{ id: 'all', name: '全部' }].concat(CATEGORIES),
    activeCategory: 'all',
    keyword: '',
    sortIndex: 0,
    sortLabel: SORTS[0].label
  },

  onLoad() {
    this.setData({ today: todayLabel() })
  },

  onShow() {
    this.refresh()
  },

  onPullDownRefresh() {
    this.refresh()
    wx.stopPullDownRefresh()
  },

  onShareAppMessage() {
    return {
      title: 'Arlen归物｜看见每件物品的真实成本',
      path: '/pages/home/home'
    }
  },

  onShareTimeline() {
    return {
      title: 'Arlen归物｜记录物品，了解每日成本'
    }
  },

  refresh() {
    const rawItems = loadItems()
    const items = rawItems.map((item) => calculateItem(item))
    this.setData({
      items,
      summary: summarize(rawItems)
    })
    this.applyFilters()
  },

  applyFilters() {
    const { items, activeCategory, keyword, sortIndex } = this.data
    const normalizedKeyword = keyword.trim().toLowerCase()
    const visibleItems = items.filter((item) => {
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory
      const searchable = `${item.name} ${item.categoryName} ${item.note || ''}`.toLowerCase()
      return matchesCategory && (!normalizedKeyword || searchable.includes(normalizedKeyword))
    })

    const sortId = SORTS[sortIndex].id
    visibleItems.sort((a, b) => {
      if (sortId === 'daily') return b.dailyCost - a.dailyCost
      if (sortId === 'value') return b.currentValue - a.currentValue
      return String(b.purchaseDate).localeCompare(String(a.purchaseDate))
    })

    this.setData({ visibleItems })
  },

  onSearchInput(event) {
    this.setData({ keyword: event.detail.value }, () => this.applyFilters())
  },

  clearSearch() {
    this.setData({ keyword: '' }, () => this.applyFilters())
  },

  chooseCategory(event) {
    this.setData({ activeCategory: event.currentTarget.dataset.id }, () => this.applyFilters())
  },

  changeSort() {
    const sortIndex = (this.data.sortIndex + 1) % SORTS.length
    this.setData({
      sortIndex,
      sortLabel: SORTS[sortIndex].label
    }, () => this.applyFilters())
  },

  openItem(event) {
    wx.navigateTo({ url: `/pages/detail/detail?id=${event.currentTarget.dataset.id}` })
  },

  addItem() {
    wx.navigateTo({ url: '/pages/add/add' })
  },

  openStats() {
    wx.switchTab({ url: '/pages/stats/stats' })
  }
})
