import { INodeType, INodeTypeDescription } from 'n8n-workflow';
import {
	buildTriggerDescription,
	notifuseTriggerWebhook,
	notifuseTriggerWebhookMethods,
} from '../Notifuse/shared/triggerFunctions';

export class NotifuseSegmentTrigger implements INodeType {
	description: INodeTypeDescription = {
		icon: 'file:notifuse-segment-trigger.svg',
		usableAsTool: true,
		...buildTriggerDescription({
			displayName: 'Notifuse Segment Trigger',
			name: 'notifuseSegmentTrigger',
			entity: 'Segment',
			eventOptions: [
				{ name: 'Segment Joined', value: 'segment.joined', description: 'A contact joined a segment' },
				{ name: 'Segment Left', value: 'segment.left', description: 'A contact left a segment' },
			],
		}),
	};

	webhook = notifuseTriggerWebhook;
	webhookMethods = notifuseTriggerWebhookMethods;
}
