Page({
  data: {
    libraries: [
      { id: 'lib1', name: '主图书馆', availableSeats: 35, totalSeats: 150, availabilityRate: 23 },
      { id: 'lib2', name: '工科图书馆', availableSeats: 12, totalSeats: 80, availabilityRate: 15 },
      { id: 'lib3', name: '文科图书馆', availableSeats: 47, totalSeats: 200, availabilityRate: 24 },
      { id: 'lib4', name: '医学图书馆', availableSeats: 8, totalSeats: 60, availabilityRate: 13 }
    ],
    isWebSocketConnected: true,
    lastUpdateTime: new Date().toLocaleTimeString()
  },

  onLoad() {
    // 模拟初始化加载
    setTimeout(() => {
      this.updateLibrariesFromGlobal();
    }, 500);
  },

  onShow() {
    // 从全局状态获取最新数据（模拟实时更新）
    const app = getApp();
    this.setData({
      isWebSocketConnected: app.globalData.socketOpen
    });
    
    // 触发一次数据更新
    this.updateLibrariesFromGlobal();
  },

  // 从全局状态更新图书馆数据（模拟）
  updateLibrariesFromGlobal() {
    // 模拟从全局状态获取数据
    const app = getApp();
    const mockSeatStatus = app.globalData.seatStatus || {};
    
    // 模拟更新座位数据（实际项目中应从WebSocket或API获取）
    const libraries = [...this.data.libraries];
    
    libraries.forEach(library => {
      // 模拟随机更新可用座位数
      if (Math.random() > 0.7) {
        const change = Math.floor(Math.random() * 5) - 2; // -2 到 +2 的随机变化
        const newAvailable = Math.max(0, Math.min(library.totalSeats, library.availableSeats + change));
        
        library.availableSeats = newAvailable;
        library.availabilityRate = Math.round((newAvailable / library.totalSeats) * 100);
      }
    });
    
    this.setData({
      libraries,
      lastUpdateTime: new Date().toLocaleTimeString()
    });
  },

  // 监听座位更新事件（模拟）
  onSeatUpdate() {
    this.updateLibrariesFromGlobal();
    
    // 显示更新提示
    wx.showToast({
      title: '座位状态已更新',
      icon: 'none',
      duration: 1000
    });
  },

  // 跳转到图书馆详情页
  navigateToLibrary(e) {
    const library = e.currentTarget.dataset.library;
    wx.navigateTo({
      url: `/pages/building/building?libraryId=${library.id}&libraryName=${library.name}`
    });
  }
});