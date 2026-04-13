import { useState, useMemo, useEffect } from "react";
import FootballPage from "./components/FootballPage";
import Header from "./components/Header";
import SportTabs from "./components/SportTabs";
import MatchCard from "./components/MatchCard";
import LeagueFilter from "./components/LeagueFilter";
import LeagueGroup from "./components/LeagueGroup";
import SearchModal from "./components/SearchModal";
import FavouritesTab from "./components/FavouritesTab";
import MatchDetail from "./components/MatchDetail";
import BottomNav from "./components/BottomNav";
import F1Page from "./components/F1Page";
import MotoGPPage from "./components/MotoGPPage";
import { SPORTS, MOTORSPORT_IDS } from "./data/mockData";
import { useGames } from "./hooks/useGames";
import useUserStore from "./store/userStore";

const ALL_TABS = [
  { id: "favourites", label: "Favourites", icon: "⭐" },
  ...SPORTS,
];

export default function App() {
  const [activeSport, setActiveSport] = useState("soccer");
  const [filter, setFilter] = useState("all");
  const [activeLeague, setActiveLeague] = useState("all");
  const [showSearch, setShowSearch] = useState(false);
  const [highlightedGame, setHighlightedGame] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);

  const { loadFavorites, loadRecentSearches } = useUserStore();

  useEffect(() => {
    loadFavorites();
    loadRecentSearches();
  }, []);

  const isFavouritesTab = activeSport === "favourites";
  const isF1 = activeSport === "f1";
  const isMotoGP = activeSport === "motogp";
  const isMotorsport = MOTORSPORT_IDS.includes(activeSport);

  const { data: games = [], isLoading } = useGames(
    isFavouritesTab ? "soccer" : activeSport
  );

  const statusFiltered = useMemo(() => {
    if (filter === "all") return games;
    return games.filter((g) => g.status === filter);
  }, [games, filter]);

  const filteredGames = useMemo(() => {
    if (activeLeague === "all") return statusFiltered;
    return statusFiltered.filter((g) => g.league === activeLeague);
  }, [statusFiltered, activeLeague]);

  const liveCount = games.filter((g) => g.status === "live").length;

  function handleSportChange(sport) {
    setActiveSport(sport);
    setFilter("all");
    setActiveLeague("all");
    setHighlightedGame(null);
  }

  function handleSelectGame(game) {
    setActiveSport(game.sport);
    setFilter("all");
    setActiveLeague(game.league);
    setHighlightedGame(game.id);
    setTimeout(() => setHighlightedGame(null), 3000);
  }

  return (
    <div className="min-h-screen max-w-xl mx-auto">
      <Header onSearch={() => setShowSearch(true)} />

      {/* Modals */}
      {showSearch && (
        <SearchModal
          onClose={() => setShowSearch(false)}
          allGames={games}
          onSelectGame={handleSelectGame}
        />
      )}
      {selectedGame && (
        <MatchDetail
          game={selectedGame}
          onClose={() => setSelectedGame(null)}
        />
      )}

      {/* Sport tabs */}
      <div className="mb-3">
        <SportTabs
          sports={ALL_TABS}
          active={activeSport}
          onSelect={handleSportChange}
        />
      </div>

      {activeSport === "soccer" ? (
  <FootballPage />
) : isF1 ? (
  <F1Page />

      /* MotoGP full page */
      ) : isMotoGP ? (
        <MotoGPPage />

      /* Favourites tab */
      ) : isFavouritesTab ? (
        <div className="px-4 pb-8">
          <FavouritesTab
            allGames={games}
            onPress={setSelectedGame}
          />
        </div>

      /* All other sports */
      ) : (
        <>
          {/* Status filter pills */}
            {!isMotorsport && activeSport !== "soccer" && (
            <div className="flex gap-2 px-4 mb-3">
              {["all", "live", "finished", "scheduled"].map((f) => (
                <button
                  key={f}
                  onClick={() => {
                    setFilter(f);
                    setActiveLeague("all");
                  }}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium capitalize transition-all
                    ${filter === f
                      ? "bg-violet-600 text-white"
                      : "glass text-white/50 hover:text-white/70"
                    }`}
                >
                  {f === "live" && liveCount > 0 ? `Live (${liveCount})` : f}
                </button>
              ))}
            </div>
          )}

          {/* League filter */}
          {activeSport === "cricket" && !isLoading && (
            <div className="mb-3">
              <LeagueFilter
                games={games}
                activeLeague={activeLeague}
                onSelect={setActiveLeague}
              />
            </div>
          )}

          {/* Cards */}
          <div className="pb-8">
            {isLoading ? (
              <div className="px-4 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="glass rounded-2xl h-20 animate-pulse"
                    style={{ animationDelay: `${i * 100}ms` }}
                  />
                ))}
              </div>
            ) : filteredGames.length === 0 ? (
              <div className="text-center py-16 text-white/20">
                <p className="text-5xl mb-4">🏟️</p>
                <p className="text-sm font-medium">No events found</p>
                <p className="text-xs mt-1 text-white/15">
                  Try a different filter or check back later
                </p>
              </div>
            ) : activeLeague !== "all" ? (
              <div className="px-4 space-y-2">
                {filteredGames.map((game, i) => (
                  <MatchCard
                    key={game.id}
                    game={game}
                    index={i}
                    highlighted={game.id === highlightedGame}
                    showLeague={false}
                    onPress={setSelectedGame}
                  />
                ))}
              </div>
            ) : (
              (() => {
                const grouped = filteredGames.reduce((acc, game) => {
                  const key = game.league;
                  if (!acc[key]) acc[key] = { games: [], logo: game.leagueLogo };
                  acc[key].games.push(game);
                  return acc;
                }, {});

                return Object.entries(grouped).map(([league, { games, logo }], i) => (
                  <LeagueGroup
                    key={league}
                    league={league}
                    logo={logo}
                    games={games}
                    index={i}
                    onPressGame={setSelectedGame}
                  />
                ));
              })()
            )}
          </div>
        </>
      )}

      <BottomNav active={activeSport} onSelect={handleSportChange} />
    </div>
  );
}