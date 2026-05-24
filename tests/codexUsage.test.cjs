'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const {
  formatCloudAccess,
  getCodexUsageSummary
} = require('../src/codexUsage.cjs');

test('returns unavailable when Codex state is missing', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'boba-codex-missing-'));
  const summary = getCodexUsageSummary({ statePath: path.join(root, 'missing.json') });
  assert.equal(summary.available, false);
  assert.match(summary.message, /没有找到 Codex 本地状态文件/);
});

test('extracts Codex local status without requiring valid JSON', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'boba-codex-state-'));
  const file = path.join(root, 'state.json');
  fs.writeFileSync(file, '{"codexCloudAccess":"enabled_needs_setup","default-service-tier":"pro", broken', 'utf8');

  const summary = getCodexUsageSummary({ statePath: file });
  assert.equal(summary.available, true);
  assert.equal(summary.cloudAccess, 'enabled_needs_setup');
  assert.equal(summary.serviceTier, 'pro');
  assert.match(summary.message, /Codex 余额：本地无法读取/);
  assert.match(summary.message, /云端状态：已启用，仍需完成设置/);
});

test('formats unknown cloud access values as-is', () => {
  assert.equal(formatCloudAccess('custom_state'), 'custom_state');
});
