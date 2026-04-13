export default async function handler(req, res) {
  const rawUrl = req.url || "";
  
  // Route understat requests
  if (rawUrl.includes("/api/understat") || req.query.matchId) {
    const { matchId } = req.query;
    if (!matchId) return res.status(400).json({ error: "No matchId" });

    const url = `https://understat.com/match/${matchId}`;
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "text/html,application/xhtml+xml",
          "Accept-Language": "en-US,en;q=0.9",
          "Referer": "https://understat.com/",
        },
      });
      const html = await response.text();
      const shotsMatch = html.match(/shotsData\s*=\s*JSON\.parse\('(.+?)'\)/);
      if (!shotsMatch) return res.status(404).json({ error: "No shot data found" });
      const decode = (str) => JSON.parse(
        str.replace(/\\x([0-9A-Fa-f]{2})/g, (_, hex) =>
          String.fromCharCode(parseInt(hex, 16))
        )
      );
      const shots = decode(shotsMatch[1]);
      const matchInfoMatch = html.match(/match_info\s*=\s*JSON\.parse\('(.+?)'\)/);
      const matchInfo = matchInfoMatch ? decode(matchInfoMatch[1]) : null;
      res.setHeader("Cache-Control", "public, s-maxage=300");
      res.setHeader("Access-Control-Allow-Origin", "*");
      return res.json({ shots, matchInfo });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Original MotoGP proxy
  const pathIndex = rawUrl.indexOf("path=");
  if (pathIndex === -1) return res.status(400).json({ error: "No path provided" });

  const afterPath = rawUrl.slice(pathIndex + 5);
  const ampIndex = afterPath.indexOf("&");
  const encodedBase = ampIndex === -1 ? afterPath : afterPath.slice(0, ampIndex);
  const basePath = decodeURIComponent(encodedBase);
  const extraParams = ampIndex === -1 ? "" : afterPath.slice(ampIndex + 1);
  const url = extraParams
    ? `https://api.motogp.pulselive.com/motogp/v1/${basePath}?${extraParams}`
    : `https://api.motogp.pulselive.com/motogp/v1/${basePath}`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Origin": "https://www.motogp.com",
        "Referer": "https://www.motogp.com/",
      },
    });
    const text = await response.text();
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=30");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/json");
    return res.status(response.status).send(text);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}