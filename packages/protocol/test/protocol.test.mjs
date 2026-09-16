import test from 'node:test';
import assert from 'node:assert/strict';

import {
  PROTOCOL_VERSION,
  REMOTE_ERROR_CODES,
  isRemoteErrorCode,
} from '../dist/index.js';

test('protocol version is frozen at v1', () => {
  assert.equal(PROTOCOL_VERSION, 1);
});

test('remote error contract contains the documented stable codes', () => {
  assert.deepEqual(REMOTE_ERROR_CODES, [
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
  ]);
});

test('isRemoteErrorCode only accepts documented codes', () => {
  assert.equal(isRemoteErrorCode('DEVICE_OFFLINE'), true);
  assert.equal(isRemoteErrorCode('AUTH_REQUIRED'), true);
  assert.equal(isRemoteErrorCode('SOMETHING_ELSE'), false);
  assert.equal(isRemoteErrorCode(42), false);
});
