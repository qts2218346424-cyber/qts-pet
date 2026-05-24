# Boba Desktop Design

## Goal

Build a lightweight Windows desktop pet shell for Boba Agent Coach.

Boba Desktop should run as a small always-on companion, support basic mouse interaction, optionally start on login, and display Chinese reminders from the existing Boba Agent Coach state file.

The first version should stay focused on desktop presence and interaction. It should not become a full dashboard or replace Claude Code, Codex, or the existing `boba` CLI wrapper.

## Chosen Approach

Use Electron for the first desktop version.

Electron is a good fit for this Windows-focused version because it supports:

- Transparent always-on-top windows.
- Mouse events and custom context menus.
- Launch-at-login integration.
- Tray/menu behavior.
- Reading local JSON state files.
- Reusing the existing Node.js project and CLI modules.

## First-Version User Experience

### Floating Pet

Boba Desktop shows a small transparent floating window on the desktop.

Behavior:

- Always on top by default.
- Frameless and transparent.
- Can be dragged with the mouse.
- Remembers its last screen position.
- Does not steal focus during normal state updates.
- Can be closed from the right-click menu.

The first version can render a simple Boba visual from local assets or a lightweight fallback visual if the final sprite animation integration is not ready yet. The window architecture should allow later sprite animation.

### Mouse Interaction

Supported interactions:

- Left drag: move the pet.
- Double-click: show current status bubble.
- Right-click: open context menu.
- Hover: no required behavior in V1, to avoid visual noise.

Mouse interactions should feel gentle and predictable. No interaction should block the user from working.

### Right-Click Menu

The context menu uses Chinese labels:

- `在这里打开 Codex`
- `在这里打开 Claude`
- `查看当前状态`
- `开机自动启动：已开启` or `开机自动启动：已关闭`
- `退出`

Menu actions:

- `在这里打开 Codex`: launches a terminal command for `boba codex`.
- `在这里打开 Claude`: launches a terminal command for `boba claude`.
- `查看当前状态`: forces the status bubble to show the current state.
- `开机自动启动`: toggles launch-at-login.
- `退出`: exits Boba Desktop.

If opening Codex or Claude from the current desktop pet has no reliable project directory, the app should default to the user's home directory in V1. Future versions can add a project picker.

## State Integration

Boba Desktop reads:

```text
~/.boba-agent-coach/state.json
```

It treats the file as optional:

- Missing file: show idle state.
- Malformed file: show idle state and avoid crashing.
- Unknown status or message key: show idle state.

The desktop app should poll the file periodically in V1. A 2-second interval is enough. More advanced file watching can be added later.

## Chinese Message Mapping

Boba Desktop maps existing `messageKey` values to Chinese UI text:

```text
agent_running -> Agent 正在工作。
agent_waiting_for_user -> Agent 好像在等你下一步。
task_may_be_stuck -> 这一步可能卡住了，要不要看一下最近输出？
task_ready_to_wrap_up -> 看起来可以收尾了：总结、提交，或者记录结果。
```

If `messageKey` is missing, fall back based on `status`:

```text
running -> Agent 正在工作。
waiting_for_user -> Agent 好像在等你下一步。
stuck -> 这一步可能卡住了，要不要看一下最近输出？
ready_to_wrap_up -> 看起来可以收尾了：总结、提交，或者记录结果。
```

Default idle text:

```text
Boba 正在待命。
```

## Visual States

V1 should define a small mood set:

- `idle`: normal relaxed state.
- `working`: agent is running.
- `gentle_prompt`: agent may be waiting for the user.
- `concerned`: task may be stuck.
- `settled`: task may be ready to wrap up.

The first version can represent these moods with bubble color, small text, and simple CSS changes. Full sprite animation is a later enhancement.

## Launch At Login

Boba Desktop should support launch-at-login through Electron's app login item settings.

Rules:

- The setting can be toggled from the right-click menu.
- The current menu label must reflect the actual setting.
- If setting launch-at-login fails, the app should keep running and show a short error status.

## Persistence

Boba Desktop should store its own preferences separately from Boba Agent Coach state.

Suggested path:

```text
~/.boba-desktop/config.json
```

Config fields:

```json
{
  "windowPosition": { "x": 1200, "y": 680 },
  "launchAtLogin": true
}
```

If the config file is missing or malformed, Boba Desktop should use defaults and recreate it on the next successful setting change.

## Boundaries

Boba Desktop consumes state from Boba Agent Coach. It does not replace the CLI wrapper.

In scope for V1:

- Electron app entrypoint.
- Transparent floating window.
- Drag movement.
- Double-click state bubble.
- Chinese context menu.
- Launch-at-login toggle.
- Reading `~/.boba-agent-coach/state.json`.
- Local config for window position.

Out of scope for V1:

- Full animated sprite system.
- Project picker.
- System-wide active IDE/project detection.
- Rich dashboard.
- Sending prompts to agents automatically.
- Deep Claude Code or Codex plugin integration.
- Packaging an installer.

## Error Handling

If `boba` command is missing:

- Menu actions for opening Codex or Claude should show a brief Chinese error status.
- The desktop pet should remain running.

If state file cannot be read:

- Fall back to idle.
- Do not show recurring error popups.

If launching Codex or Claude fails:

- Show a short bubble: `启动失败，请检查 boba 命令是否可用。`
- Do not crash the desktop app.

## Testing Strategy

Unit tests:

- Chinese message mapping from `messageKey`.
- Fallback mapping from `status`.
- Config loading with missing and malformed files.
- State loading with missing and malformed files.

Manual verification:

- Start Boba Desktop.
- Confirm floating window appears.
- Drag window and restart app; position persists.
- Right-click menu opens and shows Chinese labels.
- Toggle launch-at-login and confirm menu label changes.
- Write sample `state.json` values and confirm Chinese bubbles update.
- Double-click pet and confirm the current status bubble appears.

## Future Extensions

- Use the Petdex Boba spritesheet for animation.
- Add mood-specific animations.
- Add a project picker for `boba codex` and `boba claude`.
- Add custom Chinese reminder text in settings.
- Add a small tray icon for restore/hide.
