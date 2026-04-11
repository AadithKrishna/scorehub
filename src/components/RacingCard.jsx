export default function RacingCard({ race, onPress }) {
  const isLive = race.status === "live";
  const isFinished = race.status === "finished";
  const isScheduled = race.status === "scheduled";

  const sportColor = race.leagueLogo === "🏎️"
    ? { bg: "rgba(220,38,38,0.15)", border: "rgba(220,38,38,0.3)", text: "#ef4444" }
    : { bg: "rgba(251,146,60,0.15)", border: "rgba(251,146,60,0.3)", text: "#fb923c" };

  return (
    <div
      onClick={() => onPress?.(race)}
      className="glass-card card-hover rounded-2xl overflow-hidden cursor-pointer transition-all duration-150 active:scale-[0.99]"
    >
      {/* Top accent bar */}
      <div className="h-1 w-full" style={{ background: sportColor.text, opacity: 0.6 }} />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{race.leagueLogo}</span>
            <span className="text-xs text-white/40 font-semibold uppercase tracking-widest">
              {race.league}
            </span>
          </div>
          {isLive ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              <span className="text-xs font-bold text-red-400">LIVE</span>
            </div>
          ) : isFinished ? (
            <span className="text-xs font-semibold text-white/25 bg-white/5 px-2.5 py-1 rounded-full">
              Finished
            </span>
          ) : (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: sportColor.bg, border: `1px solid ${sportColor.border}`, color: sportColor.text }}>
              {race.minute}
            </span>
          )}
        </div>

        {/* Event name */}
        <h3 className="text-base font-black text-white leading-tight mb-1"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          {race.event}
        </h3>
        <p className="text-xs text-white/40 mb-3">🏁 {race.circuit}</p>

        {/* Session badges */}
        {race.sessions?.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-3">
            {race.sessions.map((s, i) => (
              <div key={i} className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                s.status === "live"
                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : s.status === "finished"
                  ? "bg-white/5 text-white/40"
                  : "bg-white/5 text-white/30"
              }`}>
                {s.name}
                {s.status === "finished" && s.winner && (
                  <span className="ml-1.5 text-white/60">· {s.winner}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Results leaderboard */}
        {race.results?.length > 0 && (
          <div className="space-y-2 mt-2 pt-3 border-t border-white/6">
            {race.results.slice(0, 3).map((r) => (
              <div key={r.pos} className="flex items-center gap-3">
                <span className={`text-xs font-black w-5 text-center ${
                  r.pos === 1 ? "text-yellow-400" :
                  r.pos === 2 ? "text-slate-300" :
                  r.pos === 3 ? "text-amber-600" :
                  "text-white/25"
                }`}>
                  {r.pos}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{r.driver}</p>
                  <p className="text-xs text-white/35 truncate">{r.team}</p>
                </div>
                <span className={`text-xs font-mono tabular-nums ${
                  r.pos === 1 ? "text-yellow-400 font-bold" : "text-white/40"
                }`}>
                  {r.gap}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* No results yet */}
        {!race.results?.length && (
          <div className="flex items-center gap-2 mt-1">
            <div className="h-px flex-1 bg-white/5" />
            <span className="text-xs text-white/20">
              {isScheduled ? "Race weekend upcoming" : "Results loading..."}
            </span>
            <div className="h-px flex-1 bg-white/5" />
          </div>
        )}
      </div>
    </div>
  );
}