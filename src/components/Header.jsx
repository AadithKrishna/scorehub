import { Search, Bell, Zap } from "lucide-react";

export default function Header({ onSearch, showSearch = true }) {
  return (
    <header className="flex items-center justify-between px-4 pt-8 pb-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-2xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
          <Zap size={18} className="text-white" fill="white" />
        </div>
        <div>
          <h1 className="text-lg font-black text-white tracking-tight"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            ScoreHub
          </h1>
          <p className="text-xs text-white/30 font-medium">Live · All Sports</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {showSearch && (
  <button
    onClick={onSearch}
    className="w-9 h-9 glass-strong rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
  >
    <span className="text-white/60 text-sm">🔍</span>
  </button>
)}  
        <button className="glass w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-white/10 transition-all hover:scale-105 active:scale-95 relative">
          <Bell size={16} className="text-white/60" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-[#080810]" />
        </button>
      </div>
    </header>
  );
}