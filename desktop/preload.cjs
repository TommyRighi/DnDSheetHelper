const { contextBridge, ipcRenderer } = require('electron');
// No generic IPC, filesystem or process object is exposed to the page or external frames.
if (process.isMainFrame) contextBridge.exposeInMainWorld('fableDesktop', {
  getInfo: () => ipcRenderer.invoke('fable:info'),
  saveBackup: (workspace, format) => ipcRenderer.invoke('fable:save-backup', workspace, format),
});
