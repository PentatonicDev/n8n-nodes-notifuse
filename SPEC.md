# Implementation contract — Notifuse resource modules

This file is the contract every resource module MUST follow. The foundation
(credential, `GenericFunctions.ts`, router `Notifuse.node.ts`, triggers, icons,
CI) is already done. You only implement one resource module under
`nodes/Notifuse/resources/<resource>.ts`.

## Golden reference

`nodes/Notifuse/resources/contact.ts` is the canonical example. **Match its
structure, naming, formatting (tabs), and idioms exactly.** When in doubt, copy
the pattern from `contact.ts`.

## API reference

`NOTIFUSE_API_REFERENCE.md` (repo root) lists every endpoint with its method,
query params and request body fields, each marked `*REQ*` (required) or `opt`.
This is the source of truth for which fields exist and which are required.

## Module shape (exactly three exports)

```ts
import { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';
import { notifuseApiRequest } from '../GenericFunctions';

export const <resource>Operations: INodeProperties[] = [ /* Operation dropdown */ ];
export const <resource>Fields: INodeProperties[] = [ /* all params */ ];

export async function execute<Resource>(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> { /* route each operation */ }
```

The router already imports these and wires the `resource` dropdown. Do not edit
the router, the credential, or `GenericFunctions.ts`.

## Hard rules

1. **Never** add a `workspace_id` field, and never put `workspace_id` in the
   body/qs. `notifuseApiRequest` injects it automatically from the credential
   (query string for GET, body for writes). Same for the base URL and the
   Bearer token — all handled by the helper.
2. Make the HTTP call ONLY via `notifuseApiRequest.call(this, method, endpoint, body?, qs?)`.
   - GET: pass query params as the 5th arg (`qs`). Endpoint paths are like
     `/api/contacts.list`.
   - POST: pass the body as the 4th arg.
3. **Required API fields** (`*REQ*`, excluding `workspace_id`) become real node
   fields with `required: true` and `displayOptions.show` gated on
   `resource` + `operation`.
4. **Optional API fields** go inside an `Additional Fields` collection (for
   writes) or a `Filters` collection (for list/search GETs), exactly like
   `contact.ts`. Never mark optional fields as required.
5. Deeply nested object/array bodies (e.g. broadcast `audience`, template
   `email` content, event arrays) are exposed as a `json` type field. Parse with
   `typeof x === 'string' ? JSON.parse(x) : x` before sending (see
   `contact.ts` import op).
6. Return the raw API response object (or an array for list operations). For
   list endpoints that wrap results (e.g. `{ contacts: [...] }`), return the
   inner array; otherwise return the object.
7. Use tabs for indentation. Operation `value`s are camelCase verbs
   (`create`, `getAll`, `get`, `update`, `delete`, ...). Display names are Title
   Case. Add `action` and `description` to each operation entry.
8. Do not add tests — tests are a separate pass.

## Your assigned resource

(See the dispatch message for which resource and its endpoint list. Use only the
endpoints listed; everything else is out of scope. Webhook-management endpoints
`webhookSubscriptions.*` are NOT part of any resource — they belong to the
trigger nodes.)

After writing the file, run `npx tsc --noEmit` and `npm run lint` and fix any
issues in YOUR file only before finishing.
