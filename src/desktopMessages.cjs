'use strict';

const TEXT = {
  idle: '\u0042\u006f\u0062\u0061 \u6b63\u5728\u5f85\u547d\u3002',
  running: '\u0041\u0067\u0065\u006e\u0074 \u6b63\u5728\u5de5\u4f5c\u3002',
  waiting: '\u0041\u0067\u0065\u006e\u0074 \u597d\u50cf\u5728\u7b49\u4f60\u4e0b\u4e00\u6b65\u3002',
  stuck: '\u8fd9\u4e00\u6b65\u53ef\u80fd\u5361\u4f4f\u4e86\uff0c\u8981\u4e0d\u8981\u770b\u4e00\u4e0b\u6700\u8fd1\u8f93\u51fa\uff1f',
  wrap: '\u770b\u8d77\u6765\u53ef\u4ee5\u6536\u5c3e\u4e86\uff1a\u603b\u7ed3\u3001\u63d0\u4ea4\uff0c\u6216\u8005\u8bb0\u5f55\u7ed3\u679c\u3002'
};

const MESSAGE_BY_KEY = {
  agent_running: TEXT.running,
  agent_waiting_for_user: TEXT.waiting,
  task_may_be_stuck: TEXT.stuck,
  task_ready_to_wrap_up: TEXT.wrap
};

const MESSAGE_BY_STATUS = {
  running: TEXT.running,
  waiting_for_user: TEXT.waiting,
  stuck: TEXT.stuck,
  ready_to_wrap_up: TEXT.wrap,
  idle: TEXT.idle
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
  TEXT,
  MESSAGE_BY_KEY,
  MESSAGE_BY_STATUS,
  getChineseMessage,
  getMoodForState
};
