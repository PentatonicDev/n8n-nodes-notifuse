import { createHmac } from 'node:crypto';
import {
	IHookFunctions,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';
import {
	notifuseTriggerWebhook,
	notifuseTriggerWebhookMethods,
	verifyStandardWebhookSignature,
} from '../../nodes/Notifuse/shared/triggerFunctions';
import { NotifuseContactTrigger } from '../../nodes/NotifuseContactTrigger/NotifuseContactTrigger.node';
import { NotifuseListTrigger } from '../../nodes/NotifuseListTrigger/NotifuseListTrigger.node';
import { NotifuseSegmentTrigger } from '../../nodes/NotifuseSegmentTrigger/NotifuseSegmentTrigger.node';
import { NotifuseEmailTrigger } from '../../nodes/NotifuseEmailTrigger/NotifuseEmailTrigger.node';
import { NotifuseCustomEventTrigger } from '../../nodes/NotifuseCustomEventTrigger/NotifuseCustomEventTrigger.node';
import { DEFAULT_CREDENTIALS } from '../helpers';

const RAW_KEY = 'supersecretkey-value';
const SECRET = `whsec_${Buffer.from(RAW_KEY).toString('base64')}`;

function signedHeaders(body: string, id = 'msg_1', ts = '1700000000') {
	const signature = createHmac('sha256', Buffer.from(RAW_KEY))
		.update(`${id}.${ts}.${body}`)
		.digest('base64');
	return {
		'webhook-id': id,
		'webhook-timestamp': ts,
		'webhook-signature': `v1,${signature}`,
	};
}

function createWebhookMock(opts: {
	body: Record<string, unknown>;
	rawBody?: string;
	headers?: Record<string, unknown>;
	params?: Record<string, unknown>;
	staticData?: Record<string, unknown>;
}) {
	const raw = opts.rawBody ?? JSON.stringify(opts.body);
	const headers = { 'user-agent': 'Notifuse', ...(opts.headers ?? {}) };
	const res = {
		setHeader: jest.fn(),
		writeHead: jest.fn(),
		end: jest.fn(),
		status: jest.fn().mockReturnThis(),
		json: jest.fn(),
	};
	const req = { headers, ip: '1.2.3.4', ips: [], rawBody: Buffer.from(raw) };
	const params = opts.params ?? {};
	const ctx = {
		getRequestObject: jest.fn().mockReturnValue(req),
		getResponseObject: jest.fn().mockReturnValue(res),
		getHeaderData: jest.fn().mockReturnValue(headers),
		getBodyData: jest.fn().mockReturnValue(opts.body),
		getNodeParameter: jest.fn((name: string, _i?: number, fallback?: unknown) =>
			name in params ? params[name] : fallback,
		),
		getWorkflowStaticData: jest.fn().mockReturnValue(opts.staticData ?? {}),
		getNode: jest.fn().mockReturnValue({ name: 'Trigger' }),
	} as unknown as IWebhookFunctions;
	return { ctx, res, req };
}

describe('verifyStandardWebhookSignature', () => {
	it('accepts a valid signature', () => {
		const body = JSON.stringify({ type: 'contact.created' });
		const h = signedHeaders(body);
		expect(
			verifyStandardWebhookSignature(SECRET, h['webhook-id'], h['webhook-timestamp'], body, h['webhook-signature']),
		).toBe(true);
	});

	it('rejects a tampered body', () => {
		const body = JSON.stringify({ type: 'contact.created' });
		const h = signedHeaders(body);
		expect(
			verifyStandardWebhookSignature(SECRET, h['webhook-id'], h['webhook-timestamp'], '{"type":"evil"}', h['webhook-signature']),
		).toBe(false);
	});

	it('rejects when fields are missing', () => {
		expect(verifyStandardWebhookSignature('', 'id', 'ts', 'body', 'sig')).toBe(false);
	});
});

describe('trigger node descriptions', () => {
	const cases = [
		{ Node: NotifuseContactTrigger, name: 'notifuseContactTrigger', icon: 'file:notifuse-contact-trigger.svg', events: 3 },
		{ Node: NotifuseListTrigger, name: 'notifuseListTrigger', icon: 'file:notifuse-list-trigger.svg', events: 8 },
		{ Node: NotifuseSegmentTrigger, name: 'notifuseSegmentTrigger', icon: 'file:notifuse-segment-trigger.svg', events: 2 },
		{ Node: NotifuseEmailTrigger, name: 'notifuseEmailTrigger', icon: 'file:notifuse-email-trigger.svg', events: 7 },
		{ Node: NotifuseCustomEventTrigger, name: 'notifuseCustomEventTrigger', icon: 'file:notifuse-custom-event-trigger.svg', events: 3 },
	];

	it.each(cases)('$name has icon, usableAsTool, webhook and event options', ({ Node, name, icon, events }) => {
		const node = new Node();
		expect(node.description.name).toBe(name);
		expect(node.description.icon).toBe(icon);
		expect(node.description.usableAsTool).toBe(true);
		expect(node.description.webhooks?.[0]).toMatchObject({ httpMethod: 'POST', path: 'webhook' });
		const eventsProp = node.description.properties.find((p) => p.name === 'events');
		expect(eventsProp?.options).toHaveLength(events);
		expect(node.description.credentials).toEqual([{ name: 'notifuseApi', required: true }]);
	});
});

describe('notifuseTriggerWebhook', () => {
	it('emits workflow data for a valid signed event', async () => {
		const body = { id: 'evt_1', type: 'contact.created', timestamp: 't', workspace_id: 'ws', data: { email: 'a@x.com' } };
		const raw = JSON.stringify(body);
		const { ctx } = createWebhookMock({
			body,
			rawBody: raw,
			headers: signedHeaders(raw),
			params: { options: {}, verifySignature: true, events: ['contact.created'] },
			staticData: { webhookSecret: SECRET },
		});

		const result = (await notifuseTriggerWebhook.call(ctx)) as IWebhookResponseData;

		expect(result.workflowData?.[0]?.[0]?.json).toMatchObject({ type: 'contact.created' });
	});

	it('rejects an invalid signature with 401', async () => {
		const body = { type: 'contact.created' };
		const { ctx, res } = createWebhookMock({
			body,
			headers: { 'webhook-id': 'x', 'webhook-timestamp': 't', 'webhook-signature': 'v1,bad' },
			params: { options: {}, verifySignature: true, events: ['contact.created'] },
			staticData: { webhookSecret: SECRET },
		});

		const result = (await notifuseTriggerWebhook.call(ctx)) as IWebhookResponseData;

		expect(res.writeHead).toHaveBeenCalledWith(401);
		expect(result.noWebhookResponse).toBe(true);
	});

	it('ignores events that are not selected', async () => {
		const body = { type: 'contact.deleted' };
		const { ctx, res } = createWebhookMock({
			body,
			params: { options: {}, verifySignature: false, events: ['contact.created'] },
		});

		await notifuseTriggerWebhook.call(ctx);

		expect(res.status).toHaveBeenCalledWith(200);
	});
});

function createHookMock(opts: {
	params?: Record<string, unknown>;
	staticData?: Record<string, unknown>;
	apiResponse?: unknown;
}) {
	const httpRequestWithAuthentication = jest.fn().mockResolvedValue(opts.apiResponse ?? {});
	const params = opts.params ?? {};
	const staticData = opts.staticData ?? {};
	const ctx = {
		getNodeParameter: jest.fn((name: string, _i?: number, fallback?: unknown) =>
			name in params ? params[name] : fallback,
		),
		getWorkflowStaticData: jest.fn().mockReturnValue(staticData),
		getNodeWebhookUrl: jest.fn().mockReturnValue('https://n8n.test/webhook/abc'),
		getNode: jest.fn().mockReturnValue({ name: 'Trigger' }),
		getCredentials: jest.fn().mockResolvedValue(DEFAULT_CREDENTIALS),
		helpers: { httpRequestWithAuthentication },
	} as unknown as IHookFunctions;
	return { ctx, httpRequestWithAuthentication, staticData };
}

describe('trigger lifecycle (webhookMethods)', () => {
	it('create registers a subscription and stores id + secret', async () => {
		const { ctx, httpRequestWithAuthentication, staticData } = createHookMock({
			params: { events: ['contact.created'], subscriptionName: 'n8n - Contact' },
			apiResponse: { subscription: { id: 'whsub_1', secret: SECRET } },
		});

		const created = await notifuseTriggerWebhookMethods.default.create.call(ctx);

		expect(created).toBe(true);
		expect(staticData.webhookId).toBe('whsub_1');
		expect(staticData.webhookSecret).toBe(SECRET);
		const body = httpRequestWithAuthentication.mock.calls[0][1].body;
		expect(body).toMatchObject({
			name: 'n8n - Contact',
			url: 'https://n8n.test/webhook/abc',
			event_types: ['contact.created'],
			workspace_id: 'ws_test',
		});
	});

	it('checkExists returns false when the selected events changed', async () => {
		const { ctx } = createHookMock({
			params: { events: ['contact.created', 'contact.updated'] },
			staticData: { webhookId: 'whsub_1' },
			apiResponse: { subscription: { id: 'whsub_1', event_types: ['contact.created'] } },
		});

		const exists = await notifuseTriggerWebhookMethods.default.checkExists.call(ctx);
		expect(exists).toBe(false);
	});

	it('checkExists returns true when events match', async () => {
		const { ctx } = createHookMock({
			params: { events: ['contact.created'] },
			staticData: { webhookId: 'whsub_1' },
			apiResponse: { subscription: { id: 'whsub_1', event_types: ['contact.created'] } },
		});

		const exists = await notifuseTriggerWebhookMethods.default.checkExists.call(ctx);
		expect(exists).toBe(true);
	});

	it('delete removes the subscription and clears static data', async () => {
		const { ctx, httpRequestWithAuthentication, staticData } = createHookMock({
			staticData: { webhookId: 'whsub_1', webhookSecret: SECRET },
		});

		const deleted = await notifuseTriggerWebhookMethods.default.delete.call(ctx);

		expect(deleted).toBe(true);
		expect(staticData.webhookId).toBeUndefined();
		const body = httpRequestWithAuthentication.mock.calls[0][1].body;
		expect(body).toMatchObject({ id: 'whsub_1', workspace_id: 'ws_test' });
	});
});
