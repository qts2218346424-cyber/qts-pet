'use strict';

const { app, BrowserWindow, Menu, ipcMain, screen, shell } = require('electron');
const { spawn } = require('node:child_process');
const path = require('node:path');
const os = require('node:os');
const { loadDesktopState } = require('../src/desktopState.cjs');
const {
  loadDesktopConfig,
  saveDesktopConfig
} = require('../src/desktopConfig.cjs');
const { getCodexUsageSummary } = require('../src/codexUsage.cjs');

let mainWindow = null;
let config = loadDesktopConfig();
const shouldResetPosition = process.argv.includes('--reset-position');
let lastMenuAt = 0;
let isMousePassthrough = false;
const PROJECT_ROOT = path.resolve(__dirname, '..');
const PET_WINDOW_WIDTH = 240;
const PET_WINDOW_HEIGHT = 260;

const LABELS = {
  openCodex: '\u5728\u8fd9\u91cc\u6253\u5f00 Codex',
  openClaude: '\u5728\u8fd9\u91cc\u6253\u5f00 Claude',
  showState: '\u67e5\u770b\u5f53\u524d\u72b6\u6001',
  showCodexUsage: '\u67e5\u770b Codex \u4f59\u989d/\u7528\u91cf',
  showGpuStatus: '\u67e5\u770b\u663e\u5361\u72b6\u6001',
  commandPet: '\u547d\u4ee4\u5ba0\u7269',
  settings: '\u8bbe\u7f6e\u7ba1\u7406',
  toggleWalking: '\u6682\u505c/\u7ee7\u7eed\u884c\u8d70',
  resetPosition: '\u91cd\u7f6e\u4f4d\u7f6e',
  startOnLogin: '\u5f00\u673a\u81ea\u52a8\u542f\u52a8',
  enabled: '\u5df2\u5f00\u542f',
  disabled: '\u5df2\u5173\u95ed',
  openStateFolder: '\u6253\u5f00\u72b6\u6001\u6587\u4ef6\u5939',
  quit: '\u9000\u51fa',
  launchFailed: '\u542f\u52a8\u5931\u8d25\uff0c\u8bf7\u68c0\u67e5 boba \u547d\u4ee4\u662f\u5426\u53ef\u7528\u3002',
  loginFailed: '\u8bbe\u7f6e\u5f00\u673a\u542f\u52a8\u5931\u8d25\u3002'
};

configureHardwareAcceleration();

function configureHardwareAcceleration() {
  app.commandLine.appendSwitch('ignore-gpu-blocklist');
  app.commandLine.appendSwitch('enable-gpu-rasterization');
  app.commandLine.appendSwitch('enable-zero-copy');
  app.commandLine.appendSwitch('enable-accelerated-2d-canvas');
}

function createWindow() {
  const position = shouldResetPosition ? getDefaultWindowPosition() : (config.windowPosition || getDefaultWindowPosition());
  mainWindow = new BrowserWindow({
    width: PET_WINDOW_WIDTH,
    height: PET_WINDOW_HEIGHT,
    minWidth: PET_WINDOW_WIDTH,
    minHeight: PET_WINDOW_HEIGHT,
    maxWidth: PET_WINDOW_WIDTH,
    maxHeight: PET_WINDOW_HEIGHT,
    x: position.x,
    y: position.y,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.setAlwaysOnTop(true, 'floating');
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  mainWindow.webContents.on('context-menu', () => {
    showContextMenu();
  });
  mainWindow.once('ready-to-show', () => {
    if (!mainWindow) return;
    mainWindow.setSize(PET_WINDOW_WIDTH, PET_WINDOW_HEIGHT, false);
    mainWindow.showInactive();
    setMousePassthrough(true);
  });

  mainWindow.on('moved', saveWindowPosition);
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function getDefaultWindowPosition() {
  const workArea = screen.getPrimaryDisplay().workArea;
  return {
    x: Math.round(workArea.x + (workArea.width - PET_WINDOW_WIDTH) / 2),
    y: Math.round(workArea.y + workArea.height - PET_WINDOW_HEIGHT - 80)
  };
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
      label: LABELS.openCodex,
      click: () => launchAgent('codex')
    },
    {
      label: LABELS.openClaude,
      click: () => launchAgent('claude')
    },
    { type: 'separator' },
    {
      label: LABELS.showState,
      click: () => sendStateToRenderer(true)
    },
    {
      label: LABELS.showCodexUsage,
      click: () => showCodexUsage()
    },
    {
      label: LABELS.showGpuStatus,
      click: () => showGpuStatus()
    },
    {
      label: LABELS.commandPet,
      click: () => openCommandBox()
    },
    {
      label: LABELS.settings,
      click: () => openSettingsPanel()
    },
    {
      label: LABELS.toggleWalking,
      click: () => sendRendererCommand({ type: 'toggle-walking' })
    },
    {
      label: LABELS.resetPosition,
      click: () => resetWindowPosition()
    },
    {
      label: `${LABELS.startOnLogin}\uff1a${isLoginOpen ? LABELS.enabled : LABELS.disabled}`,
      click: () => toggleLaunchAtLogin(!isLoginOpen)
    },
    { type: 'separator' },
    {
      label: LABELS.openStateFolder,
      click: () => shell.openPath(path.join(os.homedir(), '.boba-agent-coach'))
    },
    {
      label: LABELS.quit,
      click: () => app.quit()
    }
  ]);
}

function showContextMenu() {
  const now = Date.now();
  if (now - lastMenuAt < 250) return;
  lastMenuAt = now;
  buildContextMenu().popup({ window: mainWindow });
}

function launchAgent(agent) {
  const launcher = path.join(PROJECT_ROOT, 'bin', 'boba.cjs');
  const command = `node ${quotePowerShell(launcher)} ${agent}`;
  const child = spawn('powershell.exe', [
    '-NoExit',
    '-Command',
    command
  ], {
    cwd: PROJECT_ROOT,
    detached: true,
    stdio: 'ignore',
    windowsHide: false
  });

  child.on('error', () => {
    sendBubble(LABELS.launchFailed, 'concerned');
  });

  sendBubble(agent === 'claude' ? '\u6b63\u5728\u6253\u5f00 Claude\u3002' : '\u6b63\u5728\u6253\u5f00 Codex\u3002', 'gentle_prompt');
  child.unref();
}

function quotePowerShell(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
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
    sendBubble(`${LABELS.startOnLogin}\uff1a${openAtLogin ? LABELS.enabled : LABELS.disabled}`, 'settled');
  } catch (_error) {
    sendBubble(LABELS.loginFailed, 'concerned');
  }
}

function resetWindowPosition() {
  if (!mainWindow) return;
  const position = getDefaultWindowPosition();
  mainWindow.setPosition(position.x, position.y, false);
  saveWindowPosition();
  sendBubble('\u5df2\u7ecf\u56de\u5230\u5c4f\u5e55\u4e2d\u4e0b\u65b9\u3002', 'settled');
}

function showCodexUsage() {
  const summary = getCodexUsageSummary();
  sendRendererCommand({
    type: 'show-info-panel',
    title: '\u0043\u006f\u0064\u0065\u0078 \u7528\u91cf',
    message: summary.message,
    mood: summary.available ? 'gentle_prompt' : 'concerned'
  });
}

function openCommandBox() {
  if (!mainWindow) return;
  setMousePassthrough(false);
  mainWindow.show();
  mainWindow.focus();
  sendRendererCommand({ type: 'open-command-box' });
}

function openSettingsPanel() {
  if (!mainWindow) return;
  setMousePassthrough(false);
  mainWindow.show();
  mainWindow.focus();
  sendRendererCommand({ type: 'open-settings-panel', settings: config.settings });
}

function showGpuStatus() {
  const status = app.getGPUFeatureStatus();
  const lines = [
    `\u5408\u6210\uff1a${formatGpuStatus(status.gpu_compositing)}`,
    `\u6805\u683c\u5316\uff1a${formatGpuStatus(status.rasterization)}`,
    `WebGL\uff1a${formatGpuStatus(status.webgl)}`,
    `Canvas\uff1a${formatGpuStatus(status.canvas)}`
  ];
  sendRendererCommand({
    type: 'show-info-panel',
    title: '\u663e\u5361\u52a0\u901f',
    message: lines.join('\n'),
    mood: 'gentle_prompt'
  });
}

function formatGpuStatus(value) {
  if (!value) return '\u672a\u77e5';
  const labels = {
    enabled: '\u5df2\u542f\u7528',
    disabled_software: '\u8f6f\u4ef6\u6a21\u5f0f',
    disabled_off: '\u5df2\u5173\u95ed',
    unavailable_software: '\u4ec5\u8f6f\u4ef6\u53ef\u7528',
    unavailable_off: '\u4e0d\u53ef\u7528'
  };
  return labels[value] || value;
}

function sendStateToRenderer(force = false) {
  if (!mainWindow) return;
  mainWindow.webContents.send('desktop-state', {
    ...loadDesktopState(),
    force
  });
}

function sendRendererCommand(command) {
  if (!mainWindow) return;
  mainWindow.webContents.send('desktop-command', command);
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

function setMousePassthrough(shouldPassThrough) {
  if (!mainWindow || isMousePassthrough === shouldPassThrough) return;
  isMousePassthrough = shouldPassThrough;
  mainWindow.setIgnoreMouseEvents(shouldPassThrough, { forward: true });
}

function handlePetCommand(text) {
  const command = String(text || '').trim().toLowerCase();
  if (!command) {
    return { handled: false, message: '\u4f60\u8fd8\u6ca1\u6709\u8f93\u5165\u547d\u4ee4\u3002' };
  }

  if (command.includes('claude')) {
    launchAgent('claude');
    return { handled: true, message: '\u6536\u5230\uff0c\u6211\u53bb\u6253\u5f00 Claude\u3002' };
  }

  if (command.includes('codex') && !command.includes('\u7528\u91cf') && !command.includes('\u4f59\u989d')) {
    launchAgent('codex');
    return { handled: true, message: '\u6536\u5230\uff0c\u6211\u53bb\u6253\u5f00 Codex\u3002' };
  }

  if (command.includes('\u7528\u91cf') || command.includes('\u4f59\u989d') || command.includes('\u8d26\u53f7')) {
    showCodexUsage();
    return { handled: true, message: '\u6536\u5230\uff0c\u6211\u628a Codex \u7528\u91cf\u653e\u5230\u5c0f\u9762\u677f\u91cc\u3002' };
  }

  if (command.includes('\u663e\u5361') || command.includes('gpu') || command.includes('fps') || command.includes('\u5e27\u7387')) {
    showGpuStatus();
    return { handled: true, message: '\u6536\u5230\uff0c\u5df2\u663e\u793a\u663e\u5361\u548c\u5e27\u7387\u72b6\u6001\u3002' };
  }

  if (command.includes('\u56de\u6765') || command.includes('\u91cd\u7f6e') || command.includes('\u5f52\u4f4d')) {
    resetWindowPosition();
    return { handled: true, message: '\u6536\u5230\uff0c\u6211\u56de\u5230\u9ed8\u8ba4\u4f4d\u7f6e\u3002' };
  }

  return {
    handled: false,
    message: '\u6211\u6682\u65f6\u53ea\u61c2\uff1a\u8df3\u821e\u3001\u6682\u505c\u3001\u7ee7\u7eed\u3001\u56de\u6765\u3001\u6253\u5f00 Claude\u3001Codex \u7528\u91cf\u3001\u663e\u5361\u72b6\u6001\u3002'
  };
}

app.whenReady().then(() => {
  createWindow();

  ipcMain.handle('get-state', () => loadDesktopState());
  ipcMain.handle('show-menu', () => {
    showContextMenu();
  });
  ipcMain.handle('save-position', () => {
    saveWindowPosition();
    return true;
  });
  ipcMain.handle('get-window-position', () => {
    return mainWindow ? mainWindow.getPosition() : [0, 0];
  });
  ipcMain.handle('set-window-position', (_event, position) => {
    if (!mainWindow || !position) return false;
    mainWindow.setPosition(Math.round(position.x), Math.round(position.y), false);
    return true;
  });
  ipcMain.handle('get-work-area', () => {
    const display = mainWindow
      ? screen.getDisplayMatching(mainWindow.getBounds())
      : screen.getPrimaryDisplay();
    return display.workArea;
  });
  ipcMain.handle('run-pet-command', (_event, text) => handlePetCommand(text));
  ipcMain.handle('get-config', () => config);
  ipcMain.handle('save-settings', (_event, settings) => {
    config = saveDesktopConfig({
      ...config,
      settings
    });
    return config.settings;
  });
  ipcMain.handle('set-mouse-passthrough', (_event, shouldPassThrough) => {
    setMousePassthrough(Boolean(shouldPassThrough));
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
