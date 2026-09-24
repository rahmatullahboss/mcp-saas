# HARMES RKY — Hermes MCP bridge

**Date:** 2026-09-24  
**Status:** implementation foundation

## Goal

Connect the existing HARMES RKY Telegram bot, which runs on Hermes Agent, to MCP-capable clients without duplicating Telegram logic.

Hermes Agent already exposes a messaging MCP server:

```bash
hermes mcp serve
```

That server is stdio-only. It exposes the Hermes messaging bridge surface for listing conversations, reading messages, polling events, sending Telegram messages, listing channels, and responding to pending approvals.

## Bridge architecture

```text
ChatGPT / MCP client
        |
        | remote HTTPS MCP
        v
Hosted MCP gateway / secure tunnel
        |
        | authenticated device route
        v
HARMES RKY host
        |
        | stdio
        v
hermes mcp serve
        |
        v
Telegram gateway + ~/.hermes/state.db
```

Do not expose the Telegram bot token to ChatGPT or to the hosted gateway.

## Pinned Hermes tool surface

The protocol package pins the currently documented ten Hermes messaging tools and classifies them by risk.

Read-only:

- conversations_list
- conversation_get
- messages_read
- attachments_fetch
- events_poll
- events_wait
- channels_list
- permissions_list_open

Mutating:

- messages_send
- permissions_respond

Unknown future Hermes tools are denied until explicitly reviewed and added.

## Modes

`read_only`
: Only the eight non-mutating messaging tools are exposed.

`full`
: All ten reviewed tools are exposed.

The hosted gateway should use `read_only` until the ChatGPT workspace/app policy explicitly permits write actions. Sending a Telegram message or approving a pending Hermes action must never become enabled merely because Hermes adds a new upstream tool.

## Host verification

On the HARMES RKY machine:

```bash
hermes --version
hermes mcp serve --verbose
```

In a second shell, verify that the Telegram gateway is running before testing `messages_send`:

```bash
hermes gateway status
```

Read operations can work from Hermes state even if the gateway is stopped; send operations require the gateway/platform adapter to be active.

## Remote transport

ChatGPT cannot directly consume the local stdio process. The production path must provide a remote HTTPS MCP endpoint or an approved secure MCP tunnel. The remote layer must:

1. authenticate the caller;
2. route only to the account's paired HARMES RKY host;
3. enforce the pinned tool policy above;
4. keep Telegram/provider secrets on the device;
5. avoid storing message bodies in cloud audit logs by default;
6. require explicit authorization for mutating tools.

## Verification gate

The bridge is not complete until all of these pass:

- local `hermes mcp serve` starts successfully;
- tool discovery returns exactly the reviewed Hermes surface;
- read-only mode cannot invoke `messages_send` or `permissions_respond`;
- a remote MCP client can list/read one HARMES RKY Telegram conversation;
- full mode can send a test Telegram message only when explicitly enabled;
- the MCP endpoint is reachable through the selected secure remote transport;
- ChatGPT tool scan succeeds on a supported plan/surface.
