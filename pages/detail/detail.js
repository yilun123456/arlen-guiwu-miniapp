const { calculateItem } = require('../../utils/calc')
const { daysBetween, formatDate, friendlyDate, toDate } = require('../../utils/date')
const { getItem, removeItem, upsertItem } = require('../../utils/storage')

function getExpectedEnd(purchaseDate, lifeMonths) {
  const start = toDate(purchaseDate)
  const end = new Date(start.getFullYear(), start.getMonth() + Number(lifeMonths), start.getDate())
  return friendlyDate(end)
}

Page({
  data: {
    id: '',
    item: null,
    purchaseDateText: '',
    expectedEndText: ''
  },

  onLoad(options) {
    this.setData({ id: options.id || '' })
  },

  onShow() {
    this.refresh()
  },

  onShareAppMessage() {
    return {
      title: 'Arlen归物｜看见每件物品的真实成本',
      path: '/pages/home/home'
    }
  },

  refresh() {
    const source = getItem(this.data.id)
    if (!source) {
      wx.showToast({ title: '物品不存在', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 500)
      return
    }

    const item = calculateItem(source)
    this.setData({
      item,
      purchaseDateText: friendlyDate(item.purchaseDate),
      expectedEndText: getExpectedEnd(item.purchaseDate, item.lifeMonths)
    })
    wx.setNavigationBarTitle({ title: item.name })
  },

  recordUse() {
    const source = getItem(this.data.id)
    if (!source) return
    source.useCount = (Number(source.useCount) || 0) + 1
    source.updatedAt = Date.now()
    upsertItem(source)
    this.refresh()
    wx.showToast({ title: '已记录一次使用', icon: 'success' })
  },

  toggleBilling() {
    const source = getItem(this.data.id)
    if (!source) return
    const today = formatDate(new Date())

    if (source.billingStatus === 'paused') {
      source.pausedDays = (Number(source.pausedDays) || 0) + daysBetween(source.pausedAt, today)
      source.pausedAt = null
      source.billingStatus = 'active'
    } else {
      source.pausedAt = today
      source.billingStatus = 'paused'
    }

    source.updatedAt = Date.now()
    upsertItem(source)
    this.refresh()
    wx.showToast({ title: source.billingStatus === 'paused' ? '计费已暂停' : '已恢复计费', icon: 'none' })
  },

  editItem() {
    wx.navigateTo({ url: `/pages/add/add?id=${this.data.id}` })
  },

  deleteItem() {
    wx.showModal({
      title: '删除这件物品？',
      content: '删除后，本地计费记录将无法恢复。',
      confirmText: '删除',
      confirmColor: '#e84d5b',
      success: (result) => {
        if (!result.confirm) return
        removeItem(this.data.id)
        wx.showToast({ title: '已删除', icon: 'success' })
        setTimeout(() => wx.navigateBack(), 500)
      }
    })
  }
})
