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
