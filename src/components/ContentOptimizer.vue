<template>
  <div class="content-optimizer">
    <h2>爆款内容优化器</h2>
    <p>输入您的基础文案，选择目标平台，AI将为您生成针对性优化建议和爆款文案。</p>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="爆款生成" name="generator">
        <el-form label-width="120px">
          <el-form-item label="基础文案">
            <el-input v-model="baseText" type="textarea" :rows="8" placeholder="请在此处输入您的核心内容或想法..."></el-input>
          </el-form-item>
          <el-form-item label="目标平台">
            <el-checkbox-group v-model="targetPlatforms">
              <el-checkbox label="xiaohongshu">小红书</el-checkbox>
              <el-checkbox label="douyin">抖音</el-checkbox>
              <el-checkbox label="bilibili">B站</el-checkbox>
              <el-checkbox label="toutiao">头条号</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="generateContent">一键生成爆款文案</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>
    </el-tabs>

    <div v-if="optimizedContent.length > 0" class="results">
      <h3>优化结果</h3>
      <el-card v-for="(result, index) in optimizedContent" :key="index" class="result-card">
        <div slot="header" class="clearfix">
          <span>{{ getPlatformName(result.platform) }} 优化版</span>
        </div>
        <div>
          <h4>推荐标题:</h4>
          <ul>
            <li v-for="(title, t_index) in result.titles" :key="t_index">{{ title }}</li>
          </ul>
          <h4>优化文案:</h4>
          <p>{{ result.body }}</p>
          <div v-if="result.tags && result.tags.length > 0">
            <h4>推荐标签:</h4>
            <el-tag v-for="(tag, tag_index) in result.tags" :key="tag_index" type="success" style="margin-right: 5px;">{{ tag }}</el-tag>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ContentOptimizer',
  data() {
    return {
      activeTab: 'generator',
      baseText: '',
      targetPlatforms: ['xiaohongshu'],
      optimizedContent: [],
    };
  },
  methods: {
    generateContent() {
      // 模拟AI生成过程
      this.optimizedContent = []; // 清空旧数据
      this.targetPlatforms.forEach(platform => {
        this.optimizedContent.push(this.mockApiCall(platform, this.baseText));
      });
    },
    getPlatformName(platformKey) {
      const names = {
        xiaohongshu: '小红书',
        douyin: '抖音',
        bilibili: 'B站',
        toutiao: '头条号',
      };
      return names[platformKey] || '未知平台';
    },
    mockApiCall(platform, text) {
      // 这是模拟的AI处理结果，未来将替换为真实的API调用
      const baseResult = {
        platform,
        body: `【${this.getPlatformName(platform)}优化版】 - ${text}`,
      };

      switch (platform) {
        case 'xiaohongshu':
          return {
            ...baseResult,
            titles: ['笔记灵感 | ' + text.slice(0, 10), '姐妹们，快来抄作业！', '保姆级教程，一看就会'],
            body: `hi，姐妹们👭！今天给你们分享一个超棒的干货！\n\n${text}\n\n真的绝了，谁用谁知道！赶紧试试看吧！✨\n#小红书爆款 #干货分享`,
            tags: ['干货', '学习笔记', '小红书推荐'],
          };
        case 'douyin':
          return {
            ...baseResult,
            titles: ['你绝对不知道的' + text.slice(0, 5) + '技巧', '@所有人，快来看！', '下一个爆款就是你'],
            body: `🔥 ${text} 🔥\n#抖音小助手 #热门`,
            tags: ['热门', '上热门', '干货'],
          };
        case 'bilibili':
          return {
            ...baseResult,
            titles: ['【深度】' + text.slice(0, 15) + '，B站最全解析！', '干货满满，建议收藏！', '一键三连，下次不迷路'],
            body: `观众朋友们大家好！今天我们来深入聊一聊关于“${text}”的那些事。\n\n（此处省略一万字干货...）\n\n如果觉得视频对你有帮助，别忘了点赞、投币、收藏三连支持一下哦！`,
            tags: [],
          };
        case 'toutiao':
          return {
            ...baseResult,
            titles: [text.slice(0, 20), '重磅！' + text.slice(0, 15), '深度分析：' + text.slice(0, 15)],
            body: `近日，关于“${text}”的讨论引发了广泛关注。本文将从多个角度进行深入剖析...`,
            tags: ['深度分析', '头条热榜'],
          };
        default:
          return baseResult;
      }
    },
  },
};
</script>

<style scoped>
.content-optimizer {
  padding: 20px;
}
.results {
  margin-top: 20px;
}
.result-card {
  margin-bottom: 20px;
}
</style>
