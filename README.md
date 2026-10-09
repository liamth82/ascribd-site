# ascribd.ai marketing site

Static homepage plus one Vercel function. No build step.

- `index.html`: the page (styles and script inline)
- `api/request-access.js`: the Find out more form. Writes to the **Leads** table in the Ascribd Airtable base. Needs env var `AIRTABLE_API_KEY`.
- `assets/`: wordmark, favicons, social share image (`og.png`)
- `vercel.json`: security headers and asset caching. The apex → www redirect is set in Vercel Domains; www.ascribd.ai is the main address

Kept separate from `ascribd-ai-proxy` (dashboard.ascribd.ai) because that project's middleware sends every request without a session to /signin.

## Page (9 Oct 2026)
Deliberately minimal: "Get Ascribd.", three proof points, two testimonials and a Find out more form. Nothing on the page describes how the platform works. The live signals panel and `api/signals.js` were removed; the Make scenario Site Signals Feed (7665105) no longer feeds anything.
