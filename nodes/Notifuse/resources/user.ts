import { createHmac } from 'node:crypto';
import { IDataObject, IExecuteFunctions, INodeProperties, NodeApiError, JsonObject } from 'n8n-workflow';
import { getNotifuseBaseUrl } from '../GenericFunctions';

/**
 * User resource — root programmatic sign-in.
 *
 * Special case: this endpoint is public (no Bearer token) and uses an
 * HMAC-SHA256 signature over `email:timestamp` with the instance secret key.
 * It therefore bypasses `notifuseApiRequest` (which would inject workspace_id
 * and the Bearer header) and calls the API directly. The base URL is still
 * taken from the credential so the same instance is targeted.
 */

export const userOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['user'] } },
		options: [
			{
				name: 'Root Sign In',
				value: 'rootSignin',
				description: 'Authenticate the root user via HMAC signature (returns a JWT)',
				action: 'Root sign in',
			},
		],
		default: 'rootSignin',
	},
];

export const userFields: INodeProperties[] = [
	{
		displayName: 'Root Email',
		name: 'email',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'admin@example.com',
		displayOptions: { show: { resource: ['user'], operation: ['rootSignin'] } },
		description: 'The configured root email address',
	},
	{
		displayName: 'Secret Key',
		name: 'secretKey',
		type: 'string',
		typeOptions: { password: true },
		required: true,
		default: '',
		displayOptions: { show: { resource: ['user'], operation: ['rootSignin'] } },
		description: "The instance's secret key used to compute the HMAC signature",
	},
];

export async function executeUser(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	if (operation === 'rootSignin') {
		const email = this.getNodeParameter('email', i) as string;
		const secretKey = this.getNodeParameter('secretKey', i) as string;
		const timestamp = Math.floor(Date.now() / 1000);
		const signature = createHmac('sha256', secretKey)
			.update(`${email}:${timestamp}`)
			.digest('hex');

		const baseUrl = await getNotifuseBaseUrl.call(this);

		try {
			return (await this.helpers.httpRequest({
				method: 'POST',
				url: `${baseUrl}/api/user.rootSignin`,
				body: { email, timestamp, signature },
				json: true,
			})) as IDataObject;
		} catch (error) {
			throw new NodeApiError(this.getNode(), error as JsonObject);
		}
	}

	return {};
}
