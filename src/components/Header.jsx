import { Bell, Zap } from "lucide-react";

export default function Header({ onSearch, showSearch = true }) {
  return (
    <header className="flex items-center justify-between px-4 pt-10 pb-4">
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-2xl flex items-center justify-center"
          style={{ background: "var(--accent)" }}
        >
          <Zap size={17} color="#fff" fill="#fff" />
        </div>
        <div>
          <h1
            className="text-lg font-bold tracking-tight"
            style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--text-1)" }}
          >
            ScoreHub
          </h1>
          <p className="text-xs font-medium" style={{ color: "var(--text-3)" }}>
            Live · All Sports
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {showSearch && (
          <button
            onClick={onSearch}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "var(--surface-2)" }}
          >
            <span style={{ fontSize: 15 }}>🔍</span>
          </button>
        )}
        <button
          className="w-9 h-9 rounded-full flex items-center justify-center relative"
          style={{ background: "var(--surface-2)" }}
        >
          <Bell size={16} style={{ color: "var(--text-2)" }} />
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
            style={{ background: "var(--live)" }}
          />
        </button>
      </div>
    </header>
  );
}