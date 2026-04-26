export default function BottomNav({ active, onSelect }) {
  const tabs = [
    { id: "favourites", icon: "⭐", label: "Favourites" },
    { id: "soccer",     icon: "⚽", label: "Football"  },
    { id: "cricket",    icon: "🏏", label: "Cricket"   },
    { id: "f1",         icon: "🏎️", label: "F1"        },
    { id: "motogp",     icon: "🏍️", label: "MotoGP"   },
  ];

  return (
    <nav className="bottom-nav">
      <div className="flex items-center justify-around px-1 py-2 max-w-xl mx-auto">
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelect(tab.id)}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-150"
              style={isActive ? { background: "rgba(0,122,255,0.1)" } : {}}
            >
              <span style={{
                fontSize: 20,
                lineHeight: 1,
                opacity: isActive ? 1 : 0.38,
                transform: isActive ? "scale(1.08)" : "scale(1)",
                transition: "all 0.15s ease",
              }}>
                {tab.icon}
              </span>
              <span style={{
                fontSize: 11,
                fontWeight: 600,
                color: isActive ? "var(--accent)" : "var(--text-3)",
                transition: "color 0.15s ease",
              }}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}