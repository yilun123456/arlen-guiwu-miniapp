const { CATEGORIES, ITEM_STATUSES } = require('../../utils/constants')
const { calculateItem, money, summarize } = require('../../utils/calc')
const { loadItems } = require('../../utils/storage')

Page({
  data: {
    hasItems: false,
    summary: {},
    statusCounts: [],
    categoryStats: [],
    topItems: []
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
    const summary = summarize(rawItems)
    const statusCounts = ITEM_STATUSES.map((status) => ({
      ...status,
      count: items.filter((item) => item.itemStatus === status.id).length
    }))

    const categoryStats = CATEGORIES.map((category) => {
      const categoryItems = items.filter((item) => item.category === category.id)
      const totalPrice = categoryItems.reduce((sum, item) => sum + item.price, 0)
      const totalDailyCost = categoryItems.reduce((sum, item) => sum + item.dailyCost, 0)
      return {
        ...category,
        count: categoryItems.length,
        totalPrice,
        totalPriceText: money(totalPrice),
        totalDailyCostText: money(totalDailyCost),
        percent: summary.totalPrice > 0 ? Math.max(4, Math.round(totalPrice / summary.totalPrice * 100)) : 0
      }
    }).filter((category) => category.count > 0).sort((a, b) => b.totalPrice - a.totalPrice)

    const topItems = items
      .slice()
      .sort((a, b) => b.dailyCost - a.dailyCost)
      .slice(0, 5)
      .map((item, index, list) => ({
        ...item,
        rank: index + 1,
        rankClass: index < 3 ? 'rank-number--top' : '',
        barPercent: list[0] && list[0].dailyCost > 0
          ? Math.max(8, Math.round(item.dailyCost / list[0].dailyCost * 100))
          : 0
      }))

    this.setData({
      hasItems: items.length > 0,
      summary,
      statusCounts,
      categoryStats,
      topItems
    })
  },

  addItem() {
    wx.navigateTo({ url: '/pages/add/add' })
  },

  openItem(event) {
    wx.navigateTo({ url: `/pages/detail/detail?id=${event.currentTarget.dataset.id}` })
  }
})
