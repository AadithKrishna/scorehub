import { useState, useEffect } from "react";

const ESPN = "https://site.api.espn.com/apis/site/v2/sports/soccer";
const ESPN_V2 = "https://site.api.espn.com/apis/v2/sports/soccer";

function getStatVal(stats, name) {
  return stats?.find(s => s.name === name)?.value ?? 0;
}

function LeagueStandings({ leagueId, onSelectTeam }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${ESPN_V2}/${leagueId}/standings`)
      .then(r => r.json())
      .then(d => {
        setEntries(d.children?.[0]?.standings?.entries || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [leagueId]);

  if (loading) return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="glass rounded-xl h-12 animate-pulse" />
      ))}
    </div>
  );

  if (!entries.length) return (
    <div className="text-center py-8">
      <p className="text-3xl mb-2">📊</p>
      <p className="text-sm text-white/30">No standings available</p>
    </div>
  );

  const getZoneColor = (note) => {
    if (!note) return null;
    const d = (note.description || "").toLowerCase();
    if (d.includes("champion") || d.includes("title")) return "#f59e0b";
    if (d.includes("champions league")) return "#3b82f6";
    if (d.includes("europa") || d.includes("conference")) return "#f97316";
    if (d.includes("relegat")) return "#ef4444";
    return null;
  };

  return (
    <div>
      <div className="flex items-center px-3 pb-2 text-xs text-white/25 font-semibold">
        <span className="w-6 text-center">#</span>
        <span className="flex-1 ml-3">Team</span>
        <span className="w-6 text-center">GP</span>
        <span className="w-6 text-center">W</span>
        <span className="w-6 text-center">D</span>
        <span className="w-6 text-center">L</span>
        <span className="w-8 text-center">GD</span>
        <span className="w-8 text-center font-black text-white/40">P</span>
      </div>
      <div className="space-y-1">
        {entries.map((entry, idx) => {
          const stats = entry.stats || [];
          const rank = getStatVal(stats, "rank") || idx + 1;
          const gp   = getStatVal(stats, "gamesPlayed");
          const w    = getStatVal(stats, "wins");
          const d    = getStatVal(stats, "ties");
          const l    = getStatVal(stats, "losses");
          const gd   = getStatVal(stats, "pointDifferential");
          const pts  = getStatVal(stats, "points");
          const zoneColor = getZoneColor(entry.note);
          const logo = entry.team?.logos?.[0]?.href;

          return (
            <div
              key={entry.team?.id}
              onClick={() => onSelectTeam(entry.team)}
              className="flex items-center px-3 py-2.5 glass-card rounded-xl cursor-pointer hover:bg-white/5 transition-all active:scale-[0.99]"
              style={zoneColor ? { borderLeft: `3px solid ${zoneColor}` } : {}}
            >
              <span className={`w-6 text-center text-xs font-black tabular-nums ${
                rank <= 3 ? "text-yellow-400" : "text-white/30"
              }`}>{rank}</span>
              <div className="flex items-center gap-2 flex-1 min-w-0 ml-2">
                {logo
                  ? <img src={logo} alt="" className="w-5 h-5 object-contain flex-shrink-0" />
                  : <div className="w-5 h-5 rounded-full bg-white/10 flex-shrink-0" />
                }
                <span className="text-xs font-semibold text-white truncate">
                  {entry.team?.shortDisplayName || entry.team?.abbreviation}
                </span>
              </div>
              <span className="w-6 text-center text-xs text-white/40 tabular-nums">{gp}</span>
              <span className="w-6 text-center text-xs text-green-400 tabular-nums font-semibold">{w}</span>
              <span className="w-6 text-center text-xs text-yellow-400/70 tabular-nums">{d}</span>
              <span className="w-6 text-center text-xs text-red-400/70 tabular-nums">{l}</span>
              <span className={`w-8 text-center text-xs tabular-nums font-semibold ${
                gd > 0 ? "text-green-400" : gd < 0 ? "text-red-400" : "text-white/40"
              }`}>{gd > 0 ? `+${gd}` : gd}</span>
              <span className="w-8 text-center text-xs font-black text-white tabular-nums">{pts}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-3 px-3 space-y-1">
        {[
          { color: "#f59e0b", label: "Champions / Title" },
          { color: "#3b82f6", label: "Champions League" },
          { color: "#f97316", label: "Europa / Conference" },
          { color: "#ef4444", label: "Relegation" },
        ].map(z => (
          <div key={z.label} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: z.color }} />
            <span className="text-xs text-white/25">{z.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopScorers({ leagueId }) {
  const [scorers, setScorers] = useState([]);
  const [assisters, setAssisters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("goals");

  useEffect(() => {
    async function load() {
      try {
        // Step 1: Get all team IDs from standings
        const standingsRes = await fetch(
          `https://site.api.espn.com/apis/v2/sports/soccer/${leagueId}/standings`
        );
        const standingsData = await standingsRes.json();
        const teamIds = standingsData.children?.[0]?.standings?.entries
          ?.map(e => e.team?.id)
          .filter(Boolean) || [];

        if (!teamIds.length) throw new Error("No teams found");

        // Step 2: Fetch all rosters in parallel
        const rosterResults = await Promise.allSettled(
          teamIds.map(id =>
            fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueId}/teams/${id}/roster`)
              .then(r => r.json())
          )
        );

        // Step 3: Extract player stats
        const allPlayers = [];
        rosterResults.forEach(result => {
          if (result.status !== "fulfilled") return;
          const athletes = result.value.athletes || [];
          const teamName = result.value.team?.displayName || "";
          const teamLogo = result.value.team?.logo || "";
          const teamColor = result.value.team?.color || "8b5cf6";

          athletes.forEach(player => {
            const offensive = player.statistics?.splits?.categories
              ?.find(c => c.name === "offensive")?.stats || [];
            const getStat = name => offensive.find(s => s.name === name)?.value || 0;
            const goals = getStat("totalGoals");
            const assists = getStat("goalAssists");
            const shots = getStat("totalShots");
            const shotsOnTarget = getStat("shotsOnTarget");
            const general = player.statistics?.splits?.categories
              ?.find(c => c.name === "general")?.stats || [];
            const apps = general.find(s => s.name === "appearances")?.value || 0;

            if (goals > 0 || assists > 0) {
              allPlayers.push({
                id: player.id,
                name: player.displayName,
                shortName: player.shortName,
                nationality: player.citizenship,
                flag: player.flag?.href,
                position: player.position?.abbreviation,
                jersey: player.jersey,
                teamName,
                teamLogo,
                teamColor: `#${teamColor}`,
                goals,
                assists,
                shots,
                shotsOnTarget,
                apps,
              });
            }
          });
        });

        // Sort by goals and assists
        const byGoals = [...allPlayers].sort((a, b) =>
          b.goals !== a.goals ? b.goals - a.goals : b.assists - a.assists
        );
        const byAssists = [...allPlayers].sort((a, b) =>
          b.assists !== a.assists ? b.assists - a.assists : b.goals - a.goals
        );

        setScorers(byGoals.slice(0, 20));
        setAssisters(byAssists.slice(0, 20));
        setLoading(false);
      } catch (err) {
        console.warn("Failed to load scorers:", err.message);
        setLoading(false);
      }
    }
    load();
  }, [leagueId]);

  if (loading) return (
    <div className="space-y-2">
      <div className="glass rounded-xl h-10 animate-pulse mb-4" />
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="glass rounded-xl h-14 animate-pulse"
          style={{ animationDelay: `${i * 50}ms` }} />
      ))}
    </div>
  );

  if (!scorers.length) return (
    <div className="text-center py-8">
      <p className="text-3xl mb-2">⚽</p>
      <p className="text-sm text-white/30">No scorer data available</p>
    </div>
  );

  const list = activeTab === "goals" ? scorers : assisters;
  const statKey = activeTab === "goals" ? "goals" : "assists";
  const statIcon = activeTab === "goals" ? "⚽" : "🎯";

  return (
    <div>
      {/* Toggle */}
      <div className="flex gap-1 mb-4 glass rounded-xl p-1">
        {[
          { id: "goals",   label: "⚽ Top Scorers"  },
          { id: "assists", label: "🎯 Top Assisters" },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === tab.id
                ? "bg-violet-600 text-white"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {list.map((p, i) => (
          <div key={p.id}
            className="glass-card rounded-xl px-4 py-2.5 flex items-center gap-3">
            {/* Rank */}
            <span className={`text-sm font-black w-6 text-center flex-shrink-0 ${
              i === 0 ? "text-yellow-400" :
              i === 1 ? "text-slate-300" :
              i === 2 ? "text-amber-600" :
              "text-white/30"
            }`}>
              {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
            </span>

            {/* Player info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                {p.flag && (
                  <img src={p.flag} alt="" className="w-3.5 h-3.5 object-contain flex-shrink-0" />
                )}
                <p className="text-sm font-bold text-white truncate">{p.name}</p>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                {p.teamLogo && (
                  <img src={p.teamLogo} alt="" className="w-3.5 h-3.5 object-contain flex-shrink-0" />
                )}
                <p className="text-xs text-white/35 truncate">{p.teamName}</p>
                <span className="text-xs text-white/20">· {p.apps} apps</span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="text-center">
                <p className="text-lg font-black text-white">{p[statKey]}</p>
                <p className="text-xs text-white/25">{statIcon}</p>
              </div>
              {activeTab === "goals" && p.assists > 0 && (
                <div className="text-center">
                  <p className="text-sm font-bold text-white/40">{p.assists}</p>
                  <p className="text-xs text-white/20">🎯</p>
                </div>
              )}
              {activeTab === "assists" && p.goals > 0 && (
                <div className="text-center">
                  <p className="text-sm font-bold text-white/40">{p.goals}</p>
                  <p className="text-xs text-white/20">⚽</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LeagueNews({ leagueId }) {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${ESPN}/${leagueId}/news`)
      .then(r => r.json())
      .then(d => {
        setNews(d.articles?.slice(0, 10) || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [leagueId]);

  if (loading) return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="glass rounded-xl h-20 animate-pulse" />
      ))}
    </div>
  );

  if (!news.length) return (
    <div className="text-center py-8">
      <p className="text-3xl mb-2">📰</p>
      <p className="text-sm text-white/30">No news available</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {news.map((article, i) => (
        
          key={i}
          href={article.links?.web?.href || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="glass-card rounded-xl overflow-hidden flex gap-3 active:scale-[0.99] transition-all cursor-pointer"
        >
          {article.images?.[0]?.url && (
            <img
              src={article.images[0].url}
              alt=""
              className="w-24 h-20 object-cover flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0 py-2 pr-3">
            <p className="text-xs font-black text-white line-clamp-2 leading-tight">
              {article.headline}
            </p>
            <p className="text-xs text-white/30 mt-1 line-clamp-2 leading-relaxed">
              {article.description}
            </p>
            <p className="text-xs text-white/20 mt-1.5">
              {article.published
                ? new Date(article.published).toLocaleDateString(undefined, {
                    day: "numeric", month: "short",
                  })
                : ""}
            </p>
          </div>
        </a>
      ))}
    </div>
  );
}

export default function LeagueDetail({ leagueId, leagueName, leagueFlag, leagueColor, onSelectTeam, onClose }) {
  const [visible, setVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("standings");

  useEffect(() => {
    setTimeout(() => setVisible(true), 10);
  }, []);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 300);
  }

  const tabs = [
    { id: "standings", label: "Standings", icon: "📊" },
    { id: "scorers",   label: "Scorers",   icon: "⚽" },
    { id: "news",      label: "News",      icon: "📰" },
  ];

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
      <div className="flex items-center justify-between px-4 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{
              background: `${leagueColor}40`,
              border: `1px solid ${leagueColor}60`,
            }}
          >
            {leagueFlag}
          </div>
          <div>
            <h2
              className="text-lg font-black text-white"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {leagueName}
            </h2>
            <p className="text-xs text-white/35">2025–26 Season</p>
          </div>
        </div>
        <button
          onClick={handleClose}
          className="w-9 h-9 glass-strong rounded-full flex items-center justify-center hover:bg-white/10"
        >
          <span className="text-white/60 text-xl leading-none">×</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mx-4 mb-4 glass rounded-xl p-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
              activeTab === tab.id ? "text-white" : "text-white/40 hover:text-white/70"
            }`}
            style={activeTab === tab.id ? {
              background: `${leagueColor}60`,
            } : {}}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-8">
        {activeTab === "standings" && (
          <LeagueStandings
            leagueId={leagueId}
            onSelectTeam={onSelectTeam}
          />
        )}
        {activeTab === "scorers" && (
          <TopScorers leagueId={leagueId} />
        )}
        {activeTab === "news" && (
          <LeagueNews leagueId={leagueId} />
        )}
      </div>
    </div>
  );
}