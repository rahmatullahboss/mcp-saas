# Workstream 4 — Dashboard, Device Management, and User Operations

**Owner:** Agent D  
**Depends on:** WS2 database/API contracts; WS3 account identity  
**Produces:** Desktop Commander-like device setup and revoke UX

## Target files

```text
apps/dashboard/
  src/routes/devices/
  src/routes/setup/
  src/routes/activity/
  src/components/DeviceCard.tsx
  src/components/PairDevice.tsx
  src/components/ConnectionStatus.tsx
  src/lib/api.ts

apps/api/
  src/devices/routes.ts
  src/activity/routes.ts
  src/account/routes.ts

tests/e2e/
  dashboard-pair-device.spec.ts
  dashboard-revoke-device.spec.ts
  dashboard-activity-redaction.spec.ts
```

## UX contract

Device card shows:

```text
display name
online/offline
OS
agent version
last seen
revoke
rename
re-pair/rotate
```

Setup page provides OS-specific commands for Linux, macOS, and Windows, but Linux is the first certified target.

Activity page shows metadata only.

## Tasks

- [ ] **1. Build authenticated device list API** scoped to the current account.
- [ ] **2. Build device list UI** with online/offline and last-seen states.
- [ ] **3. Build pairing page** that creates and confirms one-time pairing transactions.
- [ ] **4. Build rename and revoke operations** with confirmation and immediate relay disconnect on revoke.
- [ ] **5. Build activity view** with tool name/status/duration/device/timestamp only.
- [ ] **6. Add setup instructions** for Linux first; mark macOS/Windows as beta until WS1 agent packaging is certified there.
- [ ] **7. Add E2E tests** for pair, online transition, disconnect, reconnect, revoke, and cross-account URL manipulation.

## Acceptance

- A nontechnical user can pair and revoke a device without editing the MCP server URL.
- Revocation takes effect on the active relay session immediately.
- Dashboard never reveals source contents or terminal output in activity logs.
