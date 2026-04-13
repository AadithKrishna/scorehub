export default async function handler(req, res) {
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

    // Extract shot data from embedded JSON
    const shotsMatch = html.match(/shotsData\s*=\s*JSON\.parse\('(.+?)'\)/);
    const matchInfoMatch = html.match(/match_info\s*=\s*JSON\.parse\('(.+?)'\)/);
    const rostersMatch = html.match(/rostersData\s*=\s*JSON\.parse\('(.+?)'\)/);

    if (!shotsMatch) {
      return res.status(404).json({ error: "No shot data found" });
    }

    // Decode the escaped JSON
    const decode = (str) => JSON.parse(
      str.replace(/\\x([0-9A-Fa-f]{2})/g, (_, hex) =>
        String.fromCharCode(parseInt(hex, 16))
      )
    );

    const shots = decode(shotsMatch[1]);
    const matchInfo = matchInfoMatch ? decode(matchInfoMatch[1]) : null;
    const rosters = rostersMatch ? decode(rostersMatch[1]) : null;

    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=60");
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.json({ shots, matchInfo, rosters });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}