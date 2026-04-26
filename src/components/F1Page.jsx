import { useState, useEffect, useRef } from "react";
import F1DriverDetail from "./F1DriverDetail";
import { X, RefreshCw } from "lucide-react";

const JOLPICA = "https://api.jolpi.ca/ergast/f1";

const TEAM_COLORS = {
  mercedes: "#00D2BE", ferrari: "#DC0000", red_bull: "#0600EF",
  mclaren: "#FF8000", aston_martin: "#006F62", alpine: "#0090FF",
  williams: "#005AFF", haas: "#B6BABD", sauber: "#00E48F", rb: "#1434CB",
};

function getTeamColor(constructorId) {
  return TEAM_COLORS[constructorId] || "#8b5cf6";
}

function countryFlag(nationality) {
  const flags = {
    British: "🇬🇧", German: "🇩🇪", Spanish: "🇪🇸", Finnish: "🇫🇮",
    Dutch: "🇳🇱", Monegasque: "🇲🇨", Mexican: "🇲🇽", Australian: "🇦🇺",
    Canadian: "🇨🇦", French: "🇫🇷", Japanese: "🇯🇵", Chinese: "🇨🇳",
    Italian: "🇮🇹", Thai: "🇹🇭", American: "🇺🇸", Danish: "🇩🇰",
    Argentine: "🇦🇷", Brazilian: "🇧🇷", Austrian: "🇦🇹", Swiss: "🇨🇭",
  };
  return flags[nationality] || "🏁";
}

// ── Driver Standings ───────────────────────────────────

function DriverStandings({ onSelectDriver }) {
  const [standings, setStandings] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    fetch(`${JOLPICA}/2026/driverStandings.json`)
      .then(r => r.json())
      .then(d => {
        setStandings(d.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-3 px-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-2xl h-16 animate-pulse" style={{ background: "var(--surface-2)" }} />
      ))}
    </div>
  );

  if (!standings.length) return (
    <div className="text-center py-16">
      <p className="text-5xl mb-4">🏎️</p>
      <p className="text-sm" style={{ color: "var(--text-3)" }}>No standings available yet</p>
    </div>
  );

  return (
    <div className="px-4 space-y-2">
      {standings.map(s => {
        const color  = getTeamColor(s.Constructors?.[0]?.constructorId);
        const isTop3 = parseInt(s.position) <= 3;
        return (
          <div
            key={s.Driver.driverId}
            className="glass-card rounded-2xl px-4 py-3 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
            style={isTop3 ? { borderLeft: `3px solid ${color}` } : {}}
            onClick={() => onSelectDriver?.(s.Driver)}
          >
            <span className={`text-lg font-black w-6 text-center tabular-nums ${
              s.position === "1" ? "text-yellow-400" :
              s.position === "2" ? "text-slate-400" :
              s.position === "3" ? "text-amber-600" : ""
            }`} style={parseInt(s.position) > 3 ? { color: "var(--text-4)" } : {}}>
              {s.position}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm">{countryFlag(s.Driver.nationality)}</span>
                <p className="text-sm font-bold truncate" style={{ color: "var(--text-1)" }}>
                  {s.Driver.givenName}{" "}
                  <span style={{ color }}>{s.Driver.familyName}</span>
                </p>
              </div>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
                {s.Constructors?.[0]?.name}
              </p>
            </div>
            <div className="text-right">
              <p className="text-base font-black" style={{ color: "var(--text-1)" }}>{s.points}</p>
              <p className="text-xs" style={{ color: "var(--text-3)" }}>
                {s.wins} win{s.wins !== "1" ? "s" : ""}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Constructor Standings ──────────────────────────────

function ConstructorStandings() {
  const [standings, setStandings] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    fetch(`${JOLPICA}/2026/constructorStandings.json`)
      .then(r => r.json())
      .then(d => {
        setStandings(d.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-3 px-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-2xl h-16 animate-pulse" style={{ background: "var(--surface-2)" }} />
      ))}
    </div>
  );

  const maxPoints = parseInt(standings[0]?.points || 1);

  return (
    <div className="px-4 space-y-2">
      {standings.map(s => {
        const color  = getTeamColor(s.Constructor.constructorId);
        const isTop3 = parseInt(s.position) <= 3;
        const pct    = (parseInt(s.points) / maxPoints) * 100;
        return (
          <div key={s.Constructor.constructorId}
            className="glass-card rounded-2xl px-4 py-3"
            style={isTop3 ? { borderLeft: `3px solid ${color}` } : {}}>
            <div className="flex items-center gap-3 mb-2">
              <span className={`text-lg font-black w-6 text-center ${
                s.position === "1" ? "text-yellow-400" :
                s.position === "2" ? "text-slate-400" :
                s.position === "3" ? "text-amber-600" : ""
              }`} style={parseInt(s.position) > 3 ? { color: "var(--text-4)" } : {}}>
                {s.position}
              </span>
              <div className="flex-1">
                <p className="text-sm font-bold" style={{ color }}>{s.Constructor.name}</p>
              </div>
              <p className="text-base font-black" style={{ color: "var(--text-1)" }}>{s.points} pts</p>
            </div>
            <div className="ml-9 h-1 rounded-full overflow-hidden" style={{ background: "var(--surface-3)" }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: color, opacity: 0.7 }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Race Calendar ──────────────────────────────────────

function RaceCalendar({ onSelectRace }) {
  const [races, setRaces]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${JOLPICA}/2026.json`)
      .then(r => r.json())
      .then(d => { setRaces(d.MRData?.RaceTable?.Races || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-3 px-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-2xl h-20 animate-pulse" style={{ background: "var(--surface-2)" }} />
      ))}
    </div>
  );

  const now = new Date();

  return (
    <div className="px-4 space-y-2">
      {races.map((race, idx) => {
        const raceDate  = new Date(race.date + "T" + (race.time || "12:00:00Z"));
        const isPast    = raceDate < now;
        const isLive    = !isPast && raceDate <= new Date(now.getTime() + 2 * 60 * 60 * 1000) && raceDate > new Date(now.getTime() - 2 * 60 * 60 * 1000);
        const prevPast  = idx === 0 ? false : new Date(races[idx - 1].date) < now;
        const isNext    = !isPast && !isLive && prevPast;
        const hasSprint = !!race.Sprint;

        return (
          <div
            key={race.round}
            onClick={() => onSelectRace(race)}
            className="glass-card card-hover rounded-2xl px-4 py-3 cursor-pointer"
            style={isLive ? { borderLeft: "3px solid var(--live)" } : isNext ? { borderLeft: "3px solid var(--accent)" } : {}}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-xs font-bold w-6 text-center" style={{ color: "var(--text-4)" }}>
                  R{race.round}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold truncate" style={{ color: "var(--text-1)" }}>
                      {race.raceName}
                    </p>
                    {hasSprint && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 font-semibold"
                        style={{ background: "rgba(249,115,22,0.1)", color: "#f97316", border: "1px solid rgba(249,115,22,0.2)" }}>
                        Sprint
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
                    🏁 {race.Circuit?.circuitName}
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-2">
                {isLive ? (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-full"
                    style={{ background: "rgba(255,59,48,0.1)", border: "1px solid rgba(255,59,48,0.2)" }}>
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--live)" }} />
                    <span className="text-xs font-bold" style={{ color: "var(--live)" }}>Live</span>
                  </div>
                ) : isPast ? (
                  <span className="text-xs px-2 py-1 rounded-full"
                    style={{ color: "var(--text-4)", background: "var(--surface-2)" }}>Done</span>
                ) : isNext ? (
                  <span className="text-xs px-2 py-1 rounded-full font-bold"
                    style={{ color: "var(--accent)", background: "rgba(0,122,255,0.08)" }}>Next</span>
                ) : (
                  <span className="text-xs" style={{ color: "var(--accent)" }}>
                    {raceDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Practice Schedule ──────────────────────────────────

function PracticeSchedule({ race }) {
  const now       = new Date();
  const hasSprint = !!race.Sprint;

  const sessions = (hasSprint ? [
    { name: "Practice 1",        short: "FP1",  date: race.FirstPractice?.date,  time: race.FirstPractice?.time,  color: null      },
    { name: "Sprint Qualifying", short: "SQ",   date: race.SecondPractice?.date, time: race.SecondPractice?.time, color: "#fb923c" },
    { name: "Sprint Race",       short: "SPR",  date: race.Sprint?.date,         time: race.Sprint?.time,         color: "#f97316" },
    { name: "Qualifying",        short: "QUAL", date: race.Qualifying?.date,     time: race.Qualifying?.time,     color: "#8b5cf6" },
    { name: "Race",              short: "RACE", date: race.date,                 time: race.time,                 color: "#ef4444" },
  ] : [
    { name: "Practice 1",  short: "FP1",  date: race.FirstPractice?.date,  time: race.FirstPractice?.time,  color: null      },
    { name: "Practice 2",  short: "FP2",  date: race.SecondPractice?.date, time: race.SecondPractice?.time, color: null      },
    { name: "Practice 3",  short: "FP3",  date: race.ThirdPractice?.date,  time: race.ThirdPractice?.time,  color: null      },
    { name: "Qualifying",  short: "QUAL", date: race.Qualifying?.date,     time: race.Qualifying?.time,     color: "#8b5cf6" },
    { name: "Race",        short: "RACE", date: race.date,                 time: race.time,                 color: "#ef4444" },
  ]).filter(s => s.date);

  return (
    <div className="space-y-2">
      {hasSprint && (
        <div className="mb-3">
          <span className="text-xs px-2 py-1 rounded-full font-semibold"
            style={{ background: "rgba(249,115,22,0.1)", color: "#f97316", border: "1px solid rgba(249,115,22,0.2)" }}>
            ⚡ Sprint Weekend
          </span>
        </div>
      )}
      {sessions.map((s, i) => {
        if (!s.date) return null;
        const dt       = new Date(`${s.date}T${s.time || "12:00:00Z"}`);
        const isPast   = dt < now;
        const isNowLive = dt <= now && new Date(dt.getTime() + 2 * 60 * 60 * 1000) >= now;
        const isNext   = !isPast && sessions.slice(0, i).filter(x => x.date)
          .every(prev => new Date(`${prev.date}T${prev.time || "12:00:00Z"}`) < now);
        const daysAway = Math.ceil((dt - now) / (1000 * 60 * 60 * 24));

        return (
          <div key={s.short}
            className="rounded-xl px-4 py-3 flex items-center gap-3"
            style={{
              background: isNowLive ? "rgba(255,59,48,0.05)" : "var(--surface)",
              border: isNowLive ? "1px solid rgba(255,59,48,0.15)" : "1px solid var(--border)",
              boxShadow: "var(--shadow-sm)",
            }}>
            <div className="w-12 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                background: s.color ? `${s.color}18` : "var(--surface-2)",
                border: `1px solid ${s.color ? `${s.color}30` : "var(--border)"}`,
              }}>
              <span className="text-xs font-black" style={{ color: s.color || "var(--text-3)" }}>
                {s.short}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold"
                  style={{ color: isPast ? "var(--text-4)" : "var(--text-1)" }}>
                  {s.name}
                </p>
                {isNowLive && (
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full"
                    style={{ background: "rgba(255,59,48,0.1)" }}>
                    <span className="w-1 h-1 rounded-full animate-pulse" style={{ background: "var(--live)" }} />
                    <span className="text-xs font-bold" style={{ color: "var(--live)" }}>Live</span>
                  </div>
                )}
              </div>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
                {dt.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-bold"
                style={{ color: isPast ? "var(--text-4)" : "var(--text-2)" }}>
                {dt.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
              </p>
              {isPast ? (
                <span className="text-xs" style={{ color: "var(--text-4)" }}>Done</span>
              ) : isNext ? (
                <span className="text-xs font-semibold" style={{ color: "var(--accent)" }}>Next up</span>
              ) : (
                <span className="text-xs" style={{ color: "var(--text-4)" }}>{daysAway}d away</span>
              )}
            </div>
          </div>
        );
      })}
      <p className="text-center text-xs pt-2" style={{ color: "var(--text-4)" }}>
        Times shown in your local timezone
      </p>
    </div>
  );
}

// ── Race Results ───────────────────────────────────────

function RaceResults({ list, isQual = false }) {
  if (!list?.length) return (
    <div className="text-center py-12">
      <p className="text-4xl mb-3">🏁</p>
      <p className="text-sm" style={{ color: "var(--text-3)" }}>No results available</p>
      <p className="text-xs mt-1" style={{ color: "var(--text-4)" }}>Results appear after the session</p>
    </div>
  );

  return (
    <div className="space-y-2">
      {list.map((r, i) => {
        const color  = getTeamColor(r.Constructor?.constructorId);
        const isTop3 = parseInt(r.position) <= 3;
        const time   = isQual
          ? (r.Q3 || r.Q2 || r.Q1 || "—")
          : (r.Time?.time || r.status || "—");

        return (
          <div key={i}
            className="rounded-xl px-4 py-2.5 flex items-center gap-3"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderLeft: isTop3 ? `3px solid ${color}` : undefined,
              boxShadow: "var(--shadow-sm)",
            }}>
            <span className={`text-sm font-black w-6 text-center tabular-nums ${
              r.position === "1" ? "text-yellow-400" :
              r.position === "2" ? "text-slate-400" :
              r.position === "3" ? "text-amber-600" : ""
            }`} style={parseInt(r.position) > 3 ? { color: "var(--text-4)" } : {}}>
              {r.position === "1" ? "🥇" : r.position === "2" ? "🥈" : r.position === "3" ? "🥉" : r.position}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: "var(--text-1)" }}>
                {r.Driver?.code || r.Driver?.familyName}
                <span className="text-xs ml-1">{countryFlag(r.Driver?.nationality)}</span>
              </p>
              <p className="text-xs truncate" style={{ color, opacity: 0.85 }}>
                {r.Constructor?.name}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs font-bold tabular-nums" style={{ color: "var(--text-2)" }}>{time}</p>
              {r.points && parseInt(r.points) > 0 && (
                <p className="text-xs" style={{ color: "var(--text-4)" }}>+{r.points}pts</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Race Detail ────────────────────────────────────────

function RaceDetail({ race, onClose }) {
  const [visible, setVisible]         = useState(false);
  const [results, setResults]         = useState({});
  const [loading, setLoading]         = useState(true);
  const [hasSprint, setHasSprint]     = useState(!!race.Sprint);
  const [raceDetails, setRaceDetails] = useState(race);

  const raceDate   = new Date(race.date + "T" + (race.time || "12:00:00Z"));
  const now        = new Date();
  const isUpcoming = raceDate > now;
  const isLive     = !isUpcoming && raceDate > new Date(now.getTime() - 4 * 60 * 60 * 1000);

  const [activeTab, setActiveTab] = useState(isUpcoming ? "schedule" : "race");

  const tabs = isUpcoming ? [
    { id: "schedule", label: "📅 Schedule" },
  ] : [
    { id: "race",       label: "🏁 Race"      },
    { id: "qualifying", label: "⏱ Qualifying" },
    ...(hasSprint ? [
      { id: "sprint",     label: "⚡ Sprint"           },
      { id: "sprintQual", label: "⚡ Sprint Qualifying" },
    ] : []),
  ];

  useEffect(() => {
    setTimeout(() => setVisible(true), 10);
    fetch(`${JOLPICA}/2026/${race.round}.json`)
      .then(r => r.json())
      .then(d => {
        const full = d.MRData?.RaceTable?.Races?.[0];
        if (full) { setRaceDetails(full); setHasSprint(!!full.Sprint); }
      })
      .catch(() => {});

    if (!isUpcoming) loadResults();
    else setLoading(false);
  }, []);

  async function loadResults() {
    setLoading(true);
    try {
      const fetches = [
        fetch(`${JOLPICA}/2026/${race.round}/results.json`).then(r => r.json()),
        fetch(`${JOLPICA}/2026/${race.round}/qualifying.json`).then(r => r.json()),
      ];
      if (hasSprint) fetches.push(fetch(`${JOLPICA}/2026/${race.round}/sprint.json`).then(r => r.json()));
      const settled = await Promise.allSettled(fetches);
      setResults({
        race:      settled[0]?.status === "fulfilled" ? settled[0].value.MRData?.RaceTable?.Races?.[0]?.Results          || [] : [],
        qualifying:settled[1]?.status === "fulfilled" ? settled[1].value.MRData?.RaceTable?.Races?.[0]?.QualifyingResults || [] : [],
        sprint:    hasSprint && settled[2]?.status === "fulfilled" ? settled[2].value.MRData?.RaceTable?.Races?.[0]?.SprintResults || [] : [],
      });
    } catch {}
    setLoading(false);
  }

  function handleClose() { setVisible(false); setTimeout(onClose, 300); }

  return (
    <div className="fixed inset-0 z-50 flex flex-col"
      style={{
        background: "var(--overlay-bg)",
        transform: visible ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)",
      }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4">
        <div className="flex-1 min-w-0 mr-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
              🏎️ Formula 1 · Round {race.round}
            </span>
            {hasSprint && (
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: "rgba(249,115,22,0.1)", color: "#f97316", border: "1px solid rgba(249,115,22,0.2)" }}>
                Sprint
              </span>
            )}
            {isLive && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                style={{ background: "rgba(255,59,48,0.1)", border: "1px solid rgba(255,59,48,0.2)" }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--live)" }} />
                <span className="text-xs font-bold" style={{ color: "var(--live)" }}>Live</span>
              </div>
            )}
          </div>
          <h2 className="text-lg font-black leading-tight truncate"
            style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--text-1)" }}>
            {race.raceName}
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
            🏁 {race.Circuit?.circuitName}, {race.Circuit?.Location?.country}
          </p>
        </div>
        <button onClick={handleClose}
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
          <X size={16} style={{ color: "var(--text-2)" }} />
        </button>
      </div>

      {/* Race date */}
      <div className="px-4 mb-3">
        <div className="rounded-xl px-4 py-2.5 flex items-center justify-between"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
          <span className="text-xs" style={{ color: "var(--text-3)" }}>Race date</span>
          <span className="text-sm font-bold" style={{ color: "var(--text-1)" }}>
            {new Date(race.date).toLocaleDateString(undefined, {
              weekday: "short", day: "numeric", month: "long", year: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* Tabs */}
      {tabs.length > 1 ? (
        <div className="flex gap-1 mx-4 mb-4 p-1 rounded-xl overflow-x-auto no-scrollbar"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="flex-1 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 px-2"
              style={{
                background: activeTab === tab.id ? "#DC0000" : "transparent",
                color: activeTab === tab.id ? "#ffffff" : "var(--text-3)",
              }}>
              {tab.label}
            </button>
          ))}
        </div>
      ) : (
        <div className="px-4 mb-3">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
            📅 Race Weekend Schedule
          </p>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-8">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-xl h-14 animate-pulse" style={{ background: "var(--surface-2)" }} />
            ))}
          </div>
        ) : activeTab === "schedule" ? (
          <PracticeSchedule race={raceDetails} />
        ) : activeTab === "qualifying" ? (
          <RaceResults list={results.qualifying} isQual />
        ) : activeTab === "sprint" ? (
          <RaceResults list={results.sprint} />
        ) : activeTab === "sprintQual" ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">⚡</p>
            <p className="text-sm font-medium" style={{ color: "var(--text-3)" }}>Sprint Qualifying results</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-4)" }}>Not yet available in our data source</p>
          </div>
        ) : (
          <RaceResults list={results.race} />
        )}
      </div>
    </div>
  );
}

// ── Main F1 Page ───────────────────────────────────────

export default function F1Page() {
  const [activeTab, setActiveTab]         = useState("calendar");
  const [selectedRace, setSelectedRace]   = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);

  const tabs = [
    { id: "calendar",     label: "Calendar",     icon: "📅" },
    { id: "drivers",      label: "Drivers",      icon: "👤" },
    { id: "constructors", label: "Constructors", icon: "🏭" },
  ];

  return (
    <div className="pb-8">
      {selectedRace && (
        <RaceDetail race={selectedRace} onClose={() => setSelectedRace(null)} />
      )}
      {selectedDriver && (
        <F1DriverDetail driver={selectedDriver} onClose={() => setSelectedDriver(null)} />
      )}

      {/* Header */}
      <div className="px-4 pt-2 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(220,0,0,0.12)", border: "1px solid rgba(220,0,0,0.25)" }}>
            <span className="text-xl">🏎️</span>
          </div>
          <div>
            <h2 className="text-base font-black"
              style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--text-1)" }}>
              Formula 1
            </h2>
            <p className="text-xs" style={{ color: "var(--text-3)" }}>2026 World Championship</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 mb-4 overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200"
            style={activeTab === tab.id ? {
              background: "rgba(220,0,0,0.12)",
              border: "1px solid rgba(220,0,0,0.25)",
              color: "#DC0000",
            } : {
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              color: "var(--text-3)",
            }}>
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "calendar"     && <RaceCalendar onSelectRace={setSelectedRace} />}
      {activeTab === "drivers"      && <DriverStandings onSelectDriver={setSelectedDriver} />}
      {activeTab === "constructors" && <ConstructorStandings />}
    </div>
  );
}