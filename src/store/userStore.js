import { create } from "zustand";

const useUserStore = create((set, get) => ({
  favorites: [],
  recentSearches: [],

  toggleFavorite: (teamId) => {
    const current = get().favorites;
    const updated = current.includes(teamId)
      ? current.filter((id) => id !== teamId)
      : [...current, teamId];
    set({ favorites: updated });
    localStorage.setItem("scorehub_favorites", JSON.stringify(updated));
  },

  isFavorite: (teamId) => get().favorites.includes(teamId),

  loadFavorites: () => {
    try {
      const saved = localStorage.getItem("scorehub_favorites");
      if (saved) set({ favorites: JSON.parse(saved) });
    } catch {}
  },

  addRecentSearch: (term) => {
    const current = get().recentSearches.filter((s) => s !== term);
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