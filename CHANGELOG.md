# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
