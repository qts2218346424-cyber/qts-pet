'use strict';

const DEFAULT_MODEL_SETTINGS = {
  modelEnabled: false,
  modelProtocol: 'openai-compatible',
  modelBaseUrl: 'https://api.deepseek.com',
  modelName: 'deepseek-v4-flash',
  modelApiKey: ''
};

const ALLOWED_MODEL_ACTIONS = new Set([
  'dance',
  'pause',
  'resume',
  'look_side',
  'reset_position',
  'none'
]);

const MESSAGES = {
  empty: '\u4f60\u8fd8\u6ca1\u6709\u8f93\u5165\u5185\u5bb9\u3002',
  disabled: '\u6a21\u578b\u80fd\u529b\u8fd8\u6ca1\u6709\u5f00\u542f\uff0c\u8bf7\u5728\u8bbe\u7f6e\u7ba1\u7406\u91cc\u6253\u5f00\u3002',
  missingKey: '\u8fd8\u6ca1\u6709\u586b\u5199\u6a21\u578b API Key\uff0c\u8bf7\u5728\u8bbe\u7f6e\u7ba1\u7406\u91cc\u4fdd\u5b58\u3002',
  noFetch: '\u5f53\u524d\u73af\u5883\u4e0d\u652f\u6301\u7f51\u7edc\u8bf7\u6c42\uff0c\u6682\u65f6\u65e0\u6cd5\u8fde\u63a5\u6a21\u578b\u3002',
  emptyReply: '\u6211\u6ca1\u60f3\u597d\u600e\u4e48\u56de\u7b54\u3002',
  noText: '\u6a21\u578b\u6ca1\u6709\u8fd4\u56de\u6587\u5b57\u5185\u5bb9\u3002'
};

const PET_SYSTEM_PROMPT = [
  'You are a Chinese desktop pet assistant shaped like a cute, silly yellow dragon.',
  'Reply in Simplified Chinese, briefly and warmly.',
  'Return only JSON with this shape: {"reply":"...","action":"dance|pause|resume|look_side|reset_position|none"}.',
  'Only choose pet actions from the enum. Do not launch apps, edit files, run shell commands, or claim computer actions were done.',
  'If the user asks for unsafe or unsupported computer control, set action to "none" and explain briefly.'
].join('\n');

function normalizeModelSettings(settings = {}) {
  const protocol = settings.modelProtocol === 'anthropic-compatible'
    ? 'anthropic-compatible'
    : 'openai-compatible';

  return {
    modelEnabled: Boolean(settings.modelEnabled),
    modelProtocol: protocol,
    modelBaseUrl: cleanString(settings.modelBaseUrl) || DEFAULT_MODEL_SETTINGS.modelBaseUrl,
    modelName: cleanString(settings.modelName) || DEFAULT_MODEL_SETTINGS.modelName,
    modelApiKey: cleanString(settings.modelApiKey)
  };
}

async function askPetModel(prompt, options = {}) {
  const text = cleanString(prompt);
  if (!text) {
    return { ok: false, message: MESSAGES.empty, action: 'none' };
  }

  const settings = normalizeModelSettings(options.settings || options.config);
  if (!settings.modelEnabled) {
    return { ok: false, message: MESSAGES.disabled, action: 'none' };
  }
  if (!settings.modelApiKey) {
    return { ok: false, message: MESSAGES.missingKey, action: 'none' };
  }

  const fetchImpl = options.fetchImpl || globalThis.fetch;
  if (typeof fetchImpl !== 'function') {
    return { ok: false, message: MESSAGES.noFetch, action: 'none' };
  }

  let raw;
  try {
    raw = settings.modelProtocol === 'anthropic-compatible'
      ? await requestAnthropicCompatible(text, settings, fetchImpl, options)
      : await requestOpenAICompatible(text, settings, fetchImpl, options);
  } catch (error) {
    return {
      ok: false,
      message: `\u6a21\u578b\u8bf7\u6c42\u5f02\u5e38\uff1a${cleanString(error && error.message) || '\u672a\u77e5\u9519\u8bef'}`,
      action: 'none'
    };
  }

  if (!raw.ok) return raw;

  const parsed = parseModelCommand(raw.message);
  return {
    ok: true,
    message: parsed.reply,
    action: parsed.action
  };
}

async function requestOpenAICompatible(text, settings, fetchImpl, options) {
  const response = await fetchImpl(`${normalizeBaseUrl(settings.modelBaseUrl)}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${settings.modelApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: settings.modelName,
      messages: [
        { role: 'system', content: options.systemPrompt || PET_SYSTEM_PROMPT },
        { role: 'user', content: text }
      ],
      temperature: options.temperature ?? 0.4,
      max_tokens: options.maxTokens || 220
    })
  });

  if (!response.ok) {
    return { ok: false, message: `\u6a21\u578b\u8fde\u63a5\u5931\u8d25\uff1a${response.status}`, action: 'none' };
  }

  const data = await parseJsonResponse(response);
  if (!data.ok) return data;

  return {
    ok: true,
    message: extractOpenAICompatibleText(data.value),
    action: 'none'
  };
}

async function requestAnthropicCompatible(text, settings, fetchImpl, options) {
  const response = await fetchImpl(buildAnthropicMessagesUrl(settings.modelBaseUrl), {
    method: 'POST',
    headers: {
      'x-api-key': settings.modelApiKey,
      Authorization: `Bearer ${settings.modelApiKey}`,
      'anthropic-version': options.anthropicVersion || '2023-06-01',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: settings.modelName,
      system: options.systemPrompt || PET_SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: text }
      ],
      max_tokens: options.maxTokens || 220
    })
  });

  if (!response.ok) {
    return { ok: false, message: `\u6a21\u578b\u8fde\u63a5\u5931\u8d25\uff1a${response.status}`, action: 'none' };
  }

  const data = await parseJsonResponse(response);
  if (!data.ok) return data;

  return {
    ok: true,
    message: extractAnthropicCompatibleText(data.value),
    action: 'none'
  };
}

function parseModelCommand(rawText) {
  const fallback = cleanString(rawText);
  const jsonText = stripJsonFence(fallback);

  try {
    const parsed = JSON.parse(jsonText);
    const action = ALLOWED_MODEL_ACTIONS.has(parsed.action) ? parsed.action : 'none';
    return {
      reply: cleanString(parsed.reply) || fallback || MESSAGES.emptyReply,
      action
    };
  } catch (_error) {
    return {
      reply: fallback || MESSAGES.noText,
      action: 'none'
    };
  }
}

function extractOpenAICompatibleText(data) {
  return cleanString(data && data.choices &&
    data.choices[0] &&
    data.choices[0].message &&
    data.choices[0].message.content);
}

function extractAnthropicCompatibleText(data) {
  if (!data || !Array.isArray(data.content)) return '';
  return data.content
    .filter((item) => item && item.type === 'text' && typeof item.text === 'string')
    .map((item) => item.text)
    .join('\n')
    .trim();
}

function normalizeBaseUrl(value) {
  return (cleanString(value) || DEFAULT_MODEL_SETTINGS.modelBaseUrl).replace(/\/+$/u, '');
}

function buildAnthropicMessagesUrl(value) {
  const baseUrl = normalizeBaseUrl(value);
  return baseUrl.endsWith('/v1') ? `${baseUrl}/messages` : `${baseUrl}/v1/messages`;
}

async function parseJsonResponse(response) {
  try {
    return { ok: true, value: await response.json() };
  } catch (_error) {
    return {
      ok: false,
      message: '\u6a21\u578b\u8fd4\u56de\u7684\u4e0d\u662f JSON\uff0c\u8bf7\u68c0\u67e5\u534f\u8bae\u548c Base URL\u3002',
      action: 'none'
    };
  }
}

function stripJsonFence(value) {
  return cleanString(value)
    .replace(/^```(?:json)?\s*/iu, '')
    .replace(/\s*```$/u, '')
    .trim();
}

function cleanString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

module.exports = {
  DEFAULT_MODEL_SETTINGS,
  ALLOWED_MODEL_ACTIONS,
  askPetModel,
  extractAnthropicCompatibleText,
  extractOpenAICompatibleText,
  buildAnthropicMessagesUrl,
  normalizeBaseUrl,
  normalizeModelSettings,
  parseModelCommand
};
