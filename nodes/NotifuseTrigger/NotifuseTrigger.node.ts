import { INodeType, INodeTypeDescription } from 'n8n-workflow';
import {
	buildNotifuseTriggerDescription,
	notifuseTriggerWebhook,
	notifuseTriggerWebhookMethods,
} from '../Notifuse/shared/triggerFunctions';

export class NotifuseTrigger implements INodeType {
	description: INodeTypeDescription = {
		icon: 'file:notifuse-trigger.svg',
		usableAsTool: true,
		...buildNotifuseTriggerDescription(),
	};

	webhook = notifuseTriggerWebhook;
	webhookMethods = notifuseTriggerWebhookMethods;
}
