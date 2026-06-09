import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	Icon,
	INodeProperties,
} from 'n8n-workflow';

export class NotifuseApi implements ICredentialType {
	name = 'notifuseApi';
	displayName = 'Notifuse API';
	documentationUrl = 'https://docs.notifuse.com/api-reference';
	icon: Icon = 'file:notifuse.svg';
	properties: INodeProperties[] = [
		{
			displayName: 'API URL',
			name: 'apiUrl',
			type: 'string',
			default: '',
			required: true,
			placeholder: 'https://notifuse.pentatonic.cloud',
			description:
				'The base URL of your Notifuse instance (without a trailing slash). Each environment can use its own URL and token.',
		},
		{
			displayName: 'API Token',
			name: 'apiToken',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'API token created in your Notifuse workspace (Admins & API Keys)',
		},
		{
			displayName: 'Workspace ID',
			name: 'workspaceId',
			type: 'string',
			default: '',
			required: true,
			placeholder: 'ws_1234567890',
			description: 'The workspace this credential is scoped to. Sent as workspace_id on every request.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiToken}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.apiUrl.replace(/\\/$/, "")}}',
			url: '/api/contacts.count',
			method: 'GET',
			qs: {
				workspace_id: '={{$credentials.workspaceId}}',
			},
		},
	};
}
