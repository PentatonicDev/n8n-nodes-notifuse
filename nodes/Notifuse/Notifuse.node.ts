import {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionTypes,
	NodeOperationError,
} from 'n8n-workflow';

import { contactOperations, contactFields, executeContact } from './resources/contact';
import { listOperations, listFields, executeList } from './resources/list';
import { broadcastOperations, broadcastFields, executeBroadcast } from './resources/broadcast';
import { templateOperations, templateFields, executeTemplate } from './resources/template';
import {
	transactionalOperations,
	transactionalFields,
	executeTransactional,
} from './resources/transactional';
import {
	customEventOperations,
	customEventFields,
	executeCustomEvent,
} from './resources/customEvent';
import { userOperations, userFields, executeUser } from './resources/user';

export class Notifuse implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Notifuse',
		name: 'notifuse',
		icon: 'file:notifuse.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with the Notifuse API',
		defaults: {
			name: 'Notifuse',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'notifuseApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Broadcast', value: 'broadcast' },
					{ name: 'Contact', value: 'contact' },
					{ name: 'Custom Event', value: 'customEvent' },
					{ name: 'List', value: 'list' },
					{ name: 'Template', value: 'template' },
					{ name: 'Transactional', value: 'transactional' },
					{ name: 'User', value: 'user' },
				],
				default: 'contact',
			},
			...contactOperations,
			...contactFields,
			...listOperations,
			...listFields,
			...broadcastOperations,
			...broadcastFields,
			...templateOperations,
			...templateFields,
			...transactionalOperations,
			...transactionalFields,
			...customEventOperations,
			...customEventFields,
			...userOperations,
			...userFields,
		],
		usableAsTool: true,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;
				let responseData: IDataObject | IDataObject[];

				switch (resource) {
					case 'contact':
						responseData = await executeContact.call(this, operation, i);
						break;
					case 'list':
						responseData = await executeList.call(this, operation, i);
						break;
					case 'broadcast':
						responseData = await executeBroadcast.call(this, operation, i);
						break;
					case 'template':
						responseData = await executeTemplate.call(this, operation, i);
						break;
					case 'transactional':
						responseData = await executeTransactional.call(this, operation, i);
						break;
					case 'customEvent':
						responseData = await executeCustomEvent.call(this, operation, i);
						break;
					case 'user':
						responseData = await executeUser.call(this, operation, i);
						break;
					default:
						throw new NodeOperationError(this.getNode(), `Unknown resource: ${resource}`);
				}

				const executionData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(responseData as IDataObject | IDataObject[]),
					{ itemData: { item: i } },
				);
				returnData.push(...executionData);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message }, pairedItem: { item: i } });
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
