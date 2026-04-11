import { useState, useEffect, useRef } from "react";
import { X, MapPin, Calendar, User, RefreshCw } from "lucide-react";

async function fetchMatchDetails(game) {
  try {
    const id = game.id?.replace("espn-soccer-", "");
    if (!id || game.sport !== "soccer") return null;

    const res = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/soccer/all/summary?event=${id}`
    );
    if (!res.ok) return null;
    const data = await res.json();

    // ── Home team ID for home/away detection ─────────
    const homeTeamId = data.header?.competitions?.[0]?.competitors
      ?.find(c => c.homeAway === "home")?.team?.id;

    // ── Events from keyEvents ─────────────────────────
    const events = [];
    const keyEvents = data.keyEvents || [];

    keyEvents.forEach((play) => {
      const min = play.clock?.displayValue || "";
      const minuteNum = parseInt(min) || 0;
      const teamId = play.team?.id;
      const team = teamId === homeTeamId ? "home" : "away";
      const typeText = play.type?.type?.toLowerCase() || "";
      const typeLabel = play.type?.text?.toLowerCase() || "";

      if (play.scoringPlay) {
        const assistMatch = play.text?.match(/assisted by ([^.]+)/i);

        // Clean up goal type label
        const goalType = play.type?.text || "";
        const cleanGoalType = goalType
          .replace(/^penalty\s*-\s*/i, "Penalty ")
          .replace(/^goal\s*-\s*/i, "")
          .replace(
            new RegExp(
              (play.participants?.[0]?.athlete?.displayName || "") + "\\s*",
              "i"
            ),
            ""
          )
          .trim();

        events.push({
          type: "goal",
          minute: min,
          minuteNum,
          team,
          player: play.participants?.[0]?.athlete?.displayName || "Unknown",
          assist: assistMatch?.[1]?.trim() || null,
          goalType: cleanGoalType || null,
        });
      } else if (typeText.includes("yellow") || typeLabel.includes("yellow")) {
        events.push({
          type: "yellowcard",
          minute: min,
          minuteNum,
          team,
          player: play.participants?.[0]?.athlete?.displayName || "Unknown",
        });
      } else if (typeText.includes("red") || typeLabel.includes("red")) {
        events.push({
          type: "redcard",
          minute: min,
          minuteNum,
          team,
          player: play.participants?.[0]?.athlete?.displayName || "Unknown",
        });
      } else if (
        typeText.includes("substitution") ||
        typeLabel.includes("substitution")
      ) {
        events.push({
          type: "sub",
          minute: min,
          minuteNum,
          team,
          player: play.participants?.[0]?.athlete?.displayName || "Unknown",
          subFor: play.participants?.[1]?.athlete?.displayName || null,
        });
      }
    });

    events.sort((a, b) => a.minuteNum - b.minuteNum);

    // ── Stats ─────────────────────────────────────────
    const homeStats = data.boxscore?.teams?.[0]?.statistics || [];
    const awayStats = data.boxscore?.teams?.[1]?.statistics || [];

    const getStat = (stats, name) => {
      const s = stats.find((s) => s.name === name);
      return s
        ? parseInt(s.displayValue) || parseFloat(s.displayValue) || 0
        : 0;
    };

    const stats = {
      possession: {
        home: getStat(homeStats, "possessionPct") || 50,
        away: getStat(awayStats, "possessionPct") || 50,
      },
      shots: {
        home:
          getStat(homeStats, "totalShots") || getStat(homeStats, "shots"),
        away:
          getStat(awayStats, "totalShots") || getStat(awayStats, "shots"),
      },
      shotsOnTarget: {
        home: getStat(homeStats, "shotsOnTarget"),
        away: getStat(awayStats, "shotsOnTarget"),
      },
      corners: {
        home: getStat(homeStats, "cornerKicks"),
        away: getStat(awayStats, "cornerKicks"),
      },
      fouls: {
        home: getStat(homeStats, "foulsCommitted"),
        away: getStat(awayStats, "foulsCommitted"),
      },
      yellowCards: {
        home: getStat(homeStats, "yellowCards"),
        away: getStat(awayStats, "yellowCards"),
      },
      offsides: {
        home: getStat(homeStats, "offsides"),
        away: getStat(awayStats, "offsides"),
      },
    };

    const venue = data.gameInfo?.venue?.fullName || null;
    const referee =
      data.gameInfo?.officials?.[0]?.displayName || null;

    return { events, stats, venue, referee };
  } catch (err) {
    console.warn("Failed to fetch match details:", err.message);
    return null;
  }
}

// ── Team Logo ──────────────────────────────────────────

function TeamLogo({ logo, name, size = "lg" }) {
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
    for (let i = 0; i < str.length; i++)
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };
  const [bg] = getColor(name);
  const initials =
    name
      ?.split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "??";
  const isUrl = logo?.startsWith("http");
  const sizeClass =
    size === "lg" ? "w-20 h-20 rounded-2xl" : "w-12 h-12 rounded-xl";
  const imgSize = size === "lg" ? "w-16 h-16" : "w-9 h-9";
  const fontSize = size === "lg" ? "16px" : "11px";

  if (isUrl)
    return (
      <div
        className={`${sizeClass} glass-strong flex items-center justify-center flex-shrink-0 overflow-hidden p-2`}
      >
        <img
          src={logo}
          alt={name}
          className={`${imgSize} object-contain`}
          onError={(e) => {
            e.target.style.display = "none";
            e.target.parentElement.innerHTML = `<span style="font-size:${fontSize};font-weight:800;color:${bg}">${initials}</span>`;
          }}
        />
      </div>
    );

  return (
    <div
      className={`${sizeClass} flex items-center justify-center flex-shrink-0`}
      style={{
        background: `linear-gradient(135deg, ${bg}25, ${bg}10)`,
        border: `1px solid ${bg}40`,
      }}
    >
      <span style={{ color: bg, fontSize, fontWeight: 800 }}>{initials}</span>
    </div>
  );
}

// ── Stat Bar ───────────────────────────────────────────

function StatBar({ label, home, away, homeColor = "#8b5cf6" }) {
  const total = (home || 0) + (away || 0);
  const homePct = total > 0 ? (home / total) * 100 : 50;
  const awayPct = 100 - homePct;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-bold text-white">{home ?? "—"}</span>
        <span className="text-xs text-white/40 font-medium">{label}</span>
        <span className="text-sm font-bold text-white">{away ?? "—"}</span>
      </div>
      <div className="flex h-1.5 rounded-full overflow-hidden gap-0.5">
        <div
          className="rounded-full transition-all duration-700"
          style={{ width: `${homePct}%`, background: homeColor, opacity: 0.8 }}
        />
        <div
          className="rounded-full transition-all duration-700"
          style={{
            width: `${awayPct}%`,
            background: "rgba(255,255,255,0.15)",
          }}
        />
      </div>
    </div>
  );
}

// ── Goal Progression Chart ─────────────────────────────

function GoalProgressionChart({
  events,
  homeTeam,
  awayTeam,
  isLive,
  currentMinute,
}) {
  const goals = events.filter((e) => e.type === "goal");
  if (!goals.length) return null;

  const maxMin = isLive ? Math.max(90, currentMinute || 90) : 90;
  let homeScore = 0;
  let awayScore = 0;

  const points = [{ min: 0, home: 0, away: 0 }];
  goals.forEach((g) => {
    if (g.team === "home") homeScore++;
    else awayScore++;
    points.push({
      min: g.minuteNum,
      home: homeScore,
      away: awayScore,
      event: g,
    });
  });
  points.push({ min: maxMin, home: homeScore, away: awayScore });

  const maxScore = Math.max(homeScore, awayScore, 1);
  const chartH = 80;
  const chartW = 280;
  const padding = 10;

  const x = (min) => (min / maxMin) * chartW;
  const y = (score) =>
    chartH - padding - (score / maxScore) * (chartH - padding * 2);
  const baseY = y(0);

  const homePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${x(p.min)} ${y(p.home)}`)
    .join(" ");

  const awayPath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${x(p.min)} ${y(p.away)}`)
    .join(" ");

  return (
    <div className="glass-card rounded-2xl p-4 mb-4">
      <p className="text-xs text-white/30 font-semibold uppercase tracking-widest mb-3">
        Score progression
      </p>

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ background: "#8b5cf6" }}
          />
          <span className="text-xs text-white/60 font-medium">
            {homeTeam.shortName || homeTeam.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/60 font-medium">
            {awayTeam.shortName || awayTeam.name}
          </span>
          <div
            className="w-3 h-3 rounded-full"
            style={{ background: "#06b6d4" }}
          />
        </div>
      </div>

      <svg
        width="100%"
        viewBox={`0 0 ${chartW} ${chartH + 20}`}
        style={{ overflow: "visible" }}
      >
        {[0, 45, 90].map((min) => (
          <g key={min}>
            <line
              x1={x(min)} y1={0}
              x2={x(min)} y2={chartH}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="1"
            />
            <text
              x={x(min)} y={chartH + 14}
              textAnchor="middle"
              fill="rgba(255,255,255,0.2)"
              fontSize="10"
            >
              {min}'
            </text>
          </g>
        ))}

        {/* Home area fill */}
        <path
          d={`${homePath} L ${x(maxMin)} ${baseY} L ${x(0)} ${baseY} Z`}
          fill="#8b5cf6"
          fillOpacity="0.08"
        />
        {/* Away area fill */}
        <path
          d={`${awayPath} L ${x(maxMin)} ${baseY} L ${x(0)} ${baseY} Z`}
          fill="#06b6d4"
          fillOpacity="0.08"
        />
        {/* Home line */}
        <path
          d={homePath}
          fill="none"
          stroke="#8b5cf6"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Away line */}
        <path
          d={awayPath}
          fill="none"
          stroke="#06b6d4"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Goal dots */}
        {goals.map((g, i) => {
          const pt = points.find((p) => p.event === g);
          const score = g.team === "home" ? pt?.home || 0 : pt?.away || 0;
          return (
            <circle
              key={i}
              cx={x(g.minuteNum)}
              cy={y(score)}
              r="4"
              fill={g.team === "home" ? "#8b5cf6" : "#06b6d4"}
              stroke="rgba(7,10,18,0.8)"
              strokeWidth="1.5"
            />
          );
        })}

        {/* Live indicator */}
        {isLive && currentMinute && (
          <line
            x1={x(currentMinute)} y1={0}
            x2={x(currentMinute)} y2={chartH}
            stroke="rgba(239,68,68,0.5)"
            strokeWidth="1.5"
            strokeDasharray="3,3"
          />
        )}
      </svg>
    </div>
  );
}

// ── Timeline ───────────────────────────────────────────

function Timeline({ events, homeTeam, awayTeam, isLive, currentMinute }) {
  if (!events?.length)
    return (
      <div className="text-center py-12">
        <p className="text-4xl mb-3">📋</p>
        <p className="text-sm text-white/30 font-medium">
          No events recorded yet
        </p>
        <p className="text-xs text-white/15 mt-1">
          {isLive
            ? "Events will appear here as the match progresses"
            : "No events were recorded for this match"}
        </p>
      </div>
    );

  const typeIcon = (type) => {
    if (type === "goal") return "⚽";
    if (type === "yellowcard") return "🟨";
    if (type === "redcard") return "🟥";
    if (type === "sub") return "🔄";
    return "•";
  };

  const typeLabel = (e) => {
    if (e.type === "goal") {
      if (e.goalType) return e.goalType;
      if (e.assist) return `Assist: ${e.assist}`;
      return "Goal";
    }
    if (e.type === "yellowcard") return "Yellow card";
    if (e.type === "redcard") return "Red card";
    if (e.type === "sub")
      return e.subFor ? `On for ${e.subFor}` : "Substitution";
    return "";
  };

  const firstHalf = events.filter((e) => e.minuteNum <= 45);
  const secondHalf = events.filter((e) => e.minuteNum > 45);

  const renderEvents = (evts) =>
    evts.map((e, i) => {
      const isHome = e.team === "home";
      return (
        <div
          key={i}
          className={`flex items-center gap-2 ${
            isHome ? "flex-row" : "flex-row-reverse"
          }`}
        >
          <div className="glass-strong rounded-full px-2.5 py-1 flex-shrink-0 w-14 text-center">
            <span className="text-xs font-bold text-white/50 tabular-nums">
              {e.minute}
            </span>
          </div>
          <div
            className={`flex items-center gap-2 flex-1 glass-card rounded-xl px-3 py-2 ${
              isHome ? "" : "flex-row-reverse"
            }`}
          >
            <span className="text-base flex-shrink-0">
              {typeIcon(e.type)}
            </span>
            <div className={`flex-1 min-w-0 ${isHome ? "" : "text-right"}`}>
              <p className="text-sm font-semibold text-white truncate">
                {e.player}
              </p>
              <p className="text-xs text-white/35 truncate">
                {typeLabel(e)}
              </p>
            </div>
          </div>
          <div className="w-14 flex-shrink-0" />
        </div>
      );
    });

  return (
    <div className="space-y-4">
      {firstHalf.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2 px-1">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-white/25 font-semibold">
              First Half
            </span>
            <div className="h-px flex-1 bg-white/10" />
          </div>
          <div className="space-y-2">{renderEvents(firstHalf)}</div>
        </div>
      )}

      {secondHalf.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2 px-1">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-white/25 font-semibold">
              Second Half
            </span>
            <div className="h-px flex-1 bg-white/10" />
          </div>
          <div className="space-y-2">{renderEvents(secondHalf)}</div>
        </div>
      )}

      {isLive && (
        <div className="flex items-center gap-2 px-1">
          <div className="h-px flex-1 bg-white/10" />
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            <span className="text-xs text-red-400 font-semibold">
              {currentMinute}'
            </span>
          </div>
          <div className="h-px flex-1 bg-white/10" />
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────

export default function MatchDetail({ game, onClose }) {
  const [activeTab, setActiveTab] = useState("stats");
  const [visible, setVisible] = useState(false);
  const [details, setDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const pollRef = useRef(null);
  const timerRef = useRef(null);

  const isLive = game.status === "live";
  const isFinished = game.status === "finished";
  const isScheduled = game.status === "scheduled";
  const currentMinute = parseInt(game.minute) || 0;

  async function loadDetails() {
    const data = await fetchMatchDetails(game);
    if (data) {
      setDetails(data);
      setLastUpdated(Date.now());
      setSecondsAgo(0);
    }
    setLoadingDetails(false);
    setRefreshing(false);
  }

  useEffect(() => {
    setTimeout(() => setVisible(true), 10);
    loadDetails();

    if (isLive) {
      pollRef.current = setInterval(loadDetails, 30_000);
      timerRef.current = setInterval(() => {
        setSecondsAgo((s) => s + 1);
      }, 1000);
    }

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function handleRefresh() {
    setRefreshing(true);
    loadDetails();
  }

  function handleClose() {
    setVisible(false);
    if (pollRef.current) clearInterval(pollRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeout(onClose, 300);
  }

  const stats = details?.stats || {
    possession: { home: 50, away: 50 },
    shots: { home: 0, away: 0 },
    shotsOnTarget: { home: 0, away: 0 },
    corners: { home: 0, away: 0 },
    fouls: { home: 0, away: 0 },
    yellowCards: { home: 0, away: 0 },
    offsides: { home: 0, away: 0 },
  };

  const events = details?.events || game.events || [];
  const venue = details?.venue || game.venue || null;
  const referee = details?.referee || game.referee || null;
  const tabs = ["stats", "timeline", "info"];

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{
        background: "rgba(7, 10, 18, 0.98)",
        backdropFilter: "blur(30px)",
        transform: visible ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm">{game.leagueLogo}</span>
            <span className="text-xs text-white/40 font-semibold uppercase tracking-widest">
              {game.league}
            </span>
          </div>
          {isLive && (
            <div className="flex items-center gap-2 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              <span className="text-xs font-bold text-red-400">
                Live · {game.minute}
              </span>
              <span className="text-xs text-white/20">
                · updated {secondsAgo}s ago
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isLive && (
            <button
              onClick={handleRefresh}
              className={`w-9 h-9 glass-strong rounded-full flex items-center justify-center transition-all ${
                refreshing ? "opacity-50" : "hover:bg-white/10"
              }`}
            >
              <RefreshCw
                size={14}
                className={`text-white/50 ${refreshing ? "animate-spin" : ""}`}
              />
            </button>
          )}
          <button
            onClick={handleClose}
            className="w-9 h-9 glass-strong rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <X size={16} className="text-white/60" />
          </button>
        </div>
      </div>

      {/* Score hero */}
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex flex-col items-center gap-2 flex-1">
          <TeamLogo
            logo={game.homeTeam.logo}
            name={game.homeTeam.name}
            size="lg"
          />
          <p className="text-sm font-bold text-white text-center leading-tight px-2">
            {game.homeTeam.name}
          </p>
        </div>

        <div className="flex flex-col items-center gap-1.5 px-4">
          {isScheduled ? (
            <>
              <p className="text-xs text-white/30">Kick off</p>
              <p className="text-3xl font-black text-white">{game.minute}</p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <span
                  className={`text-5xl font-black tabular-nums ${
                    !isFinished && game.homeScore > game.awayScore
                      ? "text-white"
                      : "text-white/50"
                  }`}
                >
                  {game.homeScore ?? 0}
                </span>
                <span className="text-white/20 text-3xl">—</span>
                <span
                  className={`text-5xl font-black tabular-nums ${
                    !isFinished && game.awayScore > game.homeScore
                      ? "text-white"
                      : "text-white/50"
                  }`}
                >
                  {game.awayScore ?? 0}
                </span>
              </div>
              <span className="text-xs text-white/30 uppercase tracking-widest">
                {isFinished ? "Full Time" : isLive ? game.minute : ""}
              </span>
            </>
          )}
        </div>

        <div className="flex flex-col items-center gap-2 flex-1">
          <TeamLogo
            logo={game.awayTeam.logo}
            name={game.awayTeam.name}
            size="lg"
          />
          <p className="text-sm font-bold text-white text-center leading-tight px-2">
            {game.awayTeam.name}
          </p>
        </div>
      </div>

      {/* Goal scorers strip */}
      {events.filter((e) => e.type === "goal").length > 0 && (
        <div className="flex justify-between px-6 mb-2">
          <div className="flex flex-col gap-0.5">
            {events
              .filter((e) => e.type === "goal" && e.team === "home")
              .map((e, i) => (
                <span key={i} className="text-xs text-white/40">
                  ⚽ {e.minute} {e.player}
                </span>
              ))}
          </div>
          <div className="flex flex-col gap-0.5 items-end">
            {events
              .filter((e) => e.type === "goal" && e.team === "away")
              .map((e, i) => (
                <span key={i} className="text-xs text-white/40">
                  {e.player} {e.minute} ⚽
                </span>
              ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mx-4 mb-3 glass rounded-xl p-1">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all duration-200 ${
              activeTab === tab
                ? "bg-violet-600 text-white"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-4 pb-8">

        {/* Stats */}
        {activeTab === "stats" &&
          (loadingDetails ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="glass rounded-xl h-10 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <>
              <GoalProgressionChart
                events={events}
                homeTeam={game.homeTeam}
                awayTeam={game.awayTeam}
                isLive={isLive}
                currentMinute={currentMinute}
              />
              <div className="glass-card rounded-2xl p-4">
                <StatBar
                  label="Possession %"
                  home={stats.possession.home}
                  away={stats.possession.away}
                />
                <StatBar
                  label="Shots"
                  home={stats.shots.home}
                  away={stats.shots.away}
                />
                <StatBar
                  label="Shots on Target"
                  home={stats.shotsOnTarget.home}
                  away={stats.shotsOnTarget.away}
                />
                <StatBar
                  label="Corners"
                  home={stats.corners.home}
                  away={stats.corners.away}
                />
                <StatBar
                  label="Fouls"
                  home={stats.fouls.home}
                  away={stats.fouls.away}
                  homeColor="#ef4444"
                />
                <StatBar
                  label="Yellow Cards"
                  home={stats.yellowCards.home}
                  away={stats.yellowCards.away}
                  homeColor="#f59e0b"
                />
                <StatBar
                  label="Offsides"
                  home={stats.offsides.home}
                  away={stats.offsides.away}
                  homeColor="#14b8a6"
                />
                {isScheduled && (
                  <p className="text-center text-xs text-white/20 mt-4">
                    Stats available once match starts
                  </p>
                )}
              </div>
            </>
          ))}

        {/* Timeline */}
        {activeTab === "timeline" &&
          (loadingDetails ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="glass rounded-xl h-14 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <Timeline
              events={events}
              homeTeam={game.homeTeam}
              awayTeam={game.awayTeam}
              isLive={isLive}
              currentMinute={currentMinute}
            />
          ))}

        {/* Info */}
        {activeTab === "info" && (
          <div className="space-y-3">
            <div className="glass-card rounded-2xl p-4 space-y-4">
              {venue && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 glass-strong rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin size={14} className="text-white/40" />
                  </div>
                  <div>
                    <p className="text-xs text-white/30 font-medium">Venue</p>
                    <p className="text-sm font-semibold text-white">{venue}</p>
                  </div>
                </div>
              )}
              {game.minute && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 glass-strong rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar size={14} className="text-white/40" />
                  </div>
                  <div>
                    <p className="text-xs text-white/30 font-medium">
                      {isScheduled
                        ? "Kick off"
                        : isLive
                        ? "Current minute"
                        : "Status"}
                    </p>
                    <p className="text-sm font-semibold text-white">
                      {game.minute}
                    </p>
                  </div>
                </div>
              )}
              {referee && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 glass-strong rounded-lg flex items-center justify-center flex-shrink-0">
                    <User size={14} className="text-white/40" />
                  </div>
                  <div>
                    <p className="text-xs text-white/30 font-medium">
                      Referee
                    </p>
                    <p className="text-sm font-semibold text-white">
                      {referee}
                    </p>
                  </div>
                </div>
              )}
              {!venue && !referee && (
                <p className="text-center text-xs text-white/20 py-4">
                  Match info not available
                </p>
              )}
            </div>

            <div className="glass-card rounded-2xl p-4">
              <p className="text-xs text-white/30 font-semibold uppercase tracking-widest mb-3">
                Teams
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TeamLogo
                    logo={game.homeTeam.logo}
                    name={game.homeTeam.name}
                    size="sm"
                  />
                  <div>
                    <p className="text-sm font-bold text-white">
                      {game.homeTeam.name}
                    </p>
                    <p className="text-xs text-white/30">Home</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">
                      {game.awayTeam.name}
                    </p>
                    <p className="text-xs text-white/30">Away</p>
                  </div>
                  <TeamLogo
                    logo={game.awayTeam.logo}
                    name={game.awayTeam.name}
                    size="sm"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}