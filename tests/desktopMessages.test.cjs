'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { getChineseMessage, getMoodForState } = require('../src/desktopMessages.cjs');

test('maps known message keys to Chinese text', () => {
  assert.equal(
    getChineseMessage({ messageKey: 'agent_waiting_for_user' }),
    'Agent 好像在等你下一步。'
  );
  assert.equal(
    getChineseMessage({ messageKey: 'task_may_be_stuck' }),
    '这一步可能卡住了，要不要看一下最近输出？'
  );
  assert.equal(
    getChineseMessage({ messageKey: 'task_ready_to_wrap_up' }),
    '看起来可以收尾了：总结、提交，或者记录结果。'
  );
});

test('falls back from status when message key is missing', () => {
  assert.equal(getChineseMessage({ status: 'running' }), 'Agent 正在工作。');
  assert.equal(getChineseMessage({ status: 'waiting_for_user' }), 'Agent 好像在等你下一步。');
});

test('returns idle text for unknown state', () => {
  assert.equal(getChineseMessage({ status: 'mystery' }), 'Boba 正在待命。');
  assert.equal(getChineseMessage(null), 'Boba 正在待命。');
});

test('maps state to visual mood', () => {
  assert.equal(getMoodForState({ suggestedPetMood: 'concerned' }), 'concerned');
  assert.equal(getMoodForState({ status: 'ready_to_wrap_up' }), 'settled');
  assert.equal(getMoodForState(null), 'idle');
});
