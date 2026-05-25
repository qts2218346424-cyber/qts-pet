'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const {
  askPetModel,
  extractAnthropicCompatibleText,
  extractOpenAICompatibleText,
  normalizeBaseUrl,
  normalizeModelSettings,
  parseModelCommand
} = require('../src/modelClient.cjs');

test('normalizes model settings with DeepSeek defaults', () => {
  const settings = normalizeModelSettings({});
  assert.equal(settings.modelEnabled, false);
  assert.equal(settings.modelProtocol, 'openai-compatible');
  assert.equal(settings.modelBaseUrl, 'https://api.deepseek.com');
  assert.equal(settings.modelName, 'deepseek-v4-flash');
  assert.equal(settings.modelApiKey, '');
});

test('extracts OpenAI-compatible text', () => {
  const text = extractOpenAICompatibleText({
    choices: [
      { message: { content: '{"reply":"ok","action":"dance"}' } }
    ]
  });
  assert.equal(text, '{"reply":"ok","action":"dance"}');
});

test('extracts Anthropic-compatible text blocks', () => {
  const text = extractAnthropicCompatibleText({
    content: [
      { type: 'text', text: '{"reply":"hello","action":"none"}' },
      { type: 'tool_use', text: 'ignored' }
    ]
  });
  assert.equal(text, '{"reply":"hello","action":"none"}');
});

test('parses allowed model actions and blocks unknown actions', () => {
  assert.deepEqual(parseModelCommand('{"reply":"dance now","action":"dance"}'), {
    reply: 'dance now',
    action: 'dance'
  });
  assert.deepEqual(parseModelCommand('{"reply":"cannot open apps","action":"open_codex"}'), {
    reply: 'cannot open apps',
    action: 'none'
  });
});

test('returns clear message when model is disabled or key is missing', async () => {
  const disabled = await askPetModel('hello', {
    settings: { modelEnabled: false }
  });
  assert.equal(disabled.ok, false);
  assert.match(disabled.message, /\u6a21\u578b\u80fd\u529b/);

  const noKey = await askPetModel('hello', {
    settings: { modelEnabled: true, modelApiKey: '' }
  });
  assert.equal(noKey.ok, false);
  assert.match(noKey.message, /API Key/);
});

test('calls OpenAI-compatible chat completions endpoint', async () => {
  const result = await askPetModel('say hi', {
    settings: {
      modelEnabled: true,
      modelProtocol: 'openai-compatible',
      modelBaseUrl: 'https://api.deepseek.com/',
      modelName: 'deepseek-v4-flash',
      modelApiKey: 'test-key'
    },
    fetchImpl: async (url, options) => {
      assert.equal(url, 'https://api.deepseek.com/chat/completions');
      assert.equal(options.method, 'POST');
      assert.equal(options.headers.Authorization, 'Bearer test-key');
      const body = JSON.parse(options.body);
      assert.equal(body.model, 'deepseek-v4-flash');
      assert.equal(body.messages[1].content, 'say hi');
      return {
        ok: true,
        json: async () => ({
          choices: [
            { message: { content: '{"reply":"hi","action":"none"}' } }
          ]
        })
      };
    }
  });

  assert.deepEqual(result, {
    ok: true,
    message: 'hi',
    action: 'none'
  });
});

test('calls Anthropic-compatible messages endpoint', async () => {
  const result = await askPetModel('dance', {
    settings: {
      modelEnabled: true,
      modelProtocol: 'anthropic-compatible',
      modelBaseUrl: 'https://api.deepseek.com/anthropic',
      modelName: 'deepseek-v4-flash',
      modelApiKey: 'test-key'
    },
    fetchImpl: async (url, options) => {
      assert.equal(url, 'https://api.deepseek.com/anthropic/messages');
      assert.equal(options.method, 'POST');
      assert.equal(options.headers['x-api-key'], 'test-key');
      const body = JSON.parse(options.body);
      assert.equal(body.model, 'deepseek-v4-flash');
      assert.equal(body.messages[0].content, 'dance');
      return {
        ok: true,
        json: async () => ({
          content: [
            { type: 'text', text: '{"reply":"dancing","action":"dance"}' }
          ]
        })
      };
    }
  });

  assert.deepEqual(result, {
    ok: true,
    message: 'dancing',
    action: 'dance'
  });
});

test('normalizes base url by removing trailing slash', () => {
  assert.equal(normalizeBaseUrl('https://api.deepseek.com/'), 'https://api.deepseek.com');
});
