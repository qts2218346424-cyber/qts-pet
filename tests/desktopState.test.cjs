'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { loadDesktopState } = require('../src/desktopState.cjs');

test('returns idle state when file is missing', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'boba-state-missing-'));
  const state = loadDesktopState({ statePath: path.join(root, 'state.json') });
  assert.equal(state.status, 'idle');
  assert.equal(state.message, 'Boba 正在待命。');
});

test('returns idle state when file is malformed', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'boba-state-bad-'));
  const file = path.join(root, 'state.json');
  fs.writeFileSync(file, '{bad json', 'utf8');
  const state = loadDesktopState({ statePath: file });
  assert.equal(state.status, 'idle');
  assert.equal(state.message, 'Boba 正在待命。');
});

test('loads valid state and adds Chinese message plus mood', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'boba-state-good-'));
  const file = path.join(root, 'state.json');
  fs.writeFileSync(file, JSON.stringify({
    status: 'ready_to_wrap_up',
    messageKey: 'task_ready_to_wrap_up',
    suggestedPetMood: 'settled'
  }), 'utf8');
  const state = loadDesktopState({ statePath: file });
  assert.equal(state.status, 'ready_to_wrap_up');
  assert.equal(state.message, '看起来可以收尾了：总结、提交，或者记录结果。');
  assert.equal(state.mood, 'settled');
});
