export default async function handler(req, res) {
  const key = process.env.APISPORTS_KEY;
  if (!key) {
    res.status(200).json({ error: 'APISPORTS_KEY não configurada na Vercel.' });
    return;
  }
  const { path = 'fixtures', ...query } = req.query || {};
  const allowed = new Set(['fixtures', 'predictions', 'teams', 'leagues', 'standings', 'odds']);
  if (!allowed.has(String(path))) {
    res.status(400).json({ error: 'Endpoint não permitido.' });
    return;
  }
  const qs = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (Array.isArray(v)) v.forEach(x => qs.append(k, x));
    else if (v !== undefined && v !== null) qs.set(k, v);
  });
  const url = `https://v3.football.api-sports.io/${path}?${qs.toString()}`;
  try {
    const apiRes = await fetch(url, { headers: { 'x-apisports-key': key } });
    const data = await apiRes.json();
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    res.status(apiRes.status).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao consultar API-Football.', detail: String(error?.message || error) });
  }
}
