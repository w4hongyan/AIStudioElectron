<template>
  <el-row :gutter="24">
    <el-col :span="16">
      <el-card class="file-list-panel">
        <template #header>
          <div class="card-header">
            <span>音频文件列表</span>
          </div>
        </template>
        <el-upload
          v-model:file-list="fileList"
          action="#"
          drag
          multiple
          :auto-upload="false"
          accept="audio/*"
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">
            拖拽音频文件到此处或 <em>点击上传</em>
          </div>
        </el-upload>
      </el-card>
      <el-card class="result-panel" v-if="transcriptionResult">
        <template #header>
          <div class="card-header">
            <span>识别结果</span>
            <div>
              <el-button @click="exportTXT" :icon="Document">导出 TXT</el-button>
              <el-button @click="exportSRT" type="primary" :icon="Tickets">导出 SRT</el-button>
            </div>
          </div>
        </template>
        <el-input
          v-model="transcriptionResult.text"
          type="textarea"
          :autosize="{ minRows: 10 }"
          class="result-textarea"
        />
      </el-card>
    </el-col>
    <el-col :span="8">
      <el-card class="control-panel">
        <template #header>
          <div class="card-header">
            <span>语音转文字</span>
          </div>
        </template>
        <el-form label-position="top">
          <el-form-item label="识别语言">
            <el-select v-model="language" style="width: 100%;">
              <el-option label="中文 (普通话)" value="zh-CN" />
              <el-option label="English (US)" value="en-US" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button 
              type="primary" 
              @click="startTranscription" 
              :disabled="fileList.length === 0 || isProcessing" 
              :loading="isProcessing"
              style="width: 100%;"
            >
              <el-icon style="margin-right: 8px;"><Microphone /></el-icon>
              {{ isProcessing ? '识别中...' : `开始识别 ${fileList.length} 个文件` }}
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </el-col>
  </el-row>
</template>

<script setup>
import { ref } from 'vue';
import { UploadFilled, Document, Tickets, Microphone } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const fileList = ref([]);
const language = ref('zh-CN');
const isProcessing = ref(false);
const transcriptionResult = ref(null);

const startTranscription = async () => {
  if (fileList.value.length === 0) {
    ElMessage.warning('请先选择音频文件！');
    return;
  }
  // For simplicity, we only process the first file in this example.
  const file = fileList.value[0];
  
  isProcessing.value = true;
  transcriptionResult.value = null;

  // Simulate backend API call
  await new Promise(resolve => setTimeout(resolve, 3000));

  transcriptionResult.value = {
    text: "你好，欢迎使用畅享AI自媒体工具箱。这是一个由AI驱动的强大工具，旨在帮助您提高创作效率。Hello, welcome to the Enjoy AI Media Toolkit. This is a powerful tool driven by AI, designed to help you improve your creative efficiency.",
    srt: `1
00:00:01,000 --> 00:00:05,000
你好，欢迎使用畅享AI自媒体工具箱。

2
00:00:05,500 --> 00:00:09,000
这是一个由AI驱动的强大工具，旨在帮助您提高创作效率。

3
00:00:09,500 --> 00:00:12,000
Hello, welcome to the Enjoy AI Media Toolkit.

4
00:00:12,500 --> 00:00:16,000
This is a powerful tool driven by AI, designed to help you improve your creative efficiency.
`
  };

  isProcessing.value = false;
  ElMessage.success('识别完成！');
};

const downloadFile = (filename, content, type) => {
  const blob = new Blob([content], { type });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

const exportTXT = () => {
  if (!transcriptionResult.value) return;
  const filename = `${fileList.value[0].name}.txt`;
  downloadFile(filename, transcriptionResult.value.text, 'text/plain;charset=utf-8');
};

const exportSRT = () => {
  if (!transcriptionResult.value) return;
  const filename = `${fileList.value[0].name}.srt`;
  downloadFile(filename, transcriptionResult.value.srt, 'text/plain;charset=utf-8');
};
</script>

<style scoped>
.control-panel, .file-list-panel, .result-panel {
  height: calc(100vh - 108px);
  display: flex;
  flex-direction: column;
}
.file-list-panel .el-upload, .file-list-panel .el-upload-dragger {
  height: 100%;
}
.result-panel {
  margin-top: 24px;
  height: auto;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
.result-textarea .el-textarea__inner {
  font-size: 16px;
  line-height: 1.8;
}
</style>
