import { useQuery } from "@tanstack/react-query";
import { getLiveGames } from "../services/espnApi";
import { MOCK_GAMES, MOTOGP_CALENDAR } from "../data/mockData";

const LIVE_SPORTS = ["soccer", "cricket", "f1", "motogp"];

export function useGames(sport) {
  const isLive = LIVE_SPORTS.includes(sport);

  return useQuery({
    queryKey: ["games", sport],
    queryFn: async () => {
      if (!isLive) return MOCK_GAMES[sport] || [];

      try {
        const games = await getLiveGames(sport);
        // Fall back to mock calendar if real data fails
        if (!games.length && sport === "motogp") return MOTOGP_CALENDAR;
        return games.length > 0 ? games : (MOCK_GAMES[sport] || []);
      } catch {
        if (sport === "motogp") return MOTOGP_CALENDAR;
        return MOCK_GAMES[sport] || [];
      }
    },
    refetchInterval: isLive ? 60_000 : false,
    staleTime: 30_000,
  });
}