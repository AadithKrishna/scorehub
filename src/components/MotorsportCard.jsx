export default function MotorsportCard({ race }) {
  const isLive = race.status === "live";

  return (
    <div className="bg-white/5 hover:bg-white/8 border border-white/10 rounded-2xl p-4 cursor-pointer transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-white/50 font-medium uppercase tracking-wider">
          {race.leagueLogo} {race.league}
        </span>
        {isLive ? (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-red-400 bg-red-500/15 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            {race.minute}
          </span>
        ) : (
          <span className="text-xs text-white/40 bg-white/5 px-2.5 py-1 rounded-full">
            {race.minute}
          </span>
        )}
      </div>

      {/* Event name */}
      <p className="text-sm font-semibold text-white mb-1">{race.event}</p>
      <p className="text-xs text-white/40 mb-3">{race.circuit}</p>

      {/* Leaderboard */}
      <div className="space-y-2">
        {race.results.slice(0, 5).map((r) => (
          <div key={r.pos} className="flex items-center gap-3">
            <span className={`text-xs font-bold w-5 text-center tabular-nums ${
              r.pos === 1 ? "text-yellow-400" :
              r.pos === 2 ? "text-slate-300" :
              r.pos === 3 ? "text-amber-600" :
              "text-white/30"
            }`}>
              {r.pos}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium truncate">{r.driver}</p>
              <p className="text-xs text-white/40 truncate">{r.team}</p>
            </div>
            <span className={`text-xs font-mono tabular-nums ${
              r.pos === 1 ? "text-yellow-400 font-semibold" : "text-white/50"
            }`}>
              {r.gap}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}