// pages/floor/floor.js
Page({
  data: {
    libraryId: '',
    libraryName: '',
    floorId: '',
    floorName: '',
    rooms: [],
    selectedRoom: null,
    showRoomDetail: false,
    selectedSeat: null,
    showSeatDetail: false,
    selectedTime: '2小时',
    timeOptions: ['1小时', '2小时', '3小时', '4小时', '5小时', '6小时'],
    bookingLoading: false,
    isWebSocketConnected: true,
    seatSize: 60,    // 座位大小(rpx)
    seatMargin: 10,  // 座位间距(rpx)
    searchKeyword: ''
  },

  onLoad: function(options) {
    this.setData({
      libraryId: options.libraryId,
      libraryName: options.libraryName,
      floorId: options.floorId,
      floorName: options.floorName
    });
    
    // 初始化房间数据
    this.initFloorData();
  },

  onShow: function() {
    // 更新WebSocket连接状态
    const app = getApp();
    this.setData({
      isWebSocketConnected: app.globalData.socketOpen
    });
    
    // 从全局状态更新房间数据
    if (app.globalData.seatStatus[this.data.libraryId]) {
      this.updateRoomsFromGlobal(app.globalData.seatStatus[this.data.libraryId]);
    }
  },

  // 初始化房间数据
  initFloorData: function() {
    const mockRooms = this.generateMockRoomData();
    this.setData({ rooms: mockRooms });
    
    // 将模拟数据同步到全局状态
    const app = getApp();
    if (!app.globalData.seatStatus[this.data.libraryId]) {
      app.globalData.seatStatus[this.data.libraryId] = {
        id: this.data.libraryId,
        floors: {}
      };
    }
    
    app.globalData.seatStatus[this.data.libraryId].floors[this.data.floorId] = {
      id: this.data.floorId,
      rooms: mockRooms.map(room => ({
        id: room.id,
        name: room.name,
        availableSeats: room.availableSeats,
        totalSeats: room.totalSeats,
        seats: room.seats
      }))
    };
    
    wx.setStorageSync('seatStatus', app.globalData.seatStatus);
  },

  // 生成模拟房间数据
  generateMockRoomData: function() {
    return [
      {
        id: 'room101',
        name: '自习室A',
        cols: 8,  // 座位列数
        rows: 6,  // 座位行数
        availableSeats: 15,
        totalSeats: 40,
        seats: this.generateMockSeats(40)
      },
      {
        id: 'room102',
        name: '自习室B',
        cols: 7,
        rows: 5,
        availableSeats: 8,
        totalSeats: 30,
        seats: this.generateMockSeats(30)
      },
      {
        id: 'room103',
        name: '研讨室',
        cols: 6,
        rows: 3,
        availableSeats: 2,
        totalSeats: 10,
        seats: this.generateMockSeats(10)
      }
    ];
  },

  // 生成模拟座位数据
  generateMockSeats: function(count) {
    const seats = [];
    const statuses = ['available', 'occupied', 'reserved'];
    
    for (let i = 1; i <= count; i++) {
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      seats.push({
        seatId: `s${i}`,
        name: `A${i}`,
        status: randomStatus,
        statusChanged: false
      });
    }
    
    return seats;
  },

  // 从全局状态更新房间数据
  updateRoomsFromGlobal: function(libraryData) {
    if (!libraryData || !libraryData.floors) return;
    
    const localRooms = [...this.data.rooms];
    const globalFloor = libraryData.floors[this.data.floorId];
    
    if (globalFloor && globalFloor.rooms) {
      globalFloor.rooms.forEach(globalRoom => {
        const localRoomIndex = localRooms.findIndex(r => r.id === globalRoom.id);
        
        if (localRoomIndex !== -1) {
          // 更新房间可用座位数
          const availableSeats = globalRoom.seats.filter(s => s.status === 'available').length;
          localRooms[localRoomIndex].availableSeats = availableSeats;
          
          // 更新座位状态
          const localSeats = [...localRooms[localRoomIndex].seats];
          
          globalRoom.seats.forEach(globalSeat => {
            const localSeatIndex = localSeats.findIndex(s => s.seatId === globalSeat.seatId);
            
            if (localSeatIndex !== -1 && localSeats[localSeatIndex].status !== globalSeat.status) {
              // 标记状态变化，用于动画效果
              localSeats[localSeatIndex].status = globalSeat.status;
              localSeats[localSeatIndex].statusChanged = true;
              
              // 3秒后移除动画标记
              setTimeout(() => {
                localSeats[localSeatIndex].statusChanged = false;
                this.setData({
                  [`rooms[${localRoomIndex}].seats[${localSeatIndex}]`]: localSeats[localSeatIndex]
                });
              }, 1000);
            }
          });
          
          localRooms[localRoomIndex].seats = localSeats;
        }
      });
      
      this.setData({ rooms: localRooms });
    }
  },

  // 监听座位更新事件
  onSeatUpdate: function(libraryData) {
    if (libraryData.id === this.data.libraryId) {
      this.updateRoomsFromGlobal(libraryData);
      
      // 轻微提示用户
      wx.vibrateShort(); // 短震动反馈
    }
  },

  // 搜索房间
  searchRooms: function(e) {
    this.setData({ searchKeyword: e.detail.value });
  },

  // 查看房间详情
  viewRoomDetail: function(e) {
    const room = e.currentTarget.dataset.room;
    this.setData({
      showRoomDetail: true,
      selectedRoom: room
    });
  },

  // 关闭房间详情
  closeRoomDetail: function() {
    this.setData({ showRoomDetail: false });
  },

  // 选择座位
  selectSeat: function(e) {
    const seat = e.currentTarget.dataset.seat;
    
    // 只有可用座位可以选择
    if (seat.status === 'available') {
      this.setData({
        selectedSeat: seat,
        showSeatDetail: true
      });
    }
  },

  // 关闭座位详情
  closeSeatDetail: function() {
    this.setData({ showSeatDetail: false });
  },

  // 显示时间选择器
  showTimeSelector: function() {
    wx.showActionSheet({
      itemList: this.data.timeOptions,
      success: (res) => {
        this.setData({
          selectedTime: this.data.timeOptions[res.tapIndex]
        });
      }
    });
  },

  // 确认预约
  confirmReservation: function() {
    if (!this.data.selectedSeat) return;
    
    this.setData({ bookingLoading: true });
    
    const app = getApp();
    const seatId = this.data.selectedSeat.seatId;
    const duration = this.data.selectedTime;
    
    // 调用全局预约方法
    app.makeReservation(
      this.data.libraryId, 
      this.data.floorId, 
      this.data.selectedRoom.id, 
      seatId, 
      duration, 
      (success) => {
        this.setData({ bookingLoading: false, showSeatDetail: false });
        
        if (success) {
          wx.showToast({
            title: '预约成功',
            icon: 'success',
            duration: 2000
          });
          
          // 更新本地座位状态
          const rooms = [...this.data.rooms];
          const roomIndex = rooms.findIndex(r => r.id === this.data.selectedRoom.id);
          
          if (roomIndex !== -1) {
            const seats = [...rooms[roomIndex].seats];
            const seatIndex = seats.findIndex(s => s.seatId === seatId);
            
            if (seatIndex !== -1) {
              seats[seatIndex].status = 'reserved';
              rooms[roomIndex].seats = seats;
              
              // 更新可用座位数
              rooms[roomIndex].availableSeats = rooms[roomIndex].seats.filter(s => s.status === 'available').length;
              
              this.setData({ rooms });
            }
          }
        } else {
          wx.showToast({
            title: '预约失败',
            icon: 'none',
            duration: 2000
          });
        }
      }
    );
  },

  // 刷新页面
  refreshPage: function() {
    wx.showLoading({ title: '刷新中...' });
    
    // 重新加载数据
    this.initFloorData();
    
    // 从全局状态更新房间数据
    const app = getApp();
    if (app.globalData.seatStatus[this.data.libraryId]) {
      this.updateRoomsFromGlobal(app.globalData.seatStatus[this.data.libraryId]);
    }
    
    wx.hideLoading();
  }
});