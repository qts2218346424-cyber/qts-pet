'use strict';

const MESSAGE_BY_KEY = {
  agent_running: 'Agent 正在工作。',
  agent_waiting_for_user: 'Agent 好像在等你下一步。',
  task_may_be_stuck: '这一步可能卡住了，要不要看一下最近输出？',
  task_ready_to_wrap_up: '看起来可以收尾了：总结、提交，或者记录结果。'
};

const MESSAGE_BY_STATUS = {
  running: MESSAGE_BY_KEY.agent_running,
  waiting_for_user: MESSAGE_BY_KEY.agent_waiting_for_user,
  stuck: MESSAGE_BY_KEY.task_may_be_stuck,
  ready_to_wrap_up: MESSAGE_BY_KEY.task_ready_to_wrap_up,
  idle: 'Boba 正在待命。'
};

const MOOD_BY_STATUS = {
  running: 'working',
  waiting_for_user: 'gentle_prompt',
  stuck: 'concerned',
  ready_to_wrap_up: 'settled',
  idle: 'idle'
};

function getChineseMessage(state) {
  if (!state || typeof state !== 'object') {
    return MESSAGE_BY_STATUS.idle;
  }

  if (state.messageKey && MESSAGE_BY_KEY[state.messageKey]) {
    return MESSAGE_BY_KEY[state.messageKey];
  }

  return MESSAGE_BY_STATUS[state.status] || MESSAGE_BY_STATUS.idle;
}

function getMoodForState(state) {
  if (!state || typeof state !== 'object') {
    return 'idle';
  }

  if (state.suggestedPetMood) {
    return state.suggestedPetMood;
  }

  return MOOD_BY_STATUS[state.status] || 'idle';
}

module.exports = {
  MESSAGE_BY_KEY,
  MESSAGE_BY_STATUS,
  getChineseMessage,
  getMoodForState
};
