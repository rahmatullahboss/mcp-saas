# Workstream 5 — ChatGPT Plugin Packaging and Publication Readiness

**Owner:** Agent E  
**Depends on:** WS3 production MCP endpoint; WS4 user onboarding  
**Produces:** development app config, submission package, review environment

## Target files

```text
plugin/
  .mcp.json
  plugin.json
  README.md

docs/submission/
  chatgpt-setup.md
  review-guide.md
  privacy-data-flow.md
  supported-actions.md
  test-cases.md
  release-checklist.md

apps/demo-device/
  src/index.ts
  src/sandbox.ts

tests/e2e/
  submission-positive.spec.ts
  submission-negative.spec.ts
```

## Tasks

- [ ] **1. Add production MCP manifest** pointing only to the universal hosted MCP URL.
- [ ] **2. Create plugin metadata** with accurate non-promotional descriptions, support information, repository/legal references, and the app connection.
- [ ] **3. Audit every tool annotation** against actual behavior. Read-only and destructive flags must be mechanically tested against the catalog.
- [ ] **4. Create a reviewer demo account and sandboxed demo device** with deterministic files/processes and no production data.
- [ ] **5. Write at least five positive review cases** covering device discovery, read, search, Git status, and a bounded write/execute action.
- [ ] **6. Write at least three negative cases** covering offline device, denied local policy, and invalid/cross-account target.
- [ ] **7. Prepare privacy/data-flow documentation** explaining that tool payloads transit the relay and are not retained by default, while operational metadata is retained according to policy.
- [ ] **8. Test the app in ChatGPT Developer Mode** against the universal endpoint.
- [ ] **9. Submit for public directory review** only after security certification and production support/legal pages are live.
- [ ] **10. After approval, verify directory installation and mid-conversation invocation** by selection/@mention on each supported ChatGPT surface and plan targeted for launch.

## Acceptance

- No user-specific tunnel URL appears in installation instructions.
- Reviewer can complete the flow without access to a real customer machine.
- Public launch claim is made only after actual directory approval/availability.
