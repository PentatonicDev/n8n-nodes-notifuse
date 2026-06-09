# n8n-nodes-notifuse

[![npm version](https://badge.fury.io/js/@pentatonic-dev%2Fn8n-nodes-notifuse.svg)](https://www.npmjs.com/package/@pentatonic-dev/n8n-nodes-notifuse)

This is an n8n community node package for [Notifuse](https://notifuse.com) — a modern
transactional email and newsletter management platform. It exposes the Notifuse API as
**action nodes** and provides **trigger nodes** that automatically register (and remove)
webhook subscriptions for every Notifuse event type.

[n8n](https://n8n.io) is a [fair-code licensed](https://docs.n8n.io/reference/license/)
workflow automation platform.

- [Installation](#installation)
- [Credentials](#credentials)
- [Nodes](#nodes)
  - [Notifuse (action node)](#notifuse-action-node)
  - [Trigger node](#trigger-node)
- [Webhook security](#webhook-security)
- [Resources](#resources)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/)
in the n8n community nodes documentation.

### Community Nodes (recommended)

1. Go to **Settings** > **Community Nodes**
2. Select **Install** and enter `@pentatonic-dev/n8n-nodes-notifuse`

### Manual installation

```bash
npm install @pentatonic-dev/n8n-nodes-notifuse
```

## Credentials

All nodes authenticate with a single **Notifuse API** credential, scoped to one workspace:

| Field | Description |
| --- | --- |
| **API URL** | Base URL of your Notifuse instance, e.g. `https://notifuse.pentatonic.cloud` (no trailing slash). Each environment can use its own URL + token. |
| **API Token** | API token created in your workspace (**Admins & API Keys**). Sent as a Bearer token. |
| **Workspace ID** | The workspace this credential is scoped to. Automatically sent as `workspace_id` on every request (query string for reads, body for writes). |

Because the base URL lives in the credential, you point the same nodes at staging or
production simply by selecting a different credential — there is no hardcoded environment.

## Nodes

### Notifuse (action node)

A single **Notifuse** node groups every (non-webhook-management) endpoint by resource.
Required API fields are exposed as required node fields; optional fields live under
**Additional Fields** (or **Filters** for list operations). Complex nested payloads
(broadcast audience, template content, event arrays, …) are entered as JSON.

| Resource | Operations |
| --- | --- |
| **Contact** | Count · Create or Update · Delete · Get by Email · Get by External ID · Get Many · Import |
| **List** | Subscribe · Subscribe Public · Update Status |
| **Broadcast** | Create · Update · Get · Get Many · Schedule · Pause · Resume · Cancel · Delete · Send to Individual · Get Test Results · Select Winner · Refresh Global Feed · Test Recipient Feed |
| **Template** | Create · Update · Get · Get Many · Delete · Compile |
| **Transactional** | Send |
| **Custom Event** | Import |

### Trigger node

A single **Notifuse Trigger** node exposes all webhook event types in one **Events** field
(each entry is also selectable directly from the "Notifuse" app in the nodes panel). It
**self-registers a Notifuse webhook subscription** pointing at the n8n webhook URL — created when
the workflow is activated, re-created when the selected events change, and deleted when the
workflow is deactivated.

| Entity | Events |
| --- | --- |
| **Contact** | `contact.created`, `contact.updated`, `contact.deleted` |
| **List** | `list.subscribed`, `list.unsubscribed`, `list.confirmed`, `list.resubscribed`, `list.bounced`, `list.complained`, `list.pending`, `list.removed` |
| **Segment** | `segment.joined`, `segment.left` |
| **Email** | `email.sent`, `email.delivered`, `email.opened`, `email.clicked`, `email.bounced`, `email.complained`, `email.unsubscribed` |
| **Custom Event** | `custom_event.created`, `custom_event.updated`, `custom_event.deleted` |

Select any number of events (across entities) in a single trigger node. Each event is delivered
to the workflow as a separate item with `{ id, type, timestamp, workspace_id, data }`.

## Webhook security

Notifuse signs every webhook using the [Standard Webhooks](https://www.standardwebhooks.com/)
specification (HMAC-SHA256 over `{id}.{timestamp}.{body}`, sent in the `webhook-signature`
header). The trigger nodes verify this signature against the subscription secret by default
(**Verify Signature**). Additional per-trigger options let you restrict by **IP allowlist**
(IPs or CIDR ranges), **CORS origins**, and **ignore bots**, and optionally include the
**raw body** in the output.

## Resources

- [Notifuse API reference](https://docs.notifuse.com/api-reference)
- [Notifuse webhooks](https://docs.notifuse.com/features/webhooks)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)

## License

[MIT](LICENSE)
