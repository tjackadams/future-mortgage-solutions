interface Env {
  ALLOWED_ORIGIN: string;
  ENQUIRY_TO: string;
  RESEND_API_KEY: string;
  RESEND_FROM: string;
  TURNSTILE_SECRET_KEY: string;
}

interface Enquiry {
  name: string;
  email: string;
  phone: string;
  message: string;
  privacyAccepted: boolean;
  website: string;
  turnstileToken: string;
}

const MAX_BODY_BYTES = 8_192;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const json = (body: Record<string, unknown>, status = 200): Response =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

const isString = (value: unknown): value is string => typeof value === 'string';

function validEnquiry(value: unknown): value is Enquiry {
  if (!value || typeof value !== 'object') return false;
  const enquiry = value as Record<string, unknown>;
  return (
    isString(enquiry['name']) && enquiry['name'].trim().length > 0 && enquiry['name'].length <= 100 &&
    isString(enquiry['email']) && EMAIL.test(enquiry['email']) && enquiry['email'].length <= 254 &&
    isString(enquiry['phone']) && enquiry['phone'].length <= 40 &&
    isString(enquiry['message']) && enquiry['message'].trim().length > 0 && enquiry['message'].length <= 1_500 &&
    typeof enquiry['privacyAccepted'] === 'boolean' && enquiry['privacyAccepted'] &&
    isString(enquiry['website']) && enquiry['website'].length <= 200 &&
    isString(enquiry['turnstileToken']) && enquiry['turnstileToken'].length <= 2_048
  );
}

async function verifyTurnstile(token: string, secret: string, remoteIp: string | null): Promise<boolean> {
  const form = new FormData();
  form.set('secret', secret);
  form.set('response', token);
  if (remoteIp) form.set('remoteip', remoteIp);

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: form,
  });
  if (!response.ok) return false;
  const result = await response.json<{ success?: boolean }>();
  return result.success === true;
}

async function deliverWithResend(enquiry: Enquiry, env: Env): Promise<boolean> {
  const message = [
    `Name: ${enquiry.name.trim()}`,
    `Email: ${enquiry.email.trim()}`,
    `Telephone: ${enquiry.phone.trim() || 'Not provided'}`,
    '',
    'Message:',
    enquiry.message.trim(),
  ].join('\n');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.RESEND_FROM,
      to: [env.ENQUIRY_TO],
      reply_to: enquiry.email.trim(),
      subject: `Website enquiry from ${enquiry.name.trim()}`,
      text: message,
    }),
  });

  return response.ok;
}

export default {
  async fetch(request, env): Promise<Response> {
    if (request.method !== 'POST' || new URL(request.url).pathname !== '/api/enquiries') {
      return json({ error: 'Not found.' }, 404);
    }

    const origin = request.headers.get('Origin');
    if (env.ALLOWED_ORIGIN && origin !== env.ALLOWED_ORIGIN) {
      return json({ error: 'Invalid request origin.' }, 403);
    }

    const contentLength = Number(request.headers.get('Content-Length') ?? '0');
    if (!request.headers.get('Content-Type')?.includes('application/json') || contentLength > MAX_BODY_BYTES) {
      return json({ error: 'Invalid request.' }, 400);
    }

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return json({ error: 'Invalid request.' }, 400);
    }

    if (!validEnquiry(payload)) return json({ error: 'Invalid request.' }, 400);
    if (payload.website) return json({ accepted: true });

    const verified = await verifyTurnstile(
      payload.turnstileToken,
      env.TURNSTILE_SECRET_KEY,
      request.headers.get('CF-Connecting-IP'),
    );
    if (!verified) return json({ error: 'Verification failed.' }, 400);

    const delivered = await deliverWithResend(payload, env);
    if (!delivered) return json({ error: 'Unable to send enquiry.' }, 502);

    return json({ accepted: true }, 202);
  },
} satisfies ExportedHandler<Env>;
