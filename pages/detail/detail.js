const { calculateItem } = require('../../utils/calc')
const { formatDate, friendlyDate } = require('../../utils/date')
const { ITEM_STATUSES } = require('../../utils/constants')
const { getItem, removeItem, upsertItem } = require('../../utils/storage')

Page({
  data: {
    id: '',
    item: null,
    purchaseDateText: '',
    retiredDateText: ''
  },

  onLoad(options) {
    this.setData({ id: options.id || '' })
  },

  onShow() {
    this.refresh()
  },

  onShareAppMessage() {
    return {
      title: 'Arlen归物｜时间越久，每天越值',
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
      retiredDateText: item.retiredDate ? friendlyDate(item.retiredDate) : ''
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

  changeStatus() {
    wx.showActionSheet({
      itemList: ITEM_STATUSES.map((status) => status.name),
      success: (result) => {
        const source = getItem(this.data.id)
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

  editItem() {
    wx.navigateTo({ url: `/pages/add/add?id=${this.data.id}` })
  },

  deleteItem() {
    wx.showModal({
      title: '删除这件物品？',
      content: '删除后，本地记录将无法恢复。',
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
