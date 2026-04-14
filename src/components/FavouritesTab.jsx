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
    { id: "83",  name: "Barcelona",      logo: "https://a.espncdn.com/i/teamlogos/soccer/500/83.png"  },
    { id: "86",  name: "Real Madrid",    logo: "https://a.espncdn.com/i/teamlogos/soccer/500/86.png"  },
    { id: "1068",name: "Atletico Madrid",logo: "https://a.espncdn.com/i/teamlogos/soccer/500/1068.png"},
  ]},
  { id: "ger.1", league: "Bundesliga", flag: "🇩🇪", teams: [
    { id: "132", name: "Bayern Munich",  logo: "https://a.espncdn.com/i/teamlogos/soccer/500/132.png" },
    { id: "124", name: "Borussia Dortmund", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/124.png" },
  ]},
  { id: "ita.1", league: "Serie A", flag: "🇮🇹", teams: [
    { id: "111", name: "Juventus",   logo: "https://a.espncdn.com/i/teamlogos/soccer/500/111.png" },
    { id: "110", name: "AC Milan",   logo: "https://a.espncdn.com/i/teamlogos/soccer/500/110.png" },
    { id: "109", name: "Inter Milan",logo: "https://a.espncdn.com/i/teamlogos/soccer/500/109.png" },
  ]},
];

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

function TeamSearch({ onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const { isFavorite, toggleFavoriteTeam } = useUserStore();

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://site.api.espn.com/apis/site/v2/sports/soccer/all/teams?limit=20&search=${encodeURIComponent(query)}`
        );
        const data = await res.json();
        setResults(data.sports?.[0]?.leagues?.[0]?.teams?.map(t => t.team) || []);
      } catch {
        setResults([]);
      }
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="fixed inset-0 z-[80] flex flex-col"
      style={{ background: "rgba(7,10,18,0.98)", backdropFilter: "blur(30px)" }}>
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <button onClick={onClose} className="w-9 h-9 glass-strong rounded-full flex items-center justify-center">
          <span className="text-white/60 text-xl leading-none">×</span>
        </button>
        <div className="flex-1 glass-strong rounded-xl px-4 py-2.5 flex items-center gap-2">
          <span className="text-white/30">🔍</span>
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search for a team..."
            className="flex-1 bg-transparent text-white text-sm placeholder-white/25 outline-none"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-white/30 hover:text-white/60">×</button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-8">
        {loading ? (
          <div className="space-y-2 mt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass rounded-xl h-14 animate-pulse" />
            ))}
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-2">
            {results.map(team => {
              const fav = isFavorite(team.id) || isFavorite(team.displayName);
              return (
                <button
                  key={team.id}
                  onClick={() => toggleFavoriteTeam({
                    id: team.id,
                    name: team.displayName,
                    logo: team.logos?.[0]?.href,
                    league: team.slug || "",
                  })}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                    fav ? "glass-strong ring-1 ring-yellow-400/40" : "glass"
                  }`}
                >
                  {team.logos?.[0]?.href ? (
                    <img src={team.logos[0].href} alt="" className="w-10 h-10 object-contain flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl glass-strong flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-black text-white/50">{team.abbreviation}</span>
                    </div>
                  )}
                  <div className="flex-1 text-left">
                    <p className="text-sm font-bold text-white">{team.displayName}</p>
                    <p className="text-xs text-white/30">{team.location}</p>
                  </div>
                  <span className={`text-lg ${fav ? "opacity-100" : "opacity-20"}`}>
                    {fav ? "⭐" : "☆"}
                  </span>
                </button>
              );
            })}
          </div>
        ) : query.length >= 2 ? (
          <div className="text-center py-12">
            <p className="text-3xl mb-2">🔍</p>
            <p className="text-sm text-white/30">No teams found for "{query}"</p>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-3xl mb-2">⚽</p>
            <p className="text-sm text-white/30">Type to search any team</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FavouritesTab({ allGames, onPress }) {
  const { favorites, removeFavorite } = useUserStore();
  const [showSearch, setShowSearch] = useState(false);

  // Filter games where either team is a favourite
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

      {/* Followed teams chips */}
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
                className="text-white/30 hover:text-red-400 transition-colors text-xs leading-none ml-1"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Favourite team matches */}
      {favorites.length > 0 && favGames.length > 0 && (
        <div className="mb-6">
          <p className="text-xs text-white/30 font-semibold uppercase tracking-widest mb-3">
            Today's Matches
          </p>
          <div className="space-y-2">
            {favGames.map((game, i) => (
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

      {/* Top teams to follow */}
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
                  <TeamPill
                    key={team.id}
                    team={team}
                    leagueId={league.id}
                    league={league.league}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}