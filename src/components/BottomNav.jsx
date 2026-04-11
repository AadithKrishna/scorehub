export default function BottomNav({ active, onSelect }) {
  const tabs = [
    { id: "favourites", icon: "⭐", label: "Favourites" },
    { id: "soccer",     icon: "⚽", label: "Soccer"     },
    { id: "cricket",    icon: "🏏", label: "Cricket"    },
    { id: "f1",         icon: "🏎️", label: "F1"         },
    { id: "more",       icon: "⚡", label: "More"       },
  ];

  return (
    <nav className="bottom-nav">
      <div className="flex items-center justify-around px-2 py-2 max-w-xl mx-auto">
        {tabs.map((tab) => {
          const isActive = active === tab.id ||
            (tab.id === "more" && !tabs.find(t => t.id === active));
          return (
            <button
              key={tab.id}
              onClick={() => onSelect(tab.id === "more" ? "basketball" : tab.id)}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200"
            >
              <span className={`text-xl transition-all duration-200 ${
                isActive ? "scale-110" : "opacity-35"
              }`}>
                {tab.icon}
              </span>
              <span className={`text-xs font-semibold transition-all duration-200 ${
                isActive ? "text-violet-400" : "text-white/25"
              }`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-violet-400 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}