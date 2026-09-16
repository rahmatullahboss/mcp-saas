# CodexPro Remote: Native ChatGPT Plugin / Hosted MCP Design

**Date:** 2026-09-17  
**Status:** Approved architecture, implementation-ready program design  
**Primary goal:** Reuse CodexPro's local execution engine while replacing per-device Developer MCP exposure with a universal hosted MCP gateway, OAuth account connection, outbound device agent, relay, dashboard, and public ChatGPT plugin distribution.

## 1. Problem statement

Current CodexPro is a local MCP server. ChatGPT reaches a user-specific public URL or tunnel and the connection is treated as a custom/developer MCP. That creates several UX and lifecycle problems:

- a tunnel or user-specific URL becomes part of the ChatGPT connection;
- the connector can be unavailable in ChatGPT surfaces that do not support developer MCP actions;
- changing quick-tunnel URLs forces connector reconfiguration;
- authentication is currently oriented around a personal bearer/query token rather than a multi-user OAuth service;
- device routing, revoke, multi-device presence, and account lifecycle are not a first-class hosted control plane.

The target is a Desktop Commander-like experience:

1. Install the product from ChatGPT's plugin directory once.
2. Connect the user's account with OAuth.
3. Pair one or more devices.
4. The user can select or @mention the plugin from any supported ChatGPT conversation.
5. ChatGPT always talks to one stable hosted MCP endpoint.
6. The hosted service routes calls to the user's paired online device.
7. Files, shell, Git, search, and process execution happen on the user's device.
8. The cloud stores only the minimum control-plane and operational metadata by default.

Important limitation: code changes alone cannot turn a private Developer MCP into a globally available native ChatGPT plugin. Native directory behavior requires the hosted MCP/app to be submitted and approved for distribution by OpenAI, and actual availability still depends on plan, workspace, region, and supported ChatGPT surface.

## 2. Core architectural decision

Keep the **local executor** and **hosted control plane** separate.

```text
ChatGPT / Codex / Claude / Cursor
              |
              | MCP over HTTPS + OAuth
              v
      Universal MCP Gateway
              |
      auth + ownership check
              |
              v
          Relay Router
              |
       outbound TLS session
              |
              v
       Device Agent
              |
              v
        CodexPro Core
     files / Git / shell
```

The hosted gateway is not a remote shell implementation. It authenticates, authorizes, routes, meters, and relays. The device remains the execution authority.

## 3. Reuse strategy

Do not rewrite CodexPro's mature local operations.

Reuse or extract:

- workspace/root allowlisting;
- path traversal and symlink guards;
- blocked secret paths;
- read/list/search operations;
- write/edit operations;
- Git inspection;
- safe Bash policy;
- redaction;
- tool schemas and annotations;
- existing MCP result shaping where useful.

Refactor CodexPro so tool execution is callable through a transport-neutral interface rather than only through an `McpServer` registration layer.

Target interface:

```ts
export type ToolName = string;

export interface ToolInvocation {
  requestId: string;
  tool: ToolName;
  args: Record<string, unknown>;
  workspaceId?: string;
  deadlineMs: number;
}

export interface ToolExecutionContext {
  deviceId: string;
  accountId: string;
  grantedScopes: string[];
}

export interface ToolResult {
  ok: boolean;
  structuredContent?: Record<string, unknown>;
  text?: string;
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
}

export interface ToolExecutor {
  listTools(): ToolDescriptor[];
  execute(
    invocation: ToolInvocation,
    context: ToolExecutionContext
  ): Promise<ToolResult>;
}
```

The current local MCP server becomes one adapter over `ToolExecutor`. The remote agent becomes another.

## 4. Recommended repository layout

Maintain the CodexPro fork separately from the hosted SaaS initially. This reduces fork divergence and makes upstream sync easier.

```text
codexpro-fork/
  src/
    executor/
      catalog.ts
      executor.ts
      types.ts
      errors.ts
    remote/
      agent.ts
      pairing.ts
      transport.ts
      credential-store.ts
      protocol.ts
    server.ts
    http.ts
    stdio.ts
    ...existing ops files

remote-mcp-platform/
  apps/
    gateway/
      src/
        mcp/
        auth/
        routing/
        tools/
        errors/
    relay/
      src/
        websocket/
        sessions/
        router/
        protocol/
    api/
      src/
        devices/
        audit/
        account/
    dashboard/
      src/
        routes/
        components/
        api/
  packages/
    protocol/
    db/
    auth-contracts/
    observability/
    testkit/
  migrations/
  tests/
    integration/
    e2e/
    security/
  docs/
    architecture/
    runbooks/
    submission/
```

Later, if maintenance proves easier, these can be moved into one monorepo. Do not start with a large monorepo migration just to make the directory tree look cleaner.

## 5. Identity model

There are two independent identities:

### User / AI-client identity

ChatGPT authenticates the human account with OAuth.

The gateway validates:

- issuer;
- audience/resource;
- expiry;
- signature;
- scopes;
- revocation/rotation state where supported.

The OAuth provider must issue refresh tokens for a durable ChatGPT connection. Its discovery metadata must advertise the provider's refresh/offline capability. Without this, ChatGPT can require reauthentication after access-token expiry.

### Device identity

Each paired machine has a cryptographic device identity.

Recommended design:

- generate an Ed25519 keypair locally;
- private key never leaves the machine;
- public key is registered during pairing;
- store the private key in an OS keychain when possible, otherwise a mode-0600 credential file;
- authenticate each relay session with a challenge signed by the device key;
- allow key rotation and immediate revoke.

Do not reuse the ChatGPT OAuth access token as the device credential.

## 6. Device pairing

Use a device-style pairing flow.

```text
Agent starts
   |
   | asks cloud for pairing transaction
   v
Cloud returns:
  verification URL
  short code
  transaction id
   |
Agent shows code and opens browser
   |
User signs in and confirms matching code
   |
Cloud binds device public key to account
   |
Agent receives one-time bootstrap result
   |
Agent opens authenticated outbound relay session
```

Pairing transaction requirements:

- short lifetime, e.g. 10 minutes;
- one-time use;
- explicit account confirmation;
- code comparison;
- brute-force rate limiting;
- no long-lived bearer credential in browser URL.

## 7. Agent-to-relay transport

MVP transport: **WebSocket over TLS**.

Reasons:

- persistent outbound connection;
- simple presence/heartbeat;
- bidirectional request routing;
- cancellation;
- manageable backpressure;
- no inbound firewall rule on the device.

Protocol messages:

```ts
type AgentMessage =
  | Hello
  | Heartbeat
  | ToolResultMessage
  | ToolErrorMessage
  | StreamChunk
  | CancelAck;

type RelayMessage =
  | Welcome
  | ToolCallMessage
  | CancelMessage
  | PolicyRefresh
  | ShutdownNotice;
```

Example request:

```json
{
  "type": "tool_call",
  "protocol_version": 1,
  "request_id": "018f...",
  "tool": "git_status",
  "args": {
    "workspace_id": "hms"
  },
  "deadline_ms": 30000,
  "oauth_scopes": ["computer.read"]
}
```

Example result:

```json
{
  "type": "tool_result",
  "protocol_version": 1,
  "request_id": "018f...",
  "ok": true,
  "result": {
    "structuredContent": {
      "branch": "main",
      "clean": true
    }
  }
}
```

Transport requirements:

- heartbeat every 20–30 seconds;
- dead session detection;
- max frame size;
- bounded per-device in-flight request count;
- bounded queue;
- cancellation;
- request deadline;
- protocol version negotiation;
- compression disabled by default for sensitive small messages unless measured beneficial;
- no tool call persistence in the relay.

## 8. Hosted MCP gateway

Use one production endpoint for all users, for example:

```text
POST /mcp
```

Responsibilities:

1. Validate OAuth access token.
2. Resolve account.
3. Handle MCP initialize/tool discovery/tool calls.
4. Resolve target device.
5. Verify device ownership.
6. Verify OAuth scope and cloud policy.
7. Create an idempotent request identifier.
8. Route to the active device relay session.
9. Stream or return the result.
10. Emit sanitized operational audit metadata.

The gateway must not trust `device_id` supplied by the model without joining it to the authenticated account.

## 9. Device selection

Support multiple devices but avoid forcing the model to supply a device on every call.

Recommended model:

- `list_devices` returns online/offline devices;
- each stateful conversation can establish an advisory device affinity;
- every tool may still accept an explicit `device_id`;
- the gateway's authoritative rule is always `(authenticated account, device_id ownership)`;
- if affinity is absent and exactly one device is online, use it;
- if more than one device is plausible, ask the user or call `list_devices`.

Do not make a server-side MCP session ID the only authority for device selection.

## 10. Local policy is final authority

Authorization is two-layered:

```text
Cloud OAuth scope/policy
          AND
Device-local policy
```

Cloud examples:

- account owns device;
- `computer.execute` granted;
- device not revoked.

Local examples:

- allowed roots;
- blocked paths;
- Bash off/safe/full;
- write mode;
- per-tool enable/disable;
- max file size;
- command timeout;
- optional local approval for high-risk commands.

A compromised cloud account must not silently bypass the device-local allowlist.

## 11. Tool model

Start from CodexPro's existing bounded tools. Add account/device tools.

Suggested public MVP surface:

| Area | Tools |
|---|---|
| Device | `list_devices`, `ping_device`, `get_device_info` |
| Workspace | `list_workspaces`, `open_workspace`, `workspace_snapshot` |
| Read | `list_files`, `read_file`, `search_files`, `get_file_info` |
| Write | `write_file`, `edit_file`, `create_directory`, `move_file` |
| Git | `git_status`, `git_diff`, `git_log` |
| Terminal | `bash` initially; persistent process tools later |
| Diagnostics | `agent_status`, `get_recent_tool_activity` |

Keep tool descriptions literal and concise. Preserve correct MCP/OpenAI annotations for read-only, destructive, open-world, and idempotency properties.

## 12. Error contract

All cloud/agent failures must map to stable structured codes.

```ts
type RemoteErrorCode =
  | "AUTH_REQUIRED"
  | "INSUFFICIENT_SCOPE"
  | "DEVICE_NOT_FOUND"
  | "DEVICE_OFFLINE"
  | "DEVICE_REVOKED"
  | "DEVICE_BUSY"
  | "LOCAL_POLICY_DENIED"
  | "TOOL_NOT_SUPPORTED"
  | "INVALID_ARGUMENT"
  | "REQUEST_TIMEOUT"
  | "REQUEST_CANCELLED"
  | "PAYLOAD_TOO_LARGE"
  | "INTERNAL_RELAY_ERROR";
```

Each error includes:

```ts
{
  code: RemoteErrorCode;
  message: string;
  retryable: boolean;
  deviceId?: string;
  requestId: string;
}
```

Never leak internal stack traces, database keys, raw tokens, private paths beyond what the local tool intentionally returns, or relay internals.

## 13. Idempotency

Every mutating invocation receives a globally unique `request_id`.

The agent maintains a bounded TTL idempotency cache for mutating operations. If the same `request_id` is replayed:

- do not execute again;
- return the original outcome if safe to cache;
- otherwise return a deterministic duplicate/in-progress state.

This is mandatory for writes, process start, and later Git mutation tools.

## 14. Database model

PostgreSQL is sufficient for the initial control plane.

```sql
create table accounts (
  id uuid primary key,
  external_subject text unique not null,
  email text,
  status text not null check (status in ('active','disabled')),
  created_at timestamptz not null default now()
);

create table devices (
  id uuid primary key,
  account_id uuid not null references accounts(id),
  display_name text not null,
  platform text not null,
  architecture text,
  agent_version text not null,
  public_key text not null,
  revoked_at timestamptz,
  last_seen_at timestamptz,
  created_at timestamptz not null default now()
);

create index devices_account_idx on devices(account_id);

create table device_sessions (
  id uuid primary key,
  device_id uuid not null references devices(id),
  relay_node text not null,
  connected_at timestamptz not null,
  last_heartbeat_at timestamptz not null,
  disconnected_at timestamptz
);

create index device_sessions_live_idx
  on device_sessions(device_id, disconnected_at);

create table device_policies (
  device_id uuid primary key references devices(id),
  policy_version bigint not null,
  policy_json jsonb not null,
  updated_at timestamptz not null default now()
);

create table tool_invocations (
  id uuid primary key,
  request_id uuid unique not null,
  account_id uuid not null references accounts(id),
  device_id uuid references devices(id),
  tool_name text not null,
  risk_class text not null,
  status text not null,
  duration_ms integer,
  request_bytes bigint,
  response_bytes bigint,
  error_code text,
  created_at timestamptz not null default now()
);

create index tool_invocations_account_time_idx
  on tool_invocations(account_id, created_at desc);

create table audit_events (
  id uuid primary key,
  account_id uuid references accounts(id),
  device_id uuid references devices(id),
  actor_type text not null,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
```

Do not store file bodies, command stdout/stderr, or source code in `tool_invocations`.

Workspace absolute paths should remain device-local where possible. The cloud can store an opaque workspace ID plus user-facing label.

## 15. OAuth contract for ChatGPT

The published app needs standards-compliant OAuth for the hosted MCP resource.

Minimum behavior:

- authorization code + PKCE;
- short-lived access tokens;
- refresh tokens;
- refresh token rotation;
- advertised refresh/offline capability in discovery metadata;
- protected-resource metadata for the MCP resource;
- audience/resource validation;
- scope validation;
- revoke/logout path;
- account disable propagation.

Suggested scopes:

```text
computer.read
computer.write
computer.execute
devices.manage
```

Keep scope count small for user comprehension. Enforce more granular policy on the device.

## 16. Dashboard

MVP dashboard:

```text
Devices
  online/offline
  last seen
  OS / agent version
  rename
  revoke
  rotate/re-pair

Permissions
  read/write/execute
  local-policy summary

Connections
  ChatGPT connection state
  revoke account grants when supported

Activity
  tool name
  target device
  result status
  duration
  timestamp
  no source contents

Setup
  Linux/macOS/Windows pairing command
  troubleshooting
```

## 17. Deployment topology

Start simple.

```text
Internet
   |
Reverse proxy / edge TLS
   |
   +-- gateway-api process
   +-- relay process
   +-- dashboard
   |
Postgres
```

For MVP, gateway and relay may run on one host but remain separate modules/processes.

When horizontally scaling relay nodes, add a lightweight routing layer such as Redis/NATS or use sticky device ownership with a shared device-session directory. Do not add this before a second relay node exists.

## 18. Observability

Metrics:

- active device connections;
- device reconnect rate;
- MCP requests/sec;
- tool-call latency p50/p95/p99;
- relay queue depth;
- timeouts;
- authentication failures;
- payload bytes;
- error-code counts;
- per-device in-flight calls.

Logs are structured and redact:

- Authorization headers;
- refresh tokens;
- device private material;
- file content;
- command output by default;
- query strings carrying secrets.

## 19. Threat model

| Threat | Primary controls |
|---|---|
| Cross-account device access | derive account from OAuth token; ownership join on every route |
| Stolen OAuth access token | short TTL, audience, scopes, refresh rotation, revoke |
| Stolen device bootstrap token | one-time pairing transaction, short TTL |
| Stolen device long-term identity | local private key, rotation, revoke, optional OS keychain |
| Replay / duplicate mutation | request IDs + agent idempotency cache |
| Path traversal / symlink escape | CodexPro local guards |
| Secret-file exposure | blocked globs + explicit local allowlist |
| Command injection | safe Bash policy; avoid string interpolation in built-ins |
| Relay compromise | local policy remains final; relay stores no private device key |
| Log exfiltration | metadata-only audit; redaction |
| Resource exhaustion | payload caps, deadlines, queue limits, rate limits |
| Offline device | structured `DEVICE_OFFLINE` |
| Stale OAuth connection | refresh tokens + advertised offline/refresh capability |
| Protocol downgrade | explicit protocol version and minimum supported version |
| Device impersonation | challenge-response using registered device public key |
| Malicious model/tool argument | schema validation + local policy + confirmation for risky actions |

## 20. ChatGPT distribution path

There are three distinct stages.

### Development

Connect the universal hosted MCP endpoint as a custom/developer app and validate OAuth, tool discovery, and tool calls.

This stage can still inherit Developer Mode restrictions. It is not proof of native directory behavior.

### Private/workspace rollout

Publish the custom app within an eligible Business/Enterprise/Edu workspace for dogfooding and internal action controls.

### Public directory

Submit the production app/plugin for OpenAI review. The submission must use the production MCP connectivity and include the required metadata, privacy/terms/support information, testing instructions, and country availability.

After approval and directory distribution, users can install/connect the plugin and invoke it from supported conversations by selecting it or @mentioning it. Availability remains subject to ChatGPT plan/workspace/surface rules.

## 21. Acceptance criteria for the product goal

The project is not complete until all of these pass:

```text
A. ChatGPT talks only to one universal MCP hostname.
B. No end user copies a per-device tunnel URL into ChatGPT.
C. A device has no inbound public port requirement.
D. Reboot/reconnect preserves the same device identity.
E. A user can revoke a device from the dashboard.
F. Cross-account device routing tests fail closed.
G. Tool execution happens locally.
H. Relay does not persist source/terminal payloads by default.
I. OAuth access survives normal access-token expiry via refresh.
J. Offline devices return a structured, human-readable error.
K. Existing CodexPro local stdio/HTTP behavior remains functional.
L. Public ChatGPT plugin submission package is review-ready.
M. After approval/distribution, the plugin can be selected/@mentioned from supported chats without depending on a user-created Developer MCP entry.
```

## 22. Non-goals for MVP

Do not include these in the first native connector release:

- remote desktop video;
- mouse/keyboard GUI control;
- arbitrary screen scraping;
- billing;
- teams/organizations;
- enterprise SSO;
- multi-region active-active relay;
- server-side indexing of user source code;
- long-term command-output retention.

They can be added after the core hosted-MCP/device-relay path is stable.

## 23. Migration from current CodexPro

Backward compatibility:

```text
codexpro start               existing local/tunnel mode
codexpro remote              new hosted relay mode
codexpro pair                explicit pairing/re-pair command
codexpro remote status       local remote status
codexpro remote revoke       delete local credential and disconnect
```

Current local users keep their existing workflow.

The hosted mode should reuse the same tool catalog and local policy engine, so there is no second implementation of filesystem/Git/Bash rules.

## 24. Key engineering principle

The cloud decides **who may ask which device**.

The local agent decides **what that device will actually allow**.

That boundary is the most important safety and maintainability invariant in the entire system.
