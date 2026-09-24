import assert from 'node:assert/strict';
import test from 'node:test';

import {
  HERMES_MESSAGING_TOOLS,
  HERMES_MUTATING_TOOLS,
  HERMES_READ_ONLY_TOOLS,
  filterHermesToolNames,
  isHermesToolAllowed,
} from '../dist/index.js';

test('Hermes messaging surface stays pinned to the documented ten tools', () => {
  assert.equal(HERMES_MESSAGING_TOOLS.length, 10);
  assert.equal(HERMES_READ_ONLY_TOOLS.length, 8);
  assert.equal(HERMES_MUTATING_TOOLS.length, 2);
});

test('read_only mode denies sending messages and approval responses', () => {
  assert.equal(isHermesToolAllowed('messages_send', 'read_only'), false);
  assert.equal(isHermesToolAllowed('permissions_respond', 'read_only'), false);
  assert.equal(isHermesToolAllowed('messages_read', 'read_only'), true);
});

test('full mode permits documented mutating tools but not unknown expansion', () => {
  assert.equal(isHermesToolAllowed('messages_send', 'full'), true);
  assert.equal(isHermesToolAllowed('future_dangerous_tool', 'full'), false);
});

test('filterHermesToolNames strips undocumented tools and write tools in read_only mode', () => {
  assert.deepEqual(
    filterHermesToolNames(
      ['conversations_list', 'messages_send', 'channels_list', 'future_tool'],
      'read_only',
    ),
    ['conversations_list', 'channels_list'],
  );
});
