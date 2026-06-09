import {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
	IWebhookFunctions,
	JsonObject,
	NodeApiError,
} from 'n8n-workflow';

export type NotifuseContext =
	| IExecuteFunctions
	| ILoadOptionsFunctions
	| IHookFunctions
	| IWebhookFunctions;

/**
 * Returns the base URL configured in the credential, without a trailing slash.
 */
export async function getNotifuseBaseUrl(this: NotifuseContext): Promise<string> {
	const credentials = await this.getCredentials('notifuseApi');
	return (credentials.apiUrl as string).replace(/\/+$/, '');
}

/**
 * Central HTTP helper for every Notifuse node.
 *
 * - Builds the full URL from the credential `apiUrl` + the given endpoint.
 * - Injects `workspace_id` (from the credential) into the query string for GET
 *   requests and into the body for write requests, unless it is already set.
 * - Uses the Bearer authentication configured on the credential.
 */
export async function notifuseApiRequest(
	this: NotifuseContext,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject = {},
	qs: IDataObject = {},
): Promise<IDataObject> {
	const credentials = await this.getCredentials('notifuseApi');
	const baseUrl = (credentials.apiUrl as string).replace(/\/+$/, '');
	const workspaceId = credentials.workspaceId as string;

	const query: IDataObject = { ...qs };
	const payload: IDataObject = { ...body };

	const isRead = method === 'GET' || method === 'HEAD';

	if (isRead) {
		if (query.workspace_id === undefined) {
			query.workspace_id = workspaceId;
		}
	} else if (payload.workspace_id === undefined) {
		payload.workspace_id = workspaceId;
	}

	const options: IHttpRequestOptions = {
		method,
		qs: query,
		url: `${baseUrl}${endpoint}`,
		json: true,
	};

	if (!isRead) {
		options.body = payload;
	}

	try {
		return (await this.helpers.httpRequestWithAuthentication.call(
			this,
			'notifuseApi',
			options,
		)) as IDataObject;
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
}
