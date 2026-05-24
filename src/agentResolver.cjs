'use strict';

const { execFileSync } = require('node:child_process');
const os = require('node:os');

const SUPPORTED_AGENTS = new Set(['claude', 'codex']);
const WINDOWS_COMMAND_PRIORITY = ['.cmd', '.exe', '.ps1', '.bat'];

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

function lookupCommandOnPath(command, options = {}) {
  try {
    const lookupTool = os.platform() === 'win32' ? 'where.exe' : 'which';
    const runLookup = options.execFileSync || execFileSync;
    const output = runLookup(lookupTool, [command], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    });
    const matches = output.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (os.platform() !== 'win32') {
      return matches[0] || null;
    }

    for (const extension of WINDOWS_COMMAND_PRIORITY) {
      const match = matches.find((line) => line.toLowerCase().endsWith(extension));
      if (match) return match;
    }

    return matches[0] || null;
  } catch (_error) {
    return null;
  }
}

function shouldUseShell(command) {
  return os.platform() === 'win32' && /\.(bat|cmd|ps1)$/i.test(command);
}

module.exports = {
  resolveAgentCommand,
  lookupCommandOnPath
};
