import { create } from "zustand";

const useUserStore = create((set, get) => ({
  // favorites is now array of { id, name, logo, league, leagueId }
  favorites: [],
  recentSearches: [],

  addFavorite: (team) => {
    const current = get().favorites;
    if (current.find(t => t.id === team.id)) return;
    const updated = [...current, team];
    set({ favorites: updated });
    localStorage.setItem("scorehub_favorites", JSON.stringify(updated));
  },

  removeFavorite: (teamId) => {
    const updated = get().favorites.filter(t => t.id !== teamId);
    set({ favorites: updated });
    localStorage.setItem("scorehub_favorites", JSON.stringify(updated));
  },

  toggleFavoriteTeam: (team) => {
    const current = get().favorites;
    const exists = current.find(t => t.id === team.id || t.name === team.name);
    if (exists) {
      const updated = current.filter(t => t.id !== team.id && t.name !== team.name);
      set({ favorites: updated });
      localStorage.setItem("scorehub_favorites", JSON.stringify(updated));
    } else {
      const updated = [...current, team];
      set({ favorites: updated });
      localStorage.setItem("scorehub_favorites", JSON.stringify(updated));
    }
  },

  isFavorite: (teamId) => {
    return get().favorites.some(t => t.id === teamId || t.name === teamId);
  },

  loadFavorites: () => {
    try {
      const saved = localStorage.getItem("scorehub_favorites");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Handle old format (array of strings)
        if (parsed.length > 0 && typeof parsed[0] === "string") {
          const migrated = parsed.map(name => ({ id: name, name, logo: null, league: "" }));
          set({ favorites: migrated });
          localStorage.setItem("scorehub_favorites", JSON.stringify(migrated));
        } else {
          set({ favorites: parsed });
        }
      }
    } catch {}
  },

  addRecentSearch: (term) => {
    const current = get().recentSearches.filter(s => s !== term);
    const updated = [term, ...current].slice(0, 8);
    set({ recentSearches: updated });
    localStorage.setItem("scorehub_searches", JSON.stringify(updated));
  },

  loadRecentSearches: () => {
    try {
      const saved = localStorage.getItem("scorehub_searches");
      if (saved) set({ recentSearches: JSON.parse(saved) });
    } catch {}
  },

  clearRecentSearches: () => {
    set({ recentSearches: [] });
    localStorage.removeItem("scorehub_searches");
  },
}));

export default useUserStore;