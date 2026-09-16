# MCP SaaS Agent Instructions

## Source of truth

Read these before implementation:

1. `docs/superpowers/specs/2026-09-17-codexpro-remote-native-chatgpt-design.md`
2. `docs/superpowers/plans/2026-09-17-codexpro-remote-native-chatgpt-master-plan.md`
3. The workstream document assigned to you.

## Engineering rules

- Use isolated feature branches; do not implement feature work directly on `main`.
- Use TDD: add a failing behavioral test, verify the RED state, then add the minimum implementation and verify GREEN.
- Do not force-push or overwrite another worker's changes.
- Keep interfaces small, typed, versioned, and independently testable.
- Every route to a device must verify authenticated account ownership.
- Device-local policy is the final authority for filesystem, Git, and terminal execution.
- Do not store source file contents, terminal stdout/stderr, access tokens, refresh tokens, or device private keys in cloud audit logs.
- Mutating remote tool calls must be idempotent by `request_id`.
- Do not require inbound public ports on user devices.
- Do not claim native ChatGPT directory behavior until the plugin/app has actually passed the required distribution/review path and has been verified on the target supported ChatGPT surface.
- Preserve backward compatibility with the existing CodexPro local execution model when working in the CodexPro fork.

## Verification

Before merge, run the focused tests for the workstream plus the root `npm test` and `npm run typecheck`. Add evidence to the PR description.
