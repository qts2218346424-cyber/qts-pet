# Boba State Contract

Boba Agent Coach writes a compact state file for desktop-pet consumers.

Default path:

```text
~/.boba-agent-coach/state.json
```

Example:

```json
{
  "activeSessionId": "2026-05-24T12-30-00-000Z-codex",
  "agent": "codex",
  "projectPath": "E:\\Study\\desktop-pet",
  "status": "ready_to_wrap_up",
  "lastActivityAt": "2026-05-24T12:34:00.000Z",
  "suggestedPetMood": "settled",
  "messageKey": "task_ready_to_wrap_up"
}
```

Valid `status` values:

- `running`
- `waiting_for_user`
- `stuck`
- `ready_to_wrap_up`

Valid `messageKey` values:

- `agent_running`
- `agent_waiting_for_user`
- `task_may_be_stuck`
- `task_ready_to_wrap_up`

Pet consumers should ignore unknown fields and fall back to idle behavior when this file is missing or malformed.
