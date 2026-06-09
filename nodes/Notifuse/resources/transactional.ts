import { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';
import { notifuseApiRequest } from '../GenericFunctions';

/**
 * Transactional resource — send a transactional notification to a contact.
 *
 * Endpoint: POST /api/transactional.send
 */

export const transactionalOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['transactional'] } },
		options: [
			{
				name: 'Send',
				value: 'send',
				description: 'Send a transactional notification to a contact',
				action: 'Send a transactional notification',
			},
		],
		default: 'send',
	},
];

export const transactionalFields: INodeProperties[] = [
	// ---------- send — required fields ----------
	{
		displayName: 'Notification ID',
		name: 'notificationId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['transactional'], operation: ['send'] } },
		description: 'ID of the notification template to send',
	},
	{
		displayName: 'Contact Email',
		name: 'contactEmail',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'name@example.com',
		displayOptions: { show: { resource: ['transactional'], operation: ['send'] } },
		description: 'Email address of the recipient contact',
	},
	{
		displayName: 'Channels',
		name: 'channels',
		type: 'string',
		required: true,
		default: 'email',
		placeholder: 'email',
		displayOptions: { show: { resource: ['transactional'], operation: ['send'] } },
		description: 'Comma-separated list of channels to send through (e.g. email)',
	},

	// ---------- send — additional fields ----------
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: ['transactional'], operation: ['send'] } },
		options: [
			{
				displayName: 'External ID',
				name: 'external_id',
				type: 'string',
				default: '',
				description: 'External ID for idempotency checks',
			},
			{
				displayName: 'Data (JSON)',
				name: 'data',
				type: 'json',
				default: '{}',
				description: 'Data object to populate the template with',
			},
			{
				displayName: 'Metadata (JSON)',
				name: 'metadata',
				type: 'json',
				default: '{}',
				description: 'Additional metadata object for tracking',
			},
			{
				displayName: 'Email Options (JSON)',
				name: 'email_options',
				type: 'json',
				default: '{}',
				description:
					'Email-specific overrides: from_name, subject, subject_preview, cc, bcc, reply_to, attachments',
			},
			// Optional contact attributes
			{
				displayName: 'Contact External ID',
				name: 'contact_external_id',
				type: 'string',
				default: '',
				description: 'External identifier for the contact',
			},
			{
				displayName: 'First Name',
				name: 'first_name',
				type: 'string',
				default: '',
				description: 'First name of the contact',
			},
			{
				displayName: 'Last Name',
				name: 'last_name',
				type: 'string',
				default: '',
				description: 'Last name of the contact',
			},
			{
				displayName: 'Full Name',
				name: 'full_name',
				type: 'string',
				default: '',
				description: 'Full name of the contact',
			},
			{
				displayName: 'Phone',
				name: 'phone',
				type: 'string',
				default: '',
				description: 'Phone number of the contact',
			},
			{
				displayName: 'Language',
				name: 'language',
				type: 'string',
				default: '',
				description: 'Preferred language of the contact',
			},
			{
				displayName: 'Timezone',
				name: 'timezone',
				type: 'string',
				default: '',
				description: 'Timezone of the contact',
			},
		],
	},
];

export async function executeTransactional(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	if (operation === 'send') {
		const notificationId = this.getNodeParameter('notificationId', i) as string;
		const contactEmail = this.getNodeParameter('contactEmail', i) as string;
		const channelsRaw = this.getNodeParameter('channels', i) as string;
		const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;

		// Build the contact object — start with required email then merge optional attrs
		const contact: IDataObject = { email: contactEmail };
		const contactOptionalKeys = [
			'contact_external_id',
			'first_name',
			'last_name',
			'full_name',
			'phone',
			'language',
			'timezone',
		];
		for (const key of contactOptionalKeys) {
			if (additionalFields[key]) {
				const fieldName = key === 'contact_external_id' ? 'external_id' : key;
				contact[fieldName] = additionalFields[key];
			}
		}

		// Build the notification object — required fields first
		const notification: IDataObject = {
			id: notificationId,
			contact,
			channels: channelsRaw
				.split(',')
				.map((c) => c.trim())
				.filter(Boolean),
		};

		// Optional notification-level fields
		if (additionalFields.external_id) {
			notification.external_id = additionalFields.external_id;
		}
		if (additionalFields.data) {
			notification.data =
				typeof additionalFields.data === 'string'
					? JSON.parse(additionalFields.data)
					: additionalFields.data;
		}
		if (additionalFields.metadata) {
			notification.metadata =
				typeof additionalFields.metadata === 'string'
					? JSON.parse(additionalFields.metadata)
					: additionalFields.metadata;
		}
		if (additionalFields.email_options) {
			notification.email_options =
				typeof additionalFields.email_options === 'string'
					? JSON.parse(additionalFields.email_options)
					: additionalFields.email_options;
		}

		return await notifuseApiRequest.call(this, 'POST', '/api/transactional.send', {
			notification,
		});
	}

	return {};
}
