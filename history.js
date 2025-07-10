// pages/history/history.js
Page({
  data: {
    historyList: [],        // 所有预约历史
    filteredList: [],       // 筛选后的历史
    statusFilter: 'all',    // 状态筛选：all/active/completed/canceled
    dateFilter: 'all',      // 日期筛选：all/today/week/month
    loading: false,
    isWebSocketConnected: true,
    showDetail: false,      // 是否显示详情弹窗
    currentRecord: null     // 当前查看的记录
  },

  onLoad: function() {
    // 初始化历史数据
    this.loadHistoryData();
  },

  onShow: function() {
    // 更新WebSocket连接状态
    const app = getApp();
    this.setData({
      isWebSocketConnected: app.globalData.socketOpen
    });

    // 重新加载数据（确保显示最新状态）
    this.loadHistoryData();
  },

  // 加载历史数据（模拟从本地存储/服务器获取）
  loadHistoryData: function() {
    this.setData({ loading: true });

    // 模拟网络请求延迟
    setTimeout(() => {
      // 从本地存储获取历史记录（实际项目中可替换为API请求）
      const localHistory = wx.getStorageSync('reservationHistory') || this.generateMockHistory();
      
      // 按时间倒序排序（最新的在前）
      const sortedHistory = localHistory.sort((a, b) => {
        return new Date(b.startTime) - new Date(a.startTime);
      });

      this.setData({
        historyList: sortedHistory,
        filteredList: sortedHistory,  // 初始显示全部
        loading: false
      });

      // 应用筛选条件
      this.filterHistory();
    }, 800);
  },

  // 生成模拟历史数据（实际项目中无需此方法，由接口返回）
  generateMockHistory: function() {
    const statuses = ['completed', 'canceled', 'active', 'expired'];
    const libraries = ['主图书馆', '工科图书馆', '文科图书馆', '医学图书馆'];
    const history = [];

    // 生成10条模拟历史记录
    for (let i = 0; i < 10; i++) {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const randomDay = Math.floor(Math.random() * 30); // 30天内的随机日期
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - randomDay);

      const endDate = new Date(startDate);
      endDate.setHours(endDate.getHours() + Math.floor(Math.random() * 6) + 1); // 1-6小时

      history.push({
        id: `RES${Date.now() - i * 10000}`, // 唯一ID
        libraryName: libraries[Math.floor(Math.random() * libraries.length)],
        floorName: `第${Math.floor(Math.random() * 4) + 1}楼`,
        roomName: `自习室${String.fromCharCode(65 + Math.floor(Math.random() * 5))}`, // A-E
        seatName: `A${Math.floor(Math.random() * 30) + 1}`,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        status: status,
        checkInTime: status === 'completed' ? new Date(startDate.getTime() + 1000 * 60 * 10).toISOString() : null, // 开始后10分钟签到
        checkOutTime: status === 'completed' ? endDate.toISOString() : null,
        cancelReason: status === 'canceled' ? ['临时有事', '座位不合适', '其他原因'][Math.floor(Math.random() * 3)] : null
      });
    }

    // 保存到本地存储（模拟持久化）
    wx.setStorageSync('reservationHistory', history);
    return history;
  },

  // 筛选历史记录
  filterHistory: function() {
    const { historyList, statusFilter, dateFilter } = this.data;
    let filtered = [...historyList];

    // 按状态筛选
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    // 按日期筛选
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // 今天0点
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7); // 7天前
      const monthAgo = new Date(today);
      monthAgo.setMonth(today.getMonth() - 1); // 1个月前

      filtered = filtered.filter(item => {
        const itemDate = new Date(item.startTime);
        switch (dateFilter) {
          case 'today':
            return itemDate >= today; // 今天及之后（实际为今天）
          case 'week':
            return itemDate >= weekAgo && itemDate < today; // 本周内（不含今天）
          case 'month':
            return itemDate >= monthAgo && itemDate < weekAgo; // 本月内（不含本周）
          default:
            return true;
        }
      });
    }

    this.setData({ filteredList: filtered });
  },

  // 切换状态筛选
  changeStatusFilter: function(e) {
    const status = e.currentTarget.dataset.status;
    this.setData({ statusFilter: status }, () => {
      this.filterHistory();
    });
  },

  // 切换日期筛选
  changeDateFilter: function(e) {
    const date = e.currentTarget.dataset.date;
    this.setData({ dateFilter: date }, () => {
      this.filterHistory();
    });
  },

  // 查看历史详情
  viewDetail: function(e) {
    const record = e.currentTarget.dataset.record;
    this.setData({
      showDetail: true,
      currentRecord: record
    });
  },

  // 关闭详情弹窗
  closeDetail: function() {
    this.setData({ showDetail: false });
  },

  // 格式化日期时间（显示为"YYYY-MM-DD HH:MM"）
  formatDateTime: function(isoString) {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  },

  // 刷新数据
  refreshHistory: function() {
    this.loadHistoryData();
  }
});