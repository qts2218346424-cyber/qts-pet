'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { getChineseMessage, getMoodForState } = require('./desktopMessages.cjs');

const DEFAULT_STALE_AFTER_MS = 30 * 60 * 1000;

function defaultStatePath() {
  return path.join(os.homedir(), '.boba-agent-coach', 'state.json');
}

function loadDesktopState(options = {}) {
  const statePath = options.statePath || defaultStatePath();
  const nowMs = options.now ? Date.parse(options.now) : Date.now();
  const staleAfterMs = options.staleAfterMs || DEFAULT_STALE_AFTER_MS;
  let rawState = null;

  try {
    rawState = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  } catch (_error) {
    rawState = { status: 'idle' };
  }

  if (isStale(rawState, nowMs, staleAfterMs)) {
    rawState = { status: 'idle', stale: true };
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

function isStale(state, nowMs, staleAfterMs) {
  if (!state || state.status === 'idle' || !state.lastActivityAt) {
    return false;
  }

  const lastActivityMs = Date.parse(state.lastActivityAt);
  if (!Number.isFinite(lastActivityMs)) {
    return false;
  }

  return nowMs - lastActivityMs > staleAfterMs;
}

function normalizeStatus(status) {
  const valid = new Set(['running', 'waiting_for_user', 'stuck', 'ready_to_wrap_up', 'idle']);
  return valid.has(status) ? status : 'idle';
}

module.exports = {
  loadDesktopState,
  defaultStatePath,
  normalizeStatus,
  isStale,
  DEFAULT_STALE_AFTER_MS
};
