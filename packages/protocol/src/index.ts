export const PROTOCOL_VERSION = 1 as const;

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

const remoteErrorCodeSet = new Set<string>(REMOTE_ERROR_CODES);

export function isRemoteErrorCode(value: unknown): value is RemoteErrorCode {
  return typeof value === 'string' && remoteErrorCodeSet.has(value);
}
