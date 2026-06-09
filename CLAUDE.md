# CLAUDE.md — n8n-nodes-notifuse

Guidance for working in this repository. Read this before changing code.

## What this is

An n8n community node package wrapping the [Notifuse API](https://docs.notifuse.com/api-reference).
Published **publicly to npm** as `@pentatonic-dev/n8n-nodes-notifuse` (same deploy model as
`n8n-nodes-aws-sqs`). Node ≥ 22.

## Architecture

```
credentials/NotifuseApi.credentials.ts   Bearer token + apiUrl + workspaceId (per workspace)
nodes/Notifuse/
  Notifuse.node.ts                        Router: Resource dropdown → executeX per resource
  GenericFunctions.ts                     notifuseApiRequest() — builds URL from credential,
                                          injects workspace_id (qs for GET, body for writes),
                                          applies Bearer auth
  resources/<resource>.ts                 One module per resource: <r>Operations, <r>Fields, executeX
  shared/webhookHelpers.ts                IP allowlist / CORS / bot filtering for triggers
  shared/triggerFunctions.ts             TRIGGER_RESOURCES + buildNotifuseTriggerDescription +
                                          shared webhook handler + self-registration lifecycle +
                                          Standard Webhooks verify
nodes/NotifuseTrigger/                    Single "Notifuse Trigger" node: Resource (entity) +
                                          per-resource Events; named so n8n groups it under the
                                          "Notifuse" app (base name must match the action node)
```

`nodes/Notifuse/resources/contact.ts` is the **golden reference** for resource modules.
`SPEC.md` is the implementation contract. `NOTIFUSE_API_REFERENCE.md` is the resolved
endpoint reference generated from the OpenAPI spec (`https://docs.notifuse.com/openapi.json`).

## Hard rules

- Never add or send `workspace_id` from a resource module — `notifuseApiRequest` injects it.
- Make every HTTP call via `notifuseApiRequest` (the only exception is `user.rootSignin`,
  which is public + HMAC and uses `this.helpers.httpRequest` directly).
- Required API fields → required node fields gated on `resource` + `operation`.
  Optional fields → `Additional Fields` (writes) or `Filters` (list GETs) collections.
  Deeply nested objects/arrays → `json` fields parsed with
  `typeof x === 'string' ? JSON.parse(x) : x`.
- Webhook-management endpoints (`webhookSubscriptions.*`) are NOT action operations — they
  back the trigger nodes' lifecycle only.
- On trigger classes, `icon` and `usableAsTool` must be **literal** properties on the class
  description object (the n8n eslint plugin checks them statically), so they are declared
  outside the `buildTriggerDescription()` spread.

## Adding / changing an endpoint

1. Confirm the shape in `NOTIFUSE_API_REFERENCE.md` (or regenerate from the OpenAPI spec).
2. Add the operation + fields to the right `resources/<resource>.ts`, following `contact.ts`.
3. Route it in that file's `execute<Resource>`.
4. Add tests in `tests/nodes/<resource>.test.ts` using `tests/helpers.ts`.

## Commands

```bash
npm install
npm run build      # rimraf dist && tsc && gulp build:icons
npm run lint       # eslint nodes credentials  (must be clean)
npm test           # jest, enforces coverage thresholds (80/70/75/80)
npx tsc --noEmit   # typecheck
```

## Release

- CI (`.github/workflows/ci.yml`) runs lint + test + build on push/PR.
- Tagging `v*` triggers `.github/workflows/publish.yml`: test → publish to npm
  (`--access public`) → GitHub Release.
- The first publish uses an npm token; subsequent releases use npm trusted publisher (OIDC,
  `id-token: write` is already set on the publish job).
