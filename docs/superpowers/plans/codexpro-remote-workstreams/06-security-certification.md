# Workstream 6 — Security, Reliability, Performance, and Release Certification

**Owner:** Agent F  
**Depends on:** Begins early; final gate depends on WS1–WS5  
**Produces:** adversarial evidence and release decision

## Target files

```text
tests/security/
  cross-account.spec.ts
  oauth-token.spec.ts
  device-credential.spec.ts
  replay.spec.ts
  path-escape.spec.ts
  symlink-escape.spec.ts
  payload-limit.spec.ts
  log-redaction.spec.ts

tests/load/
  relay-load.ts
  mcp-load.ts

docs/security/
  threat-model.md
  incident-response.md
  credential-rotation.md
  data-retention.md

docs/runbooks/
  relay-outage.md
  auth-outage.md
  revoke-compromised-device.md
  key-rotation.md
```

## Security test matrix

```text
valid OAuth token + owned device                         ALLOW
valid OAuth token + other account's device              DENY
expired access token + valid refresh                    REFRESH then ALLOW
expired token + no refresh                              AUTH_REQUIRED
revoked device key                                      DENY
replayed mutating request_id                            NO second execution
path traversal outside root                             DENY locally
symlink escape                                          DENY locally
blocked secret path                                     DENY locally
oversize tool arguments                                 PAYLOAD_TOO_LARGE
device disconnected                                     DEVICE_OFFLINE
queue saturated                                         DEVICE_BUSY
relay request exceeds deadline                          REQUEST_TIMEOUT
audit record contains file body                         TEST FAILURE
audit record contains Authorization header              TEST FAILURE
```

## Performance targets for MVP

Measure and document, do not fake:

```text
relay-only added latency p95        <= 150 ms in primary region
gateway auth+route latency p95      <= 100 ms excluding device execution
presence propagation                <= 5 s
reconnect after healthy network     <= 10 s typical
cross-account isolation failures    0
duplicate mutating execution        0
unbounded queue growth               0
```

If geography prevents the latency targets, publish the measured figures and adjust topology instead of relaxing correctness controls.

## Final release gate

- [ ] Existing CodexPro local regression suite passes.
- [ ] All protocol contract tests pass.
- [ ] OAuth refresh lifecycle passes.
- [ ] Cross-account isolation passes.
- [ ] Revoke is immediate.
- [ ] Replay/idempotency tests pass.
- [ ] Path/symlink/secret protections pass.
- [ ] Payload caps and timeouts pass.
- [ ] Audit/log redaction tests pass.
- [ ] Load test demonstrates bounded memory.
- [ ] Dashboard E2E passes.
- [ ] ChatGPT developer test passes.
- [ ] Reviewer demo environment passes.
- [ ] Public-submission package is complete.
- [ ] No production customer data is present in reviewer/demo fixtures.
