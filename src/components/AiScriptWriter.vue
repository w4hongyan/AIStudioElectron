<template>
  <el-row :gutter="24" class="main-layout">
    <!-- Left Column: Control Panel -->
    <el-col :span="6">
      <el-card class="feature-card control-panel">
        <template #header>
          <div class="card-header">
            <span>🎬 AI 影视化生产力工具</span>
          </div>
        </template>
        
        <el-form :model="form" label-position="top">
          <el-form-item label="项目文件夹">
            <el-input v-model="projectPath" placeholder="未设置" readonly>
              <template #append>
                <el-button @click="selectProjectFolder">选择...</el-button>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item label="故事核心主题">
            <el-input
              v-model="form.topic"
              type="textarea"
              :rows="3"
              placeholder="例如：一个程序员在赛博朋克都市中寻找丢失的数字猫"
            />
          </el-form-item>

          <el-collapse v-model="activeCollapse" class="details-collapse">
            <el-collapse-item title="高级创作参数" name="1">
              <el-form-item label="主角设定 (可选)">
                <el-input
                  v-model="form.characterBio"
                  type="textarea"
                  :rows="3"
                  placeholder="主角姓名、身份、性格、目标等"
                />
              </el-form-item>
              <el-form-item label="故事大纲 (可选)">
                <el-input
                  v-model="form.storyOutline"
                  type="textarea"
                  :rows="5"
                  placeholder="故事的起因、经过、高潮、结局"
                />
              </el-form-item>
              <el-form-item label="指定场景 (可选)">
                <el-input
                  v-model="form.specificScenes"
                  type="textarea"
                  :rows="3"
                  placeholder="希望必须出现的具体场景或情节，每行一个"
                />
              </el-form-item>
              <el-form-item label="负向提示词 (可选)">
                <el-input
                  v-model="form.negativePrompt"
                  type="textarea"
                  :rows="2"
                  placeholder="例如：避免出现暴力、血腥内容"
                />
              </el-form-item>
            </el-collapse-item>
          </el-collapse>

          <el-form-item label="选择视频风格">
            <el-select v-model="form.style" placeholder="请选择风格" style="width: 100%;">
              <el-option label="赛博朋克" value="cyberpunk" />
              <el-option label="科幻未来" value="sci-fi" />
              <el-option label="国风奇幻" value="fantasy-guofeng" />
              <el-option label="温情日常" value="slice-of-life" />
            </el-select>
          </el-form-item>
          <el-form-item label="预估镜头数">
            <el-input-number v-model="form.shots" :min="3" :max="20" style="width: 100%;" />
          </el-form-item>
          
          <el-form-item>
            <el-row :gutter="10" style="width: 100%;">
              <el-col :span="12">
                <el-button :icon="FolderOpened" @click="loadProject" style="width: 100%;">加载项目</el-button>
              </el-col>
              <el-col :span="12">
                <el-button type="primary" :icon="FolderAdd" @click="saveProject" style="width: 100%;">保存项目</el-button>
              </el-col>
            </el-row>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="generateScript" :loading="loading" size="large" style="width: 100%;">
              <el-icon style="margin-right: 8px;"><MagicStick /></el-icon>
              {{ loading ? 'AI 正在全力创作中...' : '生成导演级脚本' }}
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </el-col>

    <!-- Right Column: Results -->
    <el-col :span="18">
      <div class="result-container" v-loading="loading" element-loading-text="AI思考中，请稍候...">
        <div v-if="!result" class="placeholder">
          <el-empty description="在左侧输入创作要求，开始您的AI影视之旅" />
        </div>
        <div v-else>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-card class="result-card">
                <template #header>
                  <div class="card-header-content">
                    <span>故事简介</span>
                    <el-button type="primary" :icon="Refresh" circle plain size="small" @click="regeneratePart('synopsis')" />
                  </div>
                </template>
                <el-input v-model="result.synopsis" type="textarea" autosize class="result-text-input" />
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card class="result-card">
                <template #header>
                  <div class="card-header-content">
                    <span>场景预设</span>
                    <el-button type="primary" :icon="Refresh" circle plain size="small" @click="regeneratePart('scenePreset')" />
                  </div>
                </template>
                <el-input v-model="result.scenePreset" type="textarea" autosize class="result-text-input" />
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card class="result-card">
                <template #header>
                  <div class="card-header-content">
                    <span>人物预设</span>
                    <el-button type="primary" :icon="Refresh" circle plain size="small" @click="regeneratePart('characterPreset')" />
                  </div>
                </template>
                <el-input v-model="result.characterPreset" type="textarea" autosize class="result-text-input" />
              </el-card>
            </el-col>
          </el-row>
          
          <el-card class="result-card table-card">
            <template #header>
              <div class="card-header-content">
                <span>分镜列表</span>
                <el-button type="success" :icon="Download" circle plain @click="exportDataAsXLSX" />
              </div>
            </template>
            <el-table :data="result.shots" stripe style="width: 100%">
              <el-table-column prop="timeline" label="时间轴" width="100" />
              <el-table-column prop="character" label="人物" width="120">
                <template #default="scope">
                  <el-input v-model="scope.row.character" type="textarea" autosize />
                </template>
              </el-table-column>
              <el-table-column prop="shot" label="镜头描述" width="250">
                <template #default="scope">
                  <el-input v-model="scope.row.shot" type="textarea" autosize />
                </template>
              </el-table-column>
              <el-table-column prop="t2i_prompt" label="文生图提示词">
                <template #default="scope">
                  <el-input v-model="scope.row.t2i_prompt" type="textarea" autosize />
                </template>
              </el-table-column>
              <el-table-column prop="i2v_prompt" label="图生视频提示词">
                <template #default="scope">
                  <el-input v-model="scope.row.i2v_prompt" type="textarea" autosize />
                </template>
              </el-table-column>
              <el-table-column label="操作" width="80" fixed="right">
                <template #default="scope">
                  <el-button type="primary" :icon="Refresh" circle plain size="small" @click="regeneratePart('shot', scope.$index)" />
                </template>
              </el-table-column>
              <el-table-column label="媒体预览" width="180" fixed="right">
                <template #default="scope">
                  <div class="media-container">
                    <video v-if="scope.row.videoUrl" :src="scope.row.videoUrl" class="shot-video" controls />
                    <el-image
                      v-else
                      :src="scope.row.imageUrl"
                      fit="cover"
                      class="shot-image"
                      :preview-src-list="scope.row.imageUrl ? [scope.row.imageUrl] : []"
                      hide-on-click-modal
                    >
                      <template #error>
                        <div class="image-slot">
                          <el-icon><Picture /></el-icon>
                        </div>
                      </template>
                    </el-image>
                    <div class="media-overlay">
                      <div class="media-actions">
                        <el-button
                          type="warning"
                          :icon="PictureRounded"
                          circle
                          size="small"
                          @click="generateImageForRow(scope.$index)"
                          :loading="scope.row.isGeneratingImage"
                          title="生成图片"
                        />
                        <el-button
                          type="danger"
                          :icon="VideoCamera"
                          circle
                          size="small"
                          @click="generateVideoForRow(scope.$index)"
                          :loading="scope.row.isGeneratingVideo"
                          :disabled="!scope.row.imageUrl"
                          title="生成视频"
                        />
                      </div>
                    </div>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </div>
      </div>
    </el-col>
  </el-row>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { Refresh, Download, Picture, PictureRounded, FolderAdd, FolderOpened, VideoCamera } from '@element-plus/icons-vue';
import * as XLSX from 'xlsx';
import { ElMessage } from 'element-plus';

const projectPath = ref('');
const activeCollapse = ref([]);
const form = reactive({
  topic: '',
  characterBio: '',
  storyOutline: '',
  specificScenes: '',
  style: 'cyberpunk',
  shots: 5,
  negativePrompt: '',
});
const loading = ref(false);
const result = ref(null);

const generateScript = () => {
  if (!form.topic) {
    ElMessage.warning('请输入故事核心主题！');
    return;
  }
  console.log('Generating with form data:', form);
  loading.value = true;
  result.value = null;

  // Simulate AI API call
  setTimeout(() => {
    result.value = {
      synopsis: '在2077年的霓虹都市“夜之城”，一名孤独的程序员“K”为了寻找他意外丢失的数字宠物猫“比特”，踏上了一段穿越数据与现实边界的危险旅程。',
      scenePreset: '高楼林立、霓虹闪烁的赛博朋克都市夜景，空中交通穿梭，巨型全息广告牌闪烁。街道层面潮湿、拥挤，充满蒸汽和各式各样的人。',
      characterPreset: '主角“K”：20多岁，技术宅，穿着功能性夹克，眼神略带疲惫但充满决心。数字猫“比特”：由纯粹的数据构成，形态可变，发出柔和的蓝光。',
      shots: [
        { timeline: '0-5s', character: '无', shot: '广角，夜之城全景，霓虹灯雨夜，镜头缓缓推向K的公寓窗户。', t2i_prompt: 'cyberpunk city, rainy night, neon lights, wide angle, cinematic, view from above, blade runner style', i2v_prompt: 'slow zoom in, rain dripping on glass', imageUrl: '', isGeneratingImage: false, videoUrl: '', isGeneratingVideo: false },
        { timeline: '5-10s', character: 'K', shot: '中景，K在电脑前，屏幕上显示着“比特”的可爱代码形象，突然屏幕一黑。', t2i_prompt: 'a young programmer in a dark room, multiple monitors, holographic digital cat on screen, surprised expression, cinematic lighting', i2v_prompt: 'screen flickers and goes black, cat disappears', imageUrl: '', isGeneratingImage: false, videoUrl: '', isGeneratingVideo: false },
        { timeline: '10-15s', character: 'K', shot: '特写，K戴上神经接口设备，眼神坚定。', t2i_prompt: 'close up, man putting on a neural interface headset, determined look, glowing blue lights on the device, detailed, sci-fi', i2v_prompt: 'subtle light glow effect, very slow forward dolly', imageUrl: '', isGeneratingImage: false, videoUrl: '', isGeneratingVideo: false },
        { timeline: '15-25s', character: 'K', shot: '快速蒙太奇，K在数据流中穿梭，躲避防火墙，追踪“比特”的踪迹。', t2i_prompt: 'man surfing on a stream of data, digital world, abstract, glowing lines, binary code, dodging red firewall barriers, motion blur', i2v_prompt: 'fast-paced camera movement, glitch effects, particle effects', imageUrl: '', isGeneratingImage: false, videoUrl: '', isGeneratingVideo: false },
        { timeline: '25-30s', character: 'K, 比特', shot: '远景，K在一个巨大的数据服务器核心找到了被困的“比特”，他伸出手。', t2i_prompt: 'a man reaching his hand towards a small glowing digital cat trapped inside a massive, glowing server core, epic scale, volumetric lighting', i2v_prompt: 'camera slowly orbits, particles floating around the core', imageUrl: '', isGeneratingImage: false, videoUrl: '', isGeneratingVideo: false },
      ],
    };
    loading.value = false;
  }, 2000);
};

const regeneratePart = (part, index = -1) => {
  console.log(`Regenerating ${part} at index ${index}...`);
  // Simulate API call for regeneration
  setTimeout(() => {
    if (part === 'synopsis') {
      result.value.synopsis = '（新生成）一名叛逆的赏金猎人，在混乱的火星殖民地，发现了一个可能颠覆整个太阳系权力格局的古老外星秘密。';
    } else if (part === 'scenePreset') {
      result.value.scenePreset = '（新生成）红色沙漠覆盖的火星表面，点缀着饱经风霜的穹顶殖民地。空气中弥漫着铁锈和臭氧的味道，远处是巨大的轨道电梯。';
    } else if (part === 'characterPreset') {
      result.value.characterPreset = '（新生成）主角“蕾娜”：30多岁，身手矫健，穿着磨损的皮夹克，驾驶着一艘经过非法改装的星际飞船，眼神愤世嫉俗但内心渴望正义。';
    } else if (part === 'shot' && index !== -1) {
      result.value.shots[index] = {
        timeline: result.value.shots[index].timeline, // Keep timeline the same
        character: '（新）蕾娜',
        shot: '（新）特写，蕾娜的电子义眼扫描着一个古老的石碑，数据流在她的视野中闪过。',
        t2i_prompt: '（new）close up, female cyborg\'s glowing eye scanning an ancient alien monolith, data streams overlaying her vision, cinematic, detailed',
        i2v_prompt: '（new）subtle glowing and data stream effects'
      };
    }
  }, 1000);
};

const exportDataAsXLSX = () => {
  if (!result.value) {
    ElMessage.warning('没有可导出的内容！');
    return;
  }
  try {
    const wb = XLSX.utils.book_new();

    // --- Create Info Worksheet with Styles ---
    const infoData = [
      { Category: '故事简介', Content: result.value.synopsis },
      { Category: '场景预设', Content: result.value.scenePreset },
      { Category: '人物预设', Content: result.value.characterPreset },
    ];
    const wsInfo = XLSX.utils.json_to_sheet(infoData, { skipHeader: true });
    XLSX.utils.sheet_add_aoa(wsInfo, [['分类', '内容']], { origin: 'A1' });
    wsInfo['!cols'] = [{ wch: 15 }, { wch: 80 }];
    wsInfo['A1'].s = { font: { bold: true } };
    wsInfo['B1'].s = { font: { bold: true } };
    XLSX.utils.book_append_sheet(wb, wsInfo, 'Info');

    // --- Create Shots Worksheet with Styles ---
    const shotsData = result.value.shots.map(shot => ({
      '时间轴': shot.timeline,
      '人物': shot.character,
      '镜头描述': shot.shot,
      '文生图提示词': shot.t2i_prompt,
      '图生视频提示词': shot.i2v_prompt,
    }));
    const wsShots = XLSX.utils.json_to_sheet(shotsData);
    const shotsCols = [
      { wch: 15 }, { wch: 20 }, { wch: 50 }, { wch: 60 }, { wch: 60 },
    ];
    wsShots['!cols'] = shotsCols;
    const headerCells = ['A1', 'B1', 'C1', 'D1', 'E1'];
    headerCells.forEach(cell => {
      if (wsShots[cell]) {
        wsShots[cell].s = { font: { bold: true } };
      }
    });
    XLSX.utils.book_append_sheet(wb, wsShots, 'Shots');

    // --- Write the file with a sanitized, topic-based name ---
    const sanitizeFilename = (name) => {
      if (!name) return 'ai-script';
      return name.replace(/[\/\\?%*:|"<>]/g, '_').substring(0, 50);
    };
    const filename = `${sanitizeFilename(form.topic)}.xlsx`;
    XLSX.writeFile(wb, filename);

    ElMessage.success({
      message: `成功导出文件：${filename}`,
      duration: 5000,
    });

  } catch (error) {
    console.error('Failed to export data as XLSX:', error);
    ElMessage.error('导出XLSX失败！');
  }
};

const generateImageForRow = async (index) => {
  const shot = result.value.shots[index];
  if (!shot || !shot.t2i_prompt) {
    ElMessage.warning('该镜头没有文生图提示词！');
    return;
  }
  
  console.log(`Generating image for shot ${index} with prompt:`, shot.t2i_prompt);
  shot.isGeneratingImage = true;
  shot.imageUrl = '';

  // Simulate Text-to-Image API call
  await new Promise(resolve => setTimeout(resolve, 2500));
  
  const seed = shot.t2i_prompt.replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);
  const remoteUrl = `https://picsum.photos/seed/${seed}/1280/720`;
  
  if (projectPath.value) {
    try {
      const localPath = await window.electronAPI.downloadMedia({ url: remoteUrl, projectPath: projectPath.value, topic: form.topic });
      shot.imageUrl = `file://${localPath}`;
      ElMessage.success(`镜头 ${index + 1} 图片已生成并保存！`);
    } catch (error) {
      console.error('Failed to download image:', error);
      ElMessage.error('图片下载失败！');
      shot.imageUrl = remoteUrl; // Fallback to remote URL
    }
  } else {
    shot.imageUrl = remoteUrl;
    ElMessage.success(`镜头 ${index + 1} 图片生成成功！`);
  }
  shot.isGeneratingImage = false;
};

const generateVideoForRow = async (index) => {
  const shot = result.value.shots[index];
  if (!shot || !shot.imageUrl) {
    ElMessage.warning('请先为该镜头生成图片！');
    return;
  }
  
  console.log(`Generating video for shot ${index} with prompt:`, shot.i2v_prompt);
  shot.isGeneratingVideo = true;
  shot.videoUrl = '';

  // Simulate Image-to-Video API call
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  const remoteUrl = 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4';

  if (projectPath.value) {
    try {
      const localPath = await window.electronAPI.downloadMedia({ url: remoteUrl, projectPath: projectPath.value, topic: form.topic });
      shot.videoUrl = `file://${localPath}`;
      ElMessage.success(`镜头 ${index + 1} 视频已生成并保存！`);
    } catch (error) {
      console.error('Failed to download video:', error);
      ElMessage.error('视频下载失败！');
      shot.videoUrl = remoteUrl; // Fallback to remote URL
    }
  } else {
    shot.videoUrl = remoteUrl;
    ElMessage.success(`镜头 ${index + 1} 视频生成成功！`);
  }
  shot.isGeneratingVideo = false;
};

const saveProject = () => {
  if (!form.topic && !result.value) {
    ElMessage.warning('没有可保存的内容！');
    return;
  }
  try {
    const projectData = {
      form: form,
      result: result.value,
    };
    const dataStr = JSON.stringify(projectData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const sanitizeFilename = (name) => {
      if (!name) return 'ai-project';
      return name.replace(/[\/\\?%*:|"<>]/g, '_').substring(0, 50);
    };
    link.href = url;
    link.download = `${sanitizeFilename(form.topic)}.aiproj.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    ElMessage.success('项目已保存！');
  } catch (error) {
    console.error('Failed to save project:', error);
    ElMessage.error('项目保存失败！');
  }
};

const loadProject = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.aiproj.json,application/json';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (res) => {
      try {
        const projectData = JSON.parse(res.target.result);
        if (projectData.form && projectData.result) {
          // Manually update reactive object properties
          Object.assign(form, projectData.form);
          result.value = projectData.result;
          ElMessage.success(`项目 "${form.topic}" 已加载！`);
        } else {
          ElMessage.error('无效的项目文件格式！');
        }
      } catch (error) {
        console.error('Failed to load project:', error);
        ElMessage.error('加载项目失败！');
      }
    };
    reader.readAsText(file);
  };
  input.click();
};

const selectProjectFolder = async () => {
  const path = await window.electronAPI.selectDirectory();
  if (path) {
    projectPath.value = path;
    ElMessage.success(`项目文件夹已设置为：${path}`);
  }
};
</script>

<style scoped>
.main-layout {
  height: 100%;
}
.control-panel, .result-container {
  /* height: calc(100vh - 108px); */ /* Removed fixed height to allow natural flow */
  display: flex;
  flex-direction: column;
}
.result-container {
  /* justify-content: center; */ /* Removed to allow content to start from top */
}
.placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}
.card-header {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color-primary);
}

.card-header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
.result-card {
  margin-bottom: 20px;
  /* height: 150px; */ /* Removed fixed height to allow content to determine height */
  /* overflow-y: auto; */ /* Removed overflow to prevent scrollbars */
}
.result-text {
  font-size: 14px;
  line-height: 1.6;
}
.result-text-input .el-textarea__inner {
  box-shadow: none !important;
  border: 1px solid transparent;
  background-color: transparent;
  padding: 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-color-primary);
  resize: none;
}
.result-text-input .el-textarea__inner:hover {
  border-color: var(--border-color);
}
.result-text-input .el-textarea__inner:focus {
  border-color: var(--accent-color);
}
.table-card {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}
.el-table {
  --el-table-border-color: var(--border-color);
  --el-table-header-bg-color: #fafafa;
  --el-table-tr-bg-color: var(--card-bg-color);
  --el-table-row-hover-bg-color: #ecf5ff;
  --el-table-header-text-color: var(--text-color-secondary);
  border-radius: 8px;
  overflow: hidden;
}
.el-table th.el-table__cell {
  font-weight: 600;
  color: var(--text-color-secondary);
}
.media-container {
  position: relative;
  width: 160px;
  height: 100px;
  border-radius: 4px;
  overflow: hidden;
}
.shot-image, .shot-video {
  width: 100%;
  height: 100%;
  background-color: #f5f7fa;
  display: flex;
  justify-content: center;
  align-items: center;
  object-fit: cover;
}
.media-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}
.media-container:hover .media-overlay {
  opacity: 1;
}
.media-actions {
  display: flex;
  gap: 10px;
}
.image-slot {
  font-size: 24px;
  color: #c0c4cc;
}
.details-collapse {
  margin-bottom: 18px;
  border-top: none;
  border-bottom: none;
}
.details-collapse .el-collapse-item__header {
  border-bottom: none;
  font-size: 14px;
  font-weight: 500;
}
.details-collapse .el-collapse-item__wrap {
  border-bottom: none;
}
.details-collapse .el-collapse-item__content {
  padding-bottom: 0;
}
</style>
