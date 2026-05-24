'use strict';

const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');
const { spawn } = require('node:child_process');
const path = require('node:path');
const os = require('node:os');
const { loadDesktopState } = require('../src/desktopState.cjs');
const {
  loadDesktopConfig,
  saveDesktopConfig
} = require('../src/desktopConfig.cjs');

let mainWindow = null;
let config = loadDesktopConfig();

function createWindow() {
  const position = config.windowPosition || {};
  mainWindow = new BrowserWindow({
    width: 260,
    height: 220,
    x: position.x,
    y: position.y,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.setAlwaysOnTop(true, 'floating');
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  mainWindow.on('moved', saveWindowPosition);
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function saveWindowPosition() {
  if (!mainWindow) return;
  const [x, y] = mainWindow.getPosition();
  config = saveDesktopConfig({
    ...config,
    windowPosition: { x, y }
  });
}

function buildContextMenu() {
  const loginSettings = app.getLoginItemSettings();
  const isLoginOpen = Boolean(loginSettings.openAtLogin);

  return Menu.buildFromTemplate([
    {
      label: '在这里打开 Codex',
      click: () => launchAgent('codex')
    },
    {
      label: '在这里打开 Claude',
      click: () => launchAgent('claude')
    },
    { type: 'separator' },
    {
      label: '查看当前状态',
      click: () => sendStateToRenderer(true)
    },
    {
      label: `开机自动启动：${isLoginOpen ? '已开启' : '已关闭'}`,
      click: () => toggleLaunchAtLogin(!isLoginOpen)
    },
    { type: 'separator' },
    {
      label: '打开状态文件夹',
      click: () => shell.openPath(path.join(os.homedir(), '.boba-agent-coach'))
    },
    {
      label: '退出',
      click: () => app.quit()
    }
  ]);
}

function launchAgent(agent) {
  const command = `boba ${agent}`;
  const child = spawn('powershell.exe', [
    '-NoExit',
    '-Command',
    command
  ], {
    cwd: os.homedir(),
    detached: true,
    stdio: 'ignore',
    windowsHide: false
  });

  child.on('error', () => {
    sendBubble('启动失败，请检查 boba 命令是否可用。', 'concerned');
  });

  child.unref();
}

function toggleLaunchAtLogin(openAtLogin) {
  try {
    app.setLoginItemSettings({
      openAtLogin,
      path: process.execPath,
      args: process.defaultApp ? [path.resolve(process.argv[1])] : []
    });
    config = saveDesktopConfig({
      ...config,
      launchAtLogin: openAtLogin
    });
    sendBubble(`开机自动启动：${openAtLogin ? '已开启' : '已关闭'}`, 'settled');
  } catch (_error) {
    sendBubble('设置开机启动失败。', 'concerned');
  }
}

function sendStateToRenderer(force = false) {
  if (!mainWindow) return;
  mainWindow.webContents.send('desktop-state', {
    ...loadDesktopState(),
    force
  });
}

function sendBubble(message, mood) {
  if (!mainWindow) return;
  mainWindow.webContents.send('desktop-state', {
    status: 'notice',
    message,
    mood,
    force: true
  });
}

app.whenReady().then(() => {
  createWindow();
  setInterval(() => sendStateToRenderer(false), 2000);

  ipcMain.handle('get-state', () => loadDesktopState());
  ipcMain.handle('show-menu', () => {
    buildContextMenu().popup({ window: mainWindow });
  });
  ipcMain.handle('save-position', () => {
    saveWindowPosition();
    return true;
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', (event) => {
  event.preventDefault();
});
