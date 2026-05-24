# Boba Desktop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a lightweight Electron desktop pet shell with Chinese UI that reads Boba Agent Coach state and supports mouse interaction plus launch-at-login.

**Architecture:** Add an Electron main process, a renderer UI, and small shared modules for Chinese message mapping, state loading, and config persistence. Keep the existing `boba` CLI unchanged; the desktop app consumes `~/.boba-agent-coach/state.json` and launches `boba codex` or `boba claude` from menu actions.

**Tech Stack:** Node.js CommonJS, Electron, HTML/CSS/JavaScript renderer, Node built-in `node:test`.

---

## File Structure

- Modify `package.json`: add Electron dependency and desktop scripts.
- Create `desktop/main.cjs`: Electron app entrypoint, window creation, menu actions, launch-at-login.
- Create `desktop/preload.cjs`: safe bridge from main process to renderer.
- Create `desktop/renderer/index.html`: floating pet UI markup.
- Create `desktop/renderer/styles.css`: transparent pet window styling.
- Create `desktop/renderer/app.js`: renderer state updates and mouse interactions.
- Create `src/desktopMessages.cjs`: Chinese message mapping.
- Create `src/desktopState.cjs`: load and normalize Agent Coach state.
- Create `src/desktopConfig.cjs`: load/save desktop config and window position.
- Create `tests/desktopMessages.test.cjs`: Chinese mapping tests.
- Create `tests/desktopState.test.cjs`: state loading and fallback tests.
- Create `tests/desktopConfig.test.cjs`: config loading and fallback tests.

## Task 1: Desktop Shared Modules

**Files:**
- Create: `src/desktopMessages.cjs`
- Create: `src/desktopState.cjs`
- Create: `src/desktopConfig.cjs`
- Create: `tests/desktopMessages.test.cjs`
- Create: `tests/desktopState.test.cjs`
- Create: `tests/desktopConfig.test.cjs`

Steps:

- [ ] Add tests for Chinese message mapping.
- [ ] Implement `getChineseMessage(state)`.
- [ ] Add tests for missing, malformed, and valid state files.
- [ ] Implement `loadDesktopState(options)`.
- [ ] Add tests for missing, malformed, and valid config files.
- [ ] Implement `loadDesktopConfig(options)` and `saveDesktopConfig(config, options)`.
- [ ] Run `node --test tests/desktop*.test.cjs`.

## Task 2: Electron App Shell

**Files:**
- Modify: `package.json`
- Create: `desktop/main.cjs`
- Create: `desktop/preload.cjs`

Steps:

- [ ] Install Electron as a dev dependency.
- [ ] Add scripts: `desktop`, `desktop:dev`.
- [ ] Create a transparent frameless always-on-top `BrowserWindow`.
- [ ] Load `desktop/renderer/index.html`.
- [ ] Wire IPC for `get-state`, `show-menu`, `save-position`, `toggle-launch-at-login`, and `launch-agent`.
- [ ] Use Electron `app.setLoginItemSettings` for launch-at-login.
- [ ] Use PowerShell to launch `boba codex` and `boba claude` in a visible terminal window.

## Task 3: Renderer UI

**Files:**
- Create: `desktop/renderer/index.html`
- Create: `desktop/renderer/styles.css`
- Create: `desktop/renderer/app.js`

Steps:

- [ ] Build a compact transparent pet surface.
- [ ] Add a simple Boba visual.
- [ ] Add a status bubble with Chinese text.
- [ ] Poll state every 2 seconds.
- [ ] Double-click to show current status bubble.
- [ ] Right-click to request native menu.
- [ ] Use CSS drag region for normal dragging.
- [ ] Reflect moods: `idle`, `working`, `gentle_prompt`, `concerned`, `settled`.

## Task 4: Verification

**Files:**
- Modify as needed based on verification results.

Steps:

- [ ] Run `npm test`.
- [ ] Run `npm run desktop` and confirm Electron starts.
- [ ] Confirm right-click menu is Chinese.
- [ ] Confirm `boba state` still works.
- [ ] Commit the desktop implementation.

## Self-Review

Spec coverage:

- Transparent floating desktop pet: Task 2 and Task 3.
- Mouse interaction: Task 3.
- Chinese messages and menu: Task 1, Task 2, Task 3.
- Launch-at-login: Task 2.
- State file consumption: Task 1 and Task 3.
- Config persistence: Task 1 and Task 2.

Completeness scan:

- The plan keeps V1 scoped to an Electron shell and does not include installer packaging or sprite animation.
