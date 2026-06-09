import { createHmac, timingSafeEqual } from 'node:crypto';
import {
	IDataObject,
	IHookFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
	NodeConnectionTypes,
	NodeOperationError,
} from 'n8n-workflow';
import { isbot } from 'isbot';
import { notifuseApiRequest } from '../GenericFunctions';
import {
	WebhookSecurityOptions,
	buildResponseHeaders,
	isIpAllowed,
	isOriginAllowed,
	webhookSecurityProperties,
} from './webhookHelpers';

/**
 * All Notifuse webhook event types, grouped by entity for readability. They are
 * exposed as a single "Events" multiOptions field: n8n's node creator turns each
 * option of the (first) property named "Events" into an individual trigger entry
 * under the app, so every event shows up. n8n does not support a Resource split
 * for triggers (only for actions), hence the flat — but entity-prefixed — list.
 */
export const TRIGGER_EVENTS: INodePropertyOptions[] = [
	{ name: 'Contact Created', value: 'contact.created', description: 'A contact was created', action: 'Contact created' },
	{ name: 'Contact Updated', value: 'contact.updated', description: 'A contact was updated', action: 'Contact updated' },
	{ name: 'Contact Deleted', value: 'contact.deleted', description: 'A contact was deleted', action: 'Contact deleted' },
	{ name: 'List Bounced', value: 'list.bounced', description: 'A list email bounced', action: 'List bounced' },
	{ name: 'List Complained', value: 'list.complained', description: 'A list spam complaint was received', action: 'List complained' },
	{ name: 'List Confirmed', value: 'list.confirmed', description: 'A subscription was confirmed (double opt-in)', action: 'List confirmed' },
	{ name: 'List Pending', value: 'list.pending', description: 'A subscription is pending confirmation', action: 'List pending' },
	{ name: 'List Removed', value: 'list.removed', description: 'A contact was removed from a list', action: 'List removed' },
	{ name: 'List Resubscribed', value: 'list.resubscribed', description: 'A contact resubscribed to a list', action: 'List resubscribed' },
	{ name: 'List Subscribed', value: 'list.subscribed', description: 'A contact subscribed to a list', action: 'List subscribed' },
	{ name: 'List Unsubscribed', value: 'list.unsubscribed', description: 'A contact unsubscribed from a list', action: 'List unsubscribed' },
	{ name: 'Segment Joined', value: 'segment.joined', description: 'A contact joined a segment', action: 'Segment joined' },
	{ name: 'Segment Left', value: 'segment.left', description: 'A contact left a segment', action: 'Segment left' },
	{ name: 'Email Bounced', value: 'email.bounced', description: 'An email bounced', action: 'Email bounced' },
	{ name: 'Email Clicked', value: 'email.clicked', description: 'A link in an email was clicked', action: 'Email clicked' },
	{ name: 'Email Complained', value: 'email.complained', description: 'An email spam complaint was received', action: 'Email complained' },
	{ name: 'Email Delivered', value: 'email.delivered', description: 'An email was delivered', action: 'Email delivered' },
	{ name: 'Email Opened', value: 'email.opened', description: 'An email was opened', action: 'Email opened' },
	{ name: 'Email Sent', value: 'email.sent', description: 'An email was sent', action: 'Email sent' },
	{ name: 'Email Unsubscribed', value: 'email.unsubscribed', description: 'A recipient unsubscribed via an email', action: 'Email unsubscribed' },
	{ name: 'Custom Event Created', value: 'custom_event.created', description: 'A custom event was created', action: 'Custom event created' },
	{ name: 'Custom Event Updated', value: 'custom_event.updated', description: 'A custom event was updated', action: 'Custom event updated' },
	{ name: 'Custom Event Deleted', value: 'custom_event.deleted', description: 'A custom event was deleted', action: 'Custom event deleted' },
];

/**
 * Verifies a Notifuse webhook payload using the Standard Webhooks spec
 * (HMAC-SHA256 over `{id}.{timestamp}.{body}`, base64 signature, `v1,` prefix).
 */
export function verifyStandardWebhookSignature(
	secret: string,
	webhookId: string,
	timestamp: string,
	rawBody: string,
	signatureHeader: string,
): boolean {
	if (!secret || !webhookId || !timestamp || !signatureHeader) return false;

	const secretKey = secret.startsWith('whsec_') ? secret.slice('whsec_'.length) : secret;
	let key: Buffer;
	try {
		key = Buffer.from(secretKey, 'base64');
	} catch {
		return false;
	}

	const signedContent = `${webhookId}.${timestamp}.${rawBody}`;
	const expected = createHmac('sha256', key).update(signedContent).digest('base64');
	const expectedBuf = Buffer.from(expected);

	// The header can contain a space-separated list of `version,signature` pairs.
	return signatureHeader.split(' ').some((part) => {
		const sig = part.includes(',') ? part.split(',')[1] : part;
		if (!sig) return false;
		const sigBuf = Buffer.from(sig);
		return sigBuf.length === expectedBuf.length && timingSafeEqual(sigBuf, expectedBuf);
	});
}

/** Returns the events selected on the trigger node. */
export function getSelectedEvents(this: IHookFunctions | IWebhookFunctions): string[] {
	return (this.getNodeParameter('events', []) as string[]) ?? [];
}

/** Builds the shared INodeTypeDescription for the single Notifuse Trigger node. */
export function buildNotifuseTriggerDescription(): INodeTypeDescription {
	return {
		displayName: 'Notifuse Trigger',
		name: 'notifuseTrigger',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["events"].join(", ")}}',
		description: 'Starts the workflow when Notifuse events occur',
		defaults: {
			name: 'Notifuse Trigger',
		},
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		supportsCORS: true,
		credentials: [
			{
				name: 'notifuseApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				responseData: 'noData',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				required: true,
				default: [],
				options: TRIGGER_EVENTS,
				description: 'The Notifuse events that should trigger this workflow',
			},
			{
				displayName: 'Subscription Name',
				name: 'subscriptionName',
				type: 'string',
				default: 'n8n - Notifuse',
				required: true,
				description: 'Name of the webhook subscription created in Notifuse',
			},
			{
				displayName: 'Verify Signature',
				name: 'verifySignature',
				type: 'boolean',
				default: true,
				description:
					'Whether to verify the Standard Webhooks HMAC signature using the subscription secret',
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: webhookSecurityProperties,
			},
		],
		usableAsTool: true,
	};
}

/** Shared webhook request handler for the Notifuse Trigger node. */
export async function notifuseTriggerWebhook(
	this: IWebhookFunctions,
): Promise<IWebhookResponseData> {
	const req = this.getRequestObject();
	const res = this.getResponseObject();
	const headers = this.getHeaderData() as IDataObject;
	const securityOptions = this.getNodeParameter('options', {}) as WebhookSecurityOptions;
	const verifySignature = this.getNodeParameter('verifySignature', true) as boolean;
	const selectedEvents = getSelectedEvents.call(this);

	const corsHeaders = buildResponseHeaders(securityOptions, req.headers.origin);
	const denyRequest = (code: number, message: string) => {
		for (const [key, value] of Object.entries(corsHeaders)) {
			res.setHeader(key, value);
		}
		res.writeHead(code);
		res.end(message);
		return { noWebhookResponse: true } as IWebhookResponseData;
	};

	if (!isIpAllowed(securityOptions.ipWhitelist, (req as IDataObject).ips as string[], req.ip)) {
		return denyRequest(403, 'IP is not allowed to access the webhook!');
	}

	if (!isOriginAllowed(securityOptions.allowedOrigins, req.headers.origin)) {
		return denyRequest(403, 'Origin is not allowed to access the webhook!');
	}

	if (securityOptions.ignoreBots && isbot(req.headers['user-agent'])) {
		return denyRequest(403, 'Bot requests are not allowed!');
	}

	const body = this.getBodyData() as IDataObject;

	if (verifySignature) {
		const staticData = this.getWorkflowStaticData('node');
		const secret = staticData.webhookSecret as string | undefined;
		const webhookId = (headers['webhook-id'] as string) ?? '';
		const timestamp = (headers['webhook-timestamp'] as string) ?? '';
		const signature = (headers['webhook-signature'] as string) ?? '';
		const rawBody =
			(req as unknown as { rawBody?: Buffer }).rawBody?.toString('utf8') ?? JSON.stringify(body);

		if (!secret || !verifyStandardWebhookSignature(secret, webhookId, timestamp, rawBody, signature)) {
			return denyRequest(401, 'Invalid webhook signature!');
		}
	}

	const eventType = body.type as string | undefined;

	// The subscription is scoped to the selected events, but double-check.
	if (eventType && selectedEvents.length > 0 && !selectedEvents.includes(eventType)) {
		res.status(200).json({ received: true, processed: false, reason: 'Event type not monitored' });
		return { noWebhookResponse: true };
	}

	const json: IDataObject = {
		id: body.id,
		type: eventType,
		timestamp: body.timestamp,
		workspace_id: body.workspace_id,
		data: body.data,
	};

	if (securityOptions.rawBody) {
		json.rawBody =
			(req as unknown as { rawBody?: Buffer }).rawBody?.toString('utf8') ?? JSON.stringify(body);
		json.headers = headers;
	}

	const returnData: INodeExecutionData[] = [{ json }];

	return {
		workflowData: [returnData],
	};
}

/** Shared self-registration lifecycle for the Notifuse Trigger node. */
export const notifuseTriggerWebhookMethods = {
	default: {
		async checkExists(this: IHookFunctions): Promise<boolean> {
			const staticData = this.getWorkflowStaticData('node');
			if (staticData.webhookId === undefined) {
				return false;
			}

			const selectedEvents = getSelectedEvents.call(this).slice().sort();

			try {
				const response = await notifuseApiRequest.call(
					this,
					'GET',
					'/api/webhookSubscriptions.get',
					{},
					{ id: staticData.webhookId as string },
				);
				const subscription = (response.subscription ?? response) as IDataObject;
				const currentEvents = ((subscription?.event_types as string[]) ?? []).slice().sort();

				// Recreate if the selected events changed.
				if (JSON.stringify(currentEvents) !== JSON.stringify(selectedEvents)) {
					return false;
				}
				return true;
			} catch {
				return false;
			}
		},

		async create(this: IHookFunctions): Promise<boolean> {
			const webhookUrl = this.getNodeWebhookUrl('default');
			const staticData = this.getWorkflowStaticData('node');
			const events = getSelectedEvents.call(this);
			const subscriptionName = this.getNodeParameter('subscriptionName') as string;

			if (events.length === 0) {
				throw new NodeOperationError(this.getNode(), 'At least one event must be selected.');
			}

			const response = await notifuseApiRequest.call(
				this,
				'POST',
				'/api/webhookSubscriptions.create',
				{
					name: subscriptionName,
					url: webhookUrl,
					event_types: events,
				},
			);

			const subscription = (response.subscription ?? response) as IDataObject;

			if (!subscription?.id) {
				throw new NodeOperationError(
					this.getNode(),
					'Failed to register webhook: no subscription ID returned from Notifuse.',
				);
			}

			staticData.webhookId = subscription.id;
			staticData.webhookSecret = subscription.secret;
			return true;
		},

		async delete(this: IHookFunctions): Promise<boolean> {
			const staticData = this.getWorkflowStaticData('node');

			if (staticData.webhookId === undefined) {
				return true;
			}

			try {
				await notifuseApiRequest.call(this, 'POST', '/api/webhookSubscriptions.delete', {
					id: staticData.webhookId as string,
				});
			} catch (error) {
				const statusCode = (error as { httpCode?: string }).httpCode;
				if (statusCode !== '404') {
					return false;
				}
			}

			delete staticData.webhookId;
			delete staticData.webhookSecret;
			return true;
		},
	},
};
