import { useState, useMemo, useEffect } from "react";
import Header from "./components/Header";
import MatchCard from "./components/MatchCard";
import LeagueGroup from "./components/LeagueGroup";
import SearchModal from "./components/SearchModal";
import FavouritesTab from "./components/FavouritesTab";
import MatchDetail from "./components/MatchDetail";
import BottomNav from "./components/BottomNav";
import F1Page from "./components/F1Page";
import MotoGPPage from "./components/MotoGPPage";
import CricketPage from "./components/CricketPage";
import LeagueDetail from "./components/LeagueDetail";
import TeamDetail from "./components/TeamDetail";
import { SPORTS, MOTORSPORT_IDS } from "./data/mockData";
import { useGames } from "./hooks/useGames";
import useUserStore from "./store/userStore";
import { trackSportView, trackMatchOpen } from "./analytics";

export default function App() {
  const [activeSport, setActiveSport] = useState("soccer");
  const [liveOnly, setLiveOnly] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [highlightedGame, setHighlightedGame] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);

  const { loadFavorites, loadRecentSearches } = useUserStore();

  useEffect(() => {
    loadFavorites();
    loadRecentSearches();
  }, []);

  const isFavouritesTab = activeSport === "favourites";
  const isF1 = activeSport === "f1";
  const isMotoGP = activeSport === "motogp";
  const isCricket = activeSport === "cricket";
  const isMotorsport = MOTORSPORT_IDS.includes(activeSport);

  const { data: games = [], isLoading } = useGames(
  isFavouritesTab || isCricket ? "soccer" : activeSport
);

  const filteredGames = useMemo(() => {
    if (!liveOnly) return games;
    return games.filter(g => g.status === "live");
  }, [games, liveOnly]);

  const liveCount = games.filter(g => g.status === "live").length;

  function handleSportChange(sport) {
    setActiveSport(sport);
    setLiveOnly(false);
    setHighlightedGame(null);
    setSelectedLeague(null);
    setSelectedTeam(null);
    trackSportView(sport);
  }

  function handleMatchPress(game) {
    setSelectedGame(game);
    trackMatchOpen(game.homeTeam?.name, game.awayTeam?.name, game.league);
  }

  function handleSelectGame(game) {
    setActiveSport(game.sport);
    setLiveOnly(false);
    setHighlightedGame(game.id);
    setTimeout(() => setHighlightedGame(null), 3000);
  }

  const LEAGUE_MAP = {
    "Premier League":   { id: "eng.1",          flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", color: "#3d195b" },
    "La Liga":          { id: "esp.1",          flag: "🇪🇸", color: "#ee8707" },
    "Bundesliga":       { id: "ger.1",          flag: "🇩🇪", color: "#d00027" },
    "Serie A":          { id: "ita.1",          flag: "🇮🇹", color: "#1a1a2e" },
    "Ligue 1":          { id: "fra.1",          flag: "🇫🇷", color: "#003189" },
    "Champions League": { id: "uefa.champions", flag: "⭐", color: "#0a1172" },
    "Europa League":    { id: "uefa.europa",    flag: "🟠", color: "#f37021" },
  };

  return (
    <div className="min-h-screen max-w-xl mx-auto">
      <Header onSearch={() => setShowSearch(true)} showSearch={!isFavouritesTab} />

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

            {/* F1 */}
      {isF1 ? (
        <F1Page />

      /* MotoGP */
      ) : isMotoGP ? (
        <MotoGPPage />

      /* Cricket */
      ) : isCricket ? (
        <CricketPage />

      /* Favourites */
      ) : isFavouritesTab ? (
        <div className="px-4 pb-8">
          <FavouritesTab allGames={games} onPress={handleMatchPress} />
        </div>

      /* Soccer / Cricket */
      ) : (
        <>
          {/* Live filter */}
          <div className="flex items-center gap-3 px-4 mb-3">
            <button
              onClick={() => setLiveOnly(l => !l)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                liveOnly
                  ? "bg-red-500/20 text-red-400 border border-red-500/40"
                  : "glass text-white/40 hover:text-white/70"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${liveOnly ? "bg-red-400 animate-pulse" : "bg-white/20"}`} />
              {liveCount > 0 ? `Live (${liveCount})` : "Live"}
            </button>

            {liveOnly && (
              <button
                onClick={() => setLiveOnly(false)}
                className="text-xs text-white/30 hover:text-white/60 transition-colors"
              >
                Show all
              </button>
            )}
          </div>

          {/* Cards */}
          <div className="pb-24">
            {isLoading ? (
              <div className="px-4 space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="glass rounded-2xl h-16 animate-pulse"
                    style={{ animationDelay: `${i * 80}ms` }} />
                ))}
              </div>
            ) : filteredGames.length === 0 ? (
              <div className="text-center py-16 text-white/20">
                <p className="text-5xl mb-4">{liveOnly ? "📡" : "🏟️"}</p>
                <p className="text-sm font-medium">
                  {liveOnly ? "No live matches right now" : "No matches found"}
                </p>
                <p className="text-xs mt-1 text-white/15">
                  {liveOnly ? "Check back soon" : "Try a different sport"}
                </p>
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
                    onPressGame={handleMatchPress}
                    onPressLeague={() => {
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