import { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';
import { notifuseApiRequest } from '../GenericFunctions';

/**
 * Broadcast resource module.
 *
 * Follows the contact.ts golden reference shape:
 *   - `broadcastOperations`: the Operation dropdown (shown only for this resource).
 *   - `broadcastFields`: all parameters, each gated by `displayOptions` on
 *     resource + operation. Required API fields are real required node fields;
 *     optional API fields live inside an "Additional Fields" collection. Deeply
 *     nested object/array bodies are exposed as `json` fields and parsed before sending.
 *   - `executeBroadcast(operation, i)`: routes one item to the Notifuse API.
 *
 * Endpoints: see NOTIFUSE_API_REFERENCE.md (broadcasts.*).
 */

export const broadcastOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['broadcast'] } },
		options: [
			{
				name: 'Cancel',
				value: 'cancel',
				description: 'Cancel a scheduled broadcast',
				action: 'Cancel a broadcast',
			},
			{
				name: 'Create',
				value: 'create',
				description: 'Create a new broadcast in draft status',
				action: 'Create a broadcast',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a broadcast permanently',
				action: 'Delete a broadcast',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Retrieve a single broadcast by ID',
				action: 'Get a broadcast',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Retrieve many broadcasts with filtering',
				action: 'Get many broadcasts',
			},
			{
				name: 'Get Test Results',
				value: 'getTestResults',
				description: 'Retrieve A/B test performance metrics',
				action: 'Get A/B test results',
			},
			{
				name: 'Pause',
				value: 'pause',
				description: 'Pause a broadcast that is currently sending',
				action: 'Pause a broadcast',
			},
			{
				name: 'Refresh Global Feed',
				value: 'refreshGlobalFeed',
				description: 'Fetch fresh data from the configured global feed URL',
				action: 'Refresh the global feed',
			},
			{
				name: 'Resume',
				value: 'resume',
				description: 'Resume a paused broadcast',
				action: 'Resume a broadcast',
			},
			{
				name: 'Schedule',
				value: 'schedule',
				description: 'Schedule a broadcast for sending now or at a specified time',
				action: 'Schedule a broadcast',
			},
			{
				name: 'Select Winner',
				value: 'selectWinner',
				description: 'Manually select the winning A/B test variation',
				action: 'Select the winning variation',
			},
			{
				name: 'Send to Individual',
				value: 'sendToIndividual',
				description: 'Send a broadcast to a single recipient for testing',
				action: 'Send a broadcast to an individual',
			},
			{
				name: 'Test Recipient Feed',
				value: 'testRecipientFeed',
				description: 'Test the per-recipient feed configuration',
				action: 'Test the recipient feed',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update an existing broadcast',
				action: 'Update a broadcast',
			},
		],
		default: 'create',
	},
];

export const broadcastFields: INodeProperties[] = [
	// ---------- getAll ----------
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: { show: { resource: ['broadcast'], operation: ['getAll'] } },
		description: 'Whether to return all results or only up to a given limit',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 50,
		typeOptions: { minValue: 1, maxValue: 100 },
		displayOptions: {
			show: { resource: ['broadcast'], operation: ['getAll'], returnAll: [false] },
		},
		description: 'Max number of results to return',
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show: { resource: ['broadcast'], operation: ['getAll'] } },
		options: [
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				default: 'draft',
				options: [
					{ name: 'Cancelled', value: 'cancelled' },
					{ name: 'Draft', value: 'draft' },
					{ name: 'Failed', value: 'failed' },
					{ name: 'Paused', value: 'paused' },
					{ name: 'Scheduled', value: 'scheduled' },
					{ name: 'Sending', value: 'sending' },
					{ name: 'Sent', value: 'sent' },
					{ name: 'Test Completed', value: 'test_completed' },
					{ name: 'Testing', value: 'testing' },
					{ name: 'Winner Selected', value: 'winner_selected' },
				],
			},
			{
				displayName: 'Include Templates',
				name: 'with_templates',
				type: 'boolean',
				default: false,
				description: 'Whether to include full template details for each variation',
			},
		],
	},

	// ---------- get ----------
	{
		displayName: 'Broadcast ID',
		name: 'id',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['broadcast'], operation: ['get'] } },
		description: 'The ID of the broadcast',
	},
	{
		displayName: 'Include Templates',
		name: 'with_templates',
		type: 'boolean',
		default: false,
		displayOptions: { show: { resource: ['broadcast'], operation: ['get'] } },
		description: 'Whether to include full template details for each variation',
	},

	// ---------- create ----------
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['broadcast'], operation: ['create'] } },
		description: 'Name of the broadcast',
	},
	{
		displayName: 'Audience (JSON)',
		name: 'audience',
		type: 'json',
		required: true,
		default: '{\n\t"list": ""\n}',
		displayOptions: { show: { resource: ['broadcast'], operation: ['create'] } },
		description:
			'Audience settings: list (required), segments (array), exclude_unsubscribed (boolean)',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: ['broadcast'], operation: ['create'] } },
		options: [
			{
				displayName: 'Test Settings (JSON)',
				name: 'test_settings',
				type: 'json',
				default: '{}',
				description: 'A/B test settings (enabled, sample_percentage, variations, etc.)',
			},
			{
				displayName: 'Tracking Enabled',
				name: 'tracking_enabled',
				type: 'boolean',
				default: false,
				description: 'Whether to enable click and open tracking',
			},
			{
				displayName: 'UTM Parameters (JSON)',
				name: 'utm_parameters',
				type: 'json',
				default: '{}',
				description: 'UTM parameters: source, medium, campaign, term, content',
			},
			{
				displayName: 'Data Feed (JSON)',
				name: 'data_feed',
				type: 'json',
				default: '{}',
				description: 'Data feed settings (global_feed, recipient_feed)',
			},
			{
				displayName: 'Metadata (JSON)',
				name: 'metadata',
				type: 'json',
				default: '{}',
				description: 'Custom metadata for the broadcast',
			},
		],
	},

	// ---------- update ----------
	{
		displayName: 'Broadcast ID',
		name: 'id',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['broadcast'], operation: ['update'] } },
		description: 'ID of the broadcast to update',
	},
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['broadcast'], operation: ['update'] } },
		description: 'Name of the broadcast',
	},
	{
		displayName: 'Audience (JSON)',
		name: 'audience',
		type: 'json',
		required: true,
		default: '{\n\t"list": ""\n}',
		displayOptions: { show: { resource: ['broadcast'], operation: ['update'] } },
		description:
			'Audience settings: list (required), segments (array), exclude_unsubscribed (boolean)',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: ['broadcast'], operation: ['update'] } },
		options: [
			{
				displayName: 'Schedule (JSON)',
				name: 'schedule',
				type: 'json',
				default: '{}',
				description:
					'Schedule settings: is_scheduled, scheduled_date, scheduled_time, timezone, use_recipient_timezone',
			},
			{
				displayName: 'Test Settings (JSON)',
				name: 'test_settings',
				type: 'json',
				default: '{}',
				description: 'A/B test settings (enabled, sample_percentage, variations, etc.)',
			},
			{
				displayName: 'Tracking Enabled',
				name: 'tracking_enabled',
				type: 'boolean',
				default: false,
				description: 'Whether to enable click and open tracking',
			},
			{
				displayName: 'UTM Parameters (JSON)',
				name: 'utm_parameters',
				type: 'json',
				default: '{}',
				description: 'UTM parameters: source, medium, campaign, term, content',
			},
			{
				displayName: 'Data Feed (JSON)',
				name: 'data_feed',
				type: 'json',
				default: '{}',
				description: 'Data feed settings (global_feed, recipient_feed)',
			},
			{
				displayName: 'Metadata (JSON)',
				name: 'metadata',
				type: 'json',
				default: '{}',
				description: 'Custom metadata for the broadcast',
			},
		],
	},

	// ---------- schedule ----------
	{
		displayName: 'Broadcast ID',
		name: 'id',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['broadcast'], operation: ['schedule'] } },
		description: 'ID of the broadcast to schedule',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: ['broadcast'], operation: ['schedule'] } },
		options: [
			{
				displayName: 'Send Now',
				name: 'send_now',
				type: 'boolean',
				default: false,
				description: 'Whether to send immediately instead of scheduling',
			},
			{
				displayName: 'Scheduled Date',
				name: 'scheduled_date',
				type: 'string',
				default: '',
				placeholder: 'YYYY-MM-DD',
				description: 'Scheduled date in YYYY-MM-DD format (required if Send Now is false)',
			},
			{
				displayName: 'Scheduled Time',
				name: 'scheduled_time',
				type: 'string',
				default: '',
				placeholder: 'HH:MM',
				description: 'Scheduled time in HH:MM format (required if Send Now is false)',
			},
			{
				displayName: 'Timezone',
				name: 'timezone',
				type: 'string',
				default: '',
				description: 'IANA timezone',
			},
			{
				displayName: 'Use Recipient Timezone',
				name: 'use_recipient_timezone',
				type: 'boolean',
				default: false,
				description: "Whether to send at the scheduled time in each recipient's timezone",
			},
		],
	},

	// ---------- pause ----------
	{
		displayName: 'Broadcast ID',
		name: 'id',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['broadcast'], operation: ['pause'] } },
		description: 'ID of the broadcast to pause',
	},

	// ---------- resume ----------
	{
		displayName: 'Broadcast ID',
		name: 'id',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['broadcast'], operation: ['resume'] } },
		description: 'ID of the broadcast to resume',
	},

	// ---------- cancel ----------
	{
		displayName: 'Broadcast ID',
		name: 'id',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['broadcast'], operation: ['cancel'] } },
		description: 'ID of the broadcast to cancel',
	},

	// ---------- delete ----------
	{
		displayName: 'Broadcast ID',
		name: 'id',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['broadcast'], operation: ['delete'] } },
		description: 'ID of the broadcast to delete',
	},

	// ---------- sendToIndividual ----------
	{
		displayName: 'Broadcast ID',
		name: 'broadcast_id',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['broadcast'], operation: ['sendToIndividual'] } },
		description: 'ID of the broadcast',
	},
	{
		displayName: 'Recipient Email',
		name: 'recipient_email',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'name@example.com',
		displayOptions: { show: { resource: ['broadcast'], operation: ['sendToIndividual'] } },
		description: 'Email address to send the test to',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: ['broadcast'], operation: ['sendToIndividual'] } },
		options: [
			{
				displayName: 'Template ID',
				name: 'template_id',
				type: 'string',
				default: '',
				description: 'Optional specific template variation to send',
			},
		],
	},

	// ---------- getTestResults ----------
	{
		displayName: 'Broadcast ID',
		name: 'id',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['broadcast'], operation: ['getTestResults'] } },
		description: 'The ID of the broadcast',
	},

	// ---------- selectWinner ----------
	{
		displayName: 'Broadcast ID',
		name: 'id',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['broadcast'], operation: ['selectWinner'] } },
		description: 'ID of the broadcast',
	},
	{
		displayName: 'Template ID',
		name: 'template_id',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['broadcast'], operation: ['selectWinner'] } },
		description: 'Template ID of the winning variation',
	},

	// ---------- refreshGlobalFeed ----------
	{
		displayName: 'Broadcast ID',
		name: 'broadcast_id',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['broadcast'], operation: ['refreshGlobalFeed'] } },
		description: 'ID of the broadcast',
	},
	{
		displayName: 'Feed URL',
		name: 'url',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['broadcast'], operation: ['refreshGlobalFeed'] } },
		description: 'The feed URL to fetch data from',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: ['broadcast'], operation: ['refreshGlobalFeed'] } },
		options: [
			{
				displayName: 'Headers (JSON)',
				name: 'headers',
				type: 'json',
				default: '[]',
				description:
					'Optional custom headers to send with the request. Array of { name, value } objects.',
			},
		],
	},

	// ---------- testRecipientFeed ----------
	{
		displayName: 'Broadcast ID',
		name: 'broadcast_id',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['broadcast'], operation: ['testRecipientFeed'] } },
		description: 'ID of the broadcast',
	},
	{
		displayName: 'Feed URL',
		name: 'url',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['broadcast'], operation: ['testRecipientFeed'] } },
		description: 'The feed URL to fetch data from (must use HTTPS)',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: ['broadcast'], operation: ['testRecipientFeed'] } },
		options: [
			{
				displayName: 'Contact Email',
				name: 'contact_email',
				type: 'string',
				default: '',
				placeholder: 'name@example.com',
				description:
					'Optional email of a specific contact to test with. If not provided, uses a random contact.',
			},
			{
				displayName: 'Headers (JSON)',
				name: 'headers',
				type: 'json',
				default: '[]',
				description:
					'Optional custom headers to send with the request. Array of { name, value } objects.',
			},
		],
	},
];

function parseJsonParam(value: unknown): IDataObject {
	return (typeof value === 'string' ? JSON.parse(value) : value) as IDataObject;
}

function applyJsonFields(body: IDataObject, fields: IDataObject, jsonKeys: string[]): void {
	for (const [key, value] of Object.entries(fields)) {
		if (jsonKeys.includes(key)) {
			body[key] = parseJsonParam(value);
		} else {
			body[key] = value;
		}
	}
}

export async function executeBroadcast(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	if (operation === 'getAll') {
		const returnAll = this.getNodeParameter('returnAll', i) as boolean;
		const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
		const qs: IDataObject = { ...filters };

		if (returnAll) {
			const results: IDataObject[] = [];
			const pageSize = 100;
			let offset = 0;
			let pageCount = 0;
			qs.limit = pageSize;
			do {
				qs.offset = offset;
				const page = await notifuseApiRequest.call(this, 'GET', '/api/broadcasts.list', {}, qs);
				const broadcasts = (page.broadcasts as IDataObject[]) ?? [];
				results.push(...broadcasts);
				pageCount = broadcasts.length;
				offset += pageSize;
			} while (pageCount === pageSize);
			return results;
		}

		qs.limit = this.getNodeParameter('limit', i, 50) as number;
		const page = await notifuseApiRequest.call(this, 'GET', '/api/broadcasts.list', {}, qs);
		return (page.broadcasts as IDataObject[]) ?? page;
	}

	if (operation === 'get') {
		const id = this.getNodeParameter('id', i) as string;
		const withTemplates = this.getNodeParameter('with_templates', i, false) as boolean;
		return await notifuseApiRequest.call(this, 'GET', '/api/broadcasts.get', {}, {
			id,
			with_templates: withTemplates,
		});
	}

	if (operation === 'create') {
		const name = this.getNodeParameter('name', i) as string;
		const audience = parseJsonParam(this.getNodeParameter('audience', i));
		const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;
		const body: IDataObject = { name, audience };
		applyJsonFields(body, additionalFields, [
			'test_settings',
			'utm_parameters',
			'data_feed',
			'metadata',
		]);
		return await notifuseApiRequest.call(this, 'POST', '/api/broadcasts.create', body);
	}

	if (operation === 'update') {
		const id = this.getNodeParameter('id', i) as string;
		const name = this.getNodeParameter('name', i) as string;
		const audience = parseJsonParam(this.getNodeParameter('audience', i));
		const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;
		const body: IDataObject = { id, name, audience };
		applyJsonFields(body, additionalFields, [
			'schedule',
			'test_settings',
			'utm_parameters',
			'data_feed',
			'metadata',
		]);
		return await notifuseApiRequest.call(this, 'POST', '/api/broadcasts.update', body);
	}

	if (operation === 'schedule') {
		const id = this.getNodeParameter('id', i) as string;
		const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;
		const body: IDataObject = { id, ...additionalFields };
		return await notifuseApiRequest.call(this, 'POST', '/api/broadcasts.schedule', body);
	}

	if (operation === 'pause') {
		const id = this.getNodeParameter('id', i) as string;
		return await notifuseApiRequest.call(this, 'POST', '/api/broadcasts.pause', { id });
	}

	if (operation === 'resume') {
		const id = this.getNodeParameter('id', i) as string;
		return await notifuseApiRequest.call(this, 'POST', '/api/broadcasts.resume', { id });
	}

	if (operation === 'cancel') {
		const id = this.getNodeParameter('id', i) as string;
		return await notifuseApiRequest.call(this, 'POST', '/api/broadcasts.cancel', { id });
	}

	if (operation === 'delete') {
		const id = this.getNodeParameter('id', i) as string;
		return await notifuseApiRequest.call(this, 'POST', '/api/broadcasts.delete', { id });
	}

	if (operation === 'sendToIndividual') {
		const broadcastId = this.getNodeParameter('broadcast_id', i) as string;
		const recipientEmail = this.getNodeParameter('recipient_email', i) as string;
		const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;
		const body: IDataObject = {
			broadcast_id: broadcastId,
			recipient_email: recipientEmail,
			...additionalFields,
		};
		return await notifuseApiRequest.call(this, 'POST', '/api/broadcasts.sendToIndividual', body);
	}

	if (operation === 'getTestResults') {
		const id = this.getNodeParameter('id', i) as string;
		return await notifuseApiRequest.call(this, 'GET', '/api/broadcasts.getTestResults', {}, { id });
	}

	if (operation === 'selectWinner') {
		const id = this.getNodeParameter('id', i) as string;
		const templateId = this.getNodeParameter('template_id', i) as string;
		return await notifuseApiRequest.call(this, 'POST', '/api/broadcasts.selectWinner', {
			id,
			template_id: templateId,
		});
	}

	if (operation === 'refreshGlobalFeed') {
		const broadcastId = this.getNodeParameter('broadcast_id', i) as string;
		const url = this.getNodeParameter('url', i) as string;
		const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;
		const body: IDataObject = { broadcast_id: broadcastId, url };
		applyJsonFields(body, additionalFields, ['headers']);
		return await notifuseApiRequest.call(this, 'POST', '/api/broadcasts.refreshGlobalFeed', body);
	}

	if (operation === 'testRecipientFeed') {
		const broadcastId = this.getNodeParameter('broadcast_id', i) as string;
		const url = this.getNodeParameter('url', i) as string;
		const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;
		const body: IDataObject = { broadcast_id: broadcastId, url };
		applyJsonFields(body, additionalFields, ['headers']);
		return await notifuseApiRequest.call(this, 'POST', '/api/broadcasts.testRecipientFeed', body);
	}

	return {};
}
