# Workstream 1 — CodexPro Executor Boundary and Remote Agent

**Owner:** Agent A  
**Depends on:** none  
**Produces:** stable `ToolExecutor` API, protocol package, `codexpro remote` agent mode

## Files

Modify existing CodexPro fork:

```text
src/server.ts
src/http.ts
src/stdio.ts
src/config.ts
scripts/codexpro.mjs
```

Create:

```text
src/executor/types.ts
src/executor/catalog.ts
src/executor/executor.ts
src/executor/errors.ts
src/remote/protocol.ts
src/remote/credentialStore.ts
src/remote/pairing.ts
src/remote/transport.ts
src/remote/agent.ts
src/remote/commands.ts
scripts/remote-smoke.mjs
```

## Interfaces

`createCodexProExecutor(config, options): ToolExecutor`

`ToolExecutor.listTools(): ToolDescriptor[]`

`ToolExecutor.execute(invocation, context): Promise<ToolResult>`

`RemoteTransport.connect(): Promise<RemoteSession>`

`RemoteSession.send(result): Promise<void>`

`RemoteSession.close(): Promise<void>`

## Tasks

- [ ] **1. Characterize current behavior before refactor.** Add a parity test that records the current descriptor names and executes representative read/search/Git/Bash-safe operations through the existing server registration path. Run `npm run build && npm run smoke`; commit the baseline test only.

- [ ] **2. Extract executor types.** Create `src/executor/types.ts` with `ToolDescriptor`, `ToolInvocation`, `ToolExecutionContext`, `ToolResult`, and `ToolExecutor`. Add compile-time tests or a small unit test importing these types.

- [ ] **3. Extract tool catalog without changing tool behavior.** Move registration metadata and handler lookup behind `createCodexProExecutor`. The existing `createCodexProServer` must register MCP tools by iterating the executor catalog and delegating each call to `execute`. Run the baseline parity test and the existing smoke suite.

- [ ] **4. Preserve tool annotations and result shaping.** Add tests proving read-only/destructive/open-world/idempotency annotations are unchanged for existing tools and that sensitive redaction still occurs.

- [ ] **5. Add remote protocol types.** Implement versioned `hello`, `welcome`, `heartbeat`, `tool_call`, `tool_result`, `tool_error`, `cancel`, and `policy_refresh` schemas with Zod. Add invalid-message and unknown-version tests.

- [ ] **6. Implement local credential storage.** Store device private material in an OS keychain adapter when available; provide a secure-file fallback with `0600` permission on Unix. Never print private credential contents. Unit-test fallback permissions and redaction.

- [ ] **7. Implement pairing client.** The client requests a pairing transaction, displays verification URL/code, polls or waits for approval, registers the device public key, then writes the returned bootstrap state. Test expired, denied, mismatched, and successful pairing.

- [ ] **8. Implement outbound transport.** Add reconnect with capped exponential backoff, heartbeat, dead-session detection, max message size, and graceful shutdown. Tests use a local fake relay server and assert reconnect does not duplicate in-flight mutations.

- [ ] **9. Implement remote dispatcher.** On `tool_call`, validate schema, enforce deadline, pass the request to `ToolExecutor`, and return `tool_result`/`tool_error`. Use the request ID in the local idempotency cache for mutating operations.

- [ ] **10. Add CLI commands.** `codexpro pair`, `codexpro remote`, `codexpro remote status`, and `codexpro remote revoke`. Existing `codexpro start` remains unchanged.

- [ ] **11. Add remote smoke.** Fake relay -> agent -> `read_file` and `git_status`, plus one locally denied operation. Run `npm run build`, `npm run smoke`, `node scripts/remote-smoke.mjs`, and `npm run stress`.

## Acceptance

- Existing local CodexPro modes remain green.
- The remote agent can execute the same executor tool handlers without running a second MCP server implementation.
- No inbound port is required.
- Reconnect does not change device identity.
- Revocation/removal of local credential prevents future remote connection.
