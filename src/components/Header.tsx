import type { AppPage } from "../types/index";

interface HeaderProps {
  page: AppPage;
  setPage: (page: AppPage) => void;
}

export function Header({ page, setPage }: HeaderProps) {
  const isHistory = page.tag === "history" || page.tag === "detail";

  return (
    <header className="border-b border-[rgba(0,229,255,0.08)] px-4 py-4 flex items-center justify-between max-w-lg mx-auto">
      <div className="flex items-center gap-2">
        <img src="/icon.png" alt="FlowHeart" className="w-10 h-10 rounded-lg object-contain" />
        <div>
          <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.5rem", fontWeight: 800, color: "#e8eaf0", lineHeight: 1 }}>
            FLOW<span className="text-[#ff3131]">HEART</span>
          </p>
          <p className="font-bold" style={{ fontSize: "0.6rem", letterSpacing: "0.1em" }}>BIKE TRAINING TRACKER</p>
        </div>
      </div>
      <nav className="flex gap-1">
        <button
          onClick={() => setPage({ tag: "home" })}
          className={`px-3 py-1.5 rounded-lg text-sm transition-all ${page.tag === "home" ? "bg-[#1e2330] text-[#00e5ff]" : "text-[#7a8099] hover:text-[#e8eaf0]"}`}
        >
          Início
        </button>
        <button
          onClick={() => setPage({ tag: "history" })}
          className={`px-3 py-1.5 rounded-lg text-sm transition-all ${isHistory ? "bg-[#1e2330] text-[#00e5ff]" : "text-[#7a8099] hover:text-[#e8eaf0]"}`}
        >
          Histórico
        </button>
      </nav>
    </header>
  );
}