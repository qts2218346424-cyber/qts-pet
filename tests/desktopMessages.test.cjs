'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { getChineseMessage, getMoodForState, TEXT } = require('../src/desktopMessages.cjs');

test('maps known message keys to Chinese text', () => {
  assert.equal(getChineseMessage({ messageKey: 'agent_waiting_for_user' }), TEXT.waiting);
  assert.equal(getChineseMessage({ messageKey: 'task_may_be_stuck' }), TEXT.stuck);
  assert.equal(getChineseMessage({ messageKey: 'task_ready_to_wrap_up' }), TEXT.wrap);
});

test('falls back from status when message key is missing', () => {
  assert.equal(getChineseMessage({ status: 'running' }), TEXT.running);
  assert.equal(getChineseMessage({ status: 'waiting_for_user' }), TEXT.waiting);
});

test('returns idle text for unknown state', () => {
  assert.equal(getChineseMessage({ status: 'mystery' }), TEXT.idle);
  assert.equal(getChineseMessage(null), TEXT.idle);
});

test('maps state to visual mood', () => {
  assert.equal(getMoodForState({ suggestedPetMood: 'concerned' }), 'concerned');
  assert.equal(getMoodForState({ status: 'ready_to_wrap_up' }), 'settled');
  assert.equal(getMoodForState(null), 'idle');
});
