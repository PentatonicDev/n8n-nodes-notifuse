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
