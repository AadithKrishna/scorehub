import { useState, useEffect } from "react";

const JOLPICA = "https://api.jolpi.ca/ergast/f1";

const TEAM_COLORS = {
  mercedes:     "#00D2BE",
  ferrari:      "#DC0000",
  red_bull:     "#0600EF",
  mclaren:      "#FF8000",
  aston_martin: "#006F62",
  alpine:       "#0090FF",
  williams:     "#005AFF",
  haas:         "#B6BABD",
  sauber:       "#00E48F",
  rb:           "#1434CB",
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

function DriverStandings() {
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${JOLPICA}/2026/driverStandings.json`)
      .then(r => r.json())
      .then(d => {
        setStandings(
          d.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings || []
        );
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-3 px-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="glass rounded-2xl h-16 animate-pulse" />
      ))}
    </div>
  );

  return (
    <div className="px-4 space-y-2">
      {standings.map((s) => {
        const color = getTeamColor(s.Constructors?.[0]?.constructorId);
        const isTop3 = parseInt(s.position) <= 3;
        return (
          <div
            key={s.Driver.driverId}
            className="glass-card rounded-2xl px-4 py-3 flex items-center gap-3"
            style={isTop3 ? { borderLeft: `3px solid ${color}` } : {}}
          >
            <span className={`text-lg font-black w-6 text-center tabular-nums ${
              s.position === "1" ? "text-yellow-400" :
              s.position === "2" ? "text-slate-300" :
              s.position === "3" ? "text-amber-600" :
              "text-white/30"
            }`}>
              {s.position}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm">{countryFlag(s.Driver.nationality)}</span>
                <p className="text-sm font-bold text-white truncate">
                  {s.Driver.givenName}{" "}
                  <span style={{ color }}>{s.Driver.familyName}</span>
                </p>
              </div>
              <p className="text-xs text-white/35 mt-0.5">
                {s.Constructors?.[0]?.name}
              </p>
            </div>
            <div className="text-right">
              <p className="text-base font-black text-white">{s.points}</p>
              <p className="text-xs text-white/30">
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${JOLPICA}/2026/constructorStandings.json`)
      .then(r => r.json())
      .then(d => {
        setStandings(
          d.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings || []
        );
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-3 px-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="glass rounded-2xl h-16 animate-pulse" />
      ))}
    </div>
  );

  const maxPoints = parseInt(standings[0]?.points || 1);

  return (
    <div className="px-4 space-y-2">
      {standings.map((s) => {
        const color = getTeamColor(s.Constructor.constructorId);
        const isTop3 = parseInt(s.position) <= 3;
        const pct = (parseInt(s.points) / maxPoints) * 100;

        return (
          <div
            key={s.Constructor.constructorId}
            className="glass-card rounded-2xl px-4 py-3"
            style={isTop3 ? { borderLeft: `3px solid ${color}` } : {}}
          >
            <div className="flex items-center gap-3 mb-2">
              <span className={`text-lg font-black w-6 text-center ${
                s.position === "1" ? "text-yellow-400" :
                s.position === "2" ? "text-slate-300" :
                s.position === "3" ? "text-amber-600" :
                "text-white/30"
              }`}>
                {s.position}
              </span>
              <div className="flex-1">
                <p className="text-sm font-bold" style={{ color }}>
                  {s.Constructor.name}
                </p>
              </div>
              <p className="text-base font-black text-white">{s.points} pts</p>
            </div>
            <div className="ml-9 h-1 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: color, opacity: 0.7 }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Race Calendar ──────────────────────────────────────

function RaceCalendar({ onSelectRace }) {
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${JOLPICA}/2026.json`)
      .then(r => r.json())
      .then(d => {
        setRaces(d.MRData?.RaceTable?.Races || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-3 px-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="glass rounded-2xl h-20 animate-pulse" />
      ))}
    </div>
  );

  const now = new Date();

  return (
    <div className="px-4 space-y-2">
      {races.map((race, idx) => {
        const raceDate = new Date(race.date + "T" + (race.time || "12:00:00Z"));
        const isPast = raceDate < now;
        const prevPast = idx === 0
          ? false
          : new Date(races[idx - 1].date) < now;
        const isNext = !isPast && prevPast;
        const hasSprint = !!race.Sprint;

        return (
          <div
            key={race.round}
            onClick={() => onSelectRace(race)}
            className={`glass-card card-hover rounded-2xl px-4 py-3 cursor-pointer
              ${isNext ? "ring-1 ring-violet-500/50" : ""}
            `}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-xs font-bold text-white/25 w-6 text-center">
                  R{race.round}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-white truncate">
                      {race.raceName}
                    </p>
                    {hasSprint && (
                      <span className="text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30 px-1.5 py-0.5 rounded-full flex-shrink-0">
                        Sprint
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/35 mt-0.5">
                    🏁 {race.Circuit?.circuitName}
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-2">
                {isPast ? (
                  <span className="text-xs text-white/25 bg-white/5 px-2 py-1 rounded-full">
                    Done
                  </span>
                ) : isNext ? (
                  <span className="text-xs text-violet-400 bg-violet-500/15 px-2 py-1 rounded-full font-bold">
                    Next
                  </span>
                ) : (
                  <span className="text-xs text-blue-400/70">
                    {raceDate.toLocaleDateString("en-GB", {
                      day: "numeric", month: "short",
                    })}
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
  const now = new Date();
  const hasSprint = !!race.Sprint;

  const sessions = hasSprint ? [
    { name: "Practice 1",       short: "FP1",  date: race.FirstPractice?.date,  time: race.FirstPractice?.time,  color: null      },
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
  ].filter(s => s.date);

  return (
    <div className="space-y-2">
      {hasSprint && (
        <div className="mb-3">
          <span className="text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-1 rounded-full font-semibold">
            ⚡ Sprint Weekend
          </span>
        </div>
      )}
      {sessions.map((s, i) => {
        if (!s.date) return null;
        const dt = new Date(`${s.date}T${s.time || "12:00:00Z"}`);
        const isPast = dt < now;
        const isNext = !isPast &&
          sessions.slice(0, i).filter(x => x.date).every(prev =>
            new Date(`${prev.date}T${prev.time || "12:00:00Z"}`) < now
          );
        const daysAway = Math.ceil((dt - now) / (1000 * 60 * 60 * 24));
        const bgColor = s.color ? `${s.color}22` : "rgba(255,255,255,0.05)";
        const borderColor = s.color ? `${s.color}44` : "rgba(255,255,255,0.08)";
        const textColor = s.color || "rgba(255,255,255,0.4)";

        return (
          <div
            key={s.short}
            className={`glass-card rounded-xl px-4 py-3 flex items-center gap-3
              ${isNext ? "ring-1 ring-violet-500/50" : ""}
            `}
          >
            <div
              className="w-12 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: bgColor, border: `1px solid ${borderColor}` }}
            >
              <span className="text-xs font-black" style={{ color: textColor }}>
                {s.short}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${isPast ? "text-white/40" : "text-white"}`}>
                {s.name}
              </p>
              <p className="text-xs text-white/35 mt-0.5">
                {dt.toLocaleDateString(undefined, {
                  weekday: "short", day: "numeric", month: "short",
                })}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className={`text-sm font-bold ${isPast ? "text-white/30" : "text-white/70"}`}>
                {dt.toLocaleTimeString(undefined, {
                  hour: "2-digit", minute: "2-digit",
                })}
              </p>
              {isPast ? (
                <span className="text-xs text-white/20">Done</span>
              ) : isNext ? (
                <span className="text-xs text-violet-400 font-semibold">Next up</span>
              ) : (
                <span className="text-xs text-white/20">{daysAway}d away</span>
              )}
            </div>
          </div>
        );
      })}
      <p className="text-center text-xs text-white/15 pt-2">
        Times shown in your local timezone
      </p>
    </div>
  );
}

// ── Race Detail ────────────────────────────────────────

function RaceDetail({ race, onClose }) {
  const [visible, setVisible] = useState(false);
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [hasSprint, setHasSprint] = useState(!!race.Sprint);
  const [raceDetails, setRaceDetails] = useState(race);

  const raceDate = new Date(race.date + "T" + (race.time || "12:00:00Z"));
  const isUpcoming = raceDate > new Date();

  const [activeTab, setActiveTab] = useState(isUpcoming ? "practice" : "race");

  // Build tabs dynamically based on confirmed hasSprint
  const tabs = isUpcoming
    ? [{ id: "practice", label: "📅 Schedule" }]
    : [
        { id: "race",       label: "🏁 Race"      },
        { id: "qualifying", label: "⏱ Qualifying" },
        ...(hasSprint
          ? [
              { id: "sprint",     label: "⚡ Sprint"             },
              { id: "sprintQual", label: "⚡ Sprint Qualifying"   },
            ]
          : []),
      ];

  useEffect(() => {
    setTimeout(() => setVisible(true), 10);

    // Always fetch full race details to confirm sprint status accurately
    fetch(`${JOLPICA}/2026/${race.round}.json`)
      .then(r => r.json())
      .then(d => {
        const full = d.MRData?.RaceTable?.Races?.[0];
        if (full) {
          setRaceDetails(full);
          setHasSprint(!!full.Sprint);
        }
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

      if (hasSprint) {
        fetches.push(
          fetch(`${JOLPICA}/2026/${race.round}/sprint.json`).then(r => r.json())
        );
      }

      const settled = await Promise.allSettled(fetches);

      setResults({
        race: settled[0]?.status === "fulfilled"
          ? settled[0].value.MRData?.RaceTable?.Races?.[0]?.Results || []
          : [],
        qualifying: settled[1]?.status === "fulfilled"
          ? settled[1].value.MRData?.RaceTable?.Races?.[0]?.QualifyingResults || []
          : [],
        sprint: hasSprint && settled[2]?.status === "fulfilled"
          ? settled[2].value.MRData?.RaceTable?.Races?.[0]?.SprintResults || []
          : [],
        sprintQual: [],
      });
    } catch {}
    setLoading(false);
  }

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 300);
  }

  const renderResults = (list, isQual = false) => {
    if (!list?.length) return (
      <div className="text-center py-12">
        <p className="text-4xl mb-3">🏁</p>
        <p className="text-sm text-white/30">No results available</p>
        <p className="text-xs text-white/15 mt-1">
          Results will appear after the session
        </p>
      </div>
    );

    return (
      <div className="space-y-2">
        {list.map((r, i) => {
          const color = getTeamColor(r.Constructor?.constructorId);
          const isTop3 = parseInt(r.position) <= 3;
          const time = isQual
            ? (r.Q3 || r.Q2 || r.Q1 || "—")
            : (r.Time?.time || r.status || "—");

          return (
            <div
              key={i}
              className="glass-card rounded-xl px-4 py-2.5 flex items-center gap-3"
              style={isTop3 ? { borderLeft: `3px solid ${color}` } : {}}
            >
              <span className={`text-sm font-black w-6 text-center tabular-nums ${
                r.position === "1" ? "text-yellow-400" :
                r.position === "2" ? "text-slate-300" :
                r.position === "3" ? "text-amber-600" :
                "text-white/30"
              }`}>
                {r.position === "1" ? "🥇" :
                 r.position === "2" ? "🥈" :
                 r.position === "3" ? "🥉" :
                 r.position}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {r.Driver?.code || r.Driver?.familyName}
                  <span className="text-white/40 font-normal text-xs ml-1">
                    {countryFlag(r.Driver?.nationality)}
                  </span>
                </p>
                <p className="text-xs truncate" style={{ color, opacity: 0.8 }}>
                  {r.Constructor?.name}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-bold text-white/60 tabular-nums">
                  {time}
                </p>
                {r.points && parseInt(r.points) > 0 && (
                  <p className="text-xs text-white/25">+{r.points}pts</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

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
        <div className="flex-1 min-w-0 mr-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-white/40 font-semibold uppercase tracking-widest">
              🏎️ Formula 1 · Round {race.round}
            </span>
            {hasSprint && (
              <span className="text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full">
                Sprint
              </span>
            )}
          </div>
          <h2
            className="text-lg font-black text-white leading-tight truncate"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {race.raceName}
          </h2>
          <p className="text-xs text-white/35 mt-0.5">
            🏁 {race.Circuit?.circuitName}, {race.Circuit?.Location?.country}
          </p>
        </div>
        <button
          onClick={handleClose}
          className="w-9 h-9 glass-strong rounded-full flex items-center justify-center hover:bg-white/10 flex-shrink-0"
        >
          <span className="text-white/60 text-xl leading-none">×</span>
        </button>
      </div>

      {/* Race date */}
      <div className="px-4 mb-3">
        <div className="glass-card rounded-xl px-4 py-2.5 flex items-center justify-between">
          <span className="text-xs text-white/40">Race date</span>
          <span className="text-sm font-bold text-white">
            {new Date(race.date).toLocaleDateString(undefined, {
              weekday: "short", day: "numeric",
              month: "long", year: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* Tabs */}
      {tabs.length > 1 ? (
        <div className="flex gap-1 mx-4 mb-4 glass rounded-xl p-1 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 px-2 ${
                activeTab === tab.id
                  ? "bg-red-600 text-white"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      ) : (
        <div className="px-4 mb-3">
          <p className="text-xs text-white/30 font-semibold uppercase tracking-widest">
            📅 Race Weekend Schedule
          </p>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-8">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="glass rounded-xl h-14 animate-pulse" />
            ))}
          </div>
        ) : activeTab === "practice" ? (
          <PracticeSchedule race={raceDetails} />
        ) : activeTab === "qualifying" ? (
          renderResults(results.qualifying, true)
        ) : activeTab === "sprint" ? (
          renderResults(results.sprint)
        ) : activeTab === "sprintQual" ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">⚡</p>
            <p className="text-sm text-white/30 font-medium">
              Sprint Qualifying results
            </p>
            <p className="text-xs text-white/15 mt-1">
              Not yet available in our data source
            </p>
          </div>
        ) : (
          renderResults(results.race)
        )}
      </div>
    </div>
  );
}

// ── Main F1 Page ───────────────────────────────────────

export default function F1Page() {
  const [activeTab, setActiveTab] = useState("calendar");
  const [selectedRace, setSelectedRace] = useState(null);

  const tabs = [
    { id: "calendar",     label: "Calendar",     icon: "📅" },
    { id: "drivers",      label: "Drivers",      icon: "👤" },
    { id: "constructors", label: "Constructors", icon: "🏭" },
  ];

  return (
    <div className="pb-8">
      {selectedRace && (
        <RaceDetail
          race={selectedRace}
          onClose={() => setSelectedRace(null)}
        />
      )}

      {/* F1 header */}
      <div className="px-4 pt-2 pb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: "rgba(220,0,0,0.2)",
              border: "1px solid rgba(220,0,0,0.4)",
            }}
          >
            <span className="text-xl">🏎️</span>
          </div>
          <div>
            <h2
              className="text-base font-black text-white"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Formula 1
            </h2>
            <p className="text-xs text-white/35">2026 World Championship</p>
          </div>
        </div>
      </div>

      {/* Sub tabs */}
      <div className="flex gap-2 px-4 mb-4 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
              activeTab === tab.id
                ? "text-white"
                : "glass text-white/50 hover:text-white/80"
            }`}
            style={
              activeTab === tab.id
                ? {
                    background: "rgba(220,0,0,0.3)",
                    border: "1px solid rgba(220,0,0,0.5)",
                  }
                : {}
            }
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "calendar" && (
        <RaceCalendar onSelectRace={setSelectedRace} />
      )}
      {activeTab === "drivers" && <DriverStandings />}
      {activeTab === "constructors" && <ConstructorStandings />}
    </div>
  );
}