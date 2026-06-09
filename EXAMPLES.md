# Examples

These snippets assume a configured **Notifuse API** credential.

## Create or update a contact

Notifuse node → Resource **Contact** → Operation **Create or Update**:

- **Email**: `jane@example.com`
- **Additional Fields** → First Name `Jane`, and
  **Custom Fields (JSON)**: `{ "custom_string_1": "vip", "custom_number_1": 42 }`

## Send a transactional notification

Notifuse node → Resource **Transactional** → Operation **Send**:

- **Notification ID**: `welcome-email`
- **Contact Email**: `jane@example.com`
- **Channels**: `email`
- **Additional Fields** → **Data (JSON)**: `{ "first_name": "Jane", "activation_url": "https://app.example.com/activate/abc" }`

## List contacts (paginated)

Notifuse node → Resource **Contact** → Operation **Get Many**:

- **Return All**: on (transparently follows the `next_cursor` pagination), or set a **Limit**.
- **Filters** → e.g. List ID `list_news`, Contact List Status `active`.

## React to email events

**Notifuse Email Trigger**:

- **Events**: `email.opened`, `email.clicked`
- **Verify Signature**: on (verifies the Standard Webhooks HMAC using the auto-stored secret)

Activating the workflow registers a webhook subscription in Notifuse pointing at the n8n
webhook URL; deactivating it removes the subscription. Each event arrives as an item:

```json
{
  "id": "evt_123",
  "type": "email.opened",
  "timestamp": "2026-06-08T12:00:00Z",
  "workspace_id": "ws_1234567890",
  "data": { "email": "jane@example.com", "message_id": "msg_abc" }
}
```

## Create a broadcast

Notifuse node → Resource **Broadcast** → Operation **Create**:

- **Name**: `June Newsletter`
- **Audience (JSON)**: `{ "list": "list_news", "exclude_unsubscribed": true }`
- **Additional Fields** → **UTM Parameters (JSON)**: `{ "source": "newsletter", "medium": "email" }`

Then **Schedule** it (same resource) with **Send Now** or a scheduled date/time.
