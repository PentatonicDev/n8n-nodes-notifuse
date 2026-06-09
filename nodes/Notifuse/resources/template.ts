import { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';
import { notifuseApiRequest } from '../GenericFunctions';

/**
 * Template resource module.
 *
 * Endpoints: see NOTIFUSE_API_REFERENCE.md (templates.*).
 */

// Reusable category options (used in create, update, and filters).
const categoryOptions = [
	{ name: 'Blog', value: 'blog' },
	{ name: 'Blocklist', value: 'blocklist' },
	{ name: 'Bounce', value: 'bounce' },
	{ name: 'Marketing', value: 'marketing' },
	{ name: 'Opt-In', value: 'opt_in' },
	{ name: 'Other', value: 'other' },
	{ name: 'Transactional', value: 'transactional' },
	{ name: 'Unsubscribe', value: 'unsubscribe' },
	{ name: 'Welcome', value: 'welcome' },
];

// Reusable channel options.
const channelOptions = [
	{ name: 'Email', value: 'email' },
	{ name: 'Web', value: 'web' },
];

// Additional Fields shared by create and update.
const createUpdateAdditionalFields: INodeProperties[] = [
	{
		displayName: 'Email Content (JSON)',
		name: 'email',
		type: 'json',
		default: '{}',
		description:
			'EmailTemplate object: sender_id, reply_to, subject, subject_preview, compiled_preview, visual_editor_tree, text',
	},
	{
		displayName: 'Web Content (JSON)',
		name: 'web',
		type: 'json',
		default: '{}',
		description: 'WebTemplate object: content (Tiptap JSON), html, plain_text',
	},
	{
		displayName: 'Template Macro ID',
		name: 'template_macro_id',
		type: 'string',
		default: '',
		description: 'ID of the template macro (layout) to use',
	},
	{
		displayName: 'Test Data (JSON)',
		name: 'test_data',
		type: 'json',
		default: '{}',
		description: 'Test data for template preview',
	},
	{
		displayName: 'Settings (JSON)',
		name: 'settings',
		type: 'json',
		default: '{}',
		description: 'Channel-specific settings',
	},
];

export const templateOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['template'] } },
		options: [
			{
				name: 'Compile',
				value: 'compile',
				description: 'Compile an MJML template with data and return the rendered HTML',
				action: 'Compile a template',
			},
			{
				name: 'Create',
				value: 'create',
				description: 'Create a new template',
				action: 'Create a template',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Soft-delete a template by ID',
				action: 'Delete a template',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Retrieve a single template by ID',
				action: 'Get a template',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Retrieve many templates with optional filtering',
				action: 'Get many templates',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update an existing template (creates a new version)',
				action: 'Update a template',
			},
		],
		default: 'getAll',
	},
];

export const templateFields: INodeProperties[] = [
	// ---------- getAll ----------
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show: { resource: ['template'], operation: ['getAll'] } },
		options: [
			{
				displayName: 'Category',
				name: 'category',
				type: 'options',
				default: 'marketing',
				options: categoryOptions,
				description: 'Filter templates by category',
			},
			{
				displayName: 'Channel',
				name: 'channel',
				type: 'options',
				default: 'email',
				options: channelOptions,
				description: 'Filter templates by channel',
			},
		],
	},

	// ---------- get ----------
	{
		displayName: 'Template ID',
		name: 'id',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['template'], operation: ['get'] } },
		description: 'The ID of the template to retrieve',
	},
	{
		displayName: 'Version',
		name: 'version',
		type: 'number',
		default: '',
		typeOptions: { numberStepSize: 1 },
		displayOptions: { show: { resource: ['template'], operation: ['get'] } },
		description: 'Specific version number to retrieve (defaults to latest)',
	},

	// ---------- create ----------
	{
		displayName: 'Template ID',
		name: 'id',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['template'], operation: ['create'] } },
		description: 'Unique identifier for the template (alphanumeric, underscores, and hyphens only)',
	},
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['template'], operation: ['create'] } },
		description: 'Name of the template',
	},
	{
		displayName: 'Channel',
		name: 'channel',
		type: 'options',
		required: true,
		default: 'email',
		options: channelOptions,
		displayOptions: { show: { resource: ['template'], operation: ['create'] } },
		description: 'Communication channel for the template',
	},
	{
		displayName: 'Category',
		name: 'category',
		type: 'options',
		required: true,
		default: 'transactional',
		options: categoryOptions,
		displayOptions: { show: { resource: ['template'], operation: ['create'] } },
		description: 'Category of the template',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: ['template'], operation: ['create'] } },
		options: createUpdateAdditionalFields,
	},

	// ---------- update ----------
	{
		displayName: 'Template ID',
		name: 'id',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['template'], operation: ['update'] } },
		description: 'ID of the template to update',
	},
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['template'], operation: ['update'] } },
		description: 'Name of the template',
	},
	{
		displayName: 'Channel',
		name: 'channel',
		type: 'options',
		required: true,
		default: 'email',
		options: channelOptions,
		displayOptions: { show: { resource: ['template'], operation: ['update'] } },
		description: 'Communication channel for the template',
	},
	{
		displayName: 'Category',
		name: 'category',
		type: 'options',
		required: true,
		default: 'transactional',
		options: categoryOptions,
		displayOptions: { show: { resource: ['template'], operation: ['update'] } },
		description: 'Category of the template',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: ['template'], operation: ['update'] } },
		options: createUpdateAdditionalFields,
	},

	// ---------- delete ----------
	{
		displayName: 'Template ID',
		name: 'id',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['template'], operation: ['delete'] } },
		description: 'ID of the template to delete',
	},

	// ---------- compile ----------
	{
		displayName: 'Message ID',
		name: 'message_id',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['template'], operation: ['compile'] } },
		description: 'Unique message ID for tracking',
	},
	{
		displayName: 'Visual Editor Tree (JSON)',
		name: 'visual_editor_tree',
		type: 'json',
		required: true,
		default: '{}',
		displayOptions: { show: { resource: ['template'], operation: ['compile'] } },
		description: 'MJML visual editor tree structure (must have type "mjml")',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: ['template'], operation: ['compile'] } },
		options: [
			{
				displayName: 'Subject',
				name: 'subject',
				type: 'string',
				default: '',
				description: 'Optional email subject rendered through the Liquid engine',
			},
			{
				displayName: 'Subject Preview',
				name: 'subject_preview',
				type: 'string',
				default: '',
				description: 'Optional inbox preview text rendered through the Liquid engine',
			},
			{
				displayName: 'Test Data (JSON)',
				name: 'test_data',
				type: 'json',
				default: '{}',
				description: 'Data to use for Liquid templating',
			},
			{
				displayName: 'Tracking Settings (JSON)',
				name: 'tracking_settings',
				type: 'json',
				default: '{}',
				description:
					'Tracking settings object: enable_tracking, endpoint, utm_source, utm_medium, utm_campaign, utm_content, utm_term',
			},
			{
				displayName: 'Channel',
				name: 'channel',
				type: 'options',
				default: 'email',
				options: channelOptions,
				description: 'Channel filter for block visibility',
			},
		],
	},
];

function parseJsonField(value: unknown): IDataObject | undefined {
	if (!value || (typeof value === 'string' && value.trim() === '{}') || (typeof value === 'object' && Object.keys(value as object).length === 0)) {
		return undefined;
	}
	return typeof value === 'string' ? JSON.parse(value) : (value as IDataObject);
}

export async function executeTemplate(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	if (operation === 'getAll') {
		const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
		const qs: IDataObject = { ...filters };
		const response = await notifuseApiRequest.call(this, 'GET', '/api/templates.list', {}, qs);
		return (response.templates as IDataObject[]) ?? response;
	}

	if (operation === 'get') {
		const id = this.getNodeParameter('id', i) as string;
		const version = this.getNodeParameter('version', i, '') as number | string;
		const qs: IDataObject = { id };
		if (version !== '' && version !== null && version !== undefined) {
			qs.version = version;
		}
		return await notifuseApiRequest.call(this, 'GET', '/api/templates.get', {}, qs);
	}

	if (operation === 'create') {
		const id = this.getNodeParameter('id', i) as string;
		const name = this.getNodeParameter('name', i) as string;
		const channel = this.getNodeParameter('channel', i) as string;
		const category = this.getNodeParameter('category', i) as string;
		const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;

		const body: IDataObject = { id, name, channel, category };

		const emailRaw = additionalFields.email;
		const webRaw = additionalFields.web;
		const testDataRaw = additionalFields.test_data;
		const settingsRaw = additionalFields.settings;

		const email = parseJsonField(emailRaw);
		if (email) body.email = email;

		const web = parseJsonField(webRaw);
		if (web) body.web = web;

		if (additionalFields.template_macro_id) {
			body.template_macro_id = additionalFields.template_macro_id;
		}

		const testData = parseJsonField(testDataRaw);
		if (testData) body.test_data = testData;

		const settings = parseJsonField(settingsRaw);
		if (settings) body.settings = settings;

		return await notifuseApiRequest.call(this, 'POST', '/api/templates.create', body);
	}

	if (operation === 'update') {
		const id = this.getNodeParameter('id', i) as string;
		const name = this.getNodeParameter('name', i) as string;
		const channel = this.getNodeParameter('channel', i) as string;
		const category = this.getNodeParameter('category', i) as string;
		const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;

		const body: IDataObject = { id, name, channel, category };

		const emailRaw = additionalFields.email;
		const webRaw = additionalFields.web;
		const testDataRaw = additionalFields.test_data;
		const settingsRaw = additionalFields.settings;

		const email = parseJsonField(emailRaw);
		if (email) body.email = email;

		const web = parseJsonField(webRaw);
		if (web) body.web = web;

		if (additionalFields.template_macro_id) {
			body.template_macro_id = additionalFields.template_macro_id;
		}

		const testData = parseJsonField(testDataRaw);
		if (testData) body.test_data = testData;

		const settings = parseJsonField(settingsRaw);
		if (settings) body.settings = settings;

		return await notifuseApiRequest.call(this, 'POST', '/api/templates.update', body);
	}

	if (operation === 'delete') {
		const id = this.getNodeParameter('id', i) as string;
		return await notifuseApiRequest.call(this, 'POST', '/api/templates.delete', { id });
	}

	if (operation === 'compile') {
		const messageId = this.getNodeParameter('message_id', i) as string;
		const visualEditorTreeRaw = this.getNodeParameter('visual_editor_tree', i) as string | IDataObject;
		const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;

		const visualEditorTree =
			typeof visualEditorTreeRaw === 'string'
				? JSON.parse(visualEditorTreeRaw)
				: visualEditorTreeRaw;

		const body: IDataObject = { message_id: messageId, visual_editor_tree: visualEditorTree };

		if (additionalFields.subject) body.subject = additionalFields.subject;
		if (additionalFields.subject_preview) body.subject_preview = additionalFields.subject_preview;
		if (additionalFields.channel) body.channel = additionalFields.channel;

		const testDataRaw = additionalFields.test_data;
		const testData = parseJsonField(testDataRaw);
		if (testData) body.test_data = testData;

		const trackingSettingsRaw = additionalFields.tracking_settings;
		const trackingSettings = parseJsonField(trackingSettingsRaw);
		if (trackingSettings) body.tracking_settings = trackingSettings;

		return await notifuseApiRequest.call(this, 'POST', '/api/templates.compile', body);
	}

	return {};
}
