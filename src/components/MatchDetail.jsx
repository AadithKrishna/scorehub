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

    const competitors = data.header?.competitions?.[0]?.competitors || [];
    const homeComp = competitors.find(c => c.homeAway === "home");
    const awayComp = competitors.find(c => c.homeAway === "away");
    const homeTeamId = homeComp?.team?.id;
    const awayTeamId = awayComp?.team?.id;

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
        const goalType = play.type?.text || "";
        const cleanGoalType = goalType
          .replace(/^penalty\s*-\s*/i, "Penalty ")
          .replace(/^goal\s*-\s*/i, "")
          .replace(new RegExp((play.participants?.[0]?.athlete?.displayName || "") + "\\s*", "i"), "")
          .trim();
        events.push({
          type: "goal", minute: min, minuteNum, team,
          player: play.participants?.[0]?.athlete?.displayName || "Unknown",
          assist: assistMatch?.[1]?.trim() || null,
          goalType: cleanGoalType || null,
          fieldPositionX: play.fieldPositionX || 0,
          fieldPositionY: play.fieldPositionY || 0,
          originalText: play.text || "",
        });
      } else if (typeText.includes("yellow") || typeLabel.includes("yellow")) {
        events.push({ type: "yellowcard", minute: min, minuteNum, team, player: play.participants?.[0]?.athlete?.displayName || "Unknown" });
      } else if (typeText.includes("red") || typeLabel.includes("red")) {
        events.push({ type: "redcard", minute: min, minuteNum, team, player: play.participants?.[0]?.athlete?.displayName || "Unknown" });
      } else if (typeText.includes("substitution") || typeLabel.includes("substitution")) {
        events.push({ type: "sub", minute: min, minuteNum, team, player: play.participants?.[0]?.athlete?.displayName || "Unknown", subFor: play.participants?.[1]?.athlete?.displayName || null });
      }
    });
    events.sort((a, b) => a.minuteNum - b.minuteNum);

    const homeStats = data.boxscore?.teams?.[0]?.statistics || [];
    const awayStats = data.boxscore?.teams?.[1]?.statistics || [];
    const getStat = (stats, name) => {
      const s = stats.find(s => s.name === name);
      return s ? parseInt(s.displayValue) || parseFloat(s.displayValue) || 0 : 0;
    };
    const stats = {
      possession:    { home: getStat(homeStats, "possessionPct") || 50, away: getStat(awayStats, "possessionPct") || 50 },
      shots:         { home: getStat(homeStats, "totalShots") || getStat(homeStats, "shots"), away: getStat(awayStats, "totalShots") || getStat(awayStats, "shots") },
      shotsOnTarget: { home: getStat(homeStats, "shotsOnTarget"), away: getStat(awayStats, "shotsOnTarget") },
      corners:       { home: getStat(homeStats, "cornerKicks"), away: getStat(awayStats, "cornerKicks") },
      fouls:         { home: getStat(homeStats, "foulsCommitted"), away: getStat(awayStats, "foulsCommitted") },
      yellowCards:   { home: getStat(homeStats, "yellowCards"), away: getStat(awayStats, "yellowCards") },
      offsides:      { home: getStat(homeStats, "offsides"), away: getStat(awayStats, "offsides") },
    };

    const leagueSlug = game.league === "Premier League" ? "eng.1" :
      game.league === "La Liga" ? "esp.1" :
      game.league === "Bundesliga" ? "ger.1" :
      game.league === "Serie A" ? "ita.1" :
      game.league === "Ligue 1" ? "fra.1" :
      game.league === "Champions League" ? "uefa.champions" :
      game.league === "Europa League" ? "uefa.europa" : "eng.1";

    const [homeRoster, awayRoster] = await Promise.allSettled([
      fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueSlug}/teams/${homeTeamId}/roster`).then(r => r.json()),
      fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueSlug}/teams/${awayTeamId}/roster`).then(r => r.json()),
    ]);

    const extractLeaders = (rosterData) => {
      if (!rosterData?.athletes) return { goals: [], assists: [] };
      const players = rosterData.athletes.map(p => {
        const off = p.statistics?.splits?.categories?.find(c => c.name === "offensive")?.stats || [];
        const gen = p.statistics?.splits?.categories?.find(c => c.name === "general")?.stats || [];
        return {
          name: p.displayName,
          goals:   off.find(s => s.name === "totalGoals")?.value || 0,
          assists: off.find(s => s.name === "goalAssists")?.value || 0,
          apps:    gen.find(s => s.name === "appearances")?.value || 0,
        };
      });
      return {
        goals:   players.filter(p => p.goals > 0).sort((a, b) => b.goals - a.goals).slice(0, 3),
        assists: players.filter(p => p.assists > 0).sort((a, b) => b.assists - a.assists).slice(0, 3),
      };
    };

    const leaders = [
      { teamId: homeTeamId, teamName: homeComp?.team?.displayName, teamLogo: homeComp?.team?.logo, ...extractLeaders(homeRoster.status === "fulfilled" ? homeRoster.value : null) },
      { teamId: awayTeamId, teamName: awayComp?.team?.displayName, teamLogo: awayComp?.team?.logo, ...extractLeaders(awayRoster.status === "fulfilled" ? awayRoster.value : null) },
    ];

    const h2hTeamData = data.headToHeadGames?.[0];
    const h2hTeamId = h2hTeamData?.team?.id;
    const h2hEvents = (h2hTeamData?.events || [])
      .filter(e => {
        const name = e.competitionName || "";
        return name.includes("Premier") || name.includes("La Liga") ||
          name.includes("Bundesliga") || name.includes("Serie") ||
          name.includes("Ligue") || name.includes("Champions") ||
          name.includes("Europa") || name.includes("Cup");
      })
      .sort((a, b) => new Date(b.gameDate) - new Date(a.gameDate))
      .slice(0, 8)
      .map(e => ({ ...e, h2hTeamWon: e.gameResult === "W", h2hTeamLost: e.gameResult === "L", isDraw: e.gameResult === "D", h2hTeamId }));

    const standingsEntries = data.standings?.groups?.[0]?.standings?.entries || [];
    const odds = data.odds?.[0] || null;
    const venue = data.gameInfo?.venue?.fullName || null;
    const referee = data.gameInfo?.officials?.[0]?.displayName || null;

    return { events, stats, leaders, h2h: h2hEvents, standingsEntries, odds, venue, referee, homeTeamId, awayTeamId };
  } catch (err) {
    console.warn("Failed to fetch match details:", err.message);
    return null;
  }
}

// ── Team Logo ──────────────────────────────────────────

function TeamLogo({ logo, name, size = "lg" }) {
  const getColor = (str = "") => {
    const colors = ["#6366f1","#ec4899","#14b8a6","#f59e0b","#3b82f6","#10b981","#ef4444","#8b5cf6"];
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };
  const color = getColor(name);
  const initials = name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "??";
  const isUrl = logo?.startsWith("http");
  const sizes = {
    lg: { px: 80, pad: 12, font: "16px" },
    sm: { px: 48, pad: 8,  font: "11px" },
    xs: { px: 32, pad: 6,  font: "9px"  },
  };
  const s = sizes[size] || sizes.lg;
  const radius = size === "lg" ? 16 : size === "sm" ? 12 : 8;

  if (isUrl) return (
    <div style={{
      width: s.px, height: s.px, borderRadius: radius, padding: s.pad,
      background: "var(--surface-2)", border: "1px solid var(--border)",
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      <img src={logo} alt={name} style={{ width: "100%", height: "100%", objectFit: "contain" }}
        onError={e => { e.target.style.display = "none"; e.target.parentElement.innerHTML = `<span style="font-size:${s.font};font-weight:800;color:${color}">${initials}</span>`; }} />
    </div>
  );
  return (
    <div style={{
      width: s.px, height: s.px, borderRadius: radius, flexShrink: 0,
      background: `${color}18`, border: `1px solid ${color}30`,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <span style={{ color, fontSize: s.font, fontWeight: 800 }}>{initials}</span>
    </div>
  );
}

// ── Stat Bar ───────────────────────────────────────────

function StatBar({ label, home, away, homeColor = "#8b5cf6" }) {
  const total = (home || 0) + (away || 0);
  const homePct = total > 0 ? (home / total) * 100 : 50;
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-bold" style={{ color: "var(--text-1)" }}>{home ?? "—"}</span>
        <span className="text-xs font-medium" style={{ color: "var(--text-3)" }}>{label}</span>
        <span className="text-sm font-bold" style={{ color: "var(--text-1)" }}>{away ?? "—"}</span>
      </div>
      <div className="flex h-1.5 rounded-full overflow-hidden gap-0.5">
        <div className="rounded-full transition-all duration-700"
          style={{ width: `${homePct}%`, background: homeColor, opacity: 0.8 }} />
        <div className="rounded-full transition-all duration-700"
          style={{ width: `${100 - homePct}%`, background: "var(--surface-3)" }} />
      </div>
    </div>
  );
}

// ── Goal Progression Chart ─────────────────────────────

function GoalProgressionChart({ events, homeTeam, awayTeam, isLive, currentMinute }) {
  const goals = events.filter(e => e.type === "goal");
  if (!goals.length) return null;
  const maxMin = isLive ? Math.max(90, currentMinute || 90) : 90;
  let homeScore = 0, awayScore = 0;
  const points = [{ min: 0, home: 0, away: 0 }];
  goals.forEach(g => {
    if (g.team === "home") homeScore++; else awayScore++;
    points.push({ min: g.minuteNum, home: homeScore, away: awayScore, event: g });
  });
  points.push({ min: maxMin, home: homeScore, away: awayScore });
  const maxScore = Math.max(homeScore, awayScore, 1);
  const chartH = 80, chartW = 280, padding = 10;
  const x = min => (min / maxMin) * chartW;
  const y = score => chartH - padding - (score / maxScore) * (chartH - padding * 2);
  const baseY = y(0);
  const homePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${x(p.min)} ${y(p.home)}`).join(" ");
  const awayPath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${x(p.min)} ${y(p.away)}`).join(" ");

  return (
    <div className="glass-card rounded-2xl p-4 mb-4">
      <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>
        Score Progression
      </p>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: "#8b5cf6" }} />
          <span className="text-xs" style={{ color: "var(--text-3)" }}>{homeTeam.shortName || homeTeam.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: "var(--text-3)" }}>{awayTeam.shortName || awayTeam.name}</span>
          <div className="w-3 h-3 rounded-full" style={{ background: "#06b6d4" }} />
        </div>
      </div>
      <svg width="100%" viewBox={`0 0 ${chartW} ${chartH + 20}`} style={{ overflow: "visible" }}>
        {[0, 45, 90].map(min => (
          <g key={min}>
            <line x1={x(min)} y1={0} x2={x(min)} y2={chartH} stroke="var(--border)" strokeWidth="1" />
            <text x={x(min)} y={chartH + 14} textAnchor="middle" fill="var(--text-4)" fontSize="10">{min}'</text>
          </g>
        ))}
        <path d={`${homePath} L ${x(maxMin)} ${baseY} L ${x(0)} ${baseY} Z`} fill="#8b5cf6" fillOpacity="0.08" />
        <path d={`${awayPath} L ${x(maxMin)} ${baseY} L ${x(0)} ${baseY} Z`} fill="#06b6d4" fillOpacity="0.08" />
        <path d={homePath} fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d={awayPath} fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {goals.map((g, i) => {
          const pt = points.find(p => p.event === g);
          const score = g.team === "home" ? pt?.home || 0 : pt?.away || 0;
          return <circle key={i} cx={x(g.minuteNum)} cy={y(score)} r="4" fill={g.team === "home" ? "#8b5cf6" : "#06b6d4"} stroke="var(--surface)" strokeWidth="1.5" />;
        })}
        {isLive && currentMinute && (
          <line x1={x(currentMinute)} y1={0} x2={x(currentMinute)} y2={chartH} stroke="rgba(239,68,68,0.5)" strokeWidth="1.5" strokeDasharray="3,3" />
        )}
      </svg>
    </div>
  );
}

// ── Timeline ───────────────────────────────────────────

function Timeline({ events, isLive, currentMinute }) {
  if (!events?.length) return (
    <div className="text-center py-12">
      <p className="text-4xl mb-3">📋</p>
      <p className="text-sm" style={{ color: "var(--text-3)" }}>
        {isLive ? "Events will appear as the match progresses" : "No events recorded"}
      </p>
    </div>
  );

  const typeIcon = t => ({ goal: "⚽", yellowcard: "🟨", redcard: "🟥", sub: "🔄" }[t] || "•");
  const typeLabel = e => {
    if (e.type === "goal") return e.goalType || (e.assist ? `Assist: ${e.assist}` : "Goal");
    if (e.type === "yellowcard") return "Yellow card";
    if (e.type === "redcard") return "Red card";
    if (e.type === "sub") return e.subFor ? `On for ${e.subFor}` : "Substitution";
    return "";
  };

  const firstHalf  = events.filter(e => e.minuteNum <= 45);
  const secondHalf = events.filter(e => e.minuteNum > 45);

  const renderEvents = (evts) => evts.map((e, i) => {
    const isHome = e.team === "home";
    return (
      <div key={i} className={`flex items-center gap-2 ${isHome ? "flex-row" : "flex-row-reverse"}`}>
        <div className="rounded-full px-2.5 py-1 flex-shrink-0 w-14 text-center"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
          <span className="text-xs font-bold tabular-nums" style={{ color: "var(--text-3)" }}>{e.minute}</span>
        </div>
        <div className={`flex items-center gap-2 flex-1 glass-card rounded-xl px-3 py-2 ${isHome ? "" : "flex-row-reverse"}`}>
          <span className="text-base flex-shrink-0">{typeIcon(e.type)}</span>
          <div className={`flex-1 min-w-0 ${isHome ? "" : "text-right"}`}>
            <p className="text-sm font-semibold truncate" style={{ color: "var(--text-1)" }}>{e.player}</p>
            <p className="text-xs truncate" style={{ color: "var(--text-3)" }}>{typeLabel(e)}</p>
          </div>
        </div>
        <div className="w-14 flex-shrink-0" />
      </div>
    );
  });

  const Divider = ({ label }) => (
    <div className="flex items-center gap-2 mb-2 px-1">
      <div className="h-px flex-1" style={{ background: "var(--border)" }} />
      <span className="text-xs font-semibold" style={{ color: "var(--text-4)" }}>{label}</span>
      <div className="h-px flex-1" style={{ background: "var(--border)" }} />
    </div>
  );

  return (
    <div className="space-y-4">
      {firstHalf.length > 0 && (
        <div>
          <Divider label="First Half" />
          <div className="space-y-2">{renderEvents(firstHalf)}</div>
        </div>
      )}
      {secondHalf.length > 0 && (
        <div>
          <Divider label="Second Half" />
          <div className="space-y-2">{renderEvents(secondHalf)}</div>
        </div>
      )}
      {isLive && (
        <div className="flex items-center gap-2 px-1">
          <div className="h-px flex-1" style={{ background: "var(--border)" }} />
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            <span className="text-xs font-semibold" style={{ color: "var(--live)" }}>{currentMinute}'</span>
          </div>
          <div className="h-px flex-1" style={{ background: "var(--border)" }} />
        </div>
      )}
    </div>
  );
}

// ── H2H ───────────────────────────────────────────────

function H2H({ h2h, homeTeam, awayTeam }) {
  if (!h2h?.length) return (
    <div className="text-center py-12">
      <p className="text-4xl mb-3">📊</p>
      <p className="text-sm" style={{ color: "var(--text-3)" }}>No head to head data</p>
    </div>
  );

  const h2hTeamId = h2h[0]?.h2hTeamId;
  const isH2HTeamHome = h2hTeamId === homeTeam.id;
  let h2hTeamWins = 0, opponentWins = 0, draws = 0;
  h2h.forEach(m => {
    if (m.isDraw) draws++;
    else if (m.h2hTeamWon) { if (isH2HTeamHome) h2hTeamWins++; else opponentWins++; }
    else if (m.h2hTeamLost) { if (isH2HTeamHome) opponentWins++; else h2hTeamWins++; }
  });
  const homeWins = isH2HTeamHome ? h2hTeamWins : opponentWins;
  const awayWins = isH2HTeamHome ? opponentWins : h2hTeamWins;

  return (
    <div className="space-y-4">
      <div className="glass-card rounded-2xl p-4">
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>
          Last {h2h.length} Meetings
        </p>
        <div className="flex items-center gap-3 mb-3">
          {[
            { logo: homeTeam.logo, wins: homeWins, name: homeTeam.shortName || homeTeam.name },
            { wins: draws, name: "Draws", isDraw: true },
            { logo: awayTeam.logo, wins: awayWins, name: awayTeam.shortName || awayTeam.name },
          ].map((t, i) => (
            <div key={i} className="flex-1 text-center">
              {t.logo && <img src={t.logo} alt="" className="w-8 h-8 object-contain mx-auto mb-1" />}
              <p className="text-2xl font-black" style={{ color: "var(--text-1)" }}>{t.wins}</p>
              <p className="text-xs" style={{ color: "var(--text-3)" }}>{t.name}</p>
            </div>
          ))}
        </div>
        <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
          <div className="rounded-full bg-violet-500 transition-all duration-700"
            style={{ width: `${(homeWins / h2h.length) * 100}%` }} />
          <div className="rounded-full transition-all duration-700"
            style={{ width: `${(draws / h2h.length) * 100}%`, background: "var(--surface-3)" }} />
          <div className="rounded-full bg-cyan-500 transition-all duration-700"
            style={{ width: `${(awayWins / h2h.length) * 100}%` }} />
        </div>
      </div>

      <div className="space-y-2">
        {h2h.map((m, i) => {
          const dt = new Date(m.gameDate);
          const score1 = m.homeTeamScore || "0";
          const score2 = m.awayTeamScore || "0";
          const matchHomeId = m.homeTeamId;
          const displayHome = matchHomeId === homeTeam.id;
          const leftScore = displayHome ? score1 : score2;
          const rightScore = displayHome ? score2 : score1;
          const homeWon = parseInt(leftScore) > parseInt(rightScore);
          const awayWon = parseInt(rightScore) > parseInt(leftScore);
          return (
            <div key={m.id || i} className="glass-card rounded-xl px-4 py-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs" style={{ color: "var(--text-4)" }}>
                  {dt.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                </span>
                <span className="text-xs truncate max-w-36 text-right" style={{ color: "var(--text-4)" }}>
                  {m.leagueName || m.competitionName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <img src={homeTeam.logo} alt="" className="w-5 h-5 object-contain flex-shrink-0" />
                  <span className="text-xs font-semibold truncate" style={{ color: "var(--text-2)" }}>
                    {homeTeam.shortName || homeTeam.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3 flex-shrink-0">
                  <span className="text-sm font-black tabular-nums"
                    style={{ color: homeWon ? "var(--text-1)" : "var(--text-4)" }}>{leftScore}</span>
                  <span className="text-xs" style={{ color: "var(--text-4)" }}>—</span>
                  <span className="text-sm font-black tabular-nums"
                    style={{ color: awayWon ? "var(--text-1)" : "var(--text-4)" }}>{rightScore}</span>
                </div>
                <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                  <span className="text-xs font-semibold truncate" style={{ color: "var(--text-2)" }}>
                    {awayTeam.shortName || awayTeam.name}
                  </span>
                  <img src={awayTeam.logo} alt="" className="w-5 h-5 object-contain flex-shrink-0" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Team Leaders ───────────────────────────────────────

function TeamLeaders({ leaders, homeTeam, awayTeam, homeTeamId, awayTeamId }) {
  const [activeTeam, setActiveTeam] = useState("home");
  const homeLeaders = leaders?.find(l => l.teamId === homeTeamId) || leaders?.[0];
  const awayLeaders = leaders?.find(l => l.teamId === awayTeamId) || leaders?.[1];
  const current = activeTeam === "home" ? homeLeaders : awayLeaders;
  const currentTeam = activeTeam === "home" ? homeTeam : awayTeam;

  if (!leaders?.length) return (
    <div className="text-center py-12">
      <p className="text-4xl mb-3">👤</p>
      <p className="text-sm" style={{ color: "var(--text-3)" }}>No player data available</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {[{ id: "home", team: homeTeam }, { id: "away", team: awayTeam }].map(({ id, team }) => (
          <button key={id} onClick={() => setActiveTeam(id)}
            className="flex items-center gap-2 flex-1 px-3 py-2.5 rounded-xl transition-all"
            style={{
              background: activeTeam === id ? "var(--accent)" : "var(--surface-2)",
              border: `1px solid ${activeTeam === id ? "var(--accent)" : "var(--border)"}`,
            }}>
            <TeamLogo logo={team.logo} name={team.name} size="xs" />
            <span className="text-xs font-bold truncate"
              style={{ color: activeTeam === id ? "#fff" : "var(--text-3)" }}>
              {team.shortName || team.name}
            </span>
          </button>
        ))}
      </div>

      {current?.goals?.length > 0 && (
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>
            ⚽ Top Scorers
          </p>
          <div className="space-y-3">
            {current.goals.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3">
                <span className="text-sm font-black w-5 text-center"
                  style={{ color: i === 0 ? "#f59e0b" : i === 1 ? "#8e8e93" : "#92400e" }}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--text-1)" }}>{p.name}</p>
                  <p className="text-xs" style={{ color: "var(--text-3)" }}>{p.apps} apps</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-black" style={{ color: "var(--text-1)" }}>{p.goals}</span>
                  <span className="text-xs">⚽</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {current?.assists?.length > 0 && (
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>
            🎯 Top Assisters
          </p>
          <div className="space-y-3">
            {current.assists.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3">
                <span className="text-sm font-black w-5 text-center"
                  style={{ color: i === 0 ? "#f59e0b" : i === 1 ? "#8e8e93" : "#92400e" }}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--text-1)" }}>{p.name}</p>
                  <p className="text-xs" style={{ color: "var(--text-3)" }}>{p.apps} apps</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-black" style={{ color: "var(--text-1)" }}>{p.assists}</span>
                  <span className="text-xs">🎯</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!current?.goals?.length && !current?.assists?.length && (
        <div className="text-center py-8">
          <p className="text-3xl mb-2">👤</p>
          <p className="text-sm" style={{ color: "var(--text-3)" }}>No player stats for {currentTeam.name}</p>
        </div>
      )}
    </div>
  );
}

// ── Mini Standings ─────────────────────────────────────

function MiniStandings({ entries, homeTeamId, awayTeamId, leagueId, onSelectTeam }) {
  if (!entries?.length) return (
    <div className="text-center py-8">
      <p className="text-3xl mb-2">📊</p>
      <p className="text-sm" style={{ color: "var(--text-3)" }}>No standings available</p>
    </div>
  );

  const getStat = (stats, name) => stats?.find(s => s.name === name)?.value ?? 0;

  return (
    <div>
      <div className="flex items-center px-2 pb-2 text-xs font-semibold" style={{ color: "var(--text-4)" }}>
        <span className="w-5 text-center">#</span>
        <span className="flex-1 ml-2">Team</span>
        <span className="w-6 text-center">GP</span>
        <span className="w-6 text-center">W</span>
        <span className="w-6 text-center">D</span>
        <span className="w-6 text-center">L</span>
        <span className="w-8 text-center">GD</span>
        <span className="w-7 text-center font-black" style={{ color: "var(--text-3)" }}>P</span>
      </div>
      <div className="space-y-1">
        {entries.map((entry, idx) => {
          const stats = entry.stats || [];
          const rank = getStat(stats, "rank") || idx + 1;
          const gp   = getStat(stats, "gamesPlayed");
          const w    = getStat(stats, "wins");
          const d    = getStat(stats, "ties");
          const l    = getStat(stats, "losses");
          const gd   = getStat(stats, "pointDifferential");
          const pts  = getStat(stats, "points");
          const isHighlighted = entry.id === homeTeamId || entry.id === awayTeamId;
          const logo = entry.logo?.[0]?.href;

          return (
            <div
              key={entry.id}
              onClick={() => onSelectTeam?.({ id: entry.id, displayName: entry.team, logos: entry.logo ? [{ href: entry.logo[0]?.href }] : [] }, leagueId)}
              className="flex items-center px-2 py-2 rounded-xl transition-all cursor-pointer active:scale-[0.99]"
              style={{
                background: isHighlighted ? "rgba(0,122,255,0.08)" : "var(--surface-2)",
                border: `1px solid ${isHighlighted ? "rgba(0,122,255,0.2)" : "var(--border)"}`,
              }}
            >
              <span className="w-5 text-center text-xs font-black tabular-nums"
                style={{ color: rank <= 3 ? "#f59e0b" : "var(--text-4)" }}>{rank}</span>
              <div className="flex items-center gap-1.5 flex-1 min-w-0 ml-2">
                {logo
                  ? <img src={logo} alt="" className="w-4 h-4 object-contain flex-shrink-0" />
                  : <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: "var(--surface-3)" }} />
                }
                <span className="text-xs font-semibold truncate"
                  style={{ color: isHighlighted ? "var(--accent)" : "var(--text-2)" }}>
                  {entry.team}
                </span>
              </div>
              <span className="w-6 text-center text-xs tabular-nums" style={{ color: "var(--text-3)" }}>{gp}</span>
              <span className="w-6 text-center text-xs tabular-nums text-green-500">{w}</span>
              <span className="w-6 text-center text-xs tabular-nums" style={{ color: "#f59e0b" }}>{d}</span>
              <span className="w-6 text-center text-xs tabular-nums text-red-500">{l}</span>
              <span className="w-8 text-center text-xs tabular-nums font-semibold"
                style={{ color: gd > 0 ? "#10b981" : gd < 0 ? "#ef4444" : "var(--text-3)" }}>
                {gd > 0 ? `+${gd}` : gd}
              </span>
              <span className="w-7 text-center text-xs font-black tabular-nums" style={{ color: "var(--text-1)" }}>{pts}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Odds Card ──────────────────────────────────────────

function OddsCard({ odds, homeTeam, awayTeam }) {
  if (!odds) return null;
  return (
    <div className="glass-card rounded-2xl p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
          Match Odds
        </p>
        <span className="text-xs" style={{ color: "var(--text-4)" }}>DraftKings</span>
      </div>
      <div className="flex items-center gap-2 mb-3">
        {[
          { label: homeTeam.shortName || homeTeam.name, val: odds.homeTeamOdds?.moneyLine, fav: odds.homeTeamOdds?.favorite },
          { label: "Draw", val: odds.drawOdds?.moneyLine, fav: false },
          { label: awayTeam.shortName || awayTeam.name, val: odds.awayTeamOdds?.moneyLine, fav: odds.awayTeamOdds?.favorite },
        ].map(o => (
          <div key={o.label}
            className="flex-1 text-center py-2.5 rounded-xl"
            style={{
              background: o.fav ? "rgba(0,122,255,0.08)" : "var(--surface-2)",
              border: `1px solid ${o.fav ? "rgba(0,122,255,0.2)" : "var(--border)"}`,
            }}>
            <p className="text-xs truncate px-1" style={{ color: "var(--text-3)" }}>{o.label}</p>
            <p className="text-base font-black mt-0.5" style={{ color: o.fav ? "var(--accent)" : "var(--text-1)" }}>
              {o.val ? (o.val > 0 ? `+${o.val}` : o.val) : "—"}
            </p>
            {o.fav && <p className="text-xs mt-0.5" style={{ color: "var(--accent)" }}>Fav</p>}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between rounded-xl px-4 py-2"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
        <span className="text-xs" style={{ color: "var(--text-3)" }}>Over/Under</span>
        <span className="text-xs font-bold" style={{ color: "var(--text-1)" }}>{odds.overUnder}</span>
        <div className="flex gap-3">
          <span className="text-xs" style={{ color: "var(--text-3)" }}>O: {odds.overOdds > 0 ? `+${odds.overOdds}` : odds.overOdds}</span>
          <span className="text-xs" style={{ color: "var(--text-3)" }}>U: {odds.underOdds > 0 ? `+${odds.underOdds}` : odds.underOdds}</span>
        </div>
      </div>
    </div>
  );
}

// ── Shots & xG Tab ────────────────────────────────────

function ShotsTab({ events, stats, homeTeam, awayTeam }) {
  const goals = events.filter(e => e.type === "goal" && e.fieldPositionX);

  function parseLocation(text = "") {
    const t = text.toLowerCase();
    if (t.includes("penalty")) return "Penalty spot";
    if (t.includes("centre of the box") || t.includes("center of the box")) return "Centre of box";
    if (t.includes("right side of the box")) return "Right side of box";
    if (t.includes("left side of the box")) return "Left side of box";
    if (t.includes("close range")) return "Close range";
    if (t.includes("outside the box") || t.includes("long range")) return "Outside box";
    return "Box";
  }

  const homeShotsOnTarget = stats.shotsOnTarget?.home || 0;
  const awayShotsOnTarget = stats.shotsOnTarget?.away || 0;
  const homeShots = stats.shots?.home || 0;
  const awayShots = stats.shots?.away || 0;
  const homeGoals = events.filter(e => e.type === "goal" && e.team === "home").length;
  const awayGoals = events.filter(e => e.type === "goal" && e.team === "away").length;

  const calcXG = (shots, onTarget) => ((onTarget * 0.30) + ((shots - onTarget) * 0.04)).toFixed(2);
  const homeXG = calcXG(homeShots, homeShotsOnTarget);
  const awayXG = calcXG(awayShots, awayShotsOnTarget);
  const maxXG  = Math.max(parseFloat(homeXG), parseFloat(awayXG), 0.5);
  const PW = 300, PH = 200;

  return (
    <div className="space-y-4">
      <div className="glass-card rounded-2xl p-4">
        <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--text-3)" }}>
          Expected Goals (xG)
        </p>
        <div className="flex items-center justify-between mb-3">
          {[
            { team: homeTeam, xg: homeXG },
            null,
            { team: awayTeam, xg: awayXG },
          ].map((t, i) => t === null ? (
            <div key={i} className="text-center px-4">
              <p className="text-xs" style={{ color: "var(--text-4)" }}>vs</p>
            </div>
          ) : (
            <div key={i} className="text-center flex-1">
              <div className="flex items-center justify-center gap-2 mb-1">
                <img src={t.team.logo} alt="" className="w-6 h-6 object-contain" />
                <span className="text-xs truncate" style={{ color: "var(--text-3)" }}>
                  {t.team.shortName || t.team.name}
                </span>
              </div>
              <p className="text-3xl font-black" style={{ color: "var(--text-1)" }}>{t.xg}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>xG</p>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {[
            { label: "xG",       home: parseFloat(homeXG),     away: parseFloat(awayXG),     color: "#8b5cf6" },
            { label: "Shots",    home: homeShots,               away: awayShots,               color: "#3b82f6" },
            { label: "On Target",home: homeShotsOnTarget,       away: awayShotsOnTarget,       color: "#10b981" },
          ].map(row => (
            <div key={row.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold w-8 tabular-nums" style={{ color: "var(--text-1)" }}>{row.home}</span>
                <span className="text-xs" style={{ color: "var(--text-3)" }}>{row.label}</span>
                <span className="text-sm font-bold w-8 text-right tabular-nums" style={{ color: "var(--text-1)" }}>{row.away}</span>
              </div>
              <div className="flex h-1.5 rounded-full overflow-hidden gap-0.5">
                <div className="rounded-full transition-all duration-700"
                  style={{ width: `${(row.home / (row.home + row.away || 1)) * 100}%`, background: row.color, opacity: 0.8 }} />
                <div className="rounded-full transition-all duration-700"
                  style={{ width: `${(row.away / (row.home + row.away || 1)) * 100}%`, background: "var(--surface-3)" }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-2xl p-4">
        <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--text-3)" }}>
          Shot Funnel
        </p>
        <div className="flex gap-4">
          {[
            { team: homeTeam, shots: homeShots, onTarget: homeShotsOnTarget, goals: homeGoals, color: "#8b5cf6" },
            { team: awayTeam, shots: awayShots, onTarget: awayShotsOnTarget, goals: awayGoals, color: "#06b6d4" },
          ].map((t, i) => (
            <div key={i} className="flex-1">
              <div className="flex items-center gap-1.5 mb-3">
                <img src={t.team.logo} alt="" className="w-4 h-4 object-contain" />
                <span className="text-xs font-semibold truncate" style={{ color: "var(--text-3)" }}>
                  {t.team.shortName || t.team.name}
                </span>
              </div>
              <div className="space-y-1.5">
                {[
                  { label: "Shots",     value: t.shots,    pct: 100 },
                  { label: "On Target", value: t.onTarget, pct: t.shots > 0 ? (t.onTarget / t.shots) * 100 : 0 },
                  { label: "Goals",     value: t.goals,    pct: t.shots > 0 ? (t.goals / t.shots) * 100 : 0 },
                ].map(row => (
                  <div key={row.label}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs" style={{ color: "var(--text-3)" }}>{row.label}</span>
                      <span className="text-xs font-bold" style={{ color: "var(--text-1)" }}>{row.value}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--surface-3)" }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${row.pct}%`, background: t.color, opacity: 0.7 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {goals.length > 0 && (
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>
            Goal Map
          </p>
          <div className="relative rounded-xl overflow-hidden mb-3"
            style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.12)" }}>
            <svg width="100%" viewBox={`0 0 ${PW} ${PH}`} style={{ display: "block" }}>
              <rect x="5" y="5" width={PW-10} height={PH-10} fill="none" stroke="var(--border)" strokeWidth="1" rx="2" />
              <circle cx={PW/2} cy={PH/2} r="30" fill="none" stroke="var(--border)" strokeWidth="1" />
              <line x1={PW/2} y1="5" x2={PW/2} y2={PH-5} stroke="var(--border)" strokeWidth="1" />
              <rect x="5" y={PH/2-40} width="55" height="80" fill="none" stroke="var(--border)" strokeWidth="1" />
              <rect x="5" y={PH/2-20} width="20" height="40" fill="none" stroke="var(--border)" strokeWidth="1" />
              <rect x="3" y={PH/2-10} width="5" height="20" fill="var(--surface-3)" stroke="var(--border-2)" strokeWidth="1" />
              <rect x={PW-60} y={PH/2-40} width="55" height="80" fill="none" stroke="var(--border)" strokeWidth="1" />
              <rect x={PW-25} y={PH/2-20} width="20" height="40" fill="none" stroke="var(--border)" strokeWidth="1" />
              <rect x={PW-8} y={PH/2-10} width="5" height="20" fill="var(--surface-3)" stroke="var(--border-2)" strokeWidth="1" />
              {goals.map((g, i) => {
                const isHome = g.team === "home";
                const px = isHome ? PW - (g.fieldPositionX * (PW-20) + 10) : g.fieldPositionX * (PW-20) + 10;
                const py = g.fieldPositionY * (PH-10) + 5;
                const color = isHome ? "#8b5cf6" : "#06b6d4";
                return (
                  <g key={i}>
                    <circle cx={px} cy={py} r="10" fill={color} opacity="0.15" />
                    <circle cx={px} cy={py} r="6" fill={color} opacity="0.9" stroke="var(--surface)" strokeWidth="1.5" />
                    <text x={px} y={py+4} textAnchor="middle" fontSize="7">⚽</text>
                  </g>
                );
              })}
            </svg>
          </div>
          <div className="space-y-2">
            {goals.map((g, i) => {
              const isHome = g.team === "home";
              const color = isHome ? "#8b5cf6" : "#06b6d4";
              return (
                <div key={i} className={`flex items-center gap-3 ${isHome ? "" : "flex-row-reverse"}`}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                    <span className="text-sm">⚽</span>
                  </div>
                  <div className={`flex-1 min-w-0 ${isHome ? "" : "text-right"}`}>
                    <p className="text-sm font-bold truncate" style={{ color: "var(--text-1)" }}>{g.player}</p>
                    <p className="text-xs truncate" style={{ color: "var(--text-3)" }}>{g.minute} · {g.goalType || "Goal"}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="glass-card rounded-2xl p-4">
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>
          Match Momentum
        </p>
        <p className="text-xs mb-3" style={{ color: "var(--text-4)" }}>Based on key events per 15 min period</p>
        {(() => {
          const periods = [0, 15, 30, 45, 60, 75, 90];
          const allEvents = [...events].filter(e => e.minuteNum > 0);
          return (
            <div>
              <div className="flex items-center gap-1 mb-1">
                {periods.slice(0, -1).map((start, i) => {
                  const end = periods[i + 1];
                  const periodEvents = allEvents.filter(e => e.minuteNum >= start && e.minuteNum < end);
                  const homeCount = periodEvents.filter(e => e.team === "home").length;
                  const awayCount = periodEvents.filter(e => e.team === "away").length;
                  const total = homeCount + awayCount;
                  const homePct = total > 0 ? (homeCount / total) * 100 : 50;
                  return (
                    <div key={start} className="flex-1">
                      <div className="flex flex-col h-16 gap-0.5">
                        <div className="flex-1 flex items-end">
                          <div className="w-full rounded-t-sm transition-all duration-700"
                            style={{ height: `${Math.max(homePct, 5)}%`, background: total > 0 ? "#8b5cf6" : "var(--surface-3)", opacity: total > 0 ? 0.7 + (homeCount * 0.1) : 0.3 }} />
                        </div>
                        <div className="h-px" style={{ background: "var(--border)" }} />
                        <div className="flex-1 flex items-start">
                          <div className="w-full rounded-b-sm transition-all duration-700"
                            style={{ height: `${Math.max(100 - homePct, 5)}%`, background: total > 0 ? "#06b6d4" : "var(--surface-3)", opacity: total > 0 ? 0.7 + (awayCount * 0.1) : 0.3 }} />
                        </div>
                      </div>
                      <p className="text-center text-xs mt-1" style={{ color: "var(--text-4)" }}>{start}'</p>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-violet-500" />
                  <span className="text-xs" style={{ color: "var(--text-3)" }}>{homeTeam.shortName || homeTeam.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs" style={{ color: "var(--text-3)" }}>{awayTeam.shortName || awayTeam.name}</span>
                  <div className="w-2 h-2 rounded-full bg-cyan-500" />
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────

export default function MatchDetail({ game, onClose, onSelectTeam }) {
  const [activeTab, setActiveTab] = useState("stats");
  const [visible, setVisible] = useState(false);
  const [details, setDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const pollRef = useRef(null);
  const timerRef = useRef(null);

  const isLive      = game.status === "live";
  const isFinished  = game.status === "finished";
  const isScheduled = game.status === "scheduled";
  const currentMinute = parseInt(game.minute) || 0;

  async function loadDetails() {
    const data = await fetchMatchDetails(game);
    if (data) { setDetails(data); setSecondsAgo(0); }
    setLoadingDetails(false);
    setRefreshing(false);
  }

  useEffect(() => {
    setTimeout(() => setVisible(true), 10);
    loadDetails();
    if (isLive) {
      pollRef.current  = setInterval(loadDetails, 30_000);
      timerRef.current = setInterval(() => setSecondsAgo(s => s + 1), 1000);
    }
    return () => {
      if (pollRef.current)  clearInterval(pollRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function handleRefresh() { setRefreshing(true); loadDetails(); }
  function handleClose() {
    setVisible(false);
    if (pollRef.current)  clearInterval(pollRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeout(onClose, 300);
  }

  const stats = details?.stats || {
    possession: { home: 50, away: 50 }, shots: { home: 0, away: 0 },
    shotsOnTarget: { home: 0, away: 0 }, corners: { home: 0, away: 0 },
    fouls: { home: 0, away: 0 }, yellowCards: { home: 0, away: 0 }, offsides: { home: 0, away: 0 },
  };
  const events = details?.events || game.events || [];

  const LEAGUE_MAP = {
    "Premier League": "eng.1", "La Liga": "esp.1", "Bundesliga": "ger.1",
    "Serie A": "ita.1", "Ligue 1": "fra.1", "Champions League": "uefa.champions", "Europa League": "uefa.europa",
  };
  const leagueId = LEAGUE_MAP[game.league] || "eng.1";

  const tabs = [
    { id: "stats",    label: "Stats"    },
    { id: "shots",    label: "xG"       },
    { id: "timeline", label: "Timeline" },
    { id: "h2h",      label: "H2H"      },
    { id: "players",  label: "Players"  },
    { id: "table",    label: "Table"    },
    { id: "info",     label: "Info"     },
  ];

  const Skeleton = ({ rows = 5 }) => (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-xl h-12 animate-pulse" style={{ background: "var(--surface-2)" }} />
      ))}
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{
        background: "var(--overlay-bg)",
        transform: visible ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm">{game.leagueLogo}</span>
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
              {game.league}
            </span>
          </div>
          {isLive && (
            <div className="flex items-center gap-2 mt-1">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--live)" }} />
              <span className="text-xs font-bold" style={{ color: "var(--live)" }}>Live · {game.minute}</span>
              <span className="text-xs" style={{ color: "var(--text-4)" }}>· updated {secondsAgo}s ago</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isLive && (
            <button onClick={handleRefresh}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)", opacity: refreshing ? 0.5 : 1 }}>
              <RefreshCw size={14} style={{ color: "var(--text-3)" }} className={refreshing ? "animate-spin" : ""} />
            </button>
          )}
          <button onClick={handleClose}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            <X size={16} style={{ color: "var(--text-2)" }} />
          </button>
        </div>
      </div>

      {/* Score hero */}
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex flex-col items-center gap-2 flex-1">
          <TeamLogo logo={game.homeTeam.logo} name={game.homeTeam.name} size="lg" />
          <p className="text-sm font-bold text-center leading-tight px-2" style={{ color: "var(--text-1)" }}>
            {game.homeTeam.name}
          </p>
        </div>
        <div className="flex flex-col items-center gap-1.5 px-4">
          {isScheduled ? (
            <>
              <p className="text-xs" style={{ color: "var(--text-3)" }}>Kick off</p>
              <p className="text-3xl font-black" style={{ color: "var(--text-1)" }}>{game.minute}</p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <span className="text-5xl font-black tabular-nums"
                  style={{ color: isFinished && game.homeScore > game.awayScore ? "var(--text-1)" : "var(--text-4)" }}>
                  {game.homeScore ?? 0}
                </span>
                <span className="text-3xl" style={{ color: "var(--text-4)" }}>—</span>
                <span className="text-5xl font-black tabular-nums"
                  style={{ color: isFinished && game.awayScore > game.homeScore ? "var(--text-1)" : "var(--text-4)" }}>
                  {game.awayScore ?? 0}
                </span>
              </div>
              <span className="text-xs uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
                {isFinished ? "Full Time" : isLive ? game.minute : ""}
              </span>
            </>
          )}
        </div>
        <div className="flex flex-col items-center gap-2 flex-1">
          <TeamLogo logo={game.awayTeam.logo} name={game.awayTeam.name} size="lg" />
          <p className="text-sm font-bold text-center leading-tight px-2" style={{ color: "var(--text-1)" }}>
            {game.awayTeam.name}
          </p>
        </div>
      </div>

      {/* Goal scorers */}
      {events.filter(e => e.type === "goal").length > 0 && (
        <div className="flex justify-between px-6 mb-2">
          <div className="flex flex-col gap-0.5">
            {events.filter(e => e.type === "goal" && e.team === "home").map((e, i) => (
              <span key={i} className="text-xs" style={{ color: "var(--text-3)" }}>⚽ {e.minute} {e.player}</span>
            ))}
          </div>
          <div className="flex flex-col gap-0.5 items-end">
            {events.filter(e => e.type === "goal" && e.team === "away").map((e, i) => (
              <span key={i} className="text-xs" style={{ color: "var(--text-3)" }}>{e.player} {e.minute} ⚽</span>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mx-4 mb-3 p-1 rounded-xl overflow-x-auto no-scrollbar"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className="flex-shrink-0 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200"
            style={{
              background: activeTab === tab.id ? "var(--accent)" : "transparent",
              color: activeTab === tab.id ? "#ffffff" : "var(--text-3)",
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-4 pb-8">
        {activeTab === "stats" && (loadingDetails ? <Skeleton /> : (
          <>
            <GoalProgressionChart events={events} homeTeam={game.homeTeam} awayTeam={game.awayTeam} isLive={isLive} currentMinute={currentMinute} />
            {details?.odds && <OddsCard odds={details.odds} homeTeam={game.homeTeam} awayTeam={game.awayTeam} />}
            <div className="glass-card rounded-2xl p-4">
              <StatBar label="Possession %" home={stats.possession.home} away={stats.possession.away} />
              <StatBar label="Shots" home={stats.shots.home} away={stats.shots.away} />
              <StatBar label="Shots on Target" home={stats.shotsOnTarget.home} away={stats.shotsOnTarget.away} />
              <StatBar label="Corners" home={stats.corners.home} away={stats.corners.away} />
              <StatBar label="Fouls" home={stats.fouls.home} away={stats.fouls.away} homeColor="#ef4444" />
              <StatBar label="Yellow Cards" home={stats.yellowCards.home} away={stats.yellowCards.away} homeColor="#f59e0b" />
              <StatBar label="Offsides" home={stats.offsides.home} away={stats.offsides.away} homeColor="#14b8a6" />
              {isScheduled && <p className="text-center text-xs mt-4" style={{ color: "var(--text-4)" }}>Stats available once match starts</p>}
            </div>
          </>
        ))}

        {activeTab === "shots" && (loadingDetails ? <Skeleton rows={3} /> : (
          <ShotsTab events={events} stats={stats} homeTeam={game.homeTeam} awayTeam={game.awayTeam} />
        ))}

        {activeTab === "timeline" && (loadingDetails ? <Skeleton rows={4} /> : (
          <Timeline events={events} isLive={isLive} currentMinute={currentMinute} />
        ))}

        {activeTab === "h2h" && (loadingDetails ? <Skeleton /> : (
          <H2H h2h={details?.h2h || []} homeTeam={game.homeTeam} awayTeam={game.awayTeam} />
        ))}

        {activeTab === "players" && (loadingDetails ? <Skeleton rows={4} /> : (
          <TeamLeaders
            leaders={details?.leaders || []}
            homeTeam={game.homeTeam}
            awayTeam={game.awayTeam}
            homeTeamId={details?.homeTeamId}
            awayTeamId={details?.awayTeamId}
          />
        ))}

        {activeTab === "table" && (loadingDetails ? <Skeleton /> : (
          <MiniStandings
            entries={details?.standingsEntries || []}
            homeTeamId={details?.homeTeamId || game.homeTeam.id}
            awayTeamId={details?.awayTeamId || game.awayTeam.id}
            leagueId={leagueId}
            onSelectTeam={onSelectTeam}
          />
        ))}

        {activeTab === "info" && (
          <div className="space-y-3">
            <div className="glass-card rounded-2xl p-4 space-y-4">
              {details?.venue && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                    <MapPin size={14} style={{ color: "var(--text-3)" }} />
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: "var(--text-3)" }}>Venue</p>
                    <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>{details.venue}</p>
                  </div>
                </div>
              )}
              {details?.referee && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                    <User size={14} style={{ color: "var(--text-3)" }} />
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: "var(--text-3)" }}>Referee</p>
                    <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>{details.referee}</p>
                  </div>
                </div>
              )}
              {game.minute && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                    <Calendar size={14} style={{ color: "var(--text-3)" }} />
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: "var(--text-3)" }}>
                      {isScheduled ? "Kick off" : isLive ? "Current minute" : "Status"}
                    </p>
                    <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>{game.minute}</p>
                  </div>
                </div>
              )}
              {!details?.venue && !details?.referee && (
                <p className="text-center text-xs py-4" style={{ color: "var(--text-4)" }}>Match info not available</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}