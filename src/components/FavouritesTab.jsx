import { useState, useEffect } from "react";
import useUserStore from "../store/userStore";

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
    { id: "132", name: "Bayern Munich",      logo: "https://a.espncdn.com/i/teamlogos/soccer/500/132.png" },
    { id: "124", name: "Borussia Dortmund",  logo: "https://a.espncdn.com/i/teamlogos/soccer/500/124.png" },
  ]},
  { id: "ita.1", league: "Serie A", flag: "🇮🇹", teams: [
    { id: "111", name: "Juventus",    logo: "https://a.espncdn.com/i/teamlogos/soccer/500/111.png" },
    { id: "110", name: "AC Milan",    logo: "https://a.espncdn.com/i/teamlogos/soccer/500/110.png" },
    { id: "109", name: "Inter Milan", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/109.png" },
  ]},
];

const SOCCER_LEAGUES = ["eng.1","esp.1","ger.1","ita.1","fra.1"];

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
                id: team.id,
                name: team.displayName,
                logo: team.logos?.[0]?.href,
                league: d.sports?.[0]?.leagues?.[0]?.name || league,
                leagueId: league,
                sport: "soccer",
              });
            }
          });
        })
    )
  );
  return results;
}

async function searchF1Drivers(query) {
  const res = await fetch("https://api.jolpi.ca/ergast/f1/2025/drivers.json");
  const data = await res.json();
  const drivers = data.MRData?.DriverTable?.Drivers || [];
  return drivers
    .filter(d =>
      `${d.givenName} ${d.familyName}`.toLowerCase().includes(query.toLowerCase())
    )
    .map(d => ({
      id: d.driverId,
      name: `${d.givenName} ${d.familyName}`,
      logo: null,
      number: d.permanentNumber,
      nationality: d.nationality,
      sport: "f1",
      league: "Formula 1",
    }));
}

async function searchMotoGPRiders(query) {
  const res = await fetch("/api/motogp?path=riders?seasonYear=2025");
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data
    .filter(r => {
      const full = `${r.name || ""} ${r.surname || ""}`.toLowerCase();
      return full.includes(query.toLowerCase());
    })
    .filter(r => r.current_career_step?.category?.name === "MotoGP")
    .map(r => ({
      id: r.id,
      name: `${r.name} ${r.surname}`,
      logo: r.current_career_step?.pictures?.profile?.main || null,
      number: r.current_career_step?.number,
      team: r.current_career_step?.sponsored_team,
      sport: "motogp",
      league: "MotoGP",
    }));
}

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
      style={{ background: `${s.color}20`, color: s.color }}>
      {s.label}
    </span>
  );
}

function TeamSearch({ onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeSport, setActiveSport] = useState("soccer");
  const { isFavorite, toggleFavoriteTeam } = useUserStore();

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        let found = [];
        if (activeSport === "soccer") found = await searchFootballTeams(query);
        else if (activeSport === "f1") found = await searchF1Drivers(query);
        else if (activeSport === "motogp") found = await searchMotoGPRiders(query);
        setResults(found);
      } catch (err) {
        console.warn(err);
        setResults([]);
      }
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
      style={{ background: "rgba(7,10,18,0.98)", backdropFilter: "blur(30px)" }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-3">
        <button onClick={onClose}
          className="w-9 h-9 glass-strong rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white/60 text-xl leading-none">×</span>
        </button>
        <div className="flex-1 glass-strong rounded-xl px-4 py-2.5 flex items-center gap-2">
          <span className="text-white/30">🔍</span>
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={`Search ${activeSport === "soccer" ? "football teams" : activeSport === "f1" ? "F1 drivers" : "MotoGP riders"}...`}
            className="flex-1 bg-transparent text-white text-sm placeholder-white/25 outline-none"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-white/30 hover:text-white/60">×</button>
          )}
        </div>
      </div>

      {/* Sport filter */}
      <div className="flex gap-2 px-4 mb-4">
        {sports.map(s => (
          <button
            key={s.id}
            onClick={() => { setActiveSport(s.id); setQuery(""); setResults([]); }}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeSport === s.id ? "bg-violet-600 text-white" : "glass text-white/40"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-4 pb-8">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass rounded-xl h-16 animate-pulse" />
            ))}
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-2">
            {results.map(item => {
              const fav = isFavorite(item.id) || isFavorite(item.name);
              return (
                <button
                  key={item.id}
                  onClick={() => toggleFavoriteTeam(item)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all active:scale-[0.99] ${
                    fav ? "glass-strong ring-1 ring-yellow-400/40" : "glass hover:bg-white/5"
                  }`}
                >
                  {/* Logo / Avatar */}
                  {item.logo ? (
                    <img src={item.logo} alt="" className="w-10 h-10 object-contain flex-shrink-0 rounded-lg" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl glass-strong flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">
                        {item.sport === "f1" ? "🏎️" : item.sport === "motogp" ? "🏍️" : "⚽"}
                      </span>
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-bold text-white truncate">{item.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <SportBadge sport={item.sport} />
                      {item.league && (
                        <span className="text-xs text-white/30 truncate">{item.league}</span>
                      )}
                      {item.number && (
                        <span className="text-xs text-white/30">#{item.number}</span>
                      )}
                    </div>
                  </div>

                  {/* Star */}
                  <span className={`text-lg flex-shrink-0 ${fav ? "opacity-100" : "opacity-20"}`}>
                    {fav ? "⭐" : "☆"}
                  </span>
                </button>
              );
            })}
          </div>
        ) : query.length >= 2 ? (
          <div className="text-center py-12">
            <p className="text-3xl mb-2">🔍</p>
            <p className="text-sm text-white/30">No results for "{query}"</p>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">
              {activeSport === "f1" ? "🏎️" : activeSport === "motogp" ? "🏍️" : "⚽"}
            </p>
            <p className="text-sm text-white/30">
              {activeSport === "soccer" ? "Search any football team" :
               activeSport === "f1" ? "Search any F1 driver" :
               "Search any MotoGP rider"}
            </p>
            <p className="text-xs text-white/20 mt-1">Type at least 2 characters</p>
          </div>
        )}
      </div>
    </div>
  );
}

function TeamPill({ team, leagueId, league }) {
  const { isFavorite, toggleFavoriteTeam } = useUserStore();
  const fav = isFavorite(team.id) || isFavorite(team.name);

  return (
    <button
      onClick={() => toggleFavoriteTeam({ ...team, league, leagueId })}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all flex-shrink-0 ${
        fav ? "glass-strong ring-1 ring-yellow-400/40" : "glass hover:bg-white/5"
      }`}
    >
      <img src={team.logo} alt="" className="w-6 h-6 object-contain" />
      <span className="text-xs font-semibold text-white whitespace-nowrap">{team.name}</span>
      <span className={`text-xs ${fav ? "opacity-100" : "opacity-20"}`}>
        {fav ? "⭐" : "☆"}
      </span>
    </button>
  );
}

export default function FavouritesTab({ allGames, onPress }) {
  const { favorites, removeFavorite } = useUserStore();
  const [showSearch, setShowSearch] = useState(false);

  const favGames = allGames.filter(game =>
    favorites.some(fav =>
      fav.name === game.homeTeam?.name ||
      fav.name === game.awayTeam?.name ||
      fav.id === game.homeTeam?.id ||
      fav.id === game.awayTeam?.id
    )
  );

  return (
    <div className="pb-8">
      {showSearch && <TeamSearch onClose={() => setShowSearch(false)} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-black text-white"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          My Teams
        </h2>
        <button
          onClick={() => setShowSearch(true)}
          className="flex items-center gap-2 glass px-3 py-1.5 rounded-xl text-xs font-semibold text-white/60 hover:text-white transition-colors"
        >
          <span>🔍</span> Search teams
        </button>
      </div>

      {/* Followed teams */}
      {favorites.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {favorites.map(team => (
            <div key={team.id || team.name}
              className="flex items-center gap-2 glass-strong px-3 py-1.5 rounded-xl">
              {team.logo?.startsWith("http") && (
                <img src={team.logo} alt="" className="w-5 h-5 object-contain" />
              )}
              <span className="text-xs font-semibold text-white">{team.name}</span>
              <button
                onClick={() => removeFavorite(team.id || team.name)}
                className="text-white/30 hover:text-red-400 transition-colors text-xs ml-1"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Today's matches */}
      {favorites.length > 0 && favGames.length > 0 && (
        <div className="mb-6">
          <p className="text-xs text-white/30 font-semibold uppercase tracking-widest mb-3">
            Today's Matches
          </p>
          <div className="space-y-2">
            {favGames.map(game => (
              <div
                key={game.id}
                onClick={() => onPress?.(game)}
                className="glass-card rounded-xl px-3 py-3 flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-all active:scale-[0.99]"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <img src={game.homeTeam?.logo} alt="" className="w-8 h-8 object-contain flex-shrink-0" />
                  <span className="text-sm font-semibold text-white truncate">
                    {game.homeTeam?.shortName || game.homeTeam?.name}
                  </span>
                </div>
                <div className="flex flex-col items-center flex-shrink-0 min-w-[60px]">
                  {game.status === "scheduled" ? (
                    <span className="text-xs text-white/40">{game.minute}</span>
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5">
                        <span className="text-base font-black text-white">{game.homeScore ?? 0}</span>
                        <span className="text-white/20 text-xs">—</span>
                        <span className="text-base font-black text-white">{game.awayScore ?? 0}</span>
                      </div>
                      {game.status === "live" ? (
                        <div className="flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-red-400 animate-pulse" />
                          <span className="text-xs text-red-400 font-bold">{game.minute}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-white/25">FT</span>
                      )}
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                  <span className="text-sm font-semibold text-white truncate text-right">
                    {game.awayTeam?.shortName || game.awayTeam?.name}
                  </span>
                  <img src={game.awayTeam?.logo} alt="" className="w-8 h-8 object-contain flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No matches today */}
      {favorites.length > 0 && favGames.length === 0 && (
        <div className="text-center py-8 mb-6">
          <p className="text-3xl mb-2">📅</p>
          <p className="text-sm text-white/30">No matches today for your teams</p>
          <p className="text-xs text-white/20 mt-1">Check back tomorrow!</p>
        </div>
      )}

      {/* Popular teams */}
      <div>
        <p className="text-xs text-white/30 font-semibold uppercase tracking-widest mb-3">
          Popular Teams
        </p>
        <div className="space-y-4">
          {TOP_TEAMS.map(league => (
            <div key={league.id}>
              <p className="text-xs text-white/20 mb-2 flex items-center gap-1.5">
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
    </div>
  );
}