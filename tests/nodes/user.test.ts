import { createHmac } from 'node:crypto';
import { executeUser } from '../../nodes/Notifuse/resources/user';
import { createExecuteFunctionsMock } from '../helpers';

describe('Notifuse User resource', () => {
	it('rootSignin computes HMAC-SHA256 signature and sends to the correct endpoint', async () => {
		const email = 'admin@example.com';
		const secretKey = 'super_secret_key_123';

		const { ctx, httpRequest } = createExecuteFunctionsMock({
			params: { email, secretKey },
			apiResponse: { jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' },
		});

		await executeUser.call(ctx, 'rootSignin', 0);

		const req = httpRequest.mock.calls[0][0] as {
			method: string;
			url: string;
			body: { email: string; timestamp: number; signature: string };
			json: boolean;
		};

		expect(req.method).toBe('POST');
		expect(req.url).toBe('https://notifuse.test/api/user.rootSignin');
		expect(req.body.email).toBe('admin@example.com');
		expect(typeof req.body.timestamp).toBe('number');
		expect(req.body.signature).toMatch(/^[a-f0-9]{64}$/); // 64 hex chars (SHA256)
		expect(req.json).toBe(true);

		// Verify the signature is a valid HMAC-SHA256
		const { email: reqEmail, timestamp: reqTimestamp, signature: reqSignature } = req.body;
		const expectedSignature = createHmac('sha256', secretKey)
			.update(`${reqEmail}:${reqTimestamp}`)
			.digest('hex');
		expect(reqSignature).toBe(expectedSignature);
	});
});
