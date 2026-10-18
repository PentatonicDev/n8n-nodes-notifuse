import { executeTransactional } from '../../nodes/Notifuse/resources/transactional';
import { createExecuteFunctionsMock, firstAuthRequest } from '../helpers';

describe('Notifuse Transactional resource', () => {
	it('send builds the notification from key/value data, email options and contact fields', async () => {
		const { ctx, httpRequestWithAuthentication } = createExecuteFunctionsMock({
			params: {
				notificationId: 'notif_123',
				contactEmail: 'john@example.com',
				channels: ['email'],
				templateData: {
					values: [
						{ key: 'order_id', value: '12345' },
						{ key: 'amount', value: '99.99' },
					],
				},
				metadata: { values: [{ key: 'source', value: 'api' }] },
				emailOptions: {
					subject: 'Your order',
					cc: ['cc1@example.com', 'cc2@example.com'],
					bcc: ['audit@example.com'],
					attachments: '[{"filename":"a.pdf"}]',
				},
				additionalFields: { first_name: 'John', contact_external_id: 'ext_456', external_id: 'idem_1' },
			},
			apiResponse: { notification: { id: 'notif_123', sent: true } },
		});

		await executeTransactional.call(ctx, 'send', 0);

		const req = firstAuthRequest(httpRequestWithAuthentication);
		expect(req.method).toBe('POST');
		expect(req.url).toBe('https://notifuse.test/api/transactional.send');
		expect(req.body).toMatchObject({
			workspace_id: 'ws_test',
			notification: {
				id: 'notif_123',
				contact: { email: 'john@example.com', first_name: 'John', external_id: 'ext_456' },
				channels: ['email'],
				external_id: 'idem_1',
				data: { order_id: '12345', amount: '99.99' },
				metadata: { source: 'api' },
				email_options: {
					subject: 'Your order',
					cc: ['cc1@example.com', 'cc2@example.com'],
					bcc: ['audit@example.com'],
					attachments: [{ filename: 'a.pdf' }],
				},
			},
		});
	});

	it('send with only required fields omits data, metadata and email_options', async () => {
		const { ctx, httpRequestWithAuthentication } = createExecuteFunctionsMock({
			params: {
				notificationId: 'notif_456',
				contactEmail: 'jane@example.com',
				channels: ['email'],
			},
			apiResponse: { notification: { id: 'notif_456', sent: true } },
		});

		await executeTransactional.call(ctx, 'send', 0);

		const req = firstAuthRequest(httpRequestWithAuthentication);
		expect(req.body).toMatchObject({
			workspace_id: 'ws_test',
			notification: { id: 'notif_456', contact: { email: 'jane@example.com' }, channels: ['email'] },
		});
		const notification = (req.body as Record<string, unknown>).notification as Record<string, unknown>;
		expect(notification).not.toHaveProperty('data');
		expect(notification).not.toHaveProperty('metadata');
		expect(notification).not.toHaveProperty('email_options');
	});
});

describe('Notifuse Transactional getStatus', () => {
	const run = async (messages: object[]) => {
		const { ctx, httpRequestWithAuthentication } = createExecuteFunctionsMock({
			params: { externalId: 'wf:1:123' },
			apiResponse: { messages, has_more: false },
		});
		const result = (await executeTransactional.call(ctx, 'getStatus', 0)) as Record<string, unknown>;
		return { result, req: firstAuthRequest(httpRequestWithAuthentication) };
	};

	it('queries message history by external_id', async () => {
		const { req } = await run([]);
		expect(req.method).toBe('GET');
		expect(req.url).toBe('https://notifuse.test/api/messages.list');
		expect(req.qs).toMatchObject({ workspace_id: 'ws_test', external_id: 'wf:1:123' });
	});

	it('reports not found, sent and failed deliveries', async () => {
		expect((await run([])).result).toMatchObject({ found: false, sent: false, failed: false });
		expect((await run([{ sent_at: '2026-10-18T00:00:00Z' }])).result).toMatchObject({ found: true, sent: true, failed: false });
		expect((await run([{ sent_at: '2026-10-18T00:00:00Z', failed_at: '2026-10-18T00:00:01Z' }])).result).toMatchObject({ found: true, sent: false, failed: true });
	});
});
