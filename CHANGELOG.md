# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.0] - 2026-06-09

### Changed

- **Reverted the trigger to a single flat `Events` field** (as in 1.2.0). The 1.3.0 resource +
  per-resource `operation` structure made n8n's node creator double-list events and show bare,
  context-less labels ("Created" three times, etc.). The flat, entity-prefixed list is clearer
  and stable. n8n does not support per-entity grouping for trigger events.

## [1.3.0] - 2026-06-09

### Fixed

- **Credential icon now renders.** The gulp build only copied node icons, so
  `dist/credentials/notifuse.svg` was never produced and n8n showed no credential icon.

### Changed

- **Trigger events are now grouped by entity in the nodes panel.** The trigger is structured as
  `resource` (entity) + a per-resource `operation` (multiOptions of events), so n8n's node creator
  renders per-entity sections (via `resourceCategories`). Note: n8n labels these sections
  "… Actions" (no triggers variant) and adds one generic "On new event" entry — cosmetic n8n
  limitations.
- Credential **API URL** placeholder is now `https://notifuse.example.com`; the **Workspace ID**
  field no longer shows a placeholder.

## [1.2.0] - 2026-06-09

### Changed

- **Notifuse Trigger now exposes all event types in a single `Events` field.** n8n's node creator
  only surfaces events from the first property named "Events", so the previous per-resource event
  fields meant only the Contact events showed up in the panel. Events are now one flat (but
  entity-prefixed) list, so every event appears as its own selectable trigger under the Notifuse
  app. (n8n only supports the Resource split for actions, not triggers.)

### Removed

- **User → Root Sign In** action. The HMAC root sign-in endpoint is an auth-bootstrap mechanism
  (IaC/CI), not a workspace operation, and doesn't fit the per-workspace credential model.

## [1.1.0] - 2026-06-09

### Changed

- **Consolidated the five entity trigger nodes into a single `Notifuse Trigger` node** with a
  Resource (entity) + Events selector, mirroring the action node. This makes the trigger appear
  under the "Notifuse" app in the nodes panel (alongside the actions) instead of as separate
  apps. Behaviour (self-registration, Standard Webhooks signature verification, security options)
  is unchanged.

### Removed

- The separate `Notifuse Contact/List/Segment/Email/Custom Event Trigger` nodes (replaced by the
  single `Notifuse Trigger`). Existing workflows using the old trigger nodes must switch to the
  new node.

## [1.0.1] - 2026-06-08

### Changed

- Release published via npm trusted publisher (OIDC) from GitHub Actions. No functional changes.

## [1.0.0] - 2026-06-08

### Added

- **Notifuse API credential** scoped per workspace (API URL + API token + workspace ID),
  injecting the Bearer token and `workspace_id` automatically on every request.
- **Notifuse action node** covering the full API by resource:
  - Contact: count, create or update, delete, get by email, get by external ID, get many, import
  - List: subscribe, subscribe (public), update subscription status
  - Broadcast: create, update, get, get many, schedule, pause, resume, cancel, delete,
    send to individual, get test results, select winner, refresh global feed, test recipient feed
  - Template: create, update, get, get many, delete, compile
  - Transactional: send
  - Custom Event: import
  - User: root sign in (HMAC)
- **Five trigger nodes** (Contact, List, Segment, Email, Custom Event) that self-register and
  self-remove Notifuse webhook subscriptions and verify Standard Webhooks HMAC signatures.
- Per-trigger webhook security options: signature verification, IP allowlist, CORS origins,
  bot filtering, and raw-body passthrough.
