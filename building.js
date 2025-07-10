// pages/building/building.js
Page({
  data: {
    libraryId: '',
    libraryName: '',
    floors: [],
    isWebSocketConnected: true,
    showFloorDetail: false,
    selectedFloor: null,
    searchKeyword: ''
  },

  onLoad: function(options) {
    this.setData({
      libraryId: options.libraryId,
      libraryName: options.libraryName
    });
    
    // 初始化楼层数据
    this.initFloorData();
  },

  onShow: function() {
    // 更新WebSocket连接状态
    const app = getApp();
    this.setData({
      isWebSocketConnected: app.globalData.socketOpen
    });
    
    // 从全局状态更新楼层数据
    if (app.globalData.seatStatus[this.data.libraryId]) {
      this.updateFloorsFromGlobal(app.globalData.seatStatus[this.data.libraryId]);
    }
  },

  // 初始化楼层数据（模拟）
  initFloorData: function() {
    const mockFloors = this.generateMockFloorData();
    this.setData({ floors: mockFloors });
  },

  // 生成模拟楼层数据
  generateMockFloorData: function() {
    return [
      {
        id: 'floor1',
        name: '一楼',
        availableCount: 25,
        totalCount: 100,
        rooms: [
          { id: 'room101', name: '自习室A', availableSeats: 15, totalSeats: 40 },
          { id: 'room102', name: '自习室B', availableSeats: 8, totalSeats: 30 },
          { id: 'room103', name: '研讨室', availableSeats: 2, totalSeats: 10 }
        ],
        layout: 'grid', // 布局类型：grid(网格) 或 list(列表)
        seatMapUrl: 'http://lib.zjczxy.cn/tsgzn/tsgbj.htm' // 楼层座位图URL
      },
      {
        id: 'floor2',
        name: '二楼',
        availableCount: 32,
        totalCount: 120,
        rooms: [
          { id: 'room201', name: '自习室C', availableSeats: 22, totalSeats: 60 },
          { id: 'room202', name: '自习室D', availableSeats: 10, totalSeats: 40 },
          { id: 'room203', name: '电子阅览室', availableSeats: 0, totalSeats: 20 }
        ],
        layout: 'grid',
        seatMapUrl: 'http://lib.zjczxy.cn/tsgzn/tsgbj.htm'
      },
      {
        id: 'floor3',
        name: '三楼',
        availableCount: 18,
        totalCount: 80,
        rooms: [
          { id: 'room301', name: '自习室E', availableSeats: 15, totalSeats: 50 },
          { id: 'room302', name: '多媒体室', availableSeats: 3, totalSeats: 30 }
        ],
        layout: 'list',
        seatMapUrl: 'http://lib.zjczxy.cn/tsgzn/tsgbj.htm'
      },
      {
        id: 'floor4',
        name: '四楼',
        availableCount: 42,
        totalCount: 150,
        rooms: [
          { id: 'room401', name: '自习室F', availableSeats: 28, totalSeats: 80 },
          { id: 'room402', name: '自习室G', availableSeats: 14, totalSeats: 70 }
        ],
        layout: 'grid',
        seatMapUrl: 'http://lib.zjczxy.cn/tsgzn/tsgbj.htm'
      }
    ];
  },

  // 从全局状态更新楼层数据
  updateFloorsFromGlobal: function(libraryData) {
    if (!libraryData || !libraryData.floors) return;
    
    const localFloors = [...this.data.floors];
    
    // 更新每个楼层的座位状态
    Object.keys(libraryData.floors).forEach(floorId => {
      const globalFloor = libraryData.floors[floorId];
      const localFloorIndex = localFloors.findIndex(f => f.id === floorId);
      
      if (localFloorIndex !== -1) {
        // 计算可用座位数
        let availableCount = 0;
        let totalCount = 0;
        
        if (globalFloor.rooms) {
          globalFloor.rooms.forEach(room => {
            const roomAvailable = room.seats.filter(s => s.status === 'available').length;
            availableCount += roomAvailable;
            totalCount += room.seats.length;
          });
        }
        
        // 更新楼层信息
        localFloors[localFloorIndex].availableCount = availableCount;
        localFloors[localFloorIndex].totalCount = totalCount;
        
        // 更新房间信息
        if (globalFloor.rooms && localFloors[localFloorIndex].rooms) {
          globalFloor.rooms.forEach(globalRoom => {
            const localRoomIndex = localFloors[localFloorIndex].rooms.findIndex(r => r.id === globalRoom.id);
            
            if (localRoomIndex !== -1) {
              const roomAvailable = globalRoom.seats.filter(s => s.status === 'available').length;
              localFloors[localFloorIndex].rooms[localRoomIndex].availableSeats = roomAvailable;
            }
          });
        }
      }
    });
    
    this.setData({ floors: localFloors });
  },

  // 监听座位更新事件
  onSeatUpdate: function(libraryData) {
    if (libraryData.id === this.data.libraryId) {
      this.updateFloorsFromGlobal(libraryData);
      
      // 轻微提示用户
      wx.vibrateShort(); // 短震动反馈
    }
  },

  // 搜索楼层
  searchFloors: function(e) {
    this.setData({ searchKeyword: e.detail.value });
  },

  // 查看楼层详情
  viewFloorDetail: function(e) {
    const floor = e.currentTarget.dataset.floor;
    this.setData({
      showFloorDetail: true,
      selectedFloor: floor
    });
  },

  // 关闭楼层详情
  closeFloorDetail: function() {
    this.setData({ showFloorDetail: false });
  },

  // 前往楼层座位页
  goToFloor: function(e) {
    const floor = e.currentTarget.dataset.floor;
    wx.navigateTo({
      url: `/pages/floor/floor?libraryId=${this.data.libraryId}&libraryName=${this.data.libraryName}&floorId=${floor.id}&floorName=${floor.name}`
    });
  },

  // 刷新页面
  refreshPage: function() {
    wx.showLoading({ title: '刷新中...' });
    
    // 重新加载数据
    this.initFloorData();
    
    // 从全局状态更新楼层数据
    const app = getApp();
    if (app.globalData.seatStatus[this.data.libraryId]) {
      this.updateFloorsFromGlobal(app.globalData.seatStatus[this.data.libraryId]);
    }
    
    wx.hideLoading();
  }
});