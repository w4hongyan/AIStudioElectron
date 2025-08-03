const { app, BrowserWindow, ipcMain, dialog, session } = require('electron');
const pathModule = require('path');
const fs = require('fs');
const https = require('https');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;

ffmpeg.setFfmpegPath(ffmpegPath);

// --- Dialog Handlers ---

async function handleDirectoryOpen() {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  if (!canceled) {
    return filePaths[0];
  }
}

async function handleFileOpen(event, options) {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: options.filters || [],
  });
  if (canceled) {
    return [];
  }
  return filePaths.map(filePath => {
    const stats = fs.statSync(filePath);
    return {
      path: filePath,
      name: pathModule.basename(filePath),
      size: stats.size,
    };
  });
}

// --- Main Window Creation ---

function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: pathModule.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile('index.html');
  }
}

// --- App Lifecycle ---

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// --- IPC Handlers ---

ipcMain.handle('dialog:selectDirectory', handleDirectoryOpen);
ipcMain.handle('dialog:openFile', handleFileOpen);

ipcMain.handle('image:process', async (event, { files, task, options }) => {
  let successCount = 0;
  let errorCount = 0;

  for (const file of files) {
    const filePath = file.path;
    if (!filePath) {
      file.error = 'File path is missing.';
      errorCount++;
      continue;
    }

    try {
      const dir = pathModule.dirname(filePath);
      const ext = pathModule.extname(filePath);
      const name = pathModule.basename(filePath, ext);
      let outputPath;

      let sharpInstance = sharp(filePath);

      if (task === 'compress') {
        outputPath = pathModule.join(dir, `${name}-compressed.jpg`);
        await sharpInstance.jpeg({ quality: Math.round(options.quality * 100) }).toFile(outputPath);
      } else if (task === 'convert') {
        outputPath = pathModule.join(dir, `${name}-converted.${options.format}`);
        await sharpInstance.toFormat(options.format).toFile(outputPath);
      } else if (task === 'watermark') {
        outputPath = pathModule.join(dir, `${name}-watermarked${ext}`);
        const watermarkBuffer = await sharp(options.watermarkPath).ensureAlpha(options.options.opacity).toBuffer();
        await sharpInstance.composite([{ input: watermarkBuffer, gravity: options.options.position }]).toFile(outputPath);
      }
      
      file.outputPath = outputPath;
      file.status = 'success';
      successCount++;
    } catch (error) {
      file.error = error.message;
      errorCount++;
    }
  }

  return { files, successCount, errorCount };
});

ipcMain.handle('video:process', async (event, { files, task, options }) => {
  let successCount = 0;
  let errorCount = 0;

  for (const file of files) {
    const filePath = file.path;
    if (!filePath) {
      file.error = 'File path is missing.';
      errorCount++;
      continue;
    }

    await new Promise((resolve) => {
      const dir = pathModule.dirname(filePath);
      const ext = pathModule.extname(filePath);
      const name = pathModule.basename(filePath, ext);
      let outputPath;
      
      let ffmpegCommand = ffmpeg(filePath);

      if (task === 'convert') {
        outputPath = pathModule.join(dir, `${name}-converted.${options.format}`);
        ffmpegCommand.toFormat(options.format);
      } else if (task === 'extract') {
        outputPath = pathModule.join(dir, `${name}-audio.${options.format}`);
        ffmpegCommand.noVideo();
      } else if (task === 'compress') {
        outputPath = pathModule.join(dir, `${name}-compressed.mp4`);
        ffmpegCommand.size(options.resolution);
      }

      ffmpegCommand
        .on('progress', (progress) => {
          event.sender.send('video:progress', { fileId: file.uid, progress: Math.round(progress.percent || 0) });
        })
        .on('end', () => {
          file.outputPath = outputPath;
          file.status = 'success';
          successCount++;
          resolve();
        })
        .on('error', (err) => {
          file.error = err.message;
          errorCount++;
          resolve();
        })
        .save(outputPath);
    });
  }

  return { files, successCount, errorCount };
});

// --- Auto Editor Handlers ---

ipcMain.handle('auto:scanMaterials', async (event, { path, folders }) => {
  try {
    const stats = {};
    const files = {};
    
    for (const folder of folders) {
      const folderPath = pathModule.join(path, folder);
      if (!fs.existsSync(folderPath)) {
        stats[folder] = 0;
        files[folder] = [];
        continue;
      }
      
      const folderFiles = fs.readdirSync(folderPath)
        .filter(file => /\.(mp4|mov|avi|mkv|webm)$/i.test(file))
        .map(file => {
          const filePath = pathModule.join(folderPath, file);
          const stats = fs.statSync(filePath);
          return {
            name: file,
            path: filePath,
            size: stats.size,
            type: 'video'
          };
        });
      
      stats[folder] = folderFiles.length;
      files[folder] = folderFiles;
    }
    
    return { stats, files };
  } catch (error) {
    throw new Error('扫描素材失败: ' + error.message);
  }
});

ipcMain.handle('auto:scanBgMusic', async (event, { path }) => {
  try {
    const files = fs.readdirSync(path)
      .filter(file => /\.(mp3|wav|aac|m4a)$/i.test(file))
      .map(file => pathModule.join(path, file));
    
    return { count: files.length, files };
  } catch (error) {
    throw new Error('扫描背景音乐失败: ' + error.message);
  }
});

ipcMain.handle('auto:scanScripts', async (event, { path, folders }) => {
  try {
    const content = {};
    
    for (const folder of folders) {
      const scriptFile = pathModule.join(path, `话术文档${folder}.txt`);
      if (fs.existsSync(scriptFile)) {
        content[folder] = fs.readFileSync(scriptFile, 'utf8');
      } else {
        content[folder] = '暂无话术内容';
      }
    }
    
    return { content };
  } catch (error) {
    throw new Error('扫描话术失败: ' + error.message);
  }
});

ipcMain.handle('auto:startEditing', async (event, config) => {
  try {
    const outputDir = pathModule.join(config.materialPath, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputPath = pathModule.join(outputDir, `auto_edit_${Date.now()}.mp4`);
    
    // 模拟处理进度
    let progress = 0;
    const steps = [
      '正在扫描素材文件...',
      '正在处理视频剪辑...',
      '正在合成音频...',
      '正在添加背景音乐...',
      '正在最终合成...'
    ];
    
    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      progress = Math.round(((i + 1) / steps.length) * 100);
      event.sender.send('auto:progress', { progress, step: steps[i] });
    }
    
    // 这里应该集成真实的FFmpeg处理逻辑
    // 目前返回模拟结果
    return {
      success: true,
      outputPath: outputPath,
      duration: 18 // 模拟时长
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});
