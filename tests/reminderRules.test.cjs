'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { deriveReminderState } = require('../src/reminderRules.cjs');

test('detects agent waiting for user after quiet window', () => {
  const state = deriveReminderState({
    agent: 'codex',
    projectPath: 'E:\\Study\\desktop-pet',
    sessionId: 's1',
    processAlive: true,
    exitCode: null,
    lastOutputAt: '2026-05-24T12:00:00.000Z',
    lastInputAt: null,
    now: '2026-05-24T12:04:00.000Z'
  });

  assert.equal(state.status, 'waiting_for_user');
  assert.equal(state.messageKey, 'agent_waiting_for_user');
});

test('detects stuck task on non-zero exit', () => {
  const state = deriveReminderState({
    agent: 'claude',
    projectPath: 'E:\\Study\\desktop-pet',
    sessionId: 's2',
    processAlive: false,
    exitCode: 1,
    lastOutputAt: '2026-05-24T12:00:00.000Z',
    lastInputAt: '2026-05-24T12:01:00.000Z',
    now: '2026-05-24T12:01:10.000Z'
  });

  assert.equal(state.status, 'stuck');
  assert.equal(state.messageKey, 'task_may_be_stuck');
});

test('detects wrap-up on successful exit', () => {
  const state = deriveReminderState({
    agent: 'codex',
    projectPath: 'E:\\Study\\desktop-pet',
    sessionId: 's3',
    processAlive: false,
    exitCode: 0,
    lastOutputAt: '2026-05-24T12:00:00.000Z',
    lastInputAt: '2026-05-24T12:01:00.000Z',
    now: '2026-05-24T12:01:10.000Z'
  });

  assert.equal(state.status, 'ready_to_wrap_up');
  assert.equal(state.messageKey, 'task_ready_to_wrap_up');
});

test('keeps running state before quiet window', () => {
  const state = deriveReminderState({
    agent: 'codex',
    projectPath: 'E:\\Study\\desktop-pet',
    sessionId: 's4',
    processAlive: true,
    exitCode: null,
    lastOutputAt: '2026-05-24T12:00:00.000Z',
    lastInputAt: null,
    now: '2026-05-24T12:01:00.000Z'
  });

  assert.equal(state.status, 'running');
  assert.equal(state.messageKey, 'agent_running');
});
