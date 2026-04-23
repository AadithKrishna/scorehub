import { useState, useEffect } from "react";

const JOLPICA = "https://api.jolpi.ca/ergast/f1";

const TEAM_COLORS = {
  red_bull:     "#3671C6", mercedes:     "#27F4D2", ferrari:      "#E8002D",
  mclaren:      "#FF8000", alpine:       "#FF87BC", aston_martin: "#229971",
  williams:     "#64C4FF", haas:         "#B6BABD", sauber:       "#52E252",
  rb:           "#6692FF", toro_rosso:   "#4E7C9B", racing_point: "#F596C8",
  renault:      "#FFF500", force_india:  "#FF80C7", lotus_f1:     "#FFB800",
  brawn:        "#99FF00", toyota:       "#CC0000", bmw_sauber:   "#1E90FF",
};

// Two shapes:
//   F1Page standings → s.Driver = { driverId, givenName, familyName, nationality, permanentNumber, dateOfBirth }
//   FavouritesTab    → { id, name, number, nationality, sport }
function normalise(driver) {
  return {
    driverId:    driver.driverId || driver.id,
    name:        driver.name     || `${driver.givenName ?? ""} ${driver.familyName ?? ""}`.trim(),
    number:      driver.permanentNumber || driver.number,
    nationality: driver.nationality,
    dob:         driver.dateOfBirth || null,
  };
}

async function fetchStats(driverId) {
  if (!driverId) return null;
  try {
    const [winsRes, polesRes, p2Res, p3Res, racesRes, page1Res] = await Promise.all([
      fetch(`${JOLPICA}/drivers/${driverId}/results/1.json?limit=500`).then(r => r.json()),
      fetch(`${JOLPICA}/drivers/${driverId}/qualifying/1.json?limit=500`).then(r => r.json()),
      fetch(`${JOLPICA}/drivers/${driverId}/results/2.json?limit=500`).then(r => r.json()),
      fetch(`${JOLPICA}/drivers/${driverId}/results/3.json?limit=500`).then(r => r.json()),
      fetch(`${JOLPICA}/drivers/${driverId}/results.json?limit=1`).then(r => r.json()),
      fetch(`${JOLPICA}/drivers/${driverId}/driverStandings.json?limit=100&offset=0`).then(r => r.json()),
    ]);

    const wins    = parseInt(winsRes.MRData?.total   || 0);
    const poles   = parseInt(polesRes.MRData?.total  || 0);
    const p2s     = parseInt(p2Res.MRData?.total     || 0);
    const p3s     = parseInt(p3Res.MRData?.total     || 0);
    const races   = parseInt(racesRes.MRData?.total  || 0);
    const podiums = wins + p2s + p3s;

    const totalSeasons = parseInt(page1Res.MRData?.total || 0);
    let allLists = page1Res.MRData?.StandingsTable?.StandingsLists || [];

    // Fetch next page if driver has more than 100 seasons (future-proof)
    if (totalSeasons > 100) {
      const page2 = await fetch(
        `${JOLPICA}/drivers/${driverId}/driverStandings.json?limit=100&offset=100`
      ).then(r => r.json());
      allLists = [...allLists, ...(page2.MRData?.StandingsTable?.StandingsLists || [])];
    }

    const seasons = allLists
      .map(list => {
        const s = list.DriverStandings?.[0];
        if (!s) return null;
        return {
          season:   list.season,
          position: parseInt(s.position),
          points:   parseFloat(s.points),
          wins:     parseInt(s.wins),
          team:     s.Constructors?.[0]?.name          || "—",
          teamId:   s.Constructors?.[0]?.constructorId || "",
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.season - a.season);

    return {
      wins, poles, podiums, races,
      winRate:  races > 0 ? ((wins  / races) * 100).toFixed(1) : "0.0",
      poleRate: races > 0 ? ((poles / races) * 100).toFixed(1) : "0.0",
      seasons,
      totalSeasons,
    };
  } catch (err) {
    console.warn("F1 stats error:", err.message);
    return null;
  }
}

export default function F1DriverDetail({ driver, onClose }) {
  const [visible, setVisible] = useState(false);
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  const d = normalise(driver);

  useEffect(() => {
    setTimeout(() => setVisible(true), 10);
    fetchStats(d.driverId).then(s => { setStats(s); setLoading(false); });
  }, []);

  function handleClose() { setVisible(false); setTimeout(onClose, 300); }

  const champions = stats?.seasons.filter(s => s.position === 1) || [];

  const dobStr = d.dob
    ? new Date(d.dob).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col"
      style={{
        background:     "rgba(7,10,18,0.98)",
        backdropFilter: "blur(30px)",
        transform:      visible ? "translateY(0)" : "translateY(100%)",
        transition:     "transform 0.35s cubic-bezier(0.32,0.72,0,1)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4 border-b border-white/6">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(239,68,68,0.15)", border: "2px solid rgba(239,68,68,0.4)" }}
          >
            <span className="text-lg font-black text-red-400">{d.number || "F1"}</span>
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-black text-white leading-tight truncate"
              style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
              {d.name}
            </h2>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-xs text-white/40">{d.nationality}</span>
              {dobStr && <span className="text-xs text-white/25">· {dobStr}</span>}
              {champions.length > 0 && (
                <span className="text-xs text-yellow-400">· {champions.length}× 🏆</span>
              )}
            </div>
          </div>
        </div>
        <button onClick={handleClose}
          className="w-9 h-9 glass-strong rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white/60 text-xl leading-none">×</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-10 space-y-4 pt-4">
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="glass rounded-xl h-20 animate-pulse"
                style={{ animationDelay: `${i*80}ms` }} />
            ))}
          </div>
        ) : !stats ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🏎️</p>
            <p className="text-sm text-white/30">No stats available</p>
          </div>
        ) : (
          <>
            {/* Career totals */}
            <div className="glass-card rounded-2xl p-4">
              <p className="text-xs text-white/30 font-semibold uppercase tracking-widest mb-3">
                Career Stats
              </p>
              <div className="grid grid-cols-3 gap-2 mb-2">
                {[
                  { label: "Races",   value: stats.races,   color: "white"   },
                  { label: "Wins",    value: stats.wins,    color: "#f59e0b" },
                  { label: "Podiums", value: stats.podiums, color: "#10b981" },
                ].map(s => (
                  <div key={s.label} className="glass rounded-xl p-3 text-center">
                    <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-xs text-white/30 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Poles",  value: stats.poles,          color: "#8b5cf6" },
                  { label: "Win %",  value: `${stats.winRate}%`,  color: "#f59e0b" },
                  { label: "Pole %", value: `${stats.poleRate}%`, color: "#8b5cf6" },
                ].map(s => (
                  <div key={s.label} className="glass rounded-xl p-3 text-center">
                    <p className="text-lg font-black" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-xs text-white/30 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Championships */}
            {champions.length > 0 && (
              <div className="glass-card rounded-2xl p-4">
                <p className="text-xs text-white/30 font-semibold uppercase tracking-widest mb-3">
                  🏆 World Championships
                </p>
                <div className="flex flex-wrap gap-2">
                  {champions.map(s => (
                    <div key={s.season}
                      className="flex items-center gap-2 glass-strong px-3 py-2 rounded-xl">
                      <span className="text-yellow-400">🏆</span>
                      <span className="font-black text-white">{s.season}</span>
                      <span className="text-xs text-white/40">{s.team}</span>
                      <span className="text-xs text-white/30">{s.points}pts</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All seasons */}
            {stats.seasons.length > 0 && (
              <div className="glass-card rounded-2xl p-4">
                <p className="text-xs text-white/30 font-semibold uppercase tracking-widest mb-3">
                  All Seasons ({stats.seasons.length})
                </p>
                <div className="space-y-1.5">
                  {stats.seasons.map(s => {
                    const color   = TEAM_COLORS[s.teamId] || "#8b5cf6";
                    const isChamp = s.position === 1;
                    return (
                      <div key={s.season}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${
                          isChamp ? "glass-strong ring-1 ring-yellow-400/30" : "glass"
                        }`}
                      >
                        <span className="text-sm font-black text-white/50 w-10 flex-shrink-0 tabular-nums">
                          {s.season}
                        </span>
                        <div className="flex-1 min-w-0 flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ background: color }} />
                          <span className="text-xs font-semibold text-white truncate">{s.team}</span>
                          {isChamp && <span className="text-xs">🏆</span>}
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className={`text-sm font-black tabular-nums ${
                            s.position === 1 ? "text-yellow-400" :
                            s.position === 2 ? "text-slate-300"  :
                            s.position === 3 ? "text-amber-600"  : "text-white/50"
                          }`}>P{s.position}</span>
                          <span className="text-xs text-white w-12 text-right tabular-nums">
                            {s.points}<span className="text-white/30">pts</span>
                          </span>
                          {s.wins > 0 && (
                            <span className="text-xs font-bold text-yellow-400 w-6 text-right">
                              {s.wins}W
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {stats.totalSeasons > stats.seasons.length && (
                  <p className="text-xs text-white/20 text-center mt-3">
                    Showing {stats.seasons.length} of {stats.totalSeasons} seasons
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}