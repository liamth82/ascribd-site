# ascribd.ai marketing site

Static homepage plus one Vercel function. No build step.

- `index.html`: the page (styles and script inline)
- `api/request-access.js`: the Request access form. Writes to the **Leads** table in the Ascribd Airtable base. Needs env var `AIRTABLE_API_KEY`.
- `assets/`: wordmark, favicons, social share image (`og.png`)
- `vercel.json`: www → apex redirect, security headers, asset caching

Kept separate from `ascribd-ai-proxy` (dashboard.ascribd.ai) because that project's middleware sends every request without a session to /signin.
