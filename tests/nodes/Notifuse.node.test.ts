import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { Notifuse } from '../../nodes/Notifuse/Notifuse.node';
import { DEFAULT_CREDENTIALS } from '../helpers';

function createNodeMock(opts: {
	resource: string;
	operation: string;
	params?: Record<string, unknown>;
	apiResponse?: unknown;
	items?: INodeExecutionData[];
	continueOnFail?: boolean;
}) {
	const params = { resource: opts.resource, operation: opts.operation, ...(opts.params ?? {}) };
	const httpRequestWithAuthentication = jest.fn().mockResolvedValue(opts.apiResponse ?? {});
	const ctx = {
		getInputData: jest.fn().mockReturnValue(opts.items ?? [{ json: {} }]),
		getNodeParameter: jest.fn((name: string, _i?: number, fallback?: unknown) =>
			name in params ? (params as Record<string, unknown>)[name] : fallback,
		),
		getCredentials: jest.fn().mockResolvedValue(DEFAULT_CREDENTIALS),
		getNode: jest.fn().mockReturnValue({ name: 'Notifuse' }),
		continueOnFail: jest.fn().mockReturnValue(opts.continueOnFail ?? false),
		helpers: {
			httpRequestWithAuthentication,
			returnJsonArray: (data: unknown) =>
				(Array.isArray(data) ? data : [data]).map((json) => ({ json })),
			constructExecutionMetaData: (data: INodeExecutionData[]) => data,
		},
	} as unknown as IExecuteFunctions;
	return { ctx, httpRequestWithAuthentication };
}

describe('Notifuse node', () => {
	const node = new Notifuse();

	it('exposes all resources', () => {
		const resourceProp = node.description.properties.find((p) => p.name === 'resource');
		const values = (resourceProp?.options as Array<{ value: string }>).map((o) => o.value);
		expect(values).toEqual(
			expect.arrayContaining([
				'broadcast',
				'contact',
				'customEvent',
				'list',
				'template',
				'transactional',
			]),
		);
		expect(values).not.toContain('user');
	});

	it('is usable as a tool', () => {
		expect(node.description.usableAsTool).toBe(true);
	});

	it('routes contact.count to the API and returns json items', async () => {
		const { ctx, httpRequestWithAuthentication } = createNodeMock({
			resource: 'contact',
			operation: 'count',
			apiResponse: { count: 3 },
		});

		const result = await node.execute.call(ctx);

		expect(result[0][0].json).toMatchObject({ count: 3 });
		expect(httpRequestWithAuthentication.mock.calls[0][1].url).toBe(
			'https://notifuse.test/api/contacts.count',
		);
	});

	it('captures errors per-item when continueOnFail is true', async () => {
		const { ctx } = createNodeMock({
			resource: 'contact',
			operation: 'count',
			continueOnFail: true,
		});
		(ctx.helpers.httpRequestWithAuthentication as jest.Mock).mockRejectedValue(new Error('boom'));

		const result = await node.execute.call(ctx);

		expect(result[0][0].json).toHaveProperty('error');
	});
});
