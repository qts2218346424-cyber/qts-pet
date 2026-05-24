# Boba Agent Coach Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a lightweight `boba` command wrapper that launches Claude Code or Codex, records session events, and writes a compact state file for Boba reminders.

**Architecture:** Use a small Node.js CLI with no runtime dependencies. The CLI resolves `claude` or `codex`, launches the selected command, writes JSONL session events, and updates `state.json` through a focused event store and reminder-rule module. The first version exposes state for Boba to consume, but does not yet modify the Petdex pet runtime.

**Tech Stack:** Node.js CommonJS, Node built-in `node:test`, JSON/JSONL files, PowerShell-compatible npm scripts.

---

## File Structure

- Create `package.json`: package metadata, bin entry, test script.
- Create `bin/boba.cjs`: command-line entrypoint for `boba claude`, `boba codex`, and `boba state`.
- Create `src/agentResolver.cjs`: resolves agent commands dynamically.
- Create `src/eventStore.cjs`: owns state directory, JSONL session log, and `state.json` writes.
- Create `src/reminderRules.cjs`: converts session facts into reminder statuses and message keys.
- Create `src/wrapper.cjs`: launches the selected agent and wires process lifecycle to the event store.
- Create `src/messages.cjs`: maps message keys to user-facing text.
- Create `tests/agentResolver.test.cjs`: command resolution tests.
- Create `tests/eventStore.test.cjs`: state and event file tests.
- Create `tests/reminderRules.test.cjs`: reminder rule tests.
- Create `tests/wrapper.test.cjs`: wrapper behavior around child process exits.
- Modify `.gitignore`: ignore generated coach state and package artifacts.

## Task 1: Project Skeleton

**Files:**
- Create: `E:\Study\桌面宠物\package.json`
- Create: `E:\Study\桌面宠物\bin\boba.cjs`
- Create: `E:\Study\桌面宠物\src\messages.cjs`
- Modify: `E:\Study\桌面宠物\.gitignore`

- [ ] **Step 1: Create package metadata**

Write `package.json`:

```json
{
  "name": "boba-agent-coach",
  "version": "0.1.0",
  "private": true,
  "description": "Lightweight Claude Code and Codex work-rhythm wrapper for Boba.",
  "bin": {
    "boba": "bin/boba.cjs"
  },
  "scripts": {
    "test": "node --test tests/*.test.cjs",
    "boba": "node bin/boba.cjs"
  },
  "engines": {
    "node": ">=18"
  },
  "license": "UNLICENSED"
}
```

- [ ] **Step 2: Create the initial CLI entrypoint**

Write `bin/boba.cjs`:

```javascript
#!/usr/bin/env node
'use strict';

const { runWrappedAgent } = require('../src/wrapper.cjs');
const { readCurrentState } = require('../src/eventStore.cjs');
const { formatMessage } = require('../src/messages.cjs');

async function main(argv) {
  const [command, ...args] = argv;

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    printHelp();
    return 0;
  }

  if (command === 'state') {
    const state = readCurrentState();
    if (!state) {
      console.log('Boba has no active agent state yet.');
      return 0;
    }
    console.log(JSON.stringify(state, null, 2));
    if (state.messageKey) {
      console.log(formatMessage(state.messageKey, state));
    }
    return 0;
  }

  if (command !== 'claude' && command !== 'codex') {
    console.error(`Unknown command: ${command}`);
    printHelp();
    return 1;
  }

  return runWrappedAgent({ agent: command, args, cwd: process.cwd() });
}

function printHelp() {
  console.log([
    'Usage:',
    '  boba claude [...args]',
    '  boba codex [...args]',
    '  boba state',
    '',
    'Boba wraps Claude Code or Codex, records lightweight session state,',
    'and leaves a state file for the desktop pet to consume.'
  ].join('\n'));
}

main(process.argv.slice(2))
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error) => {
    console.error(error && error.stack ? error.stack : String(error));
    process.exitCode = 1;
  });
```

- [ ] **Step 3: Create message mapping**

Write `src/messages.cjs`:

```javascript
'use strict';

const MESSAGES = {
  agent_waiting_for_user: {
    zh: 'Agent seems to be waiting for your next step.',
    en: 'Agent seems to be waiting for your next step.'
  },
  task_may_be_stuck: {
    zh: 'This step may be stuck. Check the latest output when you have a moment.',
    en: 'This step may be stuck. Check the latest output when you have a moment.'
  },
  task_ready_to_wrap_up: {
    zh: 'Looks ready to wrap up: summarize, commit, or record the result.',
    en: 'Looks ready to wrap up: summarize, commit, or record the result.'
  },
  agent_running: {
    zh: 'Agent is working.',
    en: 'Agent is working.'
  },
  agent_idle: {
    zh: 'Boba is idle.',
    en: 'Boba is idle.'
  }
};

function formatMessage(messageKey, state = {}, locale = 'en') {
  const entry = MESSAGES[messageKey] || MESSAGES.agent_idle;
  const template = entry[locale] || entry.en;
  return template.replace(/\{agent\}/g, state.agent || 'Agent');
}

module.exports = {
  MESSAGES,
  formatMessage
};
```

- [ ] **Step 4: Ignore generated files**

Write `.gitignore`:

```gitignore
node_modules/
npm-debug.log*
.boba-agent-coach/
.superpowers/brainstorm/
```

- [ ] **Step 5: Run the basic CLI help**

Run:

```powershell
node bin/boba.cjs --help
```

Expected: exit code `0` and output beginning with `Usage:`.

- [ ] **Step 6: Commit**

If the workspace is not a Git repository, initialize it before this first commit:

```powershell
git init
git add package.json bin/boba.cjs src/messages.cjs .gitignore
git commit -m "chore: scaffold boba agent coach cli"
```

Expected: commit succeeds.

## Task 2: Agent Command Resolution

**Files:**
- Create: `E:\Study\桌面宠物\src\agentResolver.cjs`
- Create: `E:\Study\桌面宠物\tests\agentResolver.test.cjs`

- [ ] **Step 1: Write failing command resolution tests**

Write `tests/agentResolver.test.cjs`:

```javascript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npm test -- tests/agentResolver.test.cjs
```

Expected: FAIL because `src/agentResolver.cjs` does not exist.

- [ ] **Step 3: Implement command resolution**

Write `src/agentResolver.cjs`:

```javascript
'use strict';

const { execFileSync } = require('node:child_process');
const os = require('node:os');

const SUPPORTED_AGENTS = new Set(['claude', 'codex']);

function resolveAgentCommand(agent, options = {}) {
  if (!SUPPORTED_AGENTS.has(agent)) {
    throw new Error(`Unsupported agent: ${agent}`);
  }

  const lookup = options.lookup || lookupCommandOnPath;
  const command = lookup(agent);

  if (!command) {
    throw new Error(`Could not find command "${agent}" on PATH.`);
  }

  return {
    command,
    args: [],
    shell: shouldUseShell(command)
  };
}

function lookupCommandOnPath(command) {
  try {
    const lookupTool = os.platform() === 'win32' ? 'where.exe' : 'which';
    const output = execFileSync(lookupTool, [command], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    });
    return output.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)[0] || null;
  } catch (_error) {
    return null;
  }
}

function shouldUseShell(command) {
  return os.platform() === 'win32' && /\.ps1$/i.test(command);
}

module.exports = {
  resolveAgentCommand,
  lookupCommandOnPath
};
```

- [ ] **Step 4: Run command resolution tests**

Run:

```powershell
node --test tests/agentResolver.test.cjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```powershell
git add src/agentResolver.cjs tests/agentResolver.test.cjs
git commit -m "feat: resolve wrapped agent commands"
```

Expected: commit succeeds.

## Task 3: Event Store And State File

**Files:**
- Create: `E:\Study\桌面宠物\src\eventStore.cjs`
- Create: `E:\Study\桌面宠物\tests\eventStore.test.cjs`

- [ ] **Step 1: Write failing event store tests**

Write `tests/eventStore.test.cjs`:

```javascript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
node --test tests/eventStore.test.cjs
```

Expected: FAIL because `src/eventStore.cjs` does not exist.

- [ ] **Step 3: Implement event store**

Write `src/eventStore.cjs`:

```javascript
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
```

- [ ] **Step 4: Run event store tests**

Run:

```powershell
node --test tests/eventStore.test.cjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```powershell
git add src/eventStore.cjs tests/eventStore.test.cjs
git commit -m "feat: persist boba agent session state"
```

Expected: commit succeeds.

## Task 4: Reminder Rules

**Files:**
- Create: `E:\Study\桌面宠物\src\reminderRules.cjs`
- Create: `E:\Study\桌面宠物\tests\reminderRules.test.cjs`

- [ ] **Step 1: Write failing reminder-rule tests**

Write `tests/reminderRules.test.cjs`:

```javascript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
node --test tests/reminderRules.test.cjs
```

Expected: FAIL because `src/reminderRules.cjs` does not exist.

- [ ] **Step 3: Implement reminder rules**

Write `src/reminderRules.cjs`:

```javascript
'use strict';

const WAITING_QUIET_MS = 3 * 60 * 1000;
const LONG_QUIET_MS = 15 * 60 * 1000;

function deriveReminderState(input) {
  const nowMs = Date.parse(input.now || new Date().toISOString());
  const lastOutputMs = input.lastOutputAt ? Date.parse(input.lastOutputAt) : null;
  const lastInputMs = input.lastInputAt ? Date.parse(input.lastInputAt) : null;

  if (input.processAlive === false && input.exitCode && input.exitCode !== 0) {
    return baseState(input, {
      status: 'stuck',
      suggestedPetMood: 'concerned',
      messageKey: 'task_may_be_stuck'
    });
  }

  if (input.processAlive === false && input.exitCode === 0) {
    return baseState(input, {
      status: 'ready_to_wrap_up',
      suggestedPetMood: 'settled',
      messageKey: 'task_ready_to_wrap_up'
    });
  }

  if (input.processAlive && lastOutputMs && nowMs - lastOutputMs >= LONG_QUIET_MS) {
    return baseState(input, {
      status: 'stuck',
      suggestedPetMood: 'concerned',
      messageKey: 'task_may_be_stuck'
    });
  }

  if (input.processAlive && lastOutputMs && nowMs - lastOutputMs >= WAITING_QUIET_MS) {
    if (!lastInputMs || lastInputMs < lastOutputMs) {
      return baseState(input, {
        status: 'waiting_for_user',
        suggestedPetMood: 'gentle_prompt',
        messageKey: 'agent_waiting_for_user'
      });
    }
  }

  return baseState(input, {
    status: 'running',
    suggestedPetMood: 'working',
    messageKey: 'agent_running'
  });
}

function baseState(input, override) {
  return {
    activeSessionId: input.sessionId,
    agent: input.agent,
    projectPath: input.projectPath,
    status: override.status,
    lastActivityAt: input.lastOutputAt || input.lastInputAt || input.now || new Date().toISOString(),
    suggestedPetMood: override.suggestedPetMood,
    messageKey: override.messageKey
  };
}

module.exports = {
  deriveReminderState,
  WAITING_QUIET_MS,
  LONG_QUIET_MS
};
```

- [ ] **Step 4: Run reminder rule tests**

Run:

```powershell
node --test tests/reminderRules.test.cjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```powershell
git add src/reminderRules.cjs tests/reminderRules.test.cjs
git commit -m "feat: derive boba reminder states"
```

Expected: commit succeeds.

## Task 5: Wrapper Process Lifecycle

**Files:**
- Create: `E:\Study\桌面宠物\src\wrapper.cjs`
- Create: `E:\Study\桌面宠物\tests\wrapper.test.cjs`
- Modify: `E:\Study\桌面宠物\bin\boba.cjs`

- [ ] **Step 1: Write failing wrapper tests**

Write `tests/wrapper.test.cjs`:

```javascript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
node --test tests/wrapper.test.cjs
```

Expected: FAIL because `src/wrapper.cjs` does not exist.

- [ ] **Step 3: Implement wrapper lifecycle**

Write `src/wrapper.cjs`:

```javascript
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
```

- [ ] **Step 4: Run wrapper tests**

Run:

```powershell
node --test tests/wrapper.test.cjs
```

Expected: PASS.

- [ ] **Step 5: Run the full test suite**

Run:

```powershell
npm test
```

Expected: all tests PASS.

- [ ] **Step 6: Commit**

Run:

```powershell
git add src/wrapper.cjs tests/wrapper.test.cjs bin/boba.cjs
git commit -m "feat: wrap agent process lifecycle"
```

Expected: commit succeeds.

## Task 6: Manual Verification And Pet State Contract

**Files:**
- Create: `E:\Study\桌面宠物\docs\boba-state-contract.md`
- Modify: `E:\Study\桌面宠物\README.md`

- [ ] **Step 1: Document the pet-facing state contract**

Write `docs/boba-state-contract.md`:

```markdown
# Boba State Contract

Boba Agent Coach writes a compact state file for desktop-pet consumers.

Default path:

```text
~/.boba-agent-coach/state.json
```

Example:

```json
{
  "activeSessionId": "2026-05-24T12-30-00-000Z-codex",
  "agent": "codex",
  "projectPath": "E:\\Study\\desktop-pet",
  "status": "ready_to_wrap_up",
  "lastActivityAt": "2026-05-24T12:34:00.000Z",
  "suggestedPetMood": "settled",
  "messageKey": "task_ready_to_wrap_up"
}
```

Valid `status` values:

- `running`
- `waiting_for_user`
- `stuck`
- `ready_to_wrap_up`

Valid `messageKey` values:

- `agent_running`
- `agent_waiting_for_user`
- `task_may_be_stuck`
- `task_ready_to_wrap_up`

Pet consumers should ignore unknown fields and fall back to idle behavior when this file is missing or malformed.
```

- [ ] **Step 2: Add a short README**

Write `README.md`:

```markdown
# Boba Agent Coach

Boba Agent Coach is a lightweight command wrapper for Claude Code and Codex. It records local session state so a desktop pet can show calm work-rhythm reminders.

## Usage

```powershell
npm run boba -- codex
npm run boba -- claude
npm run boba -- state
```

After packaging the CLI, the intended commands are:

```powershell
boba codex
boba claude
boba state
```

## First-Version Reminders

- Agent is waiting for the user.
- Task may be stuck.
- Task is ready to wrap up.

See `docs/boba-state-contract.md` for the pet-facing state file.
```

- [ ] **Step 3: Run full tests**

Run:

```powershell
npm test
```

Expected: all tests PASS.

- [ ] **Step 4: Manually verify state command**

Run:

```powershell
npm run boba -- state
```

Expected: either `Boba has no active agent state yet.` or pretty-printed JSON from the current state file.

- [ ] **Step 5: Manually verify a fake wrapped Codex process**

Run:

```powershell
node -e "const { runWrappedAgent } = require('./src/wrapper.cjs'); runWrappedAgent({ agent: 'codex', cwd: process.cwd(), resolver: () => ({ command: process.execPath, args: ['-e', 'console.log(`done`)'], shell: false }), stdio: 'inherit' }).then(code => process.exit(code))"
```

Expected: command exits `0`; `~/.boba-agent-coach/state.json` has `status` equal to `ready_to_wrap_up`.

- [ ] **Step 6: Commit**

Run:

```powershell
git add README.md docs/boba-state-contract.md
git commit -m "docs: describe boba state contract"
```

Expected: commit succeeds.

## Self-Review

Spec coverage:

- Wrapper commands `boba claude` and `boba codex`: covered by Tasks 1, 2, and 5.
- Dynamic command resolution: covered by Task 2.
- Event log and `state.json`: covered by Task 3.
- Reminder rules for waiting, stuck, and wrap-up: covered by Task 4.
- Restrained pet-facing state contract: covered by Task 6.
- Error handling for missing command and malformed state: covered by Tasks 2 and 3.
- Testing strategy: covered across Tasks 2 through 6.

Completeness scan:

- Every implementation step includes concrete file contents, commands, and expected outcomes.

Type consistency:

- `activeSessionId`, `agent`, `projectPath`, `status`, `lastActivityAt`, `suggestedPetMood`, and `messageKey` are consistent across event store, rules, tests, and contract.
