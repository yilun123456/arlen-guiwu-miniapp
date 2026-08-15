const { CATEGORIES, ITEM_STATUSES, normalizeItemStatus } = require('../../utils/constants')
const { calculateItem } = require('../../utils/calc')
const { createId, getItem, upsertItem } = require('../../utils/storage')
const { formatDate, toDate } = require('../../utils/date')

Page({
  data: {
    editMode: false,
    itemId: '',
    today: '',
    categories: CATEGORIES,
    statuses: ITEM_STATUSES,
    preview: null,
    form: {
      name: '',
      category: 'digital',
      itemStatus: 'using',
      price: '',
      purchaseDate: '',
      channel: '',
      useCount: '0',
      note: ''
    }
  },

  onLoad(options) {
    const today = formatDate(new Date())
    const nextData = {
      today,
      'form.purchaseDate': today
    }

    if (options.id) {
      const item = getItem(options.id)
      if (item) {
        nextData.editMode = true
        nextData.itemId = item.id
        nextData.form = {
          name: item.name,
          category: item.category,
          itemStatus: normalizeItemStatus(item),
          price: String(item.price),
          purchaseDate: item.purchaseDate,
          channel: item.channel || '',
          useCount: String(item.useCount || 0),
          note: item.note || ''
        }
        wx.setNavigationBarTitle({ title: '编辑物品' })
      }
    }

    this.setData(nextData, () => this.updatePreview())
  },

  onFieldInput(event) {
    const field = event.currentTarget.dataset.field
    this.setData({ [`form.${field}`]: event.detail.value }, () => this.updatePreview())
  },

  chooseCategory(event) {
    this.setData({ 'form.category': event.currentTarget.dataset.id })
  },

  chooseStatus(event) {
    this.setData({ 'form.itemStatus': event.currentTarget.dataset.id }, () => this.updatePreview())
  },

  onDateChange(event) {
    this.setData({ 'form.purchaseDate': event.detail.value }, () => this.updatePreview())
  },

  updatePreview() {
    const form = this.data.form
    if (!form.price || Number(form.price) <= 0 || !form.purchaseDate) {
      this.setData({ preview: null })
      return
    }
    const previous = this.data.editMode ? getItem(this.data.itemId) : null
    const preview = calculateItem({
      ...form,
      retiredDate: form.itemStatus === 'retired'
        ? ((previous && previous.retiredDate) || this.data.today)
        : null
    })
    this.setData({ preview })
  },

  submit() {
    const form = this.data.form
    const name = form.name.trim()
    const price = Number(form.price)
    const useCount = Math.floor(Number(form.useCount || 0))

    if (!name) return this.toast('请填写物品名称')
    if (!Number.isFinite(price) || price <= 0) return this.toast('请输入正确的购入价格')
    if (!form.purchaseDate || toDate(form.purchaseDate) > toDate(new Date())) return this.toast('购入日期不能晚于今天')
    if (!Number.isFinite(useCount) || useCount < 0) return this.toast('使用次数不能小于 0')

    const previous = this.data.editMode ? getItem(this.data.itemId) : null
    const now = Date.now()
    const retiredDate = form.itemStatus === 'retired'
      ? ((previous && previous.itemStatus === 'retired' && previous.retiredDate) || this.data.today)
      : null
    const item = {
      ...(previous || {}),
      id: previous ? previous.id : createId(),
      name,
      category: form.category,
      itemStatus: form.itemStatus,
      price,
      purchaseDate: form.purchaseDate,
      retiredDate: retiredDate
        ? (toDate(retiredDate) >= toDate(form.purchaseDate) ? retiredDate : this.data.today)
        : null,
      channel: form.channel.trim(),
      useCount,
      note: form.note.trim(),
      createdAt: previous ? previous.createdAt : now,
      updatedAt: now
    }

    // 删除旧版寿命折旧字段，保存后数据即完成迁移。
    delete item.lifeMonths
    delete item.residualValue
    delete item.billingStatus
    delete item.pausedAt
    delete item.pausedDays

    upsertItem(item)
    wx.showToast({ title: this.data.editMode ? '修改已保存' : '物品已添加', icon: 'success' })
    setTimeout(() => wx.navigateBack(), 500)
  },

  toast(title) {
    wx.showToast({ title, icon: 'none' })
  }
})
