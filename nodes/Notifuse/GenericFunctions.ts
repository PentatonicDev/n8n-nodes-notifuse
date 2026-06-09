import {
	IDataObject,
	IDisplayOptions,
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
	INodeProperties,
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
 * Builds a `fixedCollection` key/value property (a friendly UI for arbitrary
 * JSON objects like metadata or template data). Pair with `keyValueToObject` in
 * execute to turn the rows back into a plain object.
 */
export function keyValueProperty(config: {
	name: string;
	displayName: string;
	description: string;
	displayOptions: IDisplayOptions;
	placeholder?: string;
}): INodeProperties {
	return {
		displayName: config.displayName,
		name: config.name,
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		placeholder: config.placeholder ?? 'Add Item',
		default: {},
		displayOptions: config.displayOptions,
		description: config.description,
		options: [
			{
				name: 'values',
				displayName: 'Item',
				values: [
					{ displayName: 'Key', name: 'key', type: 'string', default: '' },
					{ displayName: 'Value', name: 'value', type: 'string', default: '' },
				],
			},
		],
	};
}

/**
 * Converts a `fixedCollection` (key/value rows) parameter into a plain object,
 * e.g. `{ values: [{ key: 'a', value: '1' }] }` → `{ a: '1' }`. Used to build
 * JSON payloads (template data, metadata) from a friendly key/value UI.
 */
export function keyValueToObject(collection: IDataObject | undefined, rowsKey = 'values'): IDataObject {
	const rows = (collection?.[rowsKey] as IDataObject[]) ?? [];
	const out: IDataObject = {};
	for (const row of rows) {
		const key = row.key as string;
		if (key) out[key] = row.value;
	}
	return out;
}

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
