const { ensureStorage } = require('./utils/storage')

App({
  onLaunch() {
    ensureStorage()
  },
  globalData: {
    appName: 'Arlen归物'
  }
})
