'use strict';

const WAITING_QUIET_MS = 3 * 60 * 1000;
const LONG_QUIET_MS = 15 * 60 * 1000;

function deriveReminderState(input) {
  const nowMs = Date.parse(input.now || new Date().toISOString());
  const lastOutputMs = input.lastOutputAt ? Date.parse(input.lastOutputAt) : null;
  const lastInputMs = input.lastInputAt ? Date.parse(input.lastInputAt) : null;

  if (input.processAlive === false && input.exitCode && input.exitCode !== 0) {
    return baseState(input, {
      status: 'stuck',
      suggestedPetMood: 'concerned',
      messageKey: 'task_may_be_stuck'
    });
  }

  if (input.processAlive === false && input.exitCode === 0) {
    return baseState(input, {
      status: 'ready_to_wrap_up',
      suggestedPetMood: 'settled',
      messageKey: 'task_ready_to_wrap_up'
    });
  }

  if (input.processAlive && lastOutputMs && nowMs - lastOutputMs >= LONG_QUIET_MS) {
    return baseState(input, {
      status: 'stuck',
      suggestedPetMood: 'concerned',
      messageKey: 'task_may_be_stuck'
    });
  }

  if (input.processAlive && lastOutputMs && nowMs - lastOutputMs >= WAITING_QUIET_MS) {
    if (!lastInputMs || lastInputMs < lastOutputMs) {
      return baseState(input, {
        status: 'waiting_for_user',
        suggestedPetMood: 'gentle_prompt',
        messageKey: 'agent_waiting_for_user'
      });
    }
  }

  return baseState(input, {
    status: 'running',
    suggestedPetMood: 'working',
    messageKey: 'agent_running'
  });
}

function baseState(input, override) {
  return {
    activeSessionId: input.sessionId,
    agent: input.agent,
    projectPath: input.projectPath,
    status: override.status,
    lastActivityAt: input.lastOutputAt || input.lastInputAt || input.now || new Date().toISOString(),
    suggestedPetMood: override.suggestedPetMood,
    messageKey: override.messageKey
  };
}

module.exports = {
  deriveReminderState,
  WAITING_QUIET_MS,
  LONG_QUIET_MS
};
