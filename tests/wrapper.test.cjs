'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { runWrappedAgent } = require('../src/wrapper.cjs');

test('records successful wrapped process exit', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'boba-wrapper-success-'));
  const code = await runWrappedAgent({
    agent: 'codex',
    args: [],
    cwd: process.cwd(),
    storeRootDir: root,
    resolver: () => ({
      command: process.execPath,
      args: ['-e', 'console.log("done")'],
      shell: false
    }),
    stdio: 'pipe'
  });

  assert.equal(code, 0);
  const state = JSON.parse(fs.readFileSync(path.join(root, 'state.json'), 'utf8'));
  assert.equal(state.status, 'ready_to_wrap_up');
  assert.equal(state.messageKey, 'task_ready_to_wrap_up');
});

test('records failed wrapped process exit', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'boba-wrapper-fail-'));
  const code = await runWrappedAgent({
    agent: 'claude',
    args: [],
    cwd: process.cwd(),
    storeRootDir: root,
    resolver: () => ({
      command: process.execPath,
      args: ['-e', 'process.exit(7)'],
      shell: false
    }),
    stdio: 'pipe'
  });

  assert.equal(code, 7);
  const state = JSON.parse(fs.readFileSync(path.join(root, 'state.json'), 'utf8'));
  assert.equal(state.status, 'stuck');
  assert.equal(state.messageKey, 'task_may_be_stuck');
});
