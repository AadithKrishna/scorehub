import { useState, useEffect } from "text";

async function fetchMotoGPRiderStats(riderId) {
  try {
    const res = await fetch(`/api/motogp?path=riders%2F${riderId}`);
    const data = await res.json();

    const career = (data.career || [])
      .filter(c => c.category?.name === "MotoGP")
      .sort((a, b) => b.season - a.season);

    return {
      name: `${data.name} ${data.surname}`,
      nationality: data.country?.name,
      flag: data.country?.flag,
      birthDate: data.birth_date,
      birthCity: data.birth_city,
      age: data.years_old,
      startYear: data.start_year,
      career,
      biography: data.biography?.find(b => b.language === "en")?.biography || null,
    };
  } catch (err) {
    console.warn("MotoGP rider stats error:", err.message);
    return null;
  }
}

export default function MotoGPRiderDetail({ rider, onClose }) {
  const [visible, setVisible] = useState(false);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setVisible(true), 10);
    fetchMotoGPRiderStats(rider.id).then(s => {
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
        background: "rgba(7, 10, 18, 0.98)",
        backdropFilter: "blur(30px)",
        transform: visible ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {rider.logo ? (
            <img src={rider.logo} alt="" className="w-14 h-14 object-contain rounded-xl flex-shrink-0" />
          ) : (
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(245,158,11,0.15)", border: "2px solid rgba(245,158,11,0.4)" }}>
              <span className="text-lg font-black text-yellow-400">
                {rider.number || "🏍️"}
              </span>
            </div>
          )}
          <div className="min-w-0">
            <h2 className="text-lg font-black text-white leading-tight truncate"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {rider.name}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              {stats?.flag && (
                <img src={stats.flag} alt="" className="w-4 h-3 object-cover rounded-sm" />
              )}
              <span className="text-xs text-white/40">{stats?.nationality || rider.league}</span>
              {rider.number && (
                <span className="text-xs text-yellow-400/70">#{rider.number}</span>
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
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass rounded-xl h-20 animate-pulse" />
            ))}
          </div>
        ) : !stats ? (
          <div className="text-center py-12">
            <p className="text-3xl mb-2">🏍️</p>
            <p className="text-sm text-white/30">No stats available</p>
          </div>
        ) : (
          <>
            {/* Profile */}
            <div className="glass-card rounded-2xl p-4">
              <p className="text-xs text-white/30 font-semibold uppercase tracking-widest mb-3">
                Profile
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Age",        value: stats.age ? `${stats.age} years` : "—" },
                  { label: "Born",       value: stats.birthCity || "—" },
                  { label: "MotoGP Since", value: stats.startYear || "—" },
                  { label: "Seasons",    value: stats.career.length || "—" },
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
                  {stats.career.map((c, i) => {
                    const teamColor = c.team?.color || "#f59e0b";
                    const isCurrent = c.current;
                    return (
                      <div key={c.season}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${
                          isCurrent ? "glass-strong ring-1 ring-yellow-400/30" : "glass"
                        }`}
                      >
                        <span className="text-sm font-black text-white/60 w-10 flex-shrink-0">
                          {c.season}
                        </span>
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {c.team?.picture ? (
                            <img src={c.team.picture} alt="" className="w-6 h-6 object-contain flex-shrink-0" />
                          ) : (
                            <div className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ background: teamColor }} />
                          )}
                          <span className="text-xs font-semibold text-white truncate">
                            {c.sponsored_team || c.team?.name}
                          </span>
                          {isCurrent && (
                            <span className="text-xs text-yellow-400/70 flex-shrink-0">Current</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="text-xs text-white/30 text-right">
                            <p>{c.team?.constructor?.name}</p>
                          </div>
                          <span className="text-xs font-bold text-white/50">#{c.number}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Team info */}
            {stats.career[0] && (
              <div className="glass-card rounded-2xl p-4">
                <p className="text-xs text-white/30 font-semibold uppercase tracking-widest mb-3">
                  Current Team
                </p>
                <div className="flex items-center gap-3">
                  {stats.career[0].team?.picture && (
                    <img src={stats.career[0].team.picture} alt=""
                      className="w-16 h-16 object-contain flex-shrink-0" />
                  )}
                  <div>
                    <p className="text-sm font-bold text-white">
                      {stats.career[0].sponsored_team}
                    </p>
                    <p className="text-xs text-white/40 mt-0.5">
                      {stats.career[0].team?.constructor?.name}
                    </p>
                    <p className="text-xs text-white/30 mt-0.5">
                      #{stats.career[0].number} · {stats.career[0].season} Season
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}