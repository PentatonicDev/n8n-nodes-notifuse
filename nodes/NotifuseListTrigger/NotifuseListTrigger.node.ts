import { INodeType, INodeTypeDescription } from 'n8n-workflow';
import {
	buildTriggerDescription,
	notifuseTriggerWebhook,
	notifuseTriggerWebhookMethods,
} from '../Notifuse/shared/triggerFunctions';

export class NotifuseListTrigger implements INodeType {
	description: INodeTypeDescription = {
		icon: 'file:notifuse-list-trigger.svg',
		usableAsTool: true,
		...buildTriggerDescription({
			displayName: 'Notifuse List Trigger',
			name: 'notifuseListTrigger',
			entity: 'List',
			eventOptions: [
				{ name: 'List Bounced', value: 'list.bounced', description: 'A list email bounced' },
				{ name: 'List Complained', value: 'list.complained', description: 'A spam complaint was received' },
				{ name: 'List Confirmed', value: 'list.confirmed', description: 'A subscription was confirmed (double opt-in)' },
				{ name: 'List Pending', value: 'list.pending', description: 'A subscription is pending confirmation' },
				{ name: 'List Removed', value: 'list.removed', description: 'A contact was removed from a list' },
				{ name: 'List Resubscribed', value: 'list.resubscribed', description: 'A contact resubscribed to a list' },
				{ name: 'List Subscribed', value: 'list.subscribed', description: 'A contact subscribed to a list' },
				{ name: 'List Unsubscribed', value: 'list.unsubscribed', description: 'A contact unsubscribed from a list' },
			],
		}),
	};

	webhook = notifuseTriggerWebhook;
	webhookMethods = notifuseTriggerWebhookMethods;
}
