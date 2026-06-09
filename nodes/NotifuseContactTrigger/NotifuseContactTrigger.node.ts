import { INodeType, INodeTypeDescription } from 'n8n-workflow';
import {
	buildTriggerDescription,
	notifuseTriggerWebhook,
	notifuseTriggerWebhookMethods,
} from '../Notifuse/shared/triggerFunctions';

export class NotifuseContactTrigger implements INodeType {
	description: INodeTypeDescription = {
		icon: 'file:notifuse-contact-trigger.svg',
		usableAsTool: true,
		...buildTriggerDescription({
			displayName: 'Notifuse Contact Trigger',
			name: 'notifuseContactTrigger',
			entity: 'Contact',
			eventOptions: [
				{ name: 'Contact Created', value: 'contact.created', description: 'A contact was created' },
				{ name: 'Contact Updated', value: 'contact.updated', description: 'A contact was updated' },
				{ name: 'Contact Deleted', value: 'contact.deleted', description: 'A contact was deleted' },
			],
		}),
	};

	webhook = notifuseTriggerWebhook;
	webhookMethods = notifuseTriggerWebhookMethods;
}
