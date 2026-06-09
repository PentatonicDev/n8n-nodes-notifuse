import { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';
import { notifuseApiRequest } from '../GenericFunctions';

/**
 * List resource — manages contact subscriptions to email lists.
 *
 * Operations:
 *   - subscribe: POST /api/lists.subscribe (authenticated)
 *   - subscribePublic: POST /subscribe (unauthenticated public endpoint)
 *   - updateStatus: POST /api/contactLists.updateStatus
 *
 * Endpoints: see NOTIFUSE_API_REFERENCE.md (lists.subscribe, /subscribe, contactLists.updateStatus).
 */

// Reusable optional contact attributes for subscription operations.
const contactAttributeFields: INodeProperties[] = [
	{ displayName: 'External ID', name: 'external_id', type: 'string', default: '' },
	{ displayName: 'First Name', name: 'first_name', type: 'string', default: '' },
	{ displayName: 'Last Name', name: 'last_name', type: 'string', default: '' },
	{ displayName: 'Full Name', name: 'full_name', type: 'string', default: '' },
	{ displayName: 'Phone', name: 'phone', type: 'string', default: '' },
	{ displayName: 'Timezone', name: 'timezone', type: 'string', default: '' },
	{ displayName: 'Language', name: 'language', type: 'string', default: '' },
];

export const listOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['list'] } },
		options: [
			{
				name: 'Subscribe',
				value: 'subscribe',
				description: 'Subscribe a contact to lists (authenticated)',
				action: 'Subscribe a contact to lists',
			},
			{
				name: 'Subscribe Public',
				value: 'subscribePublic',
				description: 'Subscribe a contact to public lists (unauthenticated)',
				action: 'Subscribe a contact to public lists',
			},
			{
				name: 'Update Status',
				value: 'updateStatus',
				description: 'Update contact subscription status in a list',
				action: 'Update contact subscription status',
			},
		],
		default: 'subscribe',
	},
];

export const listFields: INodeProperties[] = [
	// ---------- subscribe & subscribePublic ----------
	{
		displayName: 'Email',
		name: 'email',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'name@example.com',
		displayOptions: { show: { resource: ['list'], operation: ['subscribe', 'subscribePublic'] } },
		description: 'Email address of the contact',
	},
	{
		displayName: 'List IDs',
		name: 'list_ids',
		type: 'string',
		required: true,
		default: [],
		typeOptions: { multipleValues: true, multipleValueButtonText: 'Add List ID' },
		displayOptions: { show: { resource: ['list'], operation: ['subscribe', 'subscribePublic'] } },
		description: 'List IDs to subscribe the contact to',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: ['list'], operation: ['subscribe', 'subscribePublic'] } },
		options: contactAttributeFields,
	},

	// ---------- updateStatus ----------
	{
		displayName: 'Email',
		name: 'email',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'name@example.com',
		displayOptions: { show: { resource: ['list'], operation: ['updateStatus'] } },
		description: 'Email address of the contact',
	},
	{
		displayName: 'List ID',
		name: 'list_id',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['list'], operation: ['updateStatus'] } },
		description: 'ID of the list',
	},
	{
		displayName: 'Status',
		name: 'status',
		type: 'options',
		required: true,
		default: 'active',
		displayOptions: { show: { resource: ['list'], operation: ['updateStatus'] } },
		options: [
			{ name: 'Active', value: 'active' },
			{ name: 'Pending', value: 'pending' },
			{ name: 'Unsubscribed', value: 'unsubscribed' },
			{ name: 'Bounced', value: 'bounced' },
			{ name: 'Complained', value: 'complained' },
		],
		description: 'New subscription status',
	},
];

function buildContactObject(email: string, additionalFields: IDataObject): IDataObject {
	const contact: IDataObject = { email };
	Object.assign(contact, additionalFields);
	return contact;
}

export async function executeList(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	if (operation === 'subscribe') {
		const email = this.getNodeParameter('email', i) as string;
		const listIds = this.getNodeParameter('list_ids', i) as string[];
		const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;

		const contact = buildContactObject(email, additionalFields);

		return await notifuseApiRequest.call(this, 'POST', '/api/lists.subscribe', {
			contact,
			list_ids: listIds,
		});
	}

	if (operation === 'subscribePublic') {
		const email = this.getNodeParameter('email', i) as string;
		const listIds = this.getNodeParameter('list_ids', i) as string[];
		const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;

		const contact = buildContactObject(email, additionalFields);

		return await notifuseApiRequest.call(this, 'POST', '/subscribe', {
			contact,
			list_ids: listIds,
		});
	}

	if (operation === 'updateStatus') {
		const email = this.getNodeParameter('email', i) as string;
		const listId = this.getNodeParameter('list_id', i) as string;
		const status = this.getNodeParameter('status', i) as string;

		return await notifuseApiRequest.call(this, 'POST', '/api/contactLists.updateStatus', {
			email,
			list_id: listId,
			status,
		});
	}

	return {};
}
