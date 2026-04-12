export default async function handler(req, res) {
  const rawUrl = req.url || "";
  const pathIndex = rawUrl.indexOf("path=");

  if (pathIndex === -1) {
    return res.status(400).json({ error: "No path provided" });
  }

  // Get the path value (up to next & if any)
  const afterPath = rawUrl.slice(pathIndex + 5);
  const ampIndex = afterPath.indexOf("&");
  const encodedBase = ampIndex === -1 ? afterPath : afterPath.slice(0, ampIndex);
  const basePath = decodeURIComponent(encodedBase);

  // Get any remaining query params after the path
  const extraParams = ampIndex === -1 ? "" : afterPath.slice(ampIndex + 1);

  // Build full URL
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