export function trackEvent(eventName, params = {}) {
  if (typeof window.gtag !== "function") return;
  window.gtag("event", eventName, params);
}

export function trackSportView(sport) {
  trackEvent("sport_viewed", { sport });
}

export function trackMatchOpen(homeTeam, awayTeam, league) {
  trackEvent("match_opened", { home_team: homeTeam, away_team: awayTeam, league });
}

export function trackLeagueOpen(leagueName) {
  trackEvent("league_opened", { league: leagueName });
}

export function trackPlayerOpen(playerName, teamName) {
  trackEvent("player_opened", { player: playerName, team: teamName });
}

export function trackSearch(query) {
  trackEvent("search_performed", { query });
}

export function trackTabChange(tab, context) {
  trackEvent("tab_changed", { tab, context });
}