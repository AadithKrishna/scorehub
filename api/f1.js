export default async function handler(req, res) {
  const { path } = req.query;
  const base = "https://site.api.espn.com/apis/site/v2/sports/racing/f1";
  const url = path ? `${base}/${path}` : `${base}/scoreboard`;

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `ESPN error: ${response.status}` });
    }

    const data = await response.json();
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=30");
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.json(data);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}