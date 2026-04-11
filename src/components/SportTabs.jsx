export default function SportTabs({ sports, active, onSelect }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 px-4 no-scrollbar">
      {sports.map((s, i) => {
        const isActive = active === s.id;
        return (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            style={{ animationDelay: `${i * 40}ms` }}
            className={`animate-card flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200
              ${isActive
                ? "bg-violet-600 text-white tab-active-glow scale-[1.02]"
                : "glass text-white/50 hover:text-white/80 hover:bg-white/8"
              }`}
          >
            <span className="text-sm">{s.icon}</span>
            {s.label}
          </button>
        );
      })}
    </div>
  );
}