
### POST /api/transactional.send
_Send a transactional notification_
Sends a transactional notification to a contact through specified channels.
Requires authentication.

auth: Bearer token
body:
  - workspace_id [*REQ*] (string) — The ID of the workspace
  - notification [*REQ*] (TransactionalNotificationSendParams)
    - id [*REQ*] (string) — ID of the notification to send
    - external_id [opt] (string) — External ID for idempotency checks
    - contact [*REQ*] (Contact)
      - email [*REQ*] (string(email)) — Email address of the contact
      - external_id [opt] (string) — External identifier for the contact
      - timezone [opt] (string) — Timezone of the contact
      - language [opt] (string) — Preferred language of the contact
      - first_name [opt] (string) — First name of the contact
      - last_name [opt] (string) — Last name of the contact
      - full_name [opt] (string) — Full name of the contact (for systems that don't have separate first/last names)
      - phone [opt] (string) — Phone number of the contact
      - address_line_1 [opt] (string) — First line of address
      - address_line_2 [opt] (string) — Second line of address
      - country [opt] (string) — Country of the contact
      - postcode [opt] (string) — Postal code
      - state [opt] (string) — State or province
      - job_title [opt] (string) — Job title of the contact
      - custom_string_1 [opt] (string) — Custom string field 1
      - custom_string_2 [opt] (string) — Custom string field 2
      - custom_string_3 [opt] (string) — Custom string field 3
      - custom_string_4 [opt] (string) — Custom string field 4
      - custom_string_5 [opt] (string) — Custom string field 5
      - custom_number_1 [opt] (number(float)) — Custom number field 1
      - custom_number_2 [opt] (number(float)) — Custom number field 2
      - custom_number_3 [opt] (number(float)) — Custom number field 3
      - custom_number_4 [opt] (number(float)) — Custom number field 4
      - custom_number_5 [opt] (number(float)) — Custom number field 5
      - custom_datetime_1 [opt] (string(date-time)) — Custom datetime field 1
      - custom_datetime_2 [opt] (string(date-time)) — Custom datetime field 2
      - custom_datetime_3 [opt] (string(date-time)) — Custom datetime field 3
      - custom_datetime_4 [opt] (string(date-time)) — Custom datetime field 4
      - custom_datetime_5 [opt] (string(date-time)) — Custom datetime field 5
      - custom_json_1 [opt] (object) — Custom JSON field 1
      - custom_json_2 [opt] (object) — Custom JSON field 2
      - custom_json_3 [opt] (object) — Custom JSON field 3
      - custom_json_4 [opt] (object) — Custom JSON field 4
      - custom_json_5 [opt] (object) — Custom JSON field 5
      - created_at [opt] (string(date-time)) — When the contact was created (read-only, set by server)
      - updated_at [opt] (string(date-time)) — When the contact was last updated (read-only, set by server)
      - contact_lists [opt] (array<ContactList>) — Lists the contact is subscribed to (read-only, included in GET responses only)
      - contact_segments [opt] (array<ContactSegment>) — Segments the contact belongs to (read-only, included in GET responses only)
    - channels [*REQ*] (array<string>) — Channels to send through (at least one required)
    - data [opt] (object) — Data to populate the template with
    - metadata [opt] (object) — Additional metadata for tracking
    - email_options [opt] (object) — Email-specific options
      - from_name [opt] (string) — Override default sender from name
      - subject [opt] (string) — Override template subject line. Supports Liquid templating variables.
      - subject_preview [opt] (string) — Override template preheader/preview text. Supports Liquid templating variables.
      - cc [opt] (array<string>) — CC email addresses
      - bcc [opt] (array<string>) — BCC email addresses
      - reply_to [opt] (string(email)) — Reply-To email address
      - attachments [opt] (array<EmailAttachment>) — Email attachments (max 20 files, 3MB per file, 10MB total)

### GET /api/contacts.list
_List contacts with filtering and pagination_
Retrieves a paginated list of contacts with optional filtering. All contact fields are always returned.

**Filtering**: Use filters to search for contacts. Text filters (email, external_id, first_name
auth: Bearer token
query/path params:
  - workspace_id [*REQ*] in:query (string) — The ID of the workspace
  - email [opt] in:query (string) — Filter by email (case-insensitive partial match)
  - external_id [opt] in:query (string) — Filter by external ID (case-insensitive partial match)
  - first_name [opt] in:query (string) — Filter by first name (case-insensitive partial match)
  - last_name [opt] in:query (string) — Filter by last name (case-insensitive partial match)
  - full_name [opt] in:query (string) — Filter by full name (case-insensitive partial match)
  - phone [opt] in:query (string) — Filter by phone number (case-insensitive partial match)
  - country [opt] in:query (string) — Filter by country (case-insensitive partial match)
  - language [opt] in:query (string) — Filter by language (case-insensitive partial match)
  - list_id [opt] in:query (string) — Filter by list membership (contacts subscribed to this list)
  - contact_list_status [opt] in:query (string) enum=['active', 'pending', 'unsubscribed', 'bounced', 'complained'] — Filter by subscription status within the list
  - segments[] [opt] in:query (array<string>) — Filter by segment membership (contacts in any of these segments)
  - with_contact_lists [opt] in:query (boolean) — Include contact list subscriptions in the response
  - limit [opt] in:query (integer) — Maximum number of contacts to return (1-100)
  - cursor [opt] in:query (string) — Pagination cursor from previous response

### GET /api/contacts.count
_Count contacts in a workspace_
Returns the total number of contacts in a workspace.
auth: Bearer token
query/path params:
  - workspace_id [*REQ*] in:query (string) — The ID of the workspace

### POST /api/contacts.upsert
_Create or update a contact_
Creates a new contact or updates an existing one based on email address. Returns information about whether the contact was created or updated.
auth: Bearer token
body:
  - workspace_id [*REQ*] (string) — The ID of the workspace
  - contact [*REQ*] (ContactInput)
    - email [*REQ*] (string(email)) — Email address of the contact
    - external_id [opt] (string) — External identifier for the contact
    - timezone [opt] (string) — Timezone of the contact
    - language [opt] (string) — Preferred language of the contact
    - first_name [opt] (string) — First name of the contact
    - last_name [opt] (string) — Last name of the contact
    - full_name [opt] (string) — Full name of the contact (for systems that don't have separate first/last names)
    - phone [opt] (string) — Phone number of the contact
    - address_line_1 [opt] (string) — First line of address
    - address_line_2 [opt] (string) — Second line of address
    - country [opt] (string) — Country of the contact
    - postcode [opt] (string) — Postal code
    - state [opt] (string) — State or province
    - job_title [opt] (string) — Job title of the contact
    - custom_string_1 [opt] (string) — Custom string field 1
    - custom_string_2 [opt] (string) — Custom string field 2
    - custom_string_3 [opt] (string) — Custom string field 3
    - custom_string_4 [opt] (string) — Custom string field 4
    - custom_string_5 [opt] (string) — Custom string field 5
    - custom_number_1 [opt] (number(float)) — Custom number field 1
    - custom_number_2 [opt] (number(float)) — Custom number field 2
    - custom_number_3 [opt] (number(float)) — Custom number field 3
    - custom_number_4 [opt] (number(float)) — Custom number field 4
    - custom_number_5 [opt] (number(float)) — Custom number field 5
    - custom_datetime_1 [opt] (string(date-time)) — Custom datetime field 1
    - custom_datetime_2 [opt] (string(date-time)) — Custom datetime field 2
    - custom_datetime_3 [opt] (string(date-time)) — Custom datetime field 3
    - custom_datetime_4 [opt] (string(date-time)) — Custom datetime field 4
    - custom_datetime_5 [opt] (string(date-time)) — Custom datetime field 5
    - custom_json_1 [opt] (object) — Custom JSON field 1 (must be a JSON object or array)
    - custom_json_2 [opt] (object) — Custom JSON field 2 (must be a JSON object or array)
    - custom_json_3 [opt] (object) — Custom JSON field 3 (must be a JSON object or array)
    - custom_json_4 [opt] (object) — Custom JSON field 4 (must be a JSON object or array)
    - custom_json_5 [opt] (object) — Custom JSON field 5 (must be a JSON object or array)

### GET /api/contacts.getByEmail
_Get a contact by email address_
Retrieves a contact by their email address within a specific workspace. The response always includes the contact's list subscriptions with their status (active, pending, unsubscribed, bounced, complai
auth: Bearer token
query/path params:
  - workspace_id [*REQ*] in:query (string) — The ID of the workspace
  - email [*REQ*] in:query (string(email)) — The email address of the contact

### GET /api/contacts.getByExternalID
_Get a contact by external ID_
Retrieves a contact by their external ID within a specific workspace. The response always includes the contact's list subscriptions with their status (active, pending, unsubscribed, bounced, complaine
auth: Bearer token
query/path params:
  - workspace_id [*REQ*] in:query (string) — The ID of the workspace
  - external_id [*REQ*] in:query (string) — The external ID of the contact

### POST /api/contacts.import
_Batch import contacts_
Creates or updates multiple contacts in a single batch operation. This is significantly more efficient than individual upsert operations. Optionally subscribes all contacts to specified lists.
auth: Bearer token
body:
  - workspace_id [*REQ*] (string) — The ID of the workspace
  - contacts [*REQ*] (array<ContactInput>) — Array of contacts to import (create or update)
    - email [*REQ*] (string(email)) — Email address of the contact
    - external_id [opt] (string) — External identifier for the contact
    - timezone [opt] (string) — Timezone of the contact
    - language [opt] (string) — Preferred language of the contact
    - first_name [opt] (string) — First name of the contact
    - last_name [opt] (string) — Last name of the contact
    - full_name [opt] (string) — Full name of the contact (for systems that don't have separate first/last names)
    - phone [opt] (string) — Phone number of the contact
    - address_line_1 [opt] (string) — First line of address
    - address_line_2 [opt] (string) — Second line of address
    - country [opt] (string) — Country of the contact
    - postcode [opt] (string) — Postal code
    - state [opt] (string) — State or province
    - job_title [opt] (string) — Job title of the contact
    - custom_string_1 [opt] (string) — Custom string field 1
    - custom_string_2 [opt] (string) — Custom string field 2
    - custom_string_3 [opt] (string) — Custom string field 3
    - custom_string_4 [opt] (string) — Custom string field 4
    - custom_string_5 [opt] (string) — Custom string field 5
    - custom_number_1 [opt] (number(float)) — Custom number field 1
    - custom_number_2 [opt] (number(float)) — Custom number field 2
    - custom_number_3 [opt] (number(float)) — Custom number field 3
    - custom_number_4 [opt] (number(float)) — Custom number field 4
    - custom_number_5 [opt] (number(float)) — Custom number field 5
    - custom_datetime_1 [opt] (string(date-time)) — Custom datetime field 1
    - custom_datetime_2 [opt] (string(date-time)) — Custom datetime field 2
    - custom_datetime_3 [opt] (string(date-time)) — Custom datetime field 3
    - custom_datetime_4 [opt] (string(date-time)) — Custom datetime field 4
    - custom_datetime_5 [opt] (string(date-time)) — Custom datetime field 5
    - custom_json_1 [opt] (object) — Custom JSON field 1 (must be a JSON object or array)
    - custom_json_2 [opt] (object) — Custom JSON field 2 (must be a JSON object or array)
    - custom_json_3 [opt] (object) — Custom JSON field 3 (must be a JSON object or array)
    - custom_json_4 [opt] (object) — Custom JSON field 4 (must be a JSON object or array)
    - custom_json_5 [opt] (object) — Custom JSON field 5 (must be a JSON object or array)
  - subscribe_to_lists [opt] (array<string>) — Optional array of list IDs to subscribe all contacts to

### POST /api/contacts.delete
_Delete a contact_
Deletes a contact from the workspace by email address. This action is permanent and cannot be undone.
auth: Bearer token
body:
  - workspace_id [*REQ*] (string) — The ID of the workspace
  - email [*REQ*] (string(email)) — Email address of the contact to delete

### POST /api/contactLists.updateStatus
_Update contact list subscription status_
Updates the subscription status of a contact in a specific list. Can set status to active, pending, unsubscribed, bounced, or complained.

**Note:** This endpoint only modifies **existing** list membe
auth: Bearer token
body:
  - workspace_id [*REQ*] (string) — The ID of the workspace
  - email [*REQ*] (string(email)) — Email address of the contact
  - list_id [*REQ*] (string) — ID of the list
  - status [*REQ*] (string) enum=['active', 'pending', 'unsubscribed', 'bounced', 'complained'] — New subscription status

### GET /api/broadcasts.list
_List broadcasts_
Retrieves a list of broadcasts with pagination and optional filtering by status. Supports fetching template details for each variation.
auth: Bearer token
query/path params:
  - workspace_id [*REQ*] in:query (string) — The ID of the workspace
  - status [opt] in:query (string) enum=['draft', 'scheduled', 'sending', 'paused', 'sent', 'cancelled', 'failed', 'testing', 'test_completed', 'winner_selected'] — Filter broadcasts by status
  - limit [opt] in:query (integer) — Maximum number of broadcasts to return
  - offset [opt] in:query (integer) — Number of broadcasts to skip for pagination
  - with_templates [opt] in:query (boolean) — Include full template details for each variation

### GET /api/broadcasts.get
_Get a broadcast_
Retrieves a single broadcast by ID. Optionally includes template details for each variation.
auth: Bearer token
query/path params:
  - workspace_id [*REQ*] in:query (string) — The ID of the workspace
  - id [*REQ*] in:query (string) — The ID of the broadcast
  - with_templates [opt] in:query (boolean) — Include full template details for each variation

### POST /api/broadcasts.create
_Create a broadcast_
Creates a new broadcast campaign in draft status.

**Important:** Creating a broadcast does not schedule or send it. After creating the broadcast,
you must call the `/api/broadcasts.schedule` endpoint
auth: Bearer token
body:
  - workspace_id [*REQ*] (string) — The ID of the workspace
  - name [*REQ*] (string) — Name of the broadcast
  - audience [*REQ*] (AudienceSettings)
    - list [*REQ*] (string) — List ID to send to
    - segments [opt] (array<string>) — Optional segment IDs to filter recipients
    - exclude_unsubscribed [opt] (boolean) — Whether to exclude unsubscribed contacts
  - test_settings [opt] (BroadcastTestSettings)
    - enabled [opt] (boolean) — Whether A/B testing is enabled
    - sample_percentage [opt] (integer) — Percentage of audience to use for testing
    - auto_send_winner [opt] (boolean) — Automatically send winning variation to remaining audience
    - auto_send_winner_metric [opt] (string) enum=['open_rate', 'click_rate'] — Metric used to determine the winner
    - test_duration_hours [opt] (integer) — Duration of the test in hours (max 7 days)
    - variations [opt] (array<BroadcastVariation>) — Test variations (2-8 variations allowed)
      - variation_name [opt] (string) — Name of this variation
      - template_id [*REQ*] (string) — Template ID for this variation
      - metrics [opt] (VariationMetrics)
      - template [opt] (object) — Full template object (populated when with_templates=true)
  - tracking_enabled [opt] (boolean) — Enable click and open tracking
  - utm_parameters [opt] (UTMParameters)
    - source [opt] (string) — UTM source parameter
    - medium [opt] (string) — UTM medium parameter
    - campaign [opt] (string) — UTM campaign parameter
    - term [opt] (string) — UTM term parameter
    - content [opt] (string) — UTM content parameter
  - data_feed [opt] (DataFeedSettings)
    - global_feed [opt] (GlobalFeedSettings)
      - enabled [opt] (boolean) — Whether the global data feed is enabled
      - url [opt] (string) — URL endpoint to fetch global data from (must be HTTPS)
      - headers [opt] (array<DataFeedHeader>) — Custom HTTP headers to include in the request
    - global_feed_data [opt] (object) — Cached data from the global feed (populated after fetch)
    - global_feed_fetched_at [opt] (string(date-time)) — When the global feed was last fetched
    - recipient_feed [opt] (RecipientFeedSettings)
      - enabled [opt] (boolean) — Whether the per-recipient data feed is enabled
      - url [opt] (string) — URL endpoint to fetch per-recipient data from (must be HTTPS)
      - headers [opt] (array<DataFeedHeader>) — Custom HTTP headers to include in the request
  - metadata [opt] (object) — Custom metadata for the broadcast

### POST /api/broadcasts.update
_Update a broadcast_
Updates an existing broadcast. Only broadcasts in draft, scheduled, or paused status can be updated.
auth: Bearer token
body:
  - workspace_id [*REQ*] (string) — The ID of the workspace
  - id [*REQ*] (string) — ID of the broadcast to update
  - name [*REQ*] (string) — Name of the broadcast
  - audience [*REQ*] (AudienceSettings)
    - list [*REQ*] (string) — List ID to send to
    - segments [opt] (array<string>) — Optional segment IDs to filter recipients
    - exclude_unsubscribed [opt] (boolean) — Whether to exclude unsubscribed contacts
  - schedule [opt] (ScheduleSettings)
    - is_scheduled [opt] (boolean) — Whether the broadcast is scheduled (false after creation, set via broadcasts.schedule)
    - scheduled_date [opt] (string) — Scheduled date in YYYY-MM-DD format
    - scheduled_time [opt] (string) — Scheduled time in HH:MM format
    - timezone [opt] (string) — IANA timezone
    - use_recipient_timezone [opt] (boolean) — Send at scheduled time in each recipient's timezone
  - test_settings [opt] (BroadcastTestSettings)
    - enabled [opt] (boolean) — Whether A/B testing is enabled
    - sample_percentage [opt] (integer) — Percentage of audience to use for testing
    - auto_send_winner [opt] (boolean) — Automatically send winning variation to remaining audience
    - auto_send_winner_metric [opt] (string) enum=['open_rate', 'click_rate'] — Metric used to determine the winner
    - test_duration_hours [opt] (integer) — Duration of the test in hours (max 7 days)
    - variations [opt] (array<BroadcastVariation>) — Test variations (2-8 variations allowed)
      - variation_name [opt] (string) — Name of this variation
      - template_id [*REQ*] (string) — Template ID for this variation
      - metrics [opt] (VariationMetrics)
      - template [opt] (object) — Full template object (populated when with_templates=true)
  - tracking_enabled [opt] (boolean) — Enable click and open tracking
  - utm_parameters [opt] (UTMParameters)
    - source [opt] (string) — UTM source parameter
    - medium [opt] (string) — UTM medium parameter
    - campaign [opt] (string) — UTM campaign parameter
    - term [opt] (string) — UTM term parameter
    - content [opt] (string) — UTM content parameter
  - data_feed [opt] (DataFeedSettings)
    - global_feed [opt] (GlobalFeedSettings)
      - enabled [opt] (boolean) — Whether the global data feed is enabled
      - url [opt] (string) — URL endpoint to fetch global data from (must be HTTPS)
      - headers [opt] (array<DataFeedHeader>) — Custom HTTP headers to include in the request
    - global_feed_data [opt] (object) — Cached data from the global feed (populated after fetch)
    - global_feed_fetched_at [opt] (string(date-time)) — When the global feed was last fetched
    - recipient_feed [opt] (RecipientFeedSettings)
      - enabled [opt] (boolean) — Whether the per-recipient data feed is enabled
      - url [opt] (string) — URL endpoint to fetch per-recipient data from (must be HTTPS)
      - headers [opt] (array<DataFeedHeader>) — Custom HTTP headers to include in the request
  - metadata [opt] (object) — Custom metadata for the broadcast

### POST /api/broadcasts.schedule
_Schedule a broadcast_
Schedules a broadcast for sending either immediately or at a specified time. This endpoint is restricted in demo mode.
auth: Bearer token
body:
  - workspace_id [*REQ*] (string) — The ID of the workspace
  - id [*REQ*] (string) — ID of the broadcast to schedule
  - send_now [opt] (boolean) — Send immediately instead of scheduling
  - scheduled_date [opt] (string) — Scheduled date in YYYY-MM-DD format (required if send_now=false)
  - scheduled_time [opt] (string) — Scheduled time in HH:MM format (required if send_now=false)
  - timezone [opt] (string) — IANA timezone
  - use_recipient_timezone [opt] (boolean) — Send at scheduled time in each recipient's timezone

### POST /api/broadcasts.pause
_Pause a broadcast_
Pauses a broadcast that is currently sending.
auth: Bearer token
body:
  - workspace_id [*REQ*] (string) — The ID of the workspace
  - id [*REQ*] (string) — ID of the broadcast to pause

### POST /api/broadcasts.resume
_Resume a broadcast_
Resumes a paused broadcast.
auth: Bearer token
body:
  - workspace_id [*REQ*] (string) — The ID of the workspace
  - id [*REQ*] (string) — ID of the broadcast to resume

### POST /api/broadcasts.cancel
_Cancel a broadcast_
Cancels a scheduled broadcast.
auth: Bearer token
body:
  - workspace_id [*REQ*] (string) — The ID of the workspace
  - id [*REQ*] (string) — ID of the broadcast to cancel

### POST /api/broadcasts.sendToIndividual
_Send broadcast to individual_
Sends a broadcast to a single recipient for testing purposes. Optionally specify which template variation to send.
auth: Bearer token
body:
  - workspace_id [*REQ*] (string) — The ID of the workspace
  - broadcast_id [*REQ*] (string) — ID of the broadcast
  - recipient_email [*REQ*] (string(email)) — Email address to send test to
  - template_id [opt] (string) — Optional specific template variation to send

### POST /api/broadcasts.delete
_Delete a broadcast_
Deletes a broadcast. This action is permanent and cannot be undone.
auth: Bearer token
body:
  - workspace_id [*REQ*] (string) — The ID of the workspace
  - id [*REQ*] (string) — ID of the broadcast to delete

### GET /api/broadcasts.getTestResults
_Get A/B test results_
Retrieves the performance metrics for all variations in an A/B test broadcast.
auth: Bearer token
query/path params:
  - workspace_id [*REQ*] in:query (string) — The ID of the workspace
  - id [*REQ*] in:query (string) — The ID of the broadcast

### POST /api/broadcasts.selectWinner
_Select winning A/B test variation_
Manually selects the winning variation for an A/B test broadcast. The winning variation will be sent to the remaining audience. This endpoint is restricted in demo mode.
auth: Bearer token
body:
  - workspace_id [*REQ*] (string) — The ID of the workspace
  - id [*REQ*] (string) — ID of the broadcast
  - template_id [*REQ*] (string) — Template ID of the winning variation

### POST /api/broadcasts.refreshGlobalFeed
_Refresh global feed data_
Fetches fresh data from the configured global feed URL and stores it in the broadcast.
The global feed must be enabled for the broadcast before calling this endpoint.

auth: Bearer token
body:
  - workspace_id [*REQ*] (string) — The ID of the workspace
  - broadcast_id [*REQ*] (string) — ID of the broadcast
  - url [*REQ*] (string(uri)) — The feed URL to fetch data from
  - headers [opt] (array<DataFeedHeader>) — Optional custom headers to send with the request
    - name [*REQ*] (string) — HTTP header name
    - value [*REQ*] (string) — HTTP header value

### POST /api/broadcasts.testRecipientFeed
_Test recipient feed configuration_
Tests the per-recipient feed configuration by fetching data for a specific contact or a random contact from the broadcast audience.
The recipient feed must be enabled for the broadcast before calling 
auth: Bearer token
body:
  - workspace_id [*REQ*] (string) — The ID of the workspace
  - broadcast_id [*REQ*] (string) — ID of the broadcast
  - contact_email [opt] (string(email)) — Optional email of a specific contact to test with. If not provided, uses a random contact 
  - url [*REQ*] (string(uri)) — The feed URL to fetch data from (must use HTTPS)
  - headers [opt] (array<DataFeedHeader>) — Optional custom headers to send with the request
    - name [*REQ*] (string) — HTTP header name
    - value [*REQ*] (string) — HTTP header value

### GET /api/templates.list
_List templates_
Retrieves a list of all templates in the workspace. Supports optional filtering by category and channel.
auth: Bearer token
query/path params:
  - workspace_id [*REQ*] in:query (string) — The ID of the workspace
  - category [opt] in:query (string) enum=['marketing', 'transactional', 'welcome', 'opt_in', 'unsubscribe', 'bounce', 'blocklist', 'blog', 'other'] — Filter templates by category
  - channel [opt] in:query (string) enum=['email', 'web'] — Filter templates by channel

### GET /api/templates.get
_Get a template_
Retrieves a single template by ID. Optionally specify a version number to retrieve a specific version.
auth: Bearer token
query/path params:
  - workspace_id [*REQ*] in:query (string) — The ID of the workspace
  - id [*REQ*] in:query (string) — The ID of the template
  - version [opt] in:query (integer(int64)) — Specific version number (defaults to latest)

### POST /api/templates.create
_Create a template_
Creates a new template. Each template must have a channel (email or web) with corresponding channel-specific content.
auth: Bearer token
body:
  - workspace_id [*REQ*] (string) — The ID of the workspace
  - id [*REQ*] (string) — Unique identifier for the template (alphanumeric, underscores, and hyphens only)
  - name [*REQ*] (string) — Name of the template
  - channel [*REQ*] (string) enum=['email', 'web'] — Communication channel
  - email [opt] (EmailTemplate)
    - sender_id [opt] (string) — ID of the sender configuration to use
    - reply_to [opt] (string(email)) — Reply-To email address
    - subject [*REQ*] (string) — Email subject line (supports Liquid templating)
    - subject_preview [opt] (string) — Preview text shown in email clients
    - compiled_preview [*REQ*] (string) — Compiled HTML preview of the email
    - visual_editor_tree [*REQ*] (object) — MJML visual editor tree structure
    - text [opt] (string) — Plain text version of the email
  - web [opt] (WebTemplate)
    - content [*REQ*] (object) — Tiptap JSON content (source of truth for web templates)
    - html [opt] (string) — Pre-rendered HTML for display
    - plain_text [opt] (string) — Extracted text for search indexing
  - category [*REQ*] (string) enum=['marketing', 'transactional', 'welcome', 'opt_in', 'unsubscribe', 'bounce', 'blocklist', 'blog', 'other'] — Template category
  - template_macro_id [opt] (string) — ID of the template macro (layout) to use
  - test_data [opt] (object) — Test data for template preview
  - settings [opt] (object) — Channel-specific settings

### POST /api/templates.update
_Update a template_
Updates an existing template. Creates a new version of the template.
auth: Bearer token
body:
  - workspace_id [*REQ*] (string) — The ID of the workspace
  - id [*REQ*] (string) — ID of the template to update
  - name [*REQ*] (string) — Name of the template
  - channel [*REQ*] (string) enum=['email', 'web'] — Communication channel
  - email [opt] (EmailTemplate)
    - sender_id [opt] (string) — ID of the sender configuration to use
    - reply_to [opt] (string(email)) — Reply-To email address
    - subject [*REQ*] (string) — Email subject line (supports Liquid templating)
    - subject_preview [opt] (string) — Preview text shown in email clients
    - compiled_preview [*REQ*] (string) — Compiled HTML preview of the email
    - visual_editor_tree [*REQ*] (object) — MJML visual editor tree structure
    - text [opt] (string) — Plain text version of the email
  - web [opt] (WebTemplate)
    - content [*REQ*] (object) — Tiptap JSON content (source of truth for web templates)
    - html [opt] (string) — Pre-rendered HTML for display
    - plain_text [opt] (string) — Extracted text for search indexing
  - category [*REQ*] (string) enum=['marketing', 'transactional', 'welcome', 'opt_in', 'unsubscribe', 'bounce', 'blocklist', 'blog', 'other'] — Template category
  - template_macro_id [opt] (string) — ID of the template macro (layout) to use
  - test_data [opt] (object) — Test data for template preview
  - settings [opt] (object) — Channel-specific settings

### POST /api/templates.delete
_Delete a template_
Soft-deletes a template. The template will be marked as deleted but not removed from the database.
auth: Bearer token
body:
  - workspace_id [*REQ*] (string) — The ID of the workspace
  - id [*REQ*] (string) — ID of the template to delete

### POST /api/templates.compile
_Compile template_
Compiles an MJML template with provided data, returning the rendered HTML.
When `subject` and/or `subject_preview` are provided, they are rendered
through the same Liquid engine used at send time and 
auth: Bearer token
body:
  - workspace_id [*REQ*] (string) — The ID of the workspace
  - message_id [*REQ*] (string) — Unique message ID for tracking
  - visual_editor_tree [*REQ*] (object) — MJML visual editor tree structure (must have type 'mjml')
  - subject [opt] (string) — Optional email subject. When provided, it is rendered through the same
Liquid engine the s
  - subject_preview [opt] (string) — Optional inbox preview text (the snippet shown after the subject in
most clients). Rendere
  - test_data [opt] (object) — Data to use for Liquid templating
  - tracking_settings [opt] (TrackingSettings)
    - enable_tracking [opt] (boolean) — Whether to enable click/open tracking
    - endpoint [opt] (string) — API endpoint for tracking redirects
    - utm_source [opt] (string) — UTM source parameter
    - utm_medium [opt] (string) — UTM medium parameter
    - utm_campaign [opt] (string) — UTM campaign parameter
    - utm_content [opt] (string) — UTM content parameter
    - utm_term [opt] (string) — UTM term parameter
    - workspace_id [opt] (string) — Workspace ID for tracking
    - message_id [opt] (string) — Message ID for tracking
  - channel [opt] (string) enum=['email', 'web'] — Channel filter for block visibility

### POST /api/customEvents.import
_Import custom events_
Imports multiple custom events in a single batch operation. Maximum 50 events per request. Auto-creates contacts if they don't exist.
auth: Bearer token
body:
  - workspace_id [*REQ*] (string) — The ID of the workspace
  - events [*REQ*] (array<object>) — Array of custom events to import (1-50 events)

### POST /api/webhookSubscriptions.create
_Create a webhook subscription_
Creates a new webhook subscription to receive HTTP callbacks when specified events occur in the workspace.
auth: Bearer token
body:
  - workspace_id [*REQ*] (string) — The ID of the workspace
  - name [*REQ*] (string) — Human-readable name for the subscription
  - url [*REQ*] (string(uri)) — The HTTPS URL to receive webhook events
  - event_types [*REQ*] (array<string>) — List of event types to subscribe to
  - custom_event_filters [opt] (CustomEventFilters)
    - goal_types [opt] (array<string>) — Filter by goal type (e.g., purchase, subscription, lead)
    - event_names [opt] (array<string>) — Filter by event name (e.g., orders/fulfilled, payment.succeeded)

### GET /api/webhookSubscriptions.list
_List webhook subscriptions_
Returns all webhook subscriptions for the specified workspace.
auth: Bearer token
query/path params:
  - workspace_id [*REQ*] in:query (string) — The ID of the workspace

### GET /api/webhookSubscriptions.get
_Get a webhook subscription_
Retrieves a specific webhook subscription by ID.
auth: Bearer token
query/path params:
  - workspace_id [*REQ*] in:query (string) — The ID of the workspace
  - id [*REQ*] in:query (string) — The ID of the webhook subscription

### POST /api/webhookSubscriptions.update
_Update a webhook subscription_
Updates an existing webhook subscription with new configuration.
auth: Bearer token
body:
  - workspace_id [*REQ*] (string) — The ID of the workspace
  - id [*REQ*] (string) — The ID of the subscription to update
  - name [*REQ*] (string) — Updated name
  - url [*REQ*] (string(uri)) — Updated URL
  - event_types [*REQ*] (array<string>) — Updated list of event types
  - custom_event_filters [opt] (CustomEventFilters)
    - goal_types [opt] (array<string>) — Filter by goal type (e.g., purchase, subscription, lead)
    - event_names [opt] (array<string>) — Filter by event name (e.g., orders/fulfilled, payment.succeeded)
  - enabled [opt] (boolean) — Whether the subscription is enabled

### POST /api/webhookSubscriptions.delete
_Delete a webhook subscription_
Permanently deletes a webhook subscription. This action cannot be undone.
auth: Bearer token
body:
  - workspace_id [*REQ*] (string) — The ID of the workspace
  - id [*REQ*] (string) — The ID of the subscription to delete

### POST /api/webhookSubscriptions.toggle
_Toggle webhook subscription enabled state_
Enables or disables a webhook subscription. Disabled subscriptions will not receive events.
auth: Bearer token
body:
  - workspace_id [*REQ*] (string) — The ID of the workspace
  - id [*REQ*] (string) — The ID of the subscription
  - enabled [*REQ*] (boolean) — Whether to enable or disable the subscription

### POST /api/webhookSubscriptions.regenerateSecret
_Regenerate webhook secret_
Generates a new signing secret for the webhook subscription. The old secret will immediately become invalid.
auth: Bearer token
body:
  - workspace_id [*REQ*] (string) — The ID of the workspace
  - id [*REQ*] (string) — The ID of the subscription

### GET /api/webhookSubscriptions.deliveries
_Get webhook delivery history_
Returns the delivery history for a webhook subscription, including status and response information.
auth: Bearer token
query/path params:
  - workspace_id [*REQ*] in:query (string) — The ID of the workspace
  - subscription_id [opt] in:query (string) — The ID of the webhook subscription (optional - if not provided, returns all deli
  - limit [opt] in:query (integer) — Number of deliveries to return (1-100)
  - offset [opt] in:query (integer) — Offset for pagination

### POST /api/webhookSubscriptions.test
_Send a test webhook_
Sends a test webhook to the subscription's URL to verify connectivity and configuration.
auth: Bearer token
body:
  - workspace_id [*REQ*] (string) — The ID of the workspace
  - id [*REQ*] (string) — The ID of the subscription to test
  - event_type [opt] (string) — Optional event type to use for the test webhook payload

### GET /api/webhookSubscriptions.eventTypes
_List available event types_
Returns a list of all available webhook event types that can be subscribed to.
auth: Bearer token

### POST /subscribe
_Subscribe to email lists_
Subscribe a contact to one or more email lists. This is a public endpoint that doesn't require authentication.

**Important:** For unauthenticated requests, only **public lists** can be subscribed to.
auth: PUBLIC (no token)
body:
  - workspace_id [*REQ*] (string) — The ID of the workspace
  - contact [*REQ*] (SubscriptionContact)
    - email [*REQ*] (string(email)) — Email address of the contact
    - email_hmac [opt] (string) — HMAC of the email for authenticated subscription (optional)
    - external_id [opt] (string) — External identifier for the contact
    - timezone [opt] (string) — Timezone of the contact
    - language [opt] (string) — Preferred language of the contact
    - first_name [opt] (string) — First name of the contact
    - last_name [opt] (string) — Last name of the contact
    - full_name [opt] (string) — Full name of the contact (for systems that don't have separate first/last names)
    - phone [opt] (string) — Phone number of the contact
    - address_line_1 [opt] (string) — First line of address
    - address_line_2 [opt] (string) — Second line of address
    - country [opt] (string) — Country of the contact
    - postcode [opt] (string) — Postal code
    - state [opt] (string) — State or province
    - job_title [opt] (string) — Job title of the contact
    - custom_string_1 [opt] (string) — Custom string field 1
    - custom_string_2 [opt] (string) — Custom string field 2
    - custom_string_3 [opt] (string) — Custom string field 3
    - custom_string_4 [opt] (string) — Custom string field 4
    - custom_string_5 [opt] (string) — Custom string field 5
    - custom_number_1 [opt] (number(float)) — Custom number field 1
    - custom_number_2 [opt] (number(float)) — Custom number field 2
    - custom_number_3 [opt] (number(float)) — Custom number field 3
    - custom_number_4 [opt] (number(float)) — Custom number field 4
    - custom_number_5 [opt] (number(float)) — Custom number field 5
    - custom_datetime_1 [opt] (string(date-time)) — Custom datetime field 1
    - custom_datetime_2 [opt] (string(date-time)) — Custom datetime field 2
    - custom_datetime_3 [opt] (string(date-time)) — Custom datetime field 3
    - custom_datetime_4 [opt] (string(date-time)) — Custom datetime field 4
    - custom_datetime_5 [opt] (string(date-time)) — Custom datetime field 5
    - custom_json_1 [opt] (object) — Custom JSON field 1
    - custom_json_2 [opt] (object) — Custom JSON field 2
    - custom_json_3 [opt] (object) — Custom JSON field 3
    - custom_json_4 [opt] (object) — Custom JSON field 4
    - custom_json_5 [opt] (object) — Custom JSON field 5
  - list_ids [*REQ*] (array<string>) — Array of list IDs to subscribe the contact to

### POST /api/lists.subscribe
_Subscribe to email lists (authenticated)_
Subscribe a contact to one or more email lists. This is an authenticated endpoint that requires a bearer token.

Unlike the public `/subscribe` endpoint, this endpoint can subscribe contacts to **any 
auth: Bearer token
body:
  - workspace_id [*REQ*] (string) — The ID of the workspace
  - contact [*REQ*] (SubscriptionContact)
    - email [*REQ*] (string(email)) — Email address of the contact
    - email_hmac [opt] (string) — HMAC of the email for authenticated subscription (optional)
    - external_id [opt] (string) — External identifier for the contact
    - timezone [opt] (string) — Timezone of the contact
    - language [opt] (string) — Preferred language of the contact
    - first_name [opt] (string) — First name of the contact
    - last_name [opt] (string) — Last name of the contact
    - full_name [opt] (string) — Full name of the contact (for systems that don't have separate first/last names)
    - phone [opt] (string) — Phone number of the contact
    - address_line_1 [opt] (string) — First line of address
    - address_line_2 [opt] (string) — Second line of address
    - country [opt] (string) — Country of the contact
    - postcode [opt] (string) — Postal code
    - state [opt] (string) — State or province
    - job_title [opt] (string) — Job title of the contact
    - custom_string_1 [opt] (string) — Custom string field 1
    - custom_string_2 [opt] (string) — Custom string field 2
    - custom_string_3 [opt] (string) — Custom string field 3
    - custom_string_4 [opt] (string) — Custom string field 4
    - custom_string_5 [opt] (string) — Custom string field 5
    - custom_number_1 [opt] (number(float)) — Custom number field 1
    - custom_number_2 [opt] (number(float)) — Custom number field 2
    - custom_number_3 [opt] (number(float)) — Custom number field 3
    - custom_number_4 [opt] (number(float)) — Custom number field 4
    - custom_number_5 [opt] (number(float)) — Custom number field 5
    - custom_datetime_1 [opt] (string(date-time)) — Custom datetime field 1
    - custom_datetime_2 [opt] (string(date-time)) — Custom datetime field 2
    - custom_datetime_3 [opt] (string(date-time)) — Custom datetime field 3
    - custom_datetime_4 [opt] (string(date-time)) — Custom datetime field 4
    - custom_datetime_5 [opt] (string(date-time)) — Custom datetime field 5
    - custom_json_1 [opt] (object) — Custom JSON field 1
    - custom_json_2 [opt] (object) — Custom JSON field 2
    - custom_json_3 [opt] (object) — Custom JSON field 3
    - custom_json_4 [opt] (object) — Custom JSON field 4
    - custom_json_5 [opt] (object) — Custom JSON field 5
  - list_ids [*REQ*] (array<string>) — Array of list IDs to subscribe the contact to

### POST /api/user.rootSignin
_Root user programmatic signin_
Authenticates the root user using HMAC signature for programmatic access.
This endpoint is designed for automation scenarios like Infrastructure-as-Code
deployments, CI/CD pipelines, and automated tes
auth: PUBLIC (no token)
body:
  - email [*REQ*] (string(email)) — The root user's email address (must match configured ROOT_EMAIL)
  - timestamp [*REQ*] (integer(int64)) — Unix timestamp (seconds since epoch). Must be within 60 seconds of server time.
  - signature [*REQ*] (string) — HMAC-SHA256 signature computed as: HMAC-SHA256(email + ":" + timestamp, SECRET_KEY)
The si
