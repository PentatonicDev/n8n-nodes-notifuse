import { executeContact } from '../../nodes/Notifuse/resources/contact';
import { createExecuteFunctionsMock, firstAuthRequest } from '../helpers';

describe('Notifuse Contact resource', () => {
	it('upsert builds the contact object and injects workspace_id', async () => {
		const { ctx, httpRequestWithAuthentication } = createExecuteFunctionsMock({
			params: {
				email: 'jane@example.com',
				additionalFields: { first_name: 'Jane' },
				customFields: { values: [{ key: 'custom_string_1', value: 'vip' }] },
			},
			apiResponse: { contact: { email: 'jane@example.com' } },
		});

		await executeContact.call(ctx, 'upsert', 0);

		const req = firstAuthRequest(httpRequestWithAuthentication);
		expect(req.method).toBe('POST');
		expect(req.url).toBe('https://notifuse.test/api/contacts.upsert');
		expect(req.body).toMatchObject({
			workspace_id: 'ws_test',
			contact: { email: 'jane@example.com', first_name: 'Jane', custom_string_1: 'vip' },
		});
	});

	it('getByEmail sends email + workspace_id as query params', async () => {
		const { ctx, httpRequestWithAuthentication } = createExecuteFunctionsMock({
			params: { email: 'jane@example.com', with_contact_lists: true },
		});

		await executeContact.call(ctx, 'getByEmail', 0);

		const req = firstAuthRequest(httpRequestWithAuthentication);
		expect(req.method).toBe('GET');
		expect(req.url).toBe('https://notifuse.test/api/contacts.getByEmail');
		expect(req.qs).toMatchObject({
			email: 'jane@example.com',
			with_contact_lists: true,
			workspace_id: 'ws_test',
		});
	});

	it('getByExternalId sends external_id as query param', async () => {
		const { ctx, httpRequestWithAuthentication } = createExecuteFunctionsMock({
			params: { external_id: 'ext-1' },
		});

		await executeContact.call(ctx, 'getByExternalId', 0);

		const req = firstAuthRequest(httpRequestWithAuthentication);
		expect(req.url).toBe('https://notifuse.test/api/contacts.getByExternalID');
		expect(req.qs).toMatchObject({ external_id: 'ext-1' });
	});

	it('getAll (not returnAll) returns the contacts array', async () => {
		const { ctx, httpRequestWithAuthentication } = createExecuteFunctionsMock({
			params: { returnAll: false, limit: 25, filters: { country: 'BR' } },
			apiResponse: { contacts: [{ email: 'a@x.com' }, { email: 'b@x.com' }] },
		});

		const result = await executeContact.call(ctx, 'getAll', 0);

		expect(Array.isArray(result)).toBe(true);
		expect(result).toHaveLength(2);
		const req = firstAuthRequest(httpRequestWithAuthentication);
		expect(req.qs).toMatchObject({ country: 'BR', limit: 25 });
	});

	it('getAll (returnAll) paginates with the cursor', async () => {
		const { ctx, httpRequestWithAuthentication } = createExecuteFunctionsMock({
			params: { returnAll: true, filters: {} },
		});
		httpRequestWithAuthentication
			.mockResolvedValueOnce({ contacts: [{ email: 'a@x.com' }], next_cursor: 'c2' })
			.mockResolvedValueOnce({ contacts: [{ email: 'b@x.com' }] });

		const result = (await executeContact.call(ctx, 'getAll', 0)) as unknown[];

		expect(result).toHaveLength(2);
		expect(httpRequestWithAuthentication).toHaveBeenCalledTimes(2);
		expect(firstAuthRequest(httpRequestWithAuthentication).qs).toMatchObject({ limit: 100 });
	});

	it('count calls the count endpoint', async () => {
		const { ctx, httpRequestWithAuthentication } = createExecuteFunctionsMock({
			apiResponse: { count: 7 },
		});

		const result = await executeContact.call(ctx, 'count', 0);

		expect(result).toMatchObject({ count: 7 });
		expect(firstAuthRequest(httpRequestWithAuthentication).url).toBe(
			'https://notifuse.test/api/contacts.count',
		);
	});

	it('delete posts the email', async () => {
		const { ctx, httpRequestWithAuthentication } = createExecuteFunctionsMock({
			params: { email: 'gone@example.com' },
		});

		await executeContact.call(ctx, 'delete', 0);

		const req = firstAuthRequest(httpRequestWithAuthentication);
		expect(req.url).toBe('https://notifuse.test/api/contacts.delete');
		expect(req.body).toMatchObject({ email: 'gone@example.com', workspace_id: 'ws_test' });
	});

	it('import parses the contacts JSON and sends subscribe_to_lists as array', async () => {
		const { ctx, httpRequestWithAuthentication } = createExecuteFunctionsMock({
			params: {
				contacts: '[{"email":"a@x.com"}]',
				subscribe_to_lists: ['list_1', 'list_2'],
			},
		});

		await executeContact.call(ctx, 'import', 0);

		const req = firstAuthRequest(httpRequestWithAuthentication);
		expect(req.url).toBe('https://notifuse.test/api/contacts.import');
		expect(req.body).toMatchObject({
			contacts: [{ email: 'a@x.com' }],
			subscribe_to_lists: ['list_1', 'list_2'],
		});
	});
});
