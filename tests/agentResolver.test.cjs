'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { resolveAgentCommand } = require('../src/agentResolver.cjs');

test('resolves claude through injected lookup', () => {
  const result = resolveAgentCommand('claude', {
    lookup(command) {
      assert.equal(command, 'claude');
      return 'C:\\Users\\Example\\AppData\\Roaming\\npm\\claude.ps1';
    }
  });

  assert.deepEqual(result, {
    command: 'C:\\Users\\Example\\AppData\\Roaming\\npm\\claude.ps1',
    args: [],
    shell: true
  });
});

test('resolves codex through injected lookup', () => {
  const result = resolveAgentCommand('codex', {
    lookup(command) {
      assert.equal(command, 'codex');
      return 'C:\\Program Files\\WindowsApps\\OpenAI.Codex\\codex.exe';
    }
  });

  assert.equal(result.command, 'C:\\Program Files\\WindowsApps\\OpenAI.Codex\\codex.exe');
  assert.equal(result.shell, false);
});

test('throws for unsupported agent', () => {
  assert.throws(
    () => resolveAgentCommand('other', { lookup: () => null }),
    /Unsupported agent/
  );
});

test('throws when supported agent is missing', () => {
  assert.throws(
    () => resolveAgentCommand('codex', { lookup: () => null }),
    /Could not find command/
  );
});
