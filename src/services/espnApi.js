const ESPN = "https://site.api.espn.com/apis/site/v2/sports";
const CRICAPI_KEY = import.meta.env.VITE_CRICAPI_KEY;

const SOCCER_LEAGUES = [
  "eng.1",
  "esp.1",
  "ger.1",
  "ita.1",
  "fra.1",
  "uefa.champions",
  "uefa.europa",
];

const ENDPOINTS = {
  f1: `${ESPN}/racing/f1/scoreboard`,
};

const TTL = 60_000;

// ─── Cache helpers ────────────────────────────────────────

function getCached(sport) {
  try {
    const raw = localStorage.getItem(`scorehub_${sport}`);
    if (!raw) return null;
    const { data, time } = JSON.parse(raw);
    if (Date.now() - time < TTL) return data;
    return null;
  } catch {
    return null;
  }
}

function setCached(sport, data) {
  try {
    localStorage.setItem(
      `scorehub_${sport}`,
      JSON.stringify({ data, time: Date.now() })
    );
  } catch {}
}

function getStaleCached(sport) {
  try {
    const raw = localStorage.getItem(`scorehub_${sport}`);
    if (!raw) return null;
    return JSON.parse(raw).data;
  } catch {
    return null;
  }
}

function trackApiCall(sport) {
  try {
    const today = new Date().toDateString();
    const raw = localStorage.getItem("scorehub_api_calls") || "{}";
    const counts = JSON.parse(raw);
    if (counts.date !== today) {
      localStorage.setItem(
        "scorehub_api_calls",
        JSON.stringify({ date: today, total: 1, [sport]: 1 })
      );
      return;
    }
    counts.total = (counts.total || 0) + 1;
    counts[sport] = (counts[sport] || 0) + 1;
    localStorage.setItem("scorehub_api_calls", JSON.stringify(counts));
    console.log(`[ScoreHub] API calls today: ${counts.total}/100`);
  } catch {}
}

// ─── Fetch ────────────────────────────────────────────────

async function fetchSport(sport) {
  const cached = getCached(sport);
  if (cached) {
    console.log(`[ScoreHub] ${sport} served from cache ✓`);
    return cached;
  }

  console.log(`[ScoreHub] ${sport} fetching fresh data...`);
  trackApiCall(sport);

  try {
    let events = [];

    if (sport === "soccer") {
      const results = await Promise.allSettled(
        SOCCER_LEAGUES.map((league) =>
          fetch(`${ESPN}/soccer/${league}/scoreboard`)
            .then((r) => r.json())
            .then((d) => (d.events || []).map((e) => ({ ...e, _leagueSlug: league })))
        )
      );
      events = results
        .filter((r) => r.status === "fulfilled")
        .flatMap((r) => r.value);

    } else if (sport === "cricket") {
      if (!CRICAPI_KEY) throw new Error("No CricAPI key in .env");
      const res = await fetch(
        `https://api.cricapi.com/v1/currentMatches?apikey=${CRICAPI_KEY}&offset=0`
      );
      if (!res.ok) throw new Error(`CricAPI error: ${res.status}`);
      const data = await res.json();
      if (data.status !== "success") throw new Error(data.reason || "CricAPI failed");
      events = data.data || [];

    } else if (sport === "f1") {
      const res = await fetch(ENDPOINTS.f1);
      if (!res.ok) throw new Error(`ESPN F1 error: ${res.status}`);
      const data = await res.json();
      events = data.events || [];

    } else if (sport === "motogp") {
      try {
        const base = "/api/motogp";

        const seasonRes = await fetch(`${base}?path=results/seasons`);
        const seasons = await seasonRes.json();
        const currentSeason = Array.isArray(seasons)
          ? seasons.find(s => s.current) || seasons[0]
          : null;

        if (!currentSeason) throw new Error("No MotoGP season found");

        const upcomingRes = await fetch(
          `${base}?path=results%2Fevents%3FseasonUuid%3D${currentSeason.id}%26isFinished%3Dfalse`
        );
        const upcomingData = await upcomingRes.json();

        const finishedRes = await fetch(
          `${base}?path=results%2Fevents%3FseasonUuid%3D${currentSeason.id}%26isFinished%3Dtrue`
        );
        const finishedData = await finishedRes.json();

        events = [
          ...(Array.isArray(finishedData) ? finishedData.slice(-3) : []),
          ...(Array.isArray(upcomingData) ? upcomingData.slice(0, 3) : []),
        ];
      } catch (err) {
        console.warn("MotoGP API failed:", err.message);
        events = [];
      }
    }

    const result = { events };
    setCached(sport, result);
    return result;

  } catch (err) {
    console.warn(`[ScoreHub] ${sport} fetch failed:`, err.message);
    const stale = getStaleCached(sport);
    if (stale) return stale;
    return null;
  }
}

    const result = { events };
    setCached(sport, result);
    return result;

  } catch (err) {
    console.warn(`[ScoreHub] ${sport} fetch failed:`, err.message);
    const stale = getStaleCached(sport);
    if (stale) return stale;
    return null;
  }
}

// ─── League name + logo helpers ───────────────────────────

function getLeagueName(slug) {
  const nameMap = {
    "eng.1":              "Premier League",
    "esp.1":              "La Liga",
    "ger.1":              "Bundesliga",
    "ita.1":              "Serie A",
    "fra.1":              "Ligue 1",
    "uefa.champions":     "Champions League",
    "uefa.europa":        "Europa League",
    "english-premier-league": "Premier League",
    "spanish-la-liga":        "La Liga",
    "german-bundesliga":      "Bundesliga",
    "italian-serie-a":        "Serie A",
    "french-ligue-1":         "Ligue 1",
    "uefa-champions-league":  "Champions League",
    "uefa-europa-league":     "Europa League",
  };
  if (nameMap[slug]) return nameMap[slug];
  for (const [key, val] of Object.entries(nameMap)) {
    if (slug.includes(key)) return val;
  }
  return slug.replace(/^\d{4}-\d{2}-/, "").replace(/-/g, " ").trim() || "Soccer";
}

function getLeagueLogo(slug) {
  if (slug === "eng.1" || slug.includes("english"))  return "🏴󠁧󠁢󠁥󠁮󠁧󠁿";
  if (slug === "esp.1" || slug.includes("spanish"))  return "🇪🇸";
  if (slug === "ger.1" || slug.includes("german"))   return "🇩🇪";
  if (slug === "ita.1" || slug.includes("italian"))  return "🇮🇹";
  if (slug === "fra.1" || slug.includes("french"))   return "🇫🇷";
  if (slug === "uefa.champions" || slug.includes("champion")) return "⭐";
  if (slug === "uefa.europa"    || slug.includes("europa"))   return "🟠";
  return "⚽";
}

// ─── Normalizers ──────────────────────────────────────────

function getStatus(state) {
  if (state === "in")   return "live";
  if (state === "post") return "finished";
  return "scheduled";
}

function normalizeSoccer(events) {
  return events.map((e) => {
    const comp  = e.competitions?.[0];
    const home  = comp?.competitors?.find((c) => c.homeAway === "home");
    const away  = comp?.competitors?.find((c) => c.homeAway === "away");
    const state = e.status?.type?.state;
    const slug = e._leagueSlug || e.season?.slug || "";

    return {
      id: `espn-soccer-${e.id}`,
      sport: "soccer",
      status: getStatus(state),
      minute: state === "in"
        ? `${e.status?.displayClock}'`
        : state === "post"
        ? "FT"
        : e.status?.type?.shortDetail || "",
      league:     getLeagueName(slug),
      leagueLogo: getLeagueLogo(slug),
      homeTeam: {
        name:      home?.team?.displayName || "Home",
        shortName: home?.team?.abbreviation || "HOM",
        logo:      home?.team?.logo || null,
      },
      awayTeam: {
        name:      away?.team?.displayName || "Away",
        shortName: away?.team?.abbreviation || "AWY",
        logo:      away?.team?.logo || null,
      },
      homeScore: state !== "pre" ? parseInt(home?.score) || 0 : null,
      awayScore: state !== "pre" ? parseInt(away?.score) || 0 : null,
      events: [],
    };
  });
}

function normalizeCricket(matches) {
  return matches.map((m) => {
    const home = m.teams?.[0];
    const away = m.teams?.[1];

    const homeScoreObj = m.score?.find((s) =>
      s.inning?.toLowerCase().includes(home?.toLowerCase().split(" ")[0])
    );
    const awayScoreObj = m.score?.find((s) =>
      s.inning?.toLowerCase().includes(away?.toLowerCase().split(" ")[0])
    );

    const formatScore = (s) => s ? `${s.r}/${s.w} (${s.o})` : null;

    const leagueName =
      m.series?.name ||
      m.series?.t ||
      (m.matchType === "t20"  ? "T20" :
       m.matchType === "odi"  ? "ODI" :
       m.matchType === "test" ? "Test Match" :
       "Cricket");

    return {
      id: `cricapi-${m.id}`,
      sport: "cricket",
      status: m.matchEnded
        ? "finished"
        : m.matchStarted
        ? "live"
        : "scheduled",
      minute:     m.status || "",
      league:     leagueName,
      leagueLogo: "🏏",
      homeTeam: {
        name:      home || "Home",
        shortName: home?.split(" ").map((w) => w[0]).join("").slice(0, 3).toUpperCase() || "HOM",
        logo:      null,
      },
      awayTeam: {
        name:      away || "Away",
        shortName: away?.split(" ").map((w) => w[0]).join("").slice(0, 3).toUpperCase() || "AWY",
        logo:      null,
      },
      homeScore: formatScore(homeScoreObj),
      awayScore: formatScore(awayScoreObj),
      events: [],
    };
  });
}

function normalizeF1(events) {
  return events.map((e) => {
    const comp        = e.competitions?.[0];
    const competitors = comp?.competitors || [];
    const state       = e.status?.type?.state;

    return {
      id:      `espn-f1-${e.id}`,
      type:    "race",
      status:  getStatus(state),
      minute:  state === "in"
        ? `Lap ${e.status?.displayClock || ""}`
        : e.status?.type?.shortDetail || "",
      league:     "Formula 1",
      leagueLogo: "🏎️",
      event:   e.name || "F1 Race",
      circuit: e.venue?.fullName || e.location || "",
      results: competitors
        .sort((a, b) => (parseInt(a.order) || 0) - (parseInt(b.order) || 0))
        .slice(0, 5)
        .map((c, i) => ({
          pos:    parseInt(c.order) || i + 1,
          driver: c.athlete?.displayName || `Driver ${i + 1}`,
          team:   c.team?.displayName || "",
          gap:    i === 0 ? "Leader" : c.status?.displayValue || "+--",
        })),
    };
  });
}

function normalizeMotoGP(events) {
  return events.map((e) => {
    const isFinished = e.status === "Finished" ||
      new Date(e.date_end) < new Date();
    const isUpcoming = new Date(e.date_start) > new Date();

    return {
      id: `motogp-${e.id}`,
      type: "race",
      status: isFinished ? "finished" : isUpcoming ? "scheduled" : "live",
      minute: isFinished ? "FIN" :
        isUpcoming ? new Date(e.date_start).toLocaleDateString("en-GB", {
          day: "numeric", month: "short"
        }) : "LIVE",
      league: "MotoGP World Championship",
      leagueLogo: "🏍️",
      event: e.sponsored_name || e.name || "MotoGP Race",
      circuit: e.circuit?.name || e.country?.name || "",
      country: e.country?.iso?.toLowerCase() || "",
      results: [],
    };
  });
}

// ─── Main export ──────────────────────────────────────────

export async function getLiveGames(sport) {
  const data = await fetchSport(sport);
  if (!data?.events?.length) return [];

  if (sport === "soccer")  return normalizeSoccer(data.events);
  if (sport === "cricket") return normalizeCricket(data.events);
  if (sport === "f1")      return normalizeF1(data.events);
  if (sport === "motogp")  return normalizeMotoGP(data.events);
  return [];
}