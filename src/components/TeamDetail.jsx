import { useState, useEffect } from "react";

const ESPN = "https://site.api.espn.com/apis/site/v2/sports/soccer";

export default function TeamDetail({ team, leagueId, onClose }) {
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
              className="w-14 h-14 object-contain"
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
                  { label: "Played", value: gs("gamesPlayed"), color: null      },
                  { label: "Won",    value: gs("wins"),         color: "#10b981" },
                  { label: "Drawn",  value: gs("ties"),         color: "#f59e0b" },
                  { label: "Lost",   value: gs("losses"),       color: "#ef4444" },
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
                  { label: "Goals For",     value: gs("pointsFor"),         color: null },
                  { label: "Goals Against", value: gs("pointsAgainst"),     color: null },
                  { label: "Goal Diff",
                    value: gs("pointDifferential"),
                    color: gs("pointDifferential") > 0 ? "#10b981" : "#ef4444",
                    prefix: gs("pointDifferential") > 0 ? "+" : "",
                  },
                ].map(s => (
                  <div key={s.label} className="glass rounded-xl p-2.5 text-center">
                    <p className="text-lg font-black" style={{ color: s.color || "white" }}>
                      {s.prefix || ""}{s.value}
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
                  { label: "Home", w: gs("homeWins"), d: gs("homeTies"), l: gs("homeLosses"), gf: gs("homePointsFor"), ga: gs("homePointsAgainst") },
                  { label: "Away", w: gs("awayWins"), d: gs("awayTies"), l: gs("awayLosses"), gf: gs("awayPointsFor"), ga: gs("awayPointsAgainst") },
                ].map(row => (
                  <div key={row.label}
                    className="glass rounded-xl px-3 py-2.5 flex items-center justify-between">
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
                      {[
                        { label: "Home", val: odds.homeTeamOdds?.moneyLine },
                        { label: "Draw", val: odds.drawOdds?.moneyLine },
                        { label: "Away", val: odds.awayTeamOdds?.moneyLine },
                      ].map(o => (
                        <div key={o.label} className="text-center flex-1">
                          <p className="text-xs text-white/30">{o.label}</p>
                          <p className="text-sm font-black text-white">
                            {o.val ? (o.val > 0 ? `+${o.val}` : o.val) : "—"}
                          </p>
                        </div>
                      ))}
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