// 插件系统商业化配置
export const PLUGIN_CONFIG = {
  // 插件类型
  PLUGIN_TYPES: {
    FREE: 'free',
    PREMIUM: 'premium'
  },

  // 许可证状态
  LICENSE_STATUS: {
    ACTIVE: 'active',
    TRIAL: 'trial',
    EXPIRED: 'expired',
    INVALID: 'invalid'
  },

  // 试用期配置
  TRIAL_CONFIG: {
    DURATION_DAYS: 7,
    WARNING_DAYS: 2 // 到期前2天开始提醒
  },

  // 插件分类
  PLUGIN_CATEGORIES: {
    AI_TOOLS: 'ai_tools',
    VIDEO_EDITING: 'video_editing',
    CONTENT_CREATION: 'content_creation',
    ANALYTICS: 'analytics',
    AUTOMATION: 'automation'
  },

  // 默认插件配置
  DEFAULT_PLUGINS: [
    // 免费插件
    {
      id: 'basic_ai_writer',
      name: 'AI写作助手(基础版)',
      type: 'free',
      category: 'ai_tools',
      component: 'AIWriter',
      features: ['基础文本生成', '简单润色'],
      limitations: {
        dailyUsage: 10,
        maxWords: 500
      }
    },
    {
      id: 'basic_image_tools',
      name: '图片工具(基础版)',
      type: 'free',
      category: 'content_creation',
      component: 'ImageTools',
      features: ['基础编辑', '格式转换'],
      limitations: {
        dailyUsage: 20,
        maxResolution: '1920x1080'
      }
    },
    {
      id: 'basic_video_tools',
      name: '视频工具(基础版)',
      type: 'free',
      category: 'video_editing',
      component: 'VideoTools',
      features: ['基础剪辑', '格式转换'],
      limitations: {
        dailyUsage: 5,
        maxDuration: 300 // 5分钟
      }
    },

    // 收费插件
    {
      id: 'pro_ai_writer',
      name: 'AI写作助手(专业版)',
      type: 'premium',
      category: 'ai_tools',
      component: 'AIWriter',
      price: 29.99,
      features: ['高级文本生成', '多语言支持', '专业润色', 'SEO优化'],
      limitations: {
        dailyUsage: -1, // 无限制
        maxWords: -1
      }
    },
    {
      id: 'pro_auto_editor',
      name: '智能自动剪辑(专业版)',
      type: 'premium',
      category: 'video_editing',
      component: 'AutoEditor',
      price: 49.99,
      features: ['AI自动剪辑', '智能配乐', '自动字幕', '批量处理'],
      limitations: {
        dailyUsage: -1,
        maxDuration: -1
      }
    },
    {
      id: 'pro_cover_designer',
      name: '封面设计师(专业版)',
      type: 'premium',
      category: 'content_creation',
      component: 'CoverDesigner',
      price: 19.99,
      features: ['AI封面生成', '模板库', '品牌定制', '批量导出'],
      limitations: {
        dailyUsage: -1,
        templates: -1
      }
    },
    {
      id: 'pro_hot_predictor',
      name: 'AI热点预测(专业版)',
      type: 'premium',
      category: 'analytics',
      component: 'HotPredictor',
      price: 39.99,
      features: ['深度数据分析', '趋势预测', '竞品分析', '定制报告'],
      limitations: {
        dailyUsage: -1,
        reports: -1
      }
    },
    {
      id: 'pro_batch_processor',
      name: '智能批量处理(专业版)',
      type: 'premium',
      category: 'automation',
      component: 'SmartBatchProcessor',
      price: 34.99,
      features: ['批量视频处理', '自动化工作流', '定时任务', '云端处理'],
      limitations: {
        dailyUsage: -1,
        batchSize: -1
      }
    }
  ]
};

// 插件许可证验证规则
export const LICENSE_RULES = {
  // 试用期计算
  calculateTrialExpiry: (startDate) => {
    const expiry = new Date(startDate);
    expiry.setDate(expiry.getDate() + PLUGIN_CONFIG.TRIAL_CONFIG.DURATION_DAYS);
    return expiry;
  },

  // 检查是否需要试用期警告
  shouldShowTrialWarning: (expiryDate) => {
    const now = new Date();
    const warningDate = new Date(expiryDate);
    warningDate.setDate(warningDate.getDate() - PLUGIN_CONFIG.TRIAL_CONFIG.WARNING_DAYS);
    return now >= warningDate && now < expiryDate;
  },

  // 验证许可证状态
  validateLicense: (license) => {
    if (!license) return PLUGIN_CONFIG.LICENSE_STATUS.INVALID;
    
    const now = new Date();
    const expiry = new Date(license.expiryDate);
    
    if (license.type === 'trial') {
      return now < expiry ? PLUGIN_CONFIG.LICENSE_STATUS.TRIAL : PLUGIN_CONFIG.LICENSE_STATUS.EXPIRED;
    }
    
    if (license.type === 'premium') {
      return now < expiry ? PLUGIN_CONFIG.LICENSE_STATUS.ACTIVE : PLUGIN_CONFIG.LICENSE_STATUS.EXPIRED;
    }
    
    return PLUGIN_CONFIG.LICENSE_STATUS.INVALID;
  }
};