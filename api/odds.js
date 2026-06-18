const DEFAULT_SPORTS = [
  'soccer_brazil_campeonato',
  'soccer_epl',
  'soccer_spain_la_liga',
  'soccer_uefa_champs_league',
  'soccer_conmebol_copa_libertadores'
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=45, stale-while-revalidate=45');

  const key = process.env.ODDS_API_KEY || process.env.THE_ODDS_API_KEY;
  if (!key) {
    return res.status(500).json({ error: 'ODDS_API_KEY não configurada na Vercel' });
  }

  const regions = req.query?.regions || 'eu,uk';
  const markets = req.query?.markets || 'h2h,totals';
  const oddsFormat = req.query?.oddsFormat || 'decimal';
  const dateFormat = req.query?.dateFormat || 'iso';

  const sportsFromEnv = process.env.ODDS_SPORTS
    ? process.env.ODDS_SPORTS.split(',').map(s => s.trim()).filter(Boolean)
    : null;

  const sports = req.query?.sport
    ? [String(req.query.sport)]
    : req.query?.sports
      ? String(req.query.sports).split(',').map(s => s.trim()).filter(Boolean)
      : (sportsFromEnv || DEFAULT_SPORTS);

  const response = [];
  const errors = [];

  for (const sport of sports) {
    try {
      const params = new URLSearchParams({
        apiKey: key,
        regions: String(regions),
        markets: String(markets),
        oddsFormat: String(oddsFormat),
        dateFormat: String(dateFormat)
      });

      const upstream = await fetch(`https://api.the-odds-api.com/v4/sports/${encodeURIComponent(sport)}/odds?${params.toString()}`, {
        cache: 'no-store'
      });

      const data = await upstream.json().catch(() => []);
      if (!upstream.ok) {
        errors.push({ sport, status: upstream.status, data });
        continue;
      }

      if (Array.isArray(data)) response.push(...data);
    } catch (err) {
      errors.push({ sport, error: String(err?.message || err) });
    }
  }

  return res.status(200).json({
    response,
    meta: {
      sports,
      count: response.length,
      errors
    }
  });
}
