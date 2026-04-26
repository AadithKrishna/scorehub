import { useState } from "react";
import MatchCard from "./MatchCard";

export default function LeagueGroup({ league, logo, games, index, onPressGame, onPressLeague }) {
  const [collapsed, setCollapsed] = useState(false);

  const liveCount      = games.filter(g => g.status === "live").length;
  const finishedCount  = games.filter(g => g.status === "finished").length;
  const scheduledCount = games.filter(g => g.status === "scheduled").length;
  const previewGames   = games.slice(0, 2);

  return (
    <div
      className="animate-card mx-4 mb-3"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          boxShadow: "var(--shadow-sm)",
          overflow: "hidden",
        }}
      >
        {/* League header */}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="w-full flex items-center justify-between px-4 py-3 transition-all duration-150"
          style={{ background: "transparent" }}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-lg">{logo}</span>
            <button
              onClick={e => { e.stopPropagation(); onPressLeague?.(); }}
              className="text-sm font-bold transition-colors"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                color: "var(--text-1)",
              }}
            >
              {league} →
            </button>
            {liveCount > 0 && (
              <div
                className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                style={{
                  background: "rgba(255,59,48,0.08)",
                  border: "1px solid rgba(255,59,48,0.18)",
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-red-500" />
                <span
                  className="text-xs font-bold"
                  style={{ color: "var(--live)" }}
                >
                  {liveCount} live
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span
              className="text-xs font-medium"
              style={{ color: "var(--text-4)" }}
            >
              {games.length} match{games.length !== 1 ? "es" : ""}
            </span>
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center transition-transform duration-300"
              style={{
                background: "var(--surface-2)",
                transform: collapsed ? "rotate(180deg)" : "rotate(0deg)",
              }}
            >
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                <path
                  d="M1 1L5 5L9 1"
                  stroke="var(--text-3)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </button>

        {/* Status strip */}
        <div className="flex gap-3 px-4 pb-2">
          {liveCount > 0 && (
            <span className="text-xs font-medium" style={{ color: "var(--live)" }}>
              {liveCount} live
            </span>
          )}
          {finishedCount > 0 && (
            <span className="text-xs" style={{ color: "var(--text-4)" }}>
              {finishedCount} finished
            </span>
          )}
          {scheduledCount > 0 && (
            <span className="text-xs" style={{ color: "var(--accent)" }}>
              {scheduledCount} upcoming
            </span>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "var(--border)", margin: "0 16px" }} />

        {/* Collapsed preview */}
        {collapsed && (
          <div className="px-4 py-2">
            {previewGames.map((game, i) => (
              <div
                key={game.id}
                className="flex items-center justify-between py-2"
                style={{
                  borderBottom: i < previewGames.length - 1
                    ? "1px solid var(--border)" : "none",
                }}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {game.homeTeam.logo?.startsWith("http") ? (
                    <img
                      src={game.homeTeam.logo}
                      className="w-5 h-5 object-contain"
                      alt=""
                    />
                  ) : (
                    <span className="text-sm">{game.homeTeam.logo}</span>
                  )}
                  <span
                    className="text-xs font-semibold truncate"
                    style={{ color: "var(--text-2)" }}
                  >
                    {game.homeTeam.shortName}
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3">
                  {game.status === "scheduled" ? (
                    <span
                      className="text-xs font-medium"
                      style={{ color: "var(--text-4)" }}
                    >
                      {game.minute}
                    </span>
                  ) : (
                    <span
                      className="text-xs font-bold tabular-nums"
                      style={{ color: "var(--text-1)" }}
                    >
                      {game.homeScore ?? 0} - {game.awayScore ?? 0}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                  <span
                    className="text-xs font-semibold truncate text-right"
                    style={{ color: "var(--text-2)" }}
                  >
                    {game.awayTeam.shortName}
                  </span>
                  {game.awayTeam.logo?.startsWith("http") ? (
                    <img
                      src={game.awayTeam.logo}
                      className="w-5 h-5 object-contain"
                      alt=""
                    />
                  ) : (
                    <span className="text-sm">{game.awayTeam.logo}</span>
                  )}
                </div>
              </div>
            ))}
            {games.length > 2 && (
              <p
                className="text-xs text-center pt-2"
                style={{ color: "var(--text-4)" }}
              >
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