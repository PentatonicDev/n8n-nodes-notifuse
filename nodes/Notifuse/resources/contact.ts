import { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';
import { notifuseApiRequest } from '../GenericFunctions';

/**
 * Contact resource — GOLDEN REFERENCE module.
 *
 * Every resource module in this node follows this exact shape:
 *   - `<resource>Operations`: the Operation dropdown (shown only for this resource).
 *   - `<resource>Fields`: all parameters, each gated by `displayOptions` on
 *     resource + operation. Required API fields are real required node fields;
 *     optional API fields live inside an "Additional Fields" collection.
 *   - `execute<Resource>(operation, i)`: routes one item to the Notifuse API
 *     via `notifuseApiRequest` and returns the response (object or array).
 *
 * Endpoints: see NOTIFUSE_API_REFERENCE.md (contacts.*).
 */

// Reusable optional contact attributes (used by upsert "Additional Fields").
const contactAttributeFields: INodeProperties[] = [
	{ displayName: 'External ID', name: 'external_id', type: 'string', default: '' },
	{ displayName: 'First Name', name: 'first_name', type: 'string', default: '' },
	{ displayName: 'Last Name', name: 'last_name', type: 'string', default: '' },
	{ displayName: 'Full Name', name: 'full_name', type: 'string', default: '' },
	{ displayName: 'Phone', name: 'phone', type: 'string', default: '' },
	{ displayName: 'Timezone', name: 'timezone', type: 'string', default: '' },
	{ displayName: 'Language', name: 'language', type: 'string', default: '' },
	{ displayName: 'Job Title', name: 'job_title', type: 'string', default: '' },
	{ displayName: 'Address Line 1', name: 'address_line_1', type: 'string', default: '' },
	{ displayName: 'Address Line 2', name: 'address_line_2', type: 'string', default: '' },
	{ displayName: 'Country', name: 'country', type: 'string', default: '' },
	{ displayName: 'Postcode', name: 'postcode', type: 'string', default: '' },
	{ displayName: 'State', name: 'state', type: 'string', default: '' },
	{
		displayName: 'Custom Fields (JSON)',
		name: 'customFieldsJson',
		type: 'json',
		default: '{}',
		description:
			'Custom attributes merged into the contact: custom_string_1..5, custom_number_1..5, custom_datetime_1..5, custom_json_1..5',
	},
];

export const contactOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['contact'] } },
		options: [
			{
				name: 'Count',
				value: 'count',
				description: 'Count contacts in the workspace',
				action: 'Count contacts',
			},
			{
				name: 'Create or Update',
				value: 'upsert',
				description: 'Create a new contact or update an existing one (by email)',
				action: 'Create or update a contact',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a contact by email',
				action: 'Delete a contact',
			},
			{
				name: 'Get by Email',
				value: 'getByEmail',
				description: 'Retrieve a contact by email address',
				action: 'Get a contact by email',
			},
			{
				name: 'Get by External ID',
				value: 'getByExternalId',
				description: 'Retrieve a contact by external ID',
				action: 'Get a contact by external ID',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Retrieve many contacts with filtering',
				action: 'Get many contacts',
			},
			{
				name: 'Import',
				value: 'import',
				description: 'Batch create or update contacts',
				action: 'Import contacts',
			},
		],
		default: 'upsert',
	},
];

export const contactFields: INodeProperties[] = [
	// ---------- upsert ----------
	{
		displayName: 'Email',
		name: 'email',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'name@example.com',
		displayOptions: { show: { resource: ['contact'], operation: ['upsert'] } },
		description: 'Email address that uniquely identifies the contact',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: ['contact'], operation: ['upsert'] } },
		options: contactAttributeFields,
	},

	// ---------- getByEmail ----------
	{
		displayName: 'Email',
		name: 'email',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'name@example.com',
		displayOptions: { show: { resource: ['contact'], operation: ['getByEmail'] } },
	},
	{
		displayName: 'Include Contact Lists',
		name: 'with_contact_lists',
		type: 'boolean',
		default: false,
		displayOptions: { show: { resource: ['contact'], operation: ['getByEmail', 'getByExternalId'] } },
		description: 'Whether to include the contact list subscriptions in the response',
	},

	// ---------- getByExternalId ----------
	{
		displayName: 'External ID',
		name: 'external_id',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['contact'], operation: ['getByExternalId'] } },
	},

	// ---------- getAll ----------
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: { show: { resource: ['contact'], operation: ['getAll'] } },
		description: 'Whether to return all results or only up to a given limit',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 50,
		typeOptions: { minValue: 1, maxValue: 100 },
		displayOptions: {
			show: { resource: ['contact'], operation: ['getAll'], returnAll: [false] },
		},
		description: 'Max number of results to return',
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show: { resource: ['contact'], operation: ['getAll'] } },
		options: [
			{ displayName: 'Email', name: 'email', type: 'string', default: '' },
			{ displayName: 'External ID', name: 'external_id', type: 'string', default: '' },
			{ displayName: 'First Name', name: 'first_name', type: 'string', default: '' },
			{ displayName: 'Last Name', name: 'last_name', type: 'string', default: '' },
			{ displayName: 'Full Name', name: 'full_name', type: 'string', default: '' },
			{ displayName: 'Phone', name: 'phone', type: 'string', default: '' },
			{ displayName: 'Country', name: 'country', type: 'string', default: '' },
			{ displayName: 'Language', name: 'language', type: 'string', default: '' },
			{ displayName: 'List ID', name: 'list_id', type: 'string', default: '' },
			{
				displayName: 'Contact List Status',
				name: 'contact_list_status',
				type: 'options',
				default: 'active',
				options: [
					{ name: 'Active', value: 'active' },
					{ name: 'Pending', value: 'pending' },
					{ name: 'Unsubscribed', value: 'unsubscribed' },
					{ name: 'Bounced', value: 'bounced' },
					{ name: 'Complained', value: 'complained' },
				],
			},
			{
				displayName: 'Include Contact Lists',
				name: 'with_contact_lists',
				type: 'boolean',
				default: false,
			},
		],
	},

	// ---------- delete ----------
	{
		displayName: 'Email',
		name: 'email',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'name@example.com',
		displayOptions: { show: { resource: ['contact'], operation: ['delete'] } },
	},

	// ---------- import ----------
	{
		displayName: 'Contacts (JSON)',
		name: 'contacts',
		type: 'json',
		required: true,
		default: '[]',
		displayOptions: { show: { resource: ['contact'], operation: ['import'] } },
		description: 'Array of contact objects. Each must include an "email" field.',
	},
	{
		displayName: 'Subscribe to Lists',
		name: 'subscribe_to_lists',
		type: 'string',
		default: '',
		placeholder: 'list_1,list_2',
		displayOptions: { show: { resource: ['contact'], operation: ['import'] } },
		description: 'Comma-separated list IDs to subscribe all imported contacts to',
	},
];

function buildContactObject(email: string, additionalFields: IDataObject): IDataObject {
	const contact: IDataObject = { email };
	const { customFieldsJson, ...rest } = additionalFields;
	Object.assign(contact, rest);
	if (customFieldsJson) {
		const parsed =
			typeof customFieldsJson === 'string' ? JSON.parse(customFieldsJson) : customFieldsJson;
		Object.assign(contact, parsed);
	}
	return contact;
}

export async function executeContact(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	if (operation === 'upsert') {
		const email = this.getNodeParameter('email', i) as string;
		const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;
		const contact = buildContactObject(email, additionalFields);
		return await notifuseApiRequest.call(this, 'POST', '/api/contacts.upsert', { contact });
	}

	if (operation === 'getByEmail') {
		const email = this.getNodeParameter('email', i) as string;
		const withLists = this.getNodeParameter('with_contact_lists', i, false) as boolean;
		return await notifuseApiRequest.call(this, 'GET', '/api/contacts.getByEmail', {}, {
			email,
			with_contact_lists: withLists,
		});
	}

	if (operation === 'getByExternalId') {
		const externalId = this.getNodeParameter('external_id', i) as string;
		const withLists = this.getNodeParameter('with_contact_lists', i, false) as boolean;
		return await notifuseApiRequest.call(this, 'GET', '/api/contacts.getByExternalID', {}, {
			external_id: externalId,
			with_contact_lists: withLists,
		});
	}

	if (operation === 'getAll') {
		const returnAll = this.getNodeParameter('returnAll', i) as boolean;
		const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
		const qs: IDataObject = { ...filters };

		if (returnAll) {
			const results: IDataObject[] = [];
			let cursor: string | undefined;
			qs.limit = 100;
			do {
				if (cursor) qs.cursor = cursor;
				const page = await notifuseApiRequest.call(this, 'GET', '/api/contacts.list', {}, qs);
				results.push(...((page.contacts as IDataObject[]) ?? []));
				cursor = page.next_cursor as string | undefined;
			} while (cursor);
			return results;
		}

		qs.limit = this.getNodeParameter('limit', i, 50) as number;
		const page = await notifuseApiRequest.call(this, 'GET', '/api/contacts.list', {}, qs);
		return (page.contacts as IDataObject[]) ?? page;
	}

	if (operation === 'count') {
		return await notifuseApiRequest.call(this, 'GET', '/api/contacts.count');
	}

	if (operation === 'delete') {
		const email = this.getNodeParameter('email', i) as string;
		return await notifuseApiRequest.call(this, 'POST', '/api/contacts.delete', { email });
	}

	if (operation === 'import') {
		const contactsRaw = this.getNodeParameter('contacts', i) as string | IDataObject[];
		const contacts = typeof contactsRaw === 'string' ? JSON.parse(contactsRaw) : contactsRaw;
		const body: IDataObject = { contacts };
		const subscribeToLists = this.getNodeParameter('subscribe_to_lists', i, '') as string;
		if (subscribeToLists) {
			body.subscribe_to_lists = subscribeToLists.split(',').map((id) => id.trim());
		}
		return await notifuseApiRequest.call(this, 'POST', '/api/contacts.import', body);
	}

	return {};
}
