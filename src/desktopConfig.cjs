'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const DEFAULT_CONFIG = {
  windowPosition: null,
  launchAtLogin: false,
  settings: {
    showFps: true,
    autoDance: true,
    allowMovement: true,
    showBubbles: true,
    lowPower: false
  }
};

function defaultConfigPath() {
  return path.join(os.homedir(), '.boba-desktop', 'config.json');
}

function loadDesktopConfig(options = {}) {
  const configPath = options.configPath || defaultConfigPath();
  try {
    const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return normalizeConfig(parsed);
  } catch (_error) {
    return { ...DEFAULT_CONFIG };
  }
}

function saveDesktopConfig(config, options = {}) {
  const configPath = options.configPath || defaultConfigPath();
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  const normalized = normalizeConfig(config);
  fs.writeFileSync(configPath, `${JSON.stringify(normalized, null, 2)}\n`, 'utf8');
  return normalized;
}

function normalizeConfig(config) {
  const windowPosition = isValidPosition(config && config.windowPosition)
    ? { x: config.windowPosition.x, y: config.windowPosition.y }
    : null;

  return {
    windowPosition,
    launchAtLogin: Boolean(config && config.launchAtLogin),
    settings: normalizeSettings(config && config.settings)
  };
}

function normalizeSettings(settings) {
  if (!settings || typeof settings !== 'object') {
    return { ...DEFAULT_CONFIG.settings };
  }

  return {
    showFps: settings.showFps !== false,
    autoDance: settings.autoDance !== false,
    allowMovement: settings.allowMovement !== false,
    showBubbles: settings.showBubbles !== false,
    lowPower: Boolean(settings.lowPower)
  };
}

function isValidPosition(value) {
  return value &&
    Number.isFinite(value.x) &&
    Number.isFinite(value.y);
}

module.exports = {
  DEFAULT_CONFIG,
  defaultConfigPath,
  loadDesktopConfig,
  saveDesktopConfig,
  normalizeConfig,
  normalizeSettings
};
