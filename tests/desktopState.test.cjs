'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { loadDesktopState } = require('../src/desktopState.cjs');
const { TEXT } = require('../src/desktopMessages.cjs');

test('returns idle state when file is missing', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'boba-state-missing-'));
  const state = loadDesktopState({ statePath: path.join(root, 'state.json') });
  assert.equal(state.status, 'idle');
  assert.equal(state.message, TEXT.idle);
});

test('returns idle state when file is malformed', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'boba-state-bad-'));
  const file = path.join(root, 'state.json');
  fs.writeFileSync(file, '{bad json', 'utf8');
  const state = loadDesktopState({ statePath: file });
  assert.equal(state.status, 'idle');
  assert.equal(state.message, TEXT.idle);
});

test('loads valid fresh state and adds Chinese message plus mood', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'boba-state-good-'));
  const file = path.join(root, 'state.json');
  fs.writeFileSync(file, JSON.stringify({
    status: 'ready_to_wrap_up',
    messageKey: 'task_ready_to_wrap_up',
    suggestedPetMood: 'settled',
    lastActivityAt: '2026-05-24T10:00:00.000Z'
  }), 'utf8');
  const state = loadDesktopState({
    statePath: file,
    now: '2026-05-24T10:05:00.000Z'
  });
  assert.equal(state.status, 'ready_to_wrap_up');
  assert.equal(state.message, TEXT.wrap);
  assert.equal(state.mood, 'settled');
});

test('treats old agent state as idle so stale dialogue does not linger', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'boba-state-stale-'));
  const file = path.join(root, 'state.json');
  fs.writeFileSync(file, JSON.stringify({
    status: 'ready_to_wrap_up',
    messageKey: 'task_ready_to_wrap_up',
    suggestedPetMood: 'settled',
    lastActivityAt: '2026-05-24T10:00:00.000Z'
  }), 'utf8');
  const state = loadDesktopState({
    statePath: file,
    now: '2026-05-24T11:00:01.000Z',
    staleAfterMs: 30 * 60 * 1000
  });
  assert.equal(state.status, 'idle');
  assert.equal(state.message, TEXT.idle);
  assert.equal(state.stale, true);
});
