import { useState, useEffect } from "react";
import useUserStore from "../store/userStore";
import F1DriverDetail from "./F1DriverDetail";
import MotoGPRiderDetail from "./MotoGPDriverDetail";
import { X } from "lucide-react";

const TOP_TEAMS = [
  { id: "eng.1", league: "Premier League", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", teams: [
    { id: "360", name: "Manchester United", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/360.png" },
    { id: "359", name: "Arsenal",           logo: "https://a.espncdn.com/i/teamlogos/soccer/500/359.png" },
    { id: "382", name: "Manchester City",   logo: "https://a.espncdn.com/i/teamlogos/soccer/500/382.png" },
    { id: "364", name: "Liverpool",         logo: "https://a.espncdn.com/i/teamlogos/soccer/500/364.png" },
    { id: "363", name: "Chelsea",           logo: "https://a.espncdn.com/i/teamlogos/soccer/500/363.png" },
    { id: "362", name: "Tottenham",         logo: "https://a.espncdn.com/i/teamlogos/soccer/500/362.png" },
  ]},
  { id: "esp.1", league: "La Liga", flag: "🇪🇸", teams: [
    { id: "83",   name: "Barcelona",       logo: "https://a.espncdn.com/i/teamlogos/soccer/500/83.png"   },
    { id: "86",   name: "Real Madrid",     logo: "https://a.espncdn.com/i/teamlogos/soccer/500/86.png"   },
    { id: "1068", name: "Atletico Madrid", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/1068.png" },
  ]},
  { id: "ger.1", league: "Bundesliga", flag: "🇩🇪", teams: [
    { id: "132", name: "Bayern Munich",     logo: "https://a.espncdn.com/i/teamlogos/soccer/500/132.png" },
    { id: "124", name: "Borussia Dortmund", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/124.png" },
  ]},
  { id: "ita.1", league: "Serie A", flag: "🇮🇹", teams: [
    { id: "111", name: "Juventus",    logo: "https://a.espncdn.com/i/teamlogos/soccer/500/111.png" },
    { id: "110", name: "AC Milan",    logo: "https://a.espncdn.com/i/teamlogos/soccer/500/110.png" },
    { id: "109", name: "Inter Milan", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/109.png" },
  ]},
];

const SOCCER_LEAGUES = ["eng.1", "esp.1", "ger.1", "ita.1", "fra.1"];

async function searchFootballTeams(query) {
  const results = [];
  await Promise.allSettled(
    SOCCER_LEAGUES.map(league =>
      fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/teams`)
        .then(r => r.json())
        .then(d => {
          const teams = d.sports?.[0]?.leagues?.[0]?.teams || [];
          teams.forEach(({ team }) => {
            if (team?.displayName?.toLowerCase().includes(query.toLowerCase())) {
              results.push({
                id: team.id, name: team.displayName, logo: team.logos?.[0]?.href,
                league: d.sports?.[0]?.leagues?.[0]?.name || league, leagueId: league, sport: "soccer",
              });
            }
          });
        })
    )
  );
  return results;
}

async function searchF1Drivers(query) {
  const res  = await fetch("https://api.jolpi.ca/ergast/f1/2026/drivers.json");
  const data = await res.json();
  return (data.MRData?.DriverTable?.Drivers || [])
    .filter(d => `${d.givenName} ${d.familyName}`.toLowerCase().includes(query.toLowerCase()))
    .map(d => ({
      id: d.driverId, name: `${d.givenName} ${d.familyName}`, logo: null,
      number: d.permanentNumber, nationality: d.nationality, sport: "f1", league: "Formula 1",
    }));
}

async function searchMotoGPRiders(query) {
  const res  = await fetch("/api/motogp?path=riders%3FseasonYear%3D2026");
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data
    .filter(r => `${r.name || ""} ${r.surname || ""}`.toLowerCase().includes(query.toLowerCase()))
    .filter(r => r.current_career_step?.category?.name === "MotoGP")
    .map(r => ({
      id: r.id, name: `${r.name} ${r.surname}`,
      logo: r.current_career_step?.pictures?.profile?.main || null,
      number: r.current_career_step?.number, team: r.current_career_step?.sponsored_team,
      sport: "motogp", league: "MotoGP",
      country: { name: r.country?.name || null, iso: r.country?.iso || null },
    }));
}

async function fetchNextEvent(fav) {
  try {
    const sport = fav.sport || "soccer";
    if (sport === "soccer" && fav.id && fav.leagueId) {
      const res  = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${fav.leagueId}/teams/${fav.id}`);
      const data = await res.json();
      const next = data.team?.nextEvent?.[0];
      if (!next) return null;
      const comp = next.competitions?.[0];
      const home = comp?.competitors?.find(c => c.homeAway === "home");
      const away = comp?.competitors?.find(c => c.homeAway === "away");
      const odds = comp?.odds?.[0];
      return {
        type: "soccer", date: new Date(next.date), venue: comp?.venue?.fullName,
        homeName: home?.team?.shortDisplayName, homeLogo: home?.team?.logos?.[0]?.href,
        awayName: away?.team?.shortDisplayName, awayLogo: away?.team?.logos?.[0]?.href,
        homeOdds: odds?.homeTeamOdds?.moneyLine, awayOdds: odds?.awayTeamOdds?.moneyLine,
        drawOdds: odds?.drawOdds?.moneyLine,
      };
    }
    if (sport === "f1") {
      const res  = await fetch("https://api.jolpi.ca/ergast/f1/2026.json");
      const data = await res.json();
      const next = (data.MRData?.RaceTable?.Races || []).find(r => new Date(r.date) > new Date());
      if (!next) return null;
      return { type: "f1", title: next.raceName, date: new Date(next.date), circuit: next.Circuit?.circuitName, country: next.Circuit?.Location?.country, round: next.round };
    }
    if (sport === "motogp") {
      const res  = await fetch("/api/motogp?path=events%3FseasonYear%3D2026");
      const data = await res.json();
      const now  = new Date();
      const next = (Array.isArray(data) ? data : [])
        .filter(e => new Date(e.date_start) > now)
        .sort((a, b) => new Date(a.date_start) - new Date(b.date_start))[0];
      if (!next) return null;
      const cleanName = (next.name || "").replace(/^.*?GRAND PRIX/i, "Grand Prix").replace(/GRAND PRIX OF /i, "Grand Prix of ").trim();
      return { type: "motogp", title: cleanName || next.name, date: new Date(next.date_start), country: next.circuit?.country, circuit: next.circuit?.name };
    }
  } catch (err) { console.warn("fetchNextEvent error:", err.message); }
  return null;
}

// ── Sport Badge ────────────────────────────────────────

function SportBadge({ sport }) {
  const map = {
    soccer: { label: "Football", color: "#10b981" },
    f1:     { label: "F1",       color: "#ef4444" },
    motogp: { label: "MotoGP",   color: "#f59e0b" },
    cricket:{ label: "Cricket",  color: "#3b82f6" },
  };
  const s = map[sport] || map.soccer;
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ background: `${s.color}18`, color: s.color }}>
      {s.label}
    </span>
  );
}

// ── Next Event Card ────────────────────────────────────

function NextEventCard({ fav }) {
  const [nextEvent, setNextEvent] = useState(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    fetchNextEvent(fav).then(e => { setNextEvent(e); setLoading(false); });
  }, [fav.id]);

  if (loading) return (
    <div className="rounded-xl h-20 animate-pulse" style={{ background: "var(--surface-2)" }} />
  );
  if (!nextEvent) return null;

  const dateStr = nextEvent.date.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
  const timeStr = nextEvent.date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="glass-card rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs">
          {nextEvent.type === "f1" ? "🏎️" : nextEvent.type === "motogp" ? "🏍️" : "📅"}
        </span>
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
          {nextEvent.type === "soccer" ? "Next Match" : "Next Race"}
        </p>
        <div className="ml-auto px-2 py-0.5 rounded-full" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
          <span className="text-xs" style={{ color: "var(--text-3)" }}>{dateStr}</span>
        </div>
      </div>

      {nextEvent.type === "soccer" && (
        <>
          <div className="flex items-center justify-between mb-3">
            <div className="flex flex-col items-center gap-1.5 flex-1">
              <img src={nextEvent.homeLogo} alt="" className="w-10 h-10 object-contain" />
              <p className="text-xs font-bold text-center" style={{ color: "var(--text-1)" }}>{nextEvent.homeName}</p>
            </div>
            <div className="flex flex-col items-center px-3">
              <p className="text-xs" style={{ color: "var(--text-3)" }}>vs</p>
              <p className="text-xs font-bold mt-1" style={{ color: "var(--text-2)" }}>{timeStr}</p>
            </div>
            <div className="flex flex-col items-center gap-1.5 flex-1">
              <img src={nextEvent.awayLogo} alt="" className="w-10 h-10 object-contain" />
              <p className="text-xs font-bold text-center" style={{ color: "var(--text-1)" }}>{nextEvent.awayName}</p>
            </div>
          </div>
          {nextEvent.venue && (
            <p className="text-xs text-center mb-2" style={{ color: "var(--text-4)" }}>📍 {nextEvent.venue}</p>
          )}
          {nextEvent.homeOdds && (
            <div className="flex items-center justify-between rounded-xl px-3 py-2"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
              {[
                { label: nextEvent.homeName, val: nextEvent.homeOdds },
                { label: "Draw",             val: nextEvent.drawOdds  },
                { label: nextEvent.awayName, val: nextEvent.awayOdds  },
              ].map(o => (
                <div key={o.label} className="text-center flex-1">
                  <p className="text-xs truncate px-1" style={{ color: "var(--text-3)" }}>{o.label}</p>
                  <p className="text-sm font-black" style={{ color: "var(--text-1)" }}>
                    {o.val ? (o.val > 0 ? `+${o.val}` : o.val) : "—"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {(nextEvent.type === "f1" || nextEvent.type === "motogp") && (
        <>
          <p className="text-base font-black mb-1" style={{ color: "var(--text-1)" }}>{nextEvent.title}</p>
          {nextEvent.circuit && <p className="text-xs mb-1" style={{ color: "var(--text-3)" }}>🏁 {nextEvent.circuit}</p>}
          {nextEvent.country && <p className="text-xs" style={{ color: "var(--text-3)" }}>📍 {nextEvent.country}</p>}
          <p className="text-xs font-semibold mt-2" style={{ color: "var(--text-2)" }}>{timeStr}</p>
          {nextEvent.round && <p className="text-xs mt-0.5" style={{ color: "var(--text-4)" }}>Round {nextEvent.round}</p>}
        </>
      )}
    </div>
  );
}

// ── Team Search Overlay ────────────────────────────────

function TeamSearch({ onClose }) {
  const [query, setQuery]           = useState("");
  const [results, setResults]       = useState([]);
  const [loading, setLoading]       = useState(false);
  const [activeSport, setActiveSport] = useState("soccer");
  const { isFavorite, toggleFavoriteTeam } = useUserStore();

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        let found = [];
        if (activeSport === "soccer")      found = await searchFootballTeams(query);
        else if (activeSport === "f1")     found = await searchF1Drivers(query);
        else if (activeSport === "motogp") found = await searchMotoGPRiders(query);
        setResults(found);
      } catch { setResults([]); }
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [query, activeSport]);

  const sports = [
    { id: "soccer", label: "⚽ Football" },
    { id: "f1",     label: "🏎️ F1"       },
    { id: "motogp", label: "🏍️ MotoGP"   },
  ];

  return (
    <div className="fixed inset-0 z-[80] flex flex-col"
      style={{ background: "var(--overlay-bg)" }}>

      {/* Search bar */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-3">
        <button onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
          <X size={16} style={{ color: "var(--text-2)" }} />
        </button>
        <div className="flex-1 rounded-xl px-4 py-2.5 flex items-center gap-2"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
          <span style={{ fontSize: 15 }}>🔍</span>
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={
              activeSport === "soccer" ? "Search football teams..." :
              activeSport === "f1"     ? "Search F1 drivers..."     :
              "Search MotoGP riders..."
            }
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "var(--text-1)" }}
          />
          {query && (
            <button onClick={() => setQuery("")} style={{ color: "var(--text-3)", fontSize: 18 }}>×</button>
          )}
        </div>
      </div>

      {/* Sport selector */}
      <div className="flex gap-2 px-4 mb-4">
        {sports.map(s => (
          <button key={s.id}
            onClick={() => { setActiveSport(s.id); setQuery(""); setResults([]); }}
            className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
            style={activeSport === s.id ? {
              background: "var(--accent)", color: "#fff",
            } : {
              background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-3)",
            }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-4 pb-8">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl h-16 animate-pulse" style={{ background: "var(--surface-2)" }} />
            ))}
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-2">
            {results.map(item => {
              const fav = isFavorite(item.id) || isFavorite(item.name);
              return (
                <button key={item.id} onClick={() => toggleFavoriteTeam(item)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all active:scale-[0.99]"
                  style={{
                    background: fav ? "rgba(0,122,255,0.06)" : "var(--surface)",
                    border: `1px solid ${fav ? "rgba(0,122,255,0.2)" : "var(--border)"}`,
                    boxShadow: "var(--shadow-sm)",
                  }}>
                  {item.logo ? (
                    <img src={item.logo} alt="" className="w-10 h-10 object-contain flex-shrink-0 rounded-lg" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                      <span className="text-lg">
                        {item.sport === "f1" ? "🏎️" : item.sport === "motogp" ? "🏍️" : "⚽"}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: "var(--text-1)" }}>{item.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <SportBadge sport={item.sport} />
                      {item.league && <span className="text-xs truncate" style={{ color: "var(--text-3)" }}>{item.league}</span>}
                      {item.number && <span className="text-xs" style={{ color: "var(--text-3)" }}>#{item.number}</span>}
                    </div>
                  </div>
                  <span className="text-lg flex-shrink-0" style={{ opacity: fav ? 1 : 0.2 }}>
                    {fav ? "⭐" : "☆"}
                  </span>
                </button>
              );
            })}
          </div>
        ) : query.length >= 2 ? (
          <div className="text-center py-12">
            <p className="text-3xl mb-2">🔍</p>
            <p className="text-sm" style={{ color: "var(--text-3)" }}>No results for "{query}"</p>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">
              {activeSport === "f1" ? "🏎️" : activeSport === "motogp" ? "🏍️" : "⚽"}
            </p>
            <p className="text-sm" style={{ color: "var(--text-3)" }}>
              {activeSport === "soccer" ? "Search any football team" :
               activeSport === "f1"     ? "Search any F1 driver"    : "Search any MotoGP rider"}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-4)" }}>Type at least 2 characters</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Team Pill ──────────────────────────────────────────

function TeamPill({ team, leagueId, league }) {
  const { isFavorite, toggleFavoriteTeam } = useUserStore();
  const fav = isFavorite(team.id) || isFavorite(team.name);
  return (
    <button
      onClick={() => toggleFavoriteTeam({ ...team, league, leagueId, sport: "soccer" })}
      className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all flex-shrink-0"
      style={{
        background: fav ? "rgba(0,122,255,0.06)" : "var(--surface)",
        border: `1px solid ${fav ? "rgba(0,122,255,0.2)" : "var(--border)"}`,
        boxShadow: "var(--shadow-sm)",
      }}>
      <img src={team.logo} alt="" className="w-6 h-6 object-contain" />
      <span className="text-xs font-semibold whitespace-nowrap" style={{ color: "var(--text-1)" }}>
        {team.name}
      </span>
      <span style={{ fontSize: 12, opacity: fav ? 1 : 0.2 }}>{fav ? "⭐" : "☆"}</span>
    </button>
  );
}

// ── Main Favourites Tab ────────────────────────────────

export default function FavouritesTab({ allGames, onPress }) {
  const { favorites, removeFavorite } = useUserStore();
  const [showSearch, setShowSearch]     = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);

  const favGames   = allGames.filter(game =>
    favorites.some(fav =>
      fav.name === game.homeTeam?.name || fav.name === game.awayTeam?.name ||
      fav.id   === game.homeTeam?.id   || fav.id   === game.awayTeam?.id
    )
  );
  const soccerFavs = favorites.filter(f => f.sport === "soccer" || !f.sport);
  const motorFavs  = favorites.filter(f => f.sport === "f1" || f.sport === "motogp");
  const showPopular = soccerFavs.length === 0;

  return (
    <div className="pb-8">
      {showSearch && <TeamSearch onClose={() => setShowSearch(false)} />}

      {selectedDriver?.sport === "f1" && (
        <F1DriverDetail driver={selectedDriver} onClose={() => setSelectedDriver(null)} />
      )}
      {selectedDriver?.sport === "motogp" && (
        <MotoGPRiderDetail rider={selectedDriver} onClose={() => setSelectedDriver(null)} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-black"
          style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--text-1)" }}>
          My Teams
        </h2>
        <button onClick={() => setShowSearch(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-3)" }}>
          <span>🔍</span> Search teams
        </button>
      </div>

      {/* Followed chips */}
      {favorites.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {favorites.map(team => (
            <div key={team.id || team.name}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
              {team.logo?.startsWith("http") && (
                <img src={team.logo} alt="" className="w-5 h-5 object-contain" />
              )}
              <span className="text-xs font-semibold" style={{ color: "var(--text-1)" }}>{team.name}</span>
              <SportBadge sport={team.sport || "soccer"} />
              <button onClick={() => removeFavorite(team.id || team.name)}
                className="ml-1 transition-colors"
                style={{ color: "var(--text-4)", fontSize: 16 }}>
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Today's matches */}
      {soccerFavs.length > 0 && favGames.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>
            Today's Matches
          </p>
          <div className="space-y-2">
            {favGames.map(game => (
              <div key={game.id} onClick={() => onPress?.(game)}
                className="glass-card rounded-xl px-3 py-3 flex items-center gap-3 cursor-pointer active:scale-[0.99] transition-all">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <img src={game.homeTeam?.logo} alt="" className="w-8 h-8 object-contain flex-shrink-0" />
                  <span className="text-sm font-semibold truncate" style={{ color: "var(--text-1)" }}>
                    {game.homeTeam?.shortName || game.homeTeam?.name}
                  </span>
                </div>
                <div className="flex flex-col items-center flex-shrink-0 min-w-[60px]">
                  {game.status === "scheduled" ? (
                    <span className="text-xs" style={{ color: "var(--text-3)" }}>{game.minute}</span>
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5">
                        <span className="text-base font-black" style={{ color: "var(--text-1)" }}>{game.homeScore ?? 0}</span>
                        <span className="text-xs" style={{ color: "var(--text-4)" }}>—</span>
                        <span className="text-base font-black" style={{ color: "var(--text-1)" }}>{game.awayScore ?? 0}</span>
                      </div>
                      {game.status === "live" ? (
                        <div className="flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full animate-pulse" style={{ background: "var(--live)" }} />
                          <span className="text-xs font-bold" style={{ color: "var(--live)" }}>{game.minute}</span>
                        </div>
                      ) : (
                        <span className="text-xs" style={{ color: "var(--text-4)" }}>FT</span>
                      )}
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                  <span className="text-sm font-semibold truncate text-right" style={{ color: "var(--text-1)" }}>
                    {game.awayTeam?.shortName || game.awayTeam?.name}
                  </span>
                  <img src={game.awayTeam?.logo} alt="" className="w-8 h-8 object-contain flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming football */}
      {soccerFavs.length > 0 && favGames.length === 0 && (
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>
            Upcoming
          </p>
          <div className="space-y-4">
            {soccerFavs.map(fav => (
              <div key={fav.id || fav.name}>
                <div className="flex items-center gap-2 mb-2">
                  {fav.logo?.startsWith("http") && (
                    <img src={fav.logo} alt="" className="w-5 h-5 object-contain" />
                  )}
                  <p className="text-xs font-semibold" style={{ color: "var(--text-3)" }}>{fav.name}</p>
                </div>
                <NextEventCard fav={{ ...fav, sport: fav.sport || "soccer" }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* F1 / MotoGP */}
      {motorFavs.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>
            Next Race
          </p>
          <div className="space-y-4">
            {motorFavs.map(fav => (
              <div key={fav.id || fav.name}>
                <div className="flex items-center gap-2 mb-2 cursor-pointer"
                  onClick={() => setSelectedDriver(fav)}>
                  {fav.logo?.startsWith("http") ? (
                    <img src={fav.logo} alt="" className="w-6 h-6 object-contain rounded-full" />
                  ) : (
                    <span className="text-sm">{fav.sport === "f1" ? "🏎️" : "🏍️"}</span>
                  )}
                  <p className="text-xs font-semibold" style={{ color: "var(--text-2)" }}>{fav.name}</p>
                  <span className="ml-auto text-xs px-2 py-0.5 rounded-full"
                    style={{
                      background: fav.sport === "f1" ? "rgba(220,0,0,0.1)" : "rgba(249,115,22,0.1)",
                      color: fav.sport === "f1" ? "#DC0000" : "#f97316",
                    }}>
                    {fav.sport === "f1" ? "F1" : "MotoGP"}
                  </span>
                </div>
                <NextEventCard fav={fav} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Popular teams */}
      {showPopular && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>
            Popular Teams
          </p>
          <div className="space-y-4">
            {TOP_TEAMS.map(league => (
              <div key={league.id}>
                <p className="text-xs mb-2 flex items-center gap-1.5" style={{ color: "var(--text-4)" }}>
                  <span>{league.flag}</span>
                  {league.league}
                </p>
                <div className="flex flex-wrap gap-2">
                  {league.teams.map(team => (
                    <TeamPill key={team.id} team={team} leagueId={league.id} league={league.league} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}