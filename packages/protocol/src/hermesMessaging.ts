import { z } from 'zod';

export const HERMES_MESSAGING_TOOLS = [
  'conversations_list',
  'conversation_get',
  'messages_read',
  'attachments_fetch',
  'events_poll',
  'events_wait',
  'messages_send',
  'channels_list',
  'permissions_list_open',
  'permissions_respond',
] as const;

export const HERMES_READ_ONLY_TOOLS = [
  'conversations_list',
  'conversation_get',
  'messages_read',
  'attachments_fetch',
  'events_poll',
  'events_wait',
  'channels_list',
  'permissions_list_open',
] as const;

export const HERMES_MUTATING_TOOLS = [
  'messages_send',
  'permissions_respond',
] as const;

export const HermesBridgeModeSchema = z.enum(['read_only', 'full']);
export type HermesBridgeMode = z.infer<typeof HermesBridgeModeSchema>;
export type HermesMessagingTool = (typeof HERMES_MESSAGING_TOOLS)[number];

const documentedTools = new Set<string>(HERMES_MESSAGING_TOOLS);
const readOnlyTools = new Set<string>(HERMES_READ_ONLY_TOOLS);

export function isDocumentedHermesMessagingTool(tool: string): tool is HermesMessagingTool {
  return documentedTools.has(tool);
}

export function isHermesToolAllowed(tool: string, mode: HermesBridgeMode): boolean {
  if (!isDocumentedHermesMessagingTool(tool)) {
    return false;
  }

  return mode === 'full' || readOnlyTools.has(tool);
}

export function filterHermesToolNames(
  tools: readonly string[],
  mode: HermesBridgeMode,
): HermesMessagingTool[] {
  return tools.filter((tool): tool is HermesMessagingTool => isHermesToolAllowed(tool, mode));
}
