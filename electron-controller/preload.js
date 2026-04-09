const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('lollipopApi', {
  pickDirectory: () => ipcRenderer.invoke('lollipop:pick-directory'),
  start: (config) => ipcRenderer.invoke('lollipop:start', config),
  stop: () => ipcRenderer.invoke('lollipop:stop'),
  onLog: (handler) => ipcRenderer.on('lollipop:log', (_event, message) => handler(message)),
  onStatus: (handler) => ipcRenderer.on('lollipop:status', (_event, status) => handler(status))
});
