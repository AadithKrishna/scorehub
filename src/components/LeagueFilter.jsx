export default function LeagueFilter({ games, activeLeague, onSelect }) {
  // Build unique league list from actual game data
  const leagues = [
    { id: "all", name: "All", logo: null },
    ...Array.from(
      new Map(
        games.map((g) => [
          g.league,
          { id: g.league, name: g.league, logo: g.leagueLogo },
        ])
      ).values()
    ),
  ];

  if (leagues.length <= 1) return null; // Don't show if only one league

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 px-4 no-scrollbar">
      {leagues.map((l) => {
        const isActive = activeLeague === l.id;
        return (
          <button
            key={l.id}
            onClick={() => onSelect(l.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200
              ${isActive
                ? "bg-violet-600/80 text-white border border-violet-500/50"
                : "glass text-white/50 hover:text-white/80 border border-transparent"
              }`}
          >
            {l.logo && (
              <span className="text-sm">{l.logo}</span>
            )}
            {l.name}
          </button>
        );
      })}
    </div>
  );
}