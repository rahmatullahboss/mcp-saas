import { z } from 'zod';

import { RemoteErrorSchema } from './errors.js';

export const PROTOCOL_VERSION = 1 as const;

const ProtocolVersionSchema = z.literal(PROTOCOL_VERSION);
const IdentifierSchema = z.string().min(1);

export const HelloSchema = z
  .object({
    type: z.literal('hello'),
    protocol_version: ProtocolVersionSchema,
    device_id: IdentifierSchema,
    agent_version: z.string().min(1),
    platform: z.string().min(1),
    architecture: z.string().min(1).optional(),
    capabilities: z.array(z.string().min(1)),
  })
  .strict();

export const WelcomeSchema = z
  .object({
    type: z.literal('welcome'),
    protocol_version: ProtocolVersionSchema,
    session_id: IdentifierSchema,
    heartbeat_interval_ms: z.number().int().positive(),
    max_message_bytes: z.number().int().positive(),
    max_in_flight: z.number().int().positive(),
  })
  .strict();

export const HeartbeatSchema = z
  .object({
    type: z.literal('heartbeat'),
    protocol_version: ProtocolVersionSchema,
    sent_at: z.string().datetime(),
  })
  .strict();

export const ToolCallSchema = z
  .object({
    type: z.literal('tool_call'),
    protocol_version: ProtocolVersionSchema,
    request_id: IdentifierSchema,
    tool: z.string().min(1),
    args: z.record(z.unknown()),
    deadline_ms: z.number().int().positive(),
    oauth_scopes: z.array(z.string().min(1)),
  })
  .strict();

export const ToolResultPayloadSchema = z
  .object({
    structuredContent: z.record(z.unknown()).optional(),
    text: z.string().optional(),
  })
  .strict();

export const ToolResultSchema = z
  .object({
    type: z.literal('tool_result'),
    protocol_version: ProtocolVersionSchema,
    request_id: IdentifierSchema,
    ok: z.literal(true),
    result: ToolResultPayloadSchema,
  })
  .strict();

export const ToolErrorSchema = z
  .object({
    type: z.literal('tool_error'),
    protocol_version: ProtocolVersionSchema,
    request_id: IdentifierSchema,
    error: RemoteErrorSchema,
  })
  .strict();

export const CancelSchema = z
  .object({
    type: z.literal('cancel'),
    protocol_version: ProtocolVersionSchema,
    request_id: IdentifierSchema,
    reason: z.string().min(1).optional(),
  })
  .strict();

export const PolicyRefreshSchema = z
  .object({
    type: z.literal('policy_refresh'),
    protocol_version: ProtocolVersionSchema,
    policy_version: z.number().int().positive(),
    policy: z.record(z.unknown()),
  })
  .strict();

export const AgentMessageSchema = z.discriminatedUnion('type', [
  HelloSchema,
  HeartbeatSchema,
  ToolResultSchema,
  ToolErrorSchema,
]);

export const RelayMessageSchema = z.discriminatedUnion('type', [
  WelcomeSchema,
  ToolCallSchema,
  CancelSchema,
  PolicyRefreshSchema,
]);

export type Hello = z.infer<typeof HelloSchema>;
export type Welcome = z.infer<typeof WelcomeSchema>;
export type Heartbeat = z.infer<typeof HeartbeatSchema>;
export type ToolCall = z.infer<typeof ToolCallSchema>;
export type ToolResult = z.infer<typeof ToolResultSchema>;
export type ToolError = z.infer<typeof ToolErrorSchema>;
export type Cancel = z.infer<typeof CancelSchema>;
export type PolicyRefresh = z.infer<typeof PolicyRefreshSchema>;
export type AgentMessage = z.infer<typeof AgentMessageSchema>;
export type RelayMessage = z.infer<typeof RelayMessageSchema>;
