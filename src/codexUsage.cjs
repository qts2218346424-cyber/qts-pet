'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const CLOUD_ACCESS_LABELS = {
  enabled: '已启用',
  enabled_needs_setup: '已启用，仍需完成设置',
  disabled: '未启用'
};

function getDefaultCodexStatePath() {
  return path.join(os.homedir(), '.codex', '.codex-global-state.json');
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractStringValue(raw, key) {
  const match = raw.match(new RegExp(`"${escapeRegExp(key)}"\\s*:\\s*"([^"]*)"`, 'u'));
  return match ? match[1] : null;
}

function extractNullableStringValue(raw, key) {
  const stringValue = extractStringValue(raw, key);
  if (stringValue) return stringValue;
  return raw.match(new RegExp(`"${escapeRegExp(key)}"\\s*:\\s*null`, 'u')) ? null : undefined;
}

function formatCloudAccess(value) {
  if (!value) return '未发现';
  return CLOUD_ACCESS_LABELS[value] || value;
}

function getCodexUsageSummary(options = {}) {
  const statePath = options.statePath || getDefaultCodexStatePath();

  if (!fs.existsSync(statePath)) {
    return {
      available: false,
      message: '没有找到 Codex 本地状态文件，暂时无法显示余额。'
    };
  }

  const raw = fs.readFileSync(statePath, 'utf8');
  const cloudAccess = extractStringValue(raw, 'codexCloudAccess');
  const serviceTier = extractNullableStringValue(raw, 'default-service-tier');

  const lines = [
    'Codex 余额：本地无法读取。',
    `云端状态：${formatCloudAccess(cloudAccess)}`
  ];

  if (serviceTier) {
    lines.push(`服务档位：${serviceTier}`);
  }

  lines.push('如需精确余额，请以 Codex 账户页面为准。');

  return {
    available: true,
    cloudAccess,
    serviceTier: serviceTier || null,
    message: lines.join('\n')
  };
}

module.exports = {
  getCodexUsageSummary,
  formatCloudAccess
};
