import { z } from 'zod';

export const REMOTE_ERROR_CODES = [
  'AUTH_REQUIRED',
  'INSUFFICIENT_SCOPE',
  'DEVICE_NOT_FOUND',
  'DEVICE_OFFLINE',
  'DEVICE_REVOKED',
  'DEVICE_BUSY',
  'LOCAL_POLICY_DENIED',
  'TOOL_NOT_SUPPORTED',
  'INVALID_ARGUMENT',
  'REQUEST_TIMEOUT',
  'REQUEST_CANCELLED',
  'PAYLOAD_TOO_LARGE',
  'INTERNAL_RELAY_ERROR',
] as const;

export type RemoteErrorCode = (typeof REMOTE_ERROR_CODES)[number];

export const RemoteErrorCodeSchema = z.enum(REMOTE_ERROR_CODES);

export const RemoteErrorSchema = z
  .object({
    code: RemoteErrorCodeSchema,
    message: z.string().min(1),
    retryable: z.boolean(),
    device_id: z.string().min(1).optional(),
  })
  .strict();

export type RemoteError = z.infer<typeof RemoteErrorSchema>;

const remoteErrorCodeSet = new Set<string>(REMOTE_ERROR_CODES);

export function isRemoteErrorCode(value: unknown): value is RemoteErrorCode {
  return typeof value === 'string' && remoteErrorCodeSet.has(value);
}
