import { describe, expect, it } from 'vitest';

import { handleRequest } from './index';

const env = {
  ALLOWED_ORIGIN: 'https://futuremortgagesolutions.co.uk,https://www.futuremortgagesolutions.co.uk',
  ENQUIRY_TO: 'enquiries@example.com',
  RESEND_API_KEY: 'test-key',
  RESEND_FROM: 'Website <website@example.com>',
  TURNSTILE_SECRET_KEY: 'test-secret',
};

const validEnquiry = {
  name: 'Test Person',
  email: 'person@example.com',
  phone: '',
  message: 'Please call me.',
  privacyAccepted: true,
  website: 'caught-by-honeypot',
  turnstileToken: 'test-token',
};

const createRequest = (body: string, origin = 'https://futuremortgagesolutions.co.uk') =>
  new Request('https://futuremortgagesolutions.co.uk/api/enquiries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin },
    body,
  });

describe('enquiry worker', () => {
  it('accepts requests from the www site origin', async () => {
    const request = createRequest(
      JSON.stringify(validEnquiry),
      'https://www.futuremortgagesolutions.co.uk',
    );

    const response = await handleRequest(request, env);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ accepted: true });
  });

  it('rejects requests from an unconfigured origin', async () => {
    const request = createRequest(JSON.stringify(validEnquiry), 'https://example.com');

    const response = await handleRequest(request, env);

    expect(response.status).toBe(403);
  });

  it('rejects oversized bodies even without a Content-Length header', async () => {
    const request = createRequest(' '.repeat(8_193));
    request.headers.delete('Content-Length');

    const response = await handleRequest(request, env);

    expect(response.status).toBe(413);
  });
});
