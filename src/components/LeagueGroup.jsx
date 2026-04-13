import { useState, useRef } from "react";
import MatchCard from "./MatchCard";

export default function LeagueGroup({ league, logo, games, index, onPressGame, onPressLeague }) {
  const [collapsed, setCollapsed] = useState(false);
  const contentRef = useRef(null);

  const liveCount = games.filter((g) => g.status === "live").length;
  const finishedCount = games.filter((g) => g.status === "finished").length;
  const scheduledCount = games.filter((g) => g.status === "scheduled").length;

  // Preview teams for collapsed state
  const previewGames = games.slice(0, 2);

  return (
    <div
      className="animate-card mx-4 mb-3"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* League container */}
      <div className="glass-card rounded-2xl overflow-hidden border border-white/8">

        {/* League header */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="w-full flex items-center justify-between px-4 py-3 transition-all duration-200 hover:bg-white/4"
        >
          {/* Left — logo + name + live badge */}
<div className="flex items-center gap-2.5">
            <span className="text-lg">{logo}</span>
            <button
              onClick={onPressLeague}
              className="text-sm font-bold text-white tracking-tight hover:text-violet-400 transition-colors"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {league} →
            </button>
            {liveCount > 0 && (
              <div className="flex items-center gap-1 bg-red-500/15 border border-red-500/20 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                <span className="text-xs font-bold text-red-400">
                  {liveCount} live
                </span>
              </div>
            )}
          </div>

          {/* Right — match count + chevron */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/25 font-medium">
              {games.length} match{games.length !== 1 ? "es" : ""}
            </span>
            <div className={`w-5 h-5 rounded-full glass-strong flex items-center justify-center transition-transform duration-300 ${
              collapsed ? "rotate-180" : "rotate-0"
            }`}>
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                <path d="M1 1L5 5L9 1" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </button>

        {/* Status strip */}
        <div className="flex gap-3 px-4 pb-2.5">
          {liveCount > 0 && (
            <span className="text-xs text-red-400/70">
              {liveCount} live
            </span>
          )}
          {finishedCount > 0 && (
            <span className="text-xs text-white/25">
              {finishedCount} finished
            </span>
          )}
          {scheduledCount > 0 && (
            <span className="text-xs text-blue-400/50">
              {scheduledCount} upcoming
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-white/6 mx-4" />

        {/* Collapsed preview */}
        {collapsed && (
          <div className="px-4 py-2.5 space-y-0">
            {previewGames.map((game, i) => (
              <div
                key={game.id}
                className={`flex items-center justify-between py-2 ${
                  i < previewGames.length - 1 ? "border-b border-white/5" : ""
                }`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {game.homeTeam.logo?.startsWith("http") ? (
                    <img src={game.homeTeam.logo} className="w-5 h-5 object-contain" alt="" />
                  ) : (
                    <span className="text-sm">{game.homeTeam.logo}</span>
                  )}
                  <span className="text-xs text-white/60 font-semibold truncate">
                    {game.homeTeam.shortName}
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3">
                  {game.status === "scheduled" ? (
                    <span className="text-xs text-white/30 font-medium">{game.minute}</span>
                  ) : (
                    <span className="text-xs font-bold text-white/70 tabular-nums">
                      {game.homeScore ?? 0} - {game.awayScore ?? 0}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                  <span className="text-xs text-white/60 font-semibold truncate text-right">
                    {game.awayTeam.shortName}
                  </span>
                  {game.awayTeam.logo?.startsWith("http") ? (
                    <img src={game.awayTeam.logo} className="w-5 h-5 object-contain" alt="" />
                  ) : (
                    <span className="text-sm">{game.awayTeam.logo}</span>
                  )}
                </div>
              </div>
            ))}
            {games.length > 2 && (
              <p className="text-xs text-white/25 text-center pt-1.5">
                +{games.length - 2} more
              </p>
            )}
          </div>
        )}

        {/* Expanded cards */}
        {!collapsed && (
          <div className="p-3 space-y-2">
            {games.map((game, i) => (
            <MatchCard
            key={game.id}
            game={game}
            index={i}
            showLeague={false}
            onPress={onPressGame}
            />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}