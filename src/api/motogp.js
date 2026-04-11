export default async function handler(req, res) {
  const { path } = req.query;

  if (!path) {
    return res.status(400).json({ error: "No path provided" });
  }

  const url = `https://api.motogp.pulselive.com/motogp/v1/${path}`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json",
        "Origin": "https://www.motogp.com",
        "Referer": "https://www.motogp.com/",
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `MotoGP API error: ${response.status}`,
      });
    }

    const data = await response.json();

    // Cache for 60 seconds
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=30");
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.json(data);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}