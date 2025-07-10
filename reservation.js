// pages/reservation/reservation.js
Page({
  data: {
    reservationInfo: null,
    isWebSocketConnected: true,
    showCancelModal: false,
    cancelReason: '',
    cancelReasons: ['座位不合适', '临时有事', '其他原因'],
    loading: false,
    showQRCode: false
  },

  onLoad: function(options) {
    // 从全局数据获取预约信息
    const app = getApp();
    this.setData({
      reservationInfo: app.globalData.reservationInfo || null,
      isWebSocketConnected: app.globalData.socketOpen
    });
    
    // 如果没有预约信息，返回首页
    if (!this.data.reservationInfo) {
      wx.showToast({
        title: '没有找到预约信息',
        icon: 'none',
        duration: 2000,
        complete: () => {
          setTimeout(() => {
            wx.navigateBack();
          }, 2000);
        }
      });
    }
  },

  onShow: function() {
    // 更新WebSocket连接状态
    const app = getApp();
    this.setData({
      isWebSocketConnected: app.globalData.socketOpen
    });
  },

  // 计算剩余时间
  calculateRemainingTime: function() {
    const reservation = this.data.reservationInfo;
    if (!reservation) return '';
    
    const endTime = new Date(reservation.endTime);
    const now = new Date();
    const diff = endTime - now;
    
    if (diff <= 0) {
      return '已过期';
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    } else {
      return `${minutes}分钟`;
    }
  },

  // 格式化日期时间
  formatDateTime: function(dateStr) {
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  },

  // 显示取消预约弹窗
  showCancelModal: function() {
    this.setData({ showCancelModal: true });
  },

  // 关闭取消预约弹窗
  closeCancelModal: function() {
    this.setData({ showCancelModal: false });
  },

  // 选择取消原因
  selectCancelReason: function(e) {
    const reason = e.currentTarget.dataset.reason;
    this.setData({ cancelReason: reason });
  },

  // 确认取消预约
  confirmCancel: function() {
    if (!this.data.cancelReason) {
      wx.showToast({
        title: '请选择取消原因',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    
    this.setData({ loading: true });
    
    const app = getApp();
    const reservationId = this.data.reservationInfo.id;
    
    // 调用全局取消预约方法
    app.cancelReservation(reservationId, (success, message) => {
      this.setData({ loading: false, showCancelModal: false });
      
      if (success) {
        wx.showToast({
          title: '取消成功',
          icon: 'success',
          duration: 2000,
          complete: () => {
            // 更新本地数据
            app.globalData.reservationInfo = null;
            wx.setStorageSync('reservationInfo', null);
            
            // 返回上一页
            setTimeout(() => {
              wx.navigateBack();
            }, 2000);
          }
        });
      } else {
        wx.showToast({
          title: '取消失败: ' + message,
          icon: 'none',
          duration: 2000
        });
      }
    });
  },

  // 签到
  checkIn: function() {
    this.setData({ loading: true });
    
    const app = getApp();
    const reservationId = this.data.reservationInfo.id;
    
    // 调用全局签到方法
    app.checkIn(reservationId, (success) => {
      this.setData({ loading: false });
      
      if (success) {
        wx.showToast({
          title: '签到成功',
          icon: 'success',
          duration: 2000,
          complete: () => {
            // 更新本地数据
            const reservation = app.globalData.reservationInfo;
            reservation.status = 'checkedIn';
            app.globalData.reservationInfo = reservation;
            wx.setStorageSync('reservationInfo', reservation);
            
            // 刷新页面
            this.setData({ reservationInfo: reservation });
          }
        });
      } else {
        wx.showToast({
          title: '签到失败',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },

  // 退座
  checkOut: function() {
    this.setData({ loading: true });
    
    const app = getApp();
    const reservationId = this.data.reservationInfo.id;
    
    // 调用全局退座方法
    app.checkOut(reservationId, (success) => {
      this.setData({ loading: false });
      
      if (success) {
        wx.showToast({
          title: '退座成功',
          icon: 'success',
          duration: 2000,
          complete: () => {
            // 更新本地数据
            const reservation = app.globalData.reservationInfo;
            reservation.status = 'completed';
            app.globalData.reservationInfo = reservation;
            wx.setStorageSync('reservationInfo', reservation);
            
            // 返回上一页
            setTimeout(() => {
              wx.navigateBack();
            }, 2000);
          }
        });
      } else {
        wx.showToast({
          title: '退座失败',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },

  // 显示二维码
  showQRCodeModal: function() {
    this.setData({ showQRCode: true });
  },

  // 关闭二维码
  closeQRCodeModal: function() {
    this.setData({ showQRCode: false });
  },

  // 刷新预约信息
  refreshReservation: function() {
    wx.showLoading({ title: '刷新中...' });
    
    // 模拟刷新，实际项目中可能需要从服务器获取最新数据
    setTimeout(() => {
      const app = getApp();
      this.setData({
        reservationInfo: app.globalData.reservationInfo,
        isWebSocketConnected: app.globalData.socketOpen
      });
      
      wx.hideLoading();
    }, 1000);
  }
});