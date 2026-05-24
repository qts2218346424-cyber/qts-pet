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
