const { CATEGORIES } = require('../../utils/constants')
const { calculateItem } = require('../../utils/calc')
const { createId, getItem, upsertItem } = require('../../utils/storage')
const { formatDate, toDate } = require('../../utils/date')

const LIFE_OPTIONS = [12, 24, 36, 60]

Page({
  data: {
    editMode: false,
    itemId: '',
    today: '',
    categories: CATEGORIES,
    lifeOptions: LIFE_OPTIONS,
    preview: null,
    form: {
      name: '',
      category: 'digital',
      price: '',
      purchaseDate: '',
      lifeMonths: 36,
      residualValue: '0',
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
          price: String(item.price),
          purchaseDate: item.purchaseDate,
          lifeMonths: Number(item.lifeMonths),
          residualValue: String(item.residualValue || 0),
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

  chooseLife(event) {
    this.setData({ 'form.lifeMonths': Number(event.currentTarget.dataset.months) }, () => this.updatePreview())
  },

  onLifeInput(event) {
    this.setData({ 'form.lifeMonths': event.detail.value }, () => this.updatePreview())
  },

  onDateChange(event) {
    this.setData({ 'form.purchaseDate': event.detail.value }, () => this.updatePreview())
  },

  updatePreview() {
    const form = this.data.form
    if (!form.price || Number(form.price) <= 0 || !form.lifeMonths) {
      this.setData({ preview: null })
      return
    }
    const preview = calculateItem({
      ...form,
      billingStatus: 'active',
      pausedDays: 0
    })
    this.setData({ preview })
  },

  submit() {
    const form = this.data.form
    const name = form.name.trim()
    const price = Number(form.price)
    const lifeMonths = Number(form.lifeMonths)
    const residualValue = Number(form.residualValue || 0)
    const useCount = Math.floor(Number(form.useCount || 0))

    if (!name) return this.toast('请填写物品名称')
    if (!Number.isFinite(price) || price <= 0) return this.toast('请输入正确的购入价格')
    if (!form.purchaseDate || toDate(form.purchaseDate) > toDate(new Date())) return this.toast('购入日期不能晚于今天')
    if (!Number.isFinite(lifeMonths) || lifeMonths < 1 || lifeMonths > 600) return this.toast('使用寿命应为 1～600 个月')
    if (!Number.isFinite(residualValue) || residualValue < 0 || residualValue > price) return this.toast('预计残值需在 0 和购入价之间')
    if (!Number.isFinite(useCount) || useCount < 0) return this.toast('使用次数不能小于 0')

    const previous = this.data.editMode ? getItem(this.data.itemId) : null
    const now = Date.now()
    const item = {
      ...(previous || {}),
      id: previous ? previous.id : createId(),
      name,
      category: form.category,
      price,
      purchaseDate: form.purchaseDate,
      lifeMonths,
      residualValue,
      useCount,
      note: form.note.trim(),
      billingStatus: previous ? previous.billingStatus : 'active',
      pausedAt: previous ? previous.pausedAt : null,
      pausedDays: previous ? previous.pausedDays : 0,
      createdAt: previous ? previous.createdAt : now,
      updatedAt: now
    }

    upsertItem(item)
    wx.showToast({ title: this.data.editMode ? '修改已保存' : '物品已添加', icon: 'success' })
    setTimeout(() => wx.navigateBack(), 500)
  },

  toast(title) {
    wx.showToast({ title, icon: 'none' })
  }
})
