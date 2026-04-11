import { useState } from "react";
import useUserStore from "../store/userStore";

function TeamLogo({ logo, name }) {
  const isUrl = logo?.startsWith("http");
  const isEmoji = !isUrl && logo && [...logo].length <= 2;

  const getColor = (str = "") => {
    const colors = [
      ["#6366f1", "#4f46e5"],
      ["#ec4899", "#db2777"],
      ["#14b8a6", "#0d9488"],
      ["#f59e0b", "#d97706"],
      ["#3b82f6", "#2563eb"],
      ["#10b981", "#059669"],
      ["#ef4444", "#dc2626"],
      ["#8b5cf6", "#7c3aed"],
    ];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const [bg] = getColor(name);
  const initials = name
    ?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "??";

  if (isUrl) {
    return (
      <div className="w-10 h-10 rounded-xl glass-strong flex items-center justify-center flex-shrink-0 overflow-hidden p-1">
        <img
          src={logo}
          alt={name}
          className="w-full h-full object-contain"
          onError={(e) => {
            e.target.style.display = "none";
            e.target.parentElement.innerHTML =
              `<span style="font-size:10px;font-weight:800;color:${bg}">${initials}</span>`;
          }}
        />
      </div>
    );
  }

  if (isEmoji) {
    return (
      <div className="w-10 h-10 rounded-xl glass-strong flex items-center justify-center flex-shrink-0">
        <span className="text-lg">{logo}</span>
      </div>
    );
  }

  return (
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{
        background: `linear-gradient(135deg, ${bg}25, ${bg}10)`,
        border: `1px solid ${bg}40`,
      }}
    >
      <span className="text-xs font-black" style={{ color: bg }}>
        {initials}
      </span>
    </div>
  );
}

function ScoreDisplay({ homeScore, awayScore, isFinished, isScheduled }) {
  const isStringScore =
    typeof homeScore === "string" || typeof awayScore === "string";

  if (isScheduled) {
    return (
      <span className="text-xs font-semibold text-white/25 uppercase tracking-widest">
        vs
      </span>
    );
  }

  if (isStringScore) {
    return (
      <div className="flex flex-col items-center gap-1 w-32">
        <div className="w-full glass-strong rounded-lg px-2 py-1 text-center">
          <p className="text-xs font-bold text-white tabular-nums">
            {homeScore ?? "Yet to bat"}
          </p>
        </div>
        <span className="text-xs text-white/20">vs</span>
        <div className="w-full glass-strong rounded-lg px-2 py-1 text-center">
          <p className="text-xs font-bold text-white tabular-nums">
            {awayScore ?? "Yet to bat"}
          </p>
        </div>
        {isFinished && (
          <span className="text-xs text-white/20">Full Time</span>
        )}
      </div>
    );
  }

  const homeWin = !isFinished && homeScore > awayScore;
  const awayWin = !isFinished && awayScore > homeScore;

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="flex items-center gap-2">
        <span className={`text-2xl font-black tabular-nums tracking-tight
          ${homeWin ? "score-glow text-white" : "text-white/40"}`}>
          {homeScore ?? 0}
        </span>
        <span className="text-white/15 text-sm">—</span>
        <span className={`text-2xl font-black tabular-nums tracking-tight
          ${awayWin ? "score-glow text-white" : "text-white/40"}`}>
          {awayScore ?? 0}
        </span>
      </div>
      {isFinished && (
        <span className="text-xs text-white/20">FT</span>
      )}
    </div>
  );
}

function StatusBadge({ status, minute }) {
  if (status === "live") return (
    <div className="flex items-center gap-1 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
      <div className="relative flex items-center justify-center w-1.5 h-1.5">
        <span className="live-ring absolute inline-flex w-1.5 h-1.5 rounded-full bg-red-400" />
        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
      </div>
      <span className="text-xs font-bold text-red-400 tabular-nums">{minute}</span>
    </div>
  );
  if (status === "finished") return (
    <span className="text-xs font-semibold text-white/20 bg-white/5 px-2 py-0.5 rounded-full">
      FT
    </span>
  );
  return (
    <span className="text-xs font-semibold text-blue-400/60 bg-blue-500/8 px-2 py-0.5 rounded-full">
      {minute}
    </span>
  );
}

function FavButton({ teamId }) {
  const isFav = useUserStore((s) => s.isFavorite(teamId));
  const toggle = useUserStore((s) => s.toggleFavorite);

  return (
    <button
      onClick={(e) => { e.stopPropagation(); toggle(teamId); }}
      className="transition-all duration-200 hover:scale-110 active:scale-90 p-0.5"
    >
      <span className={`text-xs transition-all duration-200 ${
        isFav ? "opacity-100" : "opacity-20 hover:opacity-50"
      }`}>
        ⭐
      </span>
    </button>
  );
}

export default function MatchCard({
  game,
  index = 0,
  highlighted = false,
  showLeague = true,
  onPress,
}) {
  const [pressed, setPressed] = useState(false);
  const isFinished = game.status === "finished";
  const isScheduled = game.status === "scheduled";

  return (
    <div
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onClick={() => onPress?.(game)}
      style={{ animationDelay: `${index * 40}ms` }}
      className={`glass-card card-hover rounded-xl px-3 py-2.5 cursor-pointer
        ${pressed ? "scale-[0.99] opacity-80" : ""}
        ${highlighted ? "ring-2 ring-violet-500/70" : ""}
        transition-all duration-150
      `}
    >
      {/* League row */}
      {showLeague && (
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 flex-1 min-w-0 mr-2">
            <span className="text-sm flex-shrink-0">{game.leagueLogo}</span>
            <span className="text-xs text-white/30 font-semibold uppercase tracking-widest truncate">
              {game.league}
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <FavButton teamId={game.homeTeam.name} />
            <StatusBadge status={game.status} minute={game.minute} />
          </div>
        </div>
      )}

      {/* Teams + Score */}
      <div className="flex items-center gap-2">

        {/* Home */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <TeamLogo logo={game.homeTeam.logo} name={game.homeTeam.name} />
          <p className="text-sm font-semibold text-white/85 leading-tight truncate">
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
          <p className="text-sm font-semibold text-white/85 leading-tight truncate text-right">
            {game.awayTeam.shortName || game.awayTeam.name}
          </p>
          <TeamLogo logo={game.awayTeam.logo} name={game.awayTeam.name} />
        </div>

      </div>

      {/* Status row when grouped */}
      {!showLeague && (
        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-white/5">
          <FavButton teamId={game.homeTeam.name} />
          {game.status === "live" && (
            <StatusBadge status={game.status} minute={game.minute} />
          )}
          {game.status === "scheduled" && (
            <span className="text-xs text-blue-400/60">{game.minute}</span>
          )}
          {game.status === "finished" && (
            <span className="text-xs text-white/20">FT</span>
          )}
        </div>
      )}

      {/* Events */}
      {game.events?.length > 0 && (
        <div className="mt-2 pt-2 border-t border-white/5 flex flex-wrap gap-1.5">
          {game.events.slice(0, 3).map((e, i) => (
            <span key={i} className="text-xs text-white/25 bg-white/4 px-2 py-0.5 rounded-full">
              ⚽ {e.minute} {e.player}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}