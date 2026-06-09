import { executeList } from '../../nodes/Notifuse/resources/list';
import { createExecuteFunctionsMock, firstAuthRequest } from '../helpers';

describe('Notifuse List resource', () => {
	it('subscribe builds the contact object, splits list_ids, and injects workspace_id', async () => {
		const { ctx, httpRequestWithAuthentication } = createExecuteFunctionsMock({
			params: {
				email: 'jane@example.com',
				list_ids: 'list_1, list_2, list_3',
				additionalFields: { first_name: 'Jane', phone: '123456789' },
			},
		});

		await executeList.call(ctx, 'subscribe', 0);

		const req = firstAuthRequest(httpRequestWithAuthentication);
		expect(req.method).toBe('POST');
		expect(req.url).toBe('https://notifuse.test/api/lists.subscribe');
		expect(req.body).toMatchObject({
			workspace_id: 'ws_test',
			contact: {
				email: 'jane@example.com',
				first_name: 'Jane',
				phone: '123456789',
			},
			list_ids: ['list_1', 'list_2', 'list_3'],
		});
	});

	it('subscribePublic builds the contact object and sends to public endpoint', async () => {
		const { ctx, httpRequestWithAuthentication } = createExecuteFunctionsMock({
			params: {
				email: 'john@example.com',
				list_ids: 'public_list_1, public_list_2',
				additionalFields: { external_id: 'ext-123' },
			},
		});

		await executeList.call(ctx, 'subscribePublic', 0);

		const req = firstAuthRequest(httpRequestWithAuthentication);
		expect(req.method).toBe('POST');
		expect(req.url).toBe('https://notifuse.test/subscribe');
		expect(req.body).toMatchObject({
			workspace_id: 'ws_test',
			contact: {
				email: 'john@example.com',
				external_id: 'ext-123',
			},
			list_ids: ['public_list_1', 'public_list_2'],
		});
	});

	it('updateStatus posts email, list_id, and status', async () => {
		const { ctx, httpRequestWithAuthentication } = createExecuteFunctionsMock({
			params: {
				email: 'user@example.com',
				list_id: 'list_42',
				status: 'unsubscribed',
			},
		});

		await executeList.call(ctx, 'updateStatus', 0);

		const req = firstAuthRequest(httpRequestWithAuthentication);
		expect(req.method).toBe('POST');
		expect(req.url).toBe('https://notifuse.test/api/contactLists.updateStatus');
		expect(req.body).toMatchObject({
			email: 'user@example.com',
			list_id: 'list_42',
			status: 'unsubscribed',
			workspace_id: 'ws_test',
		});
	});
});
