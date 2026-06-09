import { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';
import { notifuseApiRequest } from '../GenericFunctions';

/**
 * Custom Event resource — batch event import.
 *
 * Endpoints: POST /api/customEvents.import
 */

export const customEventOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['customEvent'] } },
		options: [
			{
				name: 'Import',
				value: 'import',
				description: 'Batch import custom events (max 50 events per request)',
				action: 'Import custom events',
			},
		],
		default: 'import',
	},
];

export const customEventFields: INodeProperties[] = [
	// ---------- import ----------
	{
		displayName: 'Events (JSON)',
		name: 'events',
		type: 'json',
		required: true,
		default: '[]',
		displayOptions: { show: { resource: ['customEvent'], operation: ['import'] } },
		description:
			'Array of custom event objects to import (max 50 events). Each event object must include "event_name" and "email" fields. Optional fields: "goal_type", "timestamp", "properties", and any other custom event metadata.',
	},
];

export async function executeCustomEvent(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	if (operation === 'import') {
		const eventsRaw = this.getNodeParameter('events', i) as string | IDataObject[];
		const events = typeof eventsRaw === 'string' ? JSON.parse(eventsRaw) : eventsRaw;
		const body: IDataObject = { events };
		return await notifuseApiRequest.call(this, 'POST', '/api/customEvents.import', body);
	}

	return {};
}
