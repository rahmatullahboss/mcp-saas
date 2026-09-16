# Workstream 2 — Device Relay and Control Plane

**Owner:** Agent B  
**Depends on:** WS1 protocol schemas  
**Produces:** paired-device registry, authenticated relay, presence, routing

## Target files

```text
packages/protocol/
  src/index.ts
  src/agentMessages.ts
  src/errors.ts

packages/db/
  src/schema.ts
  src/repositories/devices.ts
  src/repositories/sessions.ts
  src/repositories/audit.ts

apps/relay/
  src/index.ts
  src/wsServer.ts
  src/deviceAuthenticator.ts
  src/connectionRegistry.ts
  src/router.ts
  src/backpressure.ts
  src/heartbeat.ts

apps/api/
  src/devices/routes.ts
  src/pairing/routes.ts
  src/pairing/service.ts

migrations/
  001_accounts.sql
  002_devices.sql
  003_device_sessions.sql
  004_device_policies.sql
  005_tool_invocations_audit.sql

tests/integration/
  relay-routing.test.ts
  device-pairing.test.ts
  relay-reconnect.test.ts
  cross-account-routing.test.ts
```

## Tasks

- [ ] **1. Create schema migrations** exactly for accounts, devices, device sessions, policies, tool invocation metadata, and audit events. Add migration-up and migration-down verification in an ephemeral PostgreSQL database.

- [ ] **2. Implement device pairing transaction service** with one-time code, expiry, attempt limit, account confirmation, and public-key registration. Tests cover replay and brute-force lockout.

- [ ] **3. Implement device session challenge-response.** Relay sends a nonce; agent signs it with its registered device private key; relay verifies against the stored public key. Reject revoked devices before session registration.

- [ ] **4. Implement connection registry.** Map `device_id -> relay session`, replace stale duplicate sessions deterministically, and track heartbeat/last-seen without storing tool payloads.

- [ ] **5. Implement bounded routing.** `routeToolCall(accountId, deviceId, request)` verifies ownership, online presence, in-flight limit, request deadline, and max bytes before forwarding.

- [ ] **6. Implement backpressure and cancellation.** Each device gets a bounded queue and in-flight semaphore. Expired requests are cancelled and removed. A slow consumer cannot grow memory without bound.

- [ ] **7. Implement audit metadata.** Record tool name, device, status, bytes, duration, and error code only. Add a test that file contents, command stdout, Authorization headers, and device private material never appear in stored audit JSON.

- [ ] **8. Add adversarial routing tests.** Account A cannot address account B's device even with a valid device UUID, session ID, or guessed display name.

- [ ] **9. Add reconnect E2E.** Disconnect agent, verify `DEVICE_OFFLINE`; reconnect with same device key, verify same device ID returns online.

## Acceptance

- Device sessions are outbound-only and cryptographically bound to registered device identity.
- Cross-account route confusion fails closed.
- Relay memory remains bounded under load.
- Audit persistence is metadata-only.
