import { buildAllowList, isIpAllowed, isOriginAllowed, buildResponseHeaders } from '../../nodes/Notifuse/shared/webhookHelpers';

describe('Webhook Helpers', () => {
	describe('buildAllowList', () => {
		it('builds a BlockList from IPv4 addresses', () => {
			const allowlist = buildAllowList('192.168.1.1, 10.0.0.1');
			expect(allowlist).toBeDefined();
			expect(allowlist.check('192.168.1.1', 'ipv4')).toBe(true);
			expect(allowlist.check('10.0.0.1', 'ipv4')).toBe(true);
		});

		it('builds a BlockList from CIDR ranges', () => {
			const allowlist = buildAllowList('192.168.1.0/24, 10.0.0.0/8');
			expect(allowlist.check('192.168.1.50', 'ipv4')).toBe(true);
			expect(allowlist.check('10.128.0.1', 'ipv4')).toBe(true);
		});

		it('builds a BlockList from mixed IPv4 and CIDR', () => {
			const allowlist = buildAllowList('192.168.1.1, 10.0.0.0/24, 172.16.0.5');
			expect(allowlist.check('192.168.1.1', 'ipv4')).toBe(true);
			expect(allowlist.check('10.0.0.100', 'ipv4')).toBe(true);
			expect(allowlist.check('172.16.0.5', 'ipv4')).toBe(true);
		});

		it('handles IPv6 addresses', () => {
			const allowlist = buildAllowList('::1, 2001:db8::/32');
			expect(allowlist.check('::1', 'ipv6')).toBe(true);
			expect(allowlist.check('2001:db8:1234::1', 'ipv6')).toBe(true);
		});

		it('skips malformed entries without throwing', () => {
			const allowlist = buildAllowList('192.168.1.1, not-an-ip, 10.0.0.0/24');
			expect(allowlist.check('192.168.1.1', 'ipv4')).toBe(true);
			expect(allowlist.check('10.0.0.1', 'ipv4')).toBe(true);
		});

		it('skips entries with invalid CIDR prefix without throwing', () => {
			const allowlist = buildAllowList('192.168.1.0/999, 10.0.0.0/24');
			expect(allowlist.check('10.0.0.1', 'ipv4')).toBe(true);
		});

		it('skips entries with negative CIDR prefix without throwing', () => {
			const allowlist = buildAllowList('192.168.1.0/-1, 10.0.0.0/24');
			expect(allowlist.check('10.0.0.1', 'ipv4')).toBe(true);
		});

		it('handles whitespace-padded entries', () => {
			const allowlist = buildAllowList('  192.168.1.1  ,  10.0.0.0/24  ');
			expect(allowlist.check('192.168.1.1', 'ipv4')).toBe(true);
			expect(allowlist.check('10.0.0.50', 'ipv4')).toBe(true);
		});

		it('ignores empty entries', () => {
			const allowlist = buildAllowList('192.168.1.1, , 10.0.0.1');
			expect(allowlist.check('192.168.1.1', 'ipv4')).toBe(true);
			expect(allowlist.check('10.0.0.1', 'ipv4')).toBe(true);
		});
	});

	describe('isIpAllowed', () => {
		it('returns true when allowlist is undefined', () => {
			expect(isIpAllowed(undefined, ['192.168.1.1'])).toBe(true);
		});

		it('returns true when allowlist is empty string', () => {
			expect(isIpAllowed('', ['192.168.1.1'])).toBe(true);
		});

		it('returns true for an exact IPv4 match in ips array', () => {
			expect(isIpAllowed('192.168.1.1, 10.0.0.1', ['192.168.1.1'])).toBe(true);
		});

		it('returns true for an IP inside a CIDR range', () => {
			expect(isIpAllowed('192.168.1.0/24', ['192.168.1.50'])).toBe(true);
		});

		it('returns false for an IP outside the allowlist', () => {
			expect(isIpAllowed('192.168.1.0/24, 10.0.0.0/8', ['172.16.0.1'])).toBe(false);
		});

		it('checks multiple IPs in the ips array', () => {
			expect(isIpAllowed('192.168.1.0/24', ['172.16.0.1', '10.0.0.1', '192.168.1.50'])).toBe(true);
		});

		it('returns false when none of the ips array match', () => {
			expect(isIpAllowed('192.168.1.0/24', ['10.0.0.1', '172.16.0.1'])).toBe(false);
		});

		it('uses the ip parameter when provided', () => {
			expect(isIpAllowed('192.168.1.0/24', [], '192.168.1.50')).toBe(true);
		});

		it('returns true when ip parameter is in allowlist and ips array is empty', () => {
			expect(isIpAllowed('192.168.1.0/24', [], '192.168.1.100')).toBe(true);
		});

		it('prefers ip parameter over ips array', () => {
			expect(isIpAllowed('192.168.1.0/24', ['172.16.0.1'], '192.168.1.50')).toBe(true);
		});

		it('returns false when ip parameter is not in allowlist', () => {
			expect(isIpAllowed('192.168.1.0/24', [], '172.16.0.1')).toBe(false);
		});

		it('handles IPv6 addresses', () => {
			expect(isIpAllowed('::1, 2001:db8::/32', ['2001:db8::1'])).toBe(true);
		});

		it('returns false when no ips and no ip parameter provided', () => {
			expect(isIpAllowed('192.168.1.0/24', [])).toBe(false);
		});
	});

	describe('isOriginAllowed', () => {
		it('returns true when allowedOrigins is undefined', () => {
			expect(isOriginAllowed(undefined, 'https://example.com')).toBe(true);
		});

		it('returns true when allowedOrigins is empty string', () => {
			expect(isOriginAllowed('', 'https://example.com')).toBe(true);
		});

		it('returns true when origin is undefined', () => {
			expect(isOriginAllowed('https://example.com', undefined)).toBe(true);
		});

		it('returns true when allowedOrigins is * (wildcard)', () => {
			expect(isOriginAllowed('*', 'https://example.com')).toBe(true);
		});

		it('returns true for an exact match (case-insensitive)', () => {
			expect(isOriginAllowed('https://example.com', 'https://example.com')).toBe(true);
		});

		it('returns true for a case-insensitive match', () => {
			expect(isOriginAllowed('https://EXAMPLE.COM', 'https://example.com')).toBe(true);
		});

		it('returns true for a match in comma-separated list', () => {
			expect(isOriginAllowed('https://app1.com, https://app2.com, https://app3.com', 'https://app2.com')).toBe(true);
		});

		it('returns true when wildcard is in the list with other origins', () => {
			expect(isOriginAllowed('https://app1.com, *, https://app3.com', 'https://example.com')).toBe(true);
		});

		it('returns false when origin does not match any allowed origin', () => {
			expect(isOriginAllowed('https://app1.com, https://app2.com', 'https://example.com')).toBe(false);
		});

		it('handles whitespace in allowed origins list', () => {
			expect(isOriginAllowed('  https://example.com  ,  https://app.com  ', 'https://example.com')).toBe(true);
		});

		it('returns false when both allowedOrigins and origin are undefined', () => {
			expect(isOriginAllowed(undefined, undefined)).toBe(true);
		});

		it('handles case-insensitive wildcard with other origins', () => {
			expect(isOriginAllowed('https://app1.com, *', 'HTTPS://ANYTHING.COM')).toBe(true);
		});
	});

	describe('buildResponseHeaders', () => {
		it('returns empty object when allowedOrigins is not set', () => {
			const headers = buildResponseHeaders({});
			expect(headers).toEqual({});
		});

		it('returns empty object when origin is not provided', () => {
			const headers = buildResponseHeaders({ allowedOrigins: 'https://example.com' });
			expect(headers).toEqual({});
		});

		it('returns Access-Control-Allow-Origin with wildcard when allowedOrigins includes *', () => {
			const headers = buildResponseHeaders({ allowedOrigins: '*' }, 'https://example.com');
			expect(headers['Access-Control-Allow-Origin']).toBe('*');
		});

		it('returns the echoed origin when it is in the explicit allowed list', () => {
			const headers = buildResponseHeaders({ allowedOrigins: 'https://example.com, https://app.com' }, 'https://example.com');
			expect(headers['Access-Control-Allow-Origin']).toBe('https://example.com');
		});

		it('returns the origin as the header value even when wildcard is in list', () => {
			const headers = buildResponseHeaders({ allowedOrigins: '*' }, 'https://example.com');
			expect(headers['Access-Control-Allow-Origin']).toBe('*');
		});

		it('returns empty object when allowedOrigins is empty string', () => {
			const headers = buildResponseHeaders({ allowedOrigins: '' }, 'https://example.com');
			expect(headers).toEqual({});
		});

		it('returns empty object when both allowedOrigins and origin are provided but one is falsy', () => {
			const headers1 = buildResponseHeaders({ allowedOrigins: 'https://example.com' }, undefined);
			expect(headers1).toEqual({});

			const headers2 = buildResponseHeaders({ allowedOrigins: '' }, 'https://example.com');
			expect(headers2).toEqual({});
		});

		it('handles multiple origins with comma separation', () => {
			const headers = buildResponseHeaders(
				{ allowedOrigins: 'https://app1.com, https://app2.com, https://app3.com' },
				'https://app2.com',
			);
			expect(headers['Access-Control-Allow-Origin']).toBe('https://app2.com');
		});

		it('includes other options without modifying them', () => {
			const headers = buildResponseHeaders(
				{ allowedOrigins: 'https://example.com', ignoreBots: true, rawBody: false },
				'https://example.com',
			);
			expect(headers).toEqual({ 'Access-Control-Allow-Origin': 'https://example.com' });
		});
	});
});
