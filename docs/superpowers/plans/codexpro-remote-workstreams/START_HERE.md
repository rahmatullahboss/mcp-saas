# Parallel Agent Handoff Guide

Use this document to dispatch independent workers.

## Agent A — CodexPro core/agent

Give Agent A:

- design spec;
- WS1 plan;
- current CodexPro fork;
- requirement to preserve local behavior and avoid cloud code.

Deliverable: executor boundary + remote agent + protocol schemas + green existing tests.

## Agent B — relay/control plane

Start after Agent A freezes protocol v1 schema.

Give Agent B:

- design spec;
- WS2 plan;
- protocol package contract.

Deliverable: device pairing, challenge-response, relay routing, presence, metadata audit, database migrations.

## Agent C — OAuth/MCP gateway

May run in parallel with Agent B after WS1.

Give Agent C:

- design spec;
- WS3 plan;
- mocked `routeToolCall(accountId, deviceId, request)` interface.

Deliverable: standards-compliant OAuth validation, refresh durability test, universal MCP endpoint, device resolution.

## Agent D — dashboard

Start after device/account API and schema contracts stabilize.

Deliverable: pair/list/rename/revoke/activity UI and E2E tests.

## Agent E — ChatGPT publishing

Start once universal MCP endpoint is stable.

Deliverable: plugin/app packaging, tool-annotation audit, reviewer sandbox, submission docs and test cases.

## Agent F — adversarial certification

Start immediately with test harness design. Do not implement production features.

Deliverable: independent security/reliability evidence, load results, threat model, release gate.

## Integration ownership

Use one integration owner. Feature agents do not directly merge each other's branches.

Preferred order:

```text
WS1
 -> integrate protocol/executor
 -> WS2 + WS3 in parallel
 -> integrate relay + gateway
 -> WS4
 -> WS5
 -> WS6 final certification
```

At every integration:

```text
fetch latest main
reconcile/rebase safely
run affected focused tests
run integration contract tests
review diff
merge without force
record evidence
```

A protocol/schema change after WS2/WS3 begin requires a versioned contract change, not a silent mutation.
