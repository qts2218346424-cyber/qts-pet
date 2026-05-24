#!/usr/bin/env node
'use strict';

const { spawn } = require('node:child_process');
const path = require('node:path');
const electron = require('electron');

const mainPath = path.join(__dirname, '..', 'desktop', 'main.cjs');
const child = spawn(electron, [mainPath, ...process.argv.slice(2)], {
  detached: true,
  stdio: 'ignore',
  windowsHide: false
});

child.on('error', (error) => {
  console.error(error && error.message ? error.message : String(error));
  process.exitCode = 1;
});

child.unref();
setTimeout(() => {
  process.exit(process.exitCode || 0);
}, 50);
