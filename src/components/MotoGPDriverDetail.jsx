import { useState, useEffect } from "react";

const MGP_PROXY     = "/api/motogp";
const SEASON_UUID   = "e88b4e43-2209-47aa-8e83-0e0b1cedde6e";
const CATEGORY_UUID = "e8c110ad-64aa-4e8e-8a86-f2f152f6a942";

function mgp(path) {
  return `${MGP_PROXY}?path=${encodeURIComponent(path)}`;
}

// Handles two shapes:
//   From MotoGPPage standings → s.rider = { id, full_name, number, country, pictures }
//   From FavouritesTab        → { id, name, number, team, sport }
function normaliseRider(rider) {
  return {
    id:          rider.id,
    name:        rider.full_name || rider.name,
    number:      rider.number,
    nationality: rider.country?.name,
    flag:        rider.country?.iso,
    logo:        rider.pictures?.profile?.main || rider.logo || null,
  };
}

async function fetchMotoGPRiderStats(riderId) {
  if (!riderId) return null;
  try {
    // 1. Rider profile (bio + career timeline)
    const profileRes = await fetch(mgp(`riders/${riderId}`));
    const profile    = await profileRes.json();

    const career = (profile.career || [])
      .filter(c => c.category?.name === "MotoGP")
      .sort((a, b) => b.season - a.season);

    // 2. Current season standings to get live points/position/wins
    const standingsRes  = await fetch(
      mgp(`results/standings?seasonUuid=${SEASON_UUID}&categoryUuid=${CATEGORY_UUID}`)
    );
    const standingsData = await standingsRes.json();
    const currentStanding = (standingsData.classification || [])
      .find(s => s.rider?.id === riderId);

    // 3. Career stats (not always present in the API)
    const careerStats = {
      wins:    profile.career_stats?.total_wins    ?? null,
      poles:   profile.career_stats?.total_poles   ?? null,
      podiums: profile.career_stats?.total_podiums ?? null,
      races:   profile.career_stats?.total_races   ?? null,
    };

    return {
      name:        `${profile.name} ${profile.surname}`.trim(),
      nationality: profile.country?.name,
      flag:        profile.country?.flag,
      birthDate:   profile.birth_date,
      birthCity:   profile.birth_city,
      age:         profile.years_old,
      career,
      careerStats,
      currentStanding: currentStanding ? {
        position: currentStanding.position,
        points:   currentStanding.points,
        wins:     currentStanding.race_wins,
      } : null,
    };
  } catch (err) {
    console.warn("MotoGP rider stats error:", err.message);
    return null;
  }
}

export default function MotoGPRiderDetail({ rider, onClose }) {
  const [visible, setVisible] = useState(false);
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  const r = normaliseRider(rider);

  useEffect(() => {
    setTimeout(() => setVisible(true), 10);
    fetchMotoGPRiderStats(r.id).then(s => {
      setStats(s);
      setLoading(false);
    });
  }, []);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 300);
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col"
      style={{
        background:     "rgba(7, 10, 18, 0.98)",
        backdropFilter: "blur(30px)",
        transform:      visible ? "translateY(0)" : "translateY(100%)",
        transition:     "transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {r.logo ? (
            <img src={r.logo} alt="" className="w-14 h-14 object-contain rounded-xl flex-shrink-0" />
          ) : (
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(245,158,11,0.15)", border: "2px solid rgba(245,158,11,0.4)" }}
            >
              <span className="text-lg font-black text-yellow-400">
                {r.number || "🏍️"}
              </span>
            </div>
          )}
          <div className="min-w-0">
            <h2
              className="text-lg font-black text-white leading-tight truncate"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {stats?.name || r.name}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              {stats?.flag && (
                <img src={stats.flag} alt="" className="w-4 h-3 object-cover rounded-sm" />
              )}
              <span className="text-xs text-white/40">
                {stats?.nationality || r.nationality || "MotoGP"}
              </span>
              {r.number && (
                <span className="text-xs text-yellow-400/70">#{r.number}</span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={handleClose}
          className="w-9 h-9 glass-strong rounded-full flex items-center justify-center hover:bg-white/10 flex-shrink-0"
        >
          <span className="text-white/60 text-xl leading-none">×</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-4">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass rounded-xl h-20 animate-pulse"
                style={{ animationDelay: `${i * 80}ms` }} />
            ))}
          </div>
        ) : !stats ? (
          <div className="text-center py-12">
            <p className="text-3xl mb-2">🏍️</p>
            <p className="text-sm text-white/30">No stats available</p>
          </div>
        ) : (
          <>
            {/* 2026 Season */}
            {stats.currentStanding && (
              <div className="glass-card rounded-2xl p-4">
                <p className="text-xs text-white/30 font-semibold uppercase tracking-widest mb-3">
                  2026 Season
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      label: "Position",
                      value: `P${stats.currentStanding.position}`,
                      color: stats.currentStanding.position === 1 ? "#f59e0b" :
                             stats.currentStanding.position === 2 ? "#cbd5e1" :
                             stats.currentStanding.position === 3 ? "#92400e" : "white",
                    },
                    { label: "Points", value: stats.currentStanding.points, color: "#10b981" },
                    { label: "Wins",   value: stats.currentStanding.wins,   color: "#f59e0b" },
                  ].map(s => (
                    <div key={s.label} className="glass rounded-xl p-3 text-center">
                      <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
                      <p className="text-xs text-white/30 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Career stats — only shown if API returns them */}
            {(stats.careerStats.wins !== null || stats.careerStats.races !== null) && (
              <div className="glass-card rounded-2xl p-4">
                <p className="text-xs text-white/30 font-semibold uppercase tracking-widest mb-3">
                  MotoGP Career
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Races",   value: stats.careerStats.races   ?? "—", color: "white"   },
                    { label: "Wins",    value: stats.careerStats.wins    ?? "—", color: "#f59e0b" },
                    { label: "Podiums", value: stats.careerStats.podiums ?? "—", color: "#10b981" },
                    { label: "Poles",   value: stats.careerStats.poles   ?? "—", color: "#8b5cf6" },
                  ].map(s => (
                    <div key={s.label} className="glass rounded-xl p-3 text-center">
                      <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
                      <p className="text-xs text-white/30 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Profile */}
            <div className="glass-card rounded-2xl p-4">
              <p className="text-xs text-white/30 font-semibold uppercase tracking-widest mb-3">
                Profile
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Age",          value: stats.age ? `${stats.age} yrs` : "—" },
                  { label: "Born",         value: stats.birthCity || "—" },
                  { label: "MotoGP Since", value: stats.career.length
                      ? stats.career[stats.career.length - 1].season : "—" },
                  { label: "Seasons",      value: stats.career.length || "—" },
                ].map(s => (
                  <div key={s.label} className="glass rounded-xl p-3">
                    <p className="text-xs text-white/30">{s.label}</p>
                    <p className="text-sm font-bold text-white mt-0.5">{s.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Career timeline */}
            {stats.career.length > 0 && (
              <div className="glass-card rounded-2xl p-4">
                <p className="text-xs text-white/30 font-semibold uppercase tracking-widest mb-3">
                  MotoGP Career Timeline
                </p>
                <div className="space-y-2">
                  {stats.career.map(c => {
                    const teamColor = c.team?.color || "#f59e0b";
                    const isCurrent = c.current;
                    return (
                      <div
                        key={c.season}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${
                          isCurrent ? "glass-strong ring-1 ring-yellow-400/30" : "glass"
                        }`}
                      >
                        <span className="text-sm font-black text-white/60 w-10 flex-shrink-0">
                          {c.season}
                        </span>
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {c.team?.picture ? (
                            <img src={c.team.picture} alt=""
                              className="w-6 h-6 object-contain flex-shrink-0" />
                          ) : (
                            <div className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ background: teamColor }} />
                          )}
                          <span className="text-xs font-semibold text-white truncate">
                            {c.sponsored_team || c.team?.name}
                          </span>
                          {isCurrent && (
                            <span className="text-xs text-yellow-400/70 flex-shrink-0">
                              Current
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-bold text-white/40 flex-shrink-0">
                          #{c.number}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}