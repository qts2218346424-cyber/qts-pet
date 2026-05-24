'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('bobaDesktop', {
  getState: () => ipcRenderer.invoke('get-state'),
  showMenu: () => ipcRenderer.invoke('show-menu'),
  savePosition: () => ipcRenderer.invoke('save-position'),
  onState: (callback) => {
    ipcRenderer.on('desktop-state', (_event, state) => callback(state));
  }
});
