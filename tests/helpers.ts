import { IExecuteFunctions } from 'n8n-workflow';

export const DEFAULT_CREDENTIALS = {
	apiUrl: 'https://notifuse.test',
	apiToken: 'tok_123',
	workspaceId: 'ws_test',
};

export interface ExecuteMockOptions {
	params?: Record<string, unknown>;
	credentials?: Record<string, unknown>;
	apiResponse?: unknown;
}

/**
 * Builds a mock IExecuteFunctions for testing resource `execute*` functions.
 * `httpRequestWithAuthentication` / `httpRequest` are jest mocks you can assert on.
 */
export function createExecuteFunctionsMock(opts: ExecuteMockOptions = {}) {
	const credentials = opts.credentials ?? DEFAULT_CREDENTIALS;
	const params = opts.params ?? {};
	const response = opts.apiResponse ?? {};

	const httpRequestWithAuthentication = jest.fn().mockResolvedValue(response);
	const httpRequest = jest.fn().mockResolvedValue(response);

	const ctx = {
		getNodeParameter: jest.fn((name: string, _i: number, fallback?: unknown) =>
			name in params ? params[name] : fallback,
		),
		getCredentials: jest.fn().mockResolvedValue(credentials),
		getNode: jest.fn().mockReturnValue({ name: 'Notifuse', type: 'notifuse', typeVersion: 1 }),
		continueOnFail: jest.fn().mockReturnValue(false),
		helpers: {
			httpRequestWithAuthentication,
			httpRequest,
		},
	} as unknown as IExecuteFunctions;

	return { ctx, httpRequestWithAuthentication, httpRequest };
}

/** Returns the options object passed to the first httpRequestWithAuthentication call. */
export function firstAuthRequest(mock: jest.Mock) {
	return mock.mock.calls[0][1] as {
		method: string;
		url: string;
		qs?: Record<string, unknown>;
		body?: Record<string, unknown>;
	};
}
