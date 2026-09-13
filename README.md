# Future Mortgage Solutions

The public website and enquiry API for Future Mortgage Solutions.

## Local development

Install the pinned npm version, then start the Angular development server:

```bash
npm install
npm start
```

Open `http://localhost:4200/`. The development server reloads after source changes.

## Quality checks

Run the same checks expected before a release:

```bash
npm run check
```

Formatting is controlled by `.editorconfig` and `.prettierrc`. VS Code uses Prettier on save and sorts Tailwind classes using the Tailwind v4 stylesheet in `src/styles.css`.

To apply or verify formatting separately:

```bash
npm run format
npm run format:check
```

## Deployment

Cloudflare Git integration deploys the two applications independently from `main`:

- The Angular SSR application runs `npm run build`, then `npx wrangler deploy` from the repository root.
- The enquiry Worker runs `npx wrangler deploy` from `worker/` without a separate build command.

The following scripts provide equivalent manual deployments from the repository root:

```bash
npm run deploy
npm run deploy:worker
```

Configure the Worker values and secrets documented in `worker/README.md` before deploying it.

Both Wrangler configurations persist invocation logs and traces at 100% sampling, with query strings redacted. Review the sampling rates if traffic grows enough to approach the Cloudflare observability event allowance.

## Before launch

The following items require confirmation from the business owner or compliance team:

- Confirm the privacy controller, registered office, privacy contact, and retention criteria.
- Confirm Cloudflare Web Analytics is enabled as described, or remove that statement from the privacy notice.
- Add the production Worker secrets and verify a real enquiry from the deployed domain.
