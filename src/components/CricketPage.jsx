import { useState, useEffect } from "react";

const ESPN = "https://site.api.espn.com/apis/site/v2/sports/cricket";

const SERIES = [
  { id: "ipl",    name: "IPL",               flag: "🇮🇳", color: "#1a237e" },
  { id: "wi.20",  name: "T20 International", flag: "🌍", color: "#1b5e20" },
  { id: "wi.1",   name: "Test Matches",      flag: "🏴", color: "#4a148c" },
  { id: "wi.50",  name: "ODI International", flag: "🌐", color: "#0d47a1" },
  { id: "bbl",    name: "Big Bash League",   flag: "🇦🇺", color: "#bf360c" },
  { id: "sa20",   name: "SA20",              flag: "🇿🇦", color: "#1a237e" },
  { id: "psl",    name: "Pakistan Super League", flag: "🇵🇰", color: "#880e4f" },
  { id: "hundred", name: "The Hundred",      flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", color: "#311b92" },
];

function countryFlag(name) {
  const flags = {
    India: "🇮🇳", Australia: "🇦🇺", England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "New Zealand": "🇳🇿",
    "South Africa": "🇿🇦", Pakistan: "🇵🇰", "West Indies": "🏝️", Bangladesh: "🇧🇩",
    "Sri Lanka": "🇱🇰", Zimbabwe: "🇿🇼", Afghanistan: "🇦🇫", Ireland: "🇮🇪",
  };
  return flags[name] || "🏏";
}

// ── Status Badge ───────────────────────────────────────

function MatchStatus({ event }) {
  const state = event.status?.type?.state;
  const detail = event.status?.type?.shortDetail || event.status?.displayClock;

  if (state === "in") {
    return (
      <div
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
        style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
        <span className="text-xs font-bold text-red-400">LIVE</span>
      </div>
    );
  }
  if (state === "post") {
    return (
      <span className="text-xs font-semibold text-white/25 bg-white/5 px-2.5 py-1 rounded-full">
        Final
      </span>
    );
  }
  return (
    <span className="text-xs font-semibold text-emerald-400/80 bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-1 rounded-full">
      {detail || "Upcoming"}
    </span>
  );
}

// ── Match Card ─────────────────────────────────────────

function CricketMatchCard({ event, onPress }) {
  const competitors = event.competitions?.[0]?.competitors || [];
  const home = competitors.find(c => c.homeAway === "home") || competitors[0];
  const away = competitors.find(c => c.homeAway === "away") || competitors[1];
  const venue = event.competitions?.[0]?.venue?.fullName;
  const state = event.status?.type?.state;
  const isLive = state === "in";
  const isPost = state === "post";
  const note = event.competitions?.[0]?.notes?.[0]?.headline;

  return (
    <div
      onClick={() => onPress?.(event)}
      className="glass-card rounded-2xl overflow-hidden cursor-pointer transition-all duration-150 active:scale-[0.99] hover:bg-white/5"
    >
      {isLive && <div className="h-0.5 w-full bg-red-500/60" />}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-white/35 font-semibold uppercase tracking-widest">
            {event.shortName || event.name}
          </span>
          <MatchStatus event={event} />
        </div>

        {/* Teams & Scores */}
        <div className="space-y-2.5">
          {[home, away].filter(Boolean).map((team, i) => {
            const isWinner = isPost && team.winner;
            const score = team.score || "";
            const runs = score.split(" ")?.[0] || score;

            return (
              <div key={i} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-white/8 flex items-center justify-center text-base flex-shrink-0">
                  {team.team?.logo
                    ? <img src={team.team.logo} alt="" className="w-5 h-5 object-contain" />
                    : <span>{countryFlag(team.team?.name)}</span>
                  }
                </div>
                <p className={`flex-1 text-sm font-bold truncate ${
                  isWinner ? "text-white" : isPost ? "text-white/50" : "text-white"
                }`}>
                  {team.team?.shortDisplayName || team.team?.displayName || team.team?.name}
                </p>
                {score ? (
                  <p className={`text-sm font-black tabular-nums ${
                    isWinner ? "text-white" : isPost ? "text-white/40" : isLive ? "text-emerald-400" : "text-white/60"
                  }`}>
                    {runs}
                  </p>
                ) : (
                  <p className="text-sm text-white/20">-</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Result note */}
        {note && (
          <p className="text-xs text-white/40 mt-3 pt-3 border-t border-white/6 leading-snug">
            {note}
          </p>
        )}

        {/* Venue */}
        {venue && !note && (
          <p className="text-xs text-white/20 mt-3 pt-3 border-t border-white/6">
            📍 {venue}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Series Scoreboard ──────────────────────────────────

function SeriesScoreboard({ series, onMatchPress }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    fetch(`${ESPN}/${series.id}/scoreboard`)
      .then(r => r.json())
      .then(d => {
        setEvents(d.events || []);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [series.id]);

  if (loading) return (
    <div className="space-y-3 px-4">
      {[1, 2, 3].map(i => (
        <div
          key={i}
          className="glass rounded-2xl h-28 animate-pulse"
          style={{ animationDelay: `${i * 80}ms` }}
        />
      ))}
    </div>
  );

  if (error || events.length === 0) return (
    <div className="text-center py-16">
      <p className="text-5xl mb-4">🏏</p>
      <p className="text-sm text-white/30">No matches available</p>
      <p className="text-xs text-white/15 mt-1">Check back during the season</p>
    </div>
  );

  // Group by date
  const grouped = events.reduce((acc, ev) => {
    const date = new Date(ev.date);
    const key = date.toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric"
    });
    if (!acc[key]) acc[key] = [];
    acc[key].push(ev);
    return acc;
  }, {});

  return (
    <div className="px-4 space-y-5 pb-4">
      {Object.entries(grouped).map(([date, dayEvents]) => (
        <div key={date}>
          <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-2 ml-1">
            {date}
          </p>
          <div className="space-y-2">
            {dayEvents.map(ev => (
              <CricketMatchCard key={ev.id} event={ev} onPress={onMatchPress} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Match Detail Overlay ───────────────────────────────

function CricketMatchDetail({ event, onClose }) {
  const [visible, setVisible] = useState(false);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const eventId = event?.id;
    if (eventId) {
      fetch(`${ESPN}/${event._leagueId || "ipl"}/summary?event=${eventId}`)
        .then(r => r.json())
        .then(d => setDetail(d))
        .catch(() => {});
    }
  }, [event]);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 300);
  }

  const competitors = event.competitions?.[0]?.competitors || [];
  const home = competitors.find(c => c.homeAway === "home") || competitors[0];
  const away = competitors.find(c => c.homeAway === "away") || competitors[1];
  const venue = event.competitions?.[0]?.venue?.fullName;
  const note = event.competitions?.[0]?.notes?.[0]?.headline;
  const state = event.status?.type?.state;
  const isLive = state === "in";
  const isPost = state === "post";
  const innings = detail?.innings || [];

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col transition-all duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(20px)" }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-4 border-b border-white/8">
        <button
          onClick={handleClose}
          className="w-9 h-9 rounded-full glass flex items-center justify-center text-white/60 hover:text-white transition-colors"
        >
          ✕
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-white/35 font-semibold uppercase tracking-widest truncate">
            {event.shortName || "Match Detail"}
          </p>
          <p className="text-sm font-bold text-white truncate">{event.name}</p>
        </div>
        <MatchStatus event={event} />
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Score block */}
        <div className="px-4 py-6">
          <div className="glass-card rounded-2xl p-5 space-y-4">
            {[home, away].filter(Boolean).map((team, i) => {
              const isWinner = isPost && team.winner;
              return (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/8 flex items-center justify-center text-xl flex-shrink-0">
                    {team.team?.logo
                      ? <img src={team.team.logo} alt="" className="w-7 h-7 object-contain" />
                      : countryFlag(team.team?.name)
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-base font-black truncate ${
                      isWinner ? "text-white" : isPost ? "text-white/50" : "text-white"
                    }`}>
                      {team.team?.displayName || team.team?.name}
                    </p>
                    {team.team?.shortDisplayName && (
                      <p className="text-xs text-white/30">{team.team.shortDisplayName}</p>
                    )}
                  </div>
                  <p className={`text-2xl font-black tabular-nums ${
                    isWinner ? "text-emerald-400" :
                    isPost ? "text-white/30" :
                    isLive ? "text-emerald-400" :
                    "text-white/70"
                  }`}>
                    {team.score || "-"}
                  </p>
                </div>
              );
            })}

            {note && (
              <div className="pt-4 border-t border-white/8">
                <p className="text-sm text-white/60 leading-relaxed">{note}</p>
              </div>
            )}
          </div>
        </div>

        {/* Innings scorecard */}
        {innings.length > 0 && (
          <div className="px-4 pb-4">
            <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3 ml-1">
              Scorecard
            </p>
            {innings.map((inn, i) => (
              <div key={i} className="glass-card rounded-2xl p-4 mb-3">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-white">
                    {inn.team?.displayName || `Innings ${i + 1}`}
                  </p>
                  <p className="text-sm font-black text-white tabular-nums">
                    {inn.runs}/{inn.wickets}
                    {inn.overs && (
                      <span className="text-white/40 text-xs font-normal ml-1">
                        ({inn.overs} ov)
                      </span>
                    )}
                  </p>
                </div>

                {inn.batters?.length > 0 && (
                  <div className="space-y-2 pt-3 border-t border-white/6">
                    <div className="grid grid-cols-4 text-xs text-white/30 font-semibold mb-1">
                      <span className="col-span-2">Batter</span>
                      <span className="text-right">R (B)</span>
                      <span className="text-right">SR</span>
                    </div>
                    {inn.batters.slice(0, 6).map((b, bi) => (
                      <div key={bi} className="grid grid-cols-4 text-xs">
                        <div className="col-span-2">
                          <p className="text-white font-semibold truncate">
                            {b.athlete?.displayName}
                          </p>
                          <p className="text-white/25 truncate">
                            {b.dismissal || (b.notOut ? "not out" : "")}
                          </p>
                        </div>
                        <p className="text-right text-white tabular-nums">
                          {b.runs} <span className="text-white/30">({b.balls})</span>
                        </p>
                        <p className="text-right text-white/40 tabular-nums">
                          {b.strikeRate}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {inn.bowlers?.length > 0 && (
                  <div className="space-y-2 pt-3 mt-2 border-t border-white/6">
                    <div className="grid grid-cols-4 text-xs text-white/30 font-semibold mb-1">
                      <span className="col-span-2">Bowler</span>
                      <span className="text-right">O-M-R</span>
                      <span className="text-right">W</span>
                    </div>
                    {inn.bowlers.slice(0, 5).map((b, bi) => (
                      <div key={bi} className="grid grid-cols-4 text-xs">
                        <p className="col-span-2 text-white font-semibold truncate">
                          {b.athlete?.displayName}
                        </p>
                        <p className="text-right text-white/50 tabular-nums">
                          {b.overs}-{b.maidens}-{b.runs}
                        </p>
                        <p className="text-right text-white font-black">{b.wickets}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Venue */}
        {venue && (
          <div className="px-4 pb-8">
            <div className="glass-card rounded-2xl p-4">
              <p className="text-xs text-white/30 font-semibold uppercase tracking-widest mb-1">
                Venue
              </p>
              <p className="text-sm text-white">📍 {venue}</p>
            </div>
          </div>
        )}

        {innings.length === 0 && !note && (
          <div className="px-4 pb-8 text-center">
            <p className="text-white/20 text-sm">Scorecard not available yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Cricket Page ──────────────────────────────────

export default function CricketPage() {
  const [activeSeries, setActiveSeries] = useState(SERIES[0]);
  const [selectedMatch, setSelectedMatch] = useState(null);

  return (
    <div className="pb-24">
      {selectedMatch && (
        <CricketMatchDetail
          event={selectedMatch}
          onClose={() => setSelectedMatch(null)}
        />
      )}

      {/* Header */}
      <div className="px-4 pt-2 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl">🏏</span>
          <div>
            <h1
              className="text-xl font-black text-white"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Cricket
            </h1>
            <p className="text-xs text-white/30">Live scores & match updates</p>
          </div>
        </div>
      </div>

      {/* Series Selector */}
      <div className="flex gap-2 overflow-x-auto pb-3 px-4 no-scrollbar mb-4">
        {SERIES.map((s) => {
          const isActive = activeSeries.id === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setActiveSeries(s)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                isActive
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20 scale-[1.02]"
                  : "glass text-white/50 hover:text-white/80"
              }`}
            >
              <span>{s.flag}</span>
              {s.name}
            </button>
          );
        })}
      </div>

      {/* Series accent bar */}
      <div
        className="mx-4 h-0.5 rounded-full mb-4 opacity-60"
        style={{ background: activeSeries.color }}
      />

      {/* Scoreboard */}
      <SeriesScoreboard
        key={activeSeries.id}
        series={activeSeries}
        onMatchPress={(ev) => {
          ev._leagueId = activeSeries.id;
          setSelectedMatch(ev);
        }}
      />
    </div>
  );
}