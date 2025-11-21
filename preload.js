// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),

  // optional: helper to listen for events from main if needed later
  on: (channel, cb) => {
    const valid = ['some-main-event']; // whitelist if you add events later
    if (valid.includes(channel)) {
      ipcRenderer.on(channel, (e, ...args) => cb(...args));
    }
  }
});
