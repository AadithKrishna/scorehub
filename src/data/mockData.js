export const SPORTS = [
  { id: "soccer",  label: "Football", icon: "⚽" },
  { id: "cricket", label: "Cricket",  icon: "🏏" },
  { id: "f1",      label: "F1",       icon: "🏎️" },
  { id: "motogp",  label: "MotoGP",   icon: "🏍️" },
];

export const MOTORSPORT_IDS = ["f1", "motogp"];

export const MOCK_GAMES = {
  soccer: [
    {
      id: "s1", status: "live", minute: "67'", league: "Premier League", leagueLogo: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
      homeTeam: { name: "Arsenal", shortName: "ARS", logo: "🔴" },
      awayTeam: { name: "Chelsea", shortName: "CHE", logo: "🔵" },
      homeScore: 2, awayScore: 1, events: [
        { type: "goal", minute: "23'", team: "home", player: "Saka" },
        { type: "goal", minute: "41'", team: "home", player: "Martinelli" },
        { type: "goal", minute: "55'", team: "away", player: "Palmer" },
      ],
    },
    {
      id: "s2", status: "live", minute: "34'", league: "La Liga", leagueLogo: "🇪🇸",
      homeTeam: { name: "Real Madrid", shortName: "RMA", logo: "⚪" },
      awayTeam: { name: "Barcelona", shortName: "BAR", logo: "🔵" },
      homeScore: 1, awayScore: 1, events: [],
    },
    {
      id: "s3", status: "finished", minute: "FT", league: "Serie A", leagueLogo: "🇮🇹",
      homeTeam: { name: "Inter Milan", shortName: "INT", logo: "🔵" },
      awayTeam: { name: "AC Milan", shortName: "MIL", logo: "🔴" },
      homeScore: 3, awayScore: 0, events: [],
    },
    {
      id: "s4", status: "scheduled", minute: "20:45", league: "Champions League", leagueLogo: "⭐",
      homeTeam: { name: "Bayern Munich", shortName: "BAY", logo: "🔴" },
      awayTeam: { name: "PSG", shortName: "PSG", logo: "🔵" },
      homeScore: null, awayScore: null, events: [],
    },
  ],
  basketball: [
    {
      id: "b1", status: "live", minute: "Q3 4:22", league: "NBA", leagueLogo: "🏀",
      homeTeam: { name: "LA Lakers", shortName: "LAL", logo: "🟡" },
      awayTeam: { name: "Boston Celtics", shortName: "BOS", logo: "🟢" },
      homeScore: 87, awayScore: 92, events: [],
    },
    {
      id: "b2", status: "finished", minute: "Final", league: "NBA", leagueLogo: "🏀",
      homeTeam: { name: "Golden State", shortName: "GSW", logo: "🔵" },
      awayTeam: { name: "Phoenix Suns", shortName: "PHX", logo: "🟣" },
      homeScore: 119, awayScore: 108, events: [],
    },
  ],
  nfl: [
    {
      id: "nfl1", status: "live", minute: "Q2 7:45", league: "NFL", leagueLogo: "🏈",
      homeTeam: { name: "Kansas City Chiefs", shortName: "KC", logo: "🔴" },
      awayTeam: { name: "San Francisco 49ers", shortName: "SF", logo: "🔴" },
      homeScore: 17, awayScore: 14, events: [],
    },
    {
      id: "nfl2", status: "scheduled", minute: "Sun 18:30", league: "NFL", leagueLogo: "🏈",
      homeTeam: { name: "Dallas Cowboys", shortName: "DAL", logo: "⭐" },
      awayTeam: { name: "New York Giants", shortName: "NYG", logo: "🔵" },
      homeScore: null, awayScore: null, events: [],
    },
  ],
  f1: [
    {
      id: "f1-1", type: "race", status: "live", minute: "Lap 42/58",
      league: "Formula 1", leagueLogo: "🏎️",
      event: "Bahrain Grand Prix",
      circuit: "Bahrain International Circuit",
      results: [
        { pos: 1, driver: "Max Verstappen",   team: "Red Bull",        gap: "Leader"  },
        { pos: 2, driver: "Charles Leclerc",  team: "Ferrari",         gap: "+4.2s"   },
        { pos: 3, driver: "Lewis Hamilton",   team: "Mercedes",        gap: "+11.8s"  },
        { pos: 4, driver: "Lando Norris",     team: "McLaren",         gap: "+19.4s"  },
        { pos: 5, driver: "Carlos Sainz",     team: "Ferrari",         gap: "+22.1s"  },
      ],
    },
    {
      id: "f1-2", type: "qualifying", status: "finished", minute: "Q3 Done",
      league: "Formula 1", leagueLogo: "🏎️",
      event: "Saudi Arabian GP — Qualifying",
      circuit: "Jeddah Corniche Circuit",
      results: [
        { pos: 1, driver: "Max Verstappen", team: "Red Bull",  gap: "1:28.014" },
        { pos: 2, driver: "Lando Norris",   team: "McLaren",   gap: "+0.082s"  },
        { pos: 3, driver: "Carlos Sainz",   team: "Ferrari",   gap: "+0.223s"  },
      ],
    },
  ],
  motogp: [
    {
      id: "mgp1", type: "race", status: "live", minute: "Lap 18/27",
      league: "MotoGP", leagueLogo: "🏍️",
      event: "Qatar Grand Prix",
      circuit: "Losail International Circuit",
      results: [
        { pos: 1, driver: "Francesco Bagnaia", team: "Ducati",         gap: "Leader" },
        { pos: 2, driver: "Jorge Martin",      team: "Pramac Ducati",  gap: "+1.8s"  },
        { pos: 3, driver: "Marc Marquez",      team: "Gresini Ducati", gap: "+3.2s"  },
        { pos: 4, driver: "Fabio Quartararo",  team: "Yamaha",         gap: "+7.5s"  },
      ],
    },
  ],
  baseball: [
    {
      id: "mlb1", status: "live", minute: "7th inning", league: "MLB", leagueLogo: "⚾",
      homeTeam: { name: "New York Yankees", shortName: "NYY", logo: "🔵" },
      awayTeam: { name: "LA Dodgers",       shortName: "LAD", logo: "🔵" },
      homeScore: 4, awayScore: 3, events: [],
    },
  ],
  hockey: [
    {
      id: "nhl1", status: "live", minute: "P2 11:03", league: "NHL", leagueLogo: "🏒",
      homeTeam: { name: "Toronto Maple Leafs",  shortName: "TOR", logo: "🔵" },
      awayTeam: { name: "Montreal Canadiens",   shortName: "MTL", logo: "🔴" },
      homeScore: 2, awayScore: 2, events: [],
    },
  ],
  tennis: [
    {
      id: "t1", status: "live", minute: "Set 2", league: "ATP Masters", leagueLogo: "🎾",
      homeTeam: { name: "Djokovic", shortName: "DJO", logo: "🇷🇸" },
      awayTeam: { name: "Alcaraz",  shortName: "ALC", logo: "🇪🇸" },
      homeScore: "6-4, 3", awayScore: "4-6, 5", events: [],
    },
  ],
  rugby: [
    {
      id: "rug1", status: "live", minute: "55'", league: "Six Nations", leagueLogo: "🏉",
      homeTeam: { name: "England", shortName: "ENG", logo: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
      awayTeam: { name: "France",  shortName: "FRA", logo: "🇫🇷" },
      homeScore: 17, awayScore: 21, events: [],
    },
  ],
  cricket: [
    {
      id: "cr1", status: "live", minute: "47th over", league: "IPL", leagueLogo: "🏏",
      homeTeam: { name: "Mumbai Indians",       shortName: "MI",  logo: "🔵" },
      awayTeam: { name: "Chennai Super Kings",  shortName: "CSK", logo: "🟡" },
      homeScore: "187/4", awayScore: "162/6", events: [],
    },
  ],
};