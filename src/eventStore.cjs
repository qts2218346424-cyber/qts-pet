'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

function defaultRootDir() {
  return path.join(os.homedir(), '.boba-agent-coach');
}

function createEventStore(options = {}) {
  const rootDir = options.rootDir || defaultRootDir();
  const sessionsDir = path.join(rootDir, 'sessions');
  fs.mkdirSync(sessionsDir, { recursive: true });

  function startSession({ agent, projectPath, pid, now = new Date().toISOString() }) {
    const safeNow = now.replace(/[:.]/g, '-');
    const sessionId = `${safeNow}-${agent}`;
    appendEvent(sessionId, {
      type: 'session_started',
      at: now,
      agent,
      projectPath,
      pid
    });
    updateState({
      activeSessionId: sessionId,
      agent,
      projectPath,
      status: 'running',
      lastActivityAt: now,
      suggestedPetMood: 'working',
      messageKey: 'agent_running'
    });
    return { sessionId };
  }

  function appendEvent(sessionId, event) {
    const filePath = path.join(sessionsDir, `${sessionId}.jsonl`);
    const fullEvent = {
      at: event.at || new Date().toISOString(),
      ...event
    };
    fs.appendFileSync(filePath, `${JSON.stringify(fullEvent)}\n`, 'utf8');
  }

  function updateState(state) {
    fs.mkdirSync(rootDir, { recursive: true });
    const filePath = path.join(rootDir, 'state.json');
    fs.writeFileSync(filePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
  }

  return {
    rootDir,
    sessionsDir,
    startSession,
    appendEvent,
    updateState
  };
}

function readCurrentState(options = {}) {
  const rootDir = options.rootDir || defaultRootDir();
  const filePath = path.join(rootDir, 'state.json');
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (_error) {
    return null;
  }
}

module.exports = {
  createEventStore,
  readCurrentState,
  defaultRootDir
};
