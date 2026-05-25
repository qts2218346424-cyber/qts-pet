'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const {
  loadDesktopConfig,
  saveDesktopConfig
} = require('../src/desktopConfig.cjs');

test('returns defaults when config is missing', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'boba-config-missing-'));
  const config = loadDesktopConfig({ configPath: path.join(root, 'config.json') });
  assert.deepEqual(config.windowPosition, null);
  assert.equal(config.launchAtLogin, false);
  assert.equal(config.settings.showFps, true);
  assert.equal(config.settings.autoDance, true);
  assert.equal(config.settings.allowMovement, true);
  assert.equal(config.settings.showBubbles, true);
  assert.equal(config.settings.lowPower, false);
  assert.equal(config.settings.modelEnabled, false);
  assert.equal(config.settings.modelProtocol, 'openai-compatible');
  assert.equal(config.settings.modelBaseUrl, 'https://api.deepseek.com');
  assert.equal(config.settings.modelName, 'deepseek-v4-flash');
  assert.equal(config.settings.modelApiKey, '');
});

test('returns defaults when config is malformed', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'boba-config-bad-'));
  const file = path.join(root, 'config.json');
  fs.writeFileSync(file, 'nope', 'utf8');
  const config = loadDesktopConfig({ configPath: file });
  assert.deepEqual(config.windowPosition, null);
  assert.equal(config.launchAtLogin, false);
  assert.equal(config.settings.showFps, true);
});

test('saves and loads config', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'boba-config-good-'));
  const file = path.join(root, 'config.json');
  saveDesktopConfig({
    windowPosition: { x: 10, y: 20 },
    launchAtLogin: true,
    settings: {
      showFps: false,
      autoDance: false,
      allowMovement: false,
      showBubbles: false,
      lowPower: true,
      modelEnabled: true,
      modelProtocol: 'anthropic-compatible',
      modelBaseUrl: 'https://api.deepseek.com/anthropic',
      modelName: 'deepseek-v4-pro',
      modelApiKey: 'secret'
    }
  }, { configPath: file });
  const config = loadDesktopConfig({ configPath: file });
  assert.deepEqual(config.windowPosition, { x: 10, y: 20 });
  assert.equal(config.launchAtLogin, true);
  assert.equal(config.settings.showFps, false);
  assert.equal(config.settings.autoDance, false);
  assert.equal(config.settings.allowMovement, false);
  assert.equal(config.settings.showBubbles, false);
  assert.equal(config.settings.lowPower, true);
  assert.equal(config.settings.modelEnabled, true);
  assert.equal(config.settings.modelProtocol, 'anthropic-compatible');
  assert.equal(config.settings.modelBaseUrl, 'https://api.deepseek.com/anthropic');
  assert.equal(config.settings.modelName, 'deepseek-v4-pro');
  assert.equal(config.settings.modelApiKey, 'secret');
});
