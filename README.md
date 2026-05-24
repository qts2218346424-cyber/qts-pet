# Boba Agent Coach

Boba Agent Coach is a lightweight command wrapper for Claude Code and Codex. It records local session state so a desktop pet can show calm work-rhythm reminders.

## Usage

```powershell
npm run boba -- codex
npm run boba -- claude
npm run boba -- state
```

After packaging the CLI, the intended commands are:

```powershell
boba codex
boba claude
boba state
```

## First-Version Reminders

- Agent is waiting for the user.
- Task may be stuck.
- Task is ready to wrap up.

See `docs/boba-state-contract.md` for the pet-facing state file.
