#!/usr/bin/env node
'use strict';

const { formatMessage } = require('../src/messages.cjs');

async function main(argv) {
  const [command, ...args] = argv;

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    printHelp();
    return 0;
  }

  if (command === 'state') {
    const { readCurrentState } = require('../src/eventStore.cjs');
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

  const { runWrappedAgent } = require('../src/wrapper.cjs');
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
