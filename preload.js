const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // General
  selectDirectory: () => ipcRenderer.invoke('dialog:selectDirectory'),
  openFile: (options) => ipcRenderer.invoke('dialog:openFile', options),
  downloadMedia: (options) => ipcRenderer.invoke('media:download', options),
  
  // Image Tools
  processImages: (options) => ipcRenderer.invoke('image:process', options),

  // Video Tools
  processVideos: (options) => ipcRenderer.invoke('video:process', options),
  onVideoProgress: (callback) => ipcRenderer.on('video:progress', (_event, value) => callback(value)),
  removeVideoProgressListener: () => ipcRenderer.removeAllListeners('video:progress'),
  
  // Auto Editor
  scanMaterials: (options) => ipcRenderer.invoke('auto:scanMaterials', options),
  scanBgMusic: (options) => ipcRenderer.invoke('auto:scanBgMusic', options),
  scanScripts: (options) => ipcRenderer.invoke('auto:scanScripts', options),
  startAutoEditing: (config) => ipcRenderer.invoke('auto:startEditing', config),
  onAutoProgress: (callback) => ipcRenderer.on('auto:progress', (_event, value) => callback(value)),
  removeAutoProgressListener: () => ipcRenderer.removeAllListeners('auto:progress'),
});
