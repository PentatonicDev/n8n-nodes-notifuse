import { executeBroadcast } from '../../nodes/Notifuse/resources/broadcast';
import { createExecuteFunctionsMock, firstAuthRequest } from '../helpers';

describe('Notifuse Broadcast resource', () => {
	// ------------------------------------------------------------------ getAll
	it('getAll (not returnAll) returns the broadcasts array with filters', async () => {
		const { ctx, httpRequestWithAuthentication } = createExecuteFunctionsMock({
			params: { returnAll: false, limit: 10, filters: { status: 'draft' } },
			apiResponse: { broadcasts: [{ id: 'b1' }, { id: 'b2' }] },
		});

		const result = await executeBroadcast.call(ctx, 'getAll', 0);

		expect(Array.isArray(result)).toBe(true);
		expect(result).toHaveLength(2);
		const req = firstAuthRequest(httpRequestWithAuthentication);
		expect(req.method).toBe('GET');
		expect(req.url).toBe('https://notifuse.test/api/broadcasts.list');
		expect(req.qs).toMatchObject({ status: 'draft', limit: 10 });
	});

	it('getAll (returnAll) paginates with offset until a page is smaller than pageSize', async () => {
		const { ctx, httpRequestWithAuthentication } = createExecuteFunctionsMock({
			params: { returnAll: true, filters: {} },
		});
		// First page returns exactly 100 items → loop continues.
		// Second page returns < 100 → loop stops.
		const page1 = Array.from({ length: 100 }, (_, k) => ({ id: `b${k}` }));
		const page2 = [{ id: 'b100' }, { id: 'b101' }];
		httpRequestWithAuthentication
			.mockResolvedValueOnce({ broadcasts: page1 })
			.mockResolvedValueOnce({ broadcasts: page2 });

		const result = (await executeBroadcast.call(ctx, 'getAll', 0)) as unknown[];

		expect(result).toHaveLength(102);
		expect(httpRequestWithAuthentication).toHaveBeenCalledTimes(2);
		// Both calls must use limit=100
		const firstReq = firstAuthRequest(httpRequestWithAuthentication);
		expect(firstReq.qs).toMatchObject({ limit: 100 });
	});

	// ------------------------------------------------------------------ get
	it('get sends id and with_templates as query params', async () => {
		const { ctx, httpRequestWithAuthentication } = createExecuteFunctionsMock({
			params: { id: 'bcast_1', with_templates: true },
			apiResponse: { broadcast: { id: 'bcast_1' } },
		});

		await executeBroadcast.call(ctx, 'get', 0);

		const req = firstAuthRequest(httpRequestWithAuthentication);
		expect(req.method).toBe('GET');
		expect(req.url).toBe('https://notifuse.test/api/broadcasts.get');
		expect(req.qs).toMatchObject({ id: 'bcast_1', with_templates: true });
	});

	// ------------------------------------------------------------------ create
	it('create parses audience JSON and injects workspace_id', async () => {
		const { ctx, httpRequestWithAuthentication } = createExecuteFunctionsMock({
			params: {
				name: 'Summer Campaign',
				audience: '{"list":"list_abc","exclude_unsubscribed":true}',
				additionalFields: {},
			},
			apiResponse: { broadcast: { id: 'bcast_new' } },
		});

		await executeBroadcast.call(ctx, 'create', 0);

		const req = firstAuthRequest(httpRequestWithAuthentication);
		expect(req.method).toBe('POST');
		expect(req.url).toBe('https://notifuse.test/api/broadcasts.create');
		expect(req.body).toMatchObject({
			workspace_id: 'ws_test',
			name: 'Summer Campaign',
			audience: { list: 'list_abc', exclude_unsubscribed: true },
		});
	});

	it('create parses utm_parameters JSON from additionalFields', async () => {
		const { ctx, httpRequestWithAuthentication } = createExecuteFunctionsMock({
			params: {
				name: 'UTM Campaign',
				audience: '{"list":"list_1"}',
				additionalFields: {
					utm_parameters: '{"source":"newsletter","medium":"email"}',
					tracking_enabled: true,
				},
			},
		});

		await executeBroadcast.call(ctx, 'create', 0);

		const req = firstAuthRequest(httpRequestWithAuthentication);
		expect(req.body).toMatchObject({
			utm_parameters: { source: 'newsletter', medium: 'email' },
			tracking_enabled: true,
		});
	});

	it('create parses test_settings, data_feed and metadata JSON fields', async () => {
		const { ctx, httpRequestWithAuthentication } = createExecuteFunctionsMock({
			params: {
				name: 'AB Test',
				audience: '{"list":"list_2"}',
				additionalFields: {
					test_settings: '{"enabled":true}',
					data_feed: '{"global_feed":"https://feed.example.com"}',
					metadata: '{"tag":"promo"}',
				},
			},
		});

		await executeBroadcast.call(ctx, 'create', 0);

		const req = firstAuthRequest(httpRequestWithAuthentication);
		expect(req.body).toMatchObject({
			test_settings: { enabled: true },
			data_feed: { global_feed: 'https://feed.example.com' },
			metadata: { tag: 'promo' },
		});
	});

	// ------------------------------------------------------------------ update
	it('update sends id, name, parsed audience and workspace_id', async () => {
		const { ctx, httpRequestWithAuthentication } = createExecuteFunctionsMock({
			params: {
				id: 'bcast_1',
				name: 'Updated Name',
				audience: '{"list":"list_b"}',
				additionalFields: {},
			},
		});

		await executeBroadcast.call(ctx, 'update', 0);

		const req = firstAuthRequest(httpRequestWithAuthentication);
		expect(req.method).toBe('POST');
		expect(req.url).toBe('https://notifuse.test/api/broadcasts.update');
		expect(req.body).toMatchObject({
			id: 'bcast_1',
			name: 'Updated Name',
			audience: { list: 'list_b' },
			workspace_id: 'ws_test',
		});
	});

	it('update parses schedule JSON from additionalFields', async () => {
		const { ctx, httpRequestWithAuthentication } = createExecuteFunctionsMock({
			params: {
				id: 'bcast_2',
				name: 'Scheduled Update',
				audience: '{"list":"list_c"}',
				additionalFields: {
					schedule: '{"is_scheduled":true,"scheduled_date":"2026-07-01"}',
				},
			},
		});

		await executeBroadcast.call(ctx, 'update', 0);

		const req = firstAuthRequest(httpRequestWithAuthentication);
		expect(req.body).toMatchObject({
			schedule: { is_scheduled: true, scheduled_date: '2026-07-01' },
		});
	});

	// ------------------------------------------------------------------ schedule
	it('schedule sends id and additionalFields in body', async () => {
		const { ctx, httpRequestWithAuthentication } = createExecuteFunctionsMock({
			params: {
				id: 'bcast_3',
				additionalFields: {
					send_now: false,
					scheduled_date: '2026-08-01',
					scheduled_time: '09:00',
					timezone: 'America/Sao_Paulo',
				},
			},
		});

		await executeBroadcast.call(ctx, 'schedule', 0);

		const req = firstAuthRequest(httpRequestWithAuthentication);
		expect(req.method).toBe('POST');
		expect(req.url).toBe('https://notifuse.test/api/broadcasts.schedule');
		expect(req.body).toMatchObject({
			id: 'bcast_3',
			send_now: false,
			scheduled_date: '2026-08-01',
			scheduled_time: '09:00',
			timezone: 'America/Sao_Paulo',
			workspace_id: 'ws_test',
		});
	});

	// ------------------------------------------------------------------ pause
	it('pause posts the broadcast id', async () => {
		const { ctx, httpRequestWithAuthentication } = createExecuteFunctionsMock({
			params: { id: 'bcast_4' },
		});

		await executeBroadcast.call(ctx, 'pause', 0);

		const req = firstAuthRequest(httpRequestWithAuthentication);
		expect(req.method).toBe('POST');
		expect(req.url).toBe('https://notifuse.test/api/broadcasts.pause');
		expect(req.body).toMatchObject({ id: 'bcast_4', workspace_id: 'ws_test' });
	});

	// ------------------------------------------------------------------ resume
	it('resume posts the broadcast id', async () => {
		const { ctx, httpRequestWithAuthentication } = createExecuteFunctionsMock({
			params: { id: 'bcast_5' },
		});

		await executeBroadcast.call(ctx, 'resume', 0);

		const req = firstAuthRequest(httpRequestWithAuthentication);
		expect(req.method).toBe('POST');
		expect(req.url).toBe('https://notifuse.test/api/broadcasts.resume');
		expect(req.body).toMatchObject({ id: 'bcast_5', workspace_id: 'ws_test' });
	});

	// ------------------------------------------------------------------ cancel
	it('cancel posts the broadcast id', async () => {
		const { ctx, httpRequestWithAuthentication } = createExecuteFunctionsMock({
			params: { id: 'bcast_6' },
		});

		await executeBroadcast.call(ctx, 'cancel', 0);

		const req = firstAuthRequest(httpRequestWithAuthentication);
		expect(req.method).toBe('POST');
		expect(req.url).toBe('https://notifuse.test/api/broadcasts.cancel');
		expect(req.body).toMatchObject({ id: 'bcast_6', workspace_id: 'ws_test' });
	});

	// ------------------------------------------------------------------ delete
	it('delete posts the broadcast id', async () => {
		const { ctx, httpRequestWithAuthentication } = createExecuteFunctionsMock({
			params: { id: 'bcast_7' },
		});

		await executeBroadcast.call(ctx, 'delete', 0);

		const req = firstAuthRequest(httpRequestWithAuthentication);
		expect(req.method).toBe('POST');
		expect(req.url).toBe('https://notifuse.test/api/broadcasts.delete');
		expect(req.body).toMatchObject({ id: 'bcast_7', workspace_id: 'ws_test' });
	});

	// ------------------------------------------------------------------ sendToIndividual
	it('sendToIndividual posts broadcast_id, recipient_email and workspace_id', async () => {
		const { ctx, httpRequestWithAuthentication } = createExecuteFunctionsMock({
			params: {
				broadcast_id: 'bcast_8',
				recipient_email: 'tester@example.com',
				additionalFields: {},
			},
		});

		await executeBroadcast.call(ctx, 'sendToIndividual', 0);

		const req = firstAuthRequest(httpRequestWithAuthentication);
		expect(req.method).toBe('POST');
		expect(req.url).toBe('https://notifuse.test/api/broadcasts.sendToIndividual');
		expect(req.body).toMatchObject({
			broadcast_id: 'bcast_8',
			recipient_email: 'tester@example.com',
			workspace_id: 'ws_test',
		});
	});

	it('sendToIndividual includes optional template_id from additionalFields', async () => {
		const { ctx, httpRequestWithAuthentication } = createExecuteFunctionsMock({
			params: {
				broadcast_id: 'bcast_9',
				recipient_email: 'tester@example.com',
				additionalFields: { template_id: 'tmpl_abc' },
			},
		});

		await executeBroadcast.call(ctx, 'sendToIndividual', 0);

		const req = firstAuthRequest(httpRequestWithAuthentication);
		expect(req.body).toMatchObject({ template_id: 'tmpl_abc' });
	});

	// ------------------------------------------------------------------ getTestResults
	it('getTestResults sends id as query param', async () => {
		const { ctx, httpRequestWithAuthentication } = createExecuteFunctionsMock({
			params: { id: 'bcast_10' },
			apiResponse: { results: [] },
		});

		await executeBroadcast.call(ctx, 'getTestResults', 0);

		const req = firstAuthRequest(httpRequestWithAuthentication);
		expect(req.method).toBe('GET');
		expect(req.url).toBe('https://notifuse.test/api/broadcasts.getTestResults');
		expect(req.qs).toMatchObject({ id: 'bcast_10', workspace_id: 'ws_test' });
	});

	// ------------------------------------------------------------------ selectWinner
	it('selectWinner posts id and template_id', async () => {
		const { ctx, httpRequestWithAuthentication } = createExecuteFunctionsMock({
			params: { id: 'bcast_11', template_id: 'tmpl_winner' },
		});

		await executeBroadcast.call(ctx, 'selectWinner', 0);

		const req = firstAuthRequest(httpRequestWithAuthentication);
		expect(req.method).toBe('POST');
		expect(req.url).toBe('https://notifuse.test/api/broadcasts.selectWinner');
		expect(req.body).toMatchObject({
			id: 'bcast_11',
			template_id: 'tmpl_winner',
			workspace_id: 'ws_test',
		});
	});

	// ------------------------------------------------------------------ refreshGlobalFeed
	it('refreshGlobalFeed posts broadcast_id and url', async () => {
		const { ctx, httpRequestWithAuthentication } = createExecuteFunctionsMock({
			params: {
				broadcast_id: 'bcast_12',
				url: 'https://feed.example.com/data.json',
				additionalFields: {},
			},
		});

		await executeBroadcast.call(ctx, 'refreshGlobalFeed', 0);

		const req = firstAuthRequest(httpRequestWithAuthentication);
		expect(req.method).toBe('POST');
		expect(req.url).toBe('https://notifuse.test/api/broadcasts.refreshGlobalFeed');
		expect(req.body).toMatchObject({
			broadcast_id: 'bcast_12',
			url: 'https://feed.example.com/data.json',
			workspace_id: 'ws_test',
		});
	});

	it('refreshGlobalFeed parses headers JSON from additionalFields', async () => {
		const { ctx, httpRequestWithAuthentication } = createExecuteFunctionsMock({
			params: {
				broadcast_id: 'bcast_13',
				url: 'https://feed.example.com/data.json',
				additionalFields: {
					headers: '[{"name":"Authorization","value":"Bearer token"}]',
				},
			},
		});

		await executeBroadcast.call(ctx, 'refreshGlobalFeed', 0);

		const req = firstAuthRequest(httpRequestWithAuthentication);
		expect(req.body).toMatchObject({
			headers: [{ name: 'Authorization', value: 'Bearer token' }],
		});
	});

	// ------------------------------------------------------------------ testRecipientFeed
	it('testRecipientFeed posts broadcast_id and url', async () => {
		const { ctx, httpRequestWithAuthentication } = createExecuteFunctionsMock({
			params: {
				broadcast_id: 'bcast_14',
				url: 'https://feed.example.com/recipient.json',
				additionalFields: {},
			},
		});

		await executeBroadcast.call(ctx, 'testRecipientFeed', 0);

		const req = firstAuthRequest(httpRequestWithAuthentication);
		expect(req.method).toBe('POST');
		expect(req.url).toBe('https://notifuse.test/api/broadcasts.testRecipientFeed');
		expect(req.body).toMatchObject({
			broadcast_id: 'bcast_14',
			url: 'https://feed.example.com/recipient.json',
			workspace_id: 'ws_test',
		});
	});

	it('testRecipientFeed includes optional contact_email and parses headers JSON', async () => {
		const { ctx, httpRequestWithAuthentication } = createExecuteFunctionsMock({
			params: {
				broadcast_id: 'bcast_15',
				url: 'https://feed.example.com/recipient.json',
				additionalFields: {
					contact_email: 'contact@example.com',
					headers: '[{"name":"X-Api-Key","value":"secret"}]',
				},
			},
		});

		await executeBroadcast.call(ctx, 'testRecipientFeed', 0);

		const req = firstAuthRequest(httpRequestWithAuthentication);
		expect(req.body).toMatchObject({
			contact_email: 'contact@example.com',
			headers: [{ name: 'X-Api-Key', value: 'secret' }],
		});
	});

	// ------------------------------------------------------------------ unknown operation
	it('returns empty object for an unknown operation', async () => {
		const { ctx } = createExecuteFunctionsMock({});

		const result = await executeBroadcast.call(ctx, 'nonexistent', 0);

		expect(result).toEqual({});
	});
});
