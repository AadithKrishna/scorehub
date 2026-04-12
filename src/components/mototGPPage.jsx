import { useState, useEffect } from "react";

const SEASON_UUID = "e88b4e43-2209-47aa-8e83-0e0b1cedde6e";
const CATEGORY_UUID = "e8c110ad-64aa-4e8e-8a86-f2f152f6a942";
const BASE = "/api/motogp?path=";

const CONSTRUCTOR_COLORS = {
  Aprilia: "#65c9b2",
  Ducati:  "#e10600",
  KTM:     "#ff6500",
  Yamaha:  "#003087",
  Honda:   "#cc0000",
  Suzuki:  "#1a5276",
};

function getConstructorColor(name) {
  return CONSTRUCTOR_COLORS[name] || "#8b5cf6";
}

function countryFlag(iso) {
  if (!iso) return "🏁";
  const flags = {
    IT: "🇮🇹", ES: "🇪🇸", FR: "🇫🇷", GB: "🇬🇧", AU: "🇦🇺",
    JP: "🇯🇵", DE: "🇩🇪", PT: "🇵🇹", TH: "🇹🇭", BR: "🇧🇷",
    ZA: "🇿🇦", TR: "🇹🇷", AR: "🇦🇷", US: "🇺🇸", SA: "🇸🇦",
  };
  return flags[iso] || "🏁";
}

// ── Rider Standings ────────────────────────────────────

function RiderStandings() {
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE}results/standings?seasonUuid=${SEASON_UUID}&categoryUuid=${CATEGORY_UUID}`)
      .then(r => r.json())
      .then(d => {
        setStandings(d.classification || []);
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
        const color = getConstructorColor(s.constructor?.name);
        const isTop3 = s.position <= 3;
        return (
          <div
            key={s.id}
            className="glass-card rounded-2xl px-4 py-3 flex items-center gap-3"
            style={isTop3 ? { borderLeft: `3px solid ${color}` } : {}}
          >
            <span className={`text-lg font-black w-6 text-center tabular-nums ${
              s.position === 1 ? "text-yellow-400" :
              s.position === 2 ? "text-slate-300" :
              s.position === 3 ? "text-amber-600" :
              "text-white/30"
            }`}>
              {s.position}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm">{countryFlag(s.rider?.country?.iso)}</span>
                <p className="text-sm font-bold text-white truncate">
                  #{s.rider?.number}{" "}
                  <span style={{ color }}>{s.rider?.full_name}</span>
                </p>
              </div>
              <p className="text-xs text-white/35 mt-0.5">
                {s.team?.name} · {s.constructor?.name}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-base font-black text-white">{s.points}</p>
              <p className="text-xs text-white/30">
                {s.race_wins} win{s.race_wins !== 1 ? "s" : ""}
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
    fetch(`${BASE}results/standings?seasonUuid=${SEASON_UUID}&categoryUuid=${CATEGORY_UUID}`)
      .then(r => r.json())
      .then(d => {
        // Group by constructor
        const constructors = {};
        (d.classification || []).forEach(s => {
          const name = s.constructor?.name;
          if (!name) return;
          if (!constructors[name]) {
            constructors[name] = { name, points: 0, wins: 0 };
          }
          constructors[name].points += s.points || 0;
          constructors[name].wins += s.race_wins || 0;
        });
        const sorted = Object.values(constructors)
          .sort((a, b) => b.points - a.points)
          .map((c, i) => ({ ...c, position: i + 1 }));
        setStandings(sorted);
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

  const maxPoints = standings[0]?.points || 1;

  return (
    <div className="px-4 space-y-2">
      {standings.map((s) => {
        const color = getConstructorColor(s.name);
        const isTop3 = s.position <= 3;
        const pct = (s.points / maxPoints) * 100;

        return (
          <div
            key={s.name}
            className="glass-card rounded-2xl px-4 py-3"
            style={isTop3 ? { borderLeft: `3px solid ${color}` } : {}}
          >
            <div className="flex items-center gap-3 mb-2">
              <span className={`text-lg font-black w-6 text-center ${
                s.position === 1 ? "text-yellow-400" :
                s.position === 2 ? "text-slate-300" :
                s.position === 3 ? "text-amber-600" :
                "text-white/30"
              }`}>
                {s.position}
              </span>
              <div className="flex-1">
                <p className="text-sm font-bold" style={{ color }}>{s.name}</p>
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
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      fetch(`${BASE}results/events?seasonUuid=${SEASON_UUID}&isFinished=true`).then(r => r.json()),
      fetch(`${BASE}results/events?seasonUuid=${SEASON_UUID}&isFinished=false`).then(r => r.json()),
    ]).then(([finished, upcoming]) => {
      const all = [
        ...(finished.status === "fulfilled" && Array.isArray(finished.value) ? finished.value : []),
        ...(upcoming.status === "fulfilled" && Array.isArray(upcoming.value) ? upcoming.value : []),
      ].sort((a, b) => new Date(a.date_start) - new Date(b.date_start));
      setEvents(all);
      setLoading(false);
    });
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
      {events.map((event, idx) => {
        const endDate = new Date(event.date_end);
        const startDate = new Date(event.date_start);
        const isPast = endDate < now;
        const prevPast = idx === 0 ? false : new Date(events[idx - 1].date_end) < now;
        const isNext = !isPast && prevPast;

        return (
          <div
            key={event.id}
            onClick={() => onSelectRace(event)}
            className={`glass-card card-hover rounded-2xl px-4 py-3 cursor-pointer
              ${isNext ? "ring-1 ring-orange-500/50" : ""}
            `}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-lg">{countryFlag(event.country?.iso)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">
                    {event.sponsored_name || event.name}
                  </p>
                  <p className="text-xs text-white/35 mt-0.5">
                    🏁 {event.circuit?.name}, {event.country?.name}
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-2">
                {isPast ? (
                  <span className="text-xs text-white/25 bg-white/5 px-2 py-1 rounded-full">
                    Done
                  </span>
                ) : isNext ? (
                  <span className="text-xs text-orange-400 bg-orange-500/15 px-2 py-1 rounded-full font-bold">
                    Next
                  </span>
                ) : (
                  <span className="text-xs text-blue-400/70">
                    {startDate.toLocaleDateString(undefined, {
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

// ── Session Results ────────────────────────────────────

function SessionResults({ sessionId }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE}results/classifications?sessionUuid=${sessionId}`)
      .then(r => r.json())
      .then(d => {
        setResults(d.classification || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [sessionId]);

  if (loading) return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="glass rounded-xl h-14 animate-pulse" />
      ))}
    </div>
  );

  if (!results.length) return (
    <div className="text-center py-12">
      <p className="text-4xl mb-3">🏍️</p>
      <p className="text-sm text-white/30">No results available</p>
      <p className="text-xs text-white/15 mt-1">Results appear after the session</p>
    </div>
  );

  return (
    <div className="space-y-2">
      {results
        .filter(r => r.position !== null)
        .map((r, i) => {
          const color = getConstructorColor(r.constructor?.name);
          const isTop3 = r.position <= 3;
          return (
            <div
              key={r.id}
              className="glass-card rounded-xl px-4 py-2.5 flex items-center gap-3"
              style={isTop3 ? { borderLeft: `3px solid ${color}` } : {}}
            >
              <span className={`text-sm font-black w-6 text-center tabular-nums ${
                r.position === 1 ? "text-yellow-400" :
                r.position === 2 ? "text-slate-300" :
                r.position === 3 ? "text-amber-600" :
                "text-white/30"
              }`}>
                {r.position === 1 ? "🥇" :
                 r.position === 2 ? "🥈" :
                 r.position === 3 ? "🥉" :
                 r.position}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  #{r.rider?.number} {r.rider?.full_name}
                  <span className="ml-1">{countryFlag(r.rider?.country?.iso)}</span>
                </p>
                <p className="text-xs truncate" style={{ color, opacity: 0.8 }}>
                  {r.team?.name}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-bold text-white/60 tabular-nums">
                  {r.position === 1
                    ? r.time
                    : r.gap?.first
                    ? `+${r.gap.first}`
                    : r.time || "—"}
                </p>
                {r.points > 0 && (
                  <p className="text-xs text-white/25">+{r.points}pts</p>
                )}
              </div>
            </div>
          );
        })}

      {/* DNFs */}
      {results.filter(r => r.position === null).length > 0 && (
        <div className="pt-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-px flex-1 bg-white/8" />
            <span className="text-xs text-white/20">DNF</span>
            <div className="h-px flex-1 bg-white/8" />
          </div>
          {results.filter(r => r.position === null).map((r, i) => (
            <div key={r.id} className="glass-card rounded-xl px-4 py-2 flex items-center gap-3 mb-1.5 opacity-40">
              <span className="text-xs font-bold text-white/30 w-6 text-center">DNF</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  #{r.rider?.number} {r.rider?.full_name}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Race Detail ────────────────────────────────────────

function RaceDetail({ event, onClose }) {
  const [visible, setVisible] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState(null);

  const isPast = new Date(event.date_end) < new Date();
  const isUpcoming = new Date(event.date_start) > new Date();

  useEffect(() => {
    setTimeout(() => setVisible(true), 10);
    if (isPast || !isUpcoming) {
      fetch(`${BASE}results/sessions?eventUuid=${event.id}&categoryUuid=${CATEGORY_UUID}`)
        .then(r => r.json())
        .then(d => {
          const list = Array.isArray(d) ? d : [];
          setSessions(list);
          // Default to Race session
          const race = list.find(s => s.type === "RAC") || list[list.length - 1];
          if (race) setActiveSession(race);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 300);
  }

  // Session display names
  const sessionName = (type) => {
    const names = {
      FP:  "Practice",
      PR:  "Pre-Race",
      Q:   "Qualifying",
      SPR: "Sprint",
      WUP: "Warm Up",
      RAC: "Race",
    };
    return names[type] || type;
  };

  const sessionIcon = (type) => {
    const icons = {
      FP:  "🔧", PR: "🔧", Q: "⏱",
      SPR: "⚡", WUP: "🌅", RAC: "🏁",
    };
    return icons[type] || "🏍️";
  };

  // Schedule for upcoming races
  const scheduleItems = [
    { label: "Practice 1",   date: event.date_start,  offset: 0   },
    { label: "Practice 2",   date: event.date_start,  offset: 0.3 },
    { label: "Qualifying 1", date: event.date_start,  offset: 1   },
    { label: "Qualifying 2", date: event.date_start,  offset: 1.5 },
    { label: "Sprint Race",  date: event.date_end,    offset: -1  },
    { label: "Warm Up",      date: event.date_end,    offset: -0.3},
    { label: "Race",         date: event.date_end,    offset: 0   },
  ];

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
            <span className="text-lg">{countryFlag(event.country?.iso)}</span>
            <span className="text-xs text-white/40 font-semibold uppercase tracking-widest">
              MotoGP · {event.country?.name}
            </span>
          </div>
          <h2
            className="text-lg font-black text-white leading-tight truncate"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {event.sponsored_name || event.name}
          </h2>
          <p className="text-xs text-white/35 mt-0.5">
            🏁 {event.circuit?.name}
          </p>
        </div>
        <button
          onClick={handleClose}
          className="w-9 h-9 glass-strong rounded-full flex items-center justify-center hover:bg-white/10 flex-shrink-0"
        >
          <span className="text-white/60 text-xl leading-none">×</span>
        </button>
      </div>

      {/* Date */}
      <div className="px-4 mb-3">
        <div className="glass-card rounded-xl px-4 py-2.5 flex items-center justify-between">
          <span className="text-xs text-white/40">Race weekend</span>
          <span className="text-sm font-bold text-white">
            {new Date(event.date_start).toLocaleDateString(undefined, {
              day: "numeric", month: "short",
            })} – {new Date(event.date_end).toLocaleDateString(undefined, {
              day: "numeric", month: "short", year: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* Session selector */}
      {!isUpcoming && sessions.length > 0 && (
        <div className="flex gap-1.5 px-4 mb-3 overflow-x-auto no-scrollbar">
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSession(s)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeSession?.id === s.id
                  ? "bg-orange-500/30 text-orange-300 border border-orange-500/50"
                  : "glass text-white/40 hover:text-white/70"
              }`}
            >
              <span>{sessionIcon(s.type)}</span>
              {sessionName(s.type)}
            </button>
          ))}
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
        ) : isUpcoming ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">🏍️</p>
            <p className="text-base font-bold text-white/50 mb-1">
              Race weekend upcoming
            </p>
            <p className="text-sm text-white/25">
              {new Date(event.date_start).toLocaleDateString(undefined, {
                weekday: "long", day: "numeric", month: "long",
              })}
            </p>
          </div>
        ) : activeSession ? (
          <SessionResults sessionId={activeSession.id} />
        ) : (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🏍️</p>
            <p className="text-sm text-white/30">Select a session above</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main MotoGP Page ───────────────────────────────────

export default function MotoGPPage() {
  const [activeTab, setActiveTab] = useState("calendar");
  const [selectedRace, setSelectedRace] = useState(null);

  const tabs = [
    { id: "calendar",     label: "Calendar",     icon: "📅" },
    { id: "riders",       label: "Riders",       icon: "🏍️" },
    { id: "constructors", label: "Constructors", icon: "🏭" },
  ];

  return (
    <div className="pb-8">
      {selectedRace && (
        <RaceDetail
          event={selectedRace}
          onClose={() => setSelectedRace(null)}
        />
      )}

      {/* MotoGP header */}
      <div className="px-4 pt-2 pb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: "rgba(251,146,60,0.2)",
              border: "1px solid rgba(251,146,60,0.4)",
            }}
          >
            <span className="text-xl">🏍️</span>
          </div>
          <div>
            <h2
              className="text-base font-black text-white"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              MotoGP
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
                    background: "rgba(251,146,60,0.3)",
                    border: "1px solid rgba(251,146,60,0.5)",
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
      {activeTab === "riders" && <RiderStandings />}
      {activeTab === "constructors" && <ConstructorStandings />}
    </div>
  );
}