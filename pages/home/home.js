const { loadItems, getItem, upsertItem } = require('../../utils/storage')
const { calculateItem, summarize } = require('../../utils/calc')
const { CATEGORIES, ITEM_STATUSES } = require('../../utils/constants')
const { formatDate, todayLabel } = require('../../utils/date')

const SORTS = [
  { id: 'longest', label: '持有最久' },
  { id: 'daily', label: '日均最高' },
  { id: 'price', label: '价格最高' },
  { id: 'newest', label: '最近购入' }
]

Page({
  data: {
    today: '',
    summary: {},
    items: [],
    visibleItems: [],
    statusFilters: [],
    categories: [],
    activeStatus: 'all',
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
      title: 'Arlen归物｜时间越久，每天越值',
      path: '/pages/home/home'
    }
  },

  onShareTimeline() {
    return { title: 'Arlen归物｜计算每件物品的真实日均成本' }
  },

  refresh() {
    const rawItems = loadItems()
    const items = rawItems.map((item) => calculateItem(item))
    const statusFilters = [{ id: 'all', name: '全部', count: items.length }].concat(
      ITEM_STATUSES.map((status) => ({
        ...status,
        count: items.filter((item) => item.itemStatus === status.id).length
      }))
    )
    const categories = [{ id: 'all', name: '全部分类', emoji: '', count: items.length }].concat(
      CATEGORIES.map((category) => ({
        ...category,
        count: items.filter((item) => item.category === category.id).length
      }))
    )

    this.setData({
      items,
      summary: summarize(rawItems),
      statusFilters,
      categories
    })
    this.applyFilters()
  },

  applyFilters() {
    const { items, activeStatus, activeCategory, keyword, sortIndex } = this.data
    const normalizedKeyword = keyword.trim().toLowerCase()
    const visibleItems = items.filter((item) => {
      const matchesStatus = activeStatus === 'all' || item.itemStatus === activeStatus
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory
      const searchable = `${item.name} ${item.categoryName} ${item.statusName} ${item.channel || ''} ${item.note || ''}`.toLowerCase()
      return matchesStatus && matchesCategory && (!normalizedKeyword || searchable.includes(normalizedKeyword))
    })

    const sortId = SORTS[sortIndex].id
    visibleItems.sort((a, b) => {
      if (sortId === 'daily') return b.dailyCost - a.dailyCost
      if (sortId === 'price') return b.price - a.price
      if (sortId === 'newest') return String(b.purchaseDate).localeCompare(String(a.purchaseDate))
      return b.ownershipDays - a.ownershipDays
    })

    this.setData({ visibleItems })
  },

  onSearchInput(event) {
    this.setData({ keyword: event.detail.value }, () => this.applyFilters())
  },

  clearSearch() {
    this.setData({ keyword: '' }, () => this.applyFilters())
  },

  chooseStatus(event) {
    this.setData({ activeStatus: event.currentTarget.dataset.id }, () => this.applyFilters())
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

  quickChangeStatus(event) {
    const id = event.currentTarget.dataset.id
    wx.showActionSheet({
      itemList: ITEM_STATUSES.map((status) => status.name),
      success: (result) => {
        const source = getItem(id)
        const status = ITEM_STATUSES[result.tapIndex]
        if (!source || !status) return
        source.itemStatus = status.id
        source.retiredDate = status.id === 'retired' ? formatDate(new Date()) : null
        source.updatedAt = Date.now()
        upsertItem(source)
        this.refresh()
        wx.showToast({ title: `已设为${status.name}`, icon: 'none' })
      }
    })
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
