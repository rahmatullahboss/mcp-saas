import test from 'node:test';
import assert from 'node:assert/strict';

import {
  AgentMessageSchema,
  CancelSchema,
  HeartbeatSchema,
  HelloSchema,
  PolicyRefreshSchema,
  RelayMessageSchema,
  ToolCallSchema,
  ToolErrorSchema,
  ToolResultSchema,
  WelcomeSchema,
} from '../dist/index.js';

const requestId = '018f2d54-7a6c-7b5e-9f6e-3b8ce746ed9f';
const deviceId = '5ad6fe3a-5c97-4d5a-a14a-5a065b0aed62';
const sessionId = 'a73d11d8-95f2-4e08-b65f-2fb73dc38d77';

const hello = {
  type: 'hello',
  protocol_version: 1,
  device_id: deviceId,
  agent_version: '0.1.0',
  platform: 'linux',
  architecture: 'x64',
  capabilities: ['read_file', 'git_status'],
};

test('protocol v1 accepts every documented relay message shape', () => {
  assert.equal(HelloSchema.parse(hello).device_id, deviceId);

  assert.equal(
    WelcomeSchema.parse({
      type: 'welcome',
      protocol_version: 1,
      session_id: sessionId,
      heartbeat_interval_ms: 25_000,
      max_message_bytes: 1_048_576,
      max_in_flight: 8,
    }).session_id,
    sessionId,
  );

  assert.equal(
    HeartbeatSchema.parse({
      type: 'heartbeat',
      protocol_version: 1,
      sent_at: '2026-09-17T00:00:00.000Z',
    }).type,
    'heartbeat',
  );

  assert.equal(
    ToolCallSchema.parse({
      type: 'tool_call',
      protocol_version: 1,
      request_id: requestId,
      tool: 'git_status',
      args: { workspace_id: 'hms' },
      deadline_ms: 30_000,
      oauth_scopes: ['computer.read'],
    }).tool,
    'git_status',
  );

  assert.equal(
    ToolResultSchema.parse({
      type: 'tool_result',
      protocol_version: 1,
      request_id: requestId,
      ok: true,
      result: {
        structuredContent: { branch: 'main', clean: true },
      },
    }).ok,
    true,
  );

  assert.equal(
    ToolErrorSchema.parse({
      type: 'tool_error',
      protocol_version: 1,
      request_id: requestId,
      error: {
        code: 'DEVICE_OFFLINE',
        message: 'Device is offline',
        retryable: true,
        device_id: deviceId,
      },
    }).error.code,
    'DEVICE_OFFLINE',
  );

  assert.equal(
    CancelSchema.parse({
      type: 'cancel',
      protocol_version: 1,
      request_id: requestId,
      reason: 'deadline_exceeded',
    }).request_id,
    requestId,
  );

  assert.equal(
    PolicyRefreshSchema.parse({
      type: 'policy_refresh',
      protocol_version: 1,
      policy_version: 2,
      policy: {
        scopes: ['computer.read'],
      },
    }).policy_version,
    2,
  );
});

test('agent and relay unions accept only their direction-specific messages', () => {
  assert.equal(AgentMessageSchema.safeParse(hello).success, true);
  assert.equal(
    AgentMessageSchema.safeParse({
      type: 'tool_result',
      protocol_version: 1,
      request_id: requestId,
      ok: true,
      result: { text: 'ok' },
    }).success,
    true,
  );

  assert.equal(
    RelayMessageSchema.safeParse({
      type: 'tool_call',
      protocol_version: 1,
      request_id: requestId,
      tool: 'read_file',
      args: { path: 'README.md' },
      deadline_ms: 10_000,
      oauth_scopes: ['computer.read'],
    }).success,
    true,
  );
  assert.equal(RelayMessageSchema.safeParse(hello).success, false);
});

test('unknown protocol versions and malformed messages fail closed', () => {
  assert.equal(
    AgentMessageSchema.safeParse({ ...hello, protocol_version: 2 }).success,
    false,
  );

  assert.equal(
    RelayMessageSchema.safeParse({
      type: 'tool_call',
      protocol_version: 1,
      request_id: requestId,
      tool: 'bash',
      args: {},
      deadline_ms: 0,
      oauth_scopes: ['computer.execute'],
    }).success,
    false,
  );

  assert.equal(
    AgentMessageSchema.safeParse({
      type: 'tool_error',
      protocol_version: 1,
      request_id: requestId,
      error: {
        code: 'UNKNOWN_CODE',
        message: 'nope',
        retryable: false,
      },
    }).success,
    false,
  );

  assert.equal(
    RelayMessageSchema.safeParse({
      type: 'not_a_real_message',
      protocol_version: 1,
    }).success,
    false,
  );
});
