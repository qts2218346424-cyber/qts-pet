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
});

test('returns defaults when config is malformed', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'boba-config-bad-'));
  const file = path.join(root, 'config.json');
  fs.writeFileSync(file, 'nope', 'utf8');
  const config = loadDesktopConfig({ configPath: file });
  assert.deepEqual(config.windowPosition, null);
  assert.equal(config.launchAtLogin, false);
});

test('saves and loads config', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'boba-config-good-'));
  const file = path.join(root, 'config.json');
  saveDesktopConfig({
    windowPosition: { x: 10, y: 20 },
    launchAtLogin: true
  }, { configPath: file });
  const config = loadDesktopConfig({ configPath: file });
  assert.deepEqual(config.windowPosition, { x: 10, y: 20 });
  assert.equal(config.launchAtLogin, true);
});
