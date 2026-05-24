# Boba Agent Coach Design

## Goal

Turn Boba from a passive desktop pet into a lightweight work-rhythm companion for Claude Code and Codex.

Boba should help the user notice three coding-agent moments:

- The agent is waiting for the user.
- The task may be stuck.
- The task is ready to wrap up.

The first version should feel calm and companionable. It should not become a dashboard, notification center, or full agent controller.

## Chosen Approach

Use a lightweight command wrapper as the integration point.

The user starts agents through commands such as:

```powershell
boba claude
boba codex
```

The wrapper launches the real agent command, records a local event stream, and writes a compact current-state file that Boba can read. Boba does not need to inspect Claude Code or Codex internals directly.

This approach is more accurate than passively reading logs, while still avoiding deep plugin or hook integration. The design should leave room for future hooks, but first-version behavior must work through the wrapper alone.

## Local Agent Entrypoints

The current machine has both agent entrypoints available:

- Claude Code is available through the `claude` command.
- Codex is available through the `codex` command.

The wrapper should resolve these commands dynamically at runtime rather than hard-coding exact machine-specific paths.

## Components

### Boba CLI Wrapper

Responsibilities:

- Accept `boba claude` and `boba codex`.
- Start the selected agent in the current working directory.
- Forward additional arguments to the selected agent.
- Create a session record with agent type, project path, start time, process id, and status.
- Track output activity and process exit state where possible.
- Write events to an append-only local event log.
- Update a compact current-state file for Boba.

The wrapper should avoid changing the normal agent experience. Terminal behavior should remain as close as possible to running the underlying agent directly.

### Event Store

The wrapper writes local files under a Boba-controlled data directory. Suggested shape:

```text
~/.boba-agent-coach/
  state.json
  sessions/
    <session-id>.jsonl
```

`state.json` contains only the latest state needed by the pet:

```json
{
  "activeSessionId": "2026-05-24T12-30-00-codex",
  "agent": "codex",
  "projectPath": "E:\\Study\\desktop-pet",
  "status": "waiting_for_user",
  "lastActivityAt": "2026-05-24T12:34:00+08:00",
  "suggestedPetMood": "gentle_prompt",
  "messageKey": "agent_waiting_for_user"
}
```

Session logs are append-only JSONL events. Events should be intentionally small:

- `session_started`
- `output_activity`
- `user_input_observed`
- `command_failed`
- `quiet_timeout`
- `wrap_up_candidate`
- `session_exited`

### Boba Pet State Consumer

Responsibilities:

- Read the current `state.json`.
- Map state to a small set of pet moods and message keys.
- Display reminders in a restrained way.
- Apply cooldowns so repeated conditions do not spam the user.

The pet should only need the current state, not the full event history.

## Reminder Rules

### Agent Is Waiting For The User

Trigger when:

- The wrapper sees output activity from Claude Code or Codex.
- No user input or new output is observed for 2 to 5 minutes.
- The process is still alive.

Pet behavior:

- Boba shows a gentle prompt using `agent_waiting_for_user`.
- Suggested mood: attentive, calm.
- Cooldown: at least 5 minutes before repeating for the same session.

### Task May Be Stuck

Trigger when one or more of these happen:

- The wrapped process exits with a non-zero code.
- The wrapper detects repeated failure-like output in a short period.
- The session has no output activity for a long timeout while the process remains alive.

First-version stuck detection should stay conservative. It should prefer fewer false positives over aggressive coaching.

Pet behavior:

- Boba shows a small check-in using `task_may_be_stuck`.
- Suggested mood: concerned but not urgent.
- Cooldown: at least 10 minutes per session.

### Task Is Ready To Wrap Up

Trigger when:

- The wrapped process exits successfully.
- Recent output contains completion-like signals, such as tests passing or task completion language.
- No recent failure signal is present.

Pet behavior:

- Boba shows a wrap-up nudge using `task_ready_to_wrap_up`.
- Suggested mood: pleased, settled.
- Cooldown: once per session unless a new session starts.

## Notification Tone

Boba should behave like a balanced work companion:

- Quiet by default.
- Active at meaningful workflow transitions.
- Friendly without becoming chatty.
- Never block the user.
- Never require the user to respond.

Messages should be short and skimmable. The pet should not explain how it works inside the UI.

## Error Handling

If the wrapper cannot find the requested agent command:

- Show a direct terminal error.
- Do not create an active pet session.
- Suggest checking whether `claude` or `codex` is installed.

If the state file is missing or malformed:

- Boba falls back to idle mood.
- The wrapper recreates the file on the next session.

If output parsing fails:

- Keep recording basic process lifecycle events.
- Do not mark a session as stuck only because parsing failed.

## Testing Strategy

Wrapper tests:

- Resolves `claude` and `codex` commands.
- Forwards arguments to the underlying command.
- Creates `state.json` on session start.
- Writes session events in JSONL format.
- Marks successful and failed exits correctly.

Rule tests:

- Waiting-for-user triggers after the configured quiet window.
- Stuck detection triggers on non-zero exit and repeated failures.
- Wrap-up triggers on successful exit.
- Cooldowns suppress repeated reminders.

Manual verification:

- Start `boba codex` from a project directory.
- Confirm normal Codex usage still feels unchanged.
- Confirm Boba state changes for waiting, stuck, and wrap-up scenarios.

## Out Of Scope For First Version

- Deep Claude Code or Codex plugin integration.
- Reading private conversation content for semantic analysis.
- A full dashboard of sessions.
- Automatic code actions.
- Sending prompts to agents on behalf of the user.
- Cross-device sync.

## Future Extension Points

- Optional Claude/Codex hooks can emit the same event schema as the wrapper.
- A small menu on Boba can later expose actions such as opening the latest session or copying a wrap-up prompt.
- Stuck detection can become smarter after enough reliable event patterns are known.
- Localized message text can map from `messageKey` values to Chinese or English UI strings.
