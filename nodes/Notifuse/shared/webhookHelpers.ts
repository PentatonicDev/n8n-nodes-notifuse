import { BlockList, isIPv6 } from 'node:net';

export type WebhookSecurityOptions = {
	ignoreBots?: boolean;
	ipWhitelist?: string;
	allowedOrigins?: string;
	rawBody?: boolean;
};

export function buildAllowList(allowlist: string): BlockList {
	const entries = allowlist.split(',').map((entry) => entry.trim());
	const blockList = new BlockList();

	for (const entry of entries) {
		try {
			if (entry.includes('/')) {
				const [network, prefixStr] = entry.split('/');
				const prefix = parseInt(prefixStr, 10);
				if (isNaN(prefix)) continue;

				const ipType = network.includes(':') ? 'ipv6' : 'ipv4';
				const maxPrefix = ipType === 'ipv4' ? 32 : 128;
				if (prefix < 0 || prefix > maxPrefix) continue;

				blockList.addSubnet(network, prefix, ipType);
			} else if (entry) {
				const ipType = entry.includes(':') ? 'ipv6' : 'ipv4';
				blockList.addAddress(entry, ipType);
			}
		} catch {
			continue;
		}
	}

	return blockList;
}

export function isIpAllowed(allowlist: string | undefined, ips: string[], ip?: string): boolean {
	if (!allowlist) return true;

	const blockList = buildAllowList(allowlist);

	if (ip) {
		const ipFamily = isIPv6(ip) ? 'ipv6' : 'ipv4';
		if (blockList.check(ip, ipFamily)) return true;
	}

	return ips.some((entry) => blockList.check(entry, isIPv6(entry) ? 'ipv6' : 'ipv4'));
}

export function isOriginAllowed(
	allowedOrigins: string | undefined,
	origin: string | undefined,
): boolean {
	if (!allowedOrigins || !origin) return true;

	const origins = allowedOrigins.split(',').map((o) => o.trim().toLowerCase());
	return origins.includes('*') || origins.includes(origin.toLowerCase());
}

export function buildResponseHeaders(
	options: WebhookSecurityOptions,
	origin?: string,
): Record<string, string> {
	const headers: Record<string, string> = {};

	if (options.allowedOrigins && origin) {
		const origins = options.allowedOrigins.split(',').map((o) => o.trim());
		const allowOrigin = origins.includes('*') ? '*' : origin;
		headers['Access-Control-Allow-Origin'] = allowOrigin;
	}

	return headers;
}

export const webhookSecurityProperties = [
	{
		displayName: 'Allowed Origins (CORS)',
		name: 'allowedOrigins',
		type: 'string' as const,
		placeholder: 'e.g. https://example.com, https://app.example.com',
		default: '',
		description: 'Comma-separated list of allowed origins for CORS. Use * to allow all origins.',
	},
	{
		displayName: 'Ignore Bots',
		name: 'ignoreBots',
		type: 'boolean' as const,
		default: false,
		description: 'Whether to ignore requests from bots like link previewers and web crawlers',
	},
	{
		displayName: 'IP(s) Allowlist',
		name: 'ipWhitelist',
		type: 'string' as const,
		placeholder: 'e.g. 127.0.0.1, 192.168.1.0/24',
		default: '',
		description:
			'Comma-separated list of allowed IP addresses or CIDR ranges. Leave empty to allow all IPs.',
	},
	{
		displayName: 'Raw Body',
		name: 'rawBody',
		type: 'boolean' as const,
		default: false,
		description: 'Whether to include the raw request body in the output',
	},
];
