import { useState, useEffect } from "react";

const MGP_PROXY     = "/api/motogp";
const SEASON_UUID   = "e88b4e43-2209-47aa-8e83-0e0b1cedde6e";
const CATEGORY_UUID = "e8c110ad-64aa-4e8e-8a86-f2f152f6a942";

function mgp(path) {
  return `${MGP_PROXY}?path=${encodeURIComponent(path)}`;
}

// Two shapes:
//   MotoGPPage standings → s.rider = { id, full_name, number, country:{name,iso,flag}, pictures }
//   FavouritesTab        → { id, name, number, team, sport, logo }  ← no country, no full_name
function normalise(rider) {
  return {
    id:     rider.id,
    name:   rider.full_name || rider.name,
    number: rider.number,
    logo:   rider.pictures?.profile?.main || rider.logo || null,
  };
}

async function fetchStats(riderId) {
  if (!riderId) return null;

  const [profileRes, standingsRes] = await Promise.allSettled([
    fetch(mgp(`riders/${riderId}`)).then(r => r.json()),
    fetch(mgp(`results/standings?seasonUuid=${SEASON_UUID}&categoryUuid=${CATEGORY_UUID}`))
      .then(r => r.json()),
  ]);

  const profile = profileRes.status === "fulfilled" ? profileRes.value : null;
  if (!profile || profile.error) {
    console.warn("MotoGP profile fetch failed for riderId:", riderId, profile);
    return null;
  }

  const career = (profile.career || [])
    .filter(c => c.category?.name === "MotoGP")
    .sort((a, b) => b.season - a.season);

  const standings = standingsRes.status === "fulfilled" ? standingsRes.value : null;
  const current   = (standings?.classification || []).find(s => s.rider?.id === riderId);

  const cs = profile.career_stats;
  const careerStats = {
    races:   cs?.total_races   ?? null,
    wins:    cs?.total_wins    ?? null,
    podiums: cs?.total_podiums ?? null,
    poles:   cs?.total_poles   ?? null,
  };

  const debut = career.length ? career[career.length - 1].season : null;

  return {
    // Always from API — identical regardless of which tab opened this
    name:        `${profile.name} ${profile.surname}`.trim(),
    nationality: profile.country?.name  || null,
    flagUrl:     profile.country?.flag  || null,
    birthDate:   profile.birth_date     || null,
    birthCity:   profile.birth_city     || null,
    age:         profile.years_old      || null,
    number:      career[0]?.number      ?? null,
    photo:       profile.current_career_step?.pictures?.profile?.main
                 || profile.pictures?.profile?.main
                 || null,
    career,
    debut,
    careerStats,
    hasCareerStats: Object.values(careerStats).some(v => v !== null),
    current: current ? {
      position: current.position,
      points:   current.points,
      wins:     current.race_wins,
    } : null,
  };
}

export default function MotoGPRiderDetail({ rider, onClose }) {
  const [visible, setVisible] = useState(false);
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  const r = normalise(rider);

  useEffect(() => {
    setTimeout(() => setVisible(true), 10);
    fetchStats(r.id)
      .then(s => {
        if (!s) setError(true);
        setStats(s);
        setLoading(false);
      })
      .catch(err => {
        console.warn("MotoGP detail error:", err);
        setError(true);
        setLoading(false);
      });
  }, []);

  function handleClose() { setVisible(false); setTimeout(onClose, 300); }

  // Always use API values once loaded — consistent from both tabs
  const name   = stats?.name       || r.name;
  const nat    = stats?.nationality || null;
  const flag   = stats?.flagUrl     || null;
  const photo  = stats?.photo       || r.logo || null;
  const number = stats?.number      || r.number;

  const dobStr = stats?.birthDate
    ? new Date(stats.birthDate).toLocaleDateString("en-US", {
        day: "numeric", month: "long", year: "numeric",
      })
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
          {photo ? (
            <img src={photo} alt="" className="w-14 h-14 object-contain rounded-xl flex-shrink-0" />
          ) : (
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(245,158,11,0.15)", border: "2px solid rgba(245,158,11,0.4)" }}
            >
              <span className="text-lg font-black text-yellow-400">{number || "🏍️"}</span>
            </div>
          )}
          <div className="min-w-0">
            <h2 className="text-xl font-black text-white leading-tight truncate"
              style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
              {name}
            </h2>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {flag   && <img src={flag} alt="" className="w-4 h-3 object-cover rounded-sm flex-shrink-0" />}
              {nat    && <span className="text-xs text-white/40">{nat}</span>}
              {number && <span className="text-xs text-yellow-400/70">#{number}</span>}
              {stats?.age && <span className="text-xs text-white/25">· {stats.age} yrs</span>}
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
        ) : error || !stats ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🏍️</p>
            <p className="text-sm text-white/30">Stats unavailable</p>
            <p className="text-xs text-white/15 mt-1">Check browser console for details</p>
          </div>
        ) : (
          <>
            {/* 2026 Season */}
            {stats.current && (
              <div className="glass-card rounded-2xl p-4">
                <p className="text-xs text-white/30 font-semibold uppercase tracking-widest mb-3">
                  2026 Season
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      label: "Position",
                      value: `P${stats.current.position}`,
                      color: stats.current.position === 1 ? "#f59e0b" :
                             stats.current.position === 2 ? "#cbd5e1" :
                             stats.current.position === 3 ? "#92400e" : "white",
                    },
                    { label: "Points", value: stats.current.points, color: "#10b981" },
                    { label: "Wins",   value: stats.current.wins,   color: "#f59e0b" },
                  ].map(s => (
                    <div key={s.label} className="glass rounded-xl p-3 text-center">
                      <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
                      <p className="text-xs text-white/30 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Career totals — only if API returns them */}
            {stats.hasCareerStats && (
              <div className="glass-card rounded-2xl p-4">
                <p className="text-xs text-white/30 font-semibold uppercase tracking-widest mb-3">
                  Career Stats
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Races",   value: stats.careerStats.races   ?? "—", color: "white"   },
                    { label: "Wins",    value: stats.careerStats.wins    ?? "—", color: "#f59e0b" },
                    { label: "Podiums", value: stats.careerStats.podiums ?? "—", color: "#10b981" },
                    { label: "Poles",   value: stats.careerStats.poles   ?? "—", color: "#8b5cf6" },
                  ].map(s => (
                    <div key={s.label} className="glass rounded-xl p-3 text-center">
                      <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
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
                  { label: "Nationality",   value: nat                || "—" },
                  { label: "Hometown",      value: stats.birthCity    || "—" },
                  { label: "Date of Birth", value: dobStr             || "—" },
                  { label: "MotoGP Debut",  value: stats.debut ? `${stats.debut} season` : "—" },
                  { label: "Seasons",       value: stats.career.length || "—" },
                  { label: "Bike #",        value: number ? `#${number}` : "—" },
                ].map(s => (
                  <div key={s.label} className="glass rounded-xl p-3">
                    <p className="text-xs text-white/30">{s.label}</p>
                    <p className="text-sm font-bold text-white mt-0.5 truncate">{s.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Career timeline */}
            {stats.career.length > 0 && (
              <div className="glass-card rounded-2xl p-4">
                <p className="text-xs text-white/30 font-semibold uppercase tracking-widest mb-3">
                  MotoGP Seasons ({stats.career.length})
                </p>
                <div className="space-y-1.5">
                  {stats.career.map(c => {
                    const color     = c.team?.color || "#f59e0b";
                    const isCurrent = c.current;
                    return (
                      <div key={c.season}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${
                          isCurrent ? "glass-strong ring-1 ring-yellow-400/30" : "glass"
                        }`}
                      >
                        <span className="text-sm font-black text-white/50 w-10 flex-shrink-0 tabular-nums">
                          {c.season}
                        </span>
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {c.team?.picture ? (
                            <img src={c.team.picture} alt=""
                              className="w-5 h-5 object-contain flex-shrink-0" />
                          ) : (
                            <div className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ background: color }} />
                          )}
                          <span className="text-xs font-semibold text-white truncate">
                            {c.sponsored_team || c.team?.name || "—"}
                          </span>
                          {isCurrent && (
                            <span className="text-xs text-yellow-400/70 flex-shrink-0">Current</span>
                          )}
                        </div>
                        <span className="text-xs font-bold text-white/35 flex-shrink-0">
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