import { useState } from "react";
import { Menu } from "lucide-react";
import { Drawer } from "./Drawer";
import type { AppPage } from "../types";

interface HeaderProps {
  page: AppPage;
  setPage: (page: AppPage) => void;
  userName: string;
  onLogout: () => void;
}

export function Header({ page, setPage, userName, onLogout }: HeaderProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <header className="border-b border-[rgba(0,229,255,0.08)] px-4 py-4 flex items-center justify-between max-w-lg mx-auto">
        <div className="flex items-center gap-2">
          <img src="/icon.png" alt="FlowHeart" className="w-8 h-8 rounded-lg object-contain" />
          <div>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.1rem", fontWeight: 800, color: "#e8eaf0", lineHeight: 1 }}>
              FLOW<span className="text-[#ff3131]">HEART</span>
            </p>
            <p className="text-[#ffffff]" style={{ fontSize: "0.6rem", letterSpacing: "0.1em" }}>BIKE TRAINING TRACKER</p>
          </div>
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          className="text-[#7a8099] hover:text-[#e8eaf0] transition-colors p-2 rounded-lg hover:bg-[#1e2330]"
        >
          <Menu size={22} />
        </button>
      </header>

      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        page={page}
        setPage={setPage}
        userName={userName}
        onLogout={onLogout}
      />
    </>
  );
}