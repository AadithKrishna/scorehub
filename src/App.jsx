import { useState, useMemo, useEffect } from "react";
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
import LeagueDetail from "./components/LeagueDetail";
import TeamDetail from "./components/TeamDetail";
import { SPORTS, MOTORSPORT_IDS } from "./data/mockData";
import { useGames } from "./hooks/useGames";
import useUserStore from "./store/userStore";
import { trackSportView, trackMatchOpen } from "./analytics";


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
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const { loadFavorites, loadRecentSearches } = useUserStore();

  function handleMatchPress(game) {
  setSelectedGame(game);
  trackMatchOpen(game.homeTeam?.name, game.awayTeam?.name, game.league);
}

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
  setSelectedLeague(null);
  setSelectedTeam(null);
  trackSportView(sport);
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
    onSelectTeam={(team, leagueId) => {
      setSelectedGame(null);
      setTimeout(() => setSelectedTeam({ team, leagueId }), 350);
    }}
  />
)}
      {selectedLeague && (
        <LeagueDetail
          leagueId={selectedLeague.id}
          leagueName={selectedLeague.name}
          leagueFlag={selectedLeague.flag}
          leagueColor={selectedLeague.color}
          onSelectTeam={(team) => setSelectedTeam({ team, leagueId: selectedLeague.id })}
          onClose={() => setSelectedLeague(null)}
        />
      )}
      {selectedTeam && (
        <TeamDetail
          team={selectedTeam.team}
          leagueId={selectedTeam.leagueId}
          onClose={() => setSelectedTeam(null)}
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

      {/* F1 full page */}
      {isF1 ? (
        <F1Page />

      /* MotoGP full page */
      ) : isMotoGP ? (
        <MotoGPPage />

      /* Favourites tab */
      ) : isFavouritesTab ? (
        <div className="px-4 pb-8">
          <FavouritesTab allGames={games} onPress={handleMatchPress} />
        </div>

      /* All other sports including soccer */
      ) : (
        <>
          {/* Status filter pills */}
          {!isMotorsport && (
            <div className="flex gap-2 px-4 mb-3">
              {["all", "live", "finished", "scheduled"].map((f) => (
                <button
                  key={f}
                  onClick={() => { setFilter(f); setActiveLeague("all"); }}
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
          {(activeSport === "soccer" || activeSport === "cricket") && !isLoading && (
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
                  <div key={i} className="glass rounded-2xl h-20 animate-pulse"
                    style={{ animationDelay: `${i * 100}ms` }} />
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
                    onPress={handleMatchPress}
                  />
                ))}
              </div>
            ) : (
              (() => {
                const grouped = filteredGames.reduce((acc, game) => {
                  const key = game.league;
                  if (!acc[key]) acc[key] = { games: [], logo: game.leagueLogo, leagueId: game.leagueId };
                  acc[key].games.push(game);
                  return acc;
                }, {});

                return Object.entries(grouped).map(([league, { games, logo, leagueId }], i) => (
                  <LeagueGroup
                    key={league}
                    league={league}
                    logo={logo}
                    games={games}
                    index={i}
                    onPressGame={setSelectedGame}
                    onPressLeague={() => {
                      const LEAGUE_MAP = {
                        "Premier League":    { id: "eng.1",          flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", color: "#3d195b" },
                        "La Liga":           { id: "esp.1",          flag: "🇪🇸", color: "#ee8707" },
                        "Bundesliga":        { id: "ger.1",          flag: "🇩🇪", color: "#d00027" },
                        "Serie A":           { id: "ita.1",          flag: "🇮🇹", color: "#1a1a2e" },
                        "Ligue 1":           { id: "fra.1",          flag: "🇫🇷", color: "#003189" },
                        "Champions League":  { id: "uefa.champions", flag: "⭐", color: "#0a1172" },
                        "Europa League":     { id: "uefa.europa",    flag: "🟠", color: "#f37021" },
                      };
                      const info = LEAGUE_MAP[league];
                      if (info) setSelectedLeague({ ...info, name: league });
                    }}
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