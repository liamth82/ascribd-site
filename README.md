# ascribd.ai marketing site

Static homepage plus one Vercel function. No build step.

- `index.html`: the page (styles and script inline)
- `api/request-access.js`: the Request access form. Writes to the **Leads** table in the Ascribd Airtable base. Needs env var `AIRTABLE_API_KEY`.
- `assets/`: wordmark, favicons, social share image (`og.png`)
- `vercel.json`: security headers and asset caching. The apex → www redirect is set in Vercel Domains; www.ascribd.ai is the main address

Kept separate from `ascribd-ai-proxy` (dashboard.ascribd.ai) because that project's middleware sends every request without a session to /signin.

## Live signals (hero panel)
- `api/signals.js` reads the newest row of Airtable **Site Signals** (`tblrqgwX3jeP2rYlS`) that isn't ticked "Hide from Site", cached at the edge for 15 minutes.
- The rows are written every 3 hours by the Make scenario **Site Signals Feed** (id 7665105, folder Signals): Google News RSS for five sectors, then one GPT-4.1-mini call, then one Airtable row. About 7 Make operations per run.
- If the endpoint fails, the panel keeps its built-in example and shows "Example" instead of "Live".
