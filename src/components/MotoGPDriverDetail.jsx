import { useState, useEffect } from "react";

const MGP_PROXY     = "/api/motogp";
const SEASON_UUID   = "e88b4e43-2209-47aa-8e83-0e0b1cedde6e";
const CATEGORY_UUID = "e8c110ad-64aa-4e8e-8a86-f2f152f6a942";

function mgp(path) {
  return `${MGP_PROXY}?path=${encodeURIComponent(path)}`;
}

function isoToFlag(iso) {
  if (!iso || iso.length !== 2) return "";
  return iso.toUpperCase().replace(/./g, c =>
    String.fromCodePoint(c.charCodeAt(0) + 127397)
  );
}

function normalise(rider) {
  return {
    id:          rider.id,
    name:        rider.full_name || rider.name || "",
    number:      rider.number,
    nationality: rider.country?.name || null,
    flagIso:     rider.country?.iso  || null,
    photo:       rider.pictures?.profile?.main || rider.logo || null,
  };
}

async function fetchAll(rider) {
  const r = normalise(rider);

  const [profileRes, standingsRes] = await Promise.allSettled([
    fetch(mgp(`riders/${r.id}`)).then(res => res.json()),
    fetch(mgp(`results/standings?seasonUuid=${SEASON_UUID}&categoryUuid=${CATEGORY_UUID}`))
      .then(res => res.json()),
  ]);

  const profile   = profileRes.status  === "fulfilled" ? profileRes.value  : null;
  const standings = standingsRes.status === "fulfilled" ? standingsRes.value : null;

  // Match by number first (reliable across both endpoints), fallback to name
  const classification = standings?.classification || [];
  let standing = classification.find(s => s.rider?.number == r.number);
  if (!standing && r.name) {
    standing = classification.find(s =>
      s.rider?.full_name?.toLowerCase() === r.name.toLowerCase()
    );
  }

  const career = (profile?.career || [])
    .filter(c => c.category?.name === "MotoGP")
    .sort((a, b) => b.season - a.season);

  const cs = profile?.career_stats;
  const careerStats = cs ? {
    races:   cs.total_races   ?? null,
    wins:    cs.total_wins    ?? null,
    podiums: cs.total_podiums ?? null,
    poles:   cs.total_poles   ?? null,
  } : null;

  return { r, profile, standing, career, careerStats };
}

export default function MotoGPRiderDetail({ rider, onClose }) {
  const [visible, setVisible] = useState(false);
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setVisible(true), 10);
    fetchAll(rider).then(result => {
      setData(result);
      setLoading(false);
    });
  }, []);

  function handleClose() { setVisible(false); setTimeout(onClose, 300); }

  const r        = data?.r        || normalise(rider);
  const profile  = data?.profile  || null;
  const standing = data?.standing || null;
  const career   = data?.career   || [];
  const cs       = data?.careerStats;
  const hasCareerStats = cs && Object.values(cs).some(v => v !== null);

  const name   = r.name   || (profile ? `${profile.name} ${profile.surname}`.trim() : "—");
  const photo  = r.photo  || profile?.current_career_step?.pictures?.profile?.main || null;
  const number = r.number || career[0]?.number || null;
  const nat    = r.nationality || profile?.country?.name || null;
  const flagUrl= profile?.country?.flag || null;
  const age    = profile?.years_old || null;
  const debut  = career.length ? career[career.length - 1].season : null;

  const dobStr = profile?.birth_date
    ? new Date(profile.birth_date).toLocaleDateString("en-US", {
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
              {flagUrl
                ? <img src={flagUrl} alt="" className="w-4 h-3 object-cover rounded-sm flex-shrink-0" />
                : r.flagIso ? <span className="text-sm">{isoToFlag(r.flagIso)}</span> : null
              }
              {nat    && <span className="text-xs text-white/40">{nat}</span>}
              {number && <span className="text-xs text-yellow-400/70">#{number}</span>}
              {age    && <span className="text-xs text-white/25">· {age} yrs</span>}
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
        ) : (
          <>
            {/* 2026 Season */}
            {standing && (
              <div className="glass-card rounded-2xl p-4">
                <p className="text-xs text-white/30 font-semibold uppercase tracking-widest mb-3">
                  2026 Season
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      label: "Position",
                      value: `P${standing.position}`,
                      color: standing.position === 1 ? "#f59e0b" :
                             standing.position === 2 ? "#cbd5e1" :
                             standing.position === 3 ? "#92400e" : "white",
                    },
                    { label: "Points", value: standing.points,    color: "#10b981" },
                    { label: "Wins",   value: standing.race_wins, color: "#f59e0b" },
                  ].map(s => (
                    <div key={s.label} className="glass rounded-xl p-3 text-center">
                      <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
                      <p className="text-xs text-white/30 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Career totals */}
            {hasCareerStats && (
              <div className="glass-card rounded-2xl p-4">
                <p className="text-xs text-white/30 font-semibold uppercase tracking-widest mb-3">
                  Career Stats
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Races",   value: cs.races   ?? "—", color: "white"   },
                    { label: "Wins",    value: cs.wins    ?? "—", color: "#f59e0b" },
                    { label: "Podiums", value: cs.podiums ?? "—", color: "#10b981" },
                    { label: "Poles",   value: cs.poles   ?? "—", color: "#8b5cf6" },
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
              <p className="text-xs text-white/30 font-semibold uppercase tracking-widest mb-3">Profile</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Nationality",   value: nat                       || "—" },
                  { label: "Hometown",      value: profile?.birth_city       || "—" },
                  { label: "Date of Birth", value: dobStr                    || "—" },
                  { label: "MotoGP Debut",  value: debut ? `${debut} season` : "—" },
                  { label: "Seasons",       value: career.length             || "—" },
                  { label: "Bike #",        value: number ? `#${number}`     : "—" },
                ].map(s => (
                  <div key={s.label} className="glass rounded-xl p-3">
                    <p className="text-xs text-white/30">{s.label}</p>
                    <p className="text-sm font-bold text-white mt-0.5 truncate">{s.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Career timeline */}
            {career.length > 0 && (
              <div className="glass-card rounded-2xl p-4">
                <p className="text-xs text-white/30 font-semibold uppercase tracking-widest mb-3">
                  MotoGP Seasons ({career.length})
                </p>
                <div className="space-y-1.5">
                  {career.map(c => {
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