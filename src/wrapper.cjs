'use strict';

const { spawn } = require('node:child_process');
const { createEventStore } = require('./eventStore.cjs');
const { resolveAgentCommand } = require('./agentResolver.cjs');
const { deriveReminderState } = require('./reminderRules.cjs');

function runWrappedAgent(options) {
  const agent = options.agent;
  const args = options.args || [];
  const cwd = options.cwd || process.cwd();
  const resolver = options.resolver || resolveAgentCommand;
  const stdio = options.stdio || 'inherit';
  const store = createEventStore({ rootDir: options.storeRootDir });
  const resolved = resolver(agent);
  const commandArgs = [...(resolved.args || []), ...args];

  return new Promise((resolve, reject) => {
    let child;
    try {
      child = spawn(resolved.command, commandArgs, {
        cwd,
        shell: resolved.shell,
        stdio
      });
    } catch (error) {
      reject(error);
      return;
    }

    const startedAt = new Date().toISOString();
    const session = store.startSession({
      agent,
      projectPath: cwd,
      pid: child.pid,
      now: startedAt
    });

    const facts = {
      agent,
      projectPath: cwd,
      sessionId: session.sessionId,
      processAlive: true,
      exitCode: null,
      lastOutputAt: startedAt,
      lastInputAt: null,
      now: startedAt
    };

    if (child.stdout) {
      child.stdout.on('data', (chunk) => {
        const at = new Date().toISOString();
        facts.lastOutputAt = at;
        store.appendEvent(session.sessionId, {
          type: 'output_activity',
          at,
          bytes: chunk.length
        });
      });
    }

    if (child.stderr) {
      child.stderr.on('data', (chunk) => {
        const at = new Date().toISOString();
        facts.lastOutputAt = at;
        store.appendEvent(session.sessionId, {
          type: 'output_activity',
          stream: 'stderr',
          at,
          bytes: chunk.length
        });
      });
    }

    child.on('error', reject);

    child.on('exit', (code, signal) => {
      const at = new Date().toISOString();
      facts.processAlive = false;
      facts.exitCode = typeof code === 'number' ? code : 1;
      facts.now = at;
      store.appendEvent(session.sessionId, {
        type: 'session_exited',
        at,
        code,
        signal
      });
      store.updateState(deriveReminderState(facts));
      resolve(facts.exitCode);
    });
  });
}

module.exports = {
  runWrappedAgent
};
