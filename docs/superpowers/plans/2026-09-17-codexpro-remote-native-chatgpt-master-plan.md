# CodexPro Remote Native ChatGPT Connector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a universal hosted MCP + OAuth + outbound device relay around the CodexPro execution engine so the product can be distributed as a normal ChatGPT plugin instead of requiring a per-device Developer MCP connection.

**Architecture:** Extract CodexPro tool execution into a transport-neutral executor, add a remote agent mode, then build a separate hosted control plane containing OAuth integration, MCP gateway, relay, device registry, and dashboard. The device remains the execution authority; cloud services route and audit metadata only.

**Tech Stack:** TypeScript/Node.js 20+, MCP SDK, PostgreSQL, WebSocket/TLS, Zod, existing CodexPro filesystem/Git/Bash modules, an established OAuth/OIDC provider or standards-compliant OAuth service, Playwright or equivalent browser E2E for dashboard flows.

**Spec:** `docs/superpowers/specs/2026-09-17-codexpro-remote-native-chatgpt-design.md`

## Global constraints

- Preserve existing CodexPro local stdio/HTTP behavior.
- Do not expose a public inbound device port.
- Do not use query-string tokens for the hosted multi-user product.
- Do not persist source-file content or terminal output in cloud audit storage by default.
- Device-local policy is the final authorization layer.
- Every route to a device must verify authenticated account ownership.
- Mutating calls must be idempotent by `request_id`.
- Use TDD for protocol, auth, routing, policy, and error-contract behavior.
- Do not add billing, teams, GUI remote control, or multi-region routing in the MVP.
- Keep the universal MCP endpoint stable across device restarts.
- OAuth must support durable refresh so normal access-token expiry does not break ChatGPT connectivity.

---

## Dependency graph

```text
WS1 Executor boundary
      |
      +------------+
      |            |
      v            v
WS2 Agent/Relay  WS3 OAuth/MCP Gateway
      |            |
      +------+- ----+
             |
             v
      WS4 Dashboard
             |
             v
      WS5 Plugin submission
             |
             v
      WS6 Security/perf certification
```

WS2 and WS3 can run in parallel after WS1 publishes stable protocol/executor interfaces. WS4 can begin after the database contracts from WS2/WS3 are frozen. WS6 begins with test harnesses early and performs the final certification after all other workstreams integrate.

## Integration gates

Gate A — executor parity:
existing local CodexPro smoke tests pass with the new executor boundary.

Gate B — private remote E2E:
hosted gateway -> relay -> one paired device -> read-only tool succeeds.

Gate C — mutating E2E:
write/edit/bash execute with local policy enforcement and idempotency.

Gate D — OAuth durability:
access-token expiry refreshes without manual reconnect.

Gate E — multi-device/multi-account isolation:
cross-account routing is impossible in adversarial tests.

Gate F — ChatGPT developer test:
universal MCP endpoint scans and invokes correctly.

Gate G — public submission readiness:
directory metadata, privacy, support, test account, review instructions, and production endpoint are complete.

## Release rule

Do not claim the `FORBIDDEN developer MCP` problem is fully solved merely because Gate F passes. Gate F still uses the developer/custom-app path. The product-level success condition is an approved/installable directory plugin on supported ChatGPT surfaces.
