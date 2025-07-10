// pages/feedback/feedback.js
Page({
  data: {
    // 反馈表单数据
    feedbackType: '',       // 反馈类型
    feedbackContent: '',    // 反馈内容
    contactInfo: '',        // 联系方式
    images: [],             // 上传的图片
    maxImages: 3,           // 最大上传图片数
    submitting: false,      // 是否正在提交
    
    // 反馈类型选项
    typeOptions: [
      { id: 'system', name: '系统问题' },
      { id: 'seat', name: '座位问题' },
      { id: 'facility', name: '设施问题' },
      { id: 'suggestion', name: '功能建议' },
      { id: 'other', name: '其他问题' }
    ],
    
    // 反馈历史
    feedbackHistory: [],
    showHistory: false,     // 是否显示历史列表
    loading: false
  },

  onLoad: function() {
    // 加载反馈历史
    this.loadFeedbackHistory();
  },

  // 选择反馈类型
  selectType: function(e) {
    this.setData({
      feedbackType: e.currentTarget.dataset.type
    });
  },

  // 输入反馈内容
  inputContent: function(e) {
    this.setData({
      feedbackContent: e.detail.value
    });
  },

  // 输入联系方式
  inputContact: function(e) {
    this.setData({
      contactInfo: e.detail.value
    });
  },

  // 选择图片
  chooseImage: function() {
    const remaining = this.data.maxImages - this.data.images.length;
    if (remaining <= 0) {
      wx.showToast({
        title: '最多上传3张图片',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    wx.chooseImage({
      count: remaining,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        // 临时图片路径
        const tempFilePaths = res.tempFilePaths;
        this.setData({
          images: [...this.data.images, ...tempFilePaths]
        });
      }
    });
  },

  // 删除图片
  deleteImage: function(e) {
    const index = e.currentTarget.dataset.index;
    const images = [...this.data.images];
    images.splice(index, 1);
    this.setData({ images });
  },

  // 提交反馈
  submitFeedback: function() {
    // 表单验证
    if (!this.data.feedbackType) {
      wx.showToast({
        title: '请选择反馈类型',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    if (!this.data.feedbackContent.trim()) {
      wx.showToast({
        title: '请输入反馈内容',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    this.setData({ submitting: true });

    // 模拟提交（实际项目中替换为API请求）
    setTimeout(() => {
      // 生成反馈ID
      const feedbackId = 'FB' + Date.now();
      
      // 构造反馈数据
      const feedbackData = {
        id: feedbackId,
        type: this.data.feedbackType,
        typeName: this.data.typeOptions.find(item => item.id === this.data.feedbackType)?.name || '',
        content: this.data.feedbackContent,
        contact: this.data.contactInfo || '未提供',
        images: this.data.images, // 实际项目中应上传图片并保存URL
        status: 'pending', // 状态：pending(处理中)/processed(已处理)
        createTime: new Date().toISOString(),
        processTime: null,
        reply: null
      };

      // 保存到历史记录
      let history = wx.getStorageSync('feedbackHistory') || [];
      history.unshift(feedbackData); // 最新的在前面
      wx.setStorageSync('feedbackHistory', history);

      // 更新页面数据
      this.setData({
        feedbackType: '',
        feedbackContent: '',
        contactInfo: '',
        images: [],
        submitting: false,
        feedbackHistory: history
      });

      // 提交成功提示
      wx.showModal({
        title: '提交成功',
        content: '感谢您的反馈，我们会尽快处理',
        showCancel: false,
        confirmText: '确定'
      });
    }, 1500);
  },

  // 加载反馈历史
  loadFeedbackHistory: function() {
    this.setData({ loading: true });

    // 模拟加载（实际项目中替换为API请求）
    setTimeout(() => {
      const history = wx.getStorageSync('feedbackHistory') || this.generateMockHistory();
      this.setData({
        feedbackHistory: history,
        loading: false
      });
    }, 800);
  },

  // 生成模拟反馈历史（仅用于测试）
  generateMockHistory: function() {
    const mockHistory = [
      {
        id: 'FB1628888888888',
        type: 'seat',
        typeName: '座位问题',
        content: '自习室A区的座位有损坏，希望尽快维修',
        contact: '13800138000',
        images: [],
        status: 'processed',
        createTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3天前
        processTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2天前
        reply: '已安排维修，感谢您的反馈'
      },
      {
        id: 'FB1628777777777',
        type: 'suggestion',
        typeName: '功能建议',
        content: '希望增加座位预约提醒功能',
        contact: 'example@mail.com',
        images: [],
        status: 'pending',
        createTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(), // 1天前
        processTime: null,
        reply: null
      }
    ];

    wx.setStorageSync('feedbackHistory', mockHistory);
    return mockHistory;
  },

  // 切换历史列表显示
  toggleHistory: function() {
    this.setData({
      showHistory: !this.data.showHistory
    });
  },

  // 格式化日期时间
  formatDateTime: function(isoString) {
    const date = new Date(isoString);
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }
});