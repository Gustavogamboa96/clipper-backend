const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  getClipboardData: () => ipcRenderer.send('get-clipboard-data'),
  onClipboardUpdate: (callback) => ipcRenderer.on('clipboard-updated', (_, data) => callback(data)),
  onClipboardData: (callback) => ipcRenderer.on('clipboard-data', (_, data) => callback(data)), 
  writeToClipboard: (text) => ipcRenderer.send('write-to-clipboard', text),
  closeApp: () => ipcRenderer.send('close-app'),
});
