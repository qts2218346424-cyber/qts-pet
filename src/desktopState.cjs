'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { getChineseMessage, getMoodForState } = require('./desktopMessages.cjs');

function defaultStatePath() {
  return path.join(os.homedir(), '.boba-agent-coach', 'state.json');
}

function loadDesktopState(options = {}) {
  const statePath = options.statePath || defaultStatePath();
  let rawState = null;

  try {
    rawState = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  } catch (_error) {
    rawState = { status: 'idle' };
  }

  const status = normalizeStatus(rawState.status);
  const normalized = {
    ...rawState,
    status,
    message: getChineseMessage({ ...rawState, status }),
    mood: getMoodForState({ ...rawState, status })
  };

  return normalized;
}

function normalizeStatus(status) {
  const valid = new Set(['running', 'waiting_for_user', 'stuck', 'ready_to_wrap_up', 'idle']);
  return valid.has(status) ? status : 'idle';
}

module.exports = {
  loadDesktopState,
  defaultStatePath,
  normalizeStatus
};
