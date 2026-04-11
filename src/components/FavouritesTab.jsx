import useUserStore from "../store/userStore";
import MatchCard from "./MatchCard";

export default function FavouritesTab({ allGames, onPress }) {
  const favorites = useUserStore((s) => s.favorites);

  const favGames = allGames.filter((g) =>
    favorites.includes(g.homeTeam?.name) ||
    favorites.includes(g.awayTeam?.name)
  );

  if (favorites.length === 0) {
    return (
      <div className="text-center py-20 px-6">
        <p className="text-5xl mb-4">⭐</p>
        <p className="text-base font-semibold text-white/50 mb-2">
          No favourites yet
        </p>
        <p className="text-sm text-white/25 leading-relaxed">
          Tap the ⭐ on any match card to follow a team and see their games here
        </p>
      </div>
    );
  }

  if (favGames.length === 0) {
    return (
      <div className="text-center py-20 px-6">
        <p className="text-5xl mb-4">🏟️</p>
        <p className="text-base font-semibold text-white/50 mb-2">
          No matches today
        </p>
        <p className="text-sm text-white/25 mb-6">
          Your favourite teams aren't playing right now
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {favorites.map((team) => (
            <span
              key={team}
              className="glass px-3 py-1.5 rounded-full text-xs text-white/40 font-medium"
            >
              ⭐ {team}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-white/30 font-semibold uppercase tracking-widest px-4 mb-2">
        {favGames.length} match{favGames.length !== 1 ? "es" : ""} · your teams
      </p>
        {favGames.map((game, i) => (
        <MatchCard key={game.id} game={game} index={i} onPress={onPress} />
        ))}
    </div>
  );
}