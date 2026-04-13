import { useState, useEffect } from "react";

const ESPN = "https://site.api.espn.com/apis/site/v2/sports/soccer";
const ESPN_V2 = "https://site.api.espn.com/apis/v2/sports/soccer";

const LEAGUES = [
  { id: "eng.1",          name: "Premier League",  flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", color: "#3d195b" },
  { id: "esp.1",          name: "La Liga",          flag: "🇪🇸", color: "#ee8707" },
  { id: "ger.1",          name: "Bundesliga",       flag: "🇩🇪", color: "#d00027" },
  { id: "ita.1",          name: "Serie A",          flag: "🇮🇹", color: "#1a1a2e" },
  { id: "fra.1",          name: "Ligue 1",          flag: "🇫🇷", color: "#003189" },
  { id: "uefa.champions", name: "Champions League", flag: "⭐", color: "#0a1172" },
  { id: "uefa.europa",    name: "Europa League",    flag: "🟠", color: "#f37021" },
];

function getStatVal(stats, name) {
  return stats?.find(s => s.name === name)?.value ?? 0;
}

// ── League Standings ──────────────────────────────────

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
      {/* Header row */}
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
              onClick={() => onSelectTeam(entry.team, leagueId)}
              className="flex items-center px-3 py-2.5 glass-card rounded-xl cursor-pointer hover:bg-white/5 transition-all active:scale-[0.99]"
              style={zoneColor ? { borderLeft: `3px solid ${zoneColor}` } : {}}
            >
              <span className={`w-6 text-center text-xs font-black tabular-nums ${
                rank <= 3 ? "text-yellow-400" : "text-white/30"
              }`}>
                {rank}
              </span>
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
              }`}>
                {gd > 0 ? `+${gd}` : gd}
              </span>
              <span className="w-8 text-center text-xs font-black text-white tabular-nums">{pts}</span>
            </div>
          );
        })}
      </div>

      {/* Zone legend */}
      <div className="mt-3 px-3 space-y-1">
        {[
          { color: "#f59e0b", label: "Champions / Title" },
          { color: "#3b82f6", label: "Champions League" },
          { color: "#f97316", label: "Europa / Conference" },
          { color: "#ef4444", label: "Relegation" },
        ].map(z => (
          <div key={z.label} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: z.color }} />
            <span className="text-xs text-white/25">{z.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Top Scorers ───────────────────────────────────────

function TopScorers({ leagueId }) {
  const [scorers, setScorers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${ESPN}/${leagueId}/scoreboard`)
      .then(r => r.json())
      .then(d => {
        const map = {};
        (d.events || []).forEach(event => {
          event.competitions?.[0]?.competitors?.forEach(comp => {
            comp.leaders?.forEach(leader => {
              if (leader.name === "goals") {
                leader.leaders?.forEach(l => {
                  const id = l.athlete?.id;
                  if (!id || map[id]) return;
                  map[id] = {
                    name: l.athlete?.displayName,
                    goals: l.value,
                    team: comp.team?.displayName,
                    logo: comp.team?.logo,
                  };
                });
              }
            });
          });
        });
        const sorted = Object.values(map).sort((a, b) => b.goals - a.goals);
        setScorers(sorted);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [leagueId]);

  if (loading) return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="glass rounded-xl h-14 animate-pulse" />
      ))}
    </div>
  );

  if (!scorers.length) return (
    <div className="text-center py-8">
      <p className="text-3xl mb-2">⚽</p>
      <p className="text-sm text-white/30">No scorer data available</p>
    </div>
  );

  return (
    <div className="space-y-2">
      {scorers.slice(0, 20).map((s, i) => (
        <div key={s.name + i} className="glass-card rounded-xl px-4 py-2.5 flex items-center gap-3">
          <span className={`text-sm font-black w-5 text-center tabular-nums ${
            i === 0 ? "text-yellow-400" :
            i === 1 ? "text-slate-300" :
            i === 2 ? "text-amber-600" :
            "text-white/30"
          }`}>
            {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{s.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {s.logo && <img src={s.logo} alt="" className="w-3.5 h-3.5 object-contain" />}
              <p className="text-xs text-white/35 truncate">{s.team}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-black text-white">{s.goals}</span>
            <span className="text-xs text-white/30">⚽</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── League News ───────────────────────────────────────

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
        <a
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

// ── Team Detail ───────────────────────────────────────

function TeamDetail({ team, leagueId, onClose }) {
  const [visible, setVisible] = useState(false);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setVisible(true), 10);
    fetch(`${ESPN}/${leagueId}/teams/${team.id}`)
      .then(r => r.json())
      .then(d => {
        setDetails(d.team);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 300);
  }

  const record = details?.record?.items?.[0];
  const stats = record?.stats || [];
  const gs = (name) => stats.find(s => s.name === name)?.value ?? 0;
  const teamColor = `#${team.color || details?.color || "8b5cf6"}`;

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
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {(team.logos?.[0]?.href || details?.logos?.[0]?.href) && (
            <img
              src={team.logos?.[0]?.href || details?.logos?.[0]?.href}
              alt=""
              className="w-12 h-12 object-contain"
            />
          )}
          <div>
            <h2
              className="text-lg font-black text-white"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {team.displayName}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: teamColor }}>
              {details?.standingSummary || ""}
            </p>
          </div>
        </div>
        <button
          onClick={handleClose}
          className="w-9 h-9 glass-strong rounded-full flex items-center justify-center hover:bg-white/10 flex-shrink-0"
        >
          <span className="text-white/60 text-xl leading-none">×</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-8">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass rounded-xl h-20 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">

            {/* Season record */}
            <div className="glass-card rounded-2xl p-4">
              <p className="text-xs text-white/30 font-semibold uppercase tracking-widest mb-3">
                Season Record
              </p>
              <div className="grid grid-cols-4 gap-3 mb-3">
                {[
                  { label: "Played", value: gs("gamesPlayed"),  color: null       },
                  { label: "Won",    value: gs("wins"),          color: "#10b981"  },
                  { label: "Drawn",  value: gs("ties"),          color: "#f59e0b"  },
                  { label: "Lost",   value: gs("losses"),        color: "#ef4444"  },
                ].map(s => (
                  <div key={s.label} className="glass rounded-xl p-2.5 text-center">
                    <p className="text-lg font-black" style={{ color: s.color || "white" }}>
                      {s.value}
                    </p>
                    <p className="text-xs text-white/30 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Goals For",     value: gs("pointsFor"),          color: null                                              },
                  { label: "Goals Against", value: gs("pointsAgainst"),      color: null                                              },
                  { label: "Goal Diff",     value: gs("pointDifferential"),  color: gs("pointDifferential") > 0 ? "#10b981" : "#ef4444" },
                ].map(s => (
                  <div key={s.label} className="glass rounded-xl p-2.5 text-center">
                    <p className="text-lg font-black" style={{ color: s.color || "white" }}>
                      {s.label === "Goal Diff" && s.value > 0 ? `+${s.value}` : s.value}
                    </p>
                    <p className="text-xs text-white/30 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Home vs Away */}
            <div className="glass-card rounded-2xl p-4">
              <p className="text-xs text-white/30 font-semibold uppercase tracking-widest mb-3">
                Home vs Away
              </p>
              <div className="space-y-2">
                {[
                  {
                    label: "Home",
                    w:  gs("homeWins"),
                    d:  gs("homeTies"),
                    l:  gs("homeLosses"),
                    gf: gs("homePointsFor"),
                    ga: gs("homePointsAgainst"),
                  },
                  {
                    label: "Away",
                    w:  gs("awayWins"),
                    d:  gs("awayTies"),
                    l:  gs("awayLosses"),
                    gf: gs("awayPointsFor"),
                    ga: gs("awayPointsAgainst"),
                  },
                ].map(row => (
                  <div key={row.label} className="glass rounded-xl px-3 py-2.5 flex items-center justify-between">
                    <span className="text-xs font-bold text-white/60 w-10">{row.label}</span>
                    <div className="flex gap-3 text-xs tabular-nums">
                      <span className="text-green-400 font-semibold">{row.w}W</span>
                      <span className="text-yellow-400/70">{row.d}D</span>
                      <span className="text-red-400/70">{row.l}L</span>
                    </div>
                    <span className="text-xs text-white/30">{row.gf} — {row.ga}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Next fixture */}
            {details?.nextEvent?.[0] && (() => {
              const match = details.nextEvent[0];
              const comp = match.competitions?.[0];
              const home = comp?.competitors?.find(c => c.homeAway === "home");
              const away = comp?.competitors?.find(c => c.homeAway === "away");
              const odds = comp?.odds?.[0];
              const dt = new Date(match.date);

              return (
                <div className="glass-card rounded-2xl p-4">
                  <p className="text-xs text-white/30 font-semibold uppercase tracking-widest mb-3">
                    Next Match
                  </p>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex flex-col items-center gap-1.5 flex-1">
                      <img src={home?.team?.logos?.[0]?.href} alt=""
                        className="w-10 h-10 object-contain" />
                      <p className="text-xs font-bold text-white text-center">
                        {home?.team?.shortDisplayName}
                      </p>
                    </div>
                    <div className="flex flex-col items-center px-3">
                      <p className="text-xs font-black text-white/60">vs</p>
                      <p className="text-xs text-white/30 mt-1">
                        {dt.toLocaleDateString(undefined, {
                          weekday: "short", day: "numeric", month: "short",
                        })}
                      </p>
                      <p className="text-xs text-white/50 font-bold">
                        {dt.toLocaleTimeString(undefined, {
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="flex flex-col items-center gap-1.5 flex-1">
                      <img src={away?.team?.logos?.[0]?.href} alt=""
                        className="w-10 h-10 object-contain" />
                      <p className="text-xs font-bold text-white text-center">
                        {away?.team?.shortDisplayName}
                      </p>
                    </div>
                  </div>
                  {comp?.venue && (
                    <p className="text-xs text-white/25 text-center mb-2">
                      📍 {comp.venue.fullName}
                    </p>
                  )}
                  {odds && (
                    <div className="glass rounded-xl px-3 py-2 flex items-center justify-between">
                      <div className="text-center flex-1">
                        <p className="text-xs text-white/30">Home</p>
                        <p className="text-sm font-black text-white">
                          {odds.homeTeamOdds?.moneyLine > 0
                            ? `+${odds.homeTeamOdds.moneyLine}`
                            : odds.homeTeamOdds?.moneyLine}
                        </p>
                      </div>
                      <div className="text-center flex-1">
                        <p className="text-xs text-white/30">Draw</p>
                        <p className="text-sm font-black text-white">
                          {odds.drawOdds?.moneyLine > 0
                            ? `+${odds.drawOdds.moneyLine}`
                            : odds.drawOdds?.moneyLine || "—"}
                        </p>
                      </div>
                      <div className="text-center flex-1">
                        <p className="text-xs text-white/30">Away</p>
                        <p className="text-sm font-black text-white">
                          {odds.awayTeamOdds?.moneyLine > 0
                            ? `+${odds.awayTeamOdds.moneyLine}`
                            : odds.awayTeamOdds?.moneyLine}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}

// ── League Selector ───────────────────────────────────

function LeagueSelector({ active, onSelect }) {
  return (
    <div className="flex gap-2 px-4 mb-4 overflow-x-auto no-scrollbar">
      {LEAGUES.map(l => (
        <button
          key={l.id}
          onClick={() => onSelect(l.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            active === l.id
              ? "text-white"
              : "glass text-white/50 hover:text-white/80"
          }`}
          style={active === l.id ? {
            background: `${l.color}60`,
            border: `1px solid ${l.color}80`,
          } : {}}
        >
          <span>{l.flag}</span>
          {l.name}
        </button>
      ))}
    </div>
  );
}

// ── Main Football Page ────────────────────────────────

export default function FootballPage() {
  const [activeLeague, setActiveLeague] = useState("eng.1");
  const [activeTab, setActiveTab] = useState("standings");
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedLeagueId, setSelectedLeagueId] = useState(null);

  const league = LEAGUES.find(l => l.id === activeLeague);

  const tabs = [
    { id: "standings", label: "Standings", icon: "📊" },
    { id: "scorers",   label: "Scorers",   icon: "⚽" },
    { id: "news",      label: "News",      icon: "📰" },
  ];

  return (
    <div className="pb-8">
      {selectedTeam && (
        <TeamDetail
          team={selectedTeam}
          leagueId={selectedLeagueId}
          onClose={() => {
            setSelectedTeam(null);
            setSelectedLeagueId(null);
          }}
        />
      )}

      {/* Header */}
      <div className="px-4 pt-2 pb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{
              background: `${league?.color}40` || "rgba(139,92,246,0.2)",
              border: `1px solid ${league?.color}60` || "rgba(139,92,246,0.4)",
            }}
          >
            {league?.flag}
          </div>
          <div>
            <h2
              className="text-base font-black text-white"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Football
            </h2>
            <p className="text-xs text-white/35">2025–26 Season</p>
          </div>
        </div>
      </div>

      {/* League selector */}
      <LeagueSelector
        active={activeLeague}
        onSelect={(id) => {
          setActiveLeague(id);
          setActiveTab("standings");
        }}
      />

      {/* Sub tabs */}
      <div className="flex gap-1 mx-4 mb-4 glass rounded-xl p-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
              activeTab === tab.id ? "text-white" : "text-white/40 hover:text-white/70"
            }`}
            style={activeTab === tab.id ? {
              background: `${league?.color}60` || "rgba(139,92,246,0.5)",
            } : {}}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-4">
        {activeTab === "standings" && (
          <LeagueStandings
            key={activeLeague}
            leagueId={activeLeague}
            onSelectTeam={(team, leagueId) => {
              setSelectedTeam(team);
              setSelectedLeagueId(leagueId);
            }}
          />
        )}
        {activeTab === "scorers" && (
          <TopScorers key={activeLeague} leagueId={activeLeague} />
        )}
        {activeTab === "news" && (
          <LeagueNews key={activeLeague} leagueId={activeLeague} />
        )}
      </div>
    </div>
  );
}