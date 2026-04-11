import { useState, useEffect, useRef } from "react";
import { X, Search, Clock, TrendingUp } from "lucide-react";
import useUserStore from "../store/userStore";
import { SPORTS } from "../data/mockData";

const POPULAR = [
  "Premier League", "La Liga", "Champions League",
  "Bundesliga", "Serie A", "Ligue 1",
  "IPL", "Formula 1", "T20",
];

export default function SearchModal({ onClose, allGames = [], onSelectGame }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  const {
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
    loadRecentSearches,
  } = useUserStore();

  useEffect(() => {
    loadRecentSearches();
    inputRef.current?.focus();
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const results = query.trim().length > 1
    ? allGames.filter((g) => {
        const q = query.toLowerCase();
        return (
          g.homeTeam?.name?.toLowerCase().includes(q) ||
          g.awayTeam?.name?.toLowerCase().includes(q) ||
          g.league?.toLowerCase().includes(q) ||
          g.homeTeam?.shortName?.toLowerCase().includes(q) ||
          g.awayTeam?.shortName?.toLowerCase().includes(q) ||
          g.event?.toLowerCase().includes(q)
        );
      })
    : [];

  function handleSelect(game) {
    const term = game.event ||
      `${game.homeTeam?.name} vs ${game.awayTeam?.name}`;
    addRecentSearch(term);
    onSelectGame(game); // tell App what was selected
    onClose();
  }

  function handlePopular(term) {
    setQuery(term);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "rgba(8, 12, 20, 0.96)", backdropFilter: "blur(20px)" }}
    >
      {/* Search input */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4 border-b border-white/8">
        <Search size={18} className="text-white/30 flex-shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search teams, leagues..."
          className="flex-1 bg-transparent text-white placeholder-white/25 text-base outline-none font-medium"
        />
        {query ? (
          <button
            onClick={() => setQuery("")}
            className="text-white/30 hover:text-white/60 transition-colors"
          >
            <X size={18} />
          </button>
        ) : (
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white/70 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-white/30 font-semibold uppercase tracking-widest mb-3">
              {results.length} result{results.length !== 1 ? "s" : ""}
            </p>
            {results.map((game) => (
              <button
                key={game.id}
                onClick={() => handleSelect(game)}
                className="w-full flex items-center gap-3 glass-card rounded-2xl px-4 py-3 hover:bg-white/8 transition-all text-left"
              >
                {/* Sport icon */}
                <div className="w-9 h-9 rounded-xl glass-strong flex items-center justify-center flex-shrink-0">
                  <span className="text-base">
                    {SPORTS.find((s) => s.id === game.sport)?.icon || "🏆"}
                  </span>
                </div>

                {/* Match info */}
                <div className="flex-1 min-w-0">
                  {game.event ? (
                    <p className="text-sm font-semibold text-white truncate">
                      {game.event}
                    </p>
                  ) : (
                    <p className="text-sm font-semibold text-white truncate">
                      {game.homeTeam?.name}
                      <span className="text-white/30 font-normal"> vs </span>
                      {game.awayTeam?.name}
                    </p>
                  )}
                  <p className="text-xs text-white/35 truncate mt-0.5">
                    {game.leagueLogo} {game.league}
                  </p>
                </div>

                {/* Status */}
                <div className="flex-shrink-0 text-right">
                  {game.status === "live" ? (
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                      <span className="text-xs font-bold text-red-400">{game.minute}</span>
                    </div>
                  ) : game.homeScore !== null && game.homeScore !== undefined ? (
                    <span className="text-sm font-bold text-white/50">
                      {game.homeScore} — {game.awayScore}
                    </span>
                  ) : (
                    <span className="text-xs text-white/25">{game.minute}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* No results */}
        {query.trim().length > 1 && results.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-sm font-medium text-white/40">
              No results for "{query}"
            </p>
            <p className="text-xs text-white/20 mt-1">
              Try a different team or league name
            </p>
          </div>
        )}

        {/* Empty state */}
        {query.trim().length <= 1 && (
          <>
            {recentSearches.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-white/30 font-semibold uppercase tracking-widest">
                    Recent
                  </p>
                  <button
                    onClick={clearRecentSearches}
                    className="text-xs text-white/25 hover:text-white/50 transition-colors"
                  >
                    Clear
                  </button>
                </div>
                <div className="space-y-1">
                  {recentSearches.map((term, i) => (
                    <button
                      key={i}
                      onClick={() => setQuery(term)}
                      className="w-full flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-white/5 transition-colors text-left"
                    >
                      <Clock size={14} className="text-white/20 flex-shrink-0" />
                      <span className="text-sm text-white/50">{term}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={13} className="text-white/30" />
                <p className="text-xs text-white/30 font-semibold uppercase tracking-widest">
                  Popular
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {POPULAR.map((term) => (
                  <button
                    key={term}
                    onClick={() => handlePopular(term)}
                    className="glass px-3 py-1.5 rounded-full text-xs font-medium text-white/50 hover:text-white/80 hover:bg-white/10 transition-all"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}