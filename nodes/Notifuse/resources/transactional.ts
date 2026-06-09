import { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';
import { keyValueProperty, keyValueToObject, notifuseApiRequest } from '../GenericFunctions';

/**
 * Transactional resource — send a transactional notification to a contact.
 *
 * Endpoint: POST /api/transactional.send
 *
 * Field UX mirrors the n8n AWS SES "Send Template" action: Template Data and
 * Metadata are entered as key/value rows (the node builds the JSON), recipient
 * email is a single field, and Cc/Bcc are multi-value email lists.
 */

const SEND = { show: { resource: ['transactional'], operation: ['send'] } };

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
		type: 'multiOptions',
		required: true,
		default: ['email'],
		options: [{ name: 'Email', value: 'email' }],
		displayOptions: { show: { resource: ['transactional'], operation: ['send'] } },
		description: 'Channels to send the notification through',
	},
	keyValueProperty({
		name: 'templateData',
		displayName: 'Template Data',
		placeholder: 'Add Data',
		description: 'Key/value pairs passed to the template (built into the notification data object)',
		displayOptions: SEND,
	}),
	{
		displayName: 'Email Options',
		name: 'emailOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['transactional'], operation: ['send'] } },
		options: [
			{
				displayName: 'Bcc Addresses',
				name: 'bcc',
				type: 'string',
				typeOptions: { multipleValues: true, multipleValueButtonText: 'Add Bcc Email' },
				default: [],
				placeholder: 'name@example.com',
				description: 'Bcc recipients of the email',
			},
			{
				displayName: 'Cc Addresses',
				name: 'cc',
				type: 'string',
				typeOptions: { multipleValues: true, multipleValueButtonText: 'Add Cc Email' },
				default: [],
				placeholder: 'name@example.com',
				description: 'Cc recipients of the email',
			},
			{
				displayName: 'From Name',
				name: 'from_name',
				type: 'string',
				default: '',
				description: 'Override the default sender from name',
			},
			{
				displayName: 'Reply To',
				name: 'reply_to',
				type: 'string',
				default: '',
				placeholder: 'name@example.com',
				description: 'Reply-To email address',
			},
			{
				displayName: 'Subject',
				name: 'subject',
				type: 'string',
				default: '',
				description: 'Override the template subject line (supports Liquid)',
			},
			{
				displayName: 'Subject Preview',
				name: 'subject_preview',
				type: 'string',
				default: '',
				description: 'Override the preheader/preview text (supports Liquid)',
			},
			{
				displayName: 'Attachments (JSON)',
				name: 'attachments',
				type: 'json',
				default: '[]',
				description: 'Email attachments (max 20 files, 3MB each, 10MB total)',
			},
		],
	},
	keyValueProperty({
		name: 'metadata',
		displayName: 'Metadata',
		placeholder: 'Add Metadata',
		description: 'Key/value metadata stored with the notification for tracking',
		displayOptions: SEND,
	}),
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
			{ displayName: 'Contact External ID', name: 'contact_external_id', type: 'string', default: '' },
			{ displayName: 'First Name', name: 'first_name', type: 'string', default: '' },
			{ displayName: 'Last Name', name: 'last_name', type: 'string', default: '' },
			{ displayName: 'Full Name', name: 'full_name', type: 'string', default: '' },
			{ displayName: 'Phone', name: 'phone', type: 'string', default: '' },
			{ displayName: 'Language', name: 'language', type: 'string', default: '' },
			{ displayName: 'Timezone', name: 'timezone', type: 'string', default: '' },
		],
	},
];

const CONTACT_KEYS = ['first_name', 'last_name', 'full_name', 'phone', 'language', 'timezone'];

export async function executeTransactional(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	if (operation === 'send') {
		const notificationId = this.getNodeParameter('notificationId', i) as string;
		const contactEmail = this.getNodeParameter('contactEmail', i) as string;
		const channels = this.getNodeParameter('channels', i, ['email']) as string[];
		const templateData = this.getNodeParameter('templateData', i, {}) as IDataObject;
		const metadata = this.getNodeParameter('metadata', i, {}) as IDataObject;
		const emailOptions = this.getNodeParameter('emailOptions', i, {}) as IDataObject;
		const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;

		const contact: IDataObject = { email: contactEmail };
		if (additionalFields.contact_external_id) {
			contact.external_id = additionalFields.contact_external_id;
		}
		for (const key of CONTACT_KEYS) {
			if (additionalFields[key]) contact[key] = additionalFields[key];
		}

		const notification: IDataObject = { id: notificationId, contact, channels };

		const data = keyValueToObject(templateData);
		if (Object.keys(data).length) notification.data = data;

		const meta = keyValueToObject(metadata);
		if (Object.keys(meta).length) notification.metadata = meta;

		if (additionalFields.external_id) notification.external_id = additionalFields.external_id;

		const emailOpts: IDataObject = {};
		for (const key of ['from_name', 'subject', 'subject_preview', 'reply_to']) {
			if (emailOptions[key]) emailOpts[key] = emailOptions[key];
		}
		const cc = (emailOptions.cc as string[]) ?? [];
		const bcc = (emailOptions.bcc as string[]) ?? [];
		if (cc.length) emailOpts.cc = cc;
		if (bcc.length) emailOpts.bcc = bcc;
		if (emailOptions.attachments) {
			const raw = emailOptions.attachments;
			emailOpts.attachments = typeof raw === 'string' ? JSON.parse(raw) : raw;
		}
		if (Object.keys(emailOpts).length) notification.email_options = emailOpts;

		return await notifuseApiRequest.call(this, 'POST', '/api/transactional.send', { notification });
	}

	return {};
}
