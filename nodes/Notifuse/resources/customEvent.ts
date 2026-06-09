import { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';
import { keyValueProperty, keyValueToObject, notifuseApiRequest } from '../GenericFunctions';

/**
 * Custom Event resource — batch event import.
 *
 * Endpoint: POST /api/customEvents.import
 *
 * Each event is modeled as a fixed collection row. Required fields: email,
 * event_name, external_id. Optional: occurred_at, goal_type, source, properties
 * (key/value sub-field for arbitrary event data).
 */

const IMPORT = { show: { resource: ['customEvent'], operation: ['import'] } };

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
		displayName: 'Events',
		name: 'events',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		placeholder: 'Add Event',
		required: true,
		default: {},
		displayOptions: IMPORT,
		description: 'Custom events to import (max 50 per request)',
		options: [
			{
				name: 'values',
				displayName: 'Event',
				values: [
					{
						displayName: 'Email',
						name: 'email',
						type: 'string',
						required: true,
						default: '',
						placeholder: 'user@example.com',
						description: 'Email address of the contact (auto-created if missing)',
					},
					{
						displayName: 'Event Name',
						name: 'event_name',
						type: 'string',
						required: true,
						default: '',
						placeholder: 'orders/fulfilled',
						description: 'Event type name (lowercase, e.g. orders/fulfilled)',
					},
					{
						displayName: 'External ID',
						name: 'external_id',
						type: 'string',
						required: true,
						default: '',
						placeholder: 'shopify_order_12345',
						description: 'External system identifier for the event',
					},
					{
						displayName: 'Occurred At',
						name: 'occurred_at',
						type: 'string',
						default: '',
						placeholder: '2025-01-15T10:30:00Z',
						description: 'When the event occurred (ISO 8601 date-time)',
					},
					{
						displayName: 'Goal Type',
						name: 'goal_type',
						type: 'string',
						default: '',
						description: 'Optional goal type classification for the event',
					},
					{
						displayName: 'Source',
						name: 'source',
						type: 'options',
						default: 'api',
						options: [
							{ name: 'API', value: 'api' },
							{ name: 'Integration', value: 'integration' },
							{ name: 'Import', value: 'import' },
						],
						description: 'Origin of the event',
					},
					keyValueProperty({
						name: 'properties',
						displayName: 'Properties',
						placeholder: 'Add Property',
						description: 'Optional key/value event data',
						displayOptions: {},
					}),
				],
			},
		],
	},
];

export async function executeCustomEvent(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	if (operation === 'import') {
		const eventsData = this.getNodeParameter('events', i, {}) as IDataObject;
		const eventRows = (eventsData.values as IDataObject[]) ?? [];

		const events: IDataObject[] = [];
		for (const row of eventRows) {
			const event: IDataObject = {};

			// Required fields
			if (row.email) event.email = row.email;
			if (row.event_name) event.event_name = row.event_name;
			if (row.external_id) event.external_id = row.external_id;

			// Optional fields
			if (row.occurred_at) event.occurred_at = row.occurred_at;
			if (row.goal_type) event.goal_type = row.goal_type;
			if (row.source) event.source = row.source;

			// Properties (key/value sub-collection)
			const properties = keyValueToObject(row.properties as IDataObject);
			if (Object.keys(properties).length) {
				event.properties = properties;
			}

			events.push(event);
		}

		return await notifuseApiRequest.call(this, 'POST', '/api/customEvents.import', { events });
	}

	return {};
}
