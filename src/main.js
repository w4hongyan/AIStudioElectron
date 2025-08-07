import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import App from './App.vue';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';

const app = createApp(App);

// 注册所有Element Plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

// 确保常用的图标被注册
const commonIcons = ['MagicStick', 'Cpu', 'Picture', 'VideoCamera', 'Microphone', 'DataLine', 'Scissor', 'Grid', 'Expand', 'Fold', 'Upload', 'TrendCharts', 'DataAnalysis', 'Setting', 'Bell', 'Refresh', 'Monitor', 'Coin', 'Folder', 'Lightning', 'Delete', 'Warning', 'SuccessFilled', 'InfoFilled', 'CaretTop', 'CaretBottom', 'CollectionTag', 'Timer', 'Document', 'VideoPlay', 'UploadFilled', 'Star'];

commonIcons.forEach(iconName => {
  if (ElementPlusIconsVue[iconName]) {
    app.component(iconName, ElementPlusIconsVue[iconName]);
  }
});

app.use(ElementPlus);
app.mount('#app');
