'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const {
  createEventStore,
  readCurrentState
} = require('../src/eventStore.cjs');

test('creates state and appends session events', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'boba-store-'));
  const store = createEventStore({ rootDir: root });

  const session = store.startSession({
    agent: 'codex',
    projectPath: 'E:\\Study\\desktop-pet',
    pid: 1234,
    now: '2026-05-24T12:30:00.000+08:00'
  });

  store.appendEvent(session.sessionId, {
    type: 'output_activity',
    at: '2026-05-24T12:31:00.000+08:00'
  });

  store.updateState({
    activeSessionId: session.sessionId,
    agent: 'codex',
    projectPath: 'E:\\Study\\desktop-pet',
    status: 'running',
    lastActivityAt: '2026-05-24T12:31:00.000+08:00',
    suggestedPetMood: 'working',
    messageKey: 'agent_running'
  });

  const state = JSON.parse(fs.readFileSync(path.join(root, 'state.json'), 'utf8'));
  assert.equal(state.agent, 'codex');
  assert.equal(state.status, 'running');

  const log = fs.readFileSync(path.join(root, 'sessions', `${session.sessionId}.jsonl`), 'utf8');
  const lines = log.trim().split(/\r?\n/).map((line) => JSON.parse(line));
  assert.equal(lines[0].type, 'session_started');
  assert.equal(lines[1].type, 'output_activity');
});

test('readCurrentState returns null for missing state file', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'boba-empty-'));
  assert.equal(readCurrentState({ rootDir: root }), null);
});
