// Live "Today's signals" for the homepage hero.
// Reads the newest row of the Site Signals table (written every 3 hours by the
// Make scenario "Site Signals Feed") that isn't ticked "Hide from Site".
// Cached at Vercel's edge, so Airtable sees a handful of reads an hour at most.

const BASE_ID = 'appko3fPfohjJpna6';
const TABLE = 'tblrqgwX3jeP2rYlS';
const SECTORS = ['Financial services', 'Fintech', 'Insurance', 'Legal', 'Professional services'];

function text(v, max) {
  return typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '';
}

export function cleanSignals(raw) {
  let parsed;
  try { parsed = JSON.parse(raw); } catch { return []; }
  const list = Array.isArray(parsed && parsed.signals) ? parsed.signals : [];
  return list
    .map((s) => ({
      headline: text(s.headline, 90),
      sector: SECTORS.includes(s.sector) ? s.sector : '',
      angle: text(s.angle, 200),
      published: !Number.isNaN(Date.parse(s.published)) ? new Date(s.published).toISOString() : null,
    }))
    .filter((s) => s.headline && s.sector && s.angle)
    .map((s) => ({ ...s, headline: s.headline.charAt(0).toUpperCase() + s.headline.slice(1) }))
    .sort((a, b) => (Date.parse(b.published || 0) || 0) - (Date.parse(a.published || 0) || 0))
    .slice(0, 5);
}

export default async function handler(req, res) {
  const apiKey = process.env.AIRTABLE_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'not_configured' });

  const params = new URLSearchParams({
    maxRecords: '1',
    filterByFormula: 'NOT({Hide from Site})',
    'sort[0][field]': 'Created',
    'sort[0][direction]': 'desc',
  });
  params.append('fields[]', 'Signals JSON');
  params.append('fields[]', 'Created');

  try {
    const r = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE}?${params}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!r.ok) {
      console.error('Airtable error', r.status, await r.text());
      return res.status(502).json({ error: 'read_failed' });
    }
    const data = await r.json();
    const row = data.records && data.records[0];
    const signals = row ? cleanSignals(row.fields['Signals JSON']) : [];
    if (signals.length < 3) return res.status(404).json({ error: 'no_signals' });

    res.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=86400');
    return res.status(200).json({ updated: row.fields.Created || row.createdTime, signals });
  } catch (err) {
    console.error('Signals request failed', err);
    return res.status(502).json({ error: 'read_failed' });
  }
}
