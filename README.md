# MCP SaaS

Hosted MCP gateway, device relay, OAuth control plane, and dashboard for securely connecting ChatGPT and other MCP clients to user-owned devices while executing filesystem, Git, search, and terminal operations locally.

## Project goal

Build a Desktop Commander-like native connector experience around a reusable CodexPro local execution engine:

```text
ChatGPT / MCP client
        |
        | HTTPS MCP + OAuth
        v
Universal Hosted MCP Gateway
        |
        v
Device Relay
        |
        | outbound authenticated connection
        v
User Device Agent
        |
        v
CodexPro executor
```

## Status

Architecture approved. Repository bootstrap and protocol foundation are in progress.

## Design principles

- One stable hosted MCP endpoint for all users.
- No inbound public port on user devices.
- Tool execution stays on the user device.
- OAuth identity and device identity are separate.
- Cloud authorization **and** device-local policy must both allow an operation.
- Mutating calls are idempotent by request ID.
- Cloud audit storage is metadata-only by default; source and terminal payloads are not retained.
- Public ChatGPT availability requires the hosted app/plugin to pass OpenAI's distribution/review path; developer-mode testing alone is not treated as completion.

## Development

See `docs/superpowers/specs/` and `docs/superpowers/plans/` for the approved architecture and implementation workstreams.
