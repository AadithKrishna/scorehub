import { useState, useEffect, useRef } from "react";
import MotoGPDriverDetail from "./MotoGPDriverDetail";
import { X, RefreshCw } from "lucide-react";

const SEASON_UUID   = "e88b4e43-2209-47aa-8e83-0e0b1cedde6e";
const CATEGORY_UUID = "e8c110ad-64aa-4e8e-8a86-f2f152f6a942";

function mgp(path) {
  return `/api/motogp?path=${encodeURIComponent(path)}`;
}

const CONSTRUCTOR_COLORS = {
  Aprilia: "#65c9b2", Ducati: "#e10600", KTM: "#ff6500",
  Yamaha: "#003087", Honda: "#cc0000", Suzuki: "#1a5276",
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
    QA: "🇶🇦", MY: "🇲🇾", ID: "🇮🇩", AT: "🇦🇹", NL: "🇳🇱",
    CZ: "🇨🇿", SM: "🇸🇲", CA: "🇨🇦",
  };
  return flags[iso] || "🏁";
}

function labelSessions(sessions) {
  const typeCount = {};
  const typeIndex = {};
  sessions.forEach(s => { typeCount[s.type] = (typeCount[s.type] || 0) + 1; });
  return sessions.map(s => {
    typeIndex[s.type] = (typeIndex[s.type] || 0) + 1;
    const count = typeCount[s.type];
    const idx   = typeIndex[s.type];
    const baseNames  = { FP: "Free Practice", PR: "Pre-Race", Q: "Qualifying", SPR: "Sprint", WUP: "Warm Up", RAC: "Race" };
    const shortNames = { FP: "FP", PR: "PR", Q: "Q", SPR: "SPR", WUP: "WUP", RAC: "RAC" };
    return {
      ...s,
      displayName: count > 1 ? `${baseNames[s.type] || s.type} ${idx}` : (baseNames[s.type] || s.type),
      shortName:   count > 1 ? `${shortNames[s.type] || s.type}${idx}` : (shortNames[s.type] || s.type),
    };
  });
}

// ── Rider Standings ────────────────────────────────────

function RiderStandings({ onSelectRider }) {
  const [standings, setStandings] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    fetch(mgp(`results/standings?seasonUuid=${SEASON_UUID}&categoryUuid=${CATEGORY_UUID}`))
      .then(r => r.json())
      .then(d => { setStandings(d.classification || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-3 px-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="glass rounded-2xl h-16 animate-pulse" />
      ))}
    </div>
  );

  if (!standings.length) return (
    <div className="text-center py-16">
      <p className="text-5xl mb-4">🏍️</p>
      <p className="text-sm" style={{ color: "var(--text-3)" }}>No standings available yet</p>
    </div>
  );

  return (
    <div className="px-4 space-y-2">
      {standings.map(s => {
        const color = getConstructorColor(s.constructor?.name);
        const isTop3 = s.position <= 3;
        return (
          <div
            key={s.id}
            className="glass-card rounded-2xl px-4 py-3 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
            style={isTop3 ? { borderLeft: `3px solid ${color}` } : {}}
            onClick={() => onSelectRider?.({
              id: s.rider?.id, name: s.rider?.full_name, number: s.rider?.number,
              logo: s.rider?.pictures?.profile?.main || null, country: s.rider?.country, sport: "motogp",
            })}
          >
            <span className={`text-lg font-black w-6 text-center tabular-nums ${
              s.position === 1 ? "text-yellow-400" : s.position === 2 ? "text-slate-300" :
              s.position === 3 ? "text-amber-600" : "text-white/30"
            }`}>{s.position}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm">{countryFlag(s.rider?.country?.iso)}</span>
                <p className="text-sm font-bold truncate" style={{ color: "var(--text-1)" }}>
                  <span style={{ color: "var(--text-3)", fontWeight: 400 }}>#{s.rider?.number}</span>{" "}
                  <span style={{ color }}>{s.rider?.full_name}</span>
                </p>
              </div>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
                {s.team?.name} · <span style={{ color }}>{s.constructor?.name}</span>
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-base font-black" style={{ color: "var(--text-1)" }}>{s.points}</p>
              <p className="text-xs" style={{ color: "var(--text-3)" }}>
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
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    fetch(mgp(`results/standings?seasonUuid=${SEASON_UUID}&categoryUuid=${CATEGORY_UUID}`))
      .then(r => r.json())
      .then(d => {
        const constructors = {};
        (d.classification || []).forEach(s => {
          const name = s.constructor?.name;
          if (!name) return;
          if (!constructors[name]) constructors[name] = { name, points: 0, wins: 0, podiums: 0 };
          constructors[name].points  += s.points    || 0;
          constructors[name].wins    += s.race_wins || 0;
          constructors[name].podiums += s.podiums   || 0;
        });
        setStandings(Object.values(constructors).sort((a, b) => b.points - a.points).map((c, i) => ({ ...c, position: i + 1 })));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-3 px-4">
      {Array.from({ length: 5 }).map((_, i) => <div key={i} className="glass rounded-2xl h-16 animate-pulse" />)}
    </div>
  );

  if (!standings.length) return (
    <div className="text-center py-16">
      <p className="text-5xl mb-4">🏭</p>
      <p className="text-sm" style={{ color: "var(--text-3)" }}>No standings available yet</p>
    </div>
  );

  const maxPoints = standings[0]?.points || 1;

  return (
    <div className="px-4 space-y-2">
      {standings.map(s => {
        const color = getConstructorColor(s.name);
        const isTop3 = s.position <= 3;
        const pct = (s.points / maxPoints) * 100;
        return (
          <div key={s.name} className="glass-card rounded-2xl px-4 py-3"
            style={isTop3 ? { borderLeft: `3px solid ${color}` } : {}}>
            <div className="flex items-center gap-3 mb-2">
              <span className={`text-lg font-black w-6 text-center ${
                s.position === 1 ? "text-yellow-400" : s.position === 2 ? "text-slate-300" :
                s.position === 3 ? "text-amber-600" : "text-white/30"
              }`}>{s.position}</span>
              <div className="flex-1">
                <p className="text-sm font-bold" style={{ color }}>{s.name}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
                  {s.wins} win{s.wins !== 1 ? "s" : ""} · {s.podiums} podiums
                </p>
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
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      fetch(mgp(`results/events?seasonUuid=${SEASON_UUID}&isFinished=true`)).then(r => r.json()),
      fetch(mgp(`results/events?seasonUuid=${SEASON_UUID}&isFinished=false`)).then(r => r.json()),
    ]).then(([finished, upcoming]) => {
      const finishedList = finished.status === "fulfilled" && Array.isArray(finished.value) ? finished.value : [];
      const upcomingList = upcoming.status === "fulfilled" && Array.isArray(upcoming.value) ? upcoming.value : [];
      const seen = new Set();
      const all = [...finishedList, ...upcomingList]
        .filter(e => {
          if ((e.name || "").toUpperCase().includes("TEST")) return false;
          if (seen.has(e.id)) return false;
          seen.add(e.id);
          return true;
        })
        .sort((a, b) => new Date(a.date_start) - new Date(b.date_start));
      setEvents(all);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="space-y-3 px-4">
      {Array.from({ length: 5 }).map((_, i) => <div key={i} className="glass rounded-2xl h-20 animate-pulse" />)}
    </div>
  );

  return (
    <div className="px-4 space-y-2">
      {events.map((event, idx) => {
        const startDate = new Date(event.date_start);
        const now       = new Date();
        const isPast    = event.status === "FINISHED";
        const isLive    = !isPast && new Date(event.date_start) <= now && new Date(event.date_end) >= now;
        const prevPast  = idx === 0 ? false : events[idx - 1].status === "FINISHED";
        const isNext    = !isPast && !isLive && prevPast;

        return (
          <div
            key={event.id}
            onClick={() => onSelectRace(event)}
            className="glass-card card-hover rounded-2xl px-4 py-3 cursor-pointer"
            style={isLive ? { borderLeft: "3px solid var(--live)" } : isNext ? { borderLeft: "3px solid #f97316" } : {}}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-lg">{countryFlag(event.country?.iso)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: "var(--text-1)" }}>
                    {event.sponsored_name || event.name}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
                    🏁 {event.circuit?.name}, {event.country?.name}
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
                  <span className="text-xs px-2 py-1 rounded-full font-bold text-orange-400"
                    style={{ background: "rgba(249,115,22,0.1)" }}>Next</span>
                ) : (
                  <span className="text-xs" style={{ color: "var(--accent)" }}>
                    {startDate.toLocaleDateString(undefined, { day: "numeric", month: "short" })}
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

// ── Live Session Classification ────────────────────────

function LiveClassification({ sessionId, onRefresh }) {
  const [results, setResults]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const pollRef = useRef(null);

  async function load() {
    try {
      const res  = await fetch(mgp(`results/session/${sessionId}/classification`));
      const data = await res.json();
      setResults(data.classification || []);
      setLastUpdate(new Date());
    } catch {}
    setLoading(false);
  }

  useEffect(() => {
    load();
    pollRef.current = setInterval(load, 30_000);
    return () => clearInterval(pollRef.current);
  }, [sessionId]);

  if (loading) return (
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-xl h-14 animate-pulse" style={{ background: "var(--surface-2)" }} />
      ))}
    </div>
  );

  if (!results.length) return (
    <div className="text-center py-12">
      <p className="text-4xl mb-3">🏍️</p>
      <p className="text-sm" style={{ color: "var(--text-3)" }}>Live data not available yet</p>
      <p className="text-xs mt-1" style={{ color: "var(--text-4)" }}>Check back once the session starts</p>
    </div>
  );

  const leader = results[0];

  return (
    <div className="space-y-2">
      {lastUpdate && (
        <p className="text-xs text-center mb-2" style={{ color: "var(--text-4)" }}>
          Updated {lastUpdate.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          {" · "}auto-refresh every 30s
        </p>
      )}
      {results.map(r => {
        const color  = getConstructorColor(r.constructor?.name);
        const isTop3 = r.position <= 3;
        const gap    = r.position === 1 ? r.time : r.gap?.first ? `+${r.gap.first}` : r.time || "—";

        return (
          <div
            key={r.id}
            className="rounded-xl px-4 py-2.5 flex items-center gap-3"
            style={{
              background: "var(--surface)",
              border: isTop3 ? `1px solid ${color}40` : "1px solid var(--border)",
              borderLeft: isTop3 ? `3px solid ${color}` : undefined,
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <span className={`text-sm font-black w-6 text-center tabular-nums ${
              r.position === 1 ? "text-yellow-400" : r.position === 2 ? "text-slate-400" :
              r.position === 3 ? "text-amber-600" : "text-white/30"
            }`}>
              {r.position === 1 ? "🥇" : r.position === 2 ? "🥈" : r.position === 3 ? "🥉" : r.position}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: "var(--text-1)" }}>
                <span className="text-xs mr-1" style={{ color: "var(--text-3)" }}>#{r.rider?.number}</span>
                {r.rider?.full_name}
                <span className="ml-1 text-xs">{countryFlag(r.rider?.country?.iso)}</span>
              </p>
              <p className="text-xs truncate" style={{ color, opacity: 0.8 }}>{r.team?.name}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs font-bold tabular-nums" style={{ color: "var(--text-2)" }}>{gap}</p>
              {r.points > 0 && (
                <p className="text-xs" style={{ color: "var(--text-4)" }}>+{r.points}pts</p>
              )}
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
    fetch(mgp(`results/session/${sessionId}/classification`))
      .then(r => r.json())
      .then(d => { setResults(d.classification || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [sessionId]);

  if (loading) return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-xl h-14 animate-pulse" style={{ background: "var(--surface-2)" }} />
      ))}
    </div>
  );

  if (!results.length) return (
    <div className="text-center py-12">
      <p className="text-4xl mb-3">🏍️</p>
      <p className="text-sm" style={{ color: "var(--text-3)" }}>No results available</p>
      <p className="text-xs mt-1" style={{ color: "var(--text-4)" }}>Results appear after the session</p>
    </div>
  );

  const finished = results.filter(r => r.position !== null);
  const dnf      = results.filter(r => r.position === null);

  return (
    <div className="space-y-2">
      {finished.map(r => {
        const color  = getConstructorColor(r.constructor?.name);
        const isTop3 = r.position <= 3;
        return (
          <div key={r.id}
            className="rounded-xl px-4 py-2.5 flex items-center gap-3"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderLeft: isTop3 ? `3px solid ${color}` : undefined,
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <span className={`text-sm font-black w-6 text-center tabular-nums ${
              r.position === 1 ? "text-yellow-400" : r.position === 2 ? "text-slate-400" :
              r.position === 3 ? "text-amber-600" : "text-white/30"
            }`}>
              {r.position === 1 ? "🥇" : r.position === 2 ? "🥈" : r.position === 3 ? "🥉" : r.position}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: "var(--text-1)" }}>
                <span className="text-xs mr-1" style={{ color: "var(--text-3)" }}>#{r.rider?.number}</span>
                {r.rider?.full_name}
                <span className="ml-1 text-xs">{countryFlag(r.rider?.country?.iso)}</span>
              </p>
              <p className="text-xs truncate" style={{ color, opacity: 0.8 }}>{r.team?.name}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs font-bold tabular-nums" style={{ color: "var(--text-2)" }}>
                {r.position === 1 ? r.time : r.gap?.first ? `+${r.gap.first}` : r.time || "—"}
              </p>
              {r.points > 0 && (
                <p className="text-xs" style={{ color: "var(--text-4)" }}>+{r.points}pts</p>
              )}
            </div>
          </div>
        );
      })}

      {dnf.length > 0 && (
        <div className="pt-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-px flex-1" style={{ background: "var(--border)" }} />
            <span className="text-xs" style={{ color: "var(--text-4)" }}>DNF</span>
            <div className="h-px flex-1" style={{ background: "var(--border)" }} />
          </div>
          {dnf.map(r => (
            <div key={r.id}
              className="rounded-xl px-4 py-2 flex items-center gap-3 mb-1.5 opacity-40"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
              <span className="text-xs font-bold w-6 text-center" style={{ color: "var(--text-4)" }}>DNF</span>
              <p className="text-sm font-semibold truncate flex-1" style={{ color: "var(--text-1)" }}>
                #{r.rider?.number} {r.rider?.full_name}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Race Weekend Schedule ──────────────────────────────

function RaceSchedule({ event, sessions }) {
  const now     = new Date();
  const labeled = labelSessions(sessions);
  const sessionColors = { RAC: "#ef4444", SPR: "#f97316", Q: "#8b5cf6", PR: null, FP: null, WUP: null };

  if (!labeled.length) return (
    <div className="text-center py-16">
      <p className="text-5xl mb-4">📅</p>
      <p className="text-base font-bold mb-1" style={{ color: "var(--text-3)" }}>Race weekend upcoming</p>
      <p className="text-sm" style={{ color: "var(--text-4)" }}>
        {new Date(event.date_start).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
        {" – "}
        {new Date(event.date_end).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}
      </p>
    </div>
  );

  return (
    <div className="space-y-2">
      <div className="rounded-xl px-4 py-3 mb-2 flex items-center justify-between"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
        <span className="text-xs" style={{ color: "var(--text-3)" }}>Weekend dates</span>
        <span className="text-sm font-bold" style={{ color: "var(--text-1)" }}>
          {new Date(event.date_start).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
          {" – "}
          {new Date(event.date_end).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
        </span>
      </div>
      {labeled.map(s => {
        const color       = sessionColors[s.type];
        const dt          = new Date(s.date);
        const isPast      = dt < now;
        const isNowLive   = dt <= now && new Date(dt.getTime() + 2 * 60 * 60 * 1000) >= now;
        const daysAway    = Math.ceil((dt - now) / (1000 * 60 * 60 * 24));
        return (
          <div key={s.id}
            className="rounded-xl px-4 py-3 flex items-center gap-3"
            style={{
              background: isNowLive ? "rgba(255,59,48,0.06)" : "var(--surface)",
              border: isNowLive ? "1px solid rgba(255,59,48,0.2)" : "1px solid var(--border)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div className="w-14 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                background: color ? `${color}18` : "var(--surface-2)",
                border: `1px solid ${color ? `${color}30` : "var(--border)"}`,
              }}>
              <span className="text-xs font-black" style={{ color: color || "var(--text-3)" }}>
                {s.shortName}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold" style={{ color: isPast ? "var(--text-4)" : "var(--text-1)" }}>
                  {s.displayName}
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
            <div className="text-right">
              <p className="text-sm font-bold" style={{ color: isPast ? "var(--text-4)" : "var(--text-2)" }}>
                {dt.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
              </p>
              {isPast
                ? <span className="text-xs" style={{ color: "var(--text-4)" }}>Done</span>
                : <span className="text-xs" style={{ color: "var(--text-4)" }}>
                    {daysAway > 0 ? `${daysAway}d away` : "Today"}
                  </span>
              }
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

// ── Race Detail ────────────────────────────────────────

function RaceDetail({ event, onClose }) {
  const [visible, setVisible]           = useState(false);
  const [sessions, setSessions]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [activeSession, setActiveSession] = useState(null);
  const [refreshing, setRefreshing]     = useState(false);
  const pollRef = useRef(null);

  const now      = new Date();
  const isPast   = event.status === "FINISHED";
  const isLive   = !isPast && new Date(event.date_start) <= now && new Date(event.date_end) >= now;

  async function loadSessions() {
    try {
      const res  = await fetch(mgp(`results/sessions?eventUuid=${event.id}&categoryUuid=${CATEGORY_UUID}`));
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      const sorted = list.sort((a, b) => new Date(a.date) - new Date(b.date));
      setSessions(sorted);

      if (isPast) {
        const race = sorted.find(s => s.type === "RAC") || sorted[sorted.length - 1];
        if (race && !activeSession) setActiveSession(race);
      } else if (isLive) {
        // Find the currently live or most recently started session
        const liveSession = sorted
          .filter(s => new Date(s.date) <= now)
          .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
        if (liveSession && !activeSession) setActiveSession(liveSession);
      }
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => {
    setTimeout(() => setVisible(true), 10);
    loadSessions();
    if (isLive) {
      pollRef.current = setInterval(loadSessions, 60_000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  function handleClose() {
    setVisible(false);
    if (pollRef.current) clearInterval(pollRef.current);
    setTimeout(onClose, 300);
  }

  function handleRefresh() { setRefreshing(true); loadSessions(); }

  const sessionIcon = type => ({ FP: "🔧", PR: "🔧", Q: "⏱", SPR: "⚡", WUP: "🌅", RAC: "🏁" }[type] || "🏍️");

  // Finished sessions — for tab bar
  const resultSessions = sessions.filter(s =>
    ["FP", "Q", "SPR", "WUP", "RAC"].includes(s.type) && s.status === "FINISHED"
  );
  const resultOrder = ["RAC", "SPR", "Q", "WUP", "FP"];
  const sortedResultSessions = [...resultSessions].sort((a, b) => {
    return (resultOrder.indexOf(a.type) === -1 ? 99 : resultOrder.indexOf(a.type)) -
           (resultOrder.indexOf(b.type) === -1 ? 99 : resultOrder.indexOf(b.type));
  });
  const labeledResultSessions = labelSessions(sortedResultSessions);

  // Live sessions — sessions that have started but may not be finished
  const liveSessions = sessions.filter(s => {
    const sessionStart = new Date(s.date);
    const sessionEnd   = new Date(sessionStart.getTime() + 2 * 60 * 60 * 1000); // assume 2hr max
    return sessionStart <= now && sessionEnd >= now;
  });
  const allStartedSessions = sessions.filter(s => new Date(s.date) <= now)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  const labeledLiveSessions = labelSessions(allStartedSessions);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{
        background: "var(--overlay-bg)",
        transform: visible ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4">
        <div className="flex-1 min-w-0 mr-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{countryFlag(event.country?.iso)}</span>
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
              MotoGP · {event.country?.name}
            </span>
            {isLive && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                style={{ background: "rgba(255,59,48,0.1)", border: "1px solid rgba(255,59,48,0.2)" }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--live)" }} />
                <span className="text-xs font-bold" style={{ color: "var(--live)" }}>Live</span>
              </div>
            )}
          </div>
          <h2 className="text-lg font-black leading-tight truncate" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--text-1)" }}>
            {event.sponsored_name || event.name}
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>🏁 {event.circuit?.name}</p>
        </div>
        <div className="flex items-center gap-2">
          {isLive && (
            <button onClick={handleRefresh}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)", opacity: refreshing ? 0.5 : 1 }}>
              <RefreshCw size={14} style={{ color: "var(--text-3)" }} className={refreshing ? "animate-spin" : ""} />
            </button>
          )}
          <button onClick={handleClose}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            <X size={16} style={{ color: "var(--text-2)" }} />
          </button>
        </div>
      </div>

      {/* Session tabs */}
      {isPast && labeledResultSessions.length > 0 && (
        <div className="flex gap-1.5 px-4 mb-3 overflow-x-auto no-scrollbar">
          {labeledResultSessions.map(s => (
            <button key={s.id} onClick={() => setActiveSession(s)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all"
              style={{
                background: activeSession?.id === s.id ? "rgba(249,115,22,0.2)" : "var(--surface-2)",
                border: activeSession?.id === s.id ? "1px solid rgba(249,115,22,0.4)" : "1px solid var(--border)",
                color: activeSession?.id === s.id ? "#f97316" : "var(--text-3)",
              }}>
              <span>{sessionIcon(s.type)}</span>
              {s.displayName}
            </button>
          ))}
        </div>
      )}

      {isLive && labeledLiveSessions.length > 0 && (
        <div className="flex gap-1.5 px-4 mb-3 overflow-x-auto no-scrollbar">
          {labeledLiveSessions.map(s => (
            <button key={s.id} onClick={() => setActiveSession(s)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all"
              style={{
                background: activeSession?.id === s.id ? "rgba(255,59,48,0.15)" : "var(--surface-2)",
                border: activeSession?.id === s.id ? "1px solid rgba(255,59,48,0.3)" : "1px solid var(--border)",
                color: activeSession?.id === s.id ? "var(--live)" : "var(--text-3)",
              }}>
              <span>{sessionIcon(s.type)}</span>
              {s.displayName}
              {liveSessions.some(l => l.id === s.id) && (
                <span className="w-1.5 h-1.5 rounded-full ml-1 animate-pulse" style={{ background: "var(--live)" }} />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Schedule label */}
      {!isPast && !isLive && (
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
        ) : isPast ? (
          activeSession
            ? <SessionResults sessionId={activeSession.id} />
            : <div className="text-center py-12">
                <p className="text-4xl mb-3">🏍️</p>
                <p className="text-sm" style={{ color: "var(--text-3)" }}>Select a session above</p>
              </div>
        ) : isLive ? (
          activeSession
            ? <LiveClassification sessionId={activeSession.id} />
            : <div className="text-center py-12">
                <p className="text-4xl mb-3">🏍️</p>
                <p className="text-sm" style={{ color: "var(--text-3)" }}>Loading live session...</p>
              </div>
        ) : (
          <RaceSchedule event={event} sessions={sessions} />
        )}
      </div>
    </div>
  );
}

// ── Main MotoGP Page ───────────────────────────────────

export default function MotoGPPage() {
  const [activeTab, setActiveTab]       = useState("calendar");
  const [selectedRace, setSelectedRace] = useState(null);
  const [selectedRider, setSelectedRider] = useState(null);

  const tabs = [
    { id: "calendar",     label: "Calendar",     icon: "📅" },
    { id: "riders",       label: "Riders",       icon: "🏍️" },
    { id: "constructors", label: "Constructors", icon: "🏭" },
  ];

  return (
    <div className="pb-8">
      {selectedRace && (
        <RaceDetail event={selectedRace} onClose={() => setSelectedRace(null)} />
      )}
      {selectedRider && (
        <MotoGPDriverDetail rider={selectedRider} onClose={() => setSelectedRider(null)} />
      )}

      {/* Header */}
      <div className="px-4 pt-2 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(251,146,60,0.15)", border: "1px solid rgba(251,146,60,0.3)" }}>
            <span className="text-xl">🏍️</span>
          </div>
          <div>
            <h2 className="text-base font-black" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--text-1)" }}>
              MotoGP
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
              background: "rgba(251,146,60,0.15)",
              border: "1px solid rgba(251,146,60,0.3)",
              color: "#f97316",
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
      {activeTab === "riders"       && <RiderStandings onSelectRider={setSelectedRider} />}
      {activeTab === "constructors" && <ConstructorStandings />}
    </div>
  );
}