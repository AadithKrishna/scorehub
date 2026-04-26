import { Bell, Zap } from "lucide-react";

export default function Header({ onSearch, showSearch = true }) {
  return (
    <header className="flex items-center justify-between px-4 pt-10 pb-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-2xl bg-blue-500 flex items-center justify-center">
          <Zap size={17} className="text-white" fill="white" />
        </div>
        <div>
          <h1
            className="text-lg font-bold tracking-tight"
            style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#1c1c1e" }}
          >
            ScoreHub
          </h1>
          <p className="text-xs font-medium" style={{ color: "#8e8e93" }}>
            Live · All Sports
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {showSearch && (
          <button
            onClick={onSearch}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
            style={{ background: "rgba(0,0,0,0.06)" }}
          >
            <span style={{ fontSize: 15 }}>🔍</span>
          </button>
        )}
        <button
          className="w-9 h-9 rounded-full flex items-center justify-center relative transition-colors"
          style={{ background: "rgba(0,0,0,0.06)" }}
        >
          <Bell size={16} style={{ color: "#3a3a3c" }} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
      </div>
    </header>
  );
}