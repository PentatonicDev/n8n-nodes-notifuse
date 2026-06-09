import { INodeType, INodeTypeDescription } from 'n8n-workflow';
import {
	buildTriggerDescription,
	notifuseTriggerWebhook,
	notifuseTriggerWebhookMethods,
} from '../Notifuse/shared/triggerFunctions';

export class NotifuseEmailTrigger implements INodeType {
	description: INodeTypeDescription = {
		icon: 'file:notifuse-email-trigger.svg',
		usableAsTool: true,
		...buildTriggerDescription({
			displayName: 'Notifuse Email Trigger',
			name: 'notifuseEmailTrigger',
			entity: 'Email',
			eventOptions: [
				{ name: 'Email Bounced', value: 'email.bounced', description: 'An email bounced' },
				{ name: 'Email Clicked', value: 'email.clicked', description: 'A link in an email was clicked' },
				{ name: 'Email Complained', value: 'email.complained', description: 'A spam complaint was received' },
				{ name: 'Email Delivered', value: 'email.delivered', description: 'An email was delivered' },
				{ name: 'Email Opened', value: 'email.opened', description: 'An email was opened' },
				{ name: 'Email Sent', value: 'email.sent', description: 'An email was sent' },
				{ name: 'Email Unsubscribed', value: 'email.unsubscribed', description: 'A recipient unsubscribed via an email' },
			],
		}),
	};

	webhook = notifuseTriggerWebhook;
	webhookMethods = notifuseTriggerWebhookMethods;
}
