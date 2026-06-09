import { executeCustomEvent } from '../../nodes/Notifuse/resources/customEvent';
import { createExecuteFunctionsMock, firstAuthRequest } from '../helpers';

describe('Notifuse Custom Event resource', () => {
	it('import parses the events JSON and injects workspace_id', async () => {
		const { ctx, httpRequestWithAuthentication } = createExecuteFunctionsMock({
			params: {
				events: '[{"event_name":"purchase","email":"user@example.com","properties":{"amount":99.99}},{"event_name":"signup","email":"newuser@example.com"}]',
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
					event_name: 'purchase',
					email: 'user@example.com',
					properties: { amount: 99.99 },
				},
				{
					event_name: 'signup',
					email: 'newuser@example.com',
				},
			],
		});
	});
});
