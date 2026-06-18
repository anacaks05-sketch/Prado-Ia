export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  const key = process.env.APISPORTS_KEY || process.env.API_FOOTBALL_KEY || process.env.FOOTBALL_API_KEY;
  if (!key) {
    return res.status(500).json({ error: 'APISPORTS_KEY não configurada na Vercel' });
  }

  const { path = 'fixtures', ...query } = req.query || {};
  const safePath = String(path).replace(/^\/+/, '');

  if (!/^[a-z0-9/_-]+$/i.test(safePath)) {
    return res.status(400).json({ error: 'Path inválido' });
  }

  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (Array.isArray(v)) v.forEach(item => params.append(k, item));
    else if (v !== undefined && v !== null) params.set(k, v);
  });

  try {
    const url = `https://v3.football.api-sports.io/${safePath}?${params.toString()}`;
    const upstream = await fetch(url, {
      headers: { 'x-apisports-key': key },
      cache: 'no-store'
    });

    const data = await upstream.json().catch(() => ({}));
    return res.status(upstream.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Falha no proxy API-Football', detail: String(err?.message || err) });
  }
}
