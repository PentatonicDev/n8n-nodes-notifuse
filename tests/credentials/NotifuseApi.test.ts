import { NotifuseApi } from '../../credentials/NotifuseApi.credentials';

describe('NotifuseApi credential', () => {
	const cred = new NotifuseApi();

	it('has the expected identity', () => {
		expect(cred.name).toBe('notifuseApi');
		expect(cred.displayName).toBe('Notifuse API');
		expect(cred.icon).toBe('file:notifuse.svg');
	});

	it('requires apiUrl, apiToken and workspaceId', () => {
		const names = cred.properties.map((p) => p.name);
		expect(names).toEqual(['apiUrl', 'apiToken', 'workspaceId']);
		for (const p of cred.properties) {
			expect(p.required).toBe(true);
		}
		const token = cred.properties.find((p) => p.name === 'apiToken');
		expect(token?.typeOptions?.password).toBe(true);
	});

	it('injects a Bearer token via the Authorization header', () => {
		expect(cred.authenticate.properties.headers?.Authorization).toBe(
			'=Bearer {{$credentials.apiToken}}',
		);
	});

	it('tests the credential against contacts.count with the workspace id', () => {
		expect(cred.test.request.url).toBe('/api/contacts.count');
		expect(cred.test.request.method).toBe('GET');
		expect(cred.test.request.qs?.workspace_id).toBe('={{$credentials.workspaceId}}');
	});
});
