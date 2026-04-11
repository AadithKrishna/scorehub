import { useState, useEffect } from "react";

const JOLPICA = "https://api.jolpi.ca/ergast/f1";

// Team colors
const TEAM_COLORS = {
  mercedes:     "#00D2BE",
  ferrari:      "#DC0000",
  "red_bull":   "#0600EF",
  mclaren:      "#FF8000",
  aston_martin: "#006F62",
  alpine:       "#0090FF",
  williams:     "#005AFF",
  haas:         "#B6BABD",
  sauber:       "#00E48F",
  "rb":         "#1434CB",
};

function getTeamColor(constructorId) {
  return TEAM_COLORS[constructorId] || "#8b5cf6";
}

// ── Flag helper ───────────────────────────────────────
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

// ── Driver Standings ──────────────────────────────────
function DriverStandings() {
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${JOLPICA}/2026/driverStandings.json`)
      .then(r => r.json())
      .then(d => {
        const list = d.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings || [];
        setStandings(list);
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

  return (
    <div className="px-4 space-y-2">
      {standings.map((s, i) => {
        const color = getTeamColor(s.Constructors?.[0]?.constructorId);
        const isTop3 = parseInt(s.position) <= 3;
        return (
          <div key={s.Driver.driverId}
            className="glass-card rounded-2xl px-4 py-3 flex items-center gap-3"
            style={isTop3 ? { borderLeft: `3px solid ${color}` } : {}}
          >
            {/* Position */}
            <span className={`text-lg font-black w-6 text-center tabular-nums ${
              s.position === "1" ? "text-yellow-400" :
              s.position === "2" ? "text-slate-300" :
              s.position === "3" ? "text-amber-600" :
              "text-white/30"
            }`}>
              {s.position}
            </span>

            {/* Driver info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm">{countryFlag(s.Driver.nationality)}</span>
                <p className="text-sm font-bold text-white truncate">
                  {s.Driver.givenName} <span style={{ color }}>{s.Driver.familyName}</span>
                </p>
              </div>
              <p className="text-xs text-white/35 mt-0.5">{s.Constructors?.[0]?.name}</p>
            </div>

            {/* Points + wins */}
            <div className="text-right">
              <p className="text-base font-black text-white">{s.points}</p>
              <p className="text-xs text-white/30">{s.wins} win{s.wins !== "1" ? "s" : ""}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Constructor Standings ─────────────────────────────
function ConstructorStandings() {
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${JOLPICA}/2026/constructorStandings.json`)
      .then(r => r.json())
      .then(d => {
        const list = d.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings || [];
        setStandings(list);
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

  return (
    <div className="px-4 space-y-2">
      {standings.map((s) => {
        const color = getTeamColor(s.Constructor.constructorId);
        const isTop3 = parseInt(s.position) <= 3;
        const pct = (parseInt(s.points) / parseInt(standings[0]?.points || 1)) * 100;

        return (
          <div key={s.Constructor.constructorId}
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
            {/* Points bar */}
            <div className="ml-9 h-1 rounded-full bg-white/5 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: color, opacity: 0.7 }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Race Calendar ─────────────────────────────────────
function RaceCalendar({ onSelectRace }) {
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${JOLPICA}/2026.json`)
      .then(r => r.json())
      .then(d => {
        const list = d.MRData?.RaceTable?.Races || [];
        setRaces(list);
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
      {races.map((race) => {
        const raceDate = new Date(race.date + "T" + (race.time || "12:00:00Z"));
        const isPast = raceDate < now;
        const isNext = !isPast && races.filter(r =>
          new Date(r.date) < now
        ).length === races.indexOf(race);

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
                  <p className="text-sm font-bold text-white truncate">
                    {race.raceName}
                  </p>
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

// ── Race Detail ───────────────────────────────────────
function RaceDetail({ race, onClose }) {
  const [visible, setVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("race");
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setVisible(true), 10);
    loadResults();
  }, []);

  async function loadResults() {
    setLoading(true);
    try {
      const [raceRes, qualRes, sprintRes] = await Promise.allSettled([
        fetch(`${JOLPICA}/2026/${race.round}/results.json`).then(r => r.json()),
        fetch(`${JOLPICA}/2026/${race.round}/qualifying.json`).then(r => r.json()),
        fetch(`${JOLPICA}/2026/${race.round}/sprint.json`).then(r => r.json()),
      ]);

      setResults({
        race:      raceRes.status === "fulfilled"
          ? raceRes.value.MRData?.RaceTable?.Races?.[0]?.Results || []
          : [],
        qualifying: qualRes.status === "fulfilled"
          ? qualRes.value.MRData?.RaceTable?.Races?.[0]?.QualifyingResults || []
          : [],
        sprint:    sprintRes.status === "fulfilled"
          ? sprintRes.value.MRData?.RaceTable?.Races?.[0]?.SprintResults || []
          : [],
      });
    } catch {}
    setLoading(false);
  }

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 300);
  }

  const tabs = [
    { id: "race",       label: "Race"      },
    { id: "qualifying", label: "Qualifying" },
    { id: "sprint",     label: "Sprint"    },
  ];

  const renderResults = (list) => {
    if (!list?.length) return (
      <div className="text-center py-12">
        <p className="text-4xl mb-3">🏁</p>
        <p className="text-sm text-white/30">No results yet</p>
      </div>
    );

    return (
      <div className="space-y-2">
        {list.map((r, i) => {
          const color = getTeamColor(r.Constructor?.constructorId);
          const isTop3 = parseInt(r.position) <= 3;
          return (
            <div key={i}
              className="glass-card rounded-xl px-4 py-2.5 flex items-center gap-3"
              style={isTop3 ? { borderLeft: `3px solid ${color}` } : {}}
            >
              <span className={`text-sm font-black w-5 text-center tabular-nums ${
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
                  {r.Time?.time || r.status || r.Q3 || r.Q2 || r.Q1 || "—"}
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
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-white/40 font-semibold uppercase tracking-widest">
              🏎️ Formula 1 · Round {race.round}
            </span>
          </div>
          <h2 className="text-lg font-black text-white leading-tight"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {race.raceName}
          </h2>
          <p className="text-xs text-white/35 mt-0.5">
            🏁 {race.Circuit?.circuitName}, {race.Circuit?.Location?.country}
          </p>
        </div>
        <button
          onClick={handleClose}
          className="w-9 h-9 glass-strong rounded-full flex items-center justify-center hover:bg-white/10"
        >
          <span className="text-white/60 text-lg">×</span>
        </button>
      </div>

      {/* Race date */}
      <div className="px-4 mb-3">
        <div className="glass-card rounded-xl px-4 py-2.5 flex items-center justify-between">
          <span className="text-xs text-white/40">Race date</span>
          <span className="text-sm font-bold text-white">
            {new Date(race.date).toLocaleDateString("en-GB", {
              weekday: "short", day: "numeric", month: "long", year: "numeric"
            })}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mx-4 mb-4 glass rounded-xl p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
              activeTab === tab.id
                ? "bg-red-600 text-white"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-8">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="glass rounded-xl h-14 animate-pulse" />
            ))}
          </div>
        ) : (
          renderResults(results[activeTab])
        )}
      </div>
    </div>
  );
}

// ── Main F1 Page ──────────────────────────────────────
export default function F1Page() {
  const [activeTab, setActiveTab] = useState("calendar");
  const [selectedRace, setSelectedRace] = useState(null);

  const tabs = [
    { id: "calendar",     label: "Calendar",      icon: "📅" },
    { id: "drivers",      label: "Drivers",       icon: "👤" },
    { id: "constructors", label: "Constructors",  icon: "🏭" },
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
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(220,0,0,0.2)", border: "1px solid rgba(220,0,0,0.4)" }}>
            <span className="text-xl">🏎️</span>
          </div>
          <div>
            <h2 className="text-base font-black text-white"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
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
            style={activeTab === tab.id ? {
              background: "rgba(220,0,0,0.3)",
              border: "1px solid rgba(220,0,0,0.5)"
            } : {}}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "calendar" && (
        <RaceCalendar onSelectRace={setSelectedRace} />
      )}
      {activeTab === "drivers" && <DriverStandings />}
      {activeTab === "constructors" && <ConstructorStandings />}
    </div>
  );
}