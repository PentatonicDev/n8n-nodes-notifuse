import { INodeType, INodeTypeDescription } from 'n8n-workflow';
import {
	buildTriggerDescription,
	notifuseTriggerWebhook,
	notifuseTriggerWebhookMethods,
} from '../Notifuse/shared/triggerFunctions';

export class NotifuseCustomEventTrigger implements INodeType {
	description: INodeTypeDescription = {
		icon: 'file:notifuse-custom-event-trigger.svg',
		usableAsTool: true,
		...buildTriggerDescription({
			displayName: 'Notifuse Custom Event Trigger',
			name: 'notifuseCustomEventTrigger',
			entity: 'Custom Event',
			eventOptions: [
				{ name: 'Custom Event Created', value: 'custom_event.created', description: 'A custom event was created' },
				{ name: 'Custom Event Updated', value: 'custom_event.updated', description: 'A custom event was updated' },
				{ name: 'Custom Event Deleted', value: 'custom_event.deleted', description: 'A custom event was deleted' },
			],
		}),
	};

	webhook = notifuseTriggerWebhook;
	webhookMethods = notifuseTriggerWebhookMethods;
}
