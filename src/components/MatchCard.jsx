import { useState } from "react";
import useUserStore from "../store/userStore";

function TeamLogo({ logo, name }) {
  const isUrl = logo?.startsWith("http");
  const isEmoji = !isUrl && logo && [...logo].length <= 2;

  const getColor = (str = "") => {
    const colors = [
      "#6366f1", "#ec4899", "#14b8a6", "#f59e0b",
      "#3b82f6", "#10b981", "#ef4444", "#8b5cf6",
    ];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const color = getColor(name);
  const initials = name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "??";

  if (isUrl) {
    return (
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden p-1"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
      >
        <img
          src={logo}
          alt={name}
          className="w-full h-full object-contain"
          onError={(e) => {
            e.target.style.display = "none";
            e.target.parentElement.innerHTML =
              `<span style="font-size:10px;font-weight:800;color:${color}">${initials}</span>`;
          }}
        />
      </div>
    );
  }

  if (isEmoji) {
    return (
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
      >
        <span className="text-base">{logo}</span>
      </div>
    );
  }

  return (
    <div
      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
      style={{ background: `${color}18`, border: `1px solid ${color}30` }}
    >
      <span className="text-xs font-bold" style={{ color }}>{initials}</span>
    </div>
  );
}

function ScoreDisplay({ homeScore, awayScore, isFinished, isScheduled }) {
  const isStringScore =
    typeof homeScore === "string" || typeof awayScore === "string";

  if (isScheduled) {
    return (
      <span
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: "var(--text-4)" }}
      >
        vs
      </span>
    );
  }

  if (isStringScore) {
    return (
      <div className="flex flex-col items-center gap-1 w-32">
        <div
          className="w-full rounded-lg px-2 py-1 text-center"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
        >
          <p className="text-xs font-bold tabular-nums" style={{ color: "var(--text-1)" }}>
            {homeScore ?? "Yet to bat"}
          </p>
        </div>
        <span className="text-xs" style={{ color: "var(--text-4)" }}>vs</span>
        <div
          className="w-full rounded-lg px-2 py-1 text-center"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
        >
          <p className="text-xs font-bold tabular-nums" style={{ color: "var(--text-1)" }}>
            {awayScore ?? "Yet to bat"}
          </p>
        </div>
        {isFinished && (
          <span className="text-xs" style={{ color: "var(--text-4)" }}>Full Time</span>
        )}
      </div>
    );
  }

  const homeWin = isFinished && homeScore > awayScore;
  const awayWin = isFinished && awayScore > homeScore;

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="flex items-center gap-2">
        <span
          className="text-lg font-black tabular-nums tracking-tight"
          style={{ color: homeWin ? "var(--text-1)" : "var(--text-4)" }}
        >
          {homeScore ?? 0}
        </span>
        <span className="text-sm" style={{ color: "var(--text-4)" }}>—</span>
        <span
          className="text-lg font-black tabular-nums tracking-tight"
          style={{ color: awayWin ? "var(--text-1)" : "var(--text-4)" }}
        >
          {awayScore ?? 0}
        </span>
      </div>
      {isFinished && (
        <span className="text-xs" style={{ color: "var(--text-4)" }}>FT</span>
      )}
    </div>
  );
}

function StatusBadge({ status, minute }) {
  if (status === "live") return (
    <div
      className="flex items-center gap-1 px-2 py-0.5 rounded-full"
      style={{
        background: "rgba(255,59,48,0.1)",
        border: "1px solid rgba(255,59,48,0.2)",
      }}
    >
      <div className="relative flex items-center justify-center w-1.5 h-1.5">
        <span className="live-ring absolute inline-flex w-1.5 h-1.5 rounded-full bg-red-500" />
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
      </div>
      <span className="text-xs font-bold tabular-nums" style={{ color: "var(--live)" }}>
        {minute}
      </span>
    </div>
  );

  if (status === "finished") return (
    <span
      className="text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ color: "var(--text-4)", background: "var(--surface-2)" }}
    >
      FT
    </span>
  );

  return (
    <span
      className="text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ color: "var(--accent)", background: "rgba(0,122,255,0.08)" }}
    >
      {minute}
    </span>
  );
}

function FavButton({ game, onShowPicker }) {
  const { isFavorite } = useUserStore();
  const isFav = isFavorite(game.homeTeam?.name) || isFavorite(game.awayTeam?.name);

  return (
    <button
      onClick={(e) => { e.stopPropagation(); onShowPicker?.(); }}
      className="transition-all duration-200 active:scale-90 p-0.5"
    >
      <span style={{ fontSize: 12, opacity: isFav ? 1 : 0.25 }}>⭐</span>
    </button>
  );
}

function TeamFavPicker({ game, onClose }) {
  const { isFavorite, toggleFavoriteTeam } = useUserStore();

  const teams = [
    {
      id: game.homeTeam?.id || game.homeTeam?.name,
      name: game.homeTeam?.name,
      logo: game.homeTeam?.logo,
      league: game.league,
      leagueId: game.leagueId,
    },
    {
      id: game.awayTeam?.id || game.awayTeam?.name,
      name: game.awayTeam?.name,
      logo: game.awayTeam?.logo,
      league: game.league,
      leagueId: game.leagueId,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-xl rounded-t-3xl p-6 pb-10"
        style={{
          background: "var(--surface)",
          borderTop: "1px solid var(--border)",
          boxShadow: "var(--shadow-lg)",
        }}
        onClick={e => e.stopPropagation()}
      >
        <div
          className="w-10 h-1 rounded-full mx-auto mb-5"
          style={{ background: "var(--surface-3)" }}
        />
        <p
          className="text-xs font-bold text-center mb-4 uppercase tracking-widest"
          style={{ color: "var(--text-3)" }}
        >
          Follow Team
        </p>
        <div className="space-y-3">
          {teams.map(team => {
            const fav = isFavorite(team.id) || isFavorite(team.name);
            return (
              <button
                key={team.id}
                onClick={() => { toggleFavoriteTeam(team); onClose(); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all"
                style={{
                  background: fav ? "rgba(0,122,255,0.06)" : "var(--surface-2)",
                  border: `1px solid ${fav ? "rgba(0,122,255,0.2)" : "var(--border)"}`,
                }}
              >
                {team.logo?.startsWith("http") ? (
                  <img src={team.logo} alt="" className="w-10 h-10 object-contain flex-shrink-0" />
                ) : (
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "var(--surface-3)" }}
                  >
                    <span
                      className="text-xs font-black"
                      style={{ color: "var(--text-3)" }}
                    >
                      {team.name?.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1 text-left">
                  <p
                    className="text-sm font-bold"
                    style={{ color: "var(--text-1)" }}
                  >
                    {team.name}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-3)" }}>
                    {team.league}
                  </p>
                </div>
                <span style={{ fontSize: 18, opacity: fav ? 1 : 0.2 }}>
                  {fav ? "⭐" : "☆"}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function MatchCard({
  game,
  index = 0,
  highlighted = false,
  showLeague = true,
  onPress,
}) {
  const [showPicker, setShowPicker] = useState(false);
  const isFinished = game.status === "finished";
  const isScheduled = game.status === "scheduled";

  return (
    <div
      onClick={() => onPress?.(game)}
      style={{
        animationDelay: `${index * 40}ms`,
        background: "var(--surface)",
        border: `1px solid ${highlighted ? "var(--accent)" : "var(--border)"}`,
        borderRadius: 12,
        boxShadow: "var(--shadow-sm)",
        cursor: "pointer",
        transition: "transform 0.15s ease",
      }}
      className={`animate-card px-3 py-2.5 active:scale-[0.988]`}
    >
      {/* League row */}
      {showLeague && (
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 flex-1 min-w-0 mr-2">
            <span className="text-sm flex-shrink-0">{game.leagueLogo}</span>
            <span
              className="text-xs font-semibold uppercase tracking-widest truncate"
              style={{ color: "var(--text-4)" }}
            >
              {game.league}
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <FavButton game={game} onShowPicker={() => setShowPicker(true)} />
            <StatusBadge status={game.status} minute={game.minute} />
          </div>
        </div>
      )}

      {/* Teams + Score */}
      <div className="flex items-center gap-2">
        {/* Home */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <TeamLogo logo={game.homeTeam.logo} name={game.homeTeam.name} />
          <p
            className="text-sm font-semibold leading-tight truncate"
            style={{ color: "var(--text-1)" }}
          >
            {game.homeTeam.shortName || game.homeTeam.name}
          </p>
        </div>

        {/* Score */}
        <div className="flex items-center justify-center flex-shrink-0 w-24">
          <ScoreDisplay
            homeScore={game.homeScore}
            awayScore={game.awayScore}
            isFinished={isFinished}
            isScheduled={isScheduled}
          />
        </div>

        {/* Away */}
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <p
            className="text-sm font-semibold leading-tight truncate text-right"
            style={{ color: "var(--text-1)" }}
          >
            {game.awayTeam.shortName || game.awayTeam.name}
          </p>
          <TeamLogo logo={game.awayTeam.logo} name={game.awayTeam.name} />
        </div>
      </div>

      {/* Status row when grouped */}
      {!showLeague && (
        <div
          className="flex items-center justify-between mt-2 pt-1.5"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <FavButton game={game} onShowPicker={() => setShowPicker(true)} />
          <StatusBadge status={game.status} minute={game.minute} />
        </div>
      )}

      {/* Events */}
      {game.events?.length > 0 && (
        <div
          className="mt-2 pt-2 flex flex-wrap gap-1.5"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          {game.events.slice(0, 3).map((e, i) => (
            <span
              key={i}
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ color: "var(--text-4)", background: "var(--surface-2)" }}
            >
              ⚽ {e.minute} {e.player}
            </span>
          ))}
        </div>
      )}

      {showPicker && (
        <TeamFavPicker game={game} onClose={() => setShowPicker(false)} />
      )}
    </div>
  );
}