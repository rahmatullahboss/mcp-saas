# Workstream 3 — OAuth and Universal MCP Gateway

**Owner:** Agent C  
**Depends on:** WS1 executor descriptors/protocol; WS2 route interface can be mocked initially  
**Produces:** stable `/mcp` endpoint, user OAuth, tool discovery, routed calls

## Target files

```text
apps/gateway/
  src/index.ts
  src/mcp/server.ts
  src/mcp/tools.ts
  src/mcp/resultAdapter.ts
  src/auth/accessToken.ts
  src/auth/protectedResourceMetadata.ts
  src/auth/scopes.ts
  src/routing/deviceResolver.ts
  src/errors/toMcpError.ts

packages/auth-contracts/
  src/index.ts
  src/claims.ts
  src/scopes.ts

tests/integration/
  oauth-discovery.test.ts
  oauth-refresh.test.ts
  mcp-tools-list.test.ts
  mcp-device-routing.test.ts
  mcp-offline-device.test.ts
```

## Tasks

- [ ] **1. Define OAuth claim contract.** Gateway accepts only tokens with expected issuer, MCP audience/resource, expiry, subject, and allowed scopes. Unit-test wrong issuer, wrong audience, expired token, missing scope, and valid token.

- [ ] **2. Serve MCP protected-resource metadata** and verify the configured authorization server advertises the required OAuth/OIDC discovery information.

- [ ] **3. Prove durable refresh.** Integration test obtains authorization, advances access-token expiry, uses refresh token, and completes a second MCP tool call without user re-login. The provider/discovery configuration must advertise its refresh/offline capability.

- [ ] **4. Implement universal MCP server.** One endpoint handles initialize, tool discovery, and tool call dispatch. Tool descriptors are adapted from the CodexPro executor catalog plus device/account tools.

- [ ] **5. Add device discovery tools.** `list_devices` and `ping_device` are cloud tools. They never execute shell/file operations.

- [ ] **6. Implement target-device resolution.** Explicit device ID wins; otherwise use advisory affinity; otherwise auto-select only when exactly one eligible online device exists. Ambiguous selection returns a structured response asking for device choice.

- [ ] **7. Enforce ownership and scope before relay.** Resolve `account_id` exclusively from token subject mapping; never accept account ID from tool arguments.

- [ ] **8. Map relay errors to MCP results.** Stable errors include `DEVICE_OFFLINE`, `DEVICE_BUSY`, `LOCAL_POLICY_DENIED`, `REQUEST_TIMEOUT`, and `DEVICE_REVOKED`; no internal stack traces.

- [ ] **9. Enforce request size/deadline limits.** Oversize arguments and expired requests fail before entering relay.

- [ ] **10. Add end-to-end mock relay test.** OAuth-authenticated MCP tool call -> device resolution -> mocked relay -> MCP result.

## Acceptance

- One hostname/endpoint works for all accounts and devices.
- Normal token expiry does not force manual ChatGPT reconnect.
- User identity is never accepted from MCP arguments.
- Device-offline and policy errors are stable and human-readable.
