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
	TRIGGER_RESOURCES,
} from '../../nodes/Notifuse/shared/triggerFunctions';
import { NotifuseTrigger } from '../../nodes/NotifuseTrigger/NotifuseTrigger.node';
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

describe('Notifuse Trigger node description', () => {
	const node = new NotifuseTrigger();

	it('has icon, usableAsTool, webhook and credentials', () => {
		expect(node.description.name).toBe('notifuseTrigger');
		expect(node.description.icon).toBe('file:notifuse-trigger.svg');
		expect(node.description.usableAsTool).toBe(true);
		expect(node.description.webhooks?.[0]).toMatchObject({ httpMethod: 'POST', path: 'webhook' });
		expect(node.description.credentials).toEqual([{ name: 'notifuseApi', required: true }]);
	});

	it('exposes a Resource dropdown with all five entities', () => {
		const resourceProp = node.description.properties.find((p) => p.name === 'resource');
		const values = (resourceProp?.options as Array<{ value: string }>).map((o) => o.value);
		expect(values).toEqual(['contact', 'list', 'segment', 'email', 'customEvent']);
	});

	it('exposes a per-resource events field gated by displayOptions', () => {
		for (const r of TRIGGER_RESOURCES) {
			const field = node.description.properties.find((p) => p.name === r.eventsField);
			expect(field).toBeDefined();
			expect(field?.options).toHaveLength(r.events.length);
			expect(field?.displayOptions?.show?.resource).toEqual([r.value]);
		}
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
			params: { resource: 'contact', contactEvents: ['contact.created'], options: {}, verifySignature: true },
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
			params: { resource: 'contact', contactEvents: ['contact.created'], options: {}, verifySignature: true },
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
			params: { resource: 'contact', contactEvents: ['contact.created'], options: {}, verifySignature: false },
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
	it('create registers a subscription with the selected resource events and stores id + secret', async () => {
		const { ctx, httpRequestWithAuthentication, staticData } = createHookMock({
			params: { resource: 'email', emailEvents: ['email.opened', 'email.clicked'], subscriptionName: 'n8n - Notifuse' },
			apiResponse: { subscription: { id: 'whsub_1', secret: SECRET } },
		});

		const created = await notifuseTriggerWebhookMethods.default.create.call(ctx);

		expect(created).toBe(true);
		expect(staticData.webhookId).toBe('whsub_1');
		expect(staticData.webhookSecret).toBe(SECRET);
		const sentBody = httpRequestWithAuthentication.mock.calls[0][1].body;
		expect(sentBody).toMatchObject({
			name: 'n8n - Notifuse',
			url: 'https://n8n.test/webhook/abc',
			event_types: ['email.opened', 'email.clicked'],
			workspace_id: 'ws_test',
		});
	});

	it('checkExists returns false when the selected events changed', async () => {
		const { ctx } = createHookMock({
			params: { resource: 'contact', contactEvents: ['contact.created', 'contact.updated'] },
			staticData: { webhookId: 'whsub_1' },
			apiResponse: { subscription: { id: 'whsub_1', event_types: ['contact.created'] } },
		});

		const exists = await notifuseTriggerWebhookMethods.default.checkExists.call(ctx);
		expect(exists).toBe(false);
	});

	it('checkExists returns true when events match', async () => {
		const { ctx } = createHookMock({
			params: { resource: 'contact', contactEvents: ['contact.created'] },
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
		const sentBody = httpRequestWithAuthentication.mock.calls[0][1].body;
		expect(sentBody).toMatchObject({ id: 'whsub_1', workspace_id: 'ws_test' });
	});
});
