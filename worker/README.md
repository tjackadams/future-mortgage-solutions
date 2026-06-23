# Enquiry Worker

Deploy this Worker to the `futuremortgagesolutions.co.uk/api/*` route after Cloudflare manages the domain.

Set these secrets or variables in the Cloudflare dashboard; do not add them to source control:

- `ALLOWED_ORIGIN=https://futuremortgagesolutions.co.uk`
- `ENQUIRY_TO=faye@futuremortgagesolutions.co.uk`
- `RESEND_FROM=Future Mortgage Solutions <website@futuremortgagesolutions.co.uk>`
- `RESEND_API_KEY` (secret)
- `TURNSTILE_SECRET_KEY` (secret)

Add the public Turnstile site key to the `turnstile-site-key` meta element in `src/index.html` as part of production deployment. The private-review build intentionally leaves it empty.
