import { useQuery } from "@tanstack/react-query";
import { getLiveGames } from "../services/espnApi";
import { MOCK_GAMES } from "../data/mockData";

const LIVE_SPORTS = ["soccer", "cricket", "f1"];

export function useGames(sport) {
  const isLive = LIVE_SPORTS.includes(sport);

  return useQuery({
    queryKey: ["games", sport],
    queryFn: async () => {
      if (!isLive) {
        // Return mock data for sports not yet connected
        return MOCK_GAMES[sport] || [];
      }
      try {
        const games = await getLiveGames(sport);
        // Fall back to mock if ESPN returns nothing
        return games.length > 0 ? games : (MOCK_GAMES[sport] || []);
      } catch {
        return MOCK_GAMES[sport] || [];
      }
    },
    refetchInterval: isLive ? 60_000 : false,
    staleTime: 30_000,
  });
}