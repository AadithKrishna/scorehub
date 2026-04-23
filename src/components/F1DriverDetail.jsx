import { useState, useEffect } from "react";

const TEAM_COLORS = {
  red_bull:    "#3671C6", mercedes:   "#27F4D2", ferrari:     "#E8002D",
  mclaren:     "#FF8000", alpine:     "#FF87BC", aston_martin:"#229971",
  williams:    "#64C4FF", haas:       "#B6BABD", sauber:      "#52E252",
  rb:          "#6692FF", toro_rosso: "#4E7C9B", racing_point:"#F596C8",
  renault:     "#FFF500", force_india:"#FF80C7", lotus_f1:    "#FFB800",
};

async function fetchF1DriverStats(driverId) {
  try {
    const [winsRes, polesRes, p2Res, p3Res, racesRes] = await Promise.all([
      fetch(`https://api.jolpi.ca/ergast/f1/drivers/${driverId}/results/1.json`).then(r => r.json()),
      fetch(`https://api.jolpi.ca/ergast/f1/drivers/${driverId}/qualifying/1.json`).then(r => r.json()),
      fetch(`https://api.jolpi.ca/ergast/f1/drivers/${driverId}/results/2.json`).then(r => r.json()),
      fetch(`https://api.jolpi.ca/ergast/f1/drivers/${driverId}/results/3.json`).then(r => r.json()),
      fetch(`https://api.jolpi.ca/ergast/f1/drivers/${driverId}/results.json`).then(r => r.json()),
    ]);

    const wins   = parseInt(winsRes.MRData?.total || 0);
    const poles  = parseInt(polesRes.MRData?.total || 0);
    const p2s    = parseInt(p2Res.MRData?.total || 0);
    const p3s    = parseInt(p3Res.MRData?.total || 0);
    const races  = parseInt(racesRes.MRData?.total || 0);
    const podiums = wins + p2s + p3s;

    // Get driver info from first result
    const driverInfo = racesRes.MRData?.RaceTable?.Races?.[0]?.Results?.[0]?.Driver;

    // Fetch season standings for each year the driver competed
    // Get seasons from results
    const seasonResults = racesRes.MRData?.RaceTable?.Races || [];
    const seasons = [...new Set(seasonResults.map(r => r.season))].sort();

    // Fetch standings for each season in parallel (limit to avoid too many calls)
    const recentSeasons = seasons.slice(-12); // last 12 seasons
    const standingsResults = await Promise.allSettled(
      recentSeasons.map(season =>
        fetch(`https://api.jolpi.ca/ergast/f1/${season}/drivers/${driverId}/driverStandings.json`)
          .then(r => r.json())
          .then(d => {
            const s = d.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings?.[0];
            return s ? {
              season,
              position: parseInt(s.position),
              points: parseFloat(s.points),
              wins: parseInt(s.wins),
              team: s.Constructors?.[0]?.name,
              teamId: s.Constructors?.[0]?.constructorId,
            } : null;
          })
      )
    );

    const seasonStats = standingsResults
      .filter(r => r.status === "fulfilled" && r.value)
      .map(r => r.value)
      .sort((a, b) => b.season - a.season);

    return {
      driverInfo,
      wins,
      poles,
      podiums,
      races,
      winRate: races > 0 ? ((wins / races) * 100).toFixed(1) : 0,
      poleRate: races > 0 ? ((poles / races) * 100).toFixed(1) : 0,
      seasonStats,
      allSeasons: seasons,
    };
  } catch (err) {
    console.warn("F1 driver stats error:", err.message);
    return null;
  }
}

export default function F1DriverDetail({ driver, onClose }) {
  const [visible, setVisible] = useState(false);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setVisible(true), 10);
    fetchF1DriverStats(driver.id).then(s => {
      setStats(s);
      setLoading(false);
    });
  }, []);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 300);
  }

  const championSeasons = stats?.seasonStats.filter(s => s.position === 1) || [];

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col"
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
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(239,68,68,0.15)", border: "2px solid rgba(239,68,68,0.4)" }}>
            <span className="text-lg font-black text-red-400">
              {driver.number || "F1"}
            </span>
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-black text-white leading-tight truncate"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {driver.name}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-white/40">{driver.nationality}</span>
              {championSeasons.length > 0 && (
                <>
                  <span className="text-white/20 text-xs">·</span>
                  <span className="text-xs text-yellow-400">
                    {championSeasons.length}× Champion 🏆
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <button onClick={handleClose}
          className="w-9 h-9 glass-strong rounded-full flex items-center justify-center hover:bg-white/10 flex-shrink-0">
          <span className="text-white/60 text-xl leading-none">×</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-4">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="glass rounded-xl h-20 animate-pulse" />
            ))}
          </div>
        ) : !stats ? (
          <div className="text-center py-12">
            <p className="text-3xl mb-2">🏎️</p>
            <p className="text-sm text-white/30">No stats available</p>
          </div>
        ) : (
          <>
            {/* Career stats */}
            <div className="glass-card rounded-2xl p-4">
              <p className="text-xs text-white/30 font-semibold uppercase tracking-widest mb-3">
                Career Stats
              </p>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { label: "Races",   value: stats.races,   color: "white"    },
                  { label: "Wins",    value: stats.wins,    color: "#f59e0b"  },
                  { label: "Podiums", value: stats.podiums, color: "#10b981"  },
                ].map(s => (
                  <div key={s.label} className="glass rounded-xl p-3 text-center">
                    <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-xs text-white/30 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Pole Positions", value: stats.poles,    color: "#8b5cf6" },
                  { label: "Win Rate",       value: `${stats.winRate}%`, color: "#f59e0b" },
                  { label: "Pole Rate",      value: `${stats.poleRate}%`, color: "#8b5cf6" },
                ].map(s => (
                  <div key={s.label} className="glass rounded-xl p-3 text-center">
                    <p className="text-lg font-black" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-xs text-white/30 mt-0.5 leading-tight">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Championships */}
            {championSeasons.length > 0 && (
              <div className="glass-card rounded-2xl p-4">
                <p className="text-xs text-white/30 font-semibold uppercase tracking-widest mb-3">
                  🏆 World Championships
                </p>
                <div className="flex flex-wrap gap-2">
                  {championSeasons.map(s => (
                    <div key={s.season}
                      className="flex items-center gap-2 glass-strong px-3 py-2 rounded-xl">
                      <span className="text-yellow-400 text-sm">🏆</span>
                      <span className="text-sm font-black text-white">{s.season}</span>
                      <span className="text-xs text-white/40">{s.team}</span>
                      <span className="text-xs text-white/30">{s.points}pts</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Season by season */}
            <div className="glass-card rounded-2xl p-4">
              <p className="text-xs text-white/30 font-semibold uppercase tracking-widest mb-3">
                Season History
              </p>
              <div className="space-y-2">
                {stats.seasonStats.map(s => {
                  const teamColor = TEAM_COLORS[s.teamId] || "#8b5cf6";
                  const isChamp = s.position === 1;
                  return (
                    <div key={s.season}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                        isChamp ? "glass-strong ring-1 ring-yellow-400/30" : "glass"
                      }`}
                    >
                      <span className="text-sm font-black text-white/60 w-10 flex-shrink-0">
                        {s.season}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ background: teamColor }} />
                          <span className="text-xs font-semibold text-white truncate">
                            {s.team}
                          </span>
                          {isChamp && <span className="text-xs">🏆</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-center">
                          <p className={`text-sm font-black ${
                            s.position === 1 ? "text-yellow-400" :
                            s.position === 2 ? "text-slate-300" :
                            s.position === 3 ? "text-amber-600" : "text-white/60"
                          }`}>P{s.position}</p>
                        </div>
                        <div className="text-center w-14">
                          <p className="text-xs font-bold text-white">{s.points}</p>
                          <p className="text-xs text-white/25">pts</p>
                        </div>
                        {s.wins > 0 && (
                          <div className="text-center">
                            <p className="text-xs font-bold text-yellow-400">{s.wins}W</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}