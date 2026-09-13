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

const isAllowedOrigin = (origin: string | null, configuredOrigins: string): boolean => {
  const allowedOrigins = configuredOrigins
    .split(',')
    .map((allowedOrigin) => allowedOrigin.trim())
    .filter(Boolean);

  return allowedOrigins.length === 0 || (origin !== null && allowedOrigins.includes(origin));
};

async function readRequestBody(request: Request): Promise<string | undefined> {
  const reader = request.body?.getReader();
  if (!reader) return '';

  const decoder = new TextDecoder();
  let body = '';
  let bytesRead = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) return body + decoder.decode();

    bytesRead += value.byteLength;
    if (bytesRead > MAX_BODY_BYTES) {
      await reader.cancel();
      return undefined;
    }

    body += decoder.decode(value, { stream: true });
  }
}

function validEnquiry(value: unknown): value is Enquiry {
  if (!value || typeof value !== 'object') return false;
  const enquiry = value as Record<string, unknown>;
  return (
    isString(enquiry['name']) &&
    enquiry['name'].trim().length > 0 &&
    enquiry['name'].length <= 100 &&
    isString(enquiry['email']) &&
    EMAIL.test(enquiry['email']) &&
    enquiry['email'].length <= 254 &&
    isString(enquiry['phone']) &&
    enquiry['phone'].length <= 40 &&
    isString(enquiry['message']) &&
    enquiry['message'].trim().length > 0 &&
    enquiry['message'].length <= 1_500 &&
    typeof enquiry['privacyAccepted'] === 'boolean' &&
    enquiry['privacyAccepted'] &&
    isString(enquiry['website']) &&
    enquiry['website'].length <= 200 &&
    isString(enquiry['turnstileToken']) &&
    enquiry['turnstileToken'].length <= 2_048
  );
}

async function verifyTurnstile(
  token: string,
  secret: string,
  remoteIp: string | null,
): Promise<boolean> {
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

export async function handleRequest(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST' || new URL(request.url).pathname !== '/api/enquiries') {
    return json({ error: 'Not found.' }, 404);
  }

  if (!isAllowedOrigin(request.headers.get('Origin'), env.ALLOWED_ORIGIN)) {
    return json({ error: 'Invalid request origin.' }, 403);
  }

  if (!request.headers.get('Content-Type')?.includes('application/json')) {
    return json({ error: 'Invalid request.' }, 400);
  }

  const body = await readRequestBody(request);
  if (body === undefined) return json({ error: 'Request body is too large.' }, 413);

  let payload: unknown;
  try {
    payload = JSON.parse(body);
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
}

export default { fetch: handleRequest } satisfies ExportedHandler<Env>;
