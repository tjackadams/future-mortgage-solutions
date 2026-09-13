# Enquiry Worker

Deploy this Worker to the `futuremortgagesolutions.co.uk/api/*` route after Cloudflare manages the domain.

Set these secrets or variables in the Cloudflare dashboard; do not add them to source control:

- `ALLOWED_ORIGIN=https://futuremortgagesolutions.co.uk,https://www.futuremortgagesolutions.co.uk`
- `ENQUIRY_TO=faye@futuremortgagesolutions.co.uk`
- `RESEND_FROM=Future Mortgage Solutions <website@futuremortgagesolutions.co.uk>`
- `RESEND_API_KEY` (secret)
- `TURNSTILE_SECRET_KEY` (secret)

The public Turnstile site key is stored in the `turnstile-site-key` meta element in `src/index.html`. Keep it paired with the `TURNSTILE_SECRET_KEY` configured for this Worker.
