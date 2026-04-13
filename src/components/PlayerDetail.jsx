import { useState, useEffect } from "react";

function StatCard({ value, label, color, icon }) {
  return (
    <div className="glass rounded-xl p-3 text-center">
      <p className="text-xl font-black" style={{ color: color || "white" }}>
        {icon && <span className="mr-1">{icon}</span>}{value}
      </p>
      <p className="text-xs text-white/30 mt-0.5 leading-tight">{label}</p>
    </div>
  );
}

function StatBar({ label, value, max, color = "#8b5cf6" }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-white/40">{label}</span>
        <span className="text-sm font-bold text-white">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function PlayerDetail({ player, onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 10);
  }, []);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 300);
  }

  const shootingAccuracy = player.shots > 0
    ? Math.round((player.shotsOnTarget / player.shots) * 100)
    : 0;

  const goalInvolvement = (player.goals || 0) + (player.assists || 0);

  const isGK = player.position === "G";
  const teamColor = player.teamColor || "#8b5cf6";

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
          {/* Jersey number */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: `${teamColor}30`,
              border: `2px solid ${teamColor}60`,
            }}
          >
            <span className="text-lg font-black" style={{ color: teamColor }}>
              {player.jersey || "?"}
            </span>
          </div>
          <div className="min-w-0">
            <h2
              className="text-lg font-black text-white leading-tight truncate"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {player.name}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              {player.flag && (
                <img src={player.flag} alt="" className="w-4 h-3 object-cover rounded-sm" />
              )}
              <span className="text-xs text-white/40">{player.nationality}</span>
              <span className="text-white/20 text-xs">·</span>
              <span className="text-xs font-semibold" style={{ color: teamColor }}>
                {player.position}
              </span>
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

      {/* Team */}
      <div className="px-4 mb-4">
        <div className="glass-card rounded-xl px-4 py-2.5 flex items-center gap-3">
          {player.teamLogo && (
            <img src={player.teamLogo} alt="" className="w-8 h-8 object-contain" />
          )}
          <p className="text-sm font-semibold text-white">{player.teamName}</p>
          <span className="ml-auto text-xs text-white/30">{player.apps} appearances</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-4">

        {/* Key stats grid */}
        {!isGK ? (
          <>
            <div className="grid grid-cols-3 gap-2">
              <StatCard value={player.goals} label="Goals" color="#10b981" icon="⚽" />
              <StatCard value={player.assists} label="Assists" color="#3b82f6" icon="🎯" />
              <StatCard value={goalInvolvement} label="Goal Involvement" color="#8b5cf6" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <StatCard value={player.shots} label="Shots" color="white" />
              <StatCard value={player.shotsOnTarget} label="On Target" color="#f59e0b" />
              <StatCard value={`${shootingAccuracy}%`} label="Accuracy" color={
                shootingAccuracy >= 50 ? "#10b981" :
                shootingAccuracy >= 30 ? "#f59e0b" : "#ef4444"
              } />
            </div>
          </>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            <StatCard value={player.saves || 0} label="Saves" color="#10b981" />
            <StatCard value={player.shotsFaced || 0} label="Shots Faced" color="#f59e0b" />
            <StatCard value={player.goalsConceded || 0} label="Goals Conceded" color="#ef4444" />
          </div>
        )}

        {/* Shooting breakdown */}
        {!isGK && player.shots > 0 && (
          <div className="glass-card rounded-2xl p-4">
            <p className="text-xs text-white/30 font-semibold uppercase tracking-widest mb-3">
              Shooting
            </p>
            <StatBar label="Shots" value={player.shots} max={player.shots} color={teamColor} />
            <StatBar label="On Target" value={player.shotsOnTarget} max={player.shots} color="#f59e0b" />
            <StatBar label="Goals" value={player.goals} max={player.shots} color="#10b981" />
            <div className="glass rounded-xl px-3 py-2 flex items-center justify-between mt-1">
              <span className="text-xs text-white/30">Conversion rate</span>
              <span className="text-sm font-black text-white">
                {player.shots > 0 ? Math.round((player.goals / player.shots) * 100) : 0}%
              </span>
            </div>
          </div>
        )}

        {/* Discipline */}
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs text-white/30 font-semibold uppercase tracking-widest mb-3">
            Discipline
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="glass rounded-xl p-3 flex items-center gap-3">
              <span className="text-xl">🟨</span>
              <div>
                <p className="text-lg font-black text-yellow-400">{player.yellowCards || 0}</p>
                <p className="text-xs text-white/30">Yellow Cards</p>
              </div>
            </div>
            <div className="glass rounded-xl p-3 flex items-center gap-3">
              <span className="text-xl">🟥</span>
              <div>
                <p className="text-lg font-black text-red-400">{player.redCards || 0}</p>
                <p className="text-xs text-white/30">Red Cards</p>
              </div>
            </div>
            <div className="glass rounded-xl p-3 flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="text-lg font-black text-white">{player.foulsCommitted || 0}</p>
                <p className="text-xs text-white/30">Fouls Made</p>
              </div>
            </div>
            <div className="glass rounded-xl p-3 flex items-center gap-3">
              <span className="text-xl">🛡️</span>
              <div>
                <p className="text-lg font-black text-white">{player.foulsSuffered || 0}</p>
                <p className="text-xs text-white/30">Fouls Won</p>
              </div>
            </div>
          </div>
        </div>

        {/* Performance rating */}
        {!isGK && player.apps > 0 && (
          <div className="glass-card rounded-2xl p-4">
            <p className="text-xs text-white/30 font-semibold uppercase tracking-widest mb-3">
              Per Game Average
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Goals/Game", value: (player.goals / player.apps).toFixed(2), color: "#10b981" },
                { label: "Assists/Game", value: (player.assists / player.apps).toFixed(2), color: "#3b82f6" },
                { label: "Shots/Game", value: (player.shots / player.apps).toFixed(1), color: "#f59e0b" },
              ].map(s => (
                <div key={s.label} className="glass rounded-xl p-2.5 text-center">
                  <p className="text-base font-black" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-xs text-white/25 mt-0.5 leading-tight">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}