import { executeTemplate } from '../../nodes/Notifuse/resources/template';
import { createExecuteFunctionsMock, firstAuthRequest } from '../helpers';

describe('Notifuse Template resource', () => {
	// ── getAll ────────────────────────────────────────────────────────────────

	it('getAll returns the templates array and passes filters as qs', async () => {
		const { ctx, httpRequestWithAuthentication } = createExecuteFunctionsMock({
			params: { filters: { category: 'marketing', channel: 'email' } },
			apiResponse: { templates: [{ id: 'tpl_1' }, { id: 'tpl_2' }] },
		});

		const result = await executeTemplate.call(ctx, 'getAll', 0);

		expect(Array.isArray(result)).toBe(true);
		expect(result).toHaveLength(2);

		const req = firstAuthRequest(httpRequestWithAuthentication);
		expect(req.method).toBe('GET');
		expect(req.url).toBe('https://notifuse.test/api/templates.list');
		expect(req.qs).toMatchObject({
			category: 'marketing',
			channel: 'email',
			workspace_id: 'ws_test',
		});
	});

	it('getAll with no filters still passes workspace_id', async () => {
		const { ctx, httpRequestWithAuthentication } = createExecuteFunctionsMock({
			params: { filters: {} },
			apiResponse: { templates: [] },
		});

		const result = await executeTemplate.call(ctx, 'getAll', 0);

		expect(Array.isArray(result)).toBe(true);
		const req = firstAuthRequest(httpRequestWithAuthentication);
		expect(req.qs).toMatchObject({ workspace_id: 'ws_test' });
	});

	// ── get ───────────────────────────────────────────────────────────────────

	it('get sends id + workspace_id as query params', async () => {
		const { ctx, httpRequestWithAuthentication } = createExecuteFunctionsMock({
			params: { id: 'tpl_abc' },
			apiResponse: { template: { id: 'tpl_abc' } },
		});

		await executeTemplate.call(ctx, 'get', 0);

		const req = firstAuthRequest(httpRequestWithAuthentication);
		expect(req.method).toBe('GET');
		expect(req.url).toBe('https://notifuse.test/api/templates.get');
		expect(req.qs).toMatchObject({ id: 'tpl_abc', workspace_id: 'ws_test' });
		expect(req.qs).not.toHaveProperty('version');
	});

	it('get includes version when provided', async () => {
		const { ctx, httpRequestWithAuthentication } = createExecuteFunctionsMock({
			params: { id: 'tpl_abc', version: 3 },
		});

		await executeTemplate.call(ctx, 'get', 0);

		const req = firstAuthRequest(httpRequestWithAuthentication);
		expect(req.qs).toMatchObject({ id: 'tpl_abc', version: 3 });
	});

	it('get omits version when it is an empty string', async () => {
		const { ctx, httpRequestWithAuthentication } = createExecuteFunctionsMock({
			params: { id: 'tpl_abc', version: '' },
		});

		await executeTemplate.call(ctx, 'get', 0);

		const req = firstAuthRequest(httpRequestWithAuthentication);
		expect(req.qs).not.toHaveProperty('version');
	});

	// ── create ────────────────────────────────────────────────────────────────

	it('create sends required fields and injects workspace_id', async () => {
		const { ctx, httpRequestWithAuthentication } = createExecuteFunctionsMock({
			params: {
				id: 'welcome_email',
				name: 'Welcome Email',
				channel: 'email',
				category: 'welcome',
				additionalFields: {},
			},
		});

		await executeTemplate.call(ctx, 'create', 0);

		const req = firstAuthRequest(httpRequestWithAuthentication);
		expect(req.method).toBe('POST');
		expect(req.url).toBe('https://notifuse.test/api/templates.create');
		expect(req.body).toMatchObject({
			id: 'welcome_email',
			name: 'Welcome Email',
			channel: 'email',
			category: 'welcome',
			workspace_id: 'ws_test',
		});
	});

	it('create parses a non-empty email JSON additional field into the body', async () => {
		const { ctx, httpRequestWithAuthentication } = createExecuteFunctionsMock({
			params: {
				id: 'promo',
				name: 'Promo',
				channel: 'email',
				category: 'marketing',
				additionalFields: {
					email: '{"subject":"Hello","sender_id":"sender_1"}',
				},
			},
		});

		await executeTemplate.call(ctx, 'create', 0);

		const req = firstAuthRequest(httpRequestWithAuthentication);
		expect(req.body).toMatchObject({
			email: { subject: 'Hello', sender_id: 'sender_1' },
		});
	});

	it('create does NOT add email to body when json is empty object string', async () => {
		const { ctx, httpRequestWithAuthentication } = createExecuteFunctionsMock({
			params: {
				id: 'promo',
				name: 'Promo',
				channel: 'email',
				category: 'marketing',
				additionalFields: { email: '{}' },
			},
		});

		await executeTemplate.call(ctx, 'create', 0);

		const req = firstAuthRequest(httpRequestWithAuthentication);
		expect(req.body).not.toHaveProperty('email');
	});

	it('create does NOT add email to body when json is an empty object', async () => {
		const { ctx, httpRequestWithAuthentication } = createExecuteFunctionsMock({
			params: {
				id: 'promo',
				name: 'Promo',
				channel: 'email',
				category: 'marketing',
				additionalFields: { email: {} },
			},
		});

		await executeTemplate.call(ctx, 'create', 0);

		const req = firstAuthRequest(httpRequestWithAuthentication);
		expect(req.body).not.toHaveProperty('email');
	});

	it('create parses web, test_data, settings and sets template_macro_id', async () => {
		const { ctx, httpRequestWithAuthentication } = createExecuteFunctionsMock({
			params: {
				id: 'web_tpl',
				name: 'Web Template',
				channel: 'web',
				category: 'other',
				additionalFields: {
					web: '{"content":{"type":"doc"}}',
					test_data: '{"name":"Alice"}',
					settings: '{"key":"val"}',
					template_macro_id: 'macro_99',
				},
			},
		});

		await executeTemplate.call(ctx, 'create', 0);

		const req = firstAuthRequest(httpRequestWithAuthentication);
		expect(req.body).toMatchObject({
			web: { content: { type: 'doc' } },
			test_data: { name: 'Alice' },
			settings: { key: 'val' },
			template_macro_id: 'macro_99',
		});
	});

	it('create does NOT add web/test_data/settings when they are empty', async () => {
		const { ctx, httpRequestWithAuthentication } = createExecuteFunctionsMock({
			params: {
				id: 'tpl',
				name: 'Tpl',
				channel: 'web',
				category: 'other',
				additionalFields: {
					web: '{}',
					test_data: '{}',
					settings: '{}',
				},
			},
		});

		await executeTemplate.call(ctx, 'create', 0);

		const req = firstAuthRequest(httpRequestWithAuthentication);
		expect(req.body).not.toHaveProperty('web');
		expect(req.body).not.toHaveProperty('test_data');
		expect(req.body).not.toHaveProperty('settings');
	});

	// ── update ────────────────────────────────────────────────────────────────

	it('update sends required fields and injects workspace_id', async () => {
		const { ctx, httpRequestWithAuthentication } = createExecuteFunctionsMock({
			params: {
				id: 'tpl_abc',
				name: 'Updated Name',
				channel: 'email',
				category: 'transactional',
				additionalFields: {},
			},
		});

		await executeTemplate.call(ctx, 'update', 0);

		const req = firstAuthRequest(httpRequestWithAuthentication);
		expect(req.method).toBe('POST');
		expect(req.url).toBe('https://notifuse.test/api/templates.update');
		expect(req.body).toMatchObject({
			id: 'tpl_abc',
			name: 'Updated Name',
			channel: 'email',
			category: 'transactional',
			workspace_id: 'ws_test',
		});
	});

	it('update parses a non-empty email JSON additional field', async () => {
		const { ctx, httpRequestWithAuthentication } = createExecuteFunctionsMock({
			params: {
				id: 'tpl_abc',
				name: 'My Tpl',
				channel: 'email',
				category: 'transactional',
				additionalFields: {
					email: '{"subject":"Updated Subject"}',
				},
			},
		});

		await executeTemplate.call(ctx, 'update', 0);

		const req = firstAuthRequest(httpRequestWithAuthentication);
		expect(req.body).toMatchObject({ email: { subject: 'Updated Subject' } });
	});

	it('update does NOT add email to body when json is empty', async () => {
		const { ctx, httpRequestWithAuthentication } = createExecuteFunctionsMock({
			params: {
				id: 'tpl_abc',
				name: 'My Tpl',
				channel: 'email',
				category: 'transactional',
				additionalFields: { email: '{}' },
			},
		});

		await executeTemplate.call(ctx, 'update', 0);

		const req = firstAuthRequest(httpRequestWithAuthentication);
		expect(req.body).not.toHaveProperty('email');
	});

	it('update sets template_macro_id when provided', async () => {
		const { ctx, httpRequestWithAuthentication } = createExecuteFunctionsMock({
			params: {
				id: 'tpl_abc',
				name: 'My Tpl',
				channel: 'email',
				category: 'transactional',
				additionalFields: { template_macro_id: 'macro_42' },
			},
		});

		await executeTemplate.call(ctx, 'update', 0);

		const req = firstAuthRequest(httpRequestWithAuthentication);
		expect(req.body).toMatchObject({ template_macro_id: 'macro_42' });
	});

	// ── delete ────────────────────────────────────────────────────────────────

	it('delete posts the template id and injects workspace_id', async () => {
		const { ctx, httpRequestWithAuthentication } = createExecuteFunctionsMock({
			params: { id: 'tpl_to_delete' },
		});

		await executeTemplate.call(ctx, 'delete', 0);

		const req = firstAuthRequest(httpRequestWithAuthentication);
		expect(req.method).toBe('POST');
		expect(req.url).toBe('https://notifuse.test/api/templates.delete');
		expect(req.body).toMatchObject({ id: 'tpl_to_delete', workspace_id: 'ws_test' });
	});

	// ── compile ───────────────────────────────────────────────────────────────

	it('compile sends message_id and parses visual_editor_tree from string', async () => {
		const tree = { type: 'mjml', children: [] };
		const { ctx, httpRequestWithAuthentication } = createExecuteFunctionsMock({
			params: {
				message_id: 'msg_001',
				visual_editor_tree: JSON.stringify(tree),
				additionalFields: {},
			},
		});

		await executeTemplate.call(ctx, 'compile', 0);

		const req = firstAuthRequest(httpRequestWithAuthentication);
		expect(req.method).toBe('POST');
		expect(req.url).toBe('https://notifuse.test/api/templates.compile');
		expect(req.body).toMatchObject({
			message_id: 'msg_001',
			visual_editor_tree: tree,
			workspace_id: 'ws_test',
		});
	});

	it('compile accepts visual_editor_tree as an already-parsed object', async () => {
		const tree = { type: 'mjml', children: [] };
		const { ctx, httpRequestWithAuthentication } = createExecuteFunctionsMock({
			params: {
				message_id: 'msg_002',
				visual_editor_tree: tree,
				additionalFields: {},
			},
		});

		await executeTemplate.call(ctx, 'compile', 0);

		const req = firstAuthRequest(httpRequestWithAuthentication);
		expect(req.body).toMatchObject({ visual_editor_tree: tree });
	});

	it('compile includes optional subject and subject_preview when provided', async () => {
		const { ctx, httpRequestWithAuthentication } = createExecuteFunctionsMock({
			params: {
				message_id: 'msg_003',
				visual_editor_tree: '{"type":"mjml"}',
				additionalFields: {
					subject: 'Hello {{name}}',
					subject_preview: 'Preview text',
				},
			},
		});

		await executeTemplate.call(ctx, 'compile', 0);

		const req = firstAuthRequest(httpRequestWithAuthentication);
		expect(req.body).toMatchObject({
			subject: 'Hello {{name}}',
			subject_preview: 'Preview text',
		});
	});

	it('compile includes optional channel when provided', async () => {
		const { ctx, httpRequestWithAuthentication } = createExecuteFunctionsMock({
			params: {
				message_id: 'msg_004',
				visual_editor_tree: '{"type":"mjml"}',
				additionalFields: { channel: 'email' },
			},
		});

		await executeTemplate.call(ctx, 'compile', 0);

		const req = firstAuthRequest(httpRequestWithAuthentication);
		expect(req.body).toMatchObject({ channel: 'email' });
	});

	it('compile parses test_data when non-empty', async () => {
		const { ctx, httpRequestWithAuthentication } = createExecuteFunctionsMock({
			params: {
				message_id: 'msg_005',
				visual_editor_tree: '{"type":"mjml"}',
				additionalFields: { test_data: '{"user":"Bob"}' },
			},
		});

		await executeTemplate.call(ctx, 'compile', 0);

		const req = firstAuthRequest(httpRequestWithAuthentication);
		expect(req.body).toMatchObject({ test_data: { user: 'Bob' } });
	});

	it('compile does NOT include test_data when json is empty object string', async () => {
		const { ctx, httpRequestWithAuthentication } = createExecuteFunctionsMock({
			params: {
				message_id: 'msg_006',
				visual_editor_tree: '{"type":"mjml"}',
				additionalFields: { test_data: '{}' },
			},
		});

		await executeTemplate.call(ctx, 'compile', 0);

		const req = firstAuthRequest(httpRequestWithAuthentication);
		expect(req.body).not.toHaveProperty('test_data');
	});

	it('compile parses tracking_settings when non-empty', async () => {
		const { ctx, httpRequestWithAuthentication } = createExecuteFunctionsMock({
			params: {
				message_id: 'msg_007',
				visual_editor_tree: '{"type":"mjml"}',
				additionalFields: {
					tracking_settings: '{"enable_tracking":true,"utm_source":"newsletter"}',
				},
			},
		});

		await executeTemplate.call(ctx, 'compile', 0);

		const req = firstAuthRequest(httpRequestWithAuthentication);
		expect(req.body).toMatchObject({
			tracking_settings: { enable_tracking: true, utm_source: 'newsletter' },
		});
	});

	it('compile does NOT include tracking_settings when json is empty object string', async () => {
		const { ctx, httpRequestWithAuthentication } = createExecuteFunctionsMock({
			params: {
				message_id: 'msg_008',
				visual_editor_tree: '{"type":"mjml"}',
				additionalFields: { tracking_settings: '{}' },
			},
		});

		await executeTemplate.call(ctx, 'compile', 0);

		const req = firstAuthRequest(httpRequestWithAuthentication);
		expect(req.body).not.toHaveProperty('tracking_settings');
	});

	// ── unknown operation ─────────────────────────────────────────────────────

	it('returns empty object for unknown operation', async () => {
		const { ctx } = createExecuteFunctionsMock({});

		const result = await executeTemplate.call(ctx, 'unknown_op', 0);

		expect(result).toEqual({});
	});
});
