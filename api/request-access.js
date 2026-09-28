// Book a demo form on ascribd.ai -> Leads table in the Ascribd Airtable base.
// Needs the Vercel env var AIRTABLE_API_KEY (a token with write access to
// base appko3fPfohjJpna6). Same-origin only; no CORS.

const BASE_ID = 'appko3fPfohjJpna6';
const LEADS_TABLE = 'tblptjPjSZZa8m1j8';
const PLANS = ['Platform', 'Managed', 'Not sure yet'];
const SECTORS = ['Financial services', 'Fintech', 'Insurance', 'Legal', 'Professional services', 'Other'];

// Best-effort rate limit per warm instance: 5 requests per IP per 10 minutes.
const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 5;
}

function clean(v, max) {
  return typeof v === 'string' ? v.replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max) : '';
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const body = typeof req.body === 'string' ? safeJson(req.body) : req.body || {};

  // Honeypot: bots fill every field. Pretend it worked.
  if (clean(body.website, 200)) return res.status(200).json({ ok: true });

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (limited(ip)) return res.status(429).json({ error: 'too_many_requests' });

  const name = clean(body.name, 120);
  const email = clean(body.email, 200).toLowerCase();
  const company = clean(body.company, 160);
  const sector = SECTORS.includes(body.sector) ? body.sector : '';
  const plan = PLANS.includes(body.plan) ? body.plan : '';

  if (!name || !company || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'missing_fields' });
  }

  const apiKey = process.env.AIRTABLE_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'not_configured' });

  const fields = {
    Name: name,
    Email: email,
    Company: company,
    'Date Submitted': new Date().toISOString().slice(0, 10),
  };
  if (sector) fields.Industry = sector;
  if (plan) fields['Plan Interest'] = plan;

  try {
    const r = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${LEADS_TABLE}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    });
    if (!r.ok) {
      console.error('Airtable error', r.status, await r.text());
      return res.status(502).json({ error: 'save_failed' });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Airtable request failed', err);
    return res.status(502).json({ error: 'save_failed' });
  }
}

function safeJson(s) {
  try { return JSON.parse(s); } catch { return {}; }
}
