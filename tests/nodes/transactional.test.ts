import { executeTransactional } from '../../nodes/Notifuse/resources/transactional';
import { createExecuteFunctionsMock, firstAuthRequest } from '../helpers';

describe('Notifuse Transactional resource', () => {
	it('send builds the notification object with all additional fields and injects workspace_id', async () => {
		const { ctx, httpRequestWithAuthentication } = createExecuteFunctionsMock({
			params: {
				notificationId: 'notif_123',
				contactEmail: 'john@example.com',
				channels: 'email,sms',
				additionalFields: {
					data: '{"order_id":"12345","amount":"99.99"}',
					first_name: 'John',
					contact_external_id: 'ext_456',
				},
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
				contact: {
					email: 'john@example.com',
					first_name: 'John',
					external_id: 'ext_456',
				},
				channels: ['email', 'sms'],
				data: { order_id: '12345', amount: '99.99' },
			},
		});
	});

	it('send with only required fields (no additionalFields)', async () => {
		const { ctx, httpRequestWithAuthentication } = createExecuteFunctionsMock({
			params: {
				notificationId: 'notif_456',
				contactEmail: 'jane@example.com',
				channels: 'email',
			},
			apiResponse: { notification: { id: 'notif_456', sent: true } },
		});

		await executeTransactional.call(ctx, 'send', 0);

		const req = firstAuthRequest(httpRequestWithAuthentication);
		expect(req.method).toBe('POST');
		expect(req.url).toBe('https://notifuse.test/api/transactional.send');
		expect(req.body).toMatchObject({
			workspace_id: 'ws_test',
			notification: {
				id: 'notif_456',
				contact: {
					email: 'jane@example.com',
				},
				channels: ['email'],
			},
		});
		// Ensure no extra fields are present
		expect((req.body as Record<string, unknown>).notification).not.toHaveProperty('data');
		expect((req.body as Record<string, unknown>).notification).not.toHaveProperty('metadata');
	});
});
