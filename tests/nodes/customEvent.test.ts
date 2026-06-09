import { executeCustomEvent } from '../../nodes/Notifuse/resources/customEvent';
import { createExecuteFunctionsMock, firstAuthRequest } from '../helpers';

describe('Notifuse Custom Event resource', () => {
	it('import converts fixedCollection rows to events array and injects workspace_id', async () => {
		const { ctx, httpRequestWithAuthentication } = createExecuteFunctionsMock({
			params: {
				events: {
					values: [
						{
							email: 'user@example.com',
							event_name: 'orders/fulfilled',
							external_id: 'order_123',
							goal_type: 'revenue',
							occurred_at: '2025-01-15T10:30:00Z',
							source: 'api',
							properties: {
								values: [
									{ key: 'amount', value: '99.99' },
									{ key: 'currency', value: 'USD' },
								],
							},
						},
						{
							email: 'newuser@example.com',
							event_name: 'signup',
							external_id: 'signup_9',
							occurred_at: '',
							source: 'api',
							properties: { values: [] },
						},
					],
				},
			},
		});

		await executeCustomEvent.call(ctx, 'import', 0);

		const req = firstAuthRequest(httpRequestWithAuthentication);
		expect(req.method).toBe('POST');
		expect(req.url).toBe('https://notifuse.test/api/customEvents.import');
		expect(req.body).toMatchObject({
			workspace_id: 'ws_test',
			events: [
				{
					email: 'user@example.com',
					event_name: 'orders/fulfilled',
					external_id: 'order_123',
					goal_type: 'revenue',
					occurred_at: '2025-01-15T10:30:00Z',
					source: 'api',
					properties: { amount: '99.99', currency: 'USD' },
				},
				{
					email: 'newuser@example.com',
					event_name: 'signup',
					external_id: 'signup_9',
				},
			],
		});
	});

	it('import omits empty optional fields', async () => {
		const { ctx, httpRequestWithAuthentication } = createExecuteFunctionsMock({
			params: {
				events: {
					values: [
						{
							email: 'minimal@example.com',
							event_name: 'view_page',
							external_id: 'view_1',
							occurred_at: '',
							goal_type: '',
							properties: { values: [] },
						},
					],
				},
			},
		});

		await executeCustomEvent.call(ctx, 'import', 0);

		const req = firstAuthRequest(httpRequestWithAuthentication);
		const events = (req.body as Record<string, unknown>).events as Record<string, unknown>[];
		expect(events[0]).toMatchObject({
			email: 'minimal@example.com',
			event_name: 'view_page',
			external_id: 'view_1',
		});
		expect(events[0]).not.toHaveProperty('goal_type');
		expect(events[0]).not.toHaveProperty('occurred_at');
		expect(events[0]).not.toHaveProperty('properties');
	});
});
