'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('bobaDesktop', {
  getState: () => ipcRenderer.invoke('get-state'),
  showMenu: () => ipcRenderer.invoke('show-menu'),
  savePosition: () => ipcRenderer.invoke('save-position'),
  getWindowPosition: () => ipcRenderer.invoke('get-window-position'),
  setWindowPosition: (position) => ipcRenderer.invoke('set-window-position', position),
  getWorkArea: () => ipcRenderer.invoke('get-work-area'),
  onState: (callback) => {
    ipcRenderer.on('desktop-state', (_event, state) => callback(state));
  },
  onCommand: (callback) => {
    ipcRenderer.on('desktop-command', (_event, command) => callback(command));
  }
});
